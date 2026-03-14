<script lang="ts">
  import { router } from "./router.ts";
  import { onMount } from "svelte";

  let mounted = false;

  onMount(() => {
    document.body.style.background = "#FAF9F7";
    document.body.style.overflow = "auto";
    mounted = true;
    return () => {
      document.body.style.overflow = "";
    };
  });
</script>

<div class="landing" class:mounted data-theme="light">
  <!-- ═══ Header ═══ -->
  <header class="header">
    <div class="header-inner">
      <a href="#/" class="logo">HOOT</a>
      <nav class="nav">
        <a href="#protocol" class="nav-link">Protocol</a>
        <a href="#mesh" class="nav-link">Mesh</a>
        <a href="#research" class="nav-link">Research</a>
      </nav>
      <button class="cta-sm" on:click={() => router.navigate('dashboard')}>
        Open Dashboard
      </button>
    </div>
  </header>

  <!-- ═══ Hero ═══ -->
  <section class="hero">
    <div class="hero-inner">
      <div class="hero-content">
        <h1 class="hero-title">
          Autonomous<br />Research at Scale
        </h1>
        <p class="hero-sub">
          A distributed AI production protocol that connects browser-native data
          contribution and idle GPU compute to verifiable training lineage,
          model rights, and automated settlement.
        </p>
        <div class="hero-actions">
          <button class="btn-primary" on:click={() => router.navigate('dashboard')}>
            View Live Mesh
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <a href="https://hoot.holostudio.io" target="_blank" rel="noopener" class="btn-secondary">
            Read Whitepaper
          </a>
        </div>
        <div class="hero-stats">
          <div class="hero-stat">
            <span class="hero-stat-value">4,080</span>
            <span class="hero-stat-label">Search Configs</span>
          </div>
          <div class="hero-stat-sep"></div>
          <div class="hero-stat">
            <span class="hero-stat-value">0.9851</span>
            <span class="hero-stat-label">Balanced Accuracy</span>
          </div>
          <div class="hero-stat-sep"></div>
          <div class="hero-stat">
            <span class="hero-stat-value">50×</span>
            <span class="hero-stat-label">Speedup vs Serial</span>
          </div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="globe-preview">
          <div class="globe-ring ring-1"></div>
          <div class="globe-ring ring-2"></div>
          <div class="globe-ring ring-3"></div>
          <div class="globe-core"></div>
          <div class="globe-dot dot-1"></div>
          <div class="globe-dot dot-2"></div>
          <div class="globe-dot dot-3"></div>
          <div class="globe-dot dot-4"></div>
          <div class="globe-dot dot-5"></div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ Protocol Cards ═══ -->
  <section class="section" id="protocol">
    <div class="section-inner">
      <h2 class="section-title">Three-Layer Architecture</h2>
      <p class="section-sub">Four invariants for a complete AI production ledger</p>
      <div class="cards-3">
        <div class="card">
          <div class="card-badge layer-1">L1</div>
          <h3 class="card-title">PROOF</h3>
          <p class="card-desc">
            Data provenance attestation via zkTLS and optimistic verification.
            Cryptographic guarantee: forgery probability &le; 2<sup>-128</sup>.
          </p>
          <div class="card-object">PPAPRecord &rarr; CONFIRMED</div>
        </div>
        <div class="card">
          <div class="card-badge layer-2">L2</div>
          <h3 class="card-title">MODEL</h3>
          <p class="card-desc">
            Training lineage, verifiable training records, and model rights.
            Distributed hyperparameter search as embarrassingly parallel workload.
          </p>
          <div class="card-object">ResearchJob &rarr; VTR &rarr; ModelRights</div>
        </div>
        <div class="card">
          <div class="card-badge layer-3">L3</div>
          <h3 class="card-title">AGENT</h3>
          <p class="card-desc">
            Usage metering and automated settlement.
            Pool A/B payout with on-chain distribution rules.
          </p>
          <div class="card-object">UsageSettlement &rarr; SETTLED</div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ Autoresearch Flow ═══ -->
  <section class="section section-alt" id="mesh">
    <div class="section-inner">
      <h2 class="section-title">Distributed Autoresearch</h2>
      <p class="section-sub">
        Autonomous AI research running across a global mesh network
      </p>
      <div class="flow">
        <div class="flow-step">
          <div class="flow-icon">&#9998;</div>
          <div class="flow-label">Modify</div>
          <div class="flow-desc">Agent edits training config</div>
        </div>
        <div class="flow-arrow">&rarr;</div>
        <div class="flow-step active">
          <div class="flow-icon">&#9881;</div>
          <div class="flow-label">Train</div>
          <div class="flow-desc">5-min fixed wall-clock</div>
        </div>
        <div class="flow-arrow">&rarr;</div>
        <div class="flow-step">
          <div class="flow-icon">&#9874;</div>
          <div class="flow-label">Evaluate</div>
          <div class="flow-desc">Measure val_bpb</div>
        </div>
        <div class="flow-arrow">&rarr;</div>
        <div class="flow-step">
          <div class="flow-icon">&#10003;</div>
          <div class="flow-label">Decide</div>
          <div class="flow-desc">Keep or discard</div>
        </div>
      </div>
      <div class="flow-stats">
        <span class="flow-stat"><strong>12</strong> experiments/hour</span>
        <span class="flow-stat-sep">&middot;</span>
        <span class="flow-stat"><strong>100+</strong> iterations overnight</span>
        <span class="flow-stat-sep">&middot;</span>
        <span class="flow-stat"><strong>0</strong> false negatives</span>
      </div>
    </div>
  </section>

  <!-- ═══ User Journeys ═══ -->
  <section class="section" id="research">
    <div class="section-inner">
      <h2 class="section-title">User Journeys</h2>
      <p class="section-sub">Six roles driving the protocol</p>
      <div class="cards-6">
        <div class="journey-card">
          <div class="journey-icon">&#128100;</div>
          <h4 class="journey-name">Contributor</h4>
          <p class="journey-desc">Browser-native data contribution via PPAP</p>
        </div>
        <div class="journey-card">
          <div class="journey-icon">&#128270;</div>
          <h4 class="journey-name">Verifier</h4>
          <p class="journey-desc">Challenge and arbitrate data provenance</p>
        </div>
        <div class="journey-card">
          <div class="journey-icon">&#128187;</div>
          <h4 class="journey-name">Compute Node</h4>
          <p class="journey-desc">Donate idle GPU for distributed training</p>
        </div>
        <div class="journey-card">
          <div class="journey-icon">&#128218;</div>
          <h4 class="journey-name">Builder</h4>
          <p class="journey-desc">Create research jobs and train models</p>
        </div>
        <div class="journey-card">
          <div class="journey-icon">&#128176;</div>
          <h4 class="journey-name">Buyer</h4>
          <p class="journey-desc">Consume model inference via settlement</p>
        </div>
        <div class="journey-card">
          <div class="journey-icon">&#128451;</div>
          <h4 class="journey-name">Data Curator</h4>
          <p class="journey-desc">Bundle verified PPAP into tradeable assets</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ CTA Section ═══ -->
  <section class="section-cta">
    <div class="section-inner">
      <h2 class="cta-title">Explore the Live Mesh</h2>
      <p class="cta-sub">
        Watch autonomous research happening in real-time across distributed compute nodes
      </p>
      <button class="btn-primary btn-lg" on:click={() => router.navigate('dashboard')}>
        Open Dashboard
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
          <path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </section>

  <!-- ═══ Footer ═══ -->
  <footer class="footer">
    <div class="footer-inner">
      <span class="footer-brand">HOOT Protocol</span>
      <span class="footer-copy">&copy; 2026 Holo Studio Co., Ltd.</span>
    </div>
  </footer>
</div>

<style>
  .landing {
    min-height: 100vh;
    color: var(--text-primary, #2D2D2D);
    font-family: var(--font-body, 'Inter', sans-serif);
    background: var(--page-bg, #FAF9F7);
    opacity: 0;
    transition: opacity 400ms ease;
  }

  .landing.mounted { opacity: 1; }

  /* ═══ Header ═══ */
  .header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(250, 249, 247, 0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border, #E5E0DA);
  }

  .header-inner {
    max-width: 1120px;
    margin: 0 auto;
    padding: 0 var(--space-6, 24px);
    height: var(--header-height, 52px);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo {
    font-family: var(--font-display, 'Playfair Display', serif);
    font-weight: 700;
    font-size: 1.25rem;
    color: var(--text-primary, #2D2D2D);
    text-decoration: none;
    letter-spacing: 0.04em;
  }

  .nav {
    display: flex;
    gap: var(--space-6, 24px);
  }

  .nav-link {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-secondary, #6b6560);
    text-decoration: none;
    transition: color 200ms ease;
  }

  .nav-link:hover {
    color: var(--accent, #D97757);
  }

  .cta-sm {
    appearance: none;
    border: 1px solid var(--border, #E5E0DA);
    background: var(--surface, #fff);
    color: var(--text-primary, #2D2D2D);
    font-size: 0.8rem;
    font-weight: 500;
    padding: 6px 16px;
    border-radius: var(--radius-sm, 6px);
    cursor: pointer;
    transition: all 200ms ease;
  }

  .cta-sm:hover {
    background: var(--accent, #D97757);
    color: #fff;
    border-color: var(--accent, #D97757);
  }

  /* ═══ Hero ═══ */
  .hero {
    padding: 80px 0 60px;
  }

  .hero-inner {
    max-width: 1120px;
    margin: 0 auto;
    padding: 0 var(--space-6, 24px);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-16, 64px);
    align-items: center;
  }

  .hero-title {
    font-family: var(--font-display, 'Playfair Display', serif);
    font-weight: 700;
    font-size: 3.4rem;
    line-height: 1.1;
    color: var(--text-primary, #2D2D2D);
    margin: 0 0 var(--space-5, 20px);
  }

  .hero-sub {
    font-size: 1.05rem;
    line-height: 1.65;
    color: var(--text-secondary, #6b6560);
    margin: 0 0 var(--space-8, 32px);
    max-width: 480px;
  }

  .hero-actions {
    display: flex;
    gap: var(--space-3, 12px);
    margin-bottom: var(--space-10, 40px);
  }

  .btn-primary {
    appearance: none;
    border: none;
    background: var(--accent, #D97757);
    color: #fff;
    font-size: 0.9rem;
    font-weight: 600;
    padding: 12px 24px;
    border-radius: var(--radius-sm, 6px);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 200ms ease;
  }

  .btn-primary:hover {
    background: var(--accent-hover, #C4644A);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(217, 119, 87, 0.3);
  }

  .btn-primary.btn-lg {
    font-size: 1rem;
    padding: 14px 32px;
  }

  .btn-secondary {
    appearance: none;
    border: 1px solid var(--border, #E5E0DA);
    background: transparent;
    color: var(--text-primary, #2D2D2D);
    font-size: 0.9rem;
    font-weight: 500;
    padding: 12px 24px;
    border-radius: var(--radius-sm, 6px);
    cursor: pointer;
    text-decoration: none;
    transition: all 200ms ease;
  }

  .btn-secondary:hover {
    border-color: var(--text-secondary, #6b6560);
    background: rgba(0, 0, 0, 0.02);
  }

  .hero-stats {
    display: flex;
    align-items: center;
    gap: var(--space-5, 20px);
  }

  .hero-stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    font-variant-numeric: tabular-nums;
  }

  .hero-stat-label {
    display: block;
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--text-muted, #9a9590);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-top: 2px;
  }

  .hero-stat-sep {
    width: 1px;
    height: 36px;
    background: var(--border, #E5E0DA);
  }

  /* Globe Preview (decorative) */
  .hero-visual {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .globe-preview {
    position: relative;
    width: 340px;
    height: 340px;
  }

  .globe-ring {
    position: absolute;
    border-radius: 50%;
    border: 1px solid rgba(217, 119, 87, 0.15);
  }

  .ring-1 {
    inset: 0;
    animation: spin-ring 30s linear infinite;
  }

  .ring-2 {
    inset: 30px;
    border-color: rgba(217, 119, 87, 0.1);
    animation: spin-ring 25s linear infinite reverse;
  }

  .ring-3 {
    inset: 60px;
    border-color: rgba(217, 119, 87, 0.08);
    animation: spin-ring 20s linear infinite;
  }

  @keyframes spin-ring {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .globe-core {
    position: absolute;
    inset: 100px;
    border-radius: 50%;
    background: radial-gradient(circle at 40% 35%, var(--accent-light, #E8D5C4), var(--accent, #D97757));
    box-shadow: 0 0 60px rgba(217, 119, 87, 0.2);
  }

  .globe-dot {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent, #D97757);
  }

  .dot-1 { top: 40px; left: 50%; animation: pulse-d 2s ease infinite; }
  .dot-2 { top: 50%; right: 20px; animation: pulse-d 2s ease infinite 0.4s; }
  .dot-3 { bottom: 60px; left: 30%; animation: pulse-d 2s ease infinite 0.8s; }
  .dot-4 { top: 30%; left: 25px; animation: pulse-d 2s ease infinite 1.2s; }
  .dot-5 { bottom: 30px; right: 35%; animation: pulse-d 2s ease infinite 1.6s; }

  @keyframes pulse-d {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.5); }
  }

  /* ═══ Sections ═══ */
  .section {
    padding: 80px 0;
  }

  .section-alt {
    background: var(--surface, #fff);
  }

  .section-inner {
    max-width: 1120px;
    margin: 0 auto;
    padding: 0 var(--space-6, 24px);
  }

  .section-title {
    font-family: var(--font-display, 'Playfair Display', serif);
    font-weight: 700;
    font-size: 2rem;
    color: var(--text-primary, #2D2D2D);
    margin: 0 0 var(--space-2, 8px);
    text-align: center;
  }

  .section-sub {
    font-size: 0.95rem;
    color: var(--text-secondary, #6b6560);
    text-align: center;
    margin: 0 0 var(--space-10, 40px);
  }

  /* Protocol Cards */
  .cards-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-5, 20px);
  }

  .card {
    padding: var(--space-6, 24px);
    border-radius: var(--radius-md, 10px);
    border: 1px solid var(--border, #E5E0DA);
    background: var(--surface, #fff);
    box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.06));
    transition: box-shadow 200ms ease, transform 200ms ease;
  }

  .card:hover {
    box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08));
    transform: translateY(-2px);
  }

  .card-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: var(--radius-pill, 100px);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    margin-bottom: var(--space-3, 12px);
  }

  .card-badge.layer-1 {
    background: rgba(39, 134, 74, 0.1);
    color: var(--green, #27864a);
  }

  .card-badge.layer-2 {
    background: rgba(217, 119, 87, 0.1);
    color: var(--accent, #D97757);
  }

  .card-badge.layer-3 {
    background: rgba(45, 108, 162, 0.1);
    color: var(--blue, #2d6ca2);
  }

  .card-title {
    font-family: var(--font-display, 'Playfair Display', serif);
    font-size: 1.35rem;
    font-weight: 700;
    margin: 0 0 var(--space-2, 8px);
    color: var(--text-primary, #2D2D2D);
  }

  .card-desc {
    font-size: 0.85rem;
    line-height: 1.6;
    color: var(--text-secondary, #6b6560);
    margin: 0 0 var(--space-4, 16px);
  }

  .card-object {
    font-size: 0.72rem;
    font-family: "SF Mono", "Fira Code", monospace;
    color: var(--text-muted, #9a9590);
    padding: 6px 10px;
    background: rgba(0, 0, 0, 0.03);
    border-radius: var(--radius-sm, 6px);
  }

  /* Autoresearch Flow */
  .flow {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: var(--space-4, 16px);
    margin-bottom: var(--space-8, 32px);
  }

  .flow-step {
    text-align: center;
    padding: var(--space-5, 20px) var(--space-4, 16px);
    border-radius: var(--radius-md, 10px);
    border: 1px solid var(--border, #E5E0DA);
    background: var(--page-bg, #FAF9F7);
    min-width: 140px;
    transition: all 200ms ease;
  }

  .flow-step.active {
    border-color: var(--accent, #D97757);
    background: rgba(217, 119, 87, 0.04);
  }

  .flow-icon {
    font-size: 1.5rem;
    margin-bottom: var(--space-2, 8px);
  }

  .flow-label {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text-primary, #2D2D2D);
    margin-bottom: 4px;
  }

  .flow-desc {
    font-size: 0.75rem;
    color: var(--text-muted, #9a9590);
  }

  .flow-arrow {
    display: flex;
    align-items: center;
    color: var(--text-muted, #9a9590);
    font-size: 1.2rem;
    padding-top: 28px;
  }

  .flow-stats {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--space-3, 12px);
    font-size: 0.85rem;
    color: var(--text-secondary, #6b6560);
  }

  .flow-stat strong {
    color: var(--accent, #D97757);
    font-weight: 700;
  }

  .flow-stat-sep {
    color: var(--text-muted, #9a9590);
  }

  /* User Journeys */
  .cards-6 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-4, 16px);
  }

  .journey-card {
    padding: var(--space-5, 20px);
    border-radius: var(--radius-md, 10px);
    border: 1px solid var(--border, #E5E0DA);
    background: var(--surface, #fff);
    text-align: center;
    transition: all 200ms ease;
  }

  .journey-card:hover {
    border-color: var(--accent, #D97757);
    transform: translateY(-2px);
  }

  .journey-icon {
    font-size: 1.6rem;
    margin-bottom: var(--space-2, 8px);
  }

  .journey-name {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary, #2D2D2D);
    margin: 0 0 4px;
  }

  .journey-desc {
    font-size: 0.75rem;
    color: var(--text-muted, #9a9590);
    margin: 0;
    line-height: 1.5;
  }

  /* CTA Section */
  .section-cta {
    padding: 80px 0;
    text-align: center;
    background: linear-gradient(135deg, #3D2B22, #2A1E18);
    color: #fff;
  }

  .cta-title {
    font-family: var(--font-display, 'Playfair Display', serif);
    font-weight: 700;
    font-size: 2rem;
    margin: 0 0 var(--space-3, 12px);
    color: #fff;
  }

  .cta-sub {
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.6);
    margin: 0 0 var(--space-8, 32px);
  }

  /* Footer */
  .footer {
    padding: var(--space-6, 24px) 0;
    border-top: 1px solid var(--border, #E5E0DA);
  }

  .footer-inner {
    max-width: 1120px;
    margin: 0 auto;
    padding: 0 var(--space-6, 24px);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .footer-brand {
    font-family: var(--font-display, 'Playfair Display', serif);
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--text-primary, #2D2D2D);
  }

  .footer-copy {
    font-size: 0.75rem;
    color: var(--text-muted, #9a9590);
  }

  /* ═══ Responsive ═══ */
  @media (max-width: 860px) {
    .hero-inner {
      grid-template-columns: 1fr;
      gap: var(--space-8, 32px);
    }

    .hero-title { font-size: 2.4rem; }

    .hero-visual { display: none; }

    .hero-stats {
      flex-wrap: wrap;
      gap: var(--space-4, 16px);
    }

    .hero-stat-sep { display: none; }

    .cards-3 { grid-template-columns: 1fr; }

    .flow {
      flex-direction: column;
      align-items: center;
    }

    .flow-arrow { transform: rotate(90deg); padding: 0; }

    .cards-6 { grid-template-columns: repeat(2, 1fr); }

    .nav { display: none; }
  }

  @media (max-width: 600px) {
    .hero { padding: 48px 0 40px; }
    .section { padding: 48px 0; }
    .hero-title { font-size: 2rem; }
    .cards-6 { grid-template-columns: 1fr; }
  }
</style>
