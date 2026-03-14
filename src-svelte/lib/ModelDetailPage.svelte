<script lang="ts">
  import { router } from "./router.ts";
  import { onMount } from "svelte";

  let activeTab: 'card' | 'playground' | 'api' | 'experiments' | 'benchmark' = 'card';

  // Demo model data
  const m = {
    id: "model-um69vho1",
    name: "Crypto Market 24h Prediction",
    slug: "hoot/crypto-market-24h",
    type: "Transformer",
    framework: "PyTorch",
    topic: "Ethereum price prediction",
    metric: "val_bpb",
    metricValue: 1.231,
    totalExperiments: 147,
    kept: 48,
    discarded: 96,
    crashed: 3,
    duration: "4h 32m",
    date: "2026-03-12",
    updated: "2 days ago",
    features: 18,
    rows: 479,
    downloads: 1243,
    likes: 38,
    tags: ["crypto", "price-prediction", "transformer", "ethereum", "time-series"],
    license: "Apache 2.0",
    branches: 6,
  };

  // Download sparkline data (last 30 days)
  const sparkData = [12, 18, 15, 22, 28, 31, 25, 34, 42, 38, 45, 52, 48, 55, 61, 58, 65, 72, 68, 78, 82, 75, 88, 95, 91, 98, 105, 112, 108, 120];
  const sparkMax = Math.max(...sparkData);
  const sparkPath = sparkData.map((v, i) => {
    const x = (i / (sparkData.length - 1)) * 120;
    const y = 28 - (v / sparkMax) * 24;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const sparkArea = sparkPath + ` L120,28 L0,28 Z`;

  // Fake experiment log
  const experimentLog = [
    { id: 147, status: 'keep', mod: 'added cosine lr schedule', metric: 1.231, delta: -0.003 },
    { id: 146, status: 'discard', mod: 'sequence length 256 → 512', metric: 1.289, delta: 0.055 },
    { id: 145, status: 'keep', mod: 'embedding dim 128 → 256', metric: 1.234, delta: -0.008 },
    { id: 144, status: 'discard', mod: 'removed dropout, added mixup', metric: 1.267, delta: 0.025 },
    { id: 143, status: 'keep', mod: 'added skip connection', metric: 1.242, delta: -0.004 },
    { id: 142, status: 'crash', mod: 'doubled context window', metric: 0, delta: 0 },
    { id: 141, status: 'discard', mod: 'switched to AdamW', metric: 1.258, delta: 0.012 },
    { id: 140, status: 'keep', mod: 'added gradient clipping 1.0', metric: 1.246, delta: -0.002 },
    { id: 139, status: 'discard', mod: 'lr: 3e-4 → 1e-4', metric: 1.271, delta: 0.023 },
    { id: 138, status: 'keep', mod: 'reduced lr to 3e-5', metric: 1.248, delta: -0.006 },
  ];

  // ── Benchmark Data (Decision Head Research) ──
  const benchmarkData = {
    baseline: { name: 'Pipeline (Rule-based)', balAcc: 0.9499, fp: 17, fn: 11 },
    best: { name: 'ExtraTrees Decision Head', balAcc: 0.9719, fp: 12, fn: 5 },
    safest: { name: 'RF Decision Head (L2)', balAcc: 0.9712, fp: 21, fn: 1 },
    models: [
      { name: 'Pipeline (Baseline)', balAcc: 0.9499, fp: 17, fn: 11, params: '—', time: '—', isBest: false, isBaseline: true },
      { name: 'SML-Former++', balAcc: 0.9287, fp: 38, fn: 9, params: '939K', time: '~55s/fold', isBest: false, isBaseline: false },
      { name: 'MLP Decision Head', balAcc: 0.9196, fp: null, fn: null, params: '~10K', time: '~5s/fold', isBest: false, isBaseline: false },
      { name: 'RF Decision Head', balAcc: 0.9688, fp: 23, fn: 1, params: '~200K', time: '<1s/fold', isBest: false, isBaseline: false },
      { name: 'ExtraTrees (Best)', balAcc: 0.9719, fp: 12, fn: 5, params: '~300K', time: '<1s/fold', isBest: true, isBaseline: false },
      { name: 'RF (Safest, L2)', balAcc: 0.9712, fp: 21, fn: 1, params: '~200K', time: '<1s/fold', isBest: false, isBaseline: false },
    ],
    featureImportance: [
      { name: 'pipe_unsafe_low_clip', value: 0.108 },
      { name: 'pipe_safe_high_violence', value: 0.093 },
      { name: 'pipeline_pred_label', value: 0.082 },
      { name: 'ucf_violence_p99', value: 0.056 },
      { name: 'ucf_violence_p5', value: 0.049 },
      { name: 'safety_head_score', value: 0.044 },
      { name: 'clip_sim_mean', value: 0.038 },
      { name: 'context_clf_prob', value: 0.035 },
      { name: 'ucf_violence_mean', value: 0.031 },
      { name: 'frame_entropy_std', value: 0.027 },
    ],
    contextPerformance: [
      { context: 'adult_content', n: 89, pipeAcc: 0.966, dhAcc: 0.978, pipeFp: 2, pipeFn: 1, dhFp: 1, dhFn: 1 },
      { context: 'violence', n: 134, pipeAcc: 0.940, dhAcc: 0.970, pipeFp: 5, pipeFn: 3, dhFp: 3, dhFn: 1 },
      { context: 'hate_speech', n: 67, pipeAcc: 0.955, dhAcc: 0.970, pipeFp: 2, pipeFn: 1, dhFp: 1, dhFn: 1 },
      { context: 'self_harm', n: 45, pipeAcc: 0.933, dhAcc: 0.956, pipeFp: 1, pipeFn: 2, dhFp: 1, dhFn: 1 },
      { context: 'law_enforcement', n: 86, pipeAcc: 0.814, dhAcc: 0.849, pipeFp: 4, pipeFn: 7, dhFp: 5, dhFn: 0 },
      { context: 'medical_procedure', n: 52, pipeAcc: 0.942, dhAcc: 0.962, pipeFp: 2, pipeFn: 1, dhFp: 1, dhFn: 1 },
      { context: 'news_documentary', n: 78, pipeAcc: 0.962, dhAcc: 0.974, pipeFp: 1, pipeFn: 2, dhFp: 1, dhFn: 1 },
    ],
    timeline: [
      { date: '3/9 AM', label: 'SML-Former++ 학습', detail: 'bal_acc 0.9287', type: 'fail' },
      { date: '3/9 PM', label: '피벗 → Decision Head', detail: 'bal_acc 0.9647', type: 'pivot' },
      { date: '3/9 Night', label: 'Feature Engineering', detail: '130 → 55 features', type: 'progress' },
      { date: '3/10 AM', label: 'ExtraTrees 달성', detail: 'bal_acc 0.9719', type: 'success' },
    ],
  };

  const featureMax = Math.max(...benchmarkData.featureImportance.map(f => f.value));
  const balAccRange = { min: 0.91, max: 0.98 };

  // Pareto toggle
  let selectedModel: 'best' | 'safest' = 'best';
  $: activeModel = selectedModel === 'best' ? benchmarkData.best : benchmarkData.safest;
  $: deltaBalAcc = activeModel.balAcc - benchmarkData.baseline.balAcc;
  $: deltaFpPct = ((activeModel.fp - benchmarkData.baseline.fp) / benchmarkData.baseline.fp * 100);
  $: deltaFnPct = ((activeModel.fn - benchmarkData.baseline.fn) / benchmarkData.baseline.fn * 100);

  // Count-up animation
  let benchmarkVisible = false;
  let animatedBalAcc = 0;
  let animatedFp = 0;
  let animatedFn = 0;

  function animateCounter(from: number, to: number, duration: number, onUpdate: (v: number) => void) {
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      onUpdate(from + (to - from) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function startBenchmarkAnimation() {
    if (benchmarkVisible) return;
    benchmarkVisible = true;
    animateCounter(0, activeModel.balAcc, 1200, v => animatedBalAcc = v);
    animateCounter(0, activeModel.fp, 800, v => animatedFp = Math.round(v));
    animateCounter(0, activeModel.fn, 800, v => animatedFn = Math.round(v));
  }

  $: if (activeTab === 'benchmark') {
    benchmarkVisible = false;
    setTimeout(() => startBenchmarkAnimation(), 100);
  }

  // Playground
  let pgInput = '{\n  "symbol": "ETH",\n  "timeframe": "24h"\n}';
  let pgResult = "";
  let pgLoading = false;

  function runPlayground() {
    pgLoading = true;
    pgResult = "";
    setTimeout(() => {
      pgLoading = false;
      pgResult = JSON.stringify({
        prediction: 0.73,
        confidence: 0.89,
        direction: "up",
        model: m.id,
        latency_ms: 42,
      }, null, 2);
    }, 1200);
  }

  // API snippets
  const curlSnippet = `curl -X POST https://api.hoot.holostudio.io/v1/predict \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model_id": "${m.id}",
    "input": { "symbol": "ETH", "timeframe": "24h" }
  }'`;

  const pySnippet = `import hoot

client = hoot.Client(api_key="YOUR_API_KEY")
result = client.predict(
    model_id="${m.id}",
    input={"symbol": "ETH", "timeframe": "24h"}
)
print(result.prediction)  # 0.73`;
</script>

<div class="detail" data-theme="light">
  <!-- Breadcrumb -->
  <nav class="breadcrumb">
    <button class="bc-link" on:click={() => router.navigate('dashboard')}>Dashboard</button>
    <span class="bc-sep">/</span>
    <button class="bc-link" on:click={() => router.navigate('models')}>Models</button>
    <span class="bc-sep">/</span>
    <span class="bc-current">{m.slug}</span>
  </nav>

  <!-- Main Content: 2-column -->
  <div class="content-layout">
    <!-- Left: Tab Content -->
    <div class="content-main">

      <!-- Model Header -->
      <header class="model-header">
        <div class="header-top">
          <div class="header-identity">
            <div class="header-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 class="model-name">{m.name}</h1>
              <span class="model-slug">{m.slug}</span>
            </div>
          </div>
          <div class="header-actions">
            <button class="like-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              {m.likes}
            </button>
            <button class="action-btn primary">
              Use this model
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Tags -->
        <div class="header-tags">
          <span class="htag task">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M23 6l-9.5 9.5-5-5L1 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Prediction
          </span>
          <span class="htag framework">{m.framework}</span>
          <span class="htag framework">{m.type}</span>
          <span class="htag license">{m.license}</span>
          {#each m.tags as tag}
            <span class="htag">{tag}</span>
          {/each}
        </div>
      </header>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" class:active={activeTab === 'card'} on:click={() => activeTab = 'card'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="1.5"/>
            <polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          Model Card
        </button>
        <button class="tab" class:active={activeTab === 'experiments'} on:click={() => activeTab = 'experiments'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M23 6l-9.5 9.5-5-5L1 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Experiments
          <span class="tab-count">{m.totalExperiments}</span>
        </button>
        <button class="tab" class:active={activeTab === 'benchmark'} on:click={() => activeTab = 'benchmark'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="12" width="4" height="9" rx="1" stroke="currentColor" stroke-width="1.5"/>
            <rect x="10" y="7" width="4" height="14" rx="1" stroke="currentColor" stroke-width="1.5"/>
            <rect x="17" y="3" width="4" height="18" rx="1" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          Benchmark
        </button>
        <button class="tab" class:active={activeTab === 'playground'} on:click={() => activeTab = 'playground'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <polygon points="5 3 19 12 5 21 5 3" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
          Playground
        </button>
        <button class="tab" class:active={activeTab === 'api'} on:click={() => activeTab = 'api'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <polyline points="16 18 22 12 16 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="8 6 2 12 8 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          API
        </button>
      </div>


      {#if activeTab === 'card'}
        <!-- Model Card -->
        <div class="mc-section">
          <h2 class="mc-heading">Overview</h2>
          <p class="mc-text">Autonomous ML research model trained on <strong>{m.topic}</strong>. Generated through {m.totalExperiments} experiments across {m.branches} parallel branches using the HOOT distributed compute mesh.</p>
        </div>

        <div class="mc-section">
          <h2 class="mc-heading">Training Summary</h2>
          <div class="mc-stats-grid">
            <div class="mc-stat">
              <span class="mc-stat-val accent">{m.metricValue.toFixed(3)}</span>
              <span class="mc-stat-key">Best {m.metric}</span>
            </div>
            <div class="mc-stat">
              <span class="mc-stat-val">{m.totalExperiments}</span>
              <span class="mc-stat-key">Experiments</span>
            </div>
            <div class="mc-stat">
              <span class="mc-stat-val">{m.kept}</span>
              <span class="mc-stat-key">Kept</span>
            </div>
            <div class="mc-stat">
              <span class="mc-stat-val">{m.discarded}</span>
              <span class="mc-stat-key">Discarded</span>
            </div>
            <div class="mc-stat">
              <span class="mc-stat-val">{m.crashed}</span>
              <span class="mc-stat-key">Crashed</span>
            </div>
            <div class="mc-stat">
              <span class="mc-stat-val">{m.duration}</span>
              <span class="mc-stat-key">Duration</span>
            </div>
          </div>
        </div>

        <div class="mc-section">
          <h2 class="mc-heading">Model Information</h2>
          <table class="mc-table">
            <tbody>
              <tr><td class="mc-td-label">Topic</td><td>{m.topic}</td></tr>
              <tr><td class="mc-td-label">Architecture</td><td>{m.type}</td></tr>
              <tr><td class="mc-td-label">Framework</td><td>{m.framework}</td></tr>
              <tr><td class="mc-td-label">Dataset Rows</td><td>{m.rows.toLocaleString()}</td></tr>
              <tr><td class="mc-td-label">Features</td><td>{m.features}</td></tr>
              <tr><td class="mc-td-label">Branches</td><td>{m.branches}</td></tr>
              <tr><td class="mc-td-label">Keep Rate</td><td>{((m.kept / m.totalExperiments) * 100).toFixed(1)}%</td></tr>
              <tr><td class="mc-td-label">License</td><td>{m.license}</td></tr>
            </tbody>
          </table>
        </div>

      {:else if activeTab === 'experiments'}
        <!-- Experiment History -->
        <div class="exp-header">
          <h2 class="mc-heading">Experiment History</h2>
          <div class="exp-summary">
            <span class="exp-badge keep">{m.kept} kept</span>
            <span class="exp-badge discard">{m.discarded} discarded</span>
            <span class="exp-badge crash">{m.crashed} crashed</span>
          </div>
        </div>
        <div class="exp-table">
          <div class="exp-table-header">
            <span class="exp-col id">#</span>
            <span class="exp-col status">Status</span>
            <span class="exp-col mod">Modification</span>
            <span class="exp-col metric">Metric</span>
            <span class="exp-col delta">Delta</span>
          </div>
          {#each experimentLog as exp}
            <div class="exp-table-row" class:keep={exp.status === 'keep'} class:discard={exp.status === 'discard'} class:crash={exp.status === 'crash'}>
              <span class="exp-col id">{exp.id}</span>
              <span class="exp-col status">
                <span class="status-badge {exp.status}">{exp.status.toUpperCase()}</span>
              </span>
              <span class="exp-col mod">{exp.mod}</span>
              <span class="exp-col metric">{exp.status === 'crash' ? '—' : exp.metric.toFixed(3)}</span>
              <span class="exp-col delta" class:positive={exp.delta < 0} class:negative={exp.delta > 0}>
                {#if exp.status === 'crash'}—{:else if exp.delta < 0}↓{Math.abs(exp.delta).toFixed(3)}{:else if exp.delta > 0}↑{exp.delta.toFixed(3)}{:else}—{/if}
              </span>
            </div>
          {/each}
        </div>

      {:else if activeTab === 'benchmark'}
        <!-- ═══ BENCHMARK TAB ═══ -->

        <!-- 1. Hero Section: Best vs Baseline -->
        <div class="bm-section">
          <div class="bm-toggle">
            <button class="bm-toggle-btn" class:active={selectedModel === 'best'} on:click={() => selectedModel = 'best'}>
              Option A — Best Accuracy
            </button>
            <button class="bm-toggle-btn" class:active={selectedModel === 'safest'} on:click={() => selectedModel = 'safest'}>
              Option B — Safest (FN=1)
            </button>
          </div>

          <div class="bm-hero-grid">
            <div class="bm-hero-card">
              <span class="bm-hero-label">Balanced Accuracy</span>
              <div class="bm-hero-values">
                <span class="bm-hero-before">{benchmarkData.baseline.balAcc.toFixed(4)}</span>
                <span class="bm-hero-arrow">→</span>
                <span class="bm-hero-after">{animatedBalAcc.toFixed(4)}</span>
              </div>
              <div class="bm-hero-bar-track">
                <div class="bm-hero-bar baseline" style="width: {((benchmarkData.baseline.balAcc - balAccRange.min) / (balAccRange.max - balAccRange.min)) * 100}%"></div>
                <div class="bm-hero-bar best" style="width: {((activeModel.balAcc - balAccRange.min) / (balAccRange.max - balAccRange.min)) * 100}%"></div>
              </div>
              <span class="bm-hero-delta positive">+{deltaBalAcc.toFixed(4)} vs baseline</span>
            </div>

            <div class="bm-hero-card">
              <span class="bm-hero-label">False Positives</span>
              <div class="bm-hero-values">
                <span class="bm-hero-before">{benchmarkData.baseline.fp}</span>
                <span class="bm-hero-arrow">→</span>
                <span class="bm-hero-after">{animatedFp}</span>
              </div>
              <div class="bm-hero-bar-track">
                <div class="bm-hero-bar fp-base" style="width: {(benchmarkData.baseline.fp / 40) * 100}%"></div>
                <div class="bm-hero-bar fp-best" style="width: {(activeModel.fp / 40) * 100}%"></div>
              </div>
              <span class="bm-hero-delta" class:positive={deltaFpPct <= 0} class:negative={deltaFpPct > 0}>
                {deltaFpPct > 0 ? '+' : ''}{deltaFpPct.toFixed(0)}% vs baseline
              </span>
            </div>

            <div class="bm-hero-card">
              <span class="bm-hero-label">False Negatives</span>
              <div class="bm-hero-values">
                <span class="bm-hero-before">{benchmarkData.baseline.fn}</span>
                <span class="bm-hero-arrow">→</span>
                <span class="bm-hero-after">{animatedFn}</span>
              </div>
              <div class="bm-hero-bar-track">
                <div class="bm-hero-bar fn-base" style="width: {(benchmarkData.baseline.fn / 12) * 100}%"></div>
                <div class="bm-hero-bar fn-best" style="width: {(activeModel.fn / 12) * 100}%"></div>
              </div>
              <span class="bm-hero-delta" class:positive={deltaFnPct <= 0} class:negative={deltaFnPct > 0}>
                {deltaFnPct > 0 ? '+' : ''}{deltaFnPct.toFixed(0)}% vs baseline
              </span>
            </div>
          </div>
        </div>

        <!-- 2. Architecture Diagram -->
        <div class="bm-section">
          <h2 class="mc-heading">Architecture</h2>
          <div class="bm-arch">
            <div class="bm-arch-row">
              <div class="bm-arch-node input">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="1.5"/></svg>
                Video Input
              </div>
              <div class="bm-arch-connector">→</div>
              <div class="bm-arch-node model">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="1.5"/></svg>
                CLIP ViT-L/14
              </div>
              <div class="bm-arch-connector">→</div>
              <div class="bm-arch-branch">
                <div class="bm-arch-node sub">Safety Head</div>
                <div class="bm-arch-node sub">UCF Violence</div>
                <div class="bm-arch-node sub">Context CLF</div>
              </div>
            </div>
            <div class="bm-arch-row bm-arch-row-bottom">
              <div class="bm-arch-connector-vert">↓ 55 Features</div>
              <div class="bm-arch-node decision">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="1.5"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5"/></svg>
                Decision Head
              </div>
              <div class="bm-arch-connector">→</div>
              <div class="bm-arch-node output safe">SAFE</div>
              <span class="bm-arch-slash">/</span>
              <div class="bm-arch-node output unsafe">UNSAFE</div>
            </div>
            <div class="bm-arch-insight">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" stroke="currentColor" stroke-width="1.5"/><path d="M9 21h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              Key insight: <code>pipeline_pred_label</code> as meta-feature — the pipeline's own prediction becomes an input to the decision head
            </div>
          </div>
        </div>

        <!-- 3. Model Comparison Table -->
        <div class="bm-section">
          <h2 class="mc-heading">Model Comparison</h2>
          <div class="bm-table-wrap">
            <table class="bm-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>bal_acc</th>
                  <th class="bm-bar-col"></th>
                  <th>FP</th>
                  <th>FN</th>
                  <th>Params</th>
                  <th>Train Time</th>
                </tr>
              </thead>
              <tbody>
                {#each benchmarkData.models as row}
                  <tr class:bm-best-row={row.isBest} class:bm-baseline-row={row.isBaseline}>
                    <td class="bm-model-name">
                      {row.name}
                      {#if row.isBest}<span class="bm-best-badge">BEST</span>{/if}
                      {#if row.isBaseline}<span class="bm-baseline-badge">BASE</span>{/if}
                    </td>
                    <td class="bm-mono">{row.balAcc.toFixed(4)}</td>
                    <td class="bm-bar-col">
                      <div class="bm-inline-bar-track">
                        <div class="bm-inline-bar" class:best={row.isBest} style="width: {((row.balAcc - balAccRange.min) / (balAccRange.max - balAccRange.min)) * 100}%"></div>
                      </div>
                    </td>
                    <td class="bm-mono">{row.fp !== null ? row.fp : '—'}</td>
                    <td class="bm-mono">{row.fn !== null ? row.fn : '—'}</td>
                    <td class="bm-mono bm-dim">{row.params}</td>
                    <td class="bm-mono bm-dim">{row.time}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 4. Feature Importance -->
        <div class="bm-section">
          <h2 class="mc-heading">Feature Importance (Top 10)</h2>
          <div class="bm-features">
            {#each benchmarkData.featureImportance as feat, i}
              <div class="bm-feat-row" style="animation-delay: {i * 60}ms">
                <span class="bm-feat-name">{feat.name}</span>
                <div class="bm-feat-bar-track">
                  <div class="bm-feat-bar" style="width: {(feat.value / featureMax) * 100}%"></div>
                </div>
                <span class="bm-feat-val">{feat.value.toFixed(3)}</span>
              </div>
            {/each}
          </div>
        </div>

        <!-- 5. Context Performance -->
        <div class="bm-section">
          <h2 class="mc-heading">Context Performance</h2>
          <div class="bm-table-wrap">
            <table class="bm-table bm-context-table">
              <thead>
                <tr>
                  <th>Context</th>
                  <th>N</th>
                  <th>Pipeline Acc</th>
                  <th>DH Acc</th>
                  <th>Diff</th>
                  <th>Pipeline FP/FN</th>
                  <th>DH FP/FN</th>
                </tr>
              </thead>
              <tbody>
                {#each benchmarkData.contextPerformance as ctx}
                  {@const diff = ctx.dhAcc - ctx.pipeAcc}
                  {@const fnImprovement = ctx.pipeFn - ctx.dhFn}
                  <tr class:bm-highlight-row={fnImprovement >= 5}>
                    <td class="bm-context-name">{ctx.context.replace(/_/g, ' ')}</td>
                    <td class="bm-mono">{ctx.n}</td>
                    <td class="bm-mono">{ctx.pipeAcc.toFixed(3)}</td>
                    <td class="bm-mono">{ctx.dhAcc.toFixed(3)}</td>
                    <td class="bm-mono" class:positive={diff > 0} class:negative={diff < 0}>
                      {diff > 0 ? '+' : ''}{(diff * 100).toFixed(1)}%
                    </td>
                    <td class="bm-mono">{ctx.pipeFp}/{ctx.pipeFn}</td>
                    <td class="bm-mono">
                      {ctx.dhFp}/{ctx.dhFn}
                      {#if fnImprovement >= 5}
                        <span class="bm-fn-badge">FN {ctx.pipeFn}→{ctx.dhFn}</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 6. Experiment Timeline -->
        <div class="bm-section">
          <h2 class="mc-heading">Research Timeline</h2>
          <div class="bm-timeline">
            {#each benchmarkData.timeline as evt, i}
              <div class="bm-tl-item {evt.type}" style="animation-delay: {i * 150}ms">
                <div class="bm-tl-dot"></div>
                <div class="bm-tl-card">
                  <span class="bm-tl-date">{evt.date}</span>
                  <span class="bm-tl-label">{evt.label}</span>
                  <span class="bm-tl-detail">{evt.detail}</span>
                </div>
              </div>
            {/each}
            <div class="bm-tl-line"></div>
          </div>
        </div>

      {:else if activeTab === 'playground'}
        <!-- Playground -->
        <div class="pg-layout">
          <div class="pg-col">
            <h3 class="pg-label">Input</h3>
            <textarea class="pg-editor" bind:value={pgInput} rows="8"></textarea>
            <button class="pg-run" on:click={runPlayground} disabled={pgLoading}>
              {#if pgLoading}
                <span class="spin-sm"></span> Running...
              {:else}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>
                </svg>
                Run Inference
              {/if}
            </button>
          </div>
          <div class="pg-col">
            <h3 class="pg-label">Output</h3>
            <pre class="pg-result" class:empty={!pgResult}>{pgResult || 'Results will appear here...'}</pre>
          </div>
        </div>

      {:else if activeTab === 'api'}
        <!-- API -->
        <div class="api-block">
          <div class="api-header">
            <h3 class="api-lang">cURL</h3>
            <button class="copy-btn">Copy</button>
          </div>
          <pre class="api-code">{curlSnippet}</pre>
        </div>
        <div class="api-block">
          <div class="api-header">
            <h3 class="api-lang">Python</h3>
            <button class="copy-btn">Copy</button>
          </div>
          <pre class="api-code">{pySnippet}</pre>
        </div>
      {/if}
    </div>

    <!-- Right: Sidebar -->
    <aside class="content-sidebar">
      <!-- Downloads -->
      <div class="sb-card">
        <span class="sb-label">Downloads last month</span>
        <div class="sb-downloads">
          <span class="sb-big-number">{m.downloads.toLocaleString()}</span>
          <svg width="120" height="28" viewBox="0 0 120 28" class="sb-sparkline">
            <path d={sparkArea} fill="rgba(217, 119, 87, 0.12)"/>
            <path d={sparkPath} fill="none" stroke="var(--accent, #D97757)" stroke-width="1.5"/>
          </svg>
        </div>
      </div>

      <!-- Quick Inference -->
      <div class="sb-card">
        <span class="sb-label">Quick Inference</span>
        <p class="sb-hint">Test this model with a sample input</p>
        <button class="sb-infer-btn" on:click={() => activeTab = 'playground'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <polygon points="5 3 19 12 5 21 5 3" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
          Open Playground
        </button>
      </div>

      <!-- Tags -->
      <div class="sb-card">
        <span class="sb-label">Tags</span>
        <div class="sb-tag-group">
          <span class="sb-group-label">Task</span>
          <div class="sb-tags">
            <span class="sb-tag">Prediction</span>
            <span class="sb-tag">Time Series</span>
          </div>
        </div>
        <div class="sb-tag-group">
          <span class="sb-group-label">Framework</span>
          <div class="sb-tags">
            <span class="sb-tag">{m.framework}</span>
          </div>
        </div>
        <div class="sb-tag-group">
          <span class="sb-group-label">Keywords</span>
          <div class="sb-tags">
            {#each m.tags as tag}
              <span class="sb-tag">{tag}</span>
            {/each}
          </div>
        </div>
      </div>

      <!-- Model Details -->
      <div class="sb-card">
        <span class="sb-label">Details</span>
        <div class="sb-detail-rows">
          <div class="sb-detail-row">
            <span class="sb-detail-key">Created</span>
            <span class="sb-detail-val">{m.date}</span>
          </div>
          <div class="sb-detail-row">
            <span class="sb-detail-key">Updated</span>
            <span class="sb-detail-val">{m.updated}</span>
          </div>
          <div class="sb-detail-row">
            <span class="sb-detail-key">License</span>
            <span class="sb-detail-val">{m.license}</span>
          </div>
          <div class="sb-detail-row">
            <span class="sb-detail-key">Dataset</span>
            <span class="sb-detail-val">{m.rows.toLocaleString()} rows</span>
          </div>
        </div>
      </div>
    </aside>
  </div>
</div>

<style>
  .detail {
    max-width: 1280px;
    margin: 0 auto;
    padding: var(--space-6, 24px);
  }

  /* ── Breadcrumb ── */
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: var(--space-4, 16px);
    font-size: 0.76rem;
    animation: fade-up 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .bc-link {
    appearance: none; border: none; background: none; padding: 0;
    font-size: inherit; color: var(--text-secondary, #6b6560); cursor: pointer;
  }
  .bc-link:hover { color: var(--accent, #D97757); }
  .bc-sep { color: var(--border, #E5E0DA); }
  .bc-current { color: var(--text-primary, #2D2D2D); font-weight: 500; }

  /* ── Header ── */
  .model-header {
    margin-bottom: var(--space-5, 20px);
  }
  .header-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4, 16px);
    margin-bottom: var(--space-3, 12px);
  }
  .header-identity {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3, 12px);
  }
  .header-icon {
    width: 44px; height: 44px;
    border-radius: var(--radius-md, 10px);
    background: rgba(217, 119, 87, 0.08);
    color: var(--accent, #D97757);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: box-shadow 300ms ease;
  }
  .header-icon:hover {
    box-shadow: 0 0 20px rgba(217, 119, 87, 0.15);
  }
  .model-name {
    font-family: var(--font-display, 'Playfair Display', serif);
    font-size: 1.5rem; font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    margin: 0 0 2px; line-height: 1.2;
  }
  .model-slug {
    font-size: 0.76rem;
    color: var(--text-muted, #9a9590);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }

  .header-actions {
    display: flex; gap: 8px; flex-shrink: 0;
  }
  .like-btn {
    appearance: none;
    border: 1px solid var(--border, #E5E0DA);
    background: var(--surface, #fff);
    padding: 7px 14px;
    border-radius: var(--radius-sm, 6px);
    font-size: 0.78rem; font-weight: 600;
    color: var(--text-secondary, #6b6560);
    cursor: pointer;
    display: flex; align-items: center; gap: 6px;
    transition: all 200ms ease;
  }
  .like-btn:hover { border-color: var(--red, #c0392b); color: var(--red, #c0392b); box-shadow: 0 0 8px rgba(192, 57, 43, 0.15); transform: translateY(-1px); }

  .action-btn.primary {
    appearance: none; border: none;
    background: var(--accent, #D97757);
    color: #fff;
    padding: 8px 16px;
    border-radius: var(--radius-sm, 6px);
    font-size: 0.8rem; font-weight: 600;
    cursor: pointer;
    display: flex; align-items: center; gap: 6px;
    transition: all 200ms ease;
  }
  .action-btn.primary:hover { background: var(--accent-hover, #C4644A); box-shadow: 0 4px 12px rgba(217, 119, 87, 0.25); transform: translateY(-1px); }

  /* Tags */
  .header-tags {
    display: flex; flex-wrap: wrap; gap: 5px;
  }
  .htag {
    font-size: 0.66rem; font-weight: 500;
    padding: 3px 10px;
    border-radius: var(--radius-pill, 100px);
    background: var(--border-subtle, #EDEAE5);
    color: var(--text-secondary, #6b6560);
    display: inline-flex; align-items: center; gap: 4px;
  }
  .htag.task {
    background: rgba(217, 119, 87, 0.1);
    color: var(--accent, #D97757);
  }
  .htag.framework {
    background: rgba(45, 108, 162, 0.08);
    color: var(--blue, #2d6ca2);
  }
  .htag.license {
    background: rgba(39, 134, 74, 0.08);
    color: var(--green, #27864a);
  }

  /* ── Tabs ── */
  .tabs {
    display: flex; gap: 2px;
    border-bottom: 1px solid var(--border, #E5E0DA);
    margin-bottom: var(--space-5, 20px);
    overflow-x: auto;
  }
  .tab {
    appearance: none; border: none; background: none;
    padding: 10px 16px;
    font-size: 0.8rem; font-weight: 500;
    color: var(--text-secondary, #6b6560);
    cursor: pointer;
    display: flex; align-items: center; gap: 6px;
    position: relative;
    transition: color 150ms;
    white-space: nowrap;
  }
  .tab:hover { color: var(--text-primary, #2D2D2D); }
  .tab.active { color: var(--text-primary, #2D2D2D); font-weight: 600; }
  .tab.active::after {
    content: ''; position: absolute;
    bottom: -1px; left: 16px; right: 16px;
    height: 2px;
    background: var(--accent, #D97757);
    border-radius: 2px 2px 0 0;
    box-shadow: var(--glow-accent-sm, 0 0 6px rgba(217, 119, 87, 0.25));
  }
  .tab-count {
    font-size: 0.62rem; font-weight: 600;
    background: var(--border-subtle, #EDEAE5);
    color: var(--text-muted, #9a9590);
    padding: 1px 6px; border-radius: 8px;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }

  /* ── Content Layout ── */
  .content-layout {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: var(--space-6, 24px);
    align-items: start;
    animation: fade-up 500ms cubic-bezier(0.16, 1, 0.3, 1) 150ms both;
  }

  /* ── Model Card Tab ── */
  .mc-section { margin-bottom: var(--space-6, 24px); }
  .mc-heading {
    font-size: 0.78rem; font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    margin: 0 0 var(--space-3, 12px);
    padding-bottom: var(--space-2, 8px);
    border-bottom: 1px solid var(--border-subtle, #EDEAE5);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .mc-text {
    font-size: 0.88rem; color: var(--text-secondary, #6b6560);
    line-height: 1.6; margin: 0;
  }
  .mc-text strong { color: var(--text-primary, #2D2D2D); }

  .mc-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-3, 12px);
  }
  .mc-stat {
    background: var(--surface, #fff);
    border: 1px solid var(--border, #E5E0DA);
    border-radius: var(--radius-sm, 6px);
    padding: var(--space-3, 12px) var(--space-4, 16px);
    display: flex; flex-direction: column; gap: 2px;
    transition: border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease;
  }
  .mc-stat:hover {
    border-color: rgba(217, 119, 87, 0.3);
    box-shadow: 0 0 12px rgba(217, 119, 87, 0.06);
    transform: translateY(-1px);
  }
  .mc-stat-val {
    font-size: 1.2rem; font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }
  .mc-stat-val.accent { color: var(--accent, #D97757); text-shadow: 0 0 6px rgba(217, 119, 87, 0.3); }
  .mc-stat-key {
    font-size: 0.62rem; font-weight: 500;
    color: var(--text-muted, #9a9590);
    text-transform: uppercase; letter-spacing: 0.06em;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }

  .mc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }
  .mc-table td {
    padding: 10px 0;
    border-bottom: 1px solid var(--border-subtle, #EDEAE5);
    color: var(--text-primary, #2D2D2D);
  }
  .mc-td-label {
    color: var(--text-muted, #9a9590);
    font-weight: 500;
    width: 140px;
  }

  /* ── Experiments Tab ── */
  .exp-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: var(--space-4, 16px);
  }
  .exp-summary { display: flex; gap: 6px; }
  .exp-badge {
    font-size: 0.62rem; font-weight: 600;
    padding: 2px 8px; border-radius: 4px;
  }
  .exp-badge.keep { background: rgba(39, 134, 74, 0.08); color: var(--green, #27864a); }
  .exp-badge.discard { background: rgba(192, 57, 43, 0.08); color: var(--red, #c0392b); }
  .exp-badge.crash { background: rgba(142, 68, 173, 0.08); color: #8e44ad; }

  .exp-table {
    border: 1px solid var(--border, #E5E0DA);
    border-radius: var(--radius-sm, 6px);
    overflow: hidden;
  }
  .exp-table-header {
    display: flex; gap: 0;
    padding: 8px 14px;
    background: var(--border-subtle, #EDEAE5);
    font-size: 0.66rem; font-weight: 600;
    color: var(--text-muted, #9a9590);
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .exp-table-row {
    display: flex; gap: 0;
    padding: 8px 14px;
    font-size: 0.8rem;
    border-top: 1px solid var(--border-subtle, #EDEAE5);
    background: var(--surface, #fff);
    transition: background 100ms;
  }
  .exp-table-row:hover { background: rgba(217, 119, 87, 0.02); }
  .exp-table-row.keep:hover { background: rgba(39, 134, 74, 0.03); }
  .exp-col { font-family: var(--font-mono, 'JetBrains Mono', monospace); }
  .exp-col.id { width: 50px; color: var(--text-muted, #9a9590); font-size: 0.72rem; }
  .exp-col.status { width: 90px; }
  .exp-col.mod { flex: 1; font-family: var(--font-body); color: var(--text-secondary, #6b6560); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .exp-col.metric { width: 70px; text-align: right; font-weight: 600; color: var(--text-primary, #2D2D2D); }
  .exp-col.delta { width: 80px; text-align: right; font-size: 0.72rem; }
  .exp-col.delta.positive { color: var(--green, #27864a); }
  .exp-col.delta.negative { color: var(--red, #c0392b); }

  .status-badge {
    font-size: 0.58rem; font-weight: 700;
    padding: 2px 6px; border-radius: 3px;
    letter-spacing: 0.04em;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }
  .status-badge.keep { background: rgba(39, 134, 74, 0.08); color: var(--green, #27864a); }
  .status-badge.discard { background: rgba(192, 57, 43, 0.08); color: var(--red, #c0392b); }
  .status-badge.crash { background: rgba(142, 68, 173, 0.08); color: #8e44ad; }

  /* ── Playground ── */
  .pg-layout {
    display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4, 16px);
  }
  .pg-label {
    font-size: 0.78rem; font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    margin: 0 0 var(--space-2, 8px);
  }
  .pg-editor {
    width: 100%; padding: 12px;
    border: 1px solid var(--border, #E5E0DA);
    border-radius: var(--radius-sm, 6px);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.82rem;
    color: var(--text-primary, #2D2D2D);
    background: var(--surface, #fff);
    resize: vertical; outline: none;
  }
  .pg-editor:focus { border-color: var(--accent, #D97757); }
  .pg-run {
    appearance: none; border: none;
    background: var(--accent, #D97757); color: #fff;
    font-weight: 600; font-size: 0.82rem;
    padding: 10px 20px;
    border-radius: var(--radius-sm, 6px);
    cursor: pointer; margin-top: var(--space-3, 12px);
    display: flex; align-items: center; gap: 6px;
    transition: background 150ms;
    position: relative; overflow: hidden;
  }
  .pg-run::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 48%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.25) 52%, transparent 60%);
    transform: translateX(-200%);
  }
  .pg-run:hover:not(:disabled)::after {
    animation: btn-shimmer 700ms ease-out;
  }
  @keyframes btn-shimmer {
    from { transform: translateX(-200%); }
    to { transform: translateX(200%); }
  }
  .pg-run:hover:not(:disabled) { background: var(--accent-hover, #C4644A); box-shadow: 0 0 16px rgba(217, 119, 87, 0.25); }
  .pg-run:disabled { opacity: 0.5; cursor: not-allowed; }
  .spin-sm {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .pg-result {
    padding: 12px;
    border: 1px solid var(--border, #E5E0DA);
    border-radius: var(--radius-sm, 6px);
    background: #fafaf9;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.78rem;
    color: var(--text-primary, #2D2D2D);
    min-height: 180px;
    margin: 0; white-space: pre-wrap; overflow: auto;
  }
  .pg-result.empty { color: var(--text-muted, #9a9590); }

  /* ── API ── */
  .api-block { margin-bottom: var(--space-5, 20px); }
  .api-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: var(--space-2, 8px);
  }
  .api-lang {
    font-size: 0.78rem; font-weight: 700;
    color: var(--text-primary, #2D2D2D); margin: 0;
  }
  .copy-btn {
    appearance: none;
    border: 1px solid var(--border, #E5E0DA);
    background: var(--surface, #fff);
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 0.66rem; font-weight: 600;
    color: var(--text-secondary, #6b6560);
    cursor: pointer; transition: all 150ms;
  }
  .copy-btn:hover { border-color: var(--accent, #D97757); color: var(--accent, #D97757); box-shadow: var(--glow-accent-sm, 0 0 6px rgba(217, 119, 87, 0.25)); }
  .api-code {
    padding: 16px;
    border-radius: var(--radius-sm, 6px);
    background: #2A1E18; color: #E8D5C4;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.78rem;
    margin: 0; overflow-x: auto;
    white-space: pre-wrap; line-height: 1.6;
  }

  /* ── Sidebar ── */
  .content-sidebar {
    display: flex; flex-direction: column; gap: var(--space-3, 12px);
    position: sticky; top: 68px;
  }
  .sb-card {
    background: var(--surface, #fff);
    border: 1px solid var(--border, #E5E0DA);
    border-radius: var(--radius-md, 10px);
    padding: var(--space-4, 16px);
    transition: border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease;
    animation: sidebar-enter 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .sb-card:hover {
    border-color: rgba(217, 119, 87, 0.2);
    box-shadow: 0 0 12px rgba(217, 119, 87, 0.04);
    transform: translateY(-1px);
  }
  .content-sidebar .sb-card:nth-child(1) { animation-delay: 400ms; }
  .content-sidebar .sb-card:nth-child(2) { animation-delay: 500ms; }
  .content-sidebar .sb-card:nth-child(3) { animation-delay: 600ms; }
  .content-sidebar .sb-card:nth-child(4) { animation-delay: 700ms; }
  @keyframes sidebar-enter {
    from { opacity: 0; transform: translateX(16px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .sb-label {
    font-size: 0.72rem; font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    text-transform: uppercase; letter-spacing: 0.06em;
    display: block; margin-bottom: var(--space-2, 8px);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }
  .sb-hint {
    font-size: 0.76rem; color: var(--text-muted, #9a9590);
    margin: 0 0 var(--space-3, 12px);
  }

  /* Downloads */
  .sb-downloads {
    display: flex; align-items: flex-end; justify-content: space-between; gap: 12px;
  }
  .sb-big-number {
    font-size: 1.6rem; font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    line-height: 1;
    text-shadow: 0 0 4px rgba(217, 119, 87, 0.15);
  }
  .sb-sparkline { flex-shrink: 0; filter: drop-shadow(0 0 3px rgba(217, 119, 87, 0.2)); }
  .sb-sparkline path {
    animation: sparkline-draw 1.2s ease-out both;
    animation-delay: 600ms;
  }
  @keyframes sparkline-draw {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Inference */
  .sb-infer-btn {
    appearance: none; border: none; width: 100%;
    background: var(--accent, #D97757); color: #fff;
    font-weight: 600; font-size: 0.82rem;
    padding: 10px 0;
    border-radius: var(--radius-sm, 6px);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    transition: background 150ms;
  }
  .sb-infer-btn:hover { background: var(--accent-hover, #C4644A); box-shadow: 0 0 16px rgba(217, 119, 87, 0.25); }

  /* Tags */
  .sb-tag-group { margin-bottom: var(--space-3, 12px); }
  .sb-tag-group:last-child { margin-bottom: 0; }
  .sb-group-label {
    font-size: 0.62rem; font-weight: 600;
    color: var(--text-muted, #9a9590);
    text-transform: uppercase; letter-spacing: 0.06em;
    display: block; margin-bottom: 4px;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }
  .sb-tags { display: flex; flex-wrap: wrap; gap: 4px; }
  .sb-tag {
    font-size: 0.66rem; font-weight: 500;
    padding: 3px 10px;
    border-radius: var(--radius-pill, 100px);
    background: var(--border-subtle, #EDEAE5);
    color: var(--text-secondary, #6b6560);
  }

  /* Details */
  .sb-detail-rows { display: flex; flex-direction: column; }
  .sb-detail-row {
    display: flex; justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px solid var(--border-subtle, #EDEAE5);
    font-size: 0.78rem;
  }
  .sb-detail-row:last-child { border-bottom: none; }
  .sb-detail-key { color: var(--text-muted, #9a9590); font-family: var(--font-mono, 'JetBrains Mono', monospace); }
  .sb-detail-val { color: var(--text-primary, #2D2D2D); font-weight: 500; }

  /* ── Benchmark Tab ── */
  .bm-section {
    margin-bottom: var(--space-8, 32px);
    animation: fade-up 500ms var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1)) both;
  }

  /* Toggle */
  .bm-toggle {
    display: flex;
    gap: 4px;
    margin-bottom: var(--space-5, 20px);
    background: var(--border-subtle, #EDEAE5);
    border-radius: var(--radius-sm, 6px);
    padding: 3px;
    width: fit-content;
  }
  .bm-toggle-btn {
    appearance: none;
    border: none;
    background: transparent;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 0.76rem;
    font-weight: 600;
    color: var(--text-muted, #9a9590);
    cursor: pointer;
    transition: all 200ms ease;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }
  .bm-toggle-btn.active {
    background: var(--surface, #fff);
    color: var(--text-primary, #2D2D2D);
    box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.06));
  }

  /* Hero Grid */
  .bm-hero-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-4, 16px);
  }
  .bm-hero-card {
    background: var(--surface, #fff);
    border: 1px solid var(--border, #E5E0DA);
    border-radius: var(--radius-md, 10px);
    padding: var(--space-5, 20px);
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: border-color 200ms, box-shadow 200ms, transform 200ms;
  }
  .bm-hero-card:hover {
    border-color: rgba(217, 119, 87, 0.3);
    box-shadow: 0 0 16px rgba(217, 119, 87, 0.06);
    transform: translateY(-2px);
  }
  .bm-hero-label {
    font-size: 0.66rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted, #9a9590);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }
  .bm-hero-values {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .bm-hero-before {
    font-size: 1rem;
    font-weight: 500;
    color: var(--text-muted, #9a9590);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    text-decoration: line-through;
    text-decoration-color: rgba(192, 57, 43, 0.4);
  }
  .bm-hero-arrow {
    font-size: 0.88rem;
    color: var(--text-muted, #9a9590);
  }
  .bm-hero-after {
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--accent, #D97757);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    text-shadow: 0 0 8px rgba(217, 119, 87, 0.2);
  }
  .bm-hero-bar-track {
    height: 6px;
    background: var(--border-subtle, #EDEAE5);
    border-radius: 3px;
    position: relative;
    overflow: hidden;
  }
  .bm-hero-bar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    border-radius: 3px;
    transition: width 800ms var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1));
  }
  .bm-hero-bar.baseline {
    background: var(--border, #E5E0DA);
    z-index: 1;
  }
  .bm-hero-bar.best {
    background: linear-gradient(90deg, var(--accent, #D97757), #e8a87c);
    z-index: 2;
    box-shadow: 0 0 8px rgba(217, 119, 87, 0.3);
  }
  .bm-hero-bar.fp-base, .bm-hero-bar.fn-base {
    background: var(--border, #E5E0DA);
    z-index: 1;
  }
  .bm-hero-bar.fp-best, .bm-hero-bar.fn-best {
    background: linear-gradient(90deg, var(--green, #27864a), #4caf6e);
    z-index: 2;
  }
  .bm-hero-delta {
    font-size: 0.72rem;
    font-weight: 600;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }
  .bm-hero-delta.positive { color: var(--green, #27864a); }
  .bm-hero-delta.negative { color: var(--red, #c0392b); }

  /* Architecture Diagram */
  .bm-arch {
    background: var(--surface, #fff);
    border: 1px solid var(--border, #E5E0DA);
    border-radius: var(--radius-md, 10px);
    padding: var(--space-6, 24px);
  }
  .bm-arch-row {
    display: flex;
    align-items: center;
    gap: var(--space-3, 12px);
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: var(--space-4, 16px);
  }
  .bm-arch-row-bottom {
    margin-bottom: var(--space-4, 16px);
  }
  .bm-arch-node {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: 1px solid var(--border, #E5E0DA);
    border-radius: var(--radius-sm, 6px);
    font-size: 0.76rem;
    font-weight: 600;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    color: var(--text-primary, #2D2D2D);
    background: var(--surface, #fff);
    white-space: nowrap;
  }
  .bm-arch-node.input {
    background: rgba(45, 108, 162, 0.06);
    border-color: rgba(45, 108, 162, 0.2);
    color: var(--blue, #2d6ca2);
  }
  .bm-arch-node.model {
    background: rgba(142, 68, 173, 0.06);
    border-color: rgba(142, 68, 173, 0.2);
    color: #8e44ad;
  }
  .bm-arch-node.sub {
    font-size: 0.7rem;
    padding: 6px 10px;
    background: rgba(217, 119, 87, 0.04);
    border-color: rgba(217, 119, 87, 0.15);
  }
  .bm-arch-node.decision {
    background: rgba(217, 119, 87, 0.08);
    border-color: rgba(217, 119, 87, 0.3);
    color: var(--accent, #D97757);
    font-weight: 700;
    box-shadow: var(--glow-accent-sm, 0 0 6px rgba(217, 119, 87, 0.25));
  }
  .bm-arch-node.output {
    font-weight: 700;
    font-size: 0.72rem;
  }
  .bm-arch-node.output.safe {
    background: rgba(39, 134, 74, 0.08);
    border-color: rgba(39, 134, 74, 0.3);
    color: var(--green, #27864a);
  }
  .bm-arch-node.output.unsafe {
    background: rgba(192, 57, 43, 0.08);
    border-color: rgba(192, 57, 43, 0.3);
    color: var(--red, #c0392b);
  }
  .bm-arch-connector {
    font-size: 1.1rem;
    color: var(--text-muted, #9a9590);
    font-weight: 300;
  }
  .bm-arch-connector-vert {
    font-size: 0.72rem;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    color: var(--text-muted, #9a9590);
    text-align: center;
    padding: 4px 12px;
  }
  .bm-arch-slash {
    font-size: 1.1rem;
    color: var(--text-muted, #9a9590);
    font-weight: 300;
  }
  .bm-arch-branch {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .bm-arch-insight {
    margin-top: var(--space-3, 12px);
    padding: var(--space-3, 12px) var(--space-4, 16px);
    background: rgba(217, 119, 87, 0.04);
    border: 1px solid rgba(217, 119, 87, 0.12);
    border-radius: var(--radius-sm, 6px);
    font-size: 0.78rem;
    color: var(--text-secondary, #6b6560);
    display: flex;
    align-items: flex-start;
    gap: 8px;
    line-height: 1.5;
  }
  .bm-arch-insight svg {
    flex-shrink: 0;
    margin-top: 2px;
    color: var(--accent, #D97757);
  }
  .bm-arch-insight code {
    background: rgba(217, 119, 87, 0.1);
    padding: 1px 6px;
    border-radius: 3px;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.74rem;
    color: var(--accent, #D97757);
  }

  /* Model Comparison Table */
  .bm-table-wrap {
    overflow-x: auto;
    border: 1px solid var(--border, #E5E0DA);
    border-radius: var(--radius-sm, 6px);
  }
  .bm-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
  }
  .bm-table th {
    padding: 10px 14px;
    background: var(--border-subtle, #EDEAE5);
    font-size: 0.66rem;
    font-weight: 700;
    color: var(--text-muted, #9a9590);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    text-align: left;
    white-space: nowrap;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }
  .bm-table td {
    padding: 10px 14px;
    border-top: 1px solid var(--border-subtle, #EDEAE5);
    color: var(--text-primary, #2D2D2D);
  }
  .bm-table tbody tr {
    transition: background 100ms;
  }
  .bm-table tbody tr:hover {
    background: rgba(217, 119, 87, 0.02);
  }
  .bm-best-row {
    background: rgba(39, 134, 74, 0.04) !important;
  }
  .bm-best-row:hover {
    background: rgba(39, 134, 74, 0.06) !important;
  }
  .bm-baseline-row {
    background: rgba(45, 108, 162, 0.03) !important;
  }
  .bm-model-name {
    font-weight: 600;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .bm-best-badge {
    font-size: 0.56rem;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 3px;
    background: rgba(39, 134, 74, 0.1);
    color: var(--green, #27864a);
    letter-spacing: 0.04em;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }
  .bm-baseline-badge {
    font-size: 0.56rem;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 3px;
    background: rgba(45, 108, 162, 0.1);
    color: var(--blue, #2d6ca2);
    letter-spacing: 0.04em;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }
  .bm-mono {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.78rem;
  }
  .bm-dim {
    color: var(--text-muted, #9a9590);
  }
  .bm-bar-col {
    width: 100px;
    padding: 10px 8px !important;
  }
  .bm-inline-bar-track {
    height: 4px;
    background: var(--border-subtle, #EDEAE5);
    border-radius: 2px;
    overflow: hidden;
  }
  .bm-inline-bar {
    height: 100%;
    background: var(--accent-light, #E8D5C4);
    border-radius: 2px;
    transition: width 600ms var(--ease-out-expo);
  }
  .bm-inline-bar.best {
    background: linear-gradient(90deg, var(--accent, #D97757), #e8a87c);
    box-shadow: 0 0 4px rgba(217, 119, 87, 0.3);
  }

  /* Feature Importance */
  .bm-features {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .bm-feat-row {
    display: flex;
    align-items: center;
    gap: var(--space-3, 12px);
    padding: 6px 0;
    animation: fade-up 400ms var(--ease-out-expo) both;
  }
  .bm-feat-name {
    width: 180px;
    flex-shrink: 0;
    font-size: 0.72rem;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    color: var(--text-secondary, #6b6560);
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .bm-feat-bar-track {
    flex: 1;
    height: 10px;
    background: var(--border-subtle, #EDEAE5);
    border-radius: 5px;
    overflow: hidden;
  }
  .bm-feat-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--accent, #D97757), #e8a87c);
    border-radius: 5px;
    transition: width 800ms var(--ease-out-expo);
    box-shadow: 0 0 4px rgba(217, 119, 87, 0.15);
  }
  .bm-feat-val {
    width: 50px;
    font-size: 0.72rem;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    color: var(--text-primary, #2D2D2D);
    font-weight: 600;
  }

  /* Context Performance */
  .bm-context-table td, .bm-context-table th {
    text-align: center;
  }
  .bm-context-table td:first-child, .bm-context-table th:first-child {
    text-align: left;
  }
  .bm-context-name {
    text-transform: capitalize;
    font-weight: 500;
    white-space: nowrap;
  }
  .bm-highlight-row {
    background: rgba(39, 134, 74, 0.04) !important;
  }
  .bm-highlight-row:hover {
    background: rgba(39, 134, 74, 0.06) !important;
  }
  .positive { color: var(--green, #27864a); }
  .negative { color: var(--red, #c0392b); }
  .bm-fn-badge {
    display: inline-block;
    font-size: 0.56rem;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 3px;
    background: rgba(39, 134, 74, 0.12);
    color: var(--green, #27864a);
    margin-left: 4px;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }

  /* Timeline */
  .bm-timeline {
    display: flex;
    gap: 0;
    position: relative;
    padding: var(--space-5, 20px) 0;
    justify-content: space-between;
  }
  .bm-tl-line {
    position: absolute;
    top: 50%;
    left: 24px;
    right: 24px;
    height: 2px;
    background: var(--border, #E5E0DA);
    z-index: 0;
  }
  .bm-tl-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    z-index: 1;
    flex: 1;
    animation: fade-up 400ms var(--ease-out-expo) both;
  }
  .bm-tl-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid var(--border, #E5E0DA);
    background: var(--surface, #fff);
    transition: all 200ms;
  }
  .bm-tl-item.fail .bm-tl-dot {
    border-color: var(--red, #c0392b);
    background: rgba(192, 57, 43, 0.1);
  }
  .bm-tl-item.pivot .bm-tl-dot {
    border-color: var(--gold, #b7860e);
    background: rgba(183, 134, 14, 0.1);
  }
  .bm-tl-item.progress .bm-tl-dot {
    border-color: var(--blue, #2d6ca2);
    background: rgba(45, 108, 162, 0.1);
  }
  .bm-tl-item.success .bm-tl-dot {
    border-color: var(--green, #27864a);
    background: rgba(39, 134, 74, 0.15);
    box-shadow: var(--glow-green-sm, 0 0 6px rgba(39, 134, 74, 0.3));
  }
  .bm-tl-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 2px;
  }
  .bm-tl-date {
    font-size: 0.62rem;
    font-weight: 700;
    color: var(--text-muted, #9a9590);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .bm-tl-label {
    font-size: 0.76rem;
    font-weight: 600;
    color: var(--text-primary, #2D2D2D);
  }
  .bm-tl-detail {
    font-size: 0.66rem;
    color: var(--text-muted, #9a9590);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }

  /* ── Responsive ── */
  @media (max-width: 960px) {
    .content-layout { grid-template-columns: 1fr; }
    .content-sidebar { position: static; }
    .mc-stats-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 600px) {
    .detail { padding: var(--space-3, 12px); }
    .header-top { flex-direction: column; }
    .header-actions { width: 100%; }
    .model-name { font-size: 1.2rem; }
    .pg-layout { grid-template-columns: 1fr; }
    .mc-stats-grid { grid-template-columns: 1fr 1fr; }

    /* Benchmark mobile */
    .bm-toggle { width: 100%; }
    .bm-toggle-btn { flex: 1; padding: 8px 8px; font-size: 0.68rem; }
    .bm-hero-grid { grid-template-columns: 1fr; }
    .bm-hero-after { font-size: 1.3rem; }
    .bm-arch-row { flex-direction: column; gap: 8px; }
    .bm-arch-branch { flex-direction: row; flex-wrap: wrap; justify-content: center; gap: 4px; }
    .bm-feat-name { width: 120px; font-size: 0.66rem; }
    .bm-timeline { flex-direction: column; gap: var(--space-3, 12px); padding: var(--space-3, 12px) 0; }
    .bm-tl-line { display: none; }
    .bm-tl-item { flex-direction: row; gap: var(--space-3, 12px); }
    .bm-tl-card { align-items: flex-start; text-align: left; }
  }
</style>
