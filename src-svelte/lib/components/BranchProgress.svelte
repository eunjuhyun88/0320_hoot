<script lang="ts">
  import type { Branch } from "../stores/jobStore.ts";

  export let branches: Branch[] = [];
</script>

<div class="branches">
  {#each branches as branch, i}
    <div class="branch-row" style="animation-delay:{i * 60}ms">
      <div class="branch-header">
        <span class="branch-label">Branch {branch.id}</span>
        <span class="branch-count">{branch.completed}/{branch.total}</span>
      </div>
      <div class="branch-bar">
        <div
          class="branch-fill"
          style="width:{Math.min(100, (branch.completed / branch.total) * 100)}%"
        ></div>
      </div>
      {#if branch.bestMetric < Infinity}
        <span class="branch-best pulse-glow">best: {branch.bestMetric.toFixed(3)}</span>
      {:else}
        <span class="branch-best dim">—</span>
      {/if}
    </div>
  {/each}
</div>

<style>
  /* ── Shimmer sweep keyframes ── */
  @keyframes shimmer-sweep {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  /* ── Row stagger fade-in ── */
  @keyframes row-fade-in {
    0%   { opacity: 0; transform: translateY(4px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  /* ── Best-metric pulse glow ── */
  @keyframes metric-pulse {
    0%, 100% { text-shadow: 0 0 4px rgba(39, 134, 74, 0.2); }
    50%      { text-shadow: 0 0 10px rgba(39, 134, 74, 0.45), 0 0 2px rgba(39, 134, 74, 0.15); }
  }

  .branches {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .branch-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 6px;
    border-radius: 6px;
    transition: background-color 180ms ease;

    /* stagger fade-in */
    opacity: 0;
    animation: row-fade-in 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }

  .branch-row:hover {
    background-color: rgba(0, 0, 0, 0.03);
  }

  .branch-header {
    display: flex;
    align-items: baseline;
    gap: 4px;
    min-width: 90px;
    flex-shrink: 0;
  }

  .branch-label {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--text-secondary, #6b6560);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .branch-count {
    font-size: 0.62rem;
    color: var(--text-muted, #9a9590);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }

  .branch-bar {
    flex: 1;
    height: 6px;
    background: var(--border-subtle, #EDEAE5);
    border-radius: 3px;
    overflow: hidden;
  }

  .branch-fill {
    height: 100%;
    background: var(--accent, #D97757);
    border-radius: 3px;
    box-shadow: 0 0 4px rgba(217, 119, 87, 0.3);
    position: relative;

    /* smooth fill with cubic-bezier */
    transition: width 600ms cubic-bezier(0.4, 0, 0.2, 1);

    /* shimmer sweep overlay */
    background-image:
      linear-gradient(
        110deg,
        transparent 25%,
        rgba(255, 255, 255, 0.35) 45%,
        rgba(255, 255, 255, 0.10) 55%,
        transparent 75%
      );
    background-size: 200% 100%;
    background-color: var(--accent, #D97757);
    animation: shimmer-sweep 2.5s ease-in-out infinite;
  }

  .branch-best {
    font-size: 0.62rem;
    font-weight: 600;
    color: var(--green, #27864a);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    min-width: 60px;
    text-align: right;
    flex-shrink: 0;
    text-shadow: 0 0 4px rgba(39, 134, 74, 0.2);
  }

  .branch-best.pulse-glow {
    animation: metric-pulse 2.8s ease-in-out infinite;
  }

  .branch-best.dim {
    color: var(--text-muted, #9a9590);
    text-shadow: none;
    animation: none;
  }
</style>
