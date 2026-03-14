<script lang="ts">
  import { jobStore, completedCount, keepCount, discardCount } from './jobStore.ts';
  import ResearchPipeline from './ResearchPipeline.svelte';

  export let onNewResearch: () => void = () => {};
  export let onViewDetails: () => void = () => {};

  $: job = $jobStore;
  $: completed = $completedCount;
  $: keeps = $keepCount;
  $: discards = $discardCount;
  $: bestMetric = job.bestMetric;
  $: activeNodes = new Set(job.experiments.map(e => e.nodeId)).size;

  function fmtTime(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  // Generate a model name from topic
  $: modelName = job.topic
    ? job.topic.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Predictor'
    : 'Trained Model';

  // Accuracy simulation from bestMetric (inverse of bpb loss)
  $: accuracy = bestMetric < Infinity ? Math.min(99.9, Math.max(50, (1 - (bestMetric - 0.8) / 1.0) * 100)).toFixed(1) : '—';

  // Confetti particle positions (pre-computed for CSS animation)
  const confetti = Array.from({ length: 20 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    color: ['#D97757', '#27864a', '#b7860e', '#2d6ca2'][i % 4],
    size: 4 + Math.random() * 4,
  }));
</script>

<div class="celebration">
  <!-- Confetti particles -->
  <div class="confetti-container">
    {#each confetti as c}
      <span
        class="confetti-piece"
        style="left: {c.left}%; animation-delay: {c.delay}s; animation-duration: {c.duration}s; background: {c.color}; width: {c.size}px; height: {c.size}px;"
      ></span>
    {/each}
  </div>

  <!-- Pipeline (complete state) -->
  <ResearchPipeline />

  <!-- Main celebration content -->
  <div class="cel-hero">
    <div class="cel-check">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" stroke="var(--green, #27864a)" stroke-width="1.5"/>
        <polyline points="8 12 11 15 16 9" stroke="var(--green, #27864a)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <h2 class="cel-title">Your Model is Ready</h2>
    <p class="cel-topic">{job.topic}</p>
  </div>

  <!-- Model Summary Card -->
  <div class="model-card">
    <div class="mc-header">
      <span class="mc-badge">TRAINED MODEL</span>
      <span class="mc-id">#{Math.random().toString(36).slice(2, 8)}</span>
    </div>
    <h3 class="mc-name">{modelName}</h3>

    <div class="mc-stats">
      <div class="mc-stat">
        <span class="mc-stat-val accent">{accuracy}%</span>
        <span class="mc-stat-label">Accuracy
          <span class="mc-tip" title="Estimated from validation loss metric">?</span>
        </span>
      </div>
      <div class="mc-sep"></div>
      <div class="mc-stat">
        <span class="mc-stat-val">{completed}</span>
        <span class="mc-stat-label">Experiments</span>
      </div>
      <div class="mc-sep"></div>
      <div class="mc-stat">
        <span class="mc-stat-val green">{keeps}</span>
        <span class="mc-stat-label">Kept</span>
      </div>
      <div class="mc-sep"></div>
      <div class="mc-stat">
        <span class="mc-stat-val">{activeNodes}</span>
        <span class="mc-stat-label">Nodes Used</span>
      </div>
      <div class="mc-sep"></div>
      <div class="mc-stat">
        <span class="mc-stat-val">{fmtTime(job.elapsedSeconds)}</span>
        <span class="mc-stat-label">Duration</span>
      </div>
    </div>

    <!-- Best metric highlight -->
    <div class="mc-metric-row">
      <span class="mc-metric-label">Best val_bpb
        <span class="mc-tip" title="Bits-per-byte: lower is better. Measures prediction quality.">?</span>
      </span>
      <span class="mc-metric-val">{bestMetric === Infinity ? '—' : bestMetric.toFixed(3)}</span>
    </div>

    <!-- Mini comparison bar -->
    <div class="mc-compare">
      <div class="mc-cmp-row">
        <span class="mc-cmp-label">Baseline</span>
        <div class="mc-cmp-track">
          <div class="mc-cmp-bar base" style="width: {(0.9499 / 0.98) * 100}%"></div>
        </div>
        <span class="mc-cmp-val">0.9499</span>
      </div>
      <div class="mc-cmp-row">
        <span class="mc-cmp-label">Best</span>
        <div class="mc-cmp-track">
          <div class="mc-cmp-bar best" style="width: {(0.9719 / 0.98) * 100}%"></div>
        </div>
        <span class="mc-cmp-val accent">0.9719</span>
      </div>
    </div>
  </div>

  <!-- Actions -->
  <div class="cel-actions">
    <button class="cel-btn primary" on:click={onViewDetails}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="12" width="4" height="9" rx="1" stroke="currentColor" stroke-width="1.5"/>
        <rect x="10" y="7" width="4" height="14" rx="1" stroke="currentColor" stroke-width="1.5"/>
        <rect x="17" y="3" width="4" height="18" rx="1" stroke="currentColor" stroke-width="1.5"/>
      </svg>
      View Full Benchmark
    </button>
    <button class="cel-btn secondary" on:click={onNewResearch}>
      Start New Research
    </button>
  </div>
</div>

<style>
  .celebration {
    position: relative;
    max-width: 600px;
    margin: 0 auto;
    padding: var(--space-8, 32px) var(--space-4, 16px);
    display: flex;
    flex-direction: column;
    gap: var(--space-6, 24px);
    animation: fadeInUp 600ms var(--ease-out-expo, cubic-bezier(0.16,1,0.3,1)) both;
  }

  /* Confetti */
  .confetti-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 200px;
    overflow: hidden;
    pointer-events: none;
    z-index: 0;
  }
  .confetti-piece {
    position: absolute;
    top: -10px;
    border-radius: 2px;
    opacity: 0;
    animation: confetti-fall linear forwards;
  }
  @keyframes confetti-fall {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(200px) rotate(720deg); opacity: 0; }
  }

  .cel-hero {
    text-align: center;
    position: relative;
    z-index: 1;
  }
  .cel-check {
    margin: 0 auto 12px;
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(39, 134, 74, 0.06);
    animation: scaleIn 400ms var(--ease-spring, cubic-bezier(0.34,1.56,0.64,1)) both;
    animation-delay: 200ms;
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.5); }
    to { opacity: 1; transform: scale(1); }
  }
  .cel-title {
    font-family: var(--font-display, 'Playfair Display', serif);
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--text-primary, #2D2D2D);
    margin: 0 0 4px;
  }
  .cel-topic {
    font-size: 0.88rem;
    color: var(--text-secondary, #6b6560);
    margin: 0;
    font-style: italic;
  }

  /* Model Card */
  .model-card {
    border: 1px solid var(--border, #E5E0DA);
    border-radius: var(--radius-lg, 16px);
    background: var(--surface, #fff);
    padding: 20px 24px;
    box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08));
    position: relative;
    z-index: 1;
  }
  .mc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .mc-badge {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.55rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--green, #27864a);
    background: rgba(39, 134, 74, 0.08);
    padding: 3px 8px;
    border-radius: var(--radius-sm, 6px);
  }
  .mc-id {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.58rem;
    color: var(--text-muted, #9a9590);
  }
  .mc-name {
    font-family: var(--font-display, 'Playfair Display', serif);
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary, #2D2D2D);
    margin: 0 0 16px;
  }

  .mc-stats {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    padding: 12px 0;
    border-top: 1px solid var(--border-subtle, #EDEAE5);
    border-bottom: 1px solid var(--border-subtle, #EDEAE5);
    margin-bottom: 14px;
  }
  .mc-stat {
    flex: 1;
    text-align: center;
  }
  .mc-stat-val {
    display: block;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 1.1rem;
    font-weight: 800;
    color: var(--text-primary, #2D2D2D);
    line-height: 1;
  }
  .mc-stat-val.accent { color: var(--accent, #D97757); }
  .mc-stat-val.green { color: var(--green, #27864a); }
  .mc-stat-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    font-size: 0.6rem;
    color: var(--text-muted, #9a9590);
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .mc-sep {
    width: 1px;
    height: 24px;
    background: var(--border-subtle, #EDEAE5);
    flex-shrink: 0;
  }
  .mc-tip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    border: 1px solid var(--border, #E5E0DA);
    font-size: 0.5rem;
    color: var(--text-muted, #9a9590);
    cursor: help;
    font-weight: 700;
  }

  .mc-metric-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: rgba(217, 119, 87, 0.03);
    border-radius: var(--radius-sm, 6px);
    margin-bottom: 12px;
  }
  .mc-metric-label {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.62rem;
    color: var(--text-secondary, #6b6560);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .mc-metric-val {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.88rem;
    font-weight: 800;
    color: var(--accent, #D97757);
  }

  .mc-compare {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .mc-cmp-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .mc-cmp-label {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.58rem;
    color: var(--text-muted, #9a9590);
    min-width: 52px;
  }
  .mc-cmp-track {
    flex: 1;
    height: 6px;
    background: rgba(0,0,0,0.04);
    border-radius: 3px;
    overflow: hidden;
  }
  .mc-cmp-bar {
    height: 100%;
    border-radius: 3px;
    transition: width 800ms var(--ease-out-expo, ease);
  }
  .mc-cmp-bar.base {
    background: var(--text-muted, #9a9590);
  }
  .mc-cmp-bar.best {
    background: linear-gradient(90deg, var(--accent, #D97757), var(--green, #27864a));
    box-shadow: 0 0 6px rgba(39, 134, 74, 0.3);
  }
  .mc-cmp-val {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.62rem;
    font-weight: 700;
    color: var(--text-secondary, #6b6560);
    min-width: 40px;
    text-align: right;
  }
  .mc-cmp-val.accent { color: var(--accent, #D97757); }

  /* Actions */
  .cel-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    position: relative;
    z-index: 1;
  }
  .cel-btn {
    appearance: none;
    border: none;
    cursor: pointer;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.78rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: var(--radius-md, 10px);
    transition: all 150ms ease;
    width: 100%;
    max-width: 320px;
  }
  .cel-btn.primary {
    background: var(--accent, #D97757);
    color: #fff;
    padding: 12px 24px;
    box-shadow: 0 2px 8px rgba(217, 119, 87, 0.3);
  }
  .cel-btn.primary:hover {
    background: var(--accent-hover, #C4644A);
    box-shadow: 0 4px 16px rgba(217, 119, 87, 0.4);
    transform: translateY(-1px);
  }
  .cel-btn.secondary {
    background: none;
    border: 1px solid var(--border, #E5E0DA);
    color: var(--text-secondary, #6b6560);
    padding: 10px 24px;
  }
  .cel-btn.secondary:hover {
    border-color: var(--accent, #D97757);
    color: var(--accent, #D97757);
  }

  @media (max-width: 600px) {
    .celebration {
      padding: var(--space-6, 24px) var(--space-3, 12px);
      max-width: 100%;
      overflow-x: hidden;
    }
    .model-card { padding: 16px; }
    .mc-stats { flex-wrap: wrap; gap: 8px; padding: 12px 8px; }
    .mc-sep { display: none; }
    .mc-stat { flex: 0 0 calc(33.3% - 6px); }
    .mc-stat-val { font-size: 0.9rem; }
    .cel-title { font-size: 1.3rem; }
  }
</style>
