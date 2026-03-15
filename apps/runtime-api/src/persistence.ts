import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

import type {
  RuntimeEvent,
  RuntimeJob,
  RuntimeMeshSummary,
} from "@mesh/contracts";
import { hydrateRuntimeState, type RuntimeState } from "@mesh/domain";

export type RuntimePersistence = {
  dbPath: string;
  loadState: () => RuntimeState;
  appendEvent: (event: RuntimeEvent) => void;
  upsertMeshSnapshot: (runtimeRoot: string, mesh: RuntimeMeshSummary) => void;
  loadMeshSnapshot: (runtimeRoot: string) => RuntimeMeshSummary | null;
  listRuntimeRoots: () => string[];
};

type EventRow = {
  event_payload: string;
};

type JsonJobRow = {
  job_json: string;
};

type MeshRow = {
  mesh_payload: string;
};

type FlatJobRow = {
  id: string;
  topic: string;
  surface: RuntimeJob["surface"];
  status: RuntimeJob["status"];
  source: RuntimeJob["source"];
  created_at: string;
  updated_at: string;
  last_command_at: string | null;
  progress_completed: number;
  progress_total: number | null;
  best_metric: number | null;
  boosted_categories: string;
  paused_categories: string;
};

export function createRuntimePersistence(projectRoot: string, explicitDbPath?: string): RuntimePersistence {
  const dbPath = explicitDbPath?.trim()
    ? resolve(projectRoot, explicitDbPath)
    : resolve(projectRoot, ".agent-context/runtime-api/runtime-state.sqlite");

  mkdirSync(dirname(dbPath), { recursive: true });

  const database = new DatabaseSync(dbPath);
  database.exec(`
    CREATE TABLE IF NOT EXISTS runtime_jobs (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      job_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS runtime_events (
      seq INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT,
      type TEXT NOT NULL,
      ts TEXT NOT NULL,
      event_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS runtime_mesh_snapshots (
      runtime_root TEXT PRIMARY KEY,
      generated_at TEXT NOT NULL,
      mesh_json TEXT NOT NULL
    );
  `);

  const eventColumns = readTableColumns(database, "runtime_events");
  const jobColumns = readTableColumns(database, "runtime_jobs");
  const meshColumns = readTableColumns(database, "runtime_mesh_snapshots");

  const eventTypeColumn = eventColumns.has("type") ? "type" : "event_type";
  const eventPayloadColumn = eventColumns.has("event_json") ? "event_json" : "payload";
  const meshPayloadColumn = meshColumns.has("mesh_json") ? "mesh_json" : "payload";
  const jobUsesJsonColumn = jobColumns.has("job_json");

  const insertEvent = database.prepare(
    `INSERT INTO runtime_events (job_id, ${eventTypeColumn}, ts, ${eventPayloadColumn}) VALUES (?, ?, ?, ?)`,
  );
  const upsertJob = jobUsesJsonColumn
    ? database.prepare(`
      INSERT INTO runtime_jobs (id, created_at, updated_at, job_json)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        job_json = excluded.job_json
    `)
    : database.prepare(`
      INSERT INTO runtime_jobs (
        id,
        topic,
        surface,
        status,
        source,
        created_at,
        updated_at,
        last_command_at,
        progress_completed,
        progress_total,
        best_metric,
        boosted_categories,
        paused_categories
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        topic = excluded.topic,
        surface = excluded.surface,
        status = excluded.status,
        source = excluded.source,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        last_command_at = excluded.last_command_at,
        progress_completed = excluded.progress_completed,
        progress_total = excluded.progress_total,
        best_metric = excluded.best_metric,
        boosted_categories = excluded.boosted_categories,
        paused_categories = excluded.paused_categories
    `);
  const upsertMesh = database.prepare(`
    INSERT INTO runtime_mesh_snapshots (runtime_root, generated_at, ${meshPayloadColumn})
    VALUES (?, ?, ?)
    ON CONFLICT(runtime_root) DO UPDATE SET
      generated_at = excluded.generated_at,
      ${meshPayloadColumn} = excluded.${meshPayloadColumn}
  `);
  const selectJobs = jobUsesJsonColumn
    ? database.prepare(`SELECT job_json FROM runtime_jobs ORDER BY updated_at DESC, created_at DESC`)
    : database.prepare(`
      SELECT
        id,
        topic,
        surface,
        status,
        source,
        created_at,
        updated_at,
        last_command_at,
        progress_completed,
        progress_total,
        best_metric,
        boosted_categories,
        paused_categories
      FROM runtime_jobs
      ORDER BY updated_at DESC, created_at DESC
    `);
  const selectEvents = database.prepare(`SELECT ${eventPayloadColumn} AS event_payload FROM runtime_events ORDER BY seq ASC`);
  const selectMesh = database.prepare(`SELECT ${meshPayloadColumn} AS mesh_payload FROM runtime_mesh_snapshots WHERE runtime_root = ?`);
  const listRoots = database.prepare(`SELECT runtime_root FROM runtime_mesh_snapshots ORDER BY runtime_root ASC`);

  return {
    dbPath,
    loadState() {
      void database;
      const jobs = selectJobs.all() as Array<JsonJobRow | FlatJobRow>;
      const events = selectEvents.all() as EventRow[];
      return hydrateRuntimeState(
        jobs.map((row) => hydrateJobRow(row)),
        events.map((row) => JSON.parse(row.event_payload) as RuntimeEvent),
      );
    },
    appendEvent(event) {
      void database;
      const jobId = event.type === "job.command.accepted" ? event.jobId : event.type === "runtime.snapshot" ? null : event.job.id;
      insertEvent.run(jobId, event.type, event.ts, JSON.stringify(event));

      if (event.type === "job.created" || event.type === "job.updated") {
        upsertJobRecord(upsertJob, event.job, jobUsesJsonColumn);
      }
    },
    upsertMeshSnapshot(runtimeRoot, mesh) {
      void database;
      upsertMesh.run(runtimeRoot, mesh.generatedAt, JSON.stringify(mesh));
    },
    loadMeshSnapshot(runtimeRoot) {
      void database;
      const row = selectMesh.get(runtimeRoot) as MeshRow | undefined;
      return row ? (JSON.parse(row.mesh_payload) as RuntimeMeshSummary) : null;
    },
    listRuntimeRoots() {
      void database;
      return (listRoots.all() as Array<{ runtime_root: string }>).map((row) => row.runtime_root);
    },
  };
}

function upsertJobRecord(
  statement: ReturnType<DatabaseSync["prepare"]>,
  job: RuntimeJob,
  usesJsonColumn: boolean,
) {
  if (usesJsonColumn) {
    statement.run(job.id, job.createdAt, job.updatedAt, JSON.stringify(job));
    return;
  }

  statement.run(
    job.id,
    job.topic,
    job.surface,
    job.status,
    job.source,
    job.createdAt,
    job.updatedAt,
    job.lastCommandAt,
    job.progress.completed,
    job.progress.total,
    job.bestMetric,
    JSON.stringify(job.boostedCategories),
    JSON.stringify(job.pausedCategories),
  );
}

function readTableColumns(database: DatabaseSync, tableName: string): Set<string> {
  const rows = database.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  return new Set(rows.map((row) => row.name));
}

function hydrateJobRow(row: JsonJobRow | FlatJobRow): RuntimeJob {
  if ("job_json" in row) {
    return JSON.parse(row.job_json) as RuntimeJob;
  }

  return {
    id: row.id,
    topic: row.topic,
    surface: row.surface,
    status: row.status,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastCommandAt: row.last_command_at,
    progress: {
      completed: row.progress_completed,
      total: row.progress_total,
    },
    bestMetric: row.best_metric,
    boostedCategories: parseJsonArray(row.boosted_categories),
    pausedCategories: parseJsonArray(row.paused_categories),
  };
}

function parseJsonArray(input: string): string[] {
  try {
    const parsed = JSON.parse(input) as unknown;
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}
