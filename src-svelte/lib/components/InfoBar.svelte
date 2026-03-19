<script lang="ts">
  /**
   * InfoBar — Global status strip below NavBar.
   * Self-contained: reads from stores directly (no props needed).
   * Shows: Network status (nodes, GPU, CPU, MEM, VRAM, active/idle) + Protocol (TVL, Burned, Bonds, Trust, MAU)
   */
  import { dashboardStore } from '../stores/dashboardStore.ts';
  import { wallet } from '../stores/walletStore.ts';

  // Network metrics
  $: nodes = $dashboardStore.networkSummary?.nodes ?? 8;
  $: gpuCount = $dashboardStore.networkSummary?.gpuCount ?? 4;
  $: activeWorkers = $dashboardStore.networkSummary?.activeWorkers ?? 4;
  $: idleWorkers = $dashboardStore.networkSummary?.idleWorkers ?? 4;
  $: cpuPct = $dashboardStore.liveSystem?.cpuUsage ?? 42;
  $: memUsed = $dashboardStore.liveSystem?.memUsedGb ?? 24;
  $: memTotal = $dashboardStore.liveSystem?.memTotalGb ?? 128;
  $: vramUsed = $dashboardStore.liveSystem?.vramUsedGb ?? 32;
  $: vramTotal = $dashboardStore.liveSystem?.vramTotalGb ?? 96;
  $: memLabel = `${memUsed}/${memTotal}G`;
  $: vramLabel = `${vramUsed}/${vramTotal}G`;

  // Protocol metrics
  $: tvl = $dashboardStore.protocolSummary?.tvl ?? '$12.4M';
  $: burned = $dashboardStore.protocolSummary?.burned ?? '847K';
  $: bonds = $dashboardStore.protocolSummary?.bonds ?? '2,341';
  $: trustScore = $dashboardStore.protocolSummary?.trustScore ?? 847;
  $: mauPercent = $dashboardStore.protocolSummary?.mauPercent ?? 62;

  // Wallet-based HOOT balance
  $: hootBalance = $wallet.connected ? ($wallet.balance ?? '—') : null;
</script>

<div class="ib">
  <!-- Network section -->
  <div class="ib-section ib-section--network">
    <span class="ib-dot"></span>
    <span class="ib-live">Online</span>
    <div class="ib-cell">
      <span class="ib-val">{nodes}</span>
      <span class="ib-key">Nodes</span>
    </div>
    <div class="ib-cell">
      <span class="ib-val">{activeWorkers}</span>
      <span class="ib-key">Active</span>
    </div>
    <div class="ib-cell">
      <span class="ib-val">{idleWorkers}</span>
      <span class="ib-key">Idle</span>
    </div>
  </div>

  <span class="ib-divider"></span>

  <!-- Protocol section -->
  <div class="ib-section ib-section--protocol">
    <div class="ib-cell">
      <span class="ib-val ib-accent">{tvl}</span>
      <span class="ib-key">TVL</span>
    </div>
    <div class="ib-cell">
      <span class="ib-val ib-red">{burned}</span>
      <span class="ib-key">Burned</span>
    </div>
    <div class="ib-cell">
      <span class="ib-val">{bonds}</span>
      <span class="ib-key">Bonds</span>
    </div>
    <div class="ib-cell">
      <span class="ib-val ib-green">{trustScore}</span>
      <span class="ib-key">Trust</span>
    </div>
  </div>

  {#if hootBalance}
    <span class="ib-divider"></span>
    <div class="ib-section ib-section--balance">
      <div class="ib-cell">
        <span class="ib-val ib-gold">{hootBalance}</span>
        <span class="ib-key">HOOT</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .ib {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 18px;
    margin: 18px 0 16px;
    border-radius: 24px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(247, 239, 229, 0.92)),
      rgba(248, 240, 231, 0.84);
    border: 1px solid rgba(192, 147, 113, 0.14);
    min-height: 52px;
    overflow-x: auto;
    overflow-y: hidden;
    flex-shrink: 0;
    z-index: var(--z-infobar, 90);
    backdrop-filter: blur(18px);
    box-shadow: 0 18px 48px rgba(104, 84, 64, 0.08);
  }

  .ib-section {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  .ib-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--green, #27864a);
    box-shadow: 0 0 6px rgba(39, 134, 74, 0.5);
    animation: ibPulse 2.5s ease-in-out infinite;
    flex-shrink: 0;
  }
  @keyframes ibPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .ib-live {
    font-family: var(--font-mono, "JetBrains Mono", monospace);
    font-size: 0.6rem;
    font-weight: 700;
    color: var(--green, #73f7b4);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    flex-shrink: 0;
  }

  .ib-cell {
    display: flex;
    align-items: baseline;
    gap: 3px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .ib-val {
    font-family: var(--font-mono, "JetBrains Mono", monospace);
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-primary, #eef7ff);
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }
  .ib-val.ib-accent { color: var(--accent, #72f6ff); }
  .ib-val.ib-red { color: var(--red, #ff7a7a); }
  .ib-val.ib-green { color: var(--green, #73f7b4); }
  .ib-val.ib-gold { color: var(--gold, #ffd66e); }

  .ib-key {
    font-family: var(--font-mono, "JetBrains Mono", monospace);
    font-size: 0.54rem;
    font-weight: 600;
    color: var(--text-muted, rgba(169, 193, 220, 0.54));
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .ib-divider {
    width: 1px;
    height: 18px;
    border-radius: 1px;
    background: rgba(192, 147, 113, 0.14);
    flex-shrink: 0;
  }

  /* ── Responsive ── */
  @media (max-width: 980px) {
    .ib {
      margin: 10px 12px 12px;
      border-radius: 20px;
    }
  }

  @media (max-width: 860px) {
    .ib {
      gap: 8px;
      padding: 10px 12px;
    }
    .ib-section { gap: 8px; }
  }

  @media (max-width: 600px) {
    .ib {
      gap: 8px;
      padding: 10px 12px;
      margin: 6px 12px 10px;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .ib::-webkit-scrollbar { display: none; }
    .ib-divider { display: none; }
  }
</style>
