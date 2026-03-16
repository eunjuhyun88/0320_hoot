/**
 * dockSuggestions.ts — Context-aware suggestion chips for universal dock
 *
 * Three modes: ask (chat), research (autoresearch launcher), inference (model execution)
 * Chips change based on mode + research lifecycle phase.
 */

export interface SuggestionChip {
  label: string;
  presetId?: string;
  action?: string;
  modelId?: string;
  variant?: 'default' | 'primary' | 'danger';
}

// ── ASK mode (chat / Q&A) ──
export const ASK_CHIPS: SuggestionChip[] = [
  { label: 'What can I do here?', action: 'ask:capabilities' },
  { label: 'Show my models', action: 'ask:myModels' },
  { label: 'Network status', action: 'ask:networkStatus' },
  { label: 'How does HOOT work?', action: 'ask:howHoot' },
];

// ── RESEARCH mode (autoresearch launcher) ──
export const IDLE_CHIPS: SuggestionChip[] = [
  { label: 'Crypto Prediction', presetId: 'crypto_market' },
  { label: 'DeFi Risk', presetId: 'defi_risk' },
  { label: 'Fraud Detection', presetId: 'fraud_detection' },
  { label: 'Time Series', presetId: 'time_series' },
];

export const RUNNING_CHIPS: SuggestionChip[] = [
  { label: 'View Progress →', action: 'viewRunning' },
  { label: 'Stop', action: 'stop', variant: 'danger' },
];

export const COMPLETE_CHIPS: SuggestionChip[] = [
  { label: 'View Results →', action: 'viewResults' },
  { label: 'Improve', action: 'improve' },
  { label: 'Retry', action: 'retry' },
  { label: 'Deploy', action: 'deploy', variant: 'primary' },
];

// ── INFERENCE mode (model execution) ──
export const INFERENCE_CHIPS: SuggestionChip[] = [
  { label: 'Crypto 24h v3', modelId: 'model-crypto-24h-v3' },
  { label: 'DeFi Risk v1', modelId: 'model-defi-risk-v1' },
  { label: 'ETH Gas v2', modelId: 'model-eth-gas-v2' },
  { label: 'NLP Sentiment v1', modelId: 'model-nlp-sentiment-v1' },
];
