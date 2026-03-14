<script lang="ts">
  import { jobStore, completedCount, keepCount } from './jobStore.ts';

  $: phase = $jobStore.phase;
  $: total = $jobStore.totalExperiments;
  $: completed = $completedCount;
  $: keeps = $keepCount;
  $: progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Pipeline stages derived from job phase
  $: stages = [
    {
      label: 'Research',
      sublabel: 'Analyzing & designing experiments',
      status: phase === 'setup' ? 'active' : phase === 'idle' ? 'pending' : 'done',
      icon: 'search',
    },
    {
      label: 'Training',
      sublabel: `${completed}/${total} experiments`,
      status: phase === 'running' ? 'active' : (phase === 'complete' ? 'done' : 'pending'),
      icon: 'cpu',
    },
    {
      label: 'Model Ready',
      sublabel: keeps > 0 ? `${keeps} approaches kept` : 'Awaiting results',
      status: phase === 'complete' ? 'done' : 'pending',
      icon: 'check',
    },
  ] as const;
</script>

<div class="pipeline" class:complete={phase === 'complete'}>
  <div class="pipeline-track">
    {#each stages as stage, i}
      <div class="pipeline-stage" class:active={stage.status === 'active'} class:done={stage.status === 'done'}>
        <div class="stage-marker">
          {#if stage.status === 'done'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          {:else if stage.status === 'active'}
            <span class="stage-pulse"></span>
            <span class="stage-num">{i + 1}</span>
          {:else}
            <span class="stage-num">{i + 1}</span>
          {/if}
        </div>
        <div class="stage-info">
          <span class="stage-label">{stage.label}</span>
          <span class="stage-sub">{stage.sublabel}</span>
        </div>
      </div>
      {#if i < stages.length - 1}
        <div class="stage-connector" class:filled={stage.status === 'done'}></div>
      {/if}
    {/each}
  </div>
  {#if phase === 'running'}
    <div class="pipeline-progress">
      <div class="pp-bar">
        <div class="pp-fill" style="width: {progress}%"></div>
      </div>
      <span class="pp-pct">{progress}%</span>
    </div>
  {/if}
</div>

<style>
  .pipeline {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    padding: 16px 20px;
    border: 1px solid var(--border, #E5E0DA);
    border-radius: var(--radius-md, 10px);
    background: var(--surface, #fff);
  }
  .pipeline.complete {
    border-color: rgba(39, 134, 74, 0.3);
    background: rgba(39, 134, 74, 0.02);
  }

  .pipeline-track {
    display: flex;
    align-items: flex-start;
    gap: 0;
  }

  .pipeline-stage {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    flex: 0 0 auto;
  }

  .stage-marker {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid var(--border, #E5E0DA);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
    color: var(--text-muted, #9a9590);
    background: var(--surface, #fff);
    transition: all 300ms ease;
  }
  .pipeline-stage.active .stage-marker {
    border-color: var(--accent, #D97757);
    color: var(--accent, #D97757);
    box-shadow: 0 0 12px rgba(217, 119, 87, 0.25);
  }
  .pipeline-stage.done .stage-marker {
    border-color: var(--green, #27864a);
    background: var(--green, #27864a);
    color: #fff;
    box-shadow: 0 0 8px rgba(39, 134, 74, 0.3);
  }

  .stage-num {
    font-size: 0.7rem;
    font-weight: 700;
    line-height: 1;
  }

  .stage-pulse {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 1.5px solid var(--accent, #D97757);
    animation: pulse-ring 2s ease-out infinite;
    pointer-events: none;
  }
  @keyframes pulse-ring {
    0% { transform: scale(0.9); opacity: 0.6; }
    100% { transform: scale(1.6); opacity: 0; }
  }

  .stage-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .stage-label {
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--text-secondary, #6b6560);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .pipeline-stage.active .stage-label {
    color: var(--accent, #D97757);
  }
  .pipeline-stage.done .stage-label {
    color: var(--green, #27864a);
  }
  .stage-sub {
    font-size: 0.6rem;
    color: var(--text-muted, #9a9590);
    white-space: nowrap;
  }

  .stage-connector {
    flex: 1;
    min-width: 24px;
    height: 2px;
    background: var(--border, #E5E0DA);
    margin-top: 14px;
    margin-left: 8px;
    margin-right: 8px;
    border-radius: 1px;
    transition: background 300ms ease;
  }
  .stage-connector.filled {
    background: var(--green, #27864a);
    box-shadow: 0 0 4px rgba(39, 134, 74, 0.2);
  }

  .pipeline-progress {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--border-subtle, #EDEAE5);
  }
  .pp-bar {
    flex: 1;
    height: 4px;
    background: rgba(217, 119, 87, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }
  .pp-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent, #D97757), var(--gold, #b7860e));
    border-radius: 2px;
    transition: width 300ms var(--ease-smooth, ease);
    box-shadow: 0 0 6px rgba(217, 119, 87, 0.3);
  }
  .pp-pct {
    font-size: 0.62rem;
    font-weight: 700;
    color: var(--accent, #D97757);
    min-width: 28px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 600px) {
    .pipeline { padding: 10px; overflow: hidden; }
    .pipeline-track { min-width: 0; flex-wrap: nowrap; }
    .stage-sub { display: none; }
    .stage-connector { min-width: 8px; max-width: 16px; flex: 1 1 8px; }
    .stage-label { font-size: 0.52rem; white-space: nowrap; }
    .stage-marker { width: 22px; height: 22px; }
    .stage-marker svg { width: 11px; height: 11px; }
    .stage-num { font-size: 0.55rem; }
    .pipeline-stage { gap: 4px; flex-shrink: 1; min-width: 0; }
    .stage-info { overflow: hidden; }
    .pp-bar { height: 3px; }
    .pipeline-progress { margin-top: 8px; padding-top: 8px; }
  }
</style>
