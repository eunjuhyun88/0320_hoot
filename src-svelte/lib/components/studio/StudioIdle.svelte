<script lang="ts">
  /**
   * StudioIdle — Activity-First home screen.
   *
   * Guest: Search bar + community live mini-view
   * Member: Running research hero + activity cards + urgent banners
   * If member has no activity, shows search bar like Guest.
   *
   * Events:
   *   startCreate: { topic?: string } — user wants to create new research
   *   goToSetup: void — user wants advanced setup
   *   goToRunning: void — user clicked running research hero
   *   navigate: { view: AppView } — navigate to another tab
   */
  import { createEventDispatcher } from 'svelte';
  import { dashboardStore } from '../../stores/dashboardStore.ts';
  import { jobStore } from '../../stores/jobStore.ts';
  import type { AppView } from '../../stores/router.ts';
  import ActivityCard from './ActivityCard.svelte';
  import PixelIcon from '../PixelIcon.svelte';

  const dispatch = createEventDispatcher<{
    startCreate: { topic?: string };
    goToSetup: void;
    goToRunning: void;
    navigate: { view: AppView };
  }>();

  let searchQuery = '';
  let dropdownOpen = false;

  // ── Derived state ──
  $: isLoggedIn = $dashboardStore.isLoggedIn;
  $: runningCount = $dashboardStore.runningCount;
  $: hasRunningResearch = runningCount > 0;
  $: jobPhase = $jobStore.phase;
  $: jobTopic = $jobStore.topic;
  $: jobProgress = $jobStore.progress;

  // Activity card visibility
  $: hasModels = ($dashboardStore.modelsSummary?.count ?? 0) > 0;
  $: hasNodes = ($dashboardStore.networkSummary?.nodes ?? 0) > 0;
  $: hasAnyActivity = isLoggedIn && (hasRunningResearch || hasModels);

  // Topic suggestions
  const suggestions = [
    'bitcoin prediction',
    'spam detection',
    'sentiment analysis',
    'image classification',
    'fraud detection',
    'NLP translation',
  ];

  function handleSearch() {
    if (!searchQuery.trim()) return;
    dispatch('startCreate', { topic: searchQuery.trim() });
    searchQuery = '';
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  }

  function selectSuggestion(topic: string) {
    dispatch('startCreate', { topic });
  }

  function toggleDropdown() {
    dropdownOpen = !dropdownOpen;
  }

  function handleNewClick(mode: 'create' | 'setup') {
    dropdownOpen = false;
    if (mode === 'setup') {
      dispatch('goToSetup');
    } else {
      dispatch('startCreate', {});
    }
  }
</script>

<div class="studio-idle">
  <!-- Header -->
  <div class="idle-header">
    <h1 class="idle-title">Magnet Studio</h1>
    {#if isLoggedIn}
      <div class="new-dropdown-wrap">
        <button class="new-btn" on:click={toggleDropdown}>
          <span>+ New</span>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
        {#if dropdownOpen}
          <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
          <div class="new-dropdown" on:click|stopPropagation>
            <button class="dd-item" on:click={() => handleNewClick('create')}>
              <span class="dd-label">직접 입력</span>
              <span class="dd-hint">토픽과 AI 추천으로 시작</span>
            </button>
            <button class="dd-item" on:click={() => handleNewClick('setup')}>
              <span class="dd-label">고급 설정</span>
              <span class="dd-hint">브랜치, 데이터, 평가 직접 설정</span>
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <div class="idle-body">
    <!-- Hero: Running research (Member with active job) -->
    {#if hasRunningResearch && jobPhase === 'running'}
      <button class="hero-running" on:click={() => dispatch('goToRunning')}>
        <div class="hero-status">
          <span class="hero-dot pulse"></span>
          <span class="hero-phase">RUNNING</span>
        </div>
        <div class="hero-topic">{jobTopic || 'Research'}</div>
        <div class="hero-progress-bar"><div class="hero-progress-fill" style="width: {jobProgress}%"></div></div>
        <div class="hero-meta">
          <span>{jobProgress}%</span>
          <span class="hero-sep">·</span>
          <span>ETA calculating...</span>
        </div>
        <span class="hero-cta">열기 &rarr;</span>
      </button>
    {:else}
      <!-- Search bar (Guest or Member with no running research) -->
      <div class="search-section">
        <div class="search-bar">
          <span class="search-icon">
            <PixelIcon type="sparkle" size={18} />
          </span>
          <input
            type="text"
            class="search-input"
            placeholder="무엇을 연구하고 싶으세요?"
            bind:value={searchQuery}
            on:keydown={handleKeyDown}
          />
          <button class="search-submit" on:click={handleSearch} disabled={!searchQuery.trim()} aria-label="Search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
        <div class="suggestions">
          {#each suggestions as s}
            <button class="suggestion-chip" on:click={() => selectSuggestion(s)}>{s}</button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Activity cards (Member only, each only if active) -->
    {#if isLoggedIn && hasAnyActivity}
      <div class="activity-section">
        {#if hasRunningResearch && jobPhase !== 'running'}
          <ActivityCard
            icon="research"
            label="실행 중인 연구"
            value="{runningCount}"
            subtitle="running"
            accentColor="var(--accent, #D97757)"
            on:click={() => dispatch('goToRunning')}
          />
        {/if}
        {#if hasModels}
          <ActivityCard
            icon="grid"
            label="모델"
            value="{$dashboardStore.modelsSummary?.count ?? 0}"
            subtitle="active models"
            accentColor="#2980b9"
            on:click={() => dispatch('navigate', { view: 'models' })}
          />
        {/if}
        {#if hasNodes}
          <ActivityCard
            icon="globe"
            label="네트워크"
            value="{$dashboardStore.networkSummary?.nodes ?? 0} nodes"
            subtitle="online"
            accentColor="var(--green, #27864a)"
            on:click={() => dispatch('navigate', { view: 'network' })}
          />
        {/if}
      </div>
    {/if}

    <!-- Community live mini-view (always shown for Guest, below cards for Member) -->
    {#if !isLoggedIn || !hasAnyActivity}
      <div class="community-section">
        <span class="community-label">지금 커뮤니티에서</span>
        <div class="community-card">
          <div class="cc-row">
            <span class="cc-dot active"></span>
            <span class="cc-name">spam-detect-v3</span>
            <span class="cc-status">실험 중</span>
            <span class="cc-metric">0.94 F1</span>
          </div>
          <div class="cc-progress"><div class="cc-fill" style="width: 78%"></div></div>
          <div class="cc-meta">78% · by 0x4a2...</div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .studio-idle {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0 0 80px; /* space for dock */
    min-height: 0;
  }

  /* ── Header ── */
  .idle-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 32px 0;
  }
  .idle-title {
    font-family: var(--font-display, 'Playfair Display', serif);
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    margin: 0;
  }

  /* ── New button + dropdown ── */
  .new-dropdown-wrap { position: relative; }
  .new-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 8px;
    border: 1px solid var(--border, #E5E0DA);
    background: var(--surface, #fff);
    font-size: 0.78rem; font-weight: 600;
    color: var(--text-primary, #2D2D2D);
    cursor: pointer; transition: all 140ms;
  }
  .new-btn:hover { border-color: var(--accent, #D97757); color: var(--accent, #D97757); }
  .new-dropdown {
    position: absolute; top: calc(100% + 8px); right: 0;
    min-width: 200px; background: var(--surface, #fff);
    border: 1px solid var(--border, #E5E0DA);
    border-radius: 10px; box-shadow: var(--shadow-lg);
    overflow: hidden; z-index: var(--z-dropdown, 100);
    animation: dropIn 120ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes dropIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
  .dd-item {
    appearance: none; border: none; background: transparent;
    display: flex; flex-direction: column; gap: 2px;
    padding: 10px 14px; width: 100%; text-align: left;
    cursor: pointer; transition: background 100ms;
  }
  .dd-item:hover { background: rgba(0, 0, 0, 0.03); }
  .dd-item + .dd-item { border-top: 1px solid var(--border-subtle, #EDEAE5); }
  .dd-label { font-size: 0.78rem; font-weight: 600; color: var(--text-primary, #2D2D2D); }
  .dd-hint { font-size: 0.64rem; color: var(--text-muted, #9a9590); }

  /* ── Body ── */
  .idle-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 24px 32px;
    overflow-y: auto;
  }

  /* ── Search Section ── */
  .search-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 32px 0;
  }
  .search-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    max-width: 560px;
    padding: 12px 16px;
    background: var(--surface, #fff);
    border: 1.5px solid var(--border, #E5E0DA);
    border-radius: 14px;
    box-shadow: var(--shadow-sm);
    transition: all 200ms;
  }
  .search-bar:focus-within {
    border-color: var(--accent, #D97757);
    box-shadow: 0 0 0 3px rgba(217, 119, 87, 0.1);
  }
  .search-icon { color: var(--accent, #D97757); display: flex; flex-shrink: 0; }
  .search-input {
    flex: 1; appearance: none; border: none; background: transparent;
    font-size: 0.92rem; color: var(--text-primary, #2D2D2D);
    outline: none;
  }
  .search-input::placeholder { color: var(--text-muted, #9a9590); }
  .search-submit {
    appearance: none; border: none; background: transparent;
    color: var(--text-muted, #9a9590); cursor: pointer;
    padding: 4px; border-radius: 6px; transition: all 140ms;
    display: flex;
  }
  .search-submit:hover:not(:disabled) { color: var(--accent, #D97757); background: rgba(217, 119, 87, 0.06); }
  .search-submit:disabled { opacity: 0.3; cursor: default; }

  .suggestions {
    display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;
  }
  .suggestion-chip {
    appearance: none; border: 1px solid var(--border, #E5E0DA);
    background: var(--surface, #fff); padding: 5px 12px;
    border-radius: 14px; font-size: 0.72rem; font-weight: 500;
    color: var(--text-secondary, #6b6560); cursor: pointer;
    transition: all 120ms;
  }
  .suggestion-chip:hover { border-color: var(--accent, #D97757); color: var(--accent, #D97757); }

  /* ── Hero Running Research ── */
  .hero-running {
    appearance: none; border: 1.5px solid var(--accent, #D97757);
    background: var(--surface, #fff);
    border-radius: 14px; padding: 16px 20px;
    display: flex; flex-direction: column; gap: 8px;
    cursor: pointer; transition: all 200ms;
    text-align: left; width: 100%;
  }
  .hero-running:hover {
    box-shadow: var(--card-glow-hover);
    transform: translateY(-1px);
  }
  .hero-status { display: flex; align-items: center; gap: 6px; }
  .hero-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent, #D97757); }
  .hero-dot.pulse { animation: dotPulse 1.5s ease-in-out infinite; }
  @keyframes dotPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  .hero-phase {
    font-family: var(--font-mono); font-size: 0.58rem; font-weight: 700;
    color: var(--accent, #D97757); text-transform: uppercase; letter-spacing: 0.06em;
  }
  .hero-topic {
    font-size: 1.1rem; font-weight: 600; color: var(--text-primary, #2D2D2D);
  }
  .hero-progress-bar {
    width: 100%; height: 4px; border-radius: 2px;
    background: var(--border-subtle, #EDEAE5); overflow: hidden;
  }
  .hero-progress-fill {
    height: 100%; border-radius: 2px;
    background: var(--accent, #D97757); transition: width 300ms ease;
  }
  .hero-meta {
    display: flex; gap: 4px; align-items: center;
    font-family: var(--font-mono); font-size: 0.68rem;
    color: var(--text-muted, #9a9590); font-variant-numeric: tabular-nums;
  }
  .hero-sep { color: var(--border, #E5E0DA); }
  .hero-cta {
    font-size: 0.72rem; font-weight: 600; color: var(--accent, #D97757);
    align-self: flex-end;
  }

  /* ── Activity Cards ── */
  .activity-section {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
  }

  /* ── Community Section ── */
  .community-section {
    display: flex; flex-direction: column; gap: 8px;
  }
  .community-label {
    font-family: var(--font-mono); font-size: 0.62rem; font-weight: 600;
    color: var(--text-muted, #9a9590); text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .community-card {
    padding: 12px 14px; border-radius: 10px;
    border: 1px solid var(--border-subtle, #EDEAE5);
    background: var(--surface, #fff);
    display: flex; flex-direction: column; gap: 6px;
  }
  .cc-row { display: flex; align-items: center; gap: 8px; }
  .cc-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--text-muted, #9a9590);
  }
  .cc-dot.active { background: var(--green, #27864a); animation: dotPulse 2s ease infinite; }
  .cc-name {
    font-family: var(--font-mono); font-size: 0.78rem; font-weight: 600;
    color: var(--text-primary, #2D2D2D);
  }
  .cc-status {
    font-size: 0.64rem; color: var(--accent, #D97757); font-weight: 500;
  }
  .cc-metric {
    margin-left: auto; font-family: var(--font-mono);
    font-size: 0.72rem; font-weight: 700; color: var(--green, #27864a);
  }
  .cc-progress {
    width: 100%; height: 3px; border-radius: 2px;
    background: var(--border-subtle, #EDEAE5); overflow: hidden;
  }
  .cc-fill { height: 100%; background: var(--green, #27864a); border-radius: 2px; }
  .cc-meta {
    font-family: var(--font-mono); font-size: 0.58rem;
    color: var(--text-muted, #9a9590);
  }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .idle-header { padding: 16px 16px 0; }
    .idle-body { padding: 16px 16px; }
    .idle-title { font-size: 1.3rem; }
    .search-section { padding: 16px 0; }
    .activity-section { grid-template-columns: repeat(2, 1fr); }
  }
</style>
