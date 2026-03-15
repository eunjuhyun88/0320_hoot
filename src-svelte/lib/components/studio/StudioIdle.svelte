<script lang="ts">
  /**
   * StudioIdle — Quick Start home screen (matches production hoot-v2 quality).
   *
   * Primary CTA: preset cards (icon + difficulty + description + time + tags)
   * Secondary CTA: "Custom setup >" for advanced users
   * Running research hero: shown when a job is active
   * Activity cards: shown when user has models/nodes
   *
   * Events:
   *   startCreate: { topic?: string, presetId?: string } — select preset or free topic
   *   goToSetup: void — advanced config
   *   goToRunning: void — open running research
   *   navigate: { view: AppView } — navigate to another tab
   */
  import { createEventDispatcher } from 'svelte';
  import { dashboardStore } from '../../stores/dashboardStore.ts';
  import { jobStore } from '../../stores/jobStore.ts';
  import type { AppView } from '../../stores/router.ts';
  import PixelIcon from '../PixelIcon.svelte';

  const dispatch = createEventDispatcher<{
    startCreate: { topic?: string; presetId?: string };
    goToSetup: void;
    goToRunning: void;
    navigate: { view: AppView };
  }>();

  // ── Derived state ──
  $: isLoggedIn = $dashboardStore.isLoggedIn;
  $: runningCount = $dashboardStore.runningCount;
  $: hasRunningResearch = runningCount > 0;
  $: jobPhase = $jobStore.phase;
  $: jobTopic = $jobStore.topic;
  $: jobProgress = $jobStore.progress;

  // ── Quick Start preset cards ──
  interface QuickStartCard {
    id: string;
    presetId: string;
    icon: string;
    title: string;
    description: string;
    difficulty: 'Advanced' | 'Intermediate' | 'Beginner';
    time: string;
    tags: string[];
  }

  const quickStartCards: QuickStartCard[] = [
    {
      id: 'crypto_market',
      presetId: 'crypto_market',
      icon: '⚡',
      title: '암호화폐 시장 예측',
      description: '온체인 + 시장 데이터 + 감성 지표로 단기 가격 방향 예측',
      difficulty: 'Advanced',
      time: '~2h',
      tags: ['XGBoost', 'Ensemble', 'Optuna'],
    },
    {
      id: 'defi_risk',
      presetId: 'defi_risk',
      icon: '≡',
      title: 'DeFi 리스크 분류',
      description: 'TVL 변동, 감사 이력, 토큰 이코노믹스로 프로토콜 위험도 분류',
      difficulty: 'Intermediate',
      time: '~1h',
      tags: ['Stacking', 'Classification'],
    },
    {
      id: 'fraud_detection',
      presetId: 'fraud_detection',
      icon: '🔍',
      title: '이상거래 탐지',
      description: '거래 패턴, 네트워크 분석, 행동 피처로 사기 거래 식별',
      difficulty: 'Intermediate',
      time: '~1h',
      tags: ['CatBoost', 'SMOTE', 'F1'],
    },
    {
      id: 'time_series',
      presetId: 'time_series',
      icon: '📈',
      title: '시계열 예측',
      description: '추세 분해, 계절성 분석, 외부 변수 결합한 범용 시계열 모델',
      difficulty: 'Beginner',
      time: '~30m',
      tags: ['LightGBM', 'Kalman', 'RMSE'],
    },
  ];

  const difficultyColors: Record<string, string> = {
    Advanced: '#D97757',
    Intermediate: '#d4a017',
    Beginner: '#27864a',
  };

  function selectPreset(card: QuickStartCard) {
    dispatch('startCreate', { topic: card.title, presetId: card.presetId });
  }
</script>

<div class="studio-idle">
  <!-- Hero: Running research (takes priority) -->
  {#if hasRunningResearch && jobPhase === 'running'}
    <div class="idle-header">
      <h1 class="idle-title">Magnet Studio</h1>
    </div>
    <div class="idle-body">
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
        <span class="hero-cta">열기 →</span>
      </button>
    </div>
  {:else}
    <!-- Quick Start (default state) -->
    <div class="idle-header">
      <div class="header-left">
        <h1 class="idle-title">Magnet Studio</h1>
        <p class="idle-subtitle">BitNet + Nemotron + AutoResearch — 분산 AI 학습 네트워크</p>
      </div>
      <div class="header-stats">
        <div class="stat">
          <span class="stat-value">{$dashboardStore.networkSummary?.nodes ?? 0}</span>
          <span class="stat-label">NODES</span>
        </div>
        <div class="stat">
          <span class="stat-value">{$dashboardStore.networkSummary?.gpuMemory ?? '0'}<span class="stat-unit">GB</span></span>
          <span class="stat-label">VRAM</span>
        </div>
        <div class="stat accent">
          <span class="stat-value">{$dashboardStore.protocolSummary?.tvl ?? '0.0'}</span>
          <span class="stat-label">HOOT</span>
        </div>
      </div>
    </div>

    <div class="idle-body">
      <div class="section-header">
        <div>
          <h2 class="section-title">Quick Start</h2>
          <p class="section-sub">원클릭으로 AI 모델 연구를 시작하세요</p>
        </div>
        <button class="custom-setup-link" on:click={() => dispatch('goToSetup')}>
          Custom setup <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>

      <div class="cards-grid">
        {#each quickStartCards as card (card.id)}
          <button class="qs-card" on:click={() => selectPreset(card)}>
            <div class="qs-card-top">
              <span class="qs-icon">{card.icon}</span>
              <span class="qs-difficulty" style:color={difficultyColors[card.difficulty]}>
                <span class="qs-diff-dot" style:background={difficultyColors[card.difficulty]}></span>
                {card.difficulty}
              </span>
            </div>
            <h3 class="qs-title">{card.title}</h3>
            <p class="qs-desc">{card.description}</p>
            <div class="qs-card-bottom">
              <span class="qs-time">{card.time}</span>
              <div class="qs-tags">
                {#each card.tags as tag}
                  <span class="qs-tag">{tag}</span>
                {/each}
              </div>
            </div>
          </button>
        {/each}
      </div>

      <!-- Empty state hint -->
      {#if !hasRunningResearch}
        <div class="empty-hint">
          <PixelIcon type="sparkle" size={24} />
          <span>위에서 preset을 선택해서 첫 모델을 만들어보세요</span>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .studio-idle {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0 0 56px; /* space for compact dock */
    min-height: 0;
  }

  /* ═══ HEADER ═══ */
  .idle-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 28px 32px 0;
    gap: 20px;
  }
  .header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .idle-title {
    font-family: var(--font-display, 'Playfair Display', serif);
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    margin: 0;
  }
  .idle-subtitle {
    font-size: 0.72rem;
    color: var(--text-muted, #9a9590);
    margin: 0;
  }

  /* ── Header Stats ── */
  .header-stats {
    display: flex;
    gap: 20px;
    flex-shrink: 0;
  }
  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
  }
  .stat-value {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    font-variant-numeric: tabular-nums;
  }
  .stat.accent .stat-value { color: var(--accent, #D97757); }
  .stat-unit { font-size: 0.56rem; font-weight: 500; }
  .stat-label {
    font-family: var(--font-mono);
    font-size: 0.44rem;
    font-weight: 600;
    color: var(--text-muted, #9a9590);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  /* ═══ BODY ═══ */
  .idle-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px 32px;
    overflow-y: auto;
  }

  /* ── Section Header ── */
  .section-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }
  .section-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    margin: 0;
  }
  .section-sub {
    font-size: 0.72rem;
    color: var(--text-muted, #9a9590);
    margin: 2px 0 0;
  }
  .custom-setup-link {
    appearance: none;
    border: none;
    background: transparent;
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--text-secondary, #6b6560);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px 0;
    transition: color 140ms;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .custom-setup-link:hover { color: var(--accent, #D97757); }

  /* ═══ QUICK START CARDS ═══ */
  .cards-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .qs-card {
    appearance: none;
    border: 1px solid var(--border, #E5E0DA);
    background: var(--surface, #fff);
    border-radius: 14px;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    text-align: left;
    cursor: pointer;
    transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
    min-height: 160px;
  }
  .qs-card:hover {
    border-color: var(--accent, #D97757);
    box-shadow: 0 4px 20px rgba(217, 119, 87, 0.08);
    transform: translateY(-2px);
  }

  /* Card top: icon + difficulty badge */
  .qs-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .qs-icon {
    font-size: 1.4rem;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-warm, #FAF9F7);
    border-radius: 10px;
  }
  .qs-difficulty {
    font-size: 0.6rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.02);
  }
  .qs-diff-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* Card content */
  .qs-title {
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    margin: 0;
    line-height: 1.3;
  }
  .qs-desc {
    font-size: 0.68rem;
    color: var(--text-secondary, #6b6560);
    margin: 0;
    line-height: 1.5;
    flex: 1;
  }

  /* Card bottom: time + tags */
  .qs-card-bottom {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: auto;
  }
  .qs-time {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.6rem;
    font-weight: 500;
    color: var(--text-muted, #9a9590);
  }
  .qs-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    margin-left: auto;
  }
  .qs-tag {
    font-family: var(--font-mono);
    font-size: 0.52rem;
    font-weight: 500;
    color: var(--text-muted, #9a9590);
    background: var(--bg-warm, #FAF9F7);
    padding: 2px 7px;
    border-radius: 4px;
    border: 1px solid var(--border-subtle, #EDEAE5);
  }

  /* ═══ EMPTY HINT ═══ */
  .empty-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 20px;
    color: var(--text-muted, #9a9590);
    font-size: 0.72rem;
  }

  /* ═══ HERO RUNNING ═══ */
  .hero-running {
    appearance: none;
    border: 1.5px solid var(--accent, #D97757);
    background: var(--surface, #fff);
    border-radius: 14px;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    cursor: pointer;
    transition: all 200ms;
    text-align: left;
    width: 100%;
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
    font-family: var(--font-mono);
    font-size: 0.58rem;
    font-weight: 700;
    color: var(--accent, #D97757);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .hero-topic { font-size: 1.1rem; font-weight: 600; color: var(--text-primary, #2D2D2D); }
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

  /* ═══ RESPONSIVE ═══ */
  @media (max-width: 640px) {
    .idle-header {
      padding: 16px 16px 0;
      flex-direction: column;
      gap: 12px;
    }
    .header-stats { align-self: flex-start; }
    .idle-body { padding: 16px; }
    .idle-title { font-size: 1.3rem; }
    .cards-grid { grid-template-columns: 1fr; }
    .qs-card { min-height: 120px; }
  }
</style>
