<script lang="ts">
  /**
   * StudioStep2 — Type-specific Options + Research Plan
   *
   * Shows:
   *   - Research type badge with PixelIcon
   *   - Type-specific option cards (model size, base LLM, data source, etc.)
   *   - AI recommendation: branches, experiments, budget
   *   - Resource selection: demo / local / network / hybrid
   *   - [Advanced Settings] → SETUP
   *   - [Start Research] → RUNNING
   *
   * Events:
   *   back: void — go to STEP1-TOPIC
   *   startResearch: { topic: string; resourceMode: ResourceMode }
   *   goToSetup: { topic: string }
   */
  import { createEventDispatcher } from 'svelte';
  import { studioStore, studioTopic, studioResourceMode, studioResearchType, type ResourceMode } from '../../stores/studioStore.ts';
  import { dashboardStore } from '../../stores/dashboardStore.ts';
  import { RESEARCH_TYPES } from '../../data/researchTypes.ts';
  import {
    getEnabledBranches,
    getTotalExperiments,
    estimateBudgetHoot,
    createOntologyFromPreset,
    ONTOLOGY_PRESETS,
  } from '../../data/ontologyData.ts';
  import PixelIcon from '../PixelIcon.svelte';

  const dispatch = createEventDispatcher<{
    back: void;
    startResearch: { topic: string; resourceMode: ResourceMode };
    goToSetup: { topic: string };
  }>();

  let resourceMode: ResourceMode = $studioResourceMode;
  let selectedOption: string | null = $studioStore.step2Selection;

  // Topic + type from studioStore
  $: topic = $studioTopic;
  $: researchType = $studioResearchType;
  $: typeData = researchType ? RESEARCH_TYPES.find(t => t.id === researchType) : null;

  // Preset detection
  $: currentPresetId = $studioStore.createPreset;
  $: matchedPreset = currentPresetId
    ? ONTOLOGY_PRESETS.find(p => p.id === currentPresetId)
    : null;

  // AI recommendation data
  $: recoOntology = matchedPreset
    ? createOntologyFromPreset(currentPresetId!)
    : createOntologyFromPreset('balanced');

  $: recoBranches = getEnabledBranches(recoOntology);
  $: recoTotal = getTotalExperiments(recoOntology);
  $: recoBudget = estimateBudgetHoot(recoOntology);
  $: recoMetric = recoOntology.evaluation?.metric ?? 'accuracy';
  $: recoDirection = recoOntology.evaluation?.direction ?? 'maximize';
  $: estimatedTime = typeData?.time || (recoTotal > 60 ? '~2h' : recoTotal > 30 ? '~1h' : '~30m');

  // Fork source
  $: forkSource = $studioStore.forkSource;

  // Resource options
  $: hasGpu = false;
  $: hasWallet = $dashboardStore.isLoggedIn;
  $: resourceOptions = buildResourceOptions(hasGpu, hasWallet);

  function buildResourceOptions(gpu: boolean, wallet: boolean) {
    const opts: { id: ResourceMode; label: string; desc: string; available: boolean }[] = [
      { id: 'demo', label: 'Demo', desc: 'Free simulation mode', available: true },
    ];
    if (gpu) {
      opts.push({ id: 'local', label: 'My GPU', desc: 'Local compute, free', available: true });
    }
    if (wallet) {
      opts.push({ id: 'network', label: 'Network', desc: `~${recoBudget} HOOT`, available: true });
    }
    if (gpu && wallet) {
      opts.push({ id: 'hybrid', label: 'Hybrid', desc: `~${Math.round(recoBudget / 2)} HOOT`, available: true });
    }
    return opts;
  }

  function selectOption(optId: string) {
    selectedOption = optId;
    studioStore.setStep2Selection(optId);
  }

  function handleStart() {
    if (!topic.trim()) return;
    studioStore.setResourceMode(resourceMode);
    dispatch('startResearch', { topic: topic.trim(), resourceMode });
  }

  function handleSetup() {
    dispatch('goToSetup', { topic: topic.trim() });
  }
</script>

<div class="step2">
  <div class="step2-header">
    <button class="back-btn" on:click={() => dispatch('back')} aria-label="Back">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span class="back-topic">{topic}</span>
    </button>
  </div>

  <div class="step2-body">
    <!-- Fork indicator -->
    {#if forkSource}
      <div class="fork-banner">
        <PixelIcon type="ontology" size={14} />
        <span class="fb-text">Fork from: <strong>{forkSource}</strong></span>
        <button class="fb-clear" on:click={() => studioStore.setForkSource(null)}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>
    {/if}

    <!-- Type badge -->
    {#if typeData}
      <div class="type-badge" style:--badge-color={typeData.accentColor}>
        <span class="tb-icon-wrap">
          <PixelIcon type={typeData.pixelIcon} size={14} />
        </span>
        <span class="tb-name">{typeData.name}</span>
        <span class="tb-divider"></span>
        <span class="tb-time">{typeData.time}</span>
      </div>
    {/if}

    <h2 class="step2-title">Configure your research</h2>

    <!-- Type-specific options -->
    {#if typeData}
      <div class="option-section">
        <span class="section-label">{typeData.step2Label}</span>
        <div class="option-cards">
          {#each typeData.step2Options as opt, i (opt.id)}
            <button
              class="option-card"
              class:option-selected={selectedOption === opt.id}
              on:click={() => selectOption(opt.id)}
              style:animation-delay="{i * 60}ms"
            >
              <span class="oc-icon-wrap" style:--oc-accent={typeData.accentColor}>
                {#if opt.pixelIcon}
                  <PixelIcon type={opt.pixelIcon} size={16} />
                {:else}
                  <PixelIcon type="sparkle" size={16} />
                {/if}
              </span>
              <div class="oc-body">
                <span class="oc-label">{opt.label}</span>
                <span class="oc-desc">{opt.desc}</span>
              </div>
              <span class="oc-radio">
                {#if selectedOption === opt.id}
                  <span class="oc-radio-inner"></span>
                {/if}
              </span>
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- AI Recommendation Card -->
    <div class="reco-card">
      <div class="reco-header">
        <PixelIcon type="sparkle" size={12} />
        <span class="reco-title">
          {#if matchedPreset}
            {matchedPreset.name} preset
          {:else}
            AI Recommendation
          {/if}
        </span>
      </div>

      <div class="reco-branches">
        {#each recoBranches as br, i}
          <div class="reco-branch" style:animation-delay="{i * 40}ms">
            <span class="rb-dot" style:background={br.color || 'var(--accent)'}></span>
            <div class="rb-body">
              <span class="rb-name">{br.label || br.type.replace('_', ' ')}</span>
              <span class="rb-iters">{br.iters} iterations</span>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Summary -->
    <div class="summary-card">
      <div class="summary-row">
        <span class="sum-label">Total Experiments</span>
        <span class="sum-value">{recoTotal}</span>
      </div>
      <div class="summary-row">
        <span class="sum-label">Est. Time</span>
        <span class="sum-value">{estimatedTime}</span>
      </div>
      <div class="summary-row">
        <span class="sum-label">Est. Cost</span>
        <span class="sum-value sum-accent">~{recoBudget} HOOT</span>
      </div>
      <div class="summary-row">
        <span class="sum-label">Metric</span>
        <span class="sum-value">{recoMetric} ({recoDirection})</span>
      </div>
      <div class="summary-row">
        <span class="sum-label">Data</span>
        <span class="sum-value">AI auto-collection</span>
      </div>
    </div>

    <!-- Resource selection -->
    <div class="resource-section">
      <span class="section-label">Execution Mode</span>
      <div class="resource-options">
        {#each resourceOptions as opt}
          <label class="resource-option" class:selected={resourceMode === opt.id}>
            <input type="radio" name="resource" value={opt.id} bind:group={resourceMode} />
            <span class="ro-radio">
              {#if resourceMode === opt.id}
                <span class="ro-radio-inner"></span>
              {/if}
            </span>
            <div class="ro-body">
              <span class="ro-label">{opt.label}</span>
              <span class="ro-desc">{opt.desc}</span>
            </div>
          </label>
        {/each}
      </div>
    </div>

    <!-- Wallet CTA (Guest only) -->
    {#if !hasWallet}
      <div class="wallet-cta">
        <PixelIcon type="protocol" size={14} />
        <span>Connect wallet to run on actual GPUs</span>
      </div>
    {/if}

    <!-- Actions -->
    <div class="step2-actions">
      <button class="setup-btn" on:click={handleSetup}>
        <span>Advanced</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/></svg>
      </button>
      <button class="start-btn" on:click={handleStart} disabled={!topic.trim()}>
        <span>Start Research</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
  </div>
</div>

<style>
  .step2 {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
    padding-bottom: 100px;
  }

  .step2-header { padding: 16px 28px 8px; }

  .back-btn {
    appearance: none;
    border: none;
    background: none;
    padding: 6px 10px 6px 6px;
    cursor: pointer;
    color: var(--text-muted, #9a9590);
    display: flex;
    align-items: center;
    gap: 6px;
    border-radius: 100px;
    font-size: 0.76rem;
    font-weight: 500;
    transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
    max-width: 100%;
  }
  .back-btn:hover {
    color: var(--accent, #D97757);
    background: rgba(217, 119, 87, 0.06);
  }
  .back-topic {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .step2-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 22px;
    padding: 8px 32px 40px;
    max-width: 520px;
    margin: 0 auto;
    width: 100%;
  }

  .step2-title {
    font-family: var(--font-display, 'Playfair Display', serif);
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    margin: 0;
    text-align: center;
    letter-spacing: -0.01em;
    line-height: 1.25;
  }

  /* ── Type badge ── */
  .type-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 16px 7px 8px;
    border-radius: 100px;
    background: color-mix(in srgb, var(--badge-color, var(--accent)) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--badge-color, var(--accent)) 18%, transparent);
  }
  .tb-icon-wrap {
    width: 26px;
    height: 26px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--badge-color, var(--accent)) 14%, transparent);
    color: var(--badge-color, var(--accent));
  }
  .tb-name {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--badge-color, var(--accent));
  }
  .tb-divider {
    width: 1px;
    height: 12px;
    background: color-mix(in srgb, var(--badge-color, var(--accent)) 20%, transparent);
  }
  .tb-time {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.62rem;
    color: var(--text-muted, #9a9590);
  }

  /* ── Section label ── */
  .section-label {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--text-muted, #9a9590);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  /* ═══ TYPE-SPECIFIC OPTION CARDS ═══ */
  @keyframes cardEntrance {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .option-section {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .option-cards {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .option-card {
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
    animation: cardEntrance 600ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
  }
  .option-card:hover {
    border-color: color-mix(in srgb, var(--oc-accent, var(--accent)) 35%, transparent);
    background: rgba(255, 255, 255, 0.88);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
    transform: translateY(-1px);
  }
  .option-selected {
    border-color: var(--accent, #D97757);
    background: rgba(217, 119, 87, 0.03);
    box-shadow: 0 0 0 2px rgba(217, 119, 87, 0.1), 0 2px 8px rgba(217, 119, 87, 0.04);
  }

  .oc-icon-wrap {
    flex-shrink: 0;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--oc-accent, var(--accent)) 8%, transparent);
    color: color-mix(in srgb, var(--oc-accent, var(--accent)) 80%, #444);
    transition: all 240ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .option-selected .oc-icon-wrap {
    background: color-mix(in srgb, var(--accent, #D97757) 14%, transparent);
    color: var(--accent, #D97757);
  }

  .oc-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .oc-label {
    font-size: 0.84rem;
    font-weight: 600;
    color: var(--text-primary, #2D2D2D);
    letter-spacing: -0.005em;
  }
  .oc-desc {
    font-size: 0.68rem;
    color: var(--text-muted, #9a9590);
    line-height: 1.35;
  }
  .oc-radio {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid var(--border, #E5E0DA);
    flex-shrink: 0;
    transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .option-selected .oc-radio {
    border-color: var(--accent, #D97757);
  }
  .oc-radio-inner {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent, #D97757);
    animation: radioIn 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  @keyframes radioIn {
    from { transform: scale(0); }
    to { transform: scale(1); }
  }

  /* ── Recommendation Card ── */
  .reco-card {
    width: 100%;
    padding: 18px;
    border: 1px solid var(--border-subtle, #EDEAE5);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .reco-header {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--accent, #D97757);
  }
  .reco-title {
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--accent, #D97757);
  }

  .reco-branches {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .reco-branch {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.015);
    animation: cardEntrance 500ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
  }
  .rb-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .rb-body {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .rb-name {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-primary, #2D2D2D);
    text-transform: capitalize;
    letter-spacing: -0.005em;
  }
  .rb-iters {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.6rem;
    color: var(--text-muted, #9a9590);
  }

  /* ── Summary Card ── */
  .summary-card {
    width: 100%;
    padding: 16px 18px;
    border: 1px solid var(--border-subtle, #EDEAE5);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 0;
  }
  .summary-row + .summary-row {
    border-top: 1px solid rgba(0, 0, 0, 0.03);
  }
  .sum-label {
    font-size: 0.74rem;
    color: var(--text-secondary, #6b6560);
  }
  .sum-value {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.74rem;
    font-weight: 600;
    color: var(--text-primary, #2D2D2D);
  }
  .sum-accent { color: var(--accent, #D97757); }

  /* ── Resource selection ── */
  .resource-section {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .resource-options {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .resource-option {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid var(--border, #E5E0DA);
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    cursor: pointer;
    transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .resource-option:hover {
    background: rgba(255, 255, 255, 0.88);
    border-color: color-mix(in srgb, var(--accent, #D97757) 30%, transparent);
  }
  .resource-option.selected {
    border-color: var(--accent, #D97757);
    background: rgba(217, 119, 87, 0.03);
    box-shadow: 0 0 0 2px rgba(217, 119, 87, 0.08);
  }
  .resource-option input { display: none; }
  .ro-radio {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid var(--border, #E5E0DA);
    flex-shrink: 0;
    transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .resource-option.selected .ro-radio {
    border-color: var(--accent, #D97757);
  }
  .ro-radio-inner {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent, #D97757);
    animation: radioIn 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .ro-body {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  .ro-label {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-primary, #2D2D2D);
  }
  .ro-desc {
    font-size: 0.6rem;
    color: var(--text-muted, #9a9590);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }

  /* ── Wallet CTA ── */
  .wallet-cta {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-radius: 12px;
    background: rgba(45, 108, 162, 0.04);
    border: 1px solid rgba(45, 108, 162, 0.12);
    font-size: 0.72rem;
    color: var(--blue, #2d6ca2);
  }

  /* ── Actions ── */
  .step2-actions {
    width: 100%;
    display: flex;
    gap: 10px;
    padding-top: 4px;
  }
  .setup-btn {
    padding: 13px 20px;
    border-radius: 100px;
    border: 1px solid var(--border, #E5E0DA);
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--text-secondary, #6b6560);
    cursor: pointer;
    transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }
  .setup-btn:hover {
    border-color: var(--accent, #D97757);
    color: var(--accent, #D97757);
    background: rgba(255, 255, 255, 0.88);
  }
  .start-btn {
    flex: 1;
    padding: 13px 24px;
    border-radius: 100px;
    border: none;
    background: var(--accent, #D97757);
    color: #fff;
    font-size: 0.84rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 2px 12px rgba(217, 119, 87, 0.3), 0 1px 4px rgba(217, 119, 87, 0.15);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    letter-spacing: 0.01em;
  }
  .start-btn::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 48%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.25) 52%, transparent 60%);
    transform: translateX(-200%);
  }
  .start-btn:hover:not(:disabled)::after { animation: shimmer 700ms ease-out; }
  @keyframes shimmer {
    from { transform: translateX(-200%); }
    to { transform: translateX(200%); }
  }
  .start-btn:hover:not(:disabled) {
    background: var(--accent-hover, #C4644A);
    box-shadow: 0 6px 24px rgba(217, 119, 87, 0.35), 0 2px 8px rgba(217, 119, 87, 0.2);
    transform: translateY(-2px);
  }
  .start-btn:active:not(:disabled) {
    transform: translateY(0);
    transition-duration: 80ms;
  }
  .start-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .start-btn svg {
    transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .start-btn:hover:not(:disabled) svg {
    transform: translateX(3px);
  }

  /* ── Fork banner ── */
  .fork-banner {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border-radius: 12px;
    background: rgba(41, 128, 185, 0.04);
    border: 1px solid rgba(41, 128, 185, 0.12);
    color: var(--text-secondary, #6b6560);
  }
  .fb-text {
    flex: 1;
    font-size: 0.72rem;
  }
  .fb-text strong {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    color: var(--text-primary, #2D2D2D);
    font-weight: 600;
  }
  .fb-clear {
    appearance: none; border: none; background: none;
    color: var(--text-muted, #9a9590);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    transition: all 150ms;
  }
  .fb-clear:hover { background: rgba(0,0,0,0.04); color: var(--text-primary); }

  @media (max-width: 640px) {
    .step2-body { padding: 8px 16px 40px; gap: 18px; }
    .step2-title { font-size: 1.2rem; }
    .step2-actions { flex-direction: column; }
    .option-card { padding: 12px 14px; gap: 10px; }
    .oc-icon-wrap { width: 30px; height: 30px; }
    .oc-label { font-size: 0.8rem; }
    .resource-options { flex-direction: column; }
    .start-btn { padding: 13px 20px; }
    .setup-btn { justify-content: center; }
  }
</style>
