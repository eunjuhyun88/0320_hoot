<script lang="ts">
  import { router } from "../../stores/router.ts";
  import { agentStore, agentSheetOpen, agentLoading, agentInputFocused } from "../../stores/agentStore.ts";
  import { dashboardStore } from "../../stores/dashboardStore.ts";
  import { widgetStore, allWidgets } from "../../stores/widgetStore.ts";
  import { CATEGORY_COLORS, type WidgetId } from "../../data/widgetDefaults.ts";
  import PixelIcon from "../PixelIcon.svelte";
  import AgentSheet from "./AgentSheet.svelte";
  import type { AppView } from "../../stores/router.ts";

  let inputValue = '';
  let inputEl: HTMLInputElement;
  let widgetMenuOpen = false;

  // ── Hide input row on Studio page (page already has its own primary input) ──
  $: isStudioPage = $router === 'studio' || $router === 'dashboard';

  // ── Status items derived from dashboardStore ──
  $: statusItems = [
    {
      icon: 'research' as const,
      value: $dashboardStore.runningCount,
      label: 'running',
      color: 'var(--accent, #D97757)',
      view: 'studio' as AppView,
    },
    {
      icon: 'grid' as const,
      value: $dashboardStore.modelsSummary?.count ?? 0,
      label: 'models',
      color: '#2980b9',
      view: 'models' as AppView,
    },
    {
      icon: 'globe' as const,
      value: $dashboardStore.networkSummary?.nodes ?? 0,
      label: 'nodes',
      color: 'var(--green, #27864a)',
      view: 'network' as AppView,
    },
    {
      icon: 'protocol' as const,
      value: $dashboardStore.protocolSummary?.tvl ?? '$0',
      label: '',
      color: '#d4a017',
      view: 'protocol' as AppView,
    },
  ];

  // ── Send handler ──
  function handleSubmit() {
    if (!inputValue.trim()) return;
    agentStore.send(inputValue);
    inputValue = '';
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      if ($agentSheetOpen) {
        agentStore.closeSheet();
      } else {
        inputEl?.blur();
      }
    }
  }

  function handleStatusClick(view: AppView) {
    router.navigate(view);
  }

  // ── Widget menu (gear) ──
  function toggleWidgetMenu() {
    widgetMenuOpen = !widgetMenuOpen;
  }

  function toggleWidget(id: WidgetId) {
    widgetStore.toggleVisible(id);
  }

  function resetWidgets() {
    widgetStore.resetLayout($dashboardStore.isLoggedIn);
    widgetMenuOpen = false;
  }

  function handleWindowClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.agent-dock')) {
      widgetMenuOpen = false;
    }
  }

  function handleFocus() {
    agentStore.setInputFocused(true);
  }

  function handleBlur() {
    agentStore.setInputFocused(false);
  }
</script>

<svelte:window on:click={handleWindowClick} />

<!-- Agent Sheet (slides up above dock) -->
<AgentSheet />

<!-- Agent Dock (always at bottom) -->
<div class="agent-dock" class:sheet-open={$agentSheetOpen} class:focused={$agentInputFocused} class:compact={isStudioPage}>
  <!-- Row 1: Input bar (hidden on Studio — page has its own primary input) -->
  {#if !isStudioPage}
    <div class="dock-input-row">
      <span class="dock-owl">
        <PixelIcon type="sparkle" size={16} />
      </span>
      <input
        bind:this={inputEl}
        bind:value={inputValue}
        on:keydown={handleKeyDown}
        on:focus={handleFocus}
        on:blur={handleBlur}
        type="text"
        class="dock-input"
        placeholder="무엇이든 물어보세요..."
        autocomplete="off"
      />
      <button
        class="dock-send"
        class:dock-send-active={inputValue.trim().length > 0}
        on:click={handleSubmit}
        disabled={!inputValue.trim()}
        title="Send"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M2 14l12-6L2 2v4.8L10 8 2 9.2z" fill="currentColor"/>
        </svg>
      </button>
    </div>
  {/if}

  <!-- Row 2: Status icons -->
  <div class="dock-status-row">
    {#each statusItems as item}
      <button
        class="status-item"
        on:click={() => handleStatusClick(item.view)}
        title="{item.label} — click to navigate"
      >
        <span class="status-icon" style:color={item.color}>
          <PixelIcon type={item.icon} size={12} />
        </span>
        <span class="status-value" style:color={item.color}>{item.value}</span>
      </button>
    {/each}

    <!-- Separator + Gear -->
    <div class="dock-sep"></div>

    <div class="dock-gear-wrap">
      <button
        class="dock-gear"
        class:dock-gear-open={widgetMenuOpen}
        on:click|stopPropagation={toggleWidgetMenu}
        title="Toggle widgets"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" stroke-width="1.2"/>
          <path d="M6.7 1.5l-.4 1.3a5 5 0 00-1.5.9L3.5 3.2l-1.3 2.3 1 1a5 5 0 000 1.7l-1 1 1.3 2.3 1.3-.5a5 5 0 001.5.9l.4 1.3h2.6l.4-1.3a5 5 0 001.5-.9l1.3.5 1.3-2.3-1-1a5 5 0 000-1.7l1-1-1.3-2.3-1.3.5a5 5 0 00-1.5-.9L9.3 1.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
        </svg>
      </button>
      {#if widgetMenuOpen}
        <div class="widget-menu" role="presentation" on:click|stopPropagation>
          <div class="wm-header">
            <span class="wm-title">Widgets</span>
            <button type="button" class="wm-reset" on:click={resetWidgets}>Reset</button>
          </div>
          <div class="wm-list">
            {#each $allWidgets as w (w.id)}
              <button type="button" class="wm-item" class:wm-item-active={w.visible}
                on:click={() => toggleWidget(w.id)}>
                <span class="wm-dot" style:background={CATEGORY_COLORS[w.category]}></span>
                <span class="wm-name">{w.label}</span>
                <span class="wm-toggle">{w.visible ? '✓' : ''}</span>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* ═══ AGENT DOCK ═══ */
  .agent-dock {
    position: fixed;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    width: min(640px, calc(100vw - 24px));
    background: var(--glass-bg, rgba(255, 255, 255, 0.92));
    border: 1px solid var(--border, #E5E0DA);
    border-radius: 18px;
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.10), 0 0 0 1px rgba(0, 0, 0, 0.03);
    z-index: var(--z-splash, 9999);
    pointer-events: auto;
    padding: 8px 12px 6px;
    transition: box-shadow 200ms ease, border-color 200ms ease;
  }
  .agent-dock.focused {
    border-color: var(--accent, #D97757);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.10), 0 0 0 2px rgba(217, 119, 87, 0.2);
  }
  .agent-dock.sheet-open {
    border-radius: 0 0 18px 18px;
    border-top-color: var(--border-subtle, #EDEAE5);
  }

  /* ═══ INPUT ROW ═══ */
  .dock-input-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .dock-owl {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent, #D97757);
    flex-shrink: 0;
    width: 24px;
    height: 24px;
  }
  .dock-input {
    flex: 1;
    appearance: none;
    border: none;
    background: transparent;
    font-family: var(--font-body, 'Inter', sans-serif);
    font-size: 0.82rem;
    font-weight: 400;
    color: var(--text-primary, #2D2D2D);
    padding: 4px 0;
    outline: none;
    min-width: 0;
  }
  .dock-input::placeholder {
    color: var(--text-muted, #9a9590);
    font-weight: 400;
  }
  .dock-send {
    appearance: none;
    border: none;
    background: transparent;
    border-radius: 8px;
    padding: 5px;
    cursor: pointer;
    color: var(--text-muted, #9a9590);
    transition: all 140ms ease;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .dock-send:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.04);
  }
  .dock-send-active {
    color: var(--accent, #D97757);
  }
  .dock-send:disabled {
    cursor: default;
    opacity: 0.4;
  }

  /* ═══ COMPACT MODE (Studio — status only, no input) ═══ */
  .agent-dock.compact {
    padding: 4px 12px;
    border-radius: 14px;
  }

  /* ═══ STATUS ROW ═══ */
  .dock-status-row {
    display: flex;
    align-items: center;
    gap: 2px;
    padding-top: 4px;
    border-top: 1px solid var(--border-subtle, #EDEAE5);
    margin-top: 4px;
  }
  .compact .dock-status-row {
    padding-top: 0;
    border-top: none;
    margin-top: 0;
  }
  .status-item {
    appearance: none;
    border: none;
    background: transparent;
    border-radius: 6px;
    padding: 2px 8px;
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transition: background 100ms ease;
  }
  .status-item:hover {
    background: rgba(0, 0, 0, 0.04);
  }
  .status-icon {
    display: flex;
    align-items: center;
    line-height: 1;
  }
  .status-value {
    font-family: var(--font-mono, "JetBrains Mono", monospace);
    font-size: 0.52rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  /* ═══ SEPARATOR + GEAR ═══ */
  .dock-sep {
    width: 1px;
    height: 16px;
    background: var(--border-subtle, #EDEAE5);
    margin: 0 4px;
    flex-shrink: 0;
    margin-left: auto;
  }
  .dock-gear-wrap {
    position: relative;
  }
  .dock-gear {
    appearance: none;
    border: none;
    background: transparent;
    border-radius: 6px;
    padding: 4px;
    cursor: pointer;
    color: var(--text-muted, #9a9590);
    transition: all 140ms ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .dock-gear:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-primary, #2D2D2D);
  }
  .dock-gear-open {
    background: rgba(0, 0, 0, 0.06);
    color: var(--text-primary, #2D2D2D);
  }

  /* ═══ WIDGET MENU (popup above gear) ═══ */
  .widget-menu {
    position: absolute;
    bottom: calc(100% + 12px);
    right: -8px;
    min-width: 180px;
    background: var(--glass-bg, rgba(255, 255, 255, 0.97));
    border: 1px solid var(--border, #E5E0DA);
    border-radius: 12px;
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.02);
    overflow: hidden;
    z-index: 1;
    animation: panelUp 140ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes panelUp {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .wm-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px 6px;
    border-bottom: 1px solid var(--border-subtle, #EDEAE5);
  }
  .wm-title {
    font-family: var(--font-mono);
    font-size: 0.5rem;
    font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .wm-reset {
    appearance: none;
    border: none;
    background: transparent;
    font-family: var(--font-mono);
    font-size: 0.44rem;
    font-weight: 600;
    color: var(--accent, #D97757);
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    transition: background 100ms;
  }
  .wm-reset:hover {
    background: rgba(217, 119, 87, 0.08);
  }
  .wm-list {
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .wm-item {
    appearance: none;
    border: none;
    background: transparent;
    border-radius: 6px;
    padding: 6px 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: background 100ms;
    width: 100%;
    text-align: left;
  }
  .wm-item:hover {
    background: rgba(0, 0, 0, 0.03);
  }
  .wm-item-active {
    background: rgba(0, 0, 0, 0.02);
  }
  .wm-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .wm-item-active .wm-dot {
    box-shadow: 0 0 4px currentColor;
  }
  .wm-name {
    font-family: var(--font-mono);
    font-size: 0.52rem;
    font-weight: 500;
    color: var(--text-secondary, #6b6560);
    flex: 1;
  }
  .wm-item-active .wm-name {
    font-weight: 600;
    color: var(--text-primary, #2D2D2D);
  }
  .wm-toggle {
    font-size: 0.5rem;
    color: var(--green, #27864a);
    width: 14px;
    text-align: center;
  }

  /* ═══ RESPONSIVE ═══ */
  @media (max-width: 600px) {
    .agent-dock {
      bottom: calc(8px + env(safe-area-inset-bottom, 0px));
      width: calc(100vw - 14px);
      padding: 6px 8px 4px;
      border-radius: 14px;
    }
    .dock-input {
      font-size: 0.78rem;
    }
    .status-item {
      padding: 2px 4px;
    }
    .status-value {
      font-size: 0.44rem;
    }
  }
  @media (max-width: 420px) {
    .status-value {
      display: none;
    }
    .status-item {
      padding: 2px 3px;
    }
  }
</style>
