<script lang="ts">
  import { router } from "../stores/router.ts";
  import { jobStore } from "../stores/jobStore.ts";

  let researchName = "";
  let description = "";
  let metric = "bal_acc";
  let metricDirection: "maximize" | "minimize" = "maximize";
  let targetThreshold = 0.7;
  let branches = 6;
  let itersPerBranch = 50;
  let dataTab: "auto" | "csv" | "instructions" = "auto";
  let dataInstructions = "";
  let completionMode: "target" | "all" = "target";
  let launching = false;

  // Accordion — only one open at a time
  let openSection: string | null = "definition";

  function toggleSection(key: string) {
    openSection = openSection === key ? null : key;
  }

  $: totalExperiments = branches * itersPerBranch;
  $: nameValid = researchName.trim().length >= 3;
  $: descValid = description.trim().length > 0;
  $: canLaunch = nameValid && !launching;

  $: dataSourceLabel = dataTab === 'auto'
    ? 'LLM auto-generates dataset'
    : dataTab === 'csv'
    ? 'No file selected'
    : dataInstructions ? 'No instructions' : 'No instructions';

  const presets = [
    { label: "Crypto Market Prediction", name: "Crypto Market Prediction", desc: "Predict short-term cryptocurrency price movements using on-chain metrics, market data, and sentiment indicators" },
    { label: "DeFi Protocol Risk", name: "DeFi Protocol Risk Analysis", desc: "Assess risk levels across DeFi protocols" },
    { label: "Fraud Detection", name: "Fraud Detection", desc: "Identify fraudulent transactions and behavior" },
    { label: "Time Series Forecasting", name: "Time Series Forecasting", desc: "General time series prediction" },
  ];

  function applyPreset(preset: typeof presets[0]) {
    researchName = preset.name;
    description = preset.desc;
    openSection = "definition";
  }

  function handleLaunch() {
    if (launching) return;
    launching = true;
    jobStore.startJob(researchName.trim(), branches, itersPerBranch);
    setTimeout(() => {
      router.navigate("autoresearch", { topic: researchName.trim() });
    }, 600);
  }

  const fieldIds = {
    researchName: "research-name",
    description: "research-description",
    metric: "research-metric",
    targetThreshold: "target-threshold-input",
    branches: "parallel-branches-input",
    itersPerBranch: "iterations-per-branch-input",
    dataInstructions: "data-generation-instructions",
  };
</script>

<div class="ontology" data-theme="light">
  <!-- Back link -->
  <button class="back-link" on:click={() => router.navigate('dashboard')}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    Dashboard
  </button>

  <!-- Page Header -->
  <div class="page-header">
    <div class="header-icon">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="5" r="3" stroke="currentColor" stroke-width="1.5"/>
        <circle cx="5" cy="19" r="3" stroke="currentColor" stroke-width="1.5"/>
        <circle cx="19" cy="19" r="3" stroke="currentColor" stroke-width="1.5"/>
        <path d="M12 8v3M12 11l-5.5 5M12 11l5.5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </div>
    <h1 class="page-title">Define Research Ontology</h1>
    <p class="page-sub">Configure a research domain, metrics, and strategy — then launch parallel autoresearch.</p>
  </div>

  <!-- Quick Presets -->
  <div class="presets">
    <span class="presets-label">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/></svg>
      QUICK PRESETS
    </span>
    <div class="preset-chips">
      {#each presets as preset}
        <button class="preset-chip" on:click={() => applyPreset(preset)}>{preset.label}</button>
      {/each}
    </div>
  </div>

  <!-- Two Column Layout -->
  <div class="two-col">
    <!-- Left: Configuration Form -->
    <div class="form-col">

      <!-- Section 1: Ontology Definition -->
      <div class="acc-section" class:open={openSection === 'definition'}>
        <button class="acc-header" on:click={() => toggleSection('definition')}>
          <span class="acc-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </span>
          <span class="acc-title">Ontology Definition</span>
          <span class="required-badge">REQUIRED</span>
          <span class="acc-chevron">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </button>
        {#if openSection === 'definition'}
          <div class="acc-body">
            <div class="form-group">
              <label class="form-label" for={fieldIds.researchName}>Research Name</label>
              <input
                id={fieldIds.researchName}
                type="text"
                class="form-input"
                class:invalid={researchName.length > 0 && !nameValid}
                placeholder="e.g., Crypto Market Prediction"
                bind:value={researchName}
              />
              {#if researchName.length > 0 && !nameValid}
                <span class="form-hint error">Minimum 3 characters required</span>
              {/if}
            </div>
            <div class="form-group">
              <label class="form-label" for={fieldIds.description}>Description</label>
              <textarea
                id={fieldIds.description}
                class="form-textarea"
                placeholder="Describe the research goal and what you want to predict..."
                bind:value={description}
                rows="3"
              ></textarea>
              <span class="form-hint">{description.length}/500</span>
            </div>
          </div>
        {/if}
      </div>

      <!-- Section 2: Metrics & Target -->
      <div class="acc-section" class:open={openSection === 'metrics'}>
        <button class="acc-header" on:click={() => toggleSection('metrics')}>
          <span class="acc-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </span>
          <span class="acc-title">Metrics & Target</span>
          <span class="acc-chevron">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </button>
        {#if openSection === 'metrics'}
          <div class="acc-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for={fieldIds.metric}>Metric Name</label>
                <input id={fieldIds.metric} type="text" class="form-input mono-input" bind:value={metric} />
              </div>
              <div class="form-group">
                <span id="metric-direction-label" class="form-label">Direction</span>
                <div class="toggle-group" role="group" aria-labelledby="metric-direction-label">
                  <button type="button" class="toggle-btn" class:active={metricDirection === 'maximize'} on:click={() => metricDirection = 'maximize'}>maximize</button>
                  <button type="button" class="toggle-btn" class:active={metricDirection === 'minimize'} on:click={() => metricDirection = 'minimize'}>minimize</button>
                </div>
              </div>
            </div>
            <div class="form-group">
              <div class="label-row">
                <label class="form-label" for={fieldIds.targetThreshold}>Target Threshold</label>
                <span class="label-hint">Job completes when metric >= this value</span>
              </div>
              <div class="slider-row">
                <input type="range" class="range-input" min="0" max="1" step="0.01" bind:value={targetThreshold} aria-label="Target threshold slider" />
                <input id={fieldIds.targetThreshold} type="text" class="form-input small-input mono-input" bind:value={targetThreshold} />
              </div>
            </div>
            <div class="form-group">
              <span id="completion-mode-label" class="form-label">Completion Mode</span>
              <div class="toggle-group wide" role="group" aria-labelledby="completion-mode-label">
                <button type="button" class="toggle-btn" class:active={completionMode === 'target'} on:click={() => completionMode = 'target'}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
                  Target Metric
                </button>
                <button type="button" class="toggle-btn" class:active={completionMode === 'all'} on:click={() => completionMode = 'all'}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/></svg>
                  Run All Iterations
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Section 3: Branch Strategy -->
      <div class="acc-section" class:open={openSection === 'branch'}>
        <button class="acc-header" on:click={() => toggleSection('branch')}>
          <span class="acc-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" stroke-width="1.5"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="1.5"/></svg>
          </span>
          <span class="acc-title">Branch Strategy</span>
          <span class="acc-chevron">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </button>
        {#if openSection === 'branch'}
          <div class="acc-body">
            <div class="form-row">
              <div class="form-group">
                <div class="label-row">
                  <label class="form-label" for={fieldIds.branches}>Parallel Branches</label>
                  <span class="label-hint">1-20</span>
                </div>
                <div class="slider-row">
                  <input type="range" class="range-input" min="1" max="20" step="1" bind:value={branches} aria-label="Parallel branches slider" />
                  <input id={fieldIds.branches} type="number" class="form-input small-input mono-input" min="1" max="20" bind:value={branches} />
                </div>
              </div>
              <div class="form-group">
                <div class="label-row">
                  <label class="form-label" for={fieldIds.itersPerBranch}>Iterations / Branch</label>
                  <span class="label-hint">5-200</span>
                </div>
                <div class="slider-row">
                  <input type="range" class="range-input" min="5" max="200" step="5" bind:value={itersPerBranch} aria-label="Iterations per branch slider" />
                  <input id={fieldIds.itersPerBranch} type="number" class="form-input small-input mono-input" min="5" max="200" bind:value={itersPerBranch} />
                </div>
              </div>
            </div>
            <div class="info-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              Total experiments: <strong>{totalExperiments}</strong> across {branches} branches
            </div>
          </div>
        {/if}
      </div>

      <!-- Section 4: Dataset -->
      <div class="acc-section" class:open={openSection === 'dataset'}>
        <button class="acc-header" on:click={() => toggleSection('dataset')}>
          <span class="acc-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.5"/><polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="1.5"/></svg>
          </span>
          <span class="acc-title">Dataset</span>
          <span class="optional-badge">OPTIONAL</span>
          <span class="acc-chevron">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </button>
        {#if openSection === 'dataset'}
          <div class="acc-body">
            <div class="data-tabs">
              <button type="button" class="data-tab" class:active={dataTab === 'auto'} on:click={() => dataTab = 'auto'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M12 1v2M12 21v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                LLM Auto-generate
              </button>
              <button type="button" class="data-tab" class:active={dataTab === 'csv'} on:click={() => dataTab = 'csv'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Upload CSV
              </button>
              <button type="button" class="data-tab" class:active={dataTab === 'instructions'} on:click={() => dataTab = 'instructions'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.5"/><path d="M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                Instructions
              </button>
            </div>
            {#if dataTab === 'auto'}
              <div class="data-content">
                <div class="info-row">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                  The LLM will analyze your topic and automatically collect/generate an appropriate dataset using web APIs and data pipelines.
                </div>
              </div>
            {:else if dataTab === 'csv'}
              <div class="data-content">
                <div class="upload-zone">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  <span class="upload-text">Drop CSV or click to upload</span>
                  <span class="upload-hint">Max 50MB, UTF-8 encoded</span>
                </div>
              </div>
            {:else}
              <div class="data-content">
                <label class="form-label" for={fieldIds.dataInstructions}>Data Generation Instructions</label>
                <textarea
                  id={fieldIds.dataInstructions}
                  class="form-textarea"
                  placeholder="e.g., Fetch ETH price data from CoinGecko for the last 2 years, calculate 7/14/30 day moving averages, RSI, MACD..."
                  bind:value={dataInstructions}
                  rows="4"
                ></textarea>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <!-- Right: Research Plan Preview -->
    <div class="preview-col">
      <div class="preview-card">
        <h3 class="preview-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" stroke-width="1.5"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33" stroke="currentColor" stroke-width="1.5"/></svg>
          Research Plan Preview
        </h3>
        <div class="preview-rows">
          <div class="preview-row">
            <span class="preview-label">Name</span>
            <span class="preview-value bold">{researchName || '—'}</span>
          </div>
          <div class="preview-row">
            <span class="preview-label">Metric</span>
            <span class="preview-value">{metric} ({metricDirection})</span>
          </div>
          <div class="preview-row">
            <span class="preview-label">Target</span>
            <span class="preview-value accent">&ge; {targetThreshold}</span>
          </div>
          <div class="preview-row">
            <span class="preview-label">Branches</span>
            <span class="preview-value">{branches}</span>
          </div>
          <div class="preview-row">
            <span class="preview-label">Iters/Branch</span>
            <span class="preview-value">{itersPerBranch}</span>
          </div>
          <div class="preview-row highlight">
            <span class="preview-label">Total Experiments</span>
            <span class="preview-value accent">{totalExperiments}</span>
          </div>
          <div class="preview-row">
            <span class="preview-label">Data Source</span>
            <span class="preview-value">{dataTab === 'auto' ? 'LLM auto-generates dataset' : dataTab === 'csv' ? 'No file selected' : dataInstructions ? 'No instructions' : 'No instructions'}</span>
          </div>
          <div class="preview-row">
            <span class="preview-label">Completion</span>
            <span class="preview-value">{completionMode === 'target' ? `${metric} \u2265 ${targetThreshold}` : 'Run all iterations'}</span>
          </div>
        </div>

        <!-- Description -->
        {#if description}
          <div class="preview-desc-section">
            <span class="preview-desc-label">Description</span>
            <p class="preview-desc-text">{description}</p>
          </div>
        {/if}

        <!-- Validation Checklist -->
        <div class="validation">
          <div class="validation-item" class:success={nameValid} class:pending={!nameValid}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              {#if nameValid}
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              {:else}
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              {/if}
            </svg>
            Name: {researchName || 'Not set'}
          </div>
          <div class="validation-item" class:success={descValid} class:pending={!descValid}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              {#if descValid}
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              {:else}
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              {/if}
            </svg>
            {descValid ? 'Description provided' : 'Description (optional)'}
          </div>
          <div class="validation-item success">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
              <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Metric configured: {metric}
          </div>
        </div>

        <!-- Launch Button -->
        <button
          class="launch-btn"
          class:launching
          disabled={!canLaunch}
          on:click={handleLaunch}
        >
          {#if launching}
            <span class="launch-spinner"></span>
            Launching...
          {:else}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>
            Launch Autoresearch
          {/if}
        </button>
        <p class="launch-hint">This will create a karpathy_autoresearch job and redirect to the dashboard.</p>
      </div>
    </div>
  </div>
</div>

<style>
  .ontology {
    padding: var(--space-6, 24px);
    max-width: 1280px;
    width: 100%;
    min-width: 0;
    margin: 0 auto;
  }

  /* Back Link */
  .back-link {
    appearance: none;
    border: none;
    background: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    color: var(--text-muted, #9a9590);
    cursor: pointer;
    padding: 0;
    margin-bottom: var(--space-3, 12px);
    transition: color 150ms;
  }
  .back-link:hover { color: var(--accent, #D97757); }

  /* Page Header */
  .page-header {
    margin-bottom: var(--space-5, 20px);
  }
  .header-icon {
    color: var(--text-primary, #2D2D2D);
    margin-bottom: 6px;
  }
  .page-title {
    font-family: var(--font-display, 'Playfair Display', serif);
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    margin: 0 0 6px;
    letter-spacing: -0.01em;
  }
  .page-sub {
    font-size: 0.88rem;
    color: var(--text-secondary, #6b6560);
    margin: 0;
    line-height: 1.5;
  }

  /* Presets */
  .presets {
    margin-bottom: var(--space-5, 20px);
  }
  .presets-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted, #9a9590);
    margin-bottom: var(--space-3, 12px);
  }
  .preset-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .preset-chip {
    appearance: none;
    border: 1px solid var(--border, #E5E0DA);
    background: var(--surface, #fff);
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--text-primary, #2D2D2D);
    cursor: pointer;
    transition: all 150ms;
  }
  .preset-chip:hover {
    border-color: var(--accent, #D97757);
    color: var(--accent, #D97757);
    background: rgba(217, 119, 87, 0.04);
  }

  /* Two Column */
  .two-col {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: var(--space-6, 24px);
    align-items: start;
  }

  /* Accordion Sections */
  .acc-section {
    background: var(--surface, #fff);
    border: 1px solid var(--border, #E5E0DA);
    border-radius: var(--radius-md, 10px);
    margin-bottom: var(--space-3, 12px);
    overflow: hidden;
    transition: border-color 200ms;
  }
  .acc-section.open {
    border-color: var(--border, #E5E0DA);
  }
  .acc-header {
    appearance: none;
    border: none;
    background: none;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px var(--space-4, 16px);
    cursor: pointer;
    transition: background 100ms;
  }
  .acc-header:hover {
    background: rgba(0, 0, 0, 0.015);
  }
  .acc-icon {
    color: var(--text-muted, #9a9590);
    display: flex;
    flex-shrink: 0;
  }
  .acc-title {
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-primary, #2D2D2D);
    flex: 1;
    text-align: left;
  }
  .acc-chevron {
    color: var(--text-muted, #9a9590);
    display: flex;
    transition: transform 200ms;
  }
  .acc-section.open .acc-chevron {
    transform: rotate(180deg);
  }

  .required-badge {
    padding: 2px 8px;
    border-radius: 4px;
    background: rgba(217, 119, 87, 0.1);
    color: var(--accent, #D97757);
    font-size: 0.52rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }
  .optional-badge {
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--border-subtle, #EDEAE5);
    color: var(--text-muted, #9a9590);
    font-size: 0.52rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }

  .acc-body {
    padding: 0 var(--space-4, 16px) var(--space-4, 16px);
    border-top: 1px solid var(--border-subtle, #EDEAE5);
    padding-top: var(--space-4, 16px);
  }

  /* Form Elements */
  .form-group { margin-bottom: var(--space-4, 16px); }
  .form-group:last-child { margin-bottom: 0; }
  .form-label {
    display: block;
    font-size: 0.76rem;
    font-weight: 600;
    color: var(--text-secondary, #6b6560);
    margin-bottom: 6px;
  }
  .label-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .label-row .form-label { margin-bottom: 0; }
  .label-hint {
    font-size: 0.66rem;
    color: var(--text-muted, #9a9590);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }

  .form-input, .form-textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border, #E5E0DA);
    border-radius: var(--radius-sm, 6px);
    font-size: 0.88rem;
    font-family: var(--font-body);
    color: var(--text-primary, #2D2D2D);
    background: var(--surface, #fff);
    transition: border-color 150ms, box-shadow 150ms;
  }
  .form-input:focus, .form-textarea:focus {
    outline: none;
    border-color: var(--accent, #D97757);
    box-shadow: 0 0 0 3px rgba(217, 119, 87, 0.08);
  }
  .form-input.invalid { border-color: var(--red, #c0392b); }
  .form-textarea { resize: vertical; }
  .mono-input {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.82rem;
  }
  .small-input {
    width: 72px;
    text-align: center;
    flex-shrink: 0;
    padding: 8px 6px;
  }
  .form-hint {
    display: block;
    font-size: 0.7rem;
    color: var(--text-muted, #9a9590);
    margin-top: 4px;
  }
  .form-hint.error { color: var(--red, #c0392b); }
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3, 12px);
  }

  /* Toggle Group */
  .toggle-group {
    display: flex;
    border: 1px solid var(--border, #E5E0DA);
    border-radius: var(--radius-sm, 6px);
    overflow: hidden;
  }
  .toggle-group.wide { width: 100%; }
  .toggle-btn {
    appearance: none;
    border: none;
    background: var(--surface, #fff);
    padding: 9px 16px;
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--text-secondary, #6b6560);
    cursor: pointer;
    flex: 1;
    text-align: center;
    transition: all 150ms;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-right: 1px solid var(--border, #E5E0DA);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.74rem;
  }
  .toggle-btn:last-child { border-right: none; }
  .toggle-btn.active {
    background: var(--text-primary, #2D2D2D);
    color: #fff;
    font-weight: 600;
  }

  /* Slider */
  .slider-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .range-input {
    flex: 1;
    -webkit-appearance: none;
    height: 4px;
    border-radius: 2px;
    background: var(--border, #E5E0DA);
    outline: none;
    cursor: pointer;
  }
  .range-input::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--text-primary, #2D2D2D);
    cursor: pointer;
    border: 3px solid #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  .range-input::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--text-primary, #2D2D2D);
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }

  /* Info Row */
  .info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: rgba(217, 119, 87, 0.04);
    border-radius: var(--radius-sm, 6px);
    font-size: 0.76rem;
    color: var(--text-secondary, #6b6560);
    line-height: 1.5;
  }
  .info-row strong {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-weight: 700;
    color: var(--text-primary, #2D2D2D);
  }
  .info-row svg { flex-shrink: 0; color: var(--text-muted, #9a9590); }

  /* Data Tabs */
  .data-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    margin-bottom: var(--space-3, 12px);
  }
  .data-tab {
    appearance: none;
    border: 1px solid var(--border, #E5E0DA);
    background: var(--surface, #fff);
    padding: 10px 12px;
    border-radius: var(--radius-sm, 6px);
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--text-secondary, #6b6560);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 150ms;
  }
  .data-tab:hover { border-color: var(--accent, #D97757); }
  .data-tab.active {
    border-color: var(--accent, #D97757);
    color: var(--accent, #D97757);
    background: rgba(217, 119, 87, 0.04);
    font-weight: 600;
  }

  .data-content { margin-top: 4px; }

  /* Upload Zone */
  .upload-zone {
    border: 2px dashed var(--border, #E5E0DA);
    border-radius: var(--radius-md, 10px);
    padding: var(--space-6, 24px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    color: var(--text-muted, #9a9590);
    cursor: pointer;
    transition: border-color 150ms;
  }
  .upload-zone:hover { border-color: var(--accent, #D97757); }
  .upload-text { font-size: 0.82rem; color: var(--text-secondary, #6b6560); }
  .upload-hint { font-size: 0.68rem; color: var(--text-muted, #9a9590); }

  /* Preview Card */
  .preview-col {
    position: sticky;
    top: 68px;
  }
  .preview-card {
    background: var(--surface, #fff);
    border: 1px solid var(--border, #E5E0DA);
    border-radius: var(--radius-md, 10px);
    padding: var(--space-5, 20px);
  }
  .preview-title {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    margin: 0 0 var(--space-4, 16px);
    letter-spacing: 0.04em;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .preview-rows {
    display: flex;
    flex-direction: column;
    margin-bottom: var(--space-3, 12px);
  }
  .preview-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 0;
    border-bottom: 1px solid var(--border-subtle, #EDEAE5);
  }
  .preview-row:last-child { border-bottom: none; }
  .preview-row.highlight {
    background: rgba(217, 119, 87, 0.04);
    margin: 0 calc(-1 * var(--space-5, 20px));
    padding: 7px var(--space-5, 20px);
  }
  .preview-label {
    font-size: 0.7rem;
    color: var(--text-muted, #9a9590);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    letter-spacing: 0.04em;
  }
  .preview-value {
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--text-primary, #2D2D2D);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-variant-numeric: tabular-nums;
    text-align: right;
    max-width: 60%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .preview-value.bold { font-weight: 700; font-size: 0.86rem; font-family: var(--font-body); }
  .preview-value.accent { color: var(--accent, #D97757); font-weight: 700; }

  /* Description in Preview */
  .preview-desc-section {
    border-top: 1px solid var(--border-subtle, #EDEAE5);
    padding-top: var(--space-3, 12px);
    margin-bottom: var(--space-3, 12px);
  }
  .preview-desc-label {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.66rem;
    font-weight: 600;
    color: var(--text-muted, #9a9590);
    display: block;
    margin-bottom: 4px;
  }
  .preview-desc-text {
    font-size: 0.76rem;
    color: var(--text-secondary, #6b6560);
    line-height: 1.5;
    margin: 0;
  }

  /* Validation */
  .validation {
    margin-bottom: var(--space-4, 16px);
    border-top: 1px solid var(--border-subtle, #EDEAE5);
    padding-top: var(--space-3, 12px);
  }
  .validation-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    padding: 4px 0;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }
  .validation-item.success { color: var(--green, #27864a); }
  .validation-item.pending { color: var(--text-muted, #9a9590); }

  /* Launch Button */
  .launch-btn {
    appearance: none;
    border: none;
    width: 100%;
    padding: 14px 24px;
    border-radius: var(--radius-sm, 6px);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 150ms;
    background: var(--text-primary, #2D2D2D);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .launch-btn:hover:not(:disabled) {
    background: var(--accent-hover, #C4644A);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(217, 119, 87, 0.25);
  }
  .launch-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .launch-btn.launching {
    opacity: 1;
    cursor: wait;
    box-shadow: 0 0 24px rgba(217, 119, 87, 0.35);
    background: var(--accent, #D97757);
    animation: launch-pulse 1s ease-in-out infinite;
  }
  .launch-hint {
    font-size: 0.66rem;
    color: var(--text-muted, #9a9590);
    text-align: center;
    margin: 8px 0 0;
    line-height: 1.4;
  }

  @keyframes launch-pulse {
    0%, 100% { box-shadow: 0 0 16px rgba(217, 119, 87, 0.25); }
    50% { box-shadow: 0 0 32px rgba(217, 119, 87, 0.45); }
  }
  .launch-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Responsive */
  @media (max-width: 960px) {
    .two-col { grid-template-columns: 1fr; }
    .preview-col { position: static; }
  }
  @media (max-width: 600px) {
    .ontology { padding: var(--space-3, 12px); overflow-x: hidden; }
    .page-title { font-size: 1.25rem; }
    .page-sub { font-size: 0.78rem; }
    .form-row { grid-template-columns: 1fr; }
    .data-tabs { grid-template-columns: 1fr; }
    .preset-chips {
      flex-wrap: nowrap;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 4px;
      margin: 0 -12px;
      padding-left: 12px;
      padding-right: 12px;
    }
    .preset-chip { flex-shrink: 0; }
    .acc-header { padding: 12px var(--space-3, 12px); }
    .acc-body { padding: 0 var(--space-3, 12px) var(--space-3, 12px); padding-top: var(--space-3, 12px); }
    .preview-card { padding: var(--space-4, 16px); }
    .toggle-btn { padding: 8px 10px; font-size: 0.7rem; }
    .upload-zone { padding: var(--space-4, 16px); }
    .launch-btn { font-size: 0.82rem; padding: 12px 20px; }
  }
  @media (max-width: 400px) {
    .ontology { padding: var(--space-2, 8px); }
    .page-title { font-size: 1.1rem; }
    .page-sub { font-size: 0.72rem; }
    .acc-title { font-size: 0.8rem; }
    .form-label { font-size: 0.7rem; }
    .form-input, .form-textarea { font-size: 0.82rem; padding: 8px 10px; }
    .preview-label { font-size: 0.64rem; }
    .preview-value { font-size: 0.72rem; }
    .info-row { font-size: 0.7rem; padding: 8px 10px; }
    .required-badge, .optional-badge { font-size: 0.48rem; padding: 2px 6px; }
  }
</style>
