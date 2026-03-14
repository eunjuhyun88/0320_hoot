<script lang="ts">
  export let current: number = 0;
  export let total: number = 300;
  export let label: string = '';

  $: pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;
</script>

<div class="progress-wrap">
  {#if label}
    <div class="progress-label-row">
      <span class="progress-label">{label}</span>
      <span class="progress-pct" class:pct-glow={pct > 50}>{pct.toFixed(0)}%</span>
    </div>
  {/if}
  <div class="progress-track">
    <div class="progress-fill" style="width:{pct}%"></div>
  </div>
  <div class="progress-meta">
    <span class="progress-count">{current} / {total} experiments</span>
  </div>
</div>

<style>
  /* ── Shimmer sweep keyframes ── */
  @keyframes shimmer-sweep {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  /* ── Animated gradient shift ── */
  @keyframes gradient-shift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  /* ── Percentage glow pulse ── */
  @keyframes pct-glow-pulse {
    0%, 100% { text-shadow: 0 0 4px rgba(217, 119, 87, 0.2); }
    50%      { text-shadow: 0 0 12px rgba(217, 119, 87, 0.5), 0 0 3px rgba(217, 119, 87, 0.2); }
  }

  .progress-wrap {
    width: 100%;
  }

  .progress-label-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 6px;
  }

  .progress-label {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--text-secondary, #6b6560);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .progress-pct {
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--accent, #D97757);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    text-shadow: 0 0 4px rgba(217, 119, 87, 0.2);
    font-variant-numeric: tabular-nums;
  }

  .progress-pct.pct-glow {
    animation: pct-glow-pulse 2.4s ease-in-out infinite;
  }

  .progress-track {
    width: 100%;
    height: 6px;
    background: var(--border-subtle, #EDEAE5);
    border-radius: 3px;
    overflow: hidden;

    /* subtle inner shadow for depth */
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
  }

  .progress-fill {
    height: 100%;
    border-radius: 3px;
    box-shadow: 0 0 6px rgba(217, 119, 87, 0.35);

    /* smooth fill with cubic-bezier */
    transition: width 600ms cubic-bezier(0.4, 0, 0.2, 1);

    /* animated gradient base */
    background:
      linear-gradient(
        110deg,
        transparent 25%,
        rgba(255, 255, 255, 0.35) 45%,
        rgba(255, 255, 255, 0.10) 55%,
        transparent 75%
      ),
      linear-gradient(
        90deg,
        var(--accent, #D97757),
        #E8A87C,
        var(--accent, #D97757)
      );
    background-size: 200% 100%, 200% 100%;
    animation:
      shimmer-sweep 2.5s ease-in-out infinite,
      gradient-shift 4s ease-in-out infinite;
  }

  .progress-meta {
    display: flex;
    justify-content: flex-end;
    margin-top: 4px;
  }

  .progress-count {
    font-size: 0.62rem;
    color: var(--text-muted, #9a9590);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-variant-numeric: tabular-nums;
  }
</style>
