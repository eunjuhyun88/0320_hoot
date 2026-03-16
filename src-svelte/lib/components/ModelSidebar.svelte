<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let m: {
    downloads: number;
    framework: string;
    tags: string[];
    date: string;
    updated: string;
    license: string;
    rows: number;
  };
  export let sparkPath: string;
  export let sparkArea: string;

  const dispatch = createEventDispatcher<{ switchTab: string }>();
</script>

<aside class="content-sidebar">
  <!-- Downloads -->
  <div class="sb-card">
    <span class="sb-label">Downloads last month</span>
    <div class="sb-downloads">
      <span class="sb-big-number">{m.downloads.toLocaleString()}</span>
      <svg width="120" height="28" viewBox="0 0 120 28" class="sb-sparkline">
        <path d={sparkArea} fill="rgba(217, 119, 87, 0.12)"/>
        <path d={sparkPath} fill="none" stroke="var(--accent, #D97757)" stroke-width="1.5"/>
      </svg>
    </div>
  </div>

  <!-- Quick Inference Hint -->
  <div class="sb-card sb-try-card">
    <span class="sb-label">Try this model</span>
    <p class="sb-hint">Use the playground above to test inference with your own input. 0.001 HOOT per call.</p>
    <div class="sb-try-info">
      <div class="sb-try-row">
        <span class="sb-try-key">Cost</span>
        <span class="sb-try-val">0.001 HOOT</span>
      </div>
      <div class="sb-try-row">
        <span class="sb-try-key">Latency</span>
        <span class="sb-try-val">~42ms</span>
      </div>
      <div class="sb-try-row">
        <span class="sb-try-key">Protocol</span>
        <span class="sb-try-val">x402 payment</span>
      </div>
    </div>
  </div>

  <!-- Tags -->
  <div class="sb-card">
    <span class="sb-label">Tags</span>
    <div class="sb-tag-group">
      <span class="sb-group-label">Task</span>
      <div class="sb-tags">
        <span class="sb-tag">Prediction</span>
        <span class="sb-tag">Time Series</span>
      </div>
    </div>
    <div class="sb-tag-group">
      <span class="sb-group-label">Framework</span>
      <div class="sb-tags">
        <span class="sb-tag">{m.framework}</span>
      </div>
    </div>
    <div class="sb-tag-group">
      <span class="sb-group-label">Keywords</span>
      <div class="sb-tags">
        {#each m.tags as tag}
          <span class="sb-tag">{tag}</span>
        {/each}
      </div>
    </div>
  </div>

  <!-- Model Details -->
  <div class="sb-card">
    <span class="sb-label">Details</span>
    <div class="sb-detail-rows">
      <div class="sb-detail-row">
        <span class="sb-detail-key">Created</span>
        <span class="sb-detail-val">{m.date}</span>
      </div>
      <div class="sb-detail-row">
        <span class="sb-detail-key">Updated</span>
        <span class="sb-detail-val">{m.updated}</span>
      </div>
      <div class="sb-detail-row">
        <span class="sb-detail-key">License</span>
        <span class="sb-detail-val">{m.license}</span>
      </div>
      <div class="sb-detail-row">
        <span class="sb-detail-key">Dataset</span>
        <span class="sb-detail-val">{m.rows.toLocaleString()} rows</span>
      </div>
    </div>
  </div>
</aside>

<style>
  .content-sidebar {
    display: flex; flex-direction: column; gap: var(--space-3, 12px);
    position: sticky; top: 68px;
  }
  .sb-card {
    background: var(--surface, #fff);
    border: 1px solid var(--border, #E5E0DA);
    border-radius: var(--radius-md, 10px);
    padding: var(--space-4, 16px);
    transition: border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease;
    animation: sidebar-enter 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .sb-card:hover {
    border-color: rgba(217, 119, 87, 0.2);
    box-shadow: 0 0 12px rgba(217, 119, 87, 0.04);
    transform: translateY(-1px);
  }
  .content-sidebar .sb-card:nth-child(1) { animation-delay: 400ms; }
  .content-sidebar .sb-card:nth-child(2) { animation-delay: 500ms; }
  .content-sidebar .sb-card:nth-child(3) { animation-delay: 600ms; }
  .content-sidebar .sb-card:nth-child(4) { animation-delay: 700ms; }
  @keyframes sidebar-enter {
    from { opacity: 0; transform: translateX(16px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .sb-label {
    font-size: 0.72rem; font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    text-transform: uppercase; letter-spacing: 0.06em;
    display: block; margin-bottom: var(--space-2, 8px);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }
  .sb-hint {
    font-size: 0.76rem; color: var(--text-muted, #9a9590);
    margin: 0 0 var(--space-3, 12px);
  }

  /* Downloads */
  .sb-downloads {
    display: flex; align-items: flex-end; justify-content: space-between; gap: 12px;
  }
  .sb-big-number {
    font-size: 1.6rem; font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    line-height: 1;
    text-shadow: 0 0 4px rgba(217, 119, 87, 0.15);
  }
  .sb-sparkline { flex-shrink: 0; filter: drop-shadow(0 0 3px rgba(217, 119, 87, 0.2)); }
  .sb-sparkline path {
    animation: sparkline-draw 1.2s ease-out both;
    animation-delay: 600ms;
  }
  @keyframes sparkline-draw {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Try card */
  .sb-try-card { }
  .sb-try-info { display: flex; flex-direction: column; gap: 0; }
  .sb-try-row {
    display: flex; justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px solid var(--border-subtle, #EDEAE5);
    font-size: 0.72rem;
  }
  .sb-try-row:last-child { border-bottom: none; }
  .sb-try-key { color: var(--text-muted, #9a9590); font-family: var(--font-mono, 'JetBrains Mono', monospace); }
  .sb-try-val { color: var(--text-primary, #2D2D2D); font-weight: 600; font-family: var(--font-mono, 'JetBrains Mono', monospace); }

  /* Tags */
  .sb-tag-group { margin-bottom: var(--space-3, 12px); }
  .sb-tag-group:last-child { margin-bottom: 0; }
  .sb-group-label {
    font-size: 0.62rem; font-weight: 600;
    color: var(--text-muted, #9a9590);
    text-transform: uppercase; letter-spacing: 0.06em;
    display: block; margin-bottom: 4px;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }
  .sb-tags { display: flex; flex-wrap: wrap; gap: 4px; }
  .sb-tag {
    font-size: 0.66rem; font-weight: 500;
    padding: 3px 10px;
    border-radius: var(--radius-pill, 100px);
    background: var(--border-subtle, #EDEAE5);
    color: var(--text-secondary, #6b6560);
  }

  /* Details */
  .sb-detail-rows { display: flex; flex-direction: column; }
  .sb-detail-row {
    display: flex; justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px solid var(--border-subtle, #EDEAE5);
    font-size: 0.78rem;
  }
  .sb-detail-row:last-child { border-bottom: none; }
  .sb-detail-key { color: var(--text-muted, #9a9590); font-family: var(--font-mono, 'JetBrains Mono', monospace); }
  .sb-detail-val { color: var(--text-primary, #2D2D2D); font-weight: 500; }

  @media (max-width: 960px) {
    .content-sidebar { position: static; }
  }
</style>
