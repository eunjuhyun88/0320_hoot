<script lang="ts">
  import { onMount } from "svelte";
  import { router } from "./lib/stores/router.ts";
  import { unlockedPages } from "./lib/stores/stageStore.ts";
  import { fly, fade } from "svelte/transition";
  import NavBar from "./lib/layout/NavBar.svelte";
  import HomePage from "./lib/pages/HomePage.svelte";
  import MagnetStudioPage from "./lib/pages/MagnetStudioPage.svelte";
  import SiteFooter from "./lib/layout/SiteFooter.svelte";
  import SplashScreen from "./lib/components/SplashScreen.svelte";
  import PageSkeleton from "./lib/components/PageSkeleton.svelte";
  import AgentDock from "./lib/components/agent/AgentDock.svelte";
  import ToastContainer from "./lib/components/ToastContainer.svelte";
  import InfoBar from "./lib/components/InfoBar.svelte";
  import { toastStore } from "./lib/stores/toastStore.ts";
  import { nodeStore } from "./lib/stores/nodeStore.ts";
  import { ppapStore } from "./lib/stores/ppapStore.ts";
  import "./lib/tokens.css";

  let showSplash = true;

  // Initialize demo data for stores
  onMount(() => {
    nodeStore.init();
    ppapStore.init();
  });

  // Lazy-loaded page components (everything except Dashboard which is the landing page)
  const pageLoaders: Record<string, () => Promise<{ default: any }>> = {
    models: () => import("./lib/pages/ModelsPage.svelte"),
    'research-lab': () => import("./lib/pages/ResearchZoomLabPage.svelte"),
    network: () => import("./lib/pages/NetworkView.svelte"),
    'model-detail': () => import("./lib/pages/ModelDetailPage.svelte"),
    protocol: () => import("./lib/pages/EconomicsPage.svelte"),
    pipeline: () => import("./lib/pages/PipelinePage.svelte"),
  };

  // Stage guard: redirect to home if page is locked
  $: if (!$unlockedPages.includes($router) && $router !== 'home' && $router !== 'studio') {
    toastStore.info('This page is locked. Please complete research first.');
    router.navigate('home');
  }

  // Page transition key — increments on route change
  $: routeKey = $router;
  $: isHome = $router === 'home';
  $: isStudio = $router === 'studio';
  $: pagePromise = (!isHome && !isStudio) ? pageLoaders[$router]?.() : null;
</script>

<svelte:head>
  <title>HOOT Protocol — Autonomous Research Mesh</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
</svelte:head>

{#if showSplash}
  <SplashScreen onDone={() => showSplash = false} />
{/if}

<div class="app-shell" data-theme="light">
  <div class="app-shell-backdrop" aria-hidden="true">
    <span class="backdrop-grid"></span>
    <span class="backdrop-orb orb-a"></span>
    <span class="backdrop-orb orb-b"></span>
    <span class="backdrop-orb orb-c"></span>
  </div>

  <div class="workspace-shell">
    <NavBar />

    <div class="workspace-content">
      <InfoBar />

      <main class="app-main">
        {#key routeKey}
          <div class="page-transition" in:fly={{ y: 12, duration: 280, delay: 60 }} out:fade={{ duration: 150 }}>
            {#if isHome}
              <HomePage />
            {:else if isStudio}
              <MagnetStudioPage />
            {:else if pagePromise}
              {#await pagePromise}
                <PageSkeleton />
              {:then mod}
                <svelte:component this={mod.default} />
              {:catch}
                <div class="page-error">
                  <div class="page-error-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                  </div>
                  <p class="page-error-title">Failed to load page</p>
                  <p class="page-error-hint">Check your connection and try again.</p>
                  <div class="page-error-actions">
                    <button class="page-error-btn" on:click={() => { window.location.reload(); }}>Retry</button>
                    <button class="page-error-btn secondary" on:click={() => router.navigate('home')}>Go Home</button>
                  </div>
                </div>
              {/await}
            {:else}
              <div class="page-error">
                <p class="page-error-title">Page not found</p>
                <button class="page-error-btn" on:click={() => router.navigate('home')}>Go Home</button>
              </div>
            {/if}
          </div>
        {/key}
      </main>

      {#if !isHome && !isStudio}
        <SiteFooter />
      {/if}
    </div>
  </div>

  <AgentDock />
  <ToastContainer />
</div>

<style>
  :global(html, body, #app) {
    margin: 0;
    padding: 0;
    width: 100%;
    min-height: 100%;
  }

  :global(body) {
    font-family: var(--font-body, 'Inter', -apple-system, sans-serif);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: var(--shell-gradient, var(--page-bg, #FAF9F7));
    color: var(--text-primary, #2D2D2D);
  }

  :global(*) {
    box-sizing: border-box;
  }

  :global(::selection) {
    background: rgba(217, 119, 87, 0.18);
    color: var(--text-primary, #2D2D2D);
  }

  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
    position: relative;
    isolation: isolate;
  }

  .app-shell > :not(.app-shell-backdrop) {
    position: relative;
    z-index: 1;
  }

  .app-shell-backdrop {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }

  .backdrop-grid,
  .backdrop-orb {
    position: absolute;
    inset: 0;
  }

  .backdrop-grid {
    background:
      linear-gradient(var(--grid-line, rgba(217, 119, 87, 0.06)) 1px, transparent 1px),
      linear-gradient(90deg, var(--grid-line, rgba(217, 119, 87, 0.06)) 1px, transparent 1px);
    background-size: 88px 88px;
    mask-image: radial-gradient(circle at center, rgba(0, 0, 0, 0.85), transparent 78%);
    opacity: 0.28;
  }

  .backdrop-orb {
    border-radius: 50%;
    filter: blur(18px);
    animation: drift 18s ease-in-out infinite;
  }

  .orb-a {
    inset: -14% auto auto -8%;
    width: 36vw;
    height: 36vw;
    max-width: 520px;
    max-height: 520px;
    background: radial-gradient(circle, rgba(217, 119, 87, 0.14), transparent 70%);
  }

  .orb-b {
    inset: auto -6% 10% auto;
    width: 40vw;
    height: 40vw;
    max-width: 620px;
    max-height: 620px;
    background: radial-gradient(circle, rgba(212, 160, 23, 0.12), transparent 72%);
    animation-delay: -6s;
  }

  .orb-c {
    inset: 22% auto auto 48%;
    width: 22vw;
    height: 22vw;
    max-width: 300px;
    max-height: 300px;
    background: radial-gradient(circle, rgba(45, 108, 162, 0.1), transparent 72%);
    animation-delay: -11s;
  }

  .workspace-shell {
    min-height: 100vh;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: stretch;
    position: relative;
  }

  .workspace-content {
    min-width: 0;
    display: flex;
    flex-direction: column;
    padding: 0 18px 18px 0;
  }

  .app-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    min-width: 0;
  }

  .page-transition {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .page-error {
    padding: 60px 24px;
    text-align: center;
    color: var(--text-muted, #9a9590);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .page-error-icon { color: var(--border, #E5E0DA); margin-bottom: 4px; }
  .page-error-title {
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-secondary, #6b6560);
    margin: 0;
  }
  .page-error-hint {
    font-size: 0.74rem;
    color: var(--text-muted, #9a9590);
    margin: 0 0 8px;
  }
  .page-error-actions {
    display: flex;
    gap: 8px;
  }
  .page-error-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 10px;
    background: var(--accent, #D97757);
    color: #fff;
    font: 600 0.78rem/1 var(--font-body, 'Inter', sans-serif);
    cursor: pointer;
    transition: all 150ms;
    min-height: 44px;
    display: flex;
    align-items: center;
  }
  .page-error-btn:hover { opacity: 0.92; transform: translateY(-1px); box-shadow: var(--glow-accent); }
  .page-error-btn.secondary {
    background: var(--surface-elevated, #fff);
    color: var(--text-secondary, #6b6560);
    border: 1px solid var(--border, #E5E0DA);
    backdrop-filter: blur(18px);
  }
  .page-error-btn.secondary:hover { border-color: var(--accent, #D97757); color: var(--accent, #D97757); }

  @keyframes drift {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
    50% { transform: translate3d(2vw, -2vh, 0) scale(1.06); }
  }

  @media (max-width: 980px) {
    .workspace-shell {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .workspace-content {
      padding: 0;
    }
  }
</style>
