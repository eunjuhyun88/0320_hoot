import type {
  BondTier,
  ActiveBond,
  BurnConversion,
  PpapStage,
  FlowNode,
  ProtocolEvent,
  JourneyActor,
} from "../../../../packages/contracts/src/index.ts";

export function seedBondTiers(): BondTier[] {
  return [
    { name: "Lite", tier: 1, bondNum: 500, bond: "500", gpu: "1 GPU", jobs: "5 concurrent", accent: "var(--blue)" },
    { name: "Standard", tier: 2, bondNum: 2000, bond: "2,000", gpu: "4 GPUs", jobs: "20 concurrent", accent: "var(--accent)" },
    { name: "Enterprise", tier: 3, bondNum: 10000, bond: "10,000", gpu: "Unlimited", jobs: "Unlimited", accent: "var(--gold)" },
  ];
}

export function seedActiveBonds(): ActiveBond[] {
  return [
    { nodeId: "seoul-4090", tier: "Standard", amount: "2,000", status: "active", unbondingDays: null },
    { nodeId: "berlin-a100", tier: "Enterprise", amount: "10,000", status: "unbonding", unbondingDays: 4 },
  ];
}

export function seedBurnConversions(): BurnConversion[] {
  return [
    { amount: "2,500", credit: "$140.00", tier: "Pro", time: "2h ago" },
    { amount: "500", credit: "$25.00", tier: "Basic", time: "1d ago" },
    { amount: "10,000", credit: "$600.00", tier: "Ultra", time: "3d ago" },
  ];
}

export function seedPpapStages(): PpapStage[] {
  return [
    { id: "submit", label: "Submit", sub: "Contributor uploads data", icon: "\u{1F4E4}", color: "var(--blue)" },
    { id: "batch", label: "Batch", sub: "Aggregated into batch", icon: "\u{1F4E6}", color: "var(--accent)" },
    { id: "challenge", label: "Challenge", sub: "24h verification window", icon: "\u23F1", color: "var(--gold)" },
    { id: "confirmed", label: "Confirmed", sub: "PPAP immutable on-chain", icon: "\u2713", color: "var(--green)" },
  ];
}

export function seedFlowNodes(): FlowNode[] {
  return [
    { id: "poolA", label: "Pool A", amount: "42%", angle: -45, color: "var(--accent)", breakdown: "Creator 60% / Notary 15% / Treasury 15% / Burn 10%" },
    { id: "poolB", label: "Pool B", amount: "38%", angle: 45, color: "var(--green)", breakdown: "GPU Compute 95% / Treasury 5%" },
    { id: "burn", label: "Burn", amount: "12%", angle: 135, color: "var(--red)", breakdown: "Permanently removed from supply" },
    { id: "treasury", label: "Treasury", amount: "8%", angle: 225, color: "var(--gold)", breakdown: "Protocol reserve & insurance" },
  ];
}

export function seedProtocolEvents(): ProtocolEvent[] {
  return [
    { text: "Node seoul-4090 bonded 2,000 HOOT \u2192 Tier 2", color: "var(--blue)", time: "2m ago", fn: "registerNode" },
    { text: "Job job-0042 created \u2192 150 HOOT escrowed", color: "var(--green)", time: "5m ago", fn: "createJob" },
    { text: "VTR registered for exp-441 \u2192 1.0 HOOT burned", color: "var(--red)", time: "8m ago", fn: "registerVTR" },
    { text: "Batch #2891 submitted \u2192 3.0 HOOT fee", color: "var(--gold)", time: "12m ago", fn: "submitBatch" },
    { text: "1,000 HOOT burned \u2192 $50 credit (Pro tier)", color: "var(--red)", time: "15m ago", fn: "burnToCredit" },
    { text: "Pool A settled \u2192 450 HOOT distributed", color: "var(--accent)", time: "18m ago", fn: "settlePool" },
    { text: "Challenge resolved \u2192 valid, 50 HOOT reward", color: "var(--green)", time: "22m ago", fn: "resolveChallenge" },
    { text: "Node us-a100 unbonded 10,000 HOOT", color: "var(--blue)", time: "25m ago", fn: "unbondNode" },
  ];
}

export function seedJourneyActors(): JourneyActor[] {
  return [
    { role: "Contributor", desc: "Provides data & annotations", icon: "\u{1F4CA}", color: "var(--accent)", actions: ["Upload datasets", "Earn Pool A rewards", "Build PPAP provenance"] },
    { role: "Verifier", desc: "Validates data integrity", icon: "\u{1F50D}", color: "var(--blue)", actions: ["Challenge batches", "Earn notary fees", "Maintain trust score"] },
    { role: "Compute", desc: "GPU nodes run experiments", icon: "\u26A1", color: "var(--green)", actions: ["Bond HOOT as stake", "Execute research jobs", "Earn Pool B rewards"] },
    { role: "Builder", desc: "Researchers & model creators", icon: "\u{1F9EA}", color: "var(--gold)", actions: ["Define ontologies", "Launch Magnet jobs", "Publish VTR results"] },
    { role: "Buyer", desc: "Consumes model outputs", icon: "\u{1F511}", color: "var(--red)", actions: ["Purchase model access", "Burn HOOT for credits", "Deploy agent bundles"] },
  ];
}

export const SIMULATED_BALANCE = 12_450;
export const MAU_TARGET = 1443;
export const TRUST_SCORE_TARGET = 847;
