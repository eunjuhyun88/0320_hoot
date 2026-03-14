<script lang="ts">
  import {
    jobStore,
    completedCount,
    keepCount,
    qualityScore,
    statusMessage,
    latestFinding,
    humanizeModification,
  } from './jobStore.ts';

  export let onToggleExpert: () => void = () => {};

  $: job = $jobStore;
  $: phase = job.phase;
  $: completed = $completedCount;
  $: keeps = $keepCount;
  $: total = job.totalExperiments;
  $: quality = $qualityScore;
  $: finding = $latestFinding;
  $: progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Active nodes count
  $: activeNodes = new Set(job.experiments.map(e => e.nodeId)).size;

  // Build hill-climbing history: only keeps, ordered by time (earliest first)
  $: hillHistory = [...job.experiments]
    .filter(e => e.status === 'keep')
    .reverse()
    .map((e, i) => ({
      step: i + 1,
      metric: e.metric,
      mod: e.modification,
      humanMod: humanizeModification(e.modification),
      delta: e.delta,
    }));

  // Best metric value so far
  $: bestVal = job.bestMetric === Infinity ? null : job.bestMetric;

  // Currently training experiment
  $: trainingExp = job.experiments.find(e => e.status === 'training');

  // Recent experiment log (like results.tsv)
  $: recentLog = job.experiments
    .filter(e => e.status === 'keep' || e.status === 'discard' || e.status === 'crash')
    .slice(0, 8);

  // Hill-climb SVG chart data
  $: chartPoints = (() => {
    if (hillHistory.length === 0) return [];
    const maxSteps = Math.max(hillHistory.length, 6);
    const padding = 8;
    const w = 100 - padding * 2;
    const metrics = hillHistory.map(h => h.metric);
    const maxM = Math.max(...metrics) + 0.02;
    const minM = Math.min(...metrics) - 0.02;
    const range = maxM - minM || 0.1;
    return hillHistory.map((h, i) => ({
      x: padding + (i / (maxSteps - 1)) * w,
      y: padding + ((h.metric - minM) / range) * (100 - padding * 2 - 10),
      metric: h.metric,
      mod: h.humanMod,
    }));
  })();

  function fmtTime(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  function shortHash(): string {
    return Math.random().toString(16).slice(2, 9);
  }
</script>

<div class="ar-view">
  <!-- Header: topic + methodology label -->
  <div class="ar-header">
    <div class="ar-method-badge">AUTORESEARCH</div>
    <h2 class="ar-topic">{job.topic || 'Untitled Research'}</h2>
    <p class="ar-method-desc">Greedy hill-climbing: modify train.py → train → evaluate val_bpb → keep or discard → loop</p>
  </div>

  {#if phase === 'setup'}
    <div class="ar-terminal">
      <div class="ar-term-header">
        <span class="ar-term-dot red"></span>
        <span class="ar-term-dot yellow"></span>
        <span class="ar-term-dot green"></span>
        <span class="ar-term-title">autoresearch setup</span>
      </div>
      <div class="ar-term-body">
        <div class="ar-term-line">
          <span class="ar-prompt">$</span>
          <span class="ar-cmd">{$statusMessage}</span>
          <span class="ar-cursor">█</span>
        </div>
      </div>
    </div>

  {:else if phase === 'running'}
    <!-- Current loop state -->
    <div class="ar-loop">
      <div class="ar-loop-diagram">
        <div class="ar-loop-step" class:active={!!trainingExp} class:done={!trainingExp && completed > 0}>
          <div class="ar-loop-icon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-linejoin="round" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="ar-loop-label">MODIFY</span>
          <span class="ar-loop-sub">train.py</span>
        </div>
        <div class="ar-loop-arrow">→</div>
        <div class="ar-loop-step" class:active={!!trainingExp}>
          <div class="ar-loop-icon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
              <path d="M9 9h6M9 12h6M9 15h3"/>
            </svg>
          </div>
          <span class="ar-loop-label">TRAIN</span>
          <span class="ar-loop-sub">{trainingExp ? `${Math.round(trainingExp.progress)}%` : '~5min'}</span>
        </div>
        <div class="ar-loop-arrow">→</div>
        <div class="ar-loop-step" class:active={!trainingExp && completed > 0}>
          <div class="ar-loop-icon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <span class="ar-loop-label">EVAL</span>
          <span class="ar-loop-sub">val_bpb</span>
        </div>
        <div class="ar-loop-arrow">→</div>
        <div class="ar-loop-step result">
          <div class="ar-loop-split">
            <span class="ar-keep">KEEP</span>
            <span class="ar-split-or">/</span>
            <span class="ar-discard">DISCARD</span>
          </div>
        </div>
        <div class="ar-loop-arrow loop-back">↻</div>
      </div>
    </div>

    <!-- Stats bar -->
    <div class="ar-stats-bar">
      <div class="ar-stat-item">
        <span class="ar-stat-num">{completed}<span class="ar-stat-of">/{total}</span></span>
        <span class="ar-stat-name">iterations</span>
      </div>
      <div class="ar-stat-item accent">
        <span class="ar-stat-num">{keeps}</span>
        <span class="ar-stat-name">kept</span>
      </div>
      <div class="ar-stat-item">
        <span class="ar-stat-num">{bestVal !== null ? bestVal.toFixed(3) : '—'}</span>
        <span class="ar-stat-name">best val_bpb</span>
      </div>
      <div class="ar-stat-item">
        <span class="ar-stat-num">{activeNodes}</span>
        <span class="ar-stat-name">nodes</span>
      </div>
      <div class="ar-stat-item">
        <span class="ar-stat-num">{fmtTime(job.elapsedSeconds)}</span>
        <span class="ar-stat-name">elapsed</span>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="ar-progress-wrap">
      <div class="ar-progress-bar">
        <div class="ar-progress-fill" style="width: {progress}%"></div>
      </div>
      <span class="ar-progress-pct">{progress}%</span>
    </div>

    <!-- Hill-climbing chart: val_bpb over kept iterations -->
    {#if chartPoints.length > 1}
      <div class="ar-chart-section">
        <div class="ar-section-label">
          <span class="ar-label-dot"></span>
          val_bpb DESCENT (lower is better)
        </div>
        <div class="ar-chart">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="ar-chart-svg">
            <!-- Grid lines -->
            {#each [20, 40, 60, 80] as y}
              <line x1="8" y1={y} x2="92" y2={y} stroke="rgba(217,119,87,0.06)" stroke-width="0.3"/>
            {/each}
            <!-- Line path -->
            <polyline
              points={chartPoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="var(--accent, #D97757)"
              stroke-width="1.2"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <!-- Points -->
            {#each chartPoints as pt, i}
              <circle cx={pt.x} cy={pt.y} r={i === chartPoints.length - 1 ? 2.5 : 1.5}
                fill={i === chartPoints.length - 1 ? 'var(--green, #27864a)' : 'var(--accent, #D97757)'}/>
            {/each}
          </svg>
          <div class="ar-chart-labels">
            <span>iter 1</span>
            <span>iter {hillHistory.length}</span>
          </div>
        </div>
      </div>
    {/if}

    <!-- Currently training -->
    {#if trainingExp}
      <div class="ar-training-card">
        <div class="ar-training-header">
          <span class="ar-training-pulse"></span>
          <span class="ar-training-label">TRAINING</span>
          <span class="ar-training-branch">branch {trainingExp.branchId}</span>
        </div>
        <div class="ar-training-mod">
          <code>{trainingExp.modification}</code>
        </div>
        <div class="ar-training-bar-wrap">
          <div class="ar-training-bar">
            <div class="ar-training-fill" style="width: {trainingExp.progress}%"></div>
          </div>
          <span class="ar-training-pct">{Math.round(trainingExp.progress)}%</span>
        </div>
      </div>
    {/if}

    <!-- Latest keep -->
    {#if finding}
      <div class="ar-latest-keep">
        <div class="ar-keep-header">
          <span class="ar-keep-badge">KEEP</span>
          <span class="ar-keep-metric">val_bpb = {finding.metric.toFixed(4)}</span>
          {#if finding.delta > 0}
            <span class="ar-keep-delta">↓ {finding.delta.toFixed(4)}</span>
          {/if}
        </div>
        <div class="ar-keep-detail">
          <code class="ar-keep-code">{finding.modification}</code>
          <p class="ar-keep-human">{finding.humanReadable}</p>
        </div>
      </div>
    {/if}

    <!-- Results log (results.tsv style) -->
    <div class="ar-log-section">
      <div class="ar-section-label">
        <span class="ar-label-dot"></span>
        EXPERIMENT LOG (results.tsv)
      </div>
      <div class="ar-log-table">
        <div class="ar-log-header">
          <span class="ar-log-col hash">COMMIT</span>
          <span class="ar-log-col metric">VAL_BPB</span>
          <span class="ar-log-col status">STATUS</span>
          <span class="ar-log-col desc">MODIFICATION</span>
        </div>
        {#each recentLog as exp}
          <div class="ar-log-row" class:keep={exp.status === 'keep'} class:crash={exp.status === 'crash'}>
            <span class="ar-log-col hash"><code>{shortHash()}</code></span>
            <span class="ar-log-col metric">{exp.metric > 0 ? exp.metric.toFixed(4) : '—'}</span>
            <span class="ar-log-col status">
              <span class="ar-status-badge" class:keep={exp.status === 'keep'} class:discard={exp.status === 'discard'} class:crash={exp.status === 'crash'}>
                {exp.status.toUpperCase()}
              </span>
            </span>
            <span class="ar-log-col desc">{exp.modification}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Toggle to expert view -->
  <button class="sv-toggle" on:click={onToggleExpert}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M2 3h20M2 12h20M2 21h20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    Show Expert View
  </button>
</div>

<style>
  .ar-view {
    max-width: 680px;
    margin: 0 auto;
    padding: var(--space-5, 20px) var(--space-4, 16px);
    display: flex;
    flex-direction: column;
    gap: var(--space-4, 16px);
  }

  /* ── Header ── */
  .ar-header {
    text-align: center;
    margin-bottom: var(--space-2, 8px);
  }
  .ar-method-badge {
    display: inline-block;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: var(--accent, #D97757);
    background: rgba(217, 119, 87, 0.08);
    border: 1px solid rgba(217, 119, 87, 0.15);
    padding: 3px 10px;
    border-radius: var(--radius-pill, 100px);
    margin-bottom: 8px;
  }
  .ar-topic {
    font-family: var(--font-display, 'Playfair Display', serif);
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--text-primary, #2D2D2D);
    margin: 0 0 4px;
  }
  .ar-method-desc {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.6rem;
    color: var(--text-muted, #9a9590);
    margin: 0;
    line-height: 1.5;
  }

  /* ── Terminal (setup) ── */
  .ar-terminal {
    border: 1px solid var(--terminal-border, rgba(48, 54, 61, 0.8));
    border-radius: var(--radius-md, 10px);
    overflow: hidden;
    background: var(--terminal-bg, #0d1117);
  }
  .ar-term-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: rgba(0,0,0,0.3);
    border-bottom: 1px solid var(--terminal-border, rgba(48, 54, 61, 0.8));
  }
  .ar-term-dot {
    width: 8px; height: 8px; border-radius: 50%;
  }
  .ar-term-dot.red { background: #ff5f56; }
  .ar-term-dot.yellow { background: #ffbd2e; }
  .ar-term-dot.green { background: #27c93f; }
  .ar-term-title {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.6rem;
    color: var(--terminal-dim, #8b949e);
    margin-left: 8px;
  }
  .ar-term-body {
    padding: 12px 14px;
  }
  .ar-term-line {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.72rem;
  }
  .ar-prompt {
    color: var(--terminal-green, #3fb950);
    font-weight: 700;
  }
  .ar-cmd {
    color: var(--terminal-text, #c9d1d9);
  }
  .ar-cursor {
    color: var(--terminal-cursor, #D97757);
    animation: terminal-blink 1s step-end infinite;
  }

  /* ── Loop Diagram ── */
  .ar-loop {
    padding: 14px 12px;
    border: 1px solid var(--border, #E5E0DA);
    border-radius: var(--radius-md, 10px);
    background: var(--surface, #fff);
    overflow-x: auto;
  }
  .ar-loop-diagram {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 0;
  }
  .ar-loop-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 8px 10px;
    border: 1.5px solid var(--border, #E5E0DA);
    border-radius: var(--radius-sm, 6px);
    background: var(--surface, #fff);
    transition: all 200ms ease;
    min-width: 0;
    flex-shrink: 1;
  }
  .ar-loop-step.active {
    border-color: var(--accent, #D97757);
    box-shadow: 0 0 10px rgba(217, 119, 87, 0.15);
  }
  .ar-loop-step.done {
    border-color: var(--green, #27864a);
  }
  .ar-loop-step.result {
    border-style: dashed;
    padding: 8px 8px;
  }
  .ar-loop-icon {
    color: var(--text-muted, #9a9590);
    display: flex;
  }
  .ar-loop-step.active .ar-loop-icon {
    color: var(--accent, #D97757);
  }
  .ar-loop-label {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.55rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--text-secondary, #6b6560);
  }
  .ar-loop-step.active .ar-loop-label {
    color: var(--accent, #D97757);
  }
  .ar-loop-sub {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.5rem;
    color: var(--text-muted, #9a9590);
  }
  .ar-loop-arrow {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.9rem;
    color: var(--text-muted, #9a9590);
    flex-shrink: 0;
  }
  .ar-loop-arrow.loop-back {
    color: var(--accent, #D97757);
    font-size: 1.1rem;
    font-weight: 700;
  }
  .ar-loop-split {
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.55rem;
    font-weight: 700;
  }
  .ar-keep { color: var(--green, #27864a); }
  .ar-split-or { color: var(--text-muted, #9a9590); font-weight: 400; }
  .ar-discard { color: var(--red, #c0392b); }

  /* ── Stats Bar ── */
  .ar-stats-bar {
    display: flex;
    gap: 2px;
    background: var(--surface, #fff);
    border: 1px solid var(--border, #E5E0DA);
    border-radius: var(--radius-md, 10px);
    padding: 2px;
    overflow: hidden;
  }
  .ar-stat-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    padding: 10px 4px;
    border-radius: var(--radius-sm, 6px);
    background: rgba(0,0,0,0.01);
  }
  .ar-stat-item.accent .ar-stat-num {
    color: var(--green, #27864a);
  }
  .ar-stat-num {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 1rem;
    font-weight: 800;
    color: var(--text-primary, #2D2D2D);
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .ar-stat-of {
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--text-muted, #9a9590);
  }
  .ar-stat-name {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.5rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted, #9a9590);
  }

  /* ── Progress ── */
  .ar-progress-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ar-progress-bar {
    flex: 1;
    height: 5px;
    background: rgba(217, 119, 87, 0.08);
    border-radius: 3px;
    overflow: hidden;
  }
  .ar-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent, #D97757), var(--gold, #b7860e));
    border-radius: 3px;
    transition: width 400ms var(--ease-smooth, ease);
  }
  .ar-progress-pct {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--accent, #D97757);
    min-width: 30px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* ── Chart ── */
  .ar-chart-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ar-section-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.55rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted, #9a9590);
  }
  .ar-label-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--accent, #D97757);
    flex-shrink: 0;
  }
  .ar-chart {
    border: 1px solid var(--border, #E5E0DA);
    border-radius: var(--radius-sm, 6px);
    background: var(--surface, #fff);
    padding: 8px 8px 4px;
  }
  .ar-chart-svg {
    width: 100%;
    height: 80px;
    display: block;
  }
  .ar-chart-labels {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.48rem;
    color: var(--text-muted, #9a9590);
    padding: 2px 4px 0;
  }

  /* ── Training Card ── */
  .ar-training-card {
    border: 1px solid rgba(183, 134, 14, 0.2);
    border-radius: var(--radius-md, 10px);
    background: rgba(183, 134, 14, 0.02);
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ar-training-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ar-training-pulse {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--gold, #b7860e);
    animation: breathe 1.5s ease-in-out infinite;
    flex-shrink: 0;
  }
  .ar-training-label {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.58rem;
    font-weight: 700;
    color: var(--gold, #b7860e);
    letter-spacing: 0.06em;
  }
  .ar-training-branch {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.52rem;
    color: var(--text-muted, #9a9590);
    margin-left: auto;
  }
  .ar-training-mod code {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.68rem;
    color: var(--text-secondary, #6b6560);
    background: rgba(0,0,0,0.03);
    padding: 3px 8px;
    border-radius: 4px;
    display: inline-block;
  }
  .ar-training-bar-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ar-training-bar {
    flex: 1;
    height: 3px;
    background: rgba(183, 134, 14, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }
  .ar-training-fill {
    height: 100%;
    background: var(--gold, #b7860e);
    border-radius: 2px;
    transition: width 200ms ease;
  }
  .ar-training-pct {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.58rem;
    font-weight: 700;
    color: var(--gold, #b7860e);
    min-width: 24px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* ── Latest Keep ── */
  .ar-latest-keep {
    border: 1px solid rgba(39, 134, 74, 0.2);
    border-radius: var(--radius-md, 10px);
    background: rgba(39, 134, 74, 0.02);
    padding: 12px 14px;
  }
  .ar-keep-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }
  .ar-keep-badge {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.55rem;
    font-weight: 700;
    color: #fff;
    background: var(--green, #27864a);
    padding: 2px 8px;
    border-radius: var(--radius-pill, 100px);
    letter-spacing: 0.06em;
  }
  .ar-keep-metric {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--text-secondary, #6b6560);
  }
  .ar-keep-delta {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.62rem;
    font-weight: 700;
    color: var(--green, #27864a);
  }
  .ar-keep-detail {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .ar-keep-code {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.65rem;
    color: var(--text-secondary, #6b6560);
    background: rgba(0,0,0,0.03);
    padding: 3px 8px;
    border-radius: 4px;
  }
  .ar-keep-human {
    font-size: 0.78rem;
    color: var(--text-primary, #2D2D2D);
    margin: 0;
    line-height: 1.4;
  }

  /* ── Log Table ── */
  .ar-log-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ar-log-table {
    border: 1px solid var(--border, #E5E0DA);
    border-radius: var(--radius-sm, 6px);
    overflow: hidden;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.6rem;
  }
  .ar-log-header {
    display: flex;
    gap: 2px;
    padding: 6px 10px;
    background: rgba(0,0,0,0.03);
    border-bottom: 1px solid var(--border, #E5E0DA);
    font-weight: 700;
    color: var(--text-muted, #9a9590);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 0.5rem;
  }
  .ar-log-row {
    display: flex;
    gap: 2px;
    padding: 5px 10px;
    border-bottom: 1px solid var(--border-subtle, #EDEAE5);
    color: var(--text-secondary, #6b6560);
    transition: background 150ms ease;
  }
  .ar-log-row:last-child { border-bottom: none; }
  .ar-log-row.keep {
    background: rgba(39, 134, 74, 0.03);
  }
  .ar-log-row.crash {
    background: rgba(192, 57, 43, 0.03);
  }
  .ar-log-col.hash { width: 60px; flex-shrink: 0; }
  .ar-log-col.hash code {
    color: var(--text-muted, #9a9590);
  }
  .ar-log-col.metric { width: 60px; flex-shrink: 0; font-variant-numeric: tabular-nums; }
  .ar-log-col.status { width: 56px; flex-shrink: 0; }
  .ar-log-col.desc {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ar-status-badge {
    font-size: 0.48rem;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 3px;
    letter-spacing: 0.04em;
  }
  .ar-status-badge.keep {
    color: var(--green, #27864a);
    background: rgba(39, 134, 74, 0.08);
  }
  .ar-status-badge.discard {
    color: var(--text-muted, #9a9590);
    background: rgba(0,0,0,0.04);
  }
  .ar-status-badge.crash {
    color: var(--red, #c0392b);
    background: rgba(192, 57, 43, 0.08);
  }

  /* ── Toggle Button ── */
  .sv-toggle {
    appearance: none;
    border: 1px solid var(--border, #E5E0DA);
    background: var(--surface, #fff);
    padding: 8px 16px;
    border-radius: var(--radius-sm, 6px);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-secondary, #6b6560);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 150ms ease;
    margin: 0 auto;
  }
  .sv-toggle:hover {
    border-color: var(--accent, #D97757);
    color: var(--accent, #D97757);
  }

  /* ── Mobile ── */
  @media (max-width: 600px) {
    .ar-view {
      padding: var(--space-3, 12px) var(--space-2, 8px);
      gap: var(--space-3, 12px);
    }
    .ar-topic { font-size: 1rem; }
    .ar-method-desc { font-size: 0.52rem; }

    .ar-loop { padding: 10px 6px; }
    .ar-loop-diagram { gap: 3px; }
    .ar-loop-step { padding: 6px 6px; }
    .ar-loop-label { font-size: 0.48rem; }
    .ar-loop-sub { display: none; }
    .ar-loop-icon svg { width: 12px; height: 12px; }
    .ar-loop-arrow { font-size: 0.7rem; }

    .ar-stats-bar { flex-wrap: wrap; }
    .ar-stat-item { min-width: 28%; }
    .ar-stat-num { font-size: 0.85rem; }

    .ar-log-col.hash { width: 48px; }
    .ar-log-col.desc { font-size: 0.5rem; }
    .ar-log-header { font-size: 0.44rem; }

    .ar-chart-svg { height: 60px; }
  }
</style>
