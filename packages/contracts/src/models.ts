/**
 * Model domain types — extracted from modelRegistryStore.ts
 *
 * Shared between frontend stores and backend API.
 */

export type ModelState =
  | 'DRAFT'
  | 'MINTED'
  | 'PRIVATE_ACTIVE'
  | 'NETWORK_ACTIVE'
  | 'DEPRECATED';

export type VTRGrade = 'DETERMINISTIC' | 'SELF_ATTESTED';

export interface VTRRecord {
  grade: VTRGrade;
  trainingSeed?: number;
  baseModelId: string;
  ckptHash: string;
  ppapRootRef: string;
}

export interface ModelMetrics {
  best: number;
  experiments: number;
  kept: number;
}

export interface ModelUsage {
  totalCalls: number;
  totalRevenue: number;
  dailyCalls: number[];
}

export interface PoolADistribution {
  creator: number;
  notary: number;
  treasury: number;
  burn: number;
}

export interface ModelRecord {
  id: string;
  slug: string;
  name: string;
  state: ModelState;
  originJobId: string;
  vtr: VTRRecord;
  metrics: ModelMetrics;
  usage: ModelUsage;
  poolA: PoolADistribution;
  createdAt: string;
  updatedAt: string;
}
