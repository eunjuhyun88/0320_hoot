/**
 * Reward domain types — extracted from rewardStore.ts
 *
 * Shared between frontend stores and backend API.
 */

export type RewardPool = 'A' | 'B';

export type RewardSource =
  | 'pool_b_compute'
  | 'pool_a_creator'
  | 'pool_a_notary'
  | 'pool_a_treasury'
  | 'pool_a_burn'
  | 'challenge_reward'
  | 'ppap_fee';

export interface RewardEntry {
  id: string;
  timestamp: string;
  source: RewardSource;
  amount: number;
  pool: RewardPool;
  jobId?: string;
  modelId?: string;
  nodeId?: string;
  description: string;
}

export interface RewardSummary {
  total: number;
  today: number;
  sevenDay: number;
  poolB: number;
  poolA: number;
  challenge: number;
  poolBPct: number;
  poolAPct: number;
  challengePct: number;
}
