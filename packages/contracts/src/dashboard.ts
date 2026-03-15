/**
 * Dashboard domain types — extracted from services/types.ts
 *
 * Shared between frontend service layer and backend API.
 */

export interface ResearchSummary {
  runningJobs: number;
  queuedJobs: number;
  completedJobs: number;
  totalFindings: number;
  hitRate: number;
  bestMetric: string;
}

export interface NetworkSummary {
  nodes: number;
  gpuCount: number;
  activeWorkers: number;
  idleWorkers: number;
  cpuUsage: number;
  memUsedGb: number;
  memTotalGb: number;
  vramUsedGb: number;
  vramTotalGb: number;
}

export interface ProtocolSummary {
  tvl: string;
  burned: string;
  bonds: string;
  trustScore: number;
  mauPercent: number;
}

export interface ModelSummaryItem {
  name: string;
  metric: string;
  type: string;
  downloads: number;
}

export interface ModelsSummary {
  count: number;
  topMetric: string;
  models: ModelSummaryItem[];
}

export interface BondItem {
  name: string;
  tier: string;
  amount: string;
}

export interface PortfolioSummary {
  bondCount: number;
  totalStaked: string;
  modelCount: number;
  bonds: BondItem[];
}

export interface DashboardJob {
  id: string;
  topic: string;
  status: "running" | "complete" | "queued";
  progress: number;
  metric: number;
  metricLabel: string;
  findings: number;
  startedAt: number;
}

export interface DashboardEvent {
  id: string;
  timestamp: number;
  type: 'SYS' | 'NET' | 'JOB' | 'EXP' | 'WARN';
  message: string;
}

export interface DashboardData {
  jobs: DashboardJob[];
  research: ResearchSummary;
  network: NetworkSummary;
  protocol: ProtocolSummary;
  models: ModelsSummary;
  portfolio: PortfolioSummary;
}
