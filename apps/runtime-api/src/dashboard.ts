import type {
  DashboardData,
  DashboardEvent,
  DashboardJob,
  ModelsSummary,
  NetworkSummary,
  PortfolioSummary,
  ProtocolSummary,
  ResearchSummary,
  RuntimeJob,
  RuntimeMeshSummary,
  RuntimeWorkspaceSummary,
} from "@mesh/contracts";

export function buildDashboardData(input: {
  mesh: RuntimeMeshSummary;
  jobs: RuntimeJob[];
  protocol: ProtocolSummary;
  models: ModelsSummary;
  portfolio: PortfolioSummary;
}): DashboardData {
  const jobs = buildDashboardJobs(input.jobs);

  return {
    jobs,
    research: buildResearchSummary(input.mesh, jobs),
    network: buildNetworkSummary(input.mesh),
    protocol: input.protocol,
    models: input.models,
    portfolio: input.portfolio,
  };
}

export function buildDashboardEvents(mesh: RuntimeMeshSummary, jobs: RuntimeJob[]): DashboardEvent[] {
  const events: DashboardEvent[] = [];
  const generatedAt = Date.parse(mesh.generatedAt);

  for (const job of jobs.slice(0, 6)) {
    events.push({
      id: `job-${job.id}`,
      timestamp: Date.parse(job.updatedAt),
      type: job.status === "failed" ? "WARN" : "JOB",
      message: describeRuntimeJob(job),
    });
  }

  for (const workspace of mesh.workspaces.slice(0, 8)) {
    const workspaceEvents = buildWorkspaceEvents(workspace, generatedAt);
    events.push(...workspaceEvents);
  }

  if (mesh.controller?.reachable) {
    events.push({
      id: `controller-${mesh.generatedAt}`,
      timestamp: generatedAt,
      type: "SYS",
      message: `Runtime mesh refreshed with ${mesh.totals.results} results across ${mesh.totals.workspaces} workspaces`,
    });
  }

  if (mesh.missing.length > 0) {
    events.push({
      id: `missing-${mesh.generatedAt}`,
      timestamp: generatedAt,
      type: "WARN",
      message: mesh.missing.join(" | "),
    });
  }

  return dedupeAndSortEvents(events).slice(0, 24);
}

function buildDashboardJobs(runtimeJobs: RuntimeJob[]): DashboardJob[] {
  return [...runtimeJobs]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((job) => {
      const total = job.progress.total ?? null;
      const completed = Math.max(0, job.progress.completed);
      const progress = total && total > 0
        ? Math.min(100, Math.round((completed / total) * 100))
        : job.status === "complete" || job.status === "stopped" || job.status === "failed"
          ? 100
          : 0;

      return {
        id: job.id,
        topic: job.topic,
        status: mapDashboardJobStatus(job.status),
        progress,
        metric: job.bestMetric ?? 0,
        metricLabel: "bpb",
        findings: 0,
        startedAt: Date.parse(job.createdAt),
      };
    });
}

function buildResearchSummary(mesh: RuntimeMeshSummary, jobs: DashboardJob[]): ResearchSummary {
  const runningJobs = jobs.filter((job) => job.status === "running").length;
  const queuedJobs = jobs.filter((job) => job.status === "queued").length;
  const completedJobs = jobs.filter((job) => job.status === "complete").length;
  const totalResults = Math.max(mesh.totals.results, 0);
  const hitRate = totalResults > 0
    ? Math.round((mesh.totals.keepCount / totalResults) * 100)
    : 0;

  return {
    runningJobs,
    queuedJobs,
    completedJobs,
    totalFindings: mesh.totals.keepCount,
    hitRate,
    bestMetric: mesh.totals.bestMetric != null
      ? `${mesh.totals.bestMetric.toFixed(3)} bpb`
      : "—",
  };
}

function buildNetworkSummary(mesh: RuntimeMeshSummary): NetworkSummary {
  const totalNodes = mesh.workspaces.length;
  const activeWorkers = mesh.workspaces.filter((workspace) => workspace.status === "running").length;
  const idleWorkers = Math.max(0, totalNodes - activeWorkers);
  const gpuCount = mesh.workspaces.reduce((sum, workspace) => sum + workspace.gpu, 0);
  const memTotalGb = mesh.workspaces.reduce((sum, workspace) => sum + workspace.memGb, 0);
  const memUsedGb = Math.round(
    mesh.workspaces.reduce((sum, workspace) => sum + workspace.memGb * workspaceMemoryUsageFactor(workspace), 0),
  );
  const vramTotalGb = mesh.workspaces.reduce((sum, workspace) => sum + inferWorkspaceVramGb(workspace), 0);
  const vramUsedGb = Math.round(
    mesh.workspaces.reduce((sum, workspace) => sum + inferWorkspaceVramGb(workspace) * workspaceVramUsageFactor(workspace), 0),
  );

  return {
    nodes: totalNodes,
    gpuCount,
    activeWorkers,
    idleWorkers,
    cpuUsage: totalNodes > 0 ? Math.round((activeWorkers / totalNodes) * 100) : 0,
    memUsedGb,
    memTotalGb,
    vramUsedGb,
    vramTotalGb,
  };
}

function buildWorkspaceEvents(workspace: RuntimeWorkspaceSummary, fallbackTimestamp: number): DashboardEvent[] {
  const events: DashboardEvent[] = [];
  const workspaceTimestamp = workspace.lastRunAt ? Date.parse(workspace.lastRunAt) : fallbackTimestamp;

  if (workspace.status === "running") {
    events.push({
      id: `net-running-${workspace.workerId}`,
      timestamp: workspaceTimestamp,
      type: "NET",
      message: `${workspace.region} ${workspace.gpuLabel} is training on ${workspace.workerId}`,
    });
  }

  if (workspace.lastResultStatus) {
    const metricLabel = workspace.lastMetric != null ? ` (${workspace.lastMetric.toFixed(3)} bpb)` : "";
    events.push({
      id: `exp-${workspace.workerId}-${workspace.resultsCount}`,
      timestamp: workspaceTimestamp,
      type: "EXP",
      message: `${workspace.workerId} ${workspace.lastResultStatus}${metricLabel}`,
    });
  }

  if (workspace.blockers.length > 0) {
    events.push({
      id: `warn-${workspace.workerId}`,
      timestamp: workspaceTimestamp,
      type: "WARN",
      message: `${workspace.workerId} blocked: ${workspace.blockers.join(" | ")}`,
    });
  }

  return events;
}

function describeRuntimeJob(job: RuntimeJob): string {
  if (job.status === "queued") {
    return `${job.topic} queued for runtime execution`;
  }
  if (job.status === "paused") {
    return `${job.topic} paused`;
  }
  if (job.status === "complete") {
    return `${job.topic} completed`;
  }
  if (job.status === "stopped") {
    return `${job.topic} stopped`;
  }
  if (job.status === "failed") {
    return `${job.topic} failed`;
  }
  return `${job.topic} running`;
}

function dedupeAndSortEvents(events: DashboardEvent[]): DashboardEvent[] {
  const seen = new Set<string>();
  return [...events]
    .sort((left, right) => right.timestamp - left.timestamp)
    .filter((event) => {
      if (seen.has(event.id)) {
        return false;
      }
      seen.add(event.id);
      return true;
    });
}

function mapDashboardJobStatus(status: RuntimeJob["status"]): DashboardJob["status"] {
  if (status === "queued") {
    return "queued";
  }
  if (status === "complete" || status === "stopped" || status === "failed") {
    return "complete";
  }
  return "running";
}

function workspaceMemoryUsageFactor(workspace: RuntimeWorkspaceSummary): number {
  if (workspace.status === "running") {
    return 0.72;
  }
  if (workspace.resultsCount > 0) {
    return 0.38;
  }
  if (workspace.status === "blocked") {
    return 0.24;
  }
  return 0.16;
}

function workspaceVramUsageFactor(workspace: RuntimeWorkspaceSummary): number {
  if (workspace.status === "running") {
    return 0.78;
  }
  if (workspace.resultsCount > 0) {
    return 0.41;
  }
  if (workspace.status === "blocked") {
    return 0.18;
  }
  return 0.08;
}

function inferWorkspaceVramGb(workspace: RuntimeWorkspaceSummary): number {
  const label = workspace.gpuLabel.toLowerCase();

  if (label.includes("h100")) {
    return 80 * workspace.gpu;
  }
  if (label.includes("a100")) {
    return 40 * workspace.gpu;
  }
  if (label.includes("4090")) {
    return 24 * workspace.gpu;
  }
  if (label.includes("4080")) {
    return 16 * workspace.gpu;
  }
  if (label.includes("3090")) {
    return 24 * workspace.gpu;
  }

  return 16 * workspace.gpu;
}
