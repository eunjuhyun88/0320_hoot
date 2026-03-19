<script lang="ts">
  import { onMount } from "svelte";
  import { router, type AppView } from "../stores/router.ts";
  import { jobStore, completedCount } from "../stores/jobStore.ts";
  import { wallet, WALLET_OPTIONS } from "../stores/walletStore.ts";
  import { unlockedPages } from "../stores/stageStore.ts";
  import PixelOwl from "../components/PixelOwl.svelte";
  import PixelIcon from "../components/PixelIcon.svelte";
  import ConnectionBadge from "../components/ConnectionBadge.svelte";

  type PixelIconType =
    | "sparkle"
    | "grid"
    | "chart"
    | "globe"
    | "protocol"
    | "ontology"
    | "research"
    | "arrow";

  type NavItem = {
    view: AppView;
    label: string;
    shortLabel: string;
    icon: PixelIconType;
    detail: string;
  };

  const navItems: NavItem[] = [
    {
      view: "home",
      label: "Overview",
      shortLabel: "Home",
      icon: "sparkle",
      detail: "Mission control, high-level mesh health, and first-run entry point.",
    },
    {
      view: "studio",
      label: "Magnet Studio",
      shortLabel: "Studio",
      icon: "research",
      detail: "Launch, steer, and monitor active research sessions.",
    },
    {
      view: "research-lab",
      label: "Research Lab",
      shortLabel: "Lab",
      icon: "chart",
      detail: "Inspect semantic zoom experiments and deeper research views.",
    },
    {
      view: "models",
      label: "Models",
      shortLabel: "Models",
      icon: "grid",
      detail: "Benchmark packs, checkpoints, and model surface inventory.",
    },
    {
      view: "network",
      label: "Network",
      shortLabel: "Network",
      icon: "globe",
      detail: "Live browser-compute mesh, routing, and node activity.",
    },
    {
      view: "protocol",
      label: "Protocol",
      shortLabel: "Protocol",
      icon: "protocol",
      detail: "Trust score, PPAP pipeline, and protocol economics surfaces.",
    },
    {
      view: "pipeline",
      label: "Pipeline",
      shortLabel: "Pipeline",
      icon: "arrow",
      detail: "Execution flow, worker stages, and pipeline readiness tracking.",
    },
  ];

  const DESKTOP_PANEL_KEY = "hoot-desktop-nav-collapsed";
  const RECENT_VIEWS_KEY = "hoot-desktop-nav-recents";
  const DOWNLOAD_URL = "https://x.com/HootBrowser";

  let mobileMenuOpen = false;
  let walletDropdownOpen = false;
  let desktopCollapsed = false;
  let recentViews: AppView[] = [];
  let trackedView: AppView | null = null;

  const wallets = WALLET_OPTIONS;

  function resolvePrimaryView(view: AppView): AppView {
    if (view === "model-detail") return "models";
    return view;
  }

  $: currentView = $router;
  $: currentPrimaryView = resolvePrimaryView(currentView);
  $: visibleNavItems = navItems.filter(
    item => item.view === "home" || item.view === "studio" || $unlockedPages.includes(item.view)
  );
  $: activeItem = visibleNavItems.find(item => item.view === currentPrimaryView) ?? visibleNavItems[0];
  $: secondaryItems = visibleNavItems.filter(item => item.view !== "home");
  $: recentItemObjects = recentViews
    .filter(view => view !== currentPrimaryView)
    .map(view => visibleNavItems.find(item => item.view === view))
    .filter((item): item is NavItem => Boolean(item))
    .slice(0, 3);
  $: isAIActive = $jobStore.phase === "running" || $jobStore.phase === "setup";
  $: owlMood = (() => {
    const phase = $jobStore.phase;
    if (phase === "running") return "research";
    if (phase === "setup") return "build";
    if (phase === "complete") return "celebrate";
    return "idle";
  })();
  $: researchProgress =
    $jobStore.totalExperiments > 0
      ? Math.round(($completedCount / $jobStore.totalExperiments) * 100)
      : 0;
  $: researchLine = isAIActive
    ? `${researchProgress}% complete across ${$jobStore.completedExperiments} completed runs`
    : "Ready to launch a new mesh research session";
  $: walletSummary = $wallet.connected
    ? `${$wallet.name} · ${$wallet.address}`
    : "Connect wallet to unlock protocol actions";

  $: if (currentPrimaryView && currentPrimaryView !== trackedView) {
    trackedView = currentPrimaryView;
    rememberView(currentPrimaryView);
  }

  onMount(() => {
    if (typeof window === "undefined") return;
    desktopCollapsed = window.localStorage.getItem(DESKTOP_PANEL_KEY) === "1";
    const storedRecentViews = window.localStorage.getItem(RECENT_VIEWS_KEY);
    if (!storedRecentViews) return;
    try {
      const parsed = JSON.parse(storedRecentViews) as AppView[];
      recentViews = parsed.filter(view => navItems.some(item => item.view === view)).slice(0, 5);
    } catch {
      recentViews = [];
    }
  });

  function rememberView(view: AppView) {
    if (typeof window === "undefined") return;
    if (!navItems.some(item => item.view === view)) return;
    recentViews = [view, ...recentViews.filter(entry => entry !== view)].slice(0, 5);
    window.localStorage.setItem(RECENT_VIEWS_KEY, JSON.stringify(recentViews));
  }

  function navTo(view: AppView) {
    router.navigate(view);
    mobileMenuOpen = false;
    walletDropdownOpen = false;
  }

  function toggleDesktopPanel() {
    desktopCollapsed = !desktopCollapsed;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DESKTOP_PANEL_KEY, desktopCollapsed ? "1" : "0");
    }
  }

  function handleWalletClick() {
    walletDropdownOpen = !walletDropdownOpen;
  }

  function selectWallet(name: string) {
    wallet.connect(name);
    walletDropdownOpen = false;
  }

  function handleDisconnect() {
    wallet.disconnect();
    walletDropdownOpen = false;
  }
</script>

<div class="shell-nav" class:collapsed={desktopCollapsed}>
  <aside class="desktop-nav" aria-label="Desktop navigation">
    <div class="desktop-rail">
      <button class="rail-brand" type="button" on:click={() => navTo("home")} aria-label="Go to home">
        <span class="rail-brand-icon" class:ai-active={isAIActive}>
          <PixelOwl size={0.23} mood={owlMood} />
          {#if isAIActive}
            <span class="rail-brand-pulse"></span>
          {/if}
        </span>
      </button>

      <button
        class="rail-toggle"
        class:open={!desktopCollapsed}
        type="button"
        on:click={toggleDesktopPanel}
        aria-label={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <span class="rail-toggle-lines" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      <div class="rail-group">
        {#each visibleNavItems as item (item.view)}
          <button
            class="rail-item"
            class:active={currentPrimaryView === item.view}
            type="button"
            aria-label={item.label}
            title={item.label}
            on:click={() => navTo(item.view)}
          >
            <PixelIcon type={item.icon} size={17} />
            {#if item.view === "network"}
              <span class="rail-live-dot"></span>
            {/if}
          </button>
        {/each}
      </div>

      <div class="rail-spacer"></div>

      <a
        class="rail-link"
        href={DOWNLOAD_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Download Hoot Browser"
        title="Download Hoot Browser"
      >
        <PixelIcon type="sparkle" size={16} />
      </a>

      <button
        class="rail-wallet"
        class:connected={$wallet.connected}
        type="button"
        aria-label="Wallet"
        title={$wallet.connected ? walletSummary : "Connect wallet"}
        on:click={handleWalletClick}
      >
        <span class="rail-wallet-core"></span>
      </button>
    </div>

    <div class="desktop-panel">
      <div class="panel-top">
        <div class="panel-kicker">
          <span class="panel-kicker-dot"></span>
          <span>Workspace</span>
        </div>
        <h1>{activeItem.label}</h1>
        <p>{activeItem.detail}</p>
      </div>

      <button class="panel-primary-action" type="button" on:click={() => navTo("studio")}>
        <span class="panel-primary-mark">+</span>
        <span class="panel-primary-copy">
          <strong>{isAIActive ? "Open active research" : "Start new research"}</strong>
          <small>{isAIActive ? researchLine : "Jump into Magnet Studio and spin up a fresh mesh run."}</small>
        </span>
      </button>

      <section class="panel-section">
        <div class="panel-section-head">
          <span>Navigation</span>
        </div>
        <div class="panel-nav-list">
          {#each secondaryItems as item (item.view)}
            <button
              class="panel-nav-item"
              class:active={currentPrimaryView === item.view}
              type="button"
              on:click={() => navTo(item.view)}
            >
              <span class="panel-nav-icon">
                <PixelIcon type={item.icon} size={16} />
              </span>
              <span class="panel-nav-copy">
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </span>
              {#if currentPrimaryView === item.view}
                <span class="panel-nav-state">Now</span>
              {/if}
            </button>
          {/each}
        </div>
      </section>

      {#if recentItemObjects.length > 0}
        <section class="panel-section compact">
          <div class="panel-section-head">
            <span>Recent</span>
          </div>
          <div class="panel-recent-list">
            {#each recentItemObjects as item (item.view)}
              <button class="recent-item" type="button" on:click={() => navTo(item.view)}>
                <span class="recent-item-label">{item.label}</span>
                <span class="recent-item-meta">{item.shortLabel}</span>
              </button>
            {/each}
          </div>
        </section>
      {/if}

      <div class="panel-footer">
        <div class="panel-status-card">
          <div class="panel-status-top">
            <ConnectionBadge />
            <span class="panel-status-chip" class:active={isAIActive}>{isAIActive ? "AI Active" : "Standby"}</span>
          </div>
          <p>{researchLine}</p>
        </div>

        <a
          class="panel-download"
          href={DOWNLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span class="panel-download-copy">
            <span class="panel-download-eyebrow">Browser</span>
            <strong>Download Hoot Browser</strong>
            <small>Open the dedicated browsing shell and keep research nearby.</small>
          </span>
          <span class="panel-download-arrow">↗</span>
        </a>

        <div class="wallet-card">
          <button class="wallet-trigger" type="button" on:click={handleWalletClick}>
            <span class="wallet-trigger-copy">
              <strong>{$wallet.connected ? $wallet.name : "Wallet"}</strong>
              <small>{walletSummary}</small>
            </span>
            <span class="wallet-trigger-caret" class:open={walletDropdownOpen}>⌄</span>
          </button>

          {#if walletDropdownOpen}
            <div class="wallet-dropdown">
              {#if $wallet.connected}
                <button class="wallet-dd-item danger" type="button" on:click={handleDisconnect}>
                  Disconnect wallet
                </button>
              {:else}
                {#each wallets as option (option.name)}
                  <button class="wallet-dd-item" type="button" on:click={() => selectWallet(option.name)}>
                    <span>{option.icon}</span>
                    <span>{option.name}</span>
                  </button>
                {/each}
              {/if}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </aside>

  <header class="mobile-nav">
    <button class="mobile-brand" type="button" on:click={() => navTo("home")}>
      <span class="mobile-brand-icon"><PixelOwl size={0.2} mood={owlMood} /></span>
      <span class="mobile-brand-copy">
        <strong>HOOT</strong>
        <small>{activeItem.label}</small>
      </span>
    </button>

    <div class="mobile-actions">
      <ConnectionBadge />
      <button
        class="mobile-menu-toggle"
        class:open={mobileMenuOpen}
        type="button"
        aria-label="Open menu"
        on:click={() => (mobileMenuOpen = !mobileMenuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </header>

  {#if mobileMenuOpen}
    <button class="mobile-overlay" type="button" aria-label="Close menu" on:click={() => (mobileMenuOpen = false)}></button>
    <div class="mobile-drawer">
      <div class="mobile-drawer-head">
        <span class="mobile-drawer-kicker">Workspace</span>
        <h2>{activeItem.label}</h2>
        <p>{activeItem.detail}</p>
      </div>

      <button class="mobile-primary-action" type="button" on:click={() => navTo("studio")}>
        <span>+</span>
        <strong>{isAIActive ? "Open active research" : "Start new research"}</strong>
      </button>

      <nav class="mobile-nav-list">
        {#each visibleNavItems as item (item.view)}
          <button
            class="mobile-nav-item"
            class:active={currentPrimaryView === item.view}
            type="button"
            on:click={() => navTo(item.view)}
          >
            <span class="mobile-nav-icon"><PixelIcon type={item.icon} size={17} /></span>
            <span class="mobile-nav-copy">
              <strong>{item.label}</strong>
              <small>{item.detail}</small>
            </span>
          </button>
        {/each}
      </nav>

      <div class="mobile-footer-stack">
        <a class="mobile-download" href={DOWNLOAD_URL} target="_blank" rel="noopener noreferrer">
          Download Hoot Browser
        </a>

        <div class="mobile-wallet-block">
          <strong>{$wallet.connected ? $wallet.name : "Wallet"}</strong>
          <small>{walletSummary}</small>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .shell-nav {
    position: relative;
    z-index: var(--z-nav, 100);
    min-width: 0;
  }

  .desktop-nav {
    display: none;
  }

  .mobile-nav {
    position: sticky;
    top: 0;
    z-index: var(--z-nav, 100);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(192, 147, 113, 0.14);
    background: rgba(251, 245, 238, 0.92);
    backdrop-filter: blur(22px);
    box-shadow: 0 18px 40px rgba(104, 84, 64, 0.08);
  }

  .mobile-brand {
    appearance: none;
    border: 0;
    background: none;
    color: inherit;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0;
    min-width: 0;
    cursor: pointer;
  }

  .mobile-brand-icon {
    width: 36px;
    height: 36px;
    border-radius: 13px;
    display: grid;
    place-items: center;
    background: linear-gradient(180deg, rgba(255, 252, 247, 0.96), rgba(244, 234, 223, 0.96));
    border: 1px solid rgba(192, 147, 113, 0.16);
    box-shadow: 0 14px 30px rgba(104, 84, 64, 0.08);
  }

  .mobile-brand-copy {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
  }

  .mobile-brand-copy strong {
    font: 700 0.76rem/1 var(--font-display, "Oxanium", sans-serif);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-primary, #eef7ff);
  }

  .mobile-brand-copy small {
    font: 500 0.72rem/1.2 var(--font-body, "Space Grotesk", sans-serif);
    color: var(--text-muted, rgba(169, 193, 220, 0.54));
  }

  .mobile-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .mobile-menu-toggle {
    width: 40px;
    height: 40px;
    border-radius: 14px;
    border: 1px solid rgba(192, 147, 113, 0.16);
    background: rgba(255, 255, 255, 0.72);
    display: inline-flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 4px;
    cursor: pointer;
  }

  .mobile-menu-toggle span {
    width: 16px;
    height: 1.5px;
    border-radius: 999px;
    background: rgba(26, 36, 48, 0.9);
    transition: transform 180ms ease, opacity 180ms ease;
  }

  .mobile-menu-toggle.open span:nth-child(1) {
    transform: translateY(5.5px) rotate(45deg);
  }

  .mobile-menu-toggle.open span:nth-child(2) {
    opacity: 0;
  }

  .mobile-menu-toggle.open span:nth-child(3) {
    transform: translateY(-5.5px) rotate(-45deg);
  }

  .mobile-overlay {
    position: fixed;
    inset: 0;
    z-index: calc(var(--z-nav-overlay, 200) - 1);
    border: 0;
    background: rgba(78, 60, 41, 0.18);
    backdrop-filter: blur(12px);
  }

  .mobile-drawer {
    position: fixed;
    top: 72px;
    left: 12px;
    right: 12px;
    z-index: var(--z-nav-overlay, 200);
    border-radius: 24px;
    border: 1px solid rgba(192, 147, 113, 0.16);
    background:
      linear-gradient(180deg, rgba(255, 250, 244, 0.98), rgba(247, 239, 229, 0.98)),
      rgba(248, 240, 231, 0.96);
    box-shadow: 0 24px 80px rgba(104, 84, 64, 0.12);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .mobile-drawer-head h2,
  .mobile-drawer-head p {
    margin: 0;
  }

  .mobile-drawer-kicker {
    display: inline-flex;
    align-items: center;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(114, 246, 255, 0.1);
    color: var(--accent, #72f6ff);
    font: 700 0.62rem/1 var(--font-mono, "IBM Plex Mono", monospace);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .mobile-drawer-head h2 {
    font: 700 1.2rem/1.1 var(--font-display, "Oxanium", sans-serif);
    color: #18212b;
  }

  .mobile-drawer-head p {
    margin-top: 8px;
    font-size: 0.82rem;
    line-height: 1.5;
    color: var(--text-secondary, rgba(226, 240, 255, 0.78));
  }

  .mobile-primary-action {
    appearance: none;
    border: 0;
    border-radius: 18px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    background: linear-gradient(135deg, rgba(255, 179, 92, 0.22), rgba(114, 246, 255, 0.16));
    color: var(--text-primary, #eef7ff);
    font: 600 0.84rem/1.2 var(--font-body, "Space Grotesk", sans-serif);
    cursor: pointer;
  }

  .mobile-primary-action span {
    width: 26px;
    height: 26px;
    border-radius: 999px;
    display: inline-grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.62);
    font-size: 1rem;
  }

  .mobile-nav-list,
  .mobile-footer-stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .mobile-nav-item {
    appearance: none;
    border: 1px solid transparent;
    border-radius: 18px;
    padding: 14px;
    background: rgba(255, 255, 255, 0.62);
    color: inherit;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    cursor: pointer;
    text-align: left;
  }

  .mobile-nav-item.active {
    border-color: rgba(238, 136, 95, 0.22);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(250, 237, 231, 0.94));
  }

  .mobile-nav-icon {
    width: 34px;
    height: 34px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: rgba(24, 33, 44, 0.08);
    color: #18212b;
    flex-shrink: 0;
  }

  .mobile-nav-copy {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .mobile-nav-copy strong {
    font-size: 0.86rem;
    color: var(--text-primary, #eef7ff);
  }

  .mobile-nav-copy small {
    font-size: 0.74rem;
    line-height: 1.45;
    color: var(--text-muted, rgba(169, 193, 220, 0.54));
  }

  .mobile-download,
  .mobile-wallet-block {
    border-radius: 18px;
    border: 1px solid rgba(192, 147, 113, 0.14);
    background: rgba(255, 255, 255, 0.68);
    padding: 14px 16px;
  }

  .mobile-download {
    text-decoration: none;
    color: var(--text-primary, #eef7ff);
    font-weight: 600;
  }

  .mobile-wallet-block {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .mobile-wallet-block strong {
    font-size: 0.82rem;
    color: var(--text-primary, #eef7ff);
  }

  .mobile-wallet-block small {
    font-size: 0.72rem;
    line-height: 1.4;
    color: var(--text-muted, rgba(169, 193, 220, 0.54));
  }

  @media (min-width: 981px) {
    .mobile-nav,
    .mobile-overlay,
    .mobile-drawer {
      display: none;
    }

    .desktop-nav {
      display: flex;
      align-items: stretch;
      gap: 14px;
      padding: 18px 0 18px 18px;
      height: 100vh;
      position: sticky;
      top: 0;
      width: fit-content;
    }

    .desktop-rail,
    .desktop-panel {
      backdrop-filter: blur(22px);
      box-shadow: 0 24px 80px rgba(104, 84, 64, 0.12);
    }

    .desktop-rail {
      width: 72px;
      border-radius: 28px;
      border: 1px solid rgba(192, 147, 113, 0.16);
      background:
        linear-gradient(180deg, rgba(255, 249, 242, 0.96), rgba(244, 235, 225, 0.96)),
        rgba(248, 240, 231, 0.94);
      padding: 14px 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .rail-brand,
    .rail-toggle,
    .rail-item,
    .rail-link,
    .rail-wallet {
      appearance: none;
      border: 0;
      text-decoration: none;
      color: inherit;
      cursor: pointer;
    }

    .rail-brand,
    .rail-toggle,
    .rail-item,
    .rail-link,
    .rail-wallet {
      width: 46px;
      height: 46px;
      border-radius: 16px;
      display: inline-grid;
      place-items: center;
      position: relative;
      background: rgba(255, 255, 255, 0.62);
      border: 1px solid rgba(192, 147, 113, 0.08);
      transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
    }

    .rail-brand:hover,
    .rail-toggle:hover,
    .rail-item:hover,
    .rail-link:hover,
    .rail-wallet:hover {
      transform: translateY(-1px);
      border-color: rgba(192, 147, 113, 0.18);
      background: rgba(255, 255, 255, 0.88);
    }

    .rail-brand {
      margin-bottom: 4px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(243, 233, 223, 0.96));
      border-color: rgba(192, 147, 113, 0.18);
    }

    .rail-toggle.open {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(250, 237, 231, 0.94));
      border-color: rgba(238, 136, 95, 0.2);
    }

    .rail-brand-icon {
      width: 28px;
      height: 28px;
      position: relative;
      display: grid;
      place-items: center;
    }

    .rail-brand-icon :global(.pixel-owl) {
      filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.24));
    }

    .rail-brand-pulse {
      position: absolute;
      inset: -3px;
      border-radius: 14px;
      border: 1px solid rgba(114, 246, 255, 0.44);
      animation: railPulse 1.8s ease-out infinite;
    }

    .rail-toggle {
      overflow: hidden;
    }

    .rail-toggle-lines {
      width: 18px;
      height: 14px;
      display: inline-flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: stretch;
    }

    .rail-toggle-lines span {
      display: block;
      height: 1.5px;
      border-radius: 999px;
      background: rgba(26, 36, 48, 0.86);
      transform-origin: center;
      transition: transform 180ms ease, opacity 180ms ease, width 180ms ease;
    }

    .rail-toggle-lines span:nth-child(2) {
      width: 78%;
      align-self: center;
    }

    .rail-toggle-lines span:nth-child(3) {
      width: 62%;
      align-self: flex-end;
    }

    .rail-toggle.open .rail-toggle-lines span:nth-child(1) {
      width: 100%;
    }

    .rail-toggle.open .rail-toggle-lines span:nth-child(2) {
      width: 100%;
    }

    .rail-toggle.open .rail-toggle-lines span:nth-child(3) {
      width: 100%;
      align-self: stretch;
    }

    .rail-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .rail-item,
    .rail-link {
      color: rgba(30, 40, 52, 0.76);
    }

    .rail-item.active {
      color: #12161d;
      background: linear-gradient(180deg, rgba(248, 244, 236, 0.98), rgba(230, 225, 216, 0.98));
      border-color: rgba(238, 136, 95, 0.22);
      box-shadow: 0 14px 24px rgba(104, 84, 64, 0.12);
    }

    .rail-live-dot {
      position: absolute;
      right: 8px;
      top: 8px;
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: var(--green, #73f7b4);
      box-shadow: 0 0 10px rgba(115, 247, 180, 0.58);
    }

    .rail-spacer {
      flex: 1;
    }

    .rail-wallet.connected {
      border-color: rgba(115, 247, 180, 0.22);
    }

    .rail-wallet-core {
      width: 18px;
      height: 18px;
      border-radius: 999px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(219, 223, 229, 0.94));
      box-shadow: inset 0 -6px 8px rgba(0, 0, 0, 0.12);
      position: relative;
    }

    .rail-wallet.connected .rail-wallet-core::after {
      content: "";
      position: absolute;
      right: -2px;
      bottom: -2px;
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: var(--green, #73f7b4);
      border: 2px solid rgba(244, 235, 225, 0.98);
    }

    .desktop-panel {
      width: 242px;
      border-radius: 30px;
      border: 1px solid rgba(192, 147, 113, 0.16);
      background:
        linear-gradient(180deg, rgba(247, 243, 236, 0.94), rgba(234, 228, 219, 0.92)),
        rgba(245, 240, 231, 0.92);
      color: #1b232c;
      padding: 20px 18px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      overflow: hidden;
      transition:
        width 220ms ease,
        opacity 180ms ease,
        transform 220ms ease,
        padding 220ms ease,
        margin 220ms ease;
    }

    .collapsed .desktop-panel {
      width: 0;
      opacity: 0;
      padding-left: 0;
      padding-right: 0;
      margin-left: -2px;
      transform: translateX(-8px);
      pointer-events: none;
    }

    .panel-top h1,
    .panel-top p,
    .panel-status-card p {
      margin: 0;
    }

    .panel-kicker {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font: 700 0.62rem/1 var(--font-mono, "IBM Plex Mono", monospace);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(73, 84, 94, 0.74);
    }

    .panel-kicker-dot {
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: #ee885f;
      box-shadow: 0 0 0 6px rgba(238, 136, 95, 0.12);
    }

    .panel-top h1 {
      margin-top: 10px;
      font: 700 1.48rem/1.02 var(--font-display, "Oxanium", sans-serif);
      letter-spacing: -0.01em;
      color: #101620;
    }

    .panel-top p,
    .panel-status-card p {
      margin-top: 8px;
      font-size: 0.78rem;
      line-height: 1.5;
      color: rgba(50, 58, 67, 0.72);
    }

    .panel-primary-action,
    .panel-nav-item,
    .recent-item,
    .wallet-trigger,
    .wallet-dd-item {
      appearance: none;
      width: 100%;
      border: 0;
      background: none;
      cursor: pointer;
      text-align: left;
      color: inherit;
      padding: 0;
    }

    .panel-primary-action {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      border-radius: 22px;
      padding: 16px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(249, 236, 226, 0.94));
      color: #18212b;
      box-shadow: 0 18px 32px rgba(104, 84, 64, 0.1);
    }

    .panel-primary-mark {
      width: 28px;
      height: 28px;
      border-radius: 999px;
      display: inline-grid;
      place-items: center;
      background: rgba(238, 136, 95, 0.14);
      font-size: 1rem;
      flex-shrink: 0;
    }

    .panel-primary-copy {
      display: flex;
      flex-direction: column;
      gap: 5px;
      min-width: 0;
    }

    .panel-primary-copy strong {
      font-size: 0.88rem;
    }

    .panel-primary-copy small {
      font-size: 0.72rem;
      line-height: 1.5;
      color: rgba(24, 33, 43, 0.72);
    }

    .panel-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .panel-section.compact {
      gap: 8px;
    }

    .panel-section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font: 700 0.62rem/1 var(--font-mono, "IBM Plex Mono", monospace);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(73, 84, 94, 0.7);
    }

    .panel-nav-list,
    .panel-recent-list,
    .panel-footer {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .panel-nav-item,
    .recent-item,
    .wallet-trigger {
      border-radius: 18px;
      border: 1px solid rgba(23, 31, 41, 0.08);
      background: rgba(255, 255, 255, 0.72);
      padding: 12px 13px;
      transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
    }

    .panel-nav-item:hover,
    .recent-item:hover,
    .wallet-trigger:hover {
      transform: translateY(-1px);
      border-color: rgba(23, 31, 41, 0.12);
      box-shadow: 0 14px 24px rgba(30, 35, 40, 0.08);
    }

    .panel-nav-item {
      display: flex;
      align-items: flex-start;
      gap: 11px;
    }

    .panel-nav-item.active {
      border-color: rgba(238, 136, 95, 0.24);
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(250, 237, 231, 0.92));
    }

    .panel-nav-icon {
      width: 34px;
      height: 34px;
      flex-shrink: 0;
      border-radius: 12px;
      display: grid;
      place-items: center;
      background: rgba(18, 24, 33, 0.08);
      color: #1f2830;
    }

    .panel-nav-copy {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .panel-nav-copy strong {
      font-size: 0.82rem;
      color: #151d24;
    }

    .panel-nav-copy small {
      font-size: 0.7rem;
      line-height: 1.45;
      color: rgba(50, 58, 67, 0.68);
    }

    .panel-nav-state {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      align-self: center;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(238, 136, 95, 0.14);
      color: #b85a3e;
      font: 700 0.58rem/1 var(--font-mono, "IBM Plex Mono", monospace);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .recent-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .recent-item-label {
      font-size: 0.78rem;
      color: #151d24;
    }

    .recent-item-meta {
      font-size: 0.66rem;
      color: rgba(73, 84, 94, 0.72);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .panel-status-card,
    .panel-download,
    .wallet-card {
      border-radius: 18px;
      border: 1px solid rgba(23, 31, 41, 0.08);
      background: rgba(255, 255, 255, 0.72);
      padding: 14px;
    }

    .panel-status-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 10px;
    }

    .panel-status-chip {
      display: inline-flex;
      align-items: center;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(20, 27, 37, 0.06);
      color: rgba(50, 58, 67, 0.72);
      font: 700 0.56rem/1 var(--font-mono, "IBM Plex Mono", monospace);
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .panel-status-chip.active {
      background: rgba(114, 246, 255, 0.14);
      color: #0f6f77;
    }

    .panel-download {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      text-decoration: none;
      color: inherit;
    }

    .panel-download-copy {
      display: flex;
      flex-direction: column;
      gap: 5px;
      min-width: 0;
    }

    .panel-download-eyebrow {
      font: 700 0.58rem/1 var(--font-mono, "IBM Plex Mono", monospace);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(73, 84, 94, 0.72);
    }

    .panel-download strong {
      font-size: 0.82rem;
      color: #151d24;
    }

    .panel-download small {
      font-size: 0.7rem;
      line-height: 1.45;
      color: rgba(50, 58, 67, 0.68);
    }

    .panel-download-arrow {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border-radius: 999px;
      display: inline-grid;
      place-items: center;
      background: rgba(18, 24, 33, 0.08);
      color: #1f2830;
    }

    .wallet-card {
      position: relative;
    }

    .wallet-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: transparent;
      border: 0;
      padding: 0;
      box-shadow: none;
      transform: none;
    }

    .wallet-trigger-copy {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      flex: 1;
    }

    .wallet-trigger-copy strong {
      font-size: 0.8rem;
      color: #151d24;
    }

    .wallet-trigger-copy small {
      font-size: 0.68rem;
      line-height: 1.45;
      color: rgba(50, 58, 67, 0.68);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .wallet-trigger-caret {
      font-size: 1rem;
      color: rgba(50, 58, 67, 0.56);
      transition: transform 180ms ease;
    }

    .wallet-trigger-caret.open {
      transform: rotate(180deg);
    }

    .wallet-dropdown {
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .wallet-dd-item {
      display: flex;
      align-items: center;
      gap: 10px;
      border-radius: 14px;
      border: 1px solid rgba(23, 31, 41, 0.08);
      background: rgba(255, 255, 255, 0.72);
      padding: 10px 12px;
      font-size: 0.74rem;
      color: #151d24;
    }

    .wallet-dd-item.danger {
      color: #b54848;
    }
  }

  @keyframes railPulse {
    0% {
      transform: scale(0.84);
      opacity: 0.58;
    }
    100% {
      transform: scale(1.26);
      opacity: 0;
    }
  }
</style>
