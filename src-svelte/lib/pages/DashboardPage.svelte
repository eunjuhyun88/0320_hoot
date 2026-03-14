<script lang="ts">
  import { onMount } from "svelte";
  import { router } from "../stores/router.ts";
  import { jobStore } from "../stores/jobStore.ts";
  import {
    createFixturePlayback,
    demoFixtureText,
    parseNdjson,
  } from "../utils/fixturePlayer.ts";
  import {
    buildScaledNodes,
    isWorkerActiveState,
    oscillate01,
    smoothPulse,
  } from "../utils/meshSim.ts";
  import type { VisualizerModel } from "../utils/types.ts";
  import { TICKER_EVENTS } from "../data/tickerEvents.ts";
  import { TOPIC_SUGGESTIONS } from "../data/topicSuggestions.ts";

  import { animateCounter } from "../utils/animate.ts";
  import HeroSection from "../components/HeroSection.svelte";
  import BenchmarkShowcase from "../components/BenchmarkShowcase.svelte";
  import HowItWorks from "../components/HowItWorks.svelte";
  import PixelIcon from "../components/PixelIcon.svelte";
  import LiveNetworkStrip from "../components/LiveNetworkStrip.svelte";

  let searchQuery = "";
  let mounted = false;

  let scrollY = 0;

  let statsVisible = false;
  let statsEl: HTMLElement;
  let displayNodes = 0;
  let displayGpu = 0;
  let displayWorkers = 0;
  let displayJobs = 0;
  let displayFindings = 0;

  let destroyed = false;

  let sectionsRevealed = new Set<string>();
  function revealSection(id: string) {
    sectionsRevealed.add(id);
    sectionsRevealed = sectionsRevealed;
  }

  const tickerEvents = TICKER_EVENTS;
  const topicSuggestions = TOPIC_SUGGESTIONS;

  const events = parseNdjson(demoFixtureText);
  const playback = createFixturePlayback(events);
  const emptyModel: VisualizerModel = { workers: [], nodes: [], jobs: [], tape: [] };

  let frameIndex = playback.length > 0 ? 0 : -1;
  let meshSimulationTime = 0;
  let meshPopulationDisplayed = 0;

  function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

  $: fixtureModel = playback[Math.max(frameIndex, 0)] ?? emptyModel;
  $: model = fixtureModel;
  $: meshPopulationCeiling = model.nodes.length === 0 ? 0 : clamp(Math.max(3200, model.nodes.length * 660), 2200, 5600);
  $: meshPopulationTarget = (() => {
    if (model.nodes.length === 0) return 0;
    const lw = smoothPulse(oscillate01(meshSimulationTime / 24 - Math.PI / 2));
    const sw = smoothPulse(oscillate01(meshSimulationTime / 12.5 - 0.7));
    return Math.round(model.nodes.length + meshPopulationCeiling * clamp(0.07 + lw * 0.72 + sw * 0.12, 0.07, 0.97));
  })();
  $: renderNodes = buildScaledNodes(model.nodes, model.jobs, meshPopulationDisplayed, meshPopulationCeiling, meshSimulationTime);
  $: totalNodes = renderNodes.length;
  $: activeWorkers = model.workers.filter(w => isWorkerActiveState(w.state)).length;
  $: totalGpu = model.nodes.reduce((s, n) => s + n.gpu, 0);
  $: keepCount = model.tape.filter(e => e.result === "keep").length;

  function handleSearch(e: CustomEvent<string>) {
    const topic = e.detail;
    jobStore.startJob(topic);
    router.navigate("research", { topic });
  }

  function handleTopic(e: CustomEvent<string>) {
    searchQuery = e.detail;
    jobStore.startJob(e.detail);
    router.navigate("research", { topic: e.detail });
  }

  onMount(() => {
    mounted = true;
    meshPopulationDisplayed = model.nodes.length;

    const handleScroll = () => { scrollY = window.scrollY; };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('data-reveal');
          if (id) revealSection(id);
          if (entry.target === statsEl && !statsVisible) {
            statsVisible = true;
            const d = () => destroyed;
            animateCounter(0, totalNodes, 1200, v => displayNodes = v, d);
            animateCounter(0, totalGpu, 800, v => displayGpu = v, d);
            animateCounter(0, activeWorkers, 800, v => displayWorkers = v, d);
            animateCounter(0, model.jobs.length, 600, v => displayJobs = v, d);
            animateCounter(0, keepCount, 600, v => displayFindings = v, d);
          }
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    requestAnimationFrame(() => {
      document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
      if (statsEl) observer.observe(statsEl);
    });

    let dwellCount = 0;
    const fixtureInterval = setInterval(() => {
      if (playback.length <= 1) return;
      if (frameIndex < 0) { frameIndex = 0; return; }
      if (frameIndex >= playback.length - 1) {
        dwellCount += 1;
        if (dwellCount >= 3) { dwellCount = 0; frameIndex = 0; }
        return;
      }
      frameIndex += 1;
    }, 2800);

    const tickInterval = setInterval(() => {
      meshSimulationTime += 0.5;
      const floor = model.nodes.length;
      const cur = Math.max(meshPopulationDisplayed, floor);
      if (cur !== meshPopulationTarget) {
        const step = Math.max(3, Math.ceil(Math.abs(meshPopulationTarget - cur) * 0.03));
        meshPopulationDisplayed = cur < meshPopulationTarget
          ? Math.min(meshPopulationTarget, cur + step)
          : Math.max(meshPopulationTarget, cur - step);
      }
    }, 500);

    return () => {
      destroyed = true;
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
      clearInterval(fixtureInterval);
      clearInterval(tickInterval);
    };
  });
</script>

<svelte:window bind:scrollY={scrollY} />

<div class="home" class:mounted data-theme="light">
  <HeroSection
    bind:searchQuery
    {topicSuggestions}
    {renderNodes}
    jobs={model.jobs}
    workers={model.workers}
    on:search={handleSearch}
    on:topic={handleTopic}
  />

  <div data-reveal="featured">
    <BenchmarkShowcase
      revealed={sectionsRevealed.has('featured')}
      on:viewBenchmark={() => router.navigate('model-detail', { modelId: 'model-um69vho1' })}
    />
  </div>

  <div data-reveal="how">
    <HowItWorks revealed={sectionsRevealed.has('how')} />
  </div>

  <div bind:this={statsEl} data-reveal="net">
    <LiveNetworkStrip
      revealed={sectionsRevealed.has('net')}
      {statsVisible}
      {displayNodes}
      {displayGpu}
      {displayWorkers}
      {displayJobs}
      {displayFindings}
      {tickerEvents}
      on:viewNetwork={() => router.navigate('network')}
    />
  </div>

  <!-- Explore cards -->
  <section class="explore" data-reveal="explore" class:revealed={sectionsRevealed.has('explore')}>
    <div class="ex-grid">
      <button class="ex-card" on:click={() => router.navigate('research')}>
        <div class="ex-icon acc">
          <PixelIcon type="chart" size={22} />
        </div>
        <h3>Autoresearch</h3>
        <p>Monitor experiments, metrics, and distributed training in real-time.</p>
        <span class="ex-link">Open →</span>
      </button>
      <button class="ex-card" on:click={() => router.navigate('models')}>
        <div class="ex-icon">
          <PixelIcon type="grid" size={22} />
        </div>
        <h3>Model Hub</h3>
        <p>Browse trained models, benchmarks, and deployment options.</p>
        <span class="ex-link">Open →</span>
      </button>
      <button class="ex-card" on:click={() => router.navigate('network')}>
        <div class="ex-icon">
          <PixelIcon type="globe" size={22} />
        </div>
        <h3>Live Network</h3>
        <p>Global compute mesh — nodes, jobs, and GPU utilization in real-time.</p>
        <span class="ex-link">Open →</span>
      </button>
    </div>
  </section>
</div>

<style>
  .home {
    opacity: 0; transition: opacity 600ms ease;
    -webkit-font-smoothing: antialiased;
    background: var(--page-bg, #FAF9F7);
    min-height: 100vh;
  }
  .home.mounted { opacity: 1; }

  :global(.px-icon) {
    image-rendering: pixelated;
    image-rendering: crisp-edges;
  }

  /* Explore */
  .explore {
    max-width: 960px; margin: 0 auto;
    padding: 0 40px 80px;
    opacity: 0; transform: translateY(24px);
    transition: opacity 700ms cubic-bezier(0.16,1,0.3,1), transform 700ms cubic-bezier(0.16,1,0.3,1);
  }
  .explore.revealed { opacity: 1; transform: translateY(0); }
  .ex-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 2px; background: var(--border-subtle, #EDEAE5);
    border-radius: 16px; overflow: hidden;
  }
  .ex-card {
    appearance: none; border: none;
    background: var(--surface, #fff);
    padding: 28px 24px; text-align: left; cursor: pointer;
    transition: background 200ms;
  }
  .ex-card:hover { background: var(--page-bg, #FAF9F7); }
  .ex-icon {
    width: 40px; height: 40px; border-radius: 10px;
    background: rgba(0,0,0,0.04);
    display: flex; align-items: center; justify-content: center;
    color: var(--text-secondary); margin-bottom: 16px;
    transition: transform 200ms;
  }
  .ex-icon.acc { background: rgba(217,119,87,0.06); color: var(--accent); }
  .ex-card:hover .ex-icon { transform: scale(1.06); }
  .ex-card h3 { font-size: 0.92rem; font-weight: 700; color: var(--text-primary); margin: 0 0 6px; }
  .ex-card p { font-size: 0.78rem; color: var(--text-secondary); margin: 0 0 12px; line-height: 1.5; }
  .ex-link {
    font-size: 0.7rem; font-weight: 600; color: var(--accent);
    display: inline-block; transition: transform 150ms;
  }
  .ex-card:hover .ex-link { transform: translateX(3px); }

  @media (max-width: 860px) {
    .explore { padding: 0 24px 60px; }
    .ex-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 600px) {
    .explore { padding: 0 16px 48px; }
    .ex-card { padding: 22px 18px; }
  }
</style>
