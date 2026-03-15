<script lang="ts">
  /**
   * HomePage — Centered, purpose-driven portal
   *
   * Hybrid of:
   * - wizardly-ptolemy: centered single-column + feature card portals
   * - relaxed-engelbart: context-aware status (running/complete/idle)
   *
   * Layout: Centered max-width column with:
   * 1. Research hero (running/complete/idle CTA)
   * 2. Feature portal cards (Studio, Models, Network, Protocol)
   * 3. Recent activity log
   */
  import { router } from '../stores/router.ts';
  import { studioStore } from '../stores/studioStore.ts';
  import { dashboardStore } from '../stores/dashboardStore.ts';
  import { jobStore } from '../stores/jobStore.ts';
  import { modelPublishStore } from '../stores/modelPublishStore.ts';
  import { hasGpuNode } from '../stores/nodeStore.ts';
  import { wallet, WALLET_OPTIONS } from '../stores/walletStore.ts';
  import PixelIcon from '../components/PixelIcon.svelte';
  import GPUOnboardWizard from '../components/studio/GPUOnboardWizard.svelte';

  // ── Guest state ──
  let guestSearchTopic = '';
  const wallets = WALLET_OPTIONS;

  function handleGuestSearch() {
    if (!guestSearchTopic.trim()) return;
    studioStore.startCreate(guestSearchTopic.trim());
    router.navigate('studio');
  }

  function handleGuestKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleGuestSearch();
  }

  // ── Derived state ──
  $: isLoggedIn = $wallet.connected;
  $: jobPhase = $jobStore.phase;
  $: jobTopic = $jobStore.topic;
  $: jobProgress = $jobStore.progress;
  $: isRunning = jobPhase === 'running' || jobPhase === 'setup';
  $: isComplete = jobPhase === 'complete';
  $: bestMetric = $jobStore.bestMetric;
  $: totalExperiments = $jobStore.totalExperiments ?? 0;
  $: completedExperiments = $jobStore.experiments?.length ?? 0;

  // ── ETA ──
  $: runEta = (() => {
    if (!isRunning) return '';
    const p = jobProgress;
    if (p >= 95) return '< 1m';
    const remaining = Math.round((100 - p) / 15);
    return `~${Math.max(remaining, 1)}m`;
  })();

  // ── Dashboard data ──
  $: gpuWorkers = $dashboardStore.networkSummary?.activeWorkers ?? 0;
  $: nodesCount = $dashboardStore.networkSummary?.nodes ?? 0;
  $: modelsCount = $dashboardStore.modelsSummary?.count ?? 0;
  $: earningsValue = $dashboardStore.protocolSummary?.tvl ?? '$0';
  $: trustScore = $dashboardStore.protocolSummary?.trustScore ?? 0;

  // ── Templates ──
  const templates = [
    { id: 'crypto_market', icon: '⚡', title: 'Crypto Market Prediction', time: '~2h', diff: 'Advanced', color: '#D97757' },
    { id: 'defi_risk', icon: '≡', title: 'DeFi Risk Classification', time: '~1h', diff: 'Intermediate', color: '#d4a017' },
    { id: 'fraud_detection', icon: '🔍', title: 'Fraud Detection', time: '~1h', diff: 'Intermediate', color: '#d4a017' },
    { id: 'time_series', icon: '📈', title: 'Time Series Forecasting', time: '~30m', diff: 'Beginner', color: '#27864a' },
  ];

  function selectTemplate(t: typeof templates[0]) {
    studioStore.startCreate(t.title);
    studioStore.setPreset(t.id);
    studioStore.goToStep2(t.title);
    router.navigate('studio');
  }

  // ── GPU Wizard ──
  let showGpuWizard = false;

  // ── Models ──
  $: myModels = $modelPublishStore.slice(0, 3);
  $: hasMyModels = myModels.length > 0;

  // ── Activity ──
  $: recentEvents = ($dashboardStore.events ?? []).slice(0, 6);

  const TYPE_COLORS: Record<string, string> = {
    SYS: '#D97757', NET: '#2980b9', JOB: '#27864a', EXP: '#d4a017', WARN: '#c0392b',
  };

  function fmtTime(ts: number): string {
    return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  // ── Accordion state ──
  let openCards: Record<string, boolean> = { studio: true, models: false, network: false, protocol: false };
  function toggleCard(id: string) {
    openCards[id] = !openCards[id];
    openCards = openCards;
  }

  // ── Navigation helpers ──
  function goToRunning() {
    studioStore.startRunning();
    router.navigate('studio');
  }

  function startNew() {
    studioStore.startCreate();
    router.navigate('studio');
  }
</script>

<div class="home-page">
  {#if isLoggedIn}
  <!-- ═══ MEMBER VIEW ═══ -->
  <div class="home-center">

    <!-- ── Research Hero ── -->
    {#if isRunning}
      <button class="hero hero-running" on:click={goToRunning}>
        <div class="hero-top">
          <span class="hero-dot pulse"></span>
          <span class="hero-badge">LIVE</span>
          <span class="hero-topic">{jobTopic || 'Research'}</span>
          <span class="hero-open">열기 →</span>
        </div>
        <div class="hero-pbar"><div class="hero-pfill" style="width:{jobProgress}%"></div></div>
        <div class="hero-meta">
          <span>{jobProgress}%</span>
          <span class="meta-sep">·</span>
          <span>ETA {runEta}</span>
          <span class="meta-sep">·</span>
          <span>{completedExperiments}/{totalExperiments} experiments</span>
        </div>
      </button>
    {:else if isComplete}
      <div class="hero hero-complete">
        <div class="hero-top">
          <span class="hc-check">✓</span>
          <div class="hc-info">
            <span class="hc-label">Research Complete</span>
            <span class="hc-topic">{jobTopic}</span>
          </div>
          {#if bestMetric < Infinity}
            <span class="hc-metric">{bestMetric.toFixed(4)}</span>
          {/if}
        </div>
        <div class="hc-actions">
          <button class="hc-btn" on:click={() => router.navigate('studio')}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polygon points="5 3 19 12 5 21" fill="currentColor"/></svg>
            결과 보기
          </button>
          <button class="hc-btn hc-primary" on:click={() => { studioStore.goToPublish(); router.navigate('studio'); }}>
            발행 →
          </button>
        </div>
      </div>
    {:else}
      <button class="hero hero-idle" on:click={startNew}>
        <PixelIcon type="sparkle" size={18} />
        <div class="hero-idle-text">
          <span class="hero-idle-title">새 연구 시작</span>
          <span class="hero-idle-sub">AI가 자동으로 데이터 수집, 모델 학습, 최적화를 수행합니다</span>
        </div>
        <span class="hero-idle-arrow">→</span>
      </button>
    {/if}

    <!-- ═══ Feature Portal Cards ═══ -->

    <!-- 🔬 Magnet Studio -->
    <div class="card" class:card-open={openCards.studio}>
      <button class="card-header" on:click={() => toggleCard('studio')}>
        <span class="card-icon">🔬</span>
        <span class="card-name">Magnet Studio</span>
        <span class="card-desc">연구 설계 및 실행</span>
        <span class="card-toggle">{openCards.studio ? '−' : '+'}</span>
      </button>
      {#if openCards.studio}
        <div class="card-body">
          <div class="tpl-grid">
            {#each templates as t (t.id)}
              <button class="tpl-card" on:click={() => selectTemplate(t)}>
                <span class="tpl-icon">{t.icon}</span>
                <span class="tpl-name">{t.title}</span>
                <div class="tpl-meta">
                  <span class="tpl-time">{t.time}</span>
                  <span class="tpl-diff" style:color={t.color}>{t.diff}</span>
                </div>
              </button>
            {/each}
          </div>
          <div class="card-footer">
            <button class="cf-link" on:click={startNew}>+ 직접 만들기</button>
            <button class="cf-link" on:click={() => { studioStore.goToSetup(); router.navigate('studio'); }}>커스텀 설정 →</button>
          </div>
        </div>
      {/if}
    </div>

    <!-- 📦 Models -->
    <div class="card" class:card-open={openCards.models}>
      <button class="card-header" on:click={() => toggleCard('models')}>
        <span class="card-icon">📦</span>
        <span class="card-name">Models</span>
        <span class="card-stat">{modelsCount}</span>
        <span class="card-desc">학습 및 배포된 모델</span>
        <span class="card-toggle">{openCards.models ? '−' : '+'}</span>
      </button>
      {#if openCards.models}
        <div class="card-body">
          {#if hasMyModels}
            <div class="model-list">
              {#each myModels as model (model.id)}
                <button class="model-row" on:click={() => router.navigate('models')}>
                  <span class="mdot" class:mdot-active={model.state === 'NETWORK_ACTIVE'}></span>
                  <span class="mname">{model.name}</span>
                  <span class="mstate">{model.state === 'NETWORK_ACTIVE' ? 'ACTIVE' : model.state}</span>
                  {#if model.poolA && model.poolA.creator > 0}
                    <span class="mearn">+{model.poolA.creator.toFixed(1)}H</span>
                  {/if}
                </button>
              {/each}
            </div>
          {:else}
            <div class="card-empty">
              <span>아직 모델이 없습니다</span>
            </div>
          {/if}
          <div class="card-footer">
            <button class="cf-link" on:click={() => router.navigate('models')}>모델 허브 보기 →</button>
          </div>
        </div>
      {/if}
    </div>

    <!-- ⚡ GPU Network -->
    <div class="card" class:card-open={openCards.network}>
      <button class="card-header" on:click={() => toggleCard('network')}>
        <span class="card-icon">⚡</span>
        <span class="card-name">GPU Network</span>
        <span class="card-stat">{nodesCount}</span>
        <span class="card-desc">분산 GPU 컴퓨팅</span>
        <span class="card-toggle">{openCards.network ? '−' : '+'}</span>
      </button>
      {#if openCards.network}
        <div class="card-body">
          <div class="net-stats">
            <div class="ns-item">
              <span class="ns-val">{nodesCount}</span>
              <span class="ns-lbl">Nodes</span>
            </div>
            <div class="ns-item">
              <span class="ns-val" style:color="var(--green, #27864a)">{gpuWorkers}</span>
              <span class="ns-lbl">Active</span>
            </div>
          </div>
          <div class="card-footer">
            {#if $hasGpuNode}
              <button class="cf-link" on:click={() => router.navigate('network')}>네트워크 보기 →</button>
            {:else}
              <button class="cf-link cf-accent" on:click={() => { showGpuWizard = true; }}>GPU 참여하기 →</button>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- 📊 Protocol -->
    <div class="card" class:card-open={openCards.protocol}>
      <button class="card-header" on:click={() => toggleCard('protocol')}>
        <span class="card-icon">📊</span>
        <span class="card-name">Protocol</span>
        <span class="card-stat">{earningsValue}</span>
        <span class="card-desc">토큰 이코노미 & 거버넌스</span>
        <span class="card-toggle">{openCards.protocol ? '−' : '+'}</span>
      </button>
      {#if openCards.protocol}
        <div class="card-body">
          <div class="net-stats">
            <div class="ns-item">
              <span class="ns-val">{earningsValue}</span>
              <span class="ns-lbl">TVL</span>
            </div>
            <div class="ns-item">
              <span class="ns-val">{trustScore}</span>
              <span class="ns-lbl">Trust</span>
            </div>
          </div>
          <div class="card-footer">
            <button class="cf-link" on:click={() => router.navigate('protocol')}>프로토콜 보기 →</button>
          </div>
        </div>
      {/if}
    </div>

    <!-- ── Recent Activity ── -->
    {#if recentEvents.length > 0}
      <div class="activity-section">
        <span class="activity-title">RECENT ACTIVITY</span>
        <div class="activity-list">
          {#each recentEvents as ev (ev.id)}
            <div class="ev-row">
              <span class="ev-time">{fmtTime(ev.timestamp)}</span>
              <span class="ev-type" style:color={TYPE_COLORS[ev.type] || '#999'}
                    style:background="color-mix(in srgb, {TYPE_COLORS[ev.type] || 'gray'} 8%, transparent)">
                {ev.type}
              </span>
              <span class="ev-msg">{ev.message}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

  </div>

  {:else}
  <!-- ═══ GUEST VIEW ═══ -->
  <div class="guest-center">
    <div class="guest-hero">
      <h1 class="guest-title">What would you<br/>like to research?</h1>
      <p class="guest-sub">AI automatically handles data collection,<br/>model training, and optimization</p>
      <div class="guest-search">
        <input
          class="gs-input"
          type="text"
          placeholder="e.g. Crypto market prediction..."
          bind:value={guestSearchTopic}
          on:keydown={handleGuestKeydown}
        />
        <button class="gs-btn" on:click={handleGuestSearch}>→</button>
      </div>
    </div>

    <div class="guest-steps">
      {#each [
        { n: '1', t: 'Enter a topic', d: 'Describe what to research' },
        { n: '2', t: 'AI explores', d: 'Distributed GPU training' },
        { n: '3', t: 'Ship a model', d: 'Deploy and earn rewards' },
      ] as step}
        <div class="gstep">
          <span class="gstep-n">{step.n}</span>
          <div class="gstep-text">
            <span class="gstep-t">{step.t}</span>
            <span class="gstep-d">{step.d}</span>
          </div>
        </div>
      {/each}
    </div>

    <!-- Public Templates Card -->
    <div class="card">
      <div class="card-header card-header-static">
        <span class="card-icon">🔬</span>
        <span class="card-name">Public Research Templates</span>
      </div>
      <div class="card-body">
        <div class="tpl-grid">
          {#each templates as t (t.id)}
            <button class="tpl-card" on:click={() => selectTemplate(t)}>
              <span class="tpl-icon">{t.icon}</span>
              <span class="tpl-name">{t.title}</span>
              <div class="tpl-meta">
                <span class="tpl-time">{t.time}</span>
                <span class="tpl-diff" style:color={t.color}>{t.diff}</span>
              </div>
            </button>
          {/each}
        </div>
      </div>
    </div>

    <div class="guest-wallet">
      <span class="gw-label">Connect wallet to start</span>
      <div class="gw-btns">
        {#each wallets as w}
          <button class="gw-btn" on:click={() => wallet.connect(w.name)}>
            <span class="gw-icon">{w.icon}</span>
            <span>{w.name}</span>
          </button>
        {/each}
      </div>
    </div>
  </div>
  {/if}
</div>

{#if showGpuWizard}
  <GPUOnboardWizard
    on:close={() => { showGpuWizard = false; }}
    on:complete={() => { showGpuWizard = false; router.navigate('network'); }}
  />
{/if}

<style>
  /* ═══ PAGE SHELL ═══ */
  .home-page {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* ═══ MEMBER: Centered Column ═══ */
  .home-center {
    max-width: 680px;
    width: 100%;
    margin: 0 auto;
    padding: 24px 20px 100px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* ═══ HERO STATES ═══ */
  .hero {
    border-radius: 14px;
    padding: 16px 18px;
    width: 100%;
    text-align: left;
  }

  /* Running */
  .hero-running {
    appearance: none;
    border: 1.5px solid var(--accent, #D97757);
    background: linear-gradient(135deg, rgba(217,119,87,0.03), rgba(217,119,87,0.07));
    cursor: pointer;
    display: flex; flex-direction: column; gap: 10px;
    transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .hero-running:hover { box-shadow: 0 6px 24px rgba(217,119,87,0.12); transform: translateY(-1px); }
  .hero-top { display: flex; align-items: center; gap: 8px; }
  .hero-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent, #D97757); flex-shrink: 0; }
  .hero-dot.pulse { animation: pulse 1.5s ease-in-out infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
  .hero-badge { font-family: var(--font-mono); font-size: 0.46rem; font-weight: 700; color: #fff; background: var(--accent); padding: 2px 6px; border-radius: 4px; letter-spacing: 0.08em; }
  .hero-topic { font-size: 0.85rem; font-weight: 600; color: var(--text-primary, #2D2D2D); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hero-open { font-family: var(--font-mono); font-size: 0.6rem; font-weight: 600; color: var(--accent); flex-shrink: 0; }
  .hero-pbar { height: 3px; border-radius: 2px; background: rgba(217,119,87,0.12); overflow: hidden; }
  .hero-pfill { height: 100%; border-radius: 2px; background: var(--accent); transition: width 300ms ease; }
  .hero-meta { display: flex; align-items: center; gap: 5px; font-family: var(--font-mono); font-size: 0.56rem; color: var(--text-muted, #9a9590); font-variant-numeric: tabular-nums; }
  .meta-sep { color: var(--border, #E5E0DA); }

  /* Complete */
  .hero-complete {
    border: 1.5px solid rgba(39,134,74,0.2);
    background: linear-gradient(135deg, rgba(39,134,74,0.02), rgba(166,227,161,0.05));
    display: flex; flex-direction: column; gap: 12px;
  }
  .hc-check { width: 24px; height: 24px; border-radius: 50%; background: var(--green, #27864a); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
  .hc-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .hc-label { font-family: var(--font-mono); font-size: 0.48rem; font-weight: 700; color: var(--green); text-transform: uppercase; letter-spacing: 0.06em; }
  .hc-topic { font-size: 0.82rem; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hc-metric { font-family: var(--font-mono); font-size: 1.1rem; font-weight: 800; color: var(--text-primary); font-variant-numeric: tabular-nums; flex-shrink: 0; }
  .hc-actions { display: flex; gap: 8px; }
  .hc-btn { appearance: none; border: 1px solid var(--border); background: var(--surface, #fff); border-radius: 8px; padding: 8px 16px; font-size: 0.72rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 140ms; color: var(--text-primary); }
  .hc-btn:hover { border-color: var(--accent); color: var(--accent); }
  .hc-primary { background: var(--accent, #D97757); color: #fff; border-color: var(--accent); }
  .hc-primary:hover { background: color-mix(in srgb, var(--accent) 85%, black); color: #fff; }

  /* Idle */
  .hero-idle {
    appearance: none;
    border: 1.5px dashed var(--border, #E5E0DA);
    background: var(--surface, #fff);
    cursor: pointer;
    display: flex; align-items: center; gap: 14px;
    transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
    color: var(--accent);
  }
  .hero-idle:hover { border-color: var(--accent); border-style: solid; box-shadow: 0 4px 16px rgba(217,119,87,0.08); }
  .hero-idle-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .hero-idle-title { font-size: 0.88rem; font-weight: 700; color: var(--text-primary); }
  .hero-idle-sub { font-size: 0.62rem; color: var(--text-muted); line-height: 1.5; }
  .hero-idle-arrow { font-size: 1.1rem; font-weight: 600; color: var(--accent); flex-shrink: 0; opacity: 0; transition: opacity 140ms; }
  .hero-idle:hover .hero-idle-arrow { opacity: 1; }

  /* ═══ FEATURE PORTAL CARDS ═══ */
  .card {
    border: 1px solid var(--border-subtle, #EDEAE5);
    border-radius: 14px;
    background: var(--surface, #fff);
    overflow: hidden;
    transition: box-shadow 200ms, border-color 200ms;
  }
  .card:hover { border-color: rgba(0,0,0,0.08); }
  .card-open { box-shadow: 0 2px 12px rgba(0,0,0,0.03); }

  .card-header {
    appearance: none;
    border: none;
    background: transparent;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 16px;
    cursor: pointer;
    text-align: left;
    transition: background 100ms;
  }
  .card-header:hover { background: rgba(0,0,0,0.015); }
  .card-header-static { cursor: default; }
  .card-header-static:hover { background: transparent; }

  .card-icon { font-size: 1rem; flex-shrink: 0; width: 24px; text-align: center; }
  .card-name { font-size: 0.82rem; font-weight: 700; color: var(--text-primary, #2D2D2D); }
  .card-stat { font-family: var(--font-mono); font-size: 0.72rem; font-weight: 700; color: var(--accent, #D97757); margin-left: -2px; }
  .card-desc { font-size: 0.6rem; color: var(--text-muted, #9a9590); flex: 1; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .card-toggle { font-family: var(--font-mono); font-size: 0.9rem; font-weight: 500; color: var(--text-muted); flex-shrink: 0; width: 20px; text-align: center; transition: color 140ms; }
  .card-header:hover .card-toggle { color: var(--accent); }

  .card-body {
    padding: 0 16px 14px;
    display: flex; flex-direction: column; gap: 10px;
    animation: cardExpand 200ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes cardExpand {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .card-footer { display: flex; align-items: center; gap: 12px; padding-top: 4px; }
  .cf-link {
    appearance: none; border: none; background: transparent;
    font-family: var(--font-mono); font-size: 0.56rem; font-weight: 600;
    color: var(--text-muted, #9a9590); cursor: pointer;
    transition: color 140ms;
  }
  .cf-link:hover { color: var(--accent, #D97757); }
  .cf-accent { color: var(--accent); }

  .card-empty {
    padding: 12px 0;
    font-size: 0.64rem;
    color: var(--text-muted);
    text-align: center;
  }

  /* ── Template Grid (2-col inside card) ── */
  .tpl-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .tpl-card {
    appearance: none;
    border: 1px solid var(--border-subtle, #EDEAE5);
    background: var(--bg-warm, #FAF9F7);
    border-radius: 10px;
    padding: 10px 12px;
    display: flex; flex-direction: column; gap: 4px;
    cursor: pointer;
    text-align: left;
    transition: all 160ms;
  }
  .tpl-card:hover { border-color: var(--accent); background: rgba(217,119,87,0.03); transform: translateY(-1px); }
  .tpl-icon { font-size: 0.9rem; }
  .tpl-name { font-size: 0.68rem; font-weight: 600; color: var(--text-primary); line-height: 1.3; }
  .tpl-meta { display: flex; align-items: center; gap: 6px; }
  .tpl-time { font-family: var(--font-mono); font-size: 0.48rem; color: var(--text-muted); }
  .tpl-diff { font-family: var(--font-mono); font-size: 0.46rem; font-weight: 600; }

  /* ── Model List ── */
  .model-list { display: flex; flex-direction: column; }
  .model-row {
    appearance: none; border: none; background: transparent;
    display: flex; align-items: center; gap: 8px;
    padding: 8px 0; width: 100%; text-align: left;
    cursor: pointer; transition: background 100ms;
    border-bottom: 1px solid var(--border-subtle);
  }
  .model-row:last-child { border-bottom: none; }
  .model-row:hover { background: rgba(0,0,0,0.01); }
  .mdot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted); flex-shrink: 0; }
  .mdot-active { background: var(--green, #27864a); box-shadow: 0 0 4px rgba(39,134,74,0.4); }
  .mname { font-size: 0.72rem; font-weight: 600; color: var(--text-primary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .mstate { font-family: var(--font-mono); font-size: 0.48rem; font-weight: 600; color: var(--text-muted); padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,0.03); }
  .mearn { font-family: var(--font-mono); font-size: 0.58rem; font-weight: 600; color: var(--green); }

  /* ── Network Stats ── */
  .net-stats { display: flex; gap: 20px; }
  .ns-item { display: flex; flex-direction: column; gap: 2px; }
  .ns-val { font-family: var(--font-mono); font-size: 1.1rem; font-weight: 800; color: var(--text-primary); font-variant-numeric: tabular-nums; }
  .ns-lbl { font-family: var(--font-mono); font-size: 0.44rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }

  /* ═══ ACTIVITY SECTION ═══ */
  .activity-section {
    margin-top: 4px;
    display: flex; flex-direction: column; gap: 6px;
  }
  .activity-title {
    font-family: var(--font-mono);
    font-size: 0.48rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding-left: 2px;
  }
  .activity-list {
    border: 1px solid var(--border-subtle, #EDEAE5);
    border-radius: 10px;
    overflow: hidden;
    background: var(--surface, #fff);
  }
  .ev-row { display: flex; align-items: center; gap: 8px; padding: 7px 14px; border-bottom: 1px solid var(--border-subtle); }
  .ev-row:last-child { border-bottom: none; }
  .ev-time { font-family: var(--font-mono); font-size: 0.48rem; font-weight: 500; color: var(--text-muted); white-space: nowrap; flex-shrink: 0; }
  .ev-type { font-family: var(--font-mono); font-size: 0.42rem; font-weight: 700; padding: 2px 5px; border-radius: 4px; flex-shrink: 0; min-width: 26px; text-align: center; }
  .ev-msg { font-family: var(--font-mono); font-size: 0.54rem; color: var(--text-primary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* ═══ GUEST VIEW ═══ */
  .guest-center {
    max-width: 560px;
    width: 100%;
    margin: 0 auto;
    padding: 48px 20px 100px;
    display: flex; flex-direction: column; align-items: center; gap: 32px;
  }
  .guest-hero { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .guest-title { font-family: var(--font-display, 'Playfair Display', serif); font-size: 2rem; font-weight: 700; color: var(--text-primary); margin: 0; line-height: 1.3; }
  .guest-sub { font-size: 0.82rem; color: var(--text-secondary); margin: 0; line-height: 1.5; }
  .guest-search { display: flex; width: 100%; max-width: 420px; border: 1.5px solid var(--border); border-radius: 12px; overflow: hidden; transition: border-color 200ms, box-shadow 200ms; }
  .guest-search:focus-within { border-color: var(--accent); box-shadow: 0 4px 20px rgba(217,119,87,0.1); }
  .gs-input { flex: 1; appearance: none; border: none; outline: none; padding: 13px 16px; font-size: 0.85rem; background: var(--surface, #fff); color: var(--text-primary); font-family: inherit; }
  .gs-input::placeholder { color: var(--text-muted); }
  .gs-btn { appearance: none; border: none; background: var(--accent); color: #fff; font-size: 1rem; font-weight: 700; padding: 13px 22px; cursor: pointer; transition: background 150ms; }
  .gs-btn:hover { background: color-mix(in srgb, var(--accent) 85%, black); }

  .guest-steps { display: flex; gap: 24px; width: 100%; }
  .gstep { display: flex; align-items: flex-start; gap: 8px; flex: 1; }
  .gstep-n { width: 24px; height: 24px; border-radius: 50%; background: color-mix(in srgb, var(--accent) 10%, transparent); color: var(--accent); font-family: var(--font-mono); font-size: 0.72rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .gstep-text { display: flex; flex-direction: column; gap: 2px; }
  .gstep-t { font-size: 0.78rem; font-weight: 700; color: var(--text-primary); }
  .gstep-d { font-size: 0.6rem; color: var(--text-muted); line-height: 1.4; }

  .guest-wallet { display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .gw-label { font-size: 0.76rem; font-weight: 600; color: var(--text-secondary); }
  .gw-btns { display: flex; gap: 8px; }
  .gw-btn { appearance: none; border: 1px solid var(--border); background: var(--surface, #fff); border-radius: 10px; padding: 10px 20px; display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 0.74rem; font-weight: 600; color: var(--text-primary); transition: all 160ms; }
  .gw-btn:hover { border-color: var(--accent); box-shadow: 0 2px 10px rgba(217,119,87,0.1); transform: translateY(-1px); }
  .gw-icon { font-size: 1.1rem; }

  /* ═══ RESPONSIVE ═══ */
  @media (max-width: 600px) {
    .home-center { padding: 16px 12px 100px; gap: 10px; }
    .guest-center { padding: 28px 16px 100px; gap: 24px; }
    .tpl-grid { grid-template-columns: 1fr; }
    .guest-steps { flex-direction: column; gap: 12px; }
    .gw-btns { flex-direction: column; width: 100%; max-width: 260px; }
    .gw-btn { justify-content: center; }
    .guest-title { font-size: 1.6rem; }
    .hero { padding: 14px 14px; }
    .card-header { padding: 12px 14px; }
    .card-body { padding: 0 14px 12px; }
    .net-stats { gap: 16px; }
  }
</style>
