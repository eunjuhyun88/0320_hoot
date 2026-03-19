<script lang="ts">
  /**
   * HomePage — HOOT Protocol ecosystem entry point
   *
   * Spec: HOOT_PlatformUX_Detail §2 + wizardly-ptolemy layout
   *
   * 1. PixelOwl + HOOT Protocol branding
   * 2. Ecosystem tagline
   * 3. Live network pulse (nodes/GPUs/models/TVL)
   * 4. LIVE banner (when research running) — §2-2
   * 5. Three portal cards with dynamic state — §2-1
   * 6. Flywheel (ecosystem loop)
   * 7. Clickable recent activity — §2-2
   */
  import { router } from '../stores/router.ts';
  import { studioStore } from '../stores/studioStore.ts';
  import { dashboardStore } from '../stores/dashboardStore.ts';
  import { jobStore, jobProgress as jobProgressStore } from '../stores/jobStore.ts';
  import { modelPublishStore } from '../stores/modelPublishStore.ts';
  import { nodeStore, hasGpuNode } from '../stores/nodeStore.ts';
  import { wallet, WALLET_OPTIONS } from '../stores/walletStore.ts';
  import PixelOwl from '../components/PixelOwl.svelte';
  import PixelIcon from '../components/PixelIcon.svelte';
  import GPUOnboardWizard from '../components/studio/GPUOnboardWizard.svelte';

  // ── Guest ──
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

  // ── Job state ──
  $: isLoggedIn = $wallet.connected;
  $: jobPhase = $jobStore.phase;
  $: jobTopic = $jobStore.topic;
  $: jobProgress = $jobProgressStore;
  $: isRunning = jobPhase === 'running' || jobPhase === 'setup';
  $: isComplete = jobPhase === 'complete';
  $: bestMetric = $jobStore.bestMetric;
  $: totalExperiments = $jobStore.totalExperiments ?? 0;
  $: completedExp = $jobStore.experiments?.length ?? 0;

  // ── Owl mood ──
  $: owlMood = (() => {
    if (isRunning) return 'research' as const;
    if (jobPhase === 'setup') return 'build' as const;
    if (isComplete) return 'celebrate' as const;
    return 'idle' as const;
  })();

  // ── Dashboard data ──
  $: gpuWorkers = $dashboardStore.networkSummary?.activeWorkers ?? 0;
  $: nodesCount = $dashboardStore.networkSummary?.nodes ?? 0;
  $: modelsCount = $dashboardStore.modelsSummary?.count ?? 0;
  $: earningsValue = $dashboardStore.protocolSummary?.tvl ?? '$0';

  // ── GPU Node state ──
  $: myNode = $nodeStore;
  $: hasNode = $hasGpuNode;

  // ── Models published ──
  $: publishedModels = $modelPublishStore;
  $: publishedCount = publishedModels.length;
  $: totalModelEarnings = publishedModels.reduce((sum, m) => sum + (m.poolA?.creator ?? 0), 0);
  $: bestMetricLabel = Number.isFinite(bestMetric) && bestMetric > 0 ? bestMetric.toFixed(4) : 'standby';
  $: experimentLogLabel = totalExperiments > 0
    ? `${completedExp}/${totalExperiments} experiments logged`
    : 'No experiment tape yet';
  $: missionStatusLabel = (() => {
    if (isRunning) return `${jobTopic || 'Research'} is moving through the swarm`;
    if (isComplete) return `${jobTopic || 'Latest mission'} is ready to deploy`;
    return 'System primed for the next autonomous mission';
  })();

  // ── §2-1: Magnet Studio card dynamic text ──
  $: studioCardText = (() => {
    if (isRunning) return `${jobTopic || 'Research'} running (${jobProgress}%)`;
    if (isComplete) return `${jobTopic || 'Research'} complete — ready to deploy`;
    if (publishedCount > 0) return `${publishedCount} models · ${totalModelEarnings.toFixed(1)} HOOT earned`;
    return 'Start AI autonomous research';
  })();

  $: studioCardClick = () => {
    if (isRunning) { studioStore.startRunning(); }
    router.navigate('studio');
  };

  // ── §2-1: GPU Network card dynamic text ──
  $: networkCardText = (() => {
    if (!hasNode) return 'Register GPU and start earning';
    if (myNode.online) return `${myNode.nodeId} online · ${myNode.totalEarnings.toFixed(1)} HOOT`;
    return `${myNode.nodeId} offline ⚠`;
  })();

  $: networkCardClick = () => {
    if (!hasNode) { showGpuWizard = true; return; }
    router.navigate('network');
  };

  // ── §2-1: Protocol card dynamic text ──
  $: protocolCardText = (() => {
    if (!isLoggedIn) return 'Join HOOT Protocol';
    // TODO: check pending rewards from protocolSummary
    return `${earningsValue} TVL`;
  })();

  $: protocolCardClick = () => {
    if (!isLoggedIn) { wallet.connect('MetaMask'); return; }
    router.navigate('protocol');
  };

  // ── GPU Wizard ──
  let showGpuWizard = false;

  // (Network card now navigates directly — no expand state needed)

  // ── Activity ──
  $: recentEvents = ($dashboardStore.events ?? []).slice(0, 6);
  const TYPE_COLORS: Record<string, string> = {
    SYS: '#D97757', NET: '#2980b9', JOB: '#27864a', EXP: '#d4a017', WARN: '#c0392b',
  };
  function fmtTime(ts: number): string {
    return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  // ── §2-2: Activity click → navigate ──
  function handleActivityClick(ev: { type: string; id?: string }) {
    if (ev.type === 'JOB' || ev.type === 'EXP') {
      router.navigate('studio');
    } else if (ev.type === 'NET') {
      router.navigate('network');
    }
  }
</script>

<div class="home-page">
  <section class="hero-shell">
    <div class="hero-copy">
      <div class="eyebrow-row">
        <span class="eyebrow">Lost In The Mesh</span>
        <span class="eyebrow-divider"></span>
        <span class="eyebrow">Mission Control</span>
      </div>

      <div class="hero-brand">
        <div class="hero-brand-mark">
          <PixelOwl size={1.4} mood={owlMood} />
        </div>
        <div class="hero-brand-copy">
          <p class="hero-kicker">HOOT Protocol</p>
          <h1 class="hero-title">
            Autonomous research command for GPU crews, experiment loops, and verified protocol flows.
          </h1>
        </div>
      </div>

      <p class="hero-description">
        AI Research Design · Distributed GPU Training · Model Deployment · Data Provenance
        <span>Every contribution is verified and routed through one live command surface.</span>
      </p>

      <div class="hero-subline">
        <span>{missionStatusLabel}</span>
        <span>{experimentLogLabel}</span>
      </div>

      <div class="signal-rail" aria-hidden="true">
        <div class="signal-track">
          <span>MAGNET STUDIO</span>
          <span>GPU ASCENT</span>
          <span>PPAP PROOF</span>
          <span>MODEL DEPLOY</span>
          <span>LIVE SWARM</span>
          <span>MAGNET STUDIO</span>
          <span>GPU ASCENT</span>
          <span>PPAP PROOF</span>
          <span>MODEL DEPLOY</span>
          <span>LIVE SWARM</span>
        </div>
      </div>
    </div>

    <div class="hero-stage">
      {#if isLoggedIn}
        <div class="stage-panel">
          <div class="stage-head">
            <span class="stage-label">Swarm telemetry</span>
            <span class="stage-state" class:live={isRunning}>{isRunning ? 'Live mission' : 'Standby'}</span>
          </div>

          <div class="pulse-grid">
            <div class="pulse-card">
              <span class="pulse-card-value">{nodesCount}</span>
              <span class="pulse-card-label">Nodes online</span>
            </div>
            <div class="pulse-card">
              <span class="pulse-card-value">{gpuWorkers}</span>
              <span class="pulse-card-label">GPU workers</span>
            </div>
            <div class="pulse-card">
              <span class="pulse-card-value">{modelsCount}</span>
              <span class="pulse-card-label">Models tracked</span>
            </div>
            <div class="pulse-card">
              <span class="pulse-card-value">{earningsValue}</span>
              <span class="pulse-card-label">TVL routed</span>
            </div>
          </div>

          {#if isRunning}
            <button class="live-banner" on:click={studioCardClick}>
              <span class="lb-dot pulse"></span>
              <span class="lb-badge">Live</span>
              <div class="lb-body">
                <span class="lb-topic">{jobTopic || 'Research'}</span>
                <div class="lb-pbar"><div class="lb-pfill" style="width:{jobProgress}%"></div></div>
                <span class="lb-meta">{jobProgress}% · {completedExp}/{totalExperiments} experiments</span>
              </div>
              <span class="lb-cta">Resume mission</span>
            </button>
          {:else}
            <div class="status-stack">
              <div class="status-card">
                <span class="status-card-label">Best keep</span>
                <span class="status-card-value">{bestMetricLabel}</span>
                <span class="status-card-meta">{experimentLogLabel}</span>
              </div>
              <div class="status-card">
                <span class="status-card-label">Fleet</span>
                <span class="status-card-value">{hasNode ? myNode.nodeId : 'unassigned'}</span>
                <span class="status-card-meta">
                  {#if hasNode}
                    {myNode.online ? 'Compute node online and earning' : 'Node offline and waiting for relaunch'}
                  {:else}
                    Register a GPU node to join the network
                  {/if}
                </span>
              </div>
              <div class="status-card">
                <span class="status-card-label">Published</span>
                <span class="status-card-value">{publishedCount}</span>
                <span class="status-card-meta">
                  {publishedCount > 0 ? `${totalModelEarnings.toFixed(1)} HOOT earned so far` : 'No minted models yet'}
                </span>
              </div>
            </div>
          {/if}
        </div>
      {:else}
        <div class="stage-panel guest-stage">
          <div class="stage-head">
            <span class="stage-label">Launch a mission</span>
            <span class="stage-state live">Crew onboarding</span>
          </div>

          <div class="guest-command">
            <input
              class="gs-input"
              type="text"
              placeholder="e.g. Crypto market prediction..."
              bind:value={guestSearchTopic}
              on:keydown={handleGuestKeydown}
            />
            <button class="gs-btn" on:click={handleGuestSearch}>Launch</button>
          </div>

          <p class="guest-note">
            Start with a topic and open Magnet Studio as the mission author. Wallet access unlocks the network roles below.
          </p>

          <div class="guest-wallet">
            <span class="guest-wallet-label">Crew access</span>
            <div class="gw-btns">
              {#each wallets as w (w.name)}
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
  </section>

  {#if isLoggedIn}
    <section class="mission-grid">
      <button class="mission-card tone-studio" on:click={studioCardClick}>
        <div class="mission-card-top">
          <span class="mission-card-tag">Magnet Studio</span>
          <span class="mission-card-signal">{isRunning ? 'Research live' : 'Ready to launch'}</span>
        </div>
        <div class="mission-card-icon"><PixelIcon type="research" size={22} /></div>
        <h2 class="mission-card-title">Design and steer the next research run</h2>
        <p class="mission-card-copy">{studioCardText}</p>
        <span class="mission-card-meta">Research Design → Distributed GPU Training → ModelNFT Minting</span>
      </button>

      <button class="mission-card tone-network" on:click={networkCardClick}>
        <div class="mission-card-top">
          <span class="mission-card-tag">GPU Network</span>
          <span class="mission-card-signal">{hasNode && myNode.online ? 'Node synced' : 'Capacity needed'}</span>
        </div>
        <div class="mission-card-icon"><PixelIcon type="globe" size={22} /></div>
        <h2 class="mission-card-title">Expand the fleet and earn from compute</h2>
        <p class="mission-card-copy">{networkCardText}</p>
        <span class="mission-card-meta">Training Nodes · Inference Nodes · PoAW Block Contribution</span>
      </button>

      <button class="mission-card tone-protocol" on:click={protocolCardClick}>
        <div class="mission-card-top">
          <span class="mission-card-tag">Protocol</span>
          <span class="mission-card-signal">{isLoggedIn ? 'Settlement live' : 'Wallet required'}</span>
        </div>
        <div class="mission-card-icon"><PixelIcon type="protocol" size={22} /></div>
        <h2 class="mission-card-title">Route value through staking, proof, and settlement</h2>
        <p class="mission-card-copy">{protocolCardText}</p>
        <span class="mission-card-meta">HOOT Bonding · Staking · PPAP Proof · x402 Settlement</span>
      </button>
    </section>

    <section class="systems-grid">
      <div class="systems-panel">
        <div class="panel-headline">
          <span class="stage-label">System loop</span>
          <span class="panel-caption">One closed flywheel for builders, compute, and buyers.</span>
        </div>
        <div class="flywheel-track">
          <span class="fw-step">Data Contribution</span>
          <span class="fw-arr">→</span>
          <span class="fw-step">GPU Training</span>
          <span class="fw-arr">→</span>
          <span class="fw-step">Model Deployment</span>
          <span class="fw-arr">→</span>
          <span class="fw-step">Usage Settlement</span>
          <span class="fw-arr">→</span>
          <span class="fw-step fw-reward">Rewards</span>
        </div>
        <p class="panel-copy">
          Contributor · Compute Node · Builder · Buyer — pools auto-distribute value as the network compounds.
        </p>
      </div>

      <div class="systems-panel">
        <div class="panel-headline">
          <span class="stage-label">Recent transmissions</span>
          <span class="panel-caption">Live events from the mesh, protocol, and jobs.</span>
        </div>
        {#if recentEvents.length > 0}
          <div class="activity-list">
            {#each recentEvents as ev (ev.id)}
              <button class="ev-row" on:click={() => handleActivityClick(ev)}>
                <span class="ev-time">{fmtTime(ev.timestamp)}</span>
                <span
                  class="ev-type"
                  style:color={TYPE_COLORS[ev.type] || '#999'}
                  style:background="color-mix(in srgb, {TYPE_COLORS[ev.type] || 'gray'} 14%, transparent)"
                >
                  {ev.type}
                </span>
                <span class="ev-msg">{ev.message}</span>
              </button>
            {/each}
          </div>
        {:else}
          <div class="empty-panel">
            <span class="empty-title">No live transmissions yet</span>
            <span class="empty-copy">Launch a mission and the mesh will start writing to this feed.</span>
          </div>
        {/if}
      </div>
    </section>
  {:else}
    <section class="guest-grid">
      <div class="systems-panel">
        <div class="panel-headline">
          <span class="stage-label">Crew roles</span>
          <span class="panel-caption">Four entry points into the same network.</span>
        </div>
        <div class="roles-grid">
          {#each [
            { pixelIcon: 'research', role: 'Builder', desc: 'Research Design → Model Training → ModelNFT Minting', color: 'var(--accent)' },
            { pixelIcon: 'globe', role: 'Compute Node', desc: 'Connect GPU → Training/Inference → PoAW Rewards', color: 'var(--green)' },
            { pixelIcon: 'chart', role: 'Contributor', desc: 'Data Contribution → Provenance (PPAP) → Pool Distribution', color: 'var(--blue)' },
            { pixelIcon: 'protocol', role: 'Buyer', desc: 'Model and agent calls → x402 automatic settlement', color: 'var(--gold)' },
          ] as r (r.role)}
            <div class="role-card">
              <span class="role-icon" style:color={r.color}><PixelIcon type={r.pixelIcon} size={18} /></span>
              <div class="role-text">
                <span class="role-name" style:color={r.color}>{r.role}</span>
                <span class="role-desc">{r.desc}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="systems-panel">
        <div class="panel-headline">
          <span class="stage-label">Flight plan</span>
          <span class="panel-caption">A concise path from idea to live model.</span>
        </div>
        <div class="flight-plan">
          <div class="flight-step">
            <span class="flight-step-no">01</span>
            <div>
              <strong>Define the mission.</strong>
              <span>Start with a single research topic and open Magnet Studio.</span>
            </div>
          </div>
          <div class="flight-step">
            <span class="flight-step-no">02</span>
            <div>
              <strong>Attach the right crew.</strong>
              <span>Builders, compute nodes, contributors, and buyers share the same loop.</span>
            </div>
          </div>
          <div class="flight-step">
            <span class="flight-step-no">03</span>
            <div>
              <strong>Verify every output.</strong>
              <span>PPAP proof and settlement keep the mesh accountable as it scales.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  {/if}
</div>

{#if showGpuWizard}
  <GPUOnboardWizard
    on:close={() => { showGpuWizard = false; }}
    on:complete={() => { showGpuWizard = false; router.navigate('network'); }}
  />
{/if}

<style>
  .home-page {
    width: min(1320px, calc(100% - 32px));
    margin: 0 auto;
    padding: 40px 0 104px;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .hero-shell {
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(360px, 0.92fr);
    gap: 24px;
    align-items: stretch;
  }

  .hero-copy,
  .stage-panel,
  .mission-card,
  .systems-panel {
    border: 1px solid var(--border, rgba(114, 246, 255, 0.16));
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 18%),
      var(--surface, rgba(9, 20, 36, 0.78));
    box-shadow: var(--card-glow);
    backdrop-filter: blur(20px);
  }

  .hero-copy {
    border-radius: 32px;
    padding: 34px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
    position: relative;
    overflow: hidden;
  }

  .hero-copy::after {
    content: "";
    position: absolute;
    inset: auto -10% -28% auto;
    width: 280px;
    height: 280px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(114, 246, 255, 0.12), transparent 70%);
    pointer-events: none;
  }

  .eyebrow-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .eyebrow {
    font-family: var(--font-mono, 'IBM Plex Mono', monospace);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--accent, #72f6ff);
  }

  .eyebrow-divider {
    width: 42px;
    height: 1px;
    background: linear-gradient(90deg, var(--accent, #72f6ff), transparent);
  }

  .hero-brand {
    display: flex;
    align-items: center;
    gap: 18px;
    min-width: 0;
  }

  .hero-brand-mark {
    width: 88px;
    height: 88px;
    border-radius: 28px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(114, 246, 255, 0.18);
    background:
      radial-gradient(circle at 30% 25%, rgba(114, 246, 255, 0.22), transparent 62%),
      linear-gradient(180deg, rgba(12, 28, 49, 0.96), rgba(6, 15, 28, 0.94));
    box-shadow: var(--card-glow-hover);
    flex-shrink: 0;
  }

  .hero-brand-copy {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  .hero-kicker {
    margin: 0;
    font-family: var(--font-display, 'Oxanium', sans-serif);
    font-size: 0.96rem;
    font-weight: 700;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--accent-secondary, #ffb35c);
  }

  .hero-title {
    margin: 0;
    font-family: var(--font-display, 'Oxanium', sans-serif);
    font-size: clamp(2.5rem, 5vw, 4.8rem);
    line-height: 0.94;
    letter-spacing: -0.03em;
    color: var(--text-primary, #eef7ff);
    text-transform: uppercase;
  }

  .hero-description {
    margin: 0;
    max-width: 44rem;
    font-size: 1rem;
    line-height: 1.75;
    color: var(--text-secondary, rgba(226, 240, 255, 0.78));
  }

  .hero-description span {
    display: block;
    color: var(--text-muted, rgba(169, 193, 220, 0.54));
  }

  .hero-subline {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 18px;
    font-family: var(--font-mono, 'IBM Plex Mono', monospace);
    font-size: 0.72rem;
    color: var(--text-muted, rgba(169, 193, 220, 0.54));
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .signal-rail {
    width: 100%;
    overflow: hidden;
    border-top: 1px solid rgba(114, 246, 255, 0.1);
    border-bottom: 1px solid rgba(114, 246, 255, 0.1);
    padding: 12px 0;
  }

  .signal-track {
    display: inline-flex;
    gap: 18px;
    white-space: nowrap;
    min-width: max-content;
    animation: tickerScroll 22s linear infinite;
  }

  .signal-track span {
    font-family: var(--font-mono, 'IBM Plex Mono', monospace);
    font-size: 0.74rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(226, 240, 255, 0.66);
  }

  .hero-stage {
    min-width: 0;
  }

  .stage-panel {
    height: 100%;
    border-radius: 32px;
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .stage-head,
  .panel-headline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .stage-label {
    font-family: var(--font-mono, 'IBM Plex Mono', monospace);
    font-size: 0.72rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent, #72f6ff);
  }

  .stage-state {
    padding: 7px 12px;
    border-radius: 999px;
    font-family: var(--font-mono, 'IBM Plex Mono', monospace);
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-secondary, rgba(226, 240, 255, 0.78));
    background: rgba(114, 246, 255, 0.08);
    border: 1px solid rgba(114, 246, 255, 0.12);
  }

  .stage-state.live {
    color: #07111d;
    background: linear-gradient(135deg, var(--accent-secondary, #ffb35c), var(--accent, #72f6ff));
    border-color: transparent;
    box-shadow: var(--glow-accent-sm);
  }

  .pulse-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .pulse-card,
  .status-card,
  .role-card,
  .flight-step,
  .empty-panel {
    border-radius: 20px;
    border: 1px solid rgba(114, 246, 255, 0.1);
    background: rgba(4, 14, 25, 0.56);
    padding: 16px 18px;
    min-width: 0;
  }

  .pulse-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .pulse-card-value {
    font-family: var(--font-display, 'Oxanium', sans-serif);
    font-size: clamp(1.5rem, 3vw, 2.3rem);
    color: var(--text-primary, #eef7ff);
    letter-spacing: -0.04em;
  }

  .pulse-card-label {
    font-family: var(--font-mono, 'IBM Plex Mono', monospace);
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted, rgba(169, 193, 220, 0.54));
  }

  .status-stack {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .status-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .status-card-label {
    font-family: var(--font-mono, 'IBM Plex Mono', monospace);
    font-size: 0.68rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent-secondary, #ffb35c);
  }

  .status-card-value {
    font-family: var(--font-display, 'Oxanium', sans-serif);
    font-size: 1.55rem;
    color: var(--text-primary, #eef7ff);
    text-transform: uppercase;
    line-height: 1;
  }

  .status-card-meta,
  .panel-caption,
  .panel-copy,
  .role-desc,
  .empty-copy,
  .guest-note,
  .mission-card-meta {
    font-size: 0.82rem;
    line-height: 1.6;
    color: var(--text-muted, rgba(169, 193, 220, 0.54));
  }

  .live-banner {
    appearance: none;
    width: 100%;
    border: 1px solid rgba(114, 246, 255, 0.18);
    border-radius: 22px;
    background:
      linear-gradient(135deg, rgba(255, 179, 92, 0.12), rgba(114, 246, 255, 0.08)),
      rgba(5, 16, 28, 0.8);
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 18px;
    cursor: pointer;
    text-align: left;
    transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
  }

  .live-banner:hover {
    transform: translateY(-2px);
    border-color: rgba(114, 246, 255, 0.28);
    box-shadow: var(--card-glow-hover);
  }

  .lb-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--accent, #72f6ff);
    box-shadow: 0 0 10px rgba(114, 246, 255, 0.48);
    flex-shrink: 0;
  }

  .lb-dot.pulse { animation: pulse 1.5s ease-in-out infinite; }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.42; }
  }

  .lb-badge {
    padding: 5px 9px;
    border-radius: 999px;
    font-family: var(--font-mono, 'IBM Plex Mono', monospace);
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #07111d;
    background: linear-gradient(135deg, var(--accent-secondary, #ffb35c), var(--accent, #72f6ff));
    flex-shrink: 0;
  }

  .lb-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .lb-topic {
    font-family: var(--font-display, 'Oxanium', sans-serif);
    font-size: 1.18rem;
    color: var(--text-primary, #eef7ff);
    letter-spacing: -0.02em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .lb-pbar {
    height: 5px;
    border-radius: 999px;
    background: rgba(114, 246, 255, 0.12);
    overflow: hidden;
  }

  .lb-pfill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--accent-secondary, #ffb35c), var(--accent, #72f6ff));
    transition: width 300ms ease;
  }

  .lb-meta {
    font-family: var(--font-mono, 'IBM Plex Mono', monospace);
    font-size: 0.72rem;
    color: var(--text-muted, rgba(169, 193, 220, 0.54));
  }

  .lb-cta {
    font-family: var(--font-mono, 'IBM Plex Mono', monospace);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--accent, #72f6ff);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .guest-command {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
  }

  .gs-input,
  .gs-btn,
  .gw-btn,
  .mission-card {
    font-family: inherit;
  }

  .gs-input {
    width: 100%;
    border: 1px solid rgba(114, 246, 255, 0.12);
    border-radius: 18px;
    background: rgba(4, 14, 25, 0.72);
    color: var(--text-primary, #eef7ff);
    padding: 15px 16px;
    font-size: 0.96rem;
    outline: none;
    transition: border-color 180ms ease, box-shadow 180ms ease;
  }

  .gs-input::placeholder { color: var(--text-muted, rgba(169, 193, 220, 0.54)); }
  .gs-input:focus {
    border-color: rgba(114, 246, 255, 0.28);
    box-shadow: var(--glow-accent-sm);
  }

  .gs-btn,
  .gw-btn {
    appearance: none;
    border: none;
    border-radius: 18px;
    padding: 0 18px;
    background: linear-gradient(135deg, var(--accent-secondary, #ffb35c), var(--accent, #72f6ff));
    color: #05111e;
    font-size: 0.86rem;
    font-weight: 700;
    cursor: pointer;
    transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
  }

  .gs-btn:hover,
  .gw-btn:hover {
    transform: translateY(-1px);
    box-shadow: var(--glow-accent);
  }

  .guest-wallet {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .guest-wallet-label {
    font-family: var(--font-mono, 'IBM Plex Mono', monospace);
    font-size: 0.72rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--accent-secondary, #ffb35c);
  }

  .gw-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .gw-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 46px;
    padding: 0 16px;
  }

  .gw-icon { font-size: 1.08rem; }

  .mission-grid,
  .guest-grid,
  .systems-grid {
    display: grid;
    gap: 20px;
  }

  .mission-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .guest-grid,
  .systems-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .mission-card {
    appearance: none;
    border-radius: 26px;
    padding: 24px;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 14px;
    cursor: pointer;
    transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
  }

  .mission-card:hover {
    transform: translateY(-3px);
    border-color: rgba(114, 246, 255, 0.24);
    box-shadow: var(--card-glow-hover);
  }

  .tone-studio { background-image: linear-gradient(180deg, rgba(114, 246, 255, 0.08), transparent 32%), linear-gradient(135deg, rgba(114, 246, 255, 0.06), transparent 50%), linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 18%), var(--surface); }
  .tone-network { background-image: linear-gradient(180deg, rgba(115, 247, 180, 0.08), transparent 32%), linear-gradient(135deg, rgba(115, 247, 180, 0.06), transparent 50%), linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 18%), var(--surface); }
  .tone-protocol { background-image: linear-gradient(180deg, rgba(255, 179, 92, 0.08), transparent 32%), linear-gradient(135deg, rgba(255, 179, 92, 0.06), transparent 50%), linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 18%), var(--surface); }

  .mission-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .mission-card-tag,
  .mission-card-signal {
    font-family: var(--font-mono, 'IBM Plex Mono', monospace);
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.14em;
  }

  .mission-card-tag { color: var(--accent, #72f6ff); }
  .mission-card-signal { color: var(--text-muted, rgba(169, 193, 220, 0.54)); }

  .mission-card-icon {
    width: 46px;
    height: 46px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(114, 246, 255, 0.12);
    background: rgba(4, 14, 25, 0.56);
    color: var(--accent, #72f6ff);
  }

  .tone-network .mission-card-icon { color: var(--green, #73f7b4); }
  .tone-protocol .mission-card-icon { color: var(--accent-secondary, #ffb35c); }

  .mission-card-title {
    margin: 0;
    font-family: var(--font-display, 'Oxanium', sans-serif);
    font-size: 1.36rem;
    line-height: 1.08;
    color: var(--text-primary, #eef7ff);
    text-transform: uppercase;
  }

  .mission-card-copy {
    margin: 0;
    font-size: 0.96rem;
    line-height: 1.6;
    color: var(--text-secondary, rgba(226, 240, 255, 0.78));
  }

  .systems-panel {
    border-radius: 28px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    min-width: 0;
  }

  .panel-caption {
    font-family: var(--font-mono, 'IBM Plex Mono', monospace);
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .flywheel-track {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .fw-step,
  .fw-arr {
    font-family: var(--font-mono, 'IBM Plex Mono', monospace);
    font-size: 0.74rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .fw-step {
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid rgba(114, 246, 255, 0.1);
    background: rgba(4, 14, 25, 0.56);
    color: var(--text-secondary, rgba(226, 240, 255, 0.78));
  }

  .fw-reward {
    color: #06111d;
    background: linear-gradient(135deg, var(--accent-secondary, #ffb35c), var(--accent, #72f6ff));
    border-color: transparent;
  }

  .fw-arr { color: var(--text-muted, rgba(169, 193, 220, 0.54)); }

  .activity-list {
    display: flex;
    flex-direction: column;
    border-radius: 20px;
    border: 1px solid rgba(114, 246, 255, 0.08);
    overflow: hidden;
    background: rgba(4, 14, 25, 0.56);
  }

  .ev-row {
    appearance: none;
    border: none;
    background: transparent;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    text-align: left;
    padding: 12px 14px;
    border-bottom: 1px solid rgba(114, 246, 255, 0.08);
    cursor: pointer;
    transition: background 140ms ease;
  }

  .ev-row:last-child { border-bottom: none; }
  .ev-row:hover { background: rgba(114, 246, 255, 0.06); }

  .ev-time,
  .ev-type {
    font-family: var(--font-mono, 'IBM Plex Mono', monospace);
    font-size: 0.7rem;
    flex-shrink: 0;
  }

  .ev-time { color: var(--text-muted, rgba(169, 193, 220, 0.54)); }

  .ev-type {
    padding: 4px 8px;
    border-radius: 999px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .ev-msg {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-secondary, rgba(226, 240, 255, 0.78));
  }

  .empty-panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .empty-title {
    font-family: var(--font-display, 'Oxanium', sans-serif);
    font-size: 1.1rem;
    color: var(--text-primary, #eef7ff);
    text-transform: uppercase;
  }

  .roles-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .role-card {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .role-icon {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: rgba(4, 14, 25, 0.72);
    border: 1px solid rgba(114, 246, 255, 0.08);
    flex-shrink: 0;
  }

  .role-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .role-name {
    font-family: var(--font-display, 'Oxanium', sans-serif);
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .flight-plan {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .flight-step {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 14px;
    align-items: start;
  }

  .flight-step strong,
  .flight-step span {
    display: block;
  }

  .flight-step strong {
    color: var(--text-primary, #eef7ff);
    margin-bottom: 4px;
  }

  .flight-step span {
    color: var(--text-muted, rgba(169, 193, 220, 0.54));
    line-height: 1.6;
  }

  .flight-step-no {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-family: var(--font-display, 'Oxanium', sans-serif);
    color: #04111d;
    background: linear-gradient(135deg, var(--accent-secondary, #ffb35c), var(--accent, #72f6ff));
    box-shadow: var(--glow-accent-sm);
  }

  @media (max-width: 1120px) {
    .hero-shell,
    .guest-grid,
    .systems-grid {
      grid-template-columns: 1fr;
    }

    .mission-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .status-stack {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 760px) {
    .home-page {
      width: min(100%, calc(100% - 20px));
      padding: 24px 0 100px;
      gap: 18px;
    }

    .hero-copy,
    .stage-panel,
    .systems-panel,
    .mission-card {
      border-radius: 24px;
      padding: 20px;
    }

    .hero-brand {
      flex-direction: column;
      align-items: flex-start;
    }

    .hero-brand-mark {
      width: 72px;
      height: 72px;
      border-radius: 22px;
    }

    .hero-kicker { font-size: 0.82rem; }

    .hero-title {
      font-size: clamp(2rem, 10vw, 3rem);
      line-height: 0.98;
    }

    .guest-command,
    .pulse-grid,
    .roles-grid,
    .mission-grid {
      grid-template-columns: 1fr;
    }

    .gw-btns {
      flex-direction: column;
      align-items: stretch;
    }

    .live-banner {
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .lb-cta {
      width: 100%;
      text-align: left;
    }

    .ev-row {
      display: grid;
      grid-template-columns: auto auto 1fr;
      align-items: center;
    }
  }
</style>
