<script lang="ts">
  /**
   * StudioDashboard — Multi-model studio landing view.
   *
   * Sections:
   *   1. Header: "Magnet Studio" + New Research CTA
   *   2. Stats row (Active / Models / Experiments)
   *   3. Active Research — running jobs with progress
   *   4. My Models — grid cards (always visible, empty state)
   *   5. Quick Start Templates — 5 research type cards (compact)
   *   6. Quick Links — Advanced Config, Register GPU, Model Hub
   *
   * Design: f6ebf8e reference + Apple-grade glass-morphism.
   * Tone: terracotta accent, Playfair Display, JetBrains Mono.
   *
   * Events:
   *   newResearch: void — open blank Step1
   *   quickStart: { typeId: ResearchTypeId } — skip type grid, go to topic input
   *   resumeJob: void — navigate to running/complete job
   *   openModel: { modelId: string } — view published model
   *   viewModels: void — go to Models page
   */
  import { createEventDispatcher } from 'svelte';
  import { jobStore, completedCount } from '../../stores/jobStore.ts';
  import { modelPublishStore } from '../../stores/modelPublishStore.ts';
  import { RESEARCH_TYPES, LEVEL_LABELS, LEVEL_COLORS, type ResearchTypeId } from '../../data/researchTypes.ts';
  import PixelIcon from '../PixelIcon.svelte';

  const dispatch = createEventDispatcher<{
    newResearch: void;
    quickStart: { typeId: ResearchTypeId };
    resumeJob: void;
    openModel: { modelId: string };
    viewModels: void;
  }>();

  // ── Reactive data ──
  $: job = $jobStore;
  $: isRunning = job.phase === 'running' || job.phase === 'setup';
  $: isComplete = job.phase === 'complete';
  $: publishedModels = $modelPublishStore;
  $: hasActiveJob = isRunning || isComplete;
  $: jobProgress = job.progress ?? 0;
  $: templates = RESEARCH_TYPES;
</script>

<div class="dashboard">
  <!-- ═══ Header ═══ -->
  <div class="dash-header">
    <div class="dash-title-row">
      <div class="dash-icon-wrap">
        <PixelIcon type="research" size={22} />
      </div>
      <div class="dash-titles">
        <h1 class="dash-title">Magnet Studio</h1>
        <p class="dash-sub">Design, train, and deploy AI models on HOOT Protocol</p>
      </div>
    </div>
    <button class="new-btn" on:click={() => dispatch('newResearch')}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
      <span>New Research</span>
    </button>
  </div>

  <!-- ═══ Stats Row ═══ -->
  <div class="stats-row">
    <div class="stat-item">
      <span class="stat-val" class:accent={isRunning}>{isRunning ? '1' : '0'}</span>
      <span class="stat-label">Active</span>
    </div>
    <div class="stat-sep"></div>
    <div class="stat-item">
      <span class="stat-val">{publishedModels.length}</span>
      <span class="stat-label">Models</span>
    </div>
    <div class="stat-sep"></div>
    <div class="stat-item">
      <span class="stat-val">{$completedCount}</span>
      <span class="stat-label">Experiments</span>
    </div>
  </div>

  <!-- ═══ Active Research ═══ -->
  {#if hasActiveJob}
    <div class="section">
      <span class="section-label">Active Research</span>
      <button class="active-job-card" on:click={() => dispatch('resumeJob')}>
        <span class="aj-status" class:running={isRunning} class:done={isComplete}></span>
        <div class="aj-body">
          <span class="aj-topic">{job.topic || 'Untitled Research'}</span>
          <div class="aj-meta">
            {#if isRunning}
              <div class="aj-progress-wrap">
                <div class="aj-progress"><div class="aj-bar" style:width="{jobProgress}%"></div></div>
                <span class="aj-pct">{jobProgress}%</span>
              </div>
            {:else}
              <span class="aj-badge complete">Complete</span>
              {#if job.bestMetric < Infinity}
                <span class="aj-metric">{job.bestMetric.toFixed(4)}</span>
              {/if}
            {/if}
          </div>
        </div>
        <span class="aj-arrow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
      </button>
    </div>
  {/if}

  <!-- ═══ My Models ═══ -->
  <div class="section">
    <div class="section-header">
      <span class="section-label">My Models</span>
      {#if publishedModels.length > 0}
        <button class="section-action" on:click={() => dispatch('viewModels')}>View All →</button>
      {/if}
    </div>

    {#if publishedModels.length > 0}
      <div class="models-grid">
        {#each publishedModels as model, i (model.id)}
          <button
            class="model-card"
            on:click={() => dispatch('openModel', { modelId: model.id })}
            style:animation-delay="{i * 50}ms"
          >
            <div class="mc-top">
              <PixelIcon type="portfolio" size={14} />
              <span class="mc-state" class:active={model.state === 'NETWORK_ACTIVE'}>
                {model.state === 'NETWORK_ACTIVE' ? 'Live' : 'Paused'}
              </span>
            </div>
            <span class="mc-name">{model.name}</span>
            <span class="mc-meta">{model.vtr.accuracy.toFixed(3)} accuracy</span>
          </button>
        {/each}
      </div>
    {:else}
      <div class="empty-models">
        <PixelIcon type="portfolio" size={20} />
        <span class="em-text">No models yet</span>
        <span class="em-sub">Complete a research to deploy your first model</span>
      </div>
    {/if}
  </div>

  <!-- ═══ Quick Start Templates ═══ -->
  <div class="section">
    <span class="section-label">Quick Start</span>
    <div class="templates">
      {#each templates as t, i (t.id)}
        <button
          class="tmpl-card"
          on:click={() => dispatch('quickStart', { typeId: t.id })}
          style:--tmpl-accent={t.accentColor}
          style:animation-delay="{i * 40}ms"
        >
          <span class="tmpl-icon">
            <PixelIcon type={t.pixelIcon} size={16} />
          </span>
          <div class="tmpl-body">
            <span class="tmpl-name">{t.name}</span>
            <span class="tmpl-desc">{t.desc}</span>
          </div>
          <div class="tmpl-right">
            <span class="tmpl-level" style:color={LEVEL_COLORS[t.level]}>{LEVEL_LABELS[t.level]}</span>
            <span class="tmpl-time">{t.time}</span>
          </div>
        </button>
      {/each}
    </div>
  </div>

  <!-- ═══ Quick Links ═══ -->
  <div class="quick-links">
    <button class="quick-link" on:click={() => dispatch('viewModels')}>
      <PixelIcon type="grid" size={13} />
      <span>Model Hub</span>
    </button>
  </div>
</div>

<style>
  .dashboard {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 28px;
    padding: 32px 32px 100px;
    max-width: 680px;
    margin: 0 auto;
    width: 100%;
  }

  /* ── Header ── */
  .dash-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
  }
  .dash-title-row {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }
  .dash-icon-wrap {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(217, 119, 87, 0.08);
    color: var(--accent, #D97757);
    animation: breathe 3s ease-in-out infinite;
  }
  @keyframes breathe {
    0%, 100% { box-shadow: 0 0 0 0 transparent; }
    50% { box-shadow: 0 0 16px rgba(217, 119, 87, 0.12); }
  }
  .dash-titles {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .dash-title {
    margin: 0;
    font-family: var(--font-display, 'Playfair Display', serif);
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    letter-spacing: -0.01em;
    line-height: 1.2;
  }
  .dash-sub {
    margin: 0;
    font-size: 0.78rem;
    color: var(--text-secondary, #6b6560);
    line-height: 1.4;
  }

  .new-btn {
    appearance: none;
    border: none;
    background: var(--accent, #D97757);
    color: #fff;
    padding: 10px 22px;
    border-radius: 100px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 7px;
    transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 2px 12px rgba(217, 119, 87, 0.25);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .new-btn:hover {
    background: var(--accent-hover, #C4644A);
    box-shadow: 0 4px 20px rgba(217, 119, 87, 0.35);
    transform: translateY(-1px);
  }

  /* ── Stats row ── */
  .stats-row {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 16px 24px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border-subtle, #EDEAE5);
  }
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    flex: 1;
  }
  .stat-val {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-primary, #2D2D2D);
  }
  .stat-val.accent {
    color: var(--accent, #D97757);
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  .stat-label {
    font-size: 0.66rem;
    color: var(--text-muted, #9a9590);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 500;
  }
  .stat-sep {
    width: 1px;
    height: 24px;
    background: var(--border-subtle, #EDEAE5);
  }

  /* ── Shared section ── */
  .section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .section-label {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--text-muted, #9a9590);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .section-action {
    appearance: none; border: none; background: none;
    font-size: 0.68rem; font-weight: 600;
    color: var(--accent, #D97757);
    cursor: pointer; padding: 2px 0;
    transition: opacity 150ms;
  }
  .section-action:hover { opacity: 0.7; }

  @keyframes cardIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ═══ Active Research ═══ */
  .active-job-card {
    appearance: none;
    border: 1px solid var(--accent, #D97757);
    background: rgba(217, 119, 87, 0.03);
    border-radius: 14px;
    padding: 16px 18px;
    display: flex;
    align-items: center;
    gap: 14px;
    cursor: pointer;
    text-align: left;
    transition: all 240ms cubic-bezier(0.16, 1, 0.3, 1);
    animation: cardIn 600ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .active-job-card:hover {
    box-shadow: 0 4px 16px rgba(217, 119, 87, 0.08);
    transform: translateY(-1px);
    background: rgba(217, 119, 87, 0.05);
  }

  .aj-status {
    width: 10px; height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--text-muted, #9a9590);
  }
  .aj-status.running {
    background: var(--accent, #D97757);
    animation: pulse 1.5s ease-in-out infinite;
  }
  .aj-status.done {
    background: var(--green, #27864a);
  }

  .aj-body { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .aj-topic {
    font-size: 0.88rem; font-weight: 600;
    color: var(--text-primary, #2D2D2D);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .aj-meta { display: flex; align-items: center; gap: 10px; }
  .aj-progress-wrap { display: flex; align-items: center; gap: 8px; flex: 1; }
  .aj-progress {
    flex: 1; height: 4px; border-radius: 4px;
    background: rgba(217, 119, 87, 0.12); overflow: hidden;
  }
  .aj-bar {
    height: 100%; border-radius: 4px;
    background: var(--accent, #D97757);
    transition: width 300ms ease;
  }
  .aj-pct {
    font-family: var(--font-mono); font-size: 0.66rem;
    font-weight: 600; color: var(--accent, #D97757);
    min-width: 32px; text-align: right;
  }
  .aj-badge {
    font-family: var(--font-mono); font-size: 0.58rem;
    font-weight: 700; padding: 2px 8px; border-radius: 4px;
    letter-spacing: 0.04em;
  }
  .aj-badge.complete {
    background: rgba(39, 134, 74, 0.1);
    color: var(--green, #27864a);
  }
  .aj-metric {
    font-family: var(--font-mono); font-size: 0.72rem;
    font-weight: 600; color: var(--text-primary, #2D2D2D);
  }
  .aj-arrow {
    flex-shrink: 0; color: var(--accent, #D97757);
    opacity: 0.5; transition: all 200ms;
  }
  .active-job-card:hover .aj-arrow {
    opacity: 1; transform: translateX(2px);
  }

  /* ═══ My Models Grid ═══ */
  .models-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 8px;
  }
  .model-card {
    appearance: none;
    border: 1px solid var(--border, #E5E0DA);
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 14px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    cursor: pointer;
    text-align: left;
    transition: all 240ms cubic-bezier(0.16, 1, 0.3, 1);
    animation: cardIn 600ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
  }
  .model-card:hover {
    border-color: var(--accent, #D97757);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.88);
  }
  .mc-top { display: flex; justify-content: space-between; align-items: center; color: var(--text-muted, #9a9590); }
  .mc-state {
    font-family: var(--font-mono); font-size: 0.52rem;
    font-weight: 700; padding: 1px 6px; border-radius: 4px;
    letter-spacing: 0.04em;
    background: rgba(0,0,0,0.04); color: var(--text-muted, #9a9590);
  }
  .mc-state.active {
    background: rgba(39, 134, 74, 0.1);
    color: var(--green, #27864a);
  }
  .mc-name {
    font-size: 0.82rem; font-weight: 600;
    color: var(--text-primary, #2D2D2D);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .mc-meta {
    font-family: var(--font-mono); font-size: 0.62rem;
    color: var(--text-muted, #9a9590);
  }

  .empty-models {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 32px 16px;
    border: 1px dashed var(--border, #E5E0DA);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.4);
    color: var(--text-muted, #9a9590);
    text-align: center;
  }
  .em-text { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary, #6b6560); }
  .em-sub { font-size: 0.68rem; color: var(--text-muted, #9a9590); max-width: 240px; }

  /* ═══ Quick Start Templates ═══ */
  .templates {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .tmpl-card {
    appearance: none;
    border: 1px solid var(--border, #E5E0DA);
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 14px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 14px;
    cursor: pointer;
    text-align: left;
    transition: all 240ms cubic-bezier(0.16, 1, 0.3, 1);
    animation: cardIn 600ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
    position: relative;
    overflow: hidden;
  }
  .tmpl-card::before {
    content: '';
    position: absolute; left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--tmpl-accent, var(--accent));
    opacity: 0; transition: opacity 240ms;
  }
  .tmpl-card:hover {
    border-color: color-mix(in srgb, var(--tmpl-accent, var(--accent)) 40%, transparent);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.88);
  }
  .tmpl-card:hover::before { opacity: 1; }

  .tmpl-icon {
    flex-shrink: 0;
    width: 34px; height: 34px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    background: color-mix(in srgb, var(--tmpl-accent, var(--accent)) 10%, transparent);
    color: var(--tmpl-accent, var(--accent));
    transition: all 240ms;
  }
  .tmpl-card:hover .tmpl-icon {
    background: color-mix(in srgb, var(--tmpl-accent, var(--accent)) 16%, transparent);
    transform: scale(1.05);
  }

  .tmpl-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .tmpl-name {
    font-size: 0.84rem; font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    letter-spacing: -0.005em;
  }
  .tmpl-desc {
    font-size: 0.66rem; color: var(--text-muted, #9a9590);
    line-height: 1.35;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .tmpl-right {
    flex-shrink: 0;
    display: flex; flex-direction: column;
    align-items: flex-end; gap: 2px;
  }
  .tmpl-level {
    font-family: var(--font-mono); font-size: 0.56rem;
    font-weight: 700; letter-spacing: 0.04em;
  }
  .tmpl-time {
    font-family: var(--font-mono); font-size: 0.56rem;
    color: var(--text-muted, #9a9590);
  }

  /* ═══ Quick Links ═══ */
  .quick-links {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .quick-link {
    appearance: none;
    border: 1px solid var(--border, #E5E0DA);
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-radius: 100px;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--text-secondary, #6b6560);
    cursor: pointer;
    transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .quick-link:hover {
    border-color: var(--accent, #D97757);
    color: var(--accent, #D97757);
    background: rgba(255, 255, 255, 0.8);
  }

  @media (max-width: 640px) {
    .dashboard { padding: 20px 16px 80px; gap: 22px; }
    .dash-header { flex-direction: column; gap: 14px; }
    .dash-title { font-size: 1.35rem; }
    .dash-icon-wrap { width: 42px; height: 42px; border-radius: 12px; }
    .new-btn { align-self: stretch; justify-content: center; }
    .stats-row { gap: 14px; padding: 14px 16px; }
    .stat-val { font-size: 1rem; }
    .models-grid { grid-template-columns: 1fr 1fr; }
    .model-card { padding: 12px; }
    .tmpl-card { padding: 12px 14px; gap: 10px; }
    .tmpl-icon { width: 30px; height: 30px; }
  }
</style>
