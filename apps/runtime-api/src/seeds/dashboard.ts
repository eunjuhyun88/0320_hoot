import type {
  DashboardData,
  DashboardEvent,
} from "../../../../packages/contracts/src/index.ts";

export function seedDashboardSummary(): DashboardData {
  return {
    jobs: [
      {
        id: "job-2891",
        topic: "DeFi Risk Scoring",
        status: "running",
        progress: 50,
        metric: 0.891,
        metricLabel: "bpb",
        findings: 2,
        startedAt: Date.now() - 15 * 60_000,
      },
      {
        id: "job-2887",
        topic: "Crypto 24h Prediction",
        status: "complete",
        progress: 100,
        metric: 0.931,
        metricLabel: "bpb",
        findings: 3,
        startedAt: Date.now() - 60 * 60_000,
      },
    ],
    research: {
      runningJobs: 2,
      queuedJobs: 3,
      completedJobs: 47,
      totalFindings: 189,
      hitRate: 0.38,
      bestMetric: "1.231 bpb",
    },
    network: {
      nodes: 6,
      gpuCount: 14,
      activeWorkers: 5,
      idleWorkers: 1,
      cpuUsage: 0.62,
      memUsedGb: 48,
      memTotalGb: 128,
      vramUsedGb: 72,
      vramTotalGb: 112,
    },
    protocol: {
      tvl: "247,800 HOOT",
      burned: "12,340 HOOT",
      bonds: "62,000 HOOT",
      trustScore: 847,
      mauPercent: 72,
    },
    models: {
      count: 5,
      topMetric: "0.931",
      models: [
        { name: "DeFi Risk Scoring v1", metric: "0.931", type: "Classification", downloads: 3240 },
        { name: "NLP Sentiment v1", metric: "0.922", type: "NLP", downloads: 0 },
        { name: "Crypto 24h v3", metric: "0.891", type: "Regression", downloads: 12480 },
      ],
    },
    portfolio: {
      bondCount: 2,
      totalStaked: "12,000 HOOT",
      modelCount: 5,
      bonds: [
        { name: "seoul-4090", tier: "Standard", amount: "2,000" },
        { name: "berlin-a100", tier: "Enterprise", amount: "10,000" },
      ],
    },
  };
}

export function seedDashboardEvents(): DashboardEvent[] {
  const now = Date.now();
  return [
    { id: "evt-001", timestamp: now - 15_000, type: "JOB", message: "Job #2891 started experiment 4/8" },
    { id: "evt-002", timestamp: now - 45_000, type: "EXP", message: "Experiment exp-441 kept (0.891 bpb)" },
    { id: "evt-003", timestamp: now - 120_000, type: "NET", message: "Node seoul-4090 GPU utilization 94%" },
    { id: "evt-004", timestamp: now - 300_000, type: "SYS", message: "Runtime mesh refresh complete" },
    { id: "evt-005", timestamp: now - 600_000, type: "WARN", message: "Node berlin-a100 entering unbonding period" },
    { id: "evt-006", timestamp: now - 900_000, type: "JOB", message: "Job #2887 completed all experiments" },
    { id: "evt-007", timestamp: now - 1800_000, type: "EXP", message: "Experiment exp-439 discarded (1.445 bpb)" },
    { id: "evt-008", timestamp: now - 3600_000, type: "NET", message: "New node tokyo-4090 joined network" },
  ];
}
