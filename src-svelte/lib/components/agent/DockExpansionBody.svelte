<script lang="ts">
  /**
   * DockExpansionBody — Universal AI terminal expansion
   *
   * Three modes:
   *   ask:       chat Q&A with inline messages + quick question chips
   *   research:  preset cards + stats + launch button (original)
   *   inference:  model picker + inline playground
   *
   * Research lifecycle overlays (running/complete) appear regardless of mode.
   */
  import { tick } from 'svelte';
  import { jobStore, jobProgress } from '../../stores/jobStore.ts';
  import { dockStore, dockContext, dockPresetId, dockTopic, dockIntent, dockMode, dockInferenceModelId } from '../../stores/dockStore.ts';
  import { agentStore, agentMessages, agentLoading } from '../../stores/agentStore.ts';
  import { studioStore } from '../../stores/studioStore.ts';
  import { wallet } from '../../stores/walletStore.ts';
  import { router } from '../../stores/router.ts';
  import { ASK_CHIPS, IDLE_CHIPS, RUNNING_CHIPS, COMPLETE_CHIPS, INFERENCE_CHIPS } from '../../data/dockSuggestions.ts';
  import PixelIcon from '../PixelIcon.svelte';
  import {
    createOntologyFromPreset,
    getEnabledBranches,
    getTotalExperiments,
  } from '../../data/ontologyData.ts';
  import type { DockMode } from '../../stores/dockStore.ts';

  // ── Mode tabs ──
  const MODES: { id: DockMode; label: string; icon: string }[] = [
    { id: 'ask', label: 'Ask', icon: '💬' },
    { id: 'research', label: 'Research', icon: '🔬' },
    { id: 'inference', label: 'Inference', icon: '⚡' },
  ];

  // ── Chat scroll ref ──
  let chatScrollEl: HTMLDivElement;

  // ── Auto-scroll chat ──
  $: if ($agentMessages.length && chatScrollEl) {
    tick().then(() => {
      if (chatScrollEl) chatScrollEl.scrollTop = chatScrollEl.scrollHeight;
    });
  }

  // ── Preset data (same as StudioIdle) ──
  const PRESETS = [
    { id: 'crypto_market', title: 'Crypto Market Prediction', desc: 'Price movements using on-chain + sentiment' },
    { id: 'defi_risk', title: 'DeFi Protocol Risk', desc: 'Classify risk via TVL and audit history' },
    { id: 'fraud_detection', title: 'Fraud Detection', desc: 'Identify suspicious wallet patterns' },
    { id: 'time_series', title: 'Time Series Forecasting', desc: 'Multi-variate financial forecasting' },
  ];

  // ── Models for inference ──
  const MODELS = [
    { id: 'model-crypto-24h-v3', name: 'Crypto 24h v3', accuracy: '89.1%', calls: '12.4K', cost: '0.001 HOOT' },
    { id: 'model-defi-risk-v1', name: 'DeFi Risk v1', accuracy: '93.1%', calls: '3.2K', cost: '0.001 HOOT' },
    { id: 'model-eth-gas-v2', name: 'ETH Gas v2', accuracy: '83.4%', calls: '890', cost: '0.001 HOOT' },
    { id: 'model-nlp-sentiment-v1', name: 'NLP Sentiment v1', accuracy: '92.2%', calls: '—', cost: '0.001 HOOT' },
  ];

  // ── Inference state ──
  let infInput = '{\n  "symbol": "ETH",\n  "timeframe": "24h"\n}';
  let infResult = '';
  let infLoading = false;
  let infTimeout: ReturnType<typeof setTimeout> | null = null;

  // ── Reactive stats from selected preset ──
  $: ontology = $dockPresetId
    ? createOntologyFromPreset($dockPresetId)
    : createOntologyFromPreset('balanced');
  $: branchCount = getEnabledBranches(ontology).length;
  $: totalExp = getTotalExperiments(ontology);
  $: itersPerBranch = Math.round(totalExp / Math.max(branchCount, 1));
  $: eta = totalExp < 100 ? '~5m' : totalExp < 200 ? '~15m' : '~30m';

  // ── Running stats ──
  $: runProgress = $jobProgress;
  $: runTopic = $jobStore.topic;
  $: runBranches = $jobStore.branches?.length ?? 0;
  $: runTotalExp = $jobStore.totalExperiments ?? 0;
  $: runCompletedExp = $jobStore.experiments?.length ?? 0;
  $: runEta = (() => {
    if (runProgress >= 95) return '< 1m';
    const remaining = Math.round((100 - runProgress) / 15);
    return `~${Math.max(remaining, 1)}m`;
  })();

  // ── Selected inference model ──
  $: selectedModel = MODELS.find(m => m.id === $dockInferenceModelId) ?? null;

  // ── Handlers ──
  function handleModeSwitch(mode: DockMode) {
    dockStore.setMode(mode);
  }

  function handleChipClick(chip: any) {
    if (chip.presetId) {
      const preset = PRESETS.find(p => p.id === chip.presetId);
      dockStore.selectPreset(chip.presetId, preset?.title ?? chip.label);
    } else if (chip.modelId) {
      dockStore.setInferenceModel(chip.modelId);
    } else if (chip.action) {
      handleAction(chip.action);
    }
  }

  function handlePresetClick(preset: typeof PRESETS[0]) {
    dockStore.selectPreset(preset.id, preset.title);
  }

  function handleModelSelect(model: typeof MODELS[0]) {
    dockStore.setInferenceModel(model.id);
    infResult = '';
  }

  function handleAction(action: string) {
    // Ask mode actions
    if (action.startsWith('ask:')) {
      const q = action.replace('ask:', '');
      switch (q) {
        case 'capabilities':
          agentStore.send('What can I do here?');
          break;
        case 'myModels':
          agentStore.send('Show my models');
          break;
        case 'networkStatus':
          agentStore.send('Network status');
          break;
        case 'howHoot':
          agentStore.send('How does HOOT work?');
          break;
      }
      return;
    }

    // Research/general actions
    switch (action) {
      case 'viewRunning':
        dockStore.collapse();
        router.navigate('studio');
        break;
      case 'stop':
        dockStore.handleCommand('/stop');
        dockStore.collapse();
        break;
      case 'viewResults':
        dockStore.collapse();
        router.navigate('studio');
        break;
      case 'improve':
        dockStore.handleCommand('/improve');
        break;
      case 'retry':
        dockStore.handleCommand('/retry');
        break;
      case 'deploy':
        dockStore.handleCommand('/deploy');
        dockStore.collapse();
        break;
    }
  }

  function handleLaunch() {
    dockStore.launch();
  }

  function runInference() {
    if (!selectedModel || infLoading) return;
    infLoading = true;
    infResult = '';
    if (infTimeout) clearTimeout(infTimeout);
    infTimeout = setTimeout(() => {
      infLoading = false;
      infResult = JSON.stringify({
        prediction: +(Math.random() * 0.4 + 0.6).toFixed(3),
        confidence: +(Math.random() * 0.2 + 0.78).toFixed(3),
        direction: Math.random() > 0.5 ? 'up' : 'down',
        model: selectedModel?.id ?? '',
        latency_ms: Math.round(30 + Math.random() * 30),
      }, null, 2);
    }, 900 + Math.random() * 600);
  }

  // ── Intent labels ──
  $: intentTitle = (() => {
    switch ($dockIntent) {
      case 'improve': return 'Improve Research';
      case 'retry': return 'Retry Research';
      default: return 'Start Research';
    }
  })();
</script>

<div class="expansion-body">
  <!-- ═══ MODE TABS ═══ -->
  {#if $dockContext === 'idle'}
    <div class="mode-tabs">
      {#each MODES as mode}
        <button
          class="mode-tab"
          class:mode-active={$dockMode === mode.id}
          on:click={() => handleModeSwitch(mode.id)}
        >
          <span class="mode-icon">{mode.icon}</span>
          <span class="mode-label">{mode.label}</span>
        </button>
      {/each}
    </div>
  {/if}

  <!-- ═══ RUNNING OVERLAY ═══ -->
  {#if $dockContext === 'running'}
    <div class="running-view">
      <div class="running-header">
        <span class="running-dot"></span>
        <span class="running-topic">{runTopic || 'Research'}</span>
      </div>
      <div class="running-progress-bar">
        <div class="running-progress-fill" style="width: {runProgress}%"></div>
      </div>
      <div class="running-meta">
        <span>{runProgress}%</span>
        <span class="meta-sep">·</span>
        <span>ETA {runEta}</span>
        <span class="meta-sep">·</span>
        <span>{runCompletedExp}/{runTotalExp} experiments</span>
      </div>
      <div class="suggestion-chips">
        {#each RUNNING_CHIPS as chip}
          <button
            class="chip"
            class:chip-danger={chip.variant === 'danger'}
            on:click={() => handleChipClick(chip)}
          >
            {chip.label}
          </button>
        {/each}
      </div>
    </div>

  {:else if $dockContext === 'complete'}
    <!-- ═══ COMPLETE OVERLAY ═══ -->
    <div class="complete-view">
      <div class="complete-header">
        <span class="complete-check">✓</span>
        <span class="complete-topic">{runTopic || $studioStore.createTopic} — Complete</span>
      </div>
      <div class="complete-meta">
        Best: {$jobStore.bestMetric?.toFixed(3) ?? '—'} AUC · {runTotalExp} experiments
      </div>
      <div class="suggestion-chips">
        {#each COMPLETE_CHIPS as chip}
          <button
            class="chip"
            class:chip-primary={chip.variant === 'primary'}
            on:click={() => handleChipClick(chip)}
          >
            {chip.label}
          </button>
        {/each}
      </div>
    </div>

  {:else}
    <!-- ═══ IDLE: MODE VIEWS ═══ -->

    {#if $dockMode === 'ask'}
      <!-- ═══ ASK MODE ═══ -->
      <div class="ask-view">
        {#if $agentMessages.length === 0}
          <div class="ask-empty">
            <PixelIcon type="sparkle" size={20} />
            <span class="ask-empty-text">Ask anything about models, research, or the network</span>
          </div>
        {:else}
          <div class="ask-messages" bind:this={chatScrollEl}>
            {#each $agentMessages as msg (msg.id)}
              <div class="ask-msg" class:ask-msg-user={msg.role === 'user'} class:ask-msg-agent={msg.role === 'agent'}>
                {#if msg.role === 'agent'}
                  <span class="ask-avatar"><PixelIcon type="sparkle" size={12} /></span>
                {/if}
                <div class="ask-bubble">
                  <span class="ask-content">{msg.content}</span>
                  {#if msg.actions && msg.actions.length > 0}
                    <div class="ask-actions">
                      {#each msg.actions as action}
                        <button class="ask-action-btn" on:click={action.handler}>
                          {action.label}
                        </button>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
            {#if $agentLoading}
              <div class="ask-msg ask-msg-agent">
                <span class="ask-avatar"><PixelIcon type="sparkle" size={12} /></span>
                <div class="ask-bubble ask-loading">
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                </div>
              </div>
            {/if}
          </div>
        {/if}
        <div class="suggestion-chips">
          {#each ASK_CHIPS as chip}
            <button class="chip" on:click={() => handleChipClick(chip)}>
              {chip.label}
            </button>
          {/each}
        </div>
      </div>

    {:else if $dockMode === 'research'}
      <!-- ═══ RESEARCH MODE ═══ -->
      <div class="exp-section">
        <div class="suggestion-chips">
          {#each IDLE_CHIPS as chip}
            <button
              class="chip"
              class:chip-active={chip.presetId === $dockPresetId}
              on:click={() => handleChipClick(chip)}
            >
              {chip.label}
            </button>
          {/each}
        </div>
      </div>

      <div class="preset-list">
        {#each PRESETS as preset (preset.id)}
          <button
            class="preset-row"
            class:preset-selected={preset.id === $dockPresetId}
            on:click={() => handlePresetClick(preset)}
          >
            <span class="preset-title">{preset.title}</span>
            <span class="preset-desc">{preset.desc}</span>
          </button>
        {/each}
      </div>

      <div class="stats-strip">
        <div class="stat"><span class="stat-val">{branchCount}</span><span class="stat-label">BRANCHES</span></div>
        <div class="stat"><span class="stat-val">{itersPerBranch}</span><span class="stat-label">ITERS/BRANCH</span></div>
        <div class="stat"><span class="stat-val">{totalExp}</span><span class="stat-label">TOTAL EXP</span></div>
        <div class="stat"><span class="stat-val">{eta}</span><span class="stat-label">ETA</span></div>
      </div>

      <button class="launch-btn" on:click={handleLaunch} disabled={!$dockTopic.trim()}>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 2l10 6-10 6z"/>
        </svg>
        Launch Autoresearch
        <span class="launch-shortcut">⌘↵</span>
      </button>

    {:else if $dockMode === 'inference'}
      <!-- ═══ INFERENCE MODE ═══ -->
      <div class="inf-view">
        <!-- Model picker chips -->
        <div class="suggestion-chips">
          {#each INFERENCE_CHIPS as chip}
            <button
              class="chip"
              class:chip-active={chip.modelId === $dockInferenceModelId}
              on:click={() => handleChipClick(chip)}
            >
              {chip.label}
            </button>
          {/each}
        </div>

        {#if selectedModel}
          <!-- Model info strip -->
          <div class="inf-model-info">
            <span class="inf-model-name">{selectedModel.name}</span>
            <div class="inf-model-stats">
              <span class="inf-stat">{selectedModel.accuracy} acc</span>
              <span class="inf-sep">·</span>
              <span class="inf-stat">{selectedModel.calls} calls</span>
              <span class="inf-sep">·</span>
              <span class="inf-stat">{selectedModel.cost}</span>
            </div>
          </div>

          <!-- Inline playground -->
          <div class="inf-playground">
            <div class="inf-col">
              <textarea class="inf-input" bind:value={infInput} rows="4" placeholder="JSON input..."></textarea>
            </div>
            <div class="inf-col">
              <pre class="inf-output" class:inf-empty={!infResult}>{infResult || 'Results appear here...'}</pre>
            </div>
          </div>

          <!-- Run button -->
          <button class="launch-btn inf-run-btn" on:click={runInference} disabled={infLoading || !$wallet.connected}>
            {#if infLoading}
              <span class="spin-sm"></span> Running...
            {:else}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>
              </svg>
              Run Inference
              <span class="launch-shortcut">0.001 HOOT</span>
            {/if}
          </button>

          {#if !$wallet.connected}
            <div class="inf-wallet-warn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/></svg>
              Connect wallet to run inference
            </div>
          {/if}
        {:else}
          <div class="inf-empty-state">
            <span class="inf-empty-icon">⚡</span>
            <span class="inf-empty-text">Select a model above to run inference</span>
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style>
  .expansion-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: min(420px, 50vh);
    overflow-y: auto;
    overflow-x: hidden;
    padding: 2px 0;
  }

  /* ═══ MODE TABS ═══ */
  .mode-tabs {
    display: flex;
    gap: 4px;
    padding: 2px;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 10px;
    margin-bottom: 4px;
  }
  .mode-tab {
    flex: 1;
    appearance: none;
    border: none;
    background: transparent;
    border-radius: 8px;
    padding: 7px 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    cursor: pointer;
    transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
    font-family: var(--font-mono, monospace);
    font-size: 0.64rem;
    font-weight: 600;
    color: var(--text-muted, #9a9590);
  }
  .mode-tab:hover {
    background: rgba(0, 0, 0, 0.04);
    color: var(--text-secondary, #6b6560);
  }
  .mode-active {
    background: rgba(255, 255, 255, 0.9);
    color: var(--accent, #D97757);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }
  .mode-active:hover {
    background: rgba(255, 255, 255, 0.95);
    color: var(--accent, #D97757);
  }
  .mode-icon {
    font-size: 0.72rem;
    line-height: 1;
  }
  .mode-label {
    letter-spacing: 0.02em;
  }

  /* ═══ ASK MODE ═══ */
  .ask-view {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ask-empty {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 12px;
    color: var(--text-muted, #9a9590);
  }
  .ask-empty-text {
    font-size: 0.72rem;
    font-weight: 500;
  }
  .ask-messages {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 240px;
    overflow-y: auto;
    padding: 4px 0;
    scroll-behavior: smooth;
  }
  .ask-msg {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    animation: msgIn 200ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes msgIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .ask-msg-user { justify-content: flex-end; }
  .ask-msg-agent { justify-content: flex-start; }
  .ask-avatar {
    flex-shrink: 0;
    width: 20px; height: 20px;
    border-radius: 6px;
    background: rgba(217, 119, 87, 0.1);
    color: var(--accent, #D97757);
    display: flex; align-items: center; justify-content: center;
    margin-top: 2px;
  }
  .ask-bubble {
    max-width: 85%;
    padding: 7px 11px;
    border-radius: 10px;
    font-size: 0.7rem;
    line-height: 1.5;
  }
  .ask-msg-user .ask-bubble {
    background: var(--accent, #D97757);
    color: white;
    border-bottom-right-radius: 3px;
  }
  .ask-msg-agent .ask-bubble {
    background: rgba(0, 0, 0, 0.04);
    color: var(--text-primary, #2D2D2D);
    border-bottom-left-radius: 3px;
  }
  .ask-content {
    white-space: pre-wrap;
    word-break: break-word;
  }
  .ask-actions {
    display: flex;
    gap: 4px;
    margin-top: 6px;
    flex-wrap: wrap;
  }
  .ask-action-btn {
    appearance: none;
    border: 1px solid rgba(217, 119, 87, 0.3);
    background: rgba(255, 255, 255, 0.9);
    font-family: var(--font-mono, monospace);
    font-size: 0.58rem;
    font-weight: 600;
    color: var(--accent, #D97757);
    padding: 3px 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 100ms;
  }
  .ask-action-btn:hover {
    background: rgba(217, 119, 87, 0.08);
    border-color: var(--accent, #D97757);
  }
  .ask-loading {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 8px 12px;
  }
  .typing-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--text-muted, #9a9590);
    animation: typingBounce 1.2s ease-in-out infinite;
  }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes typingBounce {
    0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
    40% { opacity: 1; transform: translateY(-3px); }
  }

  /* ═══ INFERENCE MODE ═══ */
  .inf-view {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .inf-model-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: rgba(217, 119, 87, 0.04);
    border: 1px solid rgba(217, 119, 87, 0.12);
    border-radius: 10px;
  }
  .inf-model-name {
    font-family: var(--font-mono, monospace);
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--text-primary, #2D2D2D);
  }
  .inf-model-stats {
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-mono, monospace);
    font-size: 0.58rem;
    color: var(--text-muted, #9a9590);
  }
  .inf-sep { color: var(--border, #E5E0DA); }
  .inf-stat { font-weight: 500; }
  .inf-playground {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .inf-input {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--border, #E5E0DA);
    border-radius: 8px;
    font-family: var(--font-mono, monospace);
    font-size: 0.66rem;
    color: var(--text-primary, #2D2D2D);
    background: var(--surface, #fff);
    resize: none;
    outline: none;
  }
  .inf-input:focus { border-color: var(--accent, #D97757); }
  .inf-output {
    margin: 0;
    padding: 8px 10px;
    border: 1px solid var(--border, #E5E0DA);
    border-radius: 8px;
    font-family: var(--font-mono, monospace);
    font-size: 0.66rem;
    color: var(--text-primary, #2D2D2D);
    background: #fafaf9;
    min-height: 80px;
    white-space: pre-wrap;
    overflow: auto;
  }
  .inf-empty { color: var(--text-muted, #9a9590); }
  .inf-run-btn {
    background: linear-gradient(135deg, var(--accent, #D97757), #e08a5c);
  }
  .inf-wallet-warn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 10px;
    border-radius: 8px;
    background: rgba(249, 226, 175, 0.12);
    border: 1px solid rgba(249, 226, 175, 0.25);
    font-size: 0.6rem;
    color: #d4a017;
    font-weight: 500;
  }
  .inf-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 12px;
    color: var(--text-muted, #9a9590);
  }
  .inf-empty-icon { font-size: 1.5rem; opacity: 0.5; }
  .inf-empty-text { font-size: 0.72rem; font-weight: 500; }
  .spin-sm {
    width: 12px; height: 12px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ═══ SUGGESTION CHIPS ═══ */
  .suggestion-chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .chip {
    appearance: none;
    border: 1px solid rgba(229, 224, 218, 0.7);
    background: rgba(0, 0, 0, 0.02);
    border-radius: 100px;
    padding: 6px 14px;
    font-family: var(--font-mono, monospace);
    font-size: 0.62rem;
    font-weight: 500;
    color: var(--text-secondary, #6b6560);
    cursor: pointer;
    transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
    white-space: nowrap;
  }
  .chip:hover {
    border-color: var(--accent, #D97757);
    color: var(--accent, #D97757);
    background: rgba(217, 119, 87, 0.06);
  }
  .chip-active {
    border-color: var(--accent, #D97757);
    color: var(--accent, #D97757);
    background: rgba(217, 119, 87, 0.08);
    font-weight: 600;
  }
  .chip-danger {
    border-color: var(--red, #c0392b);
    color: var(--red, #c0392b);
  }
  .chip-danger:hover {
    background: rgba(192, 57, 43, 0.06);
    border-color: var(--red, #c0392b);
    color: var(--red, #c0392b);
  }
  .chip-primary {
    border-color: var(--accent, #D97757);
    background: var(--accent, #D97757);
    color: #fff;
    box-shadow: 0 2px 6px rgba(217, 119, 87, 0.2);
  }
  .chip-primary:hover {
    background: color-mix(in srgb, var(--accent, #D97757) 88%, black);
    box-shadow: 0 2px 10px rgba(217, 119, 87, 0.3);
  }

  /* ═══ PRESET LIST ═══ */
  .preset-list {
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(229, 224, 218, 0.6);
    border-radius: 12px;
    overflow: hidden;
  }
  .preset-row {
    appearance: none;
    border: none;
    background: transparent;
    padding: 10px 14px;
    text-align: left;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 3px;
    border-bottom: 1px solid rgba(229, 224, 218, 0.4);
    transition: all 160ms ease;
  }
  .preset-row:last-child { border-bottom: none; }
  .preset-row:hover { background: rgba(0, 0, 0, 0.025); }
  .preset-selected {
    background: rgba(217, 119, 87, 0.05);
    border-left: 3px solid var(--accent, #D97757);
  }
  .preset-title {
    font-family: var(--font-mono, monospace);
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--text-primary, #2D2D2D);
  }
  .preset-desc {
    font-size: 0.58rem;
    color: var(--text-muted, #9a9590);
  }

  /* ═══ STATS STRIP ═══ */
  .stats-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    text-align: center;
    padding: 6px 0;
  }
  .stat {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .stat-val {
    font-family: var(--font-mono, monospace);
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    font-variant-numeric: tabular-nums;
  }
  .stat-label {
    font-family: var(--font-mono, monospace);
    font-size: 0.4rem;
    font-weight: 600;
    color: var(--text-muted, #9a9590);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  /* ═══ LAUNCH BUTTON ═══ */
  .launch-btn {
    appearance: none;
    border: none;
    background: var(--accent, #D97757);
    color: #fff;
    border-radius: 100px;
    padding: 11px 24px;
    font-family: var(--font-mono, monospace);
    font-size: 0.76rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
    width: 100%;
    box-shadow: 0 2px 8px rgba(217, 119, 87, 0.15);
  }
  .launch-btn:hover:not(:disabled) {
    background: color-mix(in srgb, var(--accent, #D97757) 88%, black);
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(217, 119, 87, 0.3);
  }
  .launch-btn:active:not(:disabled) {
    transform: scale(0.98);
  }
  .launch-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .launch-shortcut {
    font-size: 0.56rem;
    opacity: 0.7;
    font-weight: 500;
  }

  /* ═══ RUNNING VIEW ═══ */
  .running-view {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .running-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .running-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent, #D97757);
    animation: dotPulse 1.5s ease-in-out infinite;
    flex-shrink: 0;
  }
  @keyframes dotPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  .running-topic {
    font-family: var(--font-mono, monospace);
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-primary, #2D2D2D);
  }
  .running-progress-bar {
    height: 4px;
    border-radius: 2px;
    background: var(--border-subtle, #EDEAE5);
    overflow: hidden;
  }
  .running-progress-fill {
    height: 100%;
    border-radius: 2px;
    background: var(--accent, #D97757);
    transition: width 300ms ease;
  }
  .running-meta {
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-mono, monospace);
    font-size: 0.58rem;
    color: var(--text-muted, #9a9590);
    font-variant-numeric: tabular-nums;
  }
  .meta-sep {
    color: var(--border, #E5E0DA);
  }

  /* ═══ COMPLETE VIEW ═══ */
  .complete-view {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .complete-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .complete-check {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--green, #27864a);
    color: #fff;
    font-size: 0.6rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .complete-topic {
    font-family: var(--font-mono, monospace);
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-primary, #2D2D2D);
  }
  .complete-meta {
    font-family: var(--font-mono, monospace);
    font-size: 0.6rem;
    color: var(--text-secondary, #6b6560);
    font-variant-numeric: tabular-nums;
  }

  /* ═══ RESPONSIVE ═══ */
  @media (max-width: 600px) {
    .expansion-body {
      max-height: min(320px, 45vh);
    }
    .stats-strip {
      grid-template-columns: repeat(2, 1fr);
    }
    .mode-tab { padding: 6px 8px; font-size: 0.58rem; }
    .preset-title { font-size: 0.68rem; }
    .chip { padding: 4px 10px; font-size: 0.56rem; }
    .inf-playground { grid-template-columns: 1fr; }
    .ask-messages { max-height: 180px; }
  }
</style>
