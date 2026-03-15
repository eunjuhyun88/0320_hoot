<script lang="ts">
  /**
   * ResearchRunning — Studio RUNNING state wrapper.
   *
   * Renders the ContextPanel (RunningPanel) with Studio-compatible navigation.
   * The full AutoresearchPage 5-column layout is preserved — this component
   * wraps the sidebar context panel for embedding in Studio.
   *
   * In Phase 4, MagnetStudioPage will lazy-load AutoresearchPage's visualization
   * grid alongside this panel. For now, this provides the RunningPanel extract.
   *
   * Events:
   *   stop: void — user wants to stop and go to IDLE
   *   submit: { text: string; parentId: number | null } — manual experiment idea
   *   zoomIn: void — user wants to open Semantic Zoom (/research-lab)
   */
  import { createEventDispatcher } from 'svelte';
  import { jobStore, keepCount, crashCount, completedCount } from '../../stores/jobStore.ts';
  import type { BranchInfo, Experiment } from '../../stores/jobStore.ts';
  import RunningPanel from '../research/RunningPanel.svelte';

  export let topic: string = '';
  export let progress: number = 0;
  export let sessionId: string = '';
  export let branches: BranchInfo[] = [];
  export let totalExperiments: number = 0;
  export let bestMetric: number = Infinity;
  export let experiments: { status: string }[] = [];

  const dispatch = createEventDispatcher<{
    stop: void;
    submit: { text: string; parentId: number | null };
    zoomIn: void;
  }>();

  function handleSubmit(e: CustomEvent<{ text: string; parentId: number | null }>) {
    dispatch('submit', e.detail);
  }

  function handleStop() {
    dispatch('stop');
  }

  function handleZoomIn() {
    dispatch('zoomIn');
  }
</script>

<div class="running-wrapper">
  <!-- Running Panel (from existing component) -->
  <div class="running-panel-container">
    <RunningPanel
      {topic}
      {progress}
      {sessionId}
      {branches}
      {totalExperiments}
      {bestMetric}
      {experiments}
      expandable={false}
      on:submit={handleSubmit}
    />
  </div>

  <!-- Studio-specific action bar -->
  <div class="running-actions">
    <button class="action-btn zoom-btn" on:click={handleZoomIn} title="Open Semantic Zoom">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Semantic Zoom
    </button>
    <button class="action-btn stop-btn" on:click={handleStop} title="Stop research and return to IDLE">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="3" y="3" width="10" height="10" rx="2" fill="currentColor"/></svg>
      Stop
    </button>
  </div>
</div>

<style>
  .running-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #1e1e2e;
    border-radius: 12px;
    overflow: hidden;
  }

  .running-panel-container {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }

  .running-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-top: 1px solid #313244;
    background: #181825;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    font: 500 11px/1 'SF Mono', 'Fira Code', monospace;
    padding: 7px 12px;
    border-radius: 6px;
    border: 1px solid #313244;
    background: transparent;
    color: #a6adc8;
    cursor: pointer;
    transition: all 150ms;
  }
  .action-btn:hover {
    background: rgba(205, 214, 244, 0.06);
    border-color: #45475a;
    color: #cdd6f4;
  }

  .zoom-btn {
    flex: 1;
  }

  .stop-btn {
    color: #f38ba8;
    border-color: rgba(243, 139, 168, 0.2);
  }
  .stop-btn:hover {
    background: rgba(243, 139, 168, 0.08);
    border-color: rgba(243, 139, 168, 0.4);
  }
</style>
