<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let revealed = false;
  export let statsVisible = false;
  export let displayNodes = 0;
  export let displayGpu = 0;
  export let displayWorkers = 0;
  export let displayJobs = 0;
  export let displayFindings = 0;
  export let tickerEvents: string[] = [];

  const dispatch = createEventDispatcher<{ viewNetwork: void }>();
</script>

<section class="net">
  <div class="net-bar" class:revealed>
    <div class="net-live">
      <span class="live-dot"></span>
      <span class="live-label">Network Live</span>
    </div>
    <div class="net-nums">
      <div class="nn"><span class="nv">{(statsVisible ? displayNodes : 0).toLocaleString()}</span><span class="nk">Nodes</span></div>
      <div class="nn"><span class="nv">{statsVisible ? displayGpu : 0}x</span><span class="nk">GPU</span></div>
      <div class="nn"><span class="nv">{statsVisible ? displayWorkers : 0}</span><span class="nk">Workers</span></div>
      <div class="nn"><span class="nv">{statsVisible ? displayJobs : 0}</span><span class="nk">Jobs</span></div>
      <div class="nn hi"><span class="nv">{statsVisible ? displayFindings : 0}</span><span class="nk">Findings</span></div>
    </div>
    <button class="ghost-btn" on:click={() => dispatch('viewNetwork')}>View Network →</button>
  </div>
  <div class="ticker" class:revealed>
    <div class="ticker-track">
      {#each [...tickerEvents, ...tickerEvents] as evt}
        <span class="ticker-item">
          <span class="td" class:training={evt.includes('training')} class:evaluating={evt.includes('evaluating')} class:keep={evt.includes('keep')} class:discard={evt.includes('discard')} class:online={evt.includes('online')}></span>
          {evt}
        </span>
      {/each}
    </div>
  </div>
</section>

<style>
  .net { max-width: 960px; margin: 0 auto; padding: 0 40px 48px; }
  .net-bar {
    display: flex; align-items: center; gap: 20px;
    padding: 16px 24px;
    background: var(--surface, #fff);
    border: 1px solid var(--border, #E5E0DA);
    border-radius: 14px;
    opacity: 0; transform: translateY(12px);
    transition: opacity 600ms cubic-bezier(0.16,1,0.3,1),
                transform 600ms cubic-bezier(0.16,1,0.3,1),
                box-shadow 200ms;
  }
  .net-bar.revealed { opacity: 1; transform: translateY(0); }
  .net-bar:hover { box-shadow: var(--shadow-md); }
  .net-live { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .live-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--green, #27864a);
    box-shadow: 0 0 8px rgba(39,134,74,0.5);
    animation: pulse 2.5s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
  .live-label {
    font-size: 0.64rem; font-weight: 700; color: var(--green);
    text-transform: uppercase; font-family: var(--font-mono); letter-spacing: 0.08em;
  }
  .net-nums { display: flex; align-items: center; gap: 16px; flex: 1; overflow-x: auto; }
  .nn { display: flex; flex-direction: column; gap: 1px; white-space: nowrap; }
  .nv {
    font-size: 1.1rem; font-weight: 700; color: var(--text-primary);
    font-family: var(--font-mono); font-variant-numeric: tabular-nums; line-height: 1.2;
  }
  .nn.hi .nv { color: var(--green, #27864a); }
  .nk {
    font-size: 0.54rem; font-weight: 500; color: var(--text-muted);
    text-transform: uppercase; font-family: var(--font-mono); letter-spacing: 0.06em;
  }
  .ghost-btn {
    appearance: none; border: 1px solid var(--border, #E5E0DA);
    background: var(--surface, #fff); padding: 8px 16px; border-radius: 100px;
    font-size: 0.7rem; font-weight: 600;
    color: var(--text-secondary, #6b6560); cursor: pointer;
    flex-shrink: 0; white-space: nowrap; transition: all 200ms;
  }
  .ghost-btn:hover { border-color: var(--accent); color: var(--accent); }
  .ticker {
    margin-top: 8px; padding: 9px 0; overflow: hidden;
    border-radius: 10px; background: var(--surface, #fff);
    border: 1px solid var(--border-subtle, #EDEAE5);
    position: relative;
    opacity: 0; transform: translateY(8px);
    transition: opacity 500ms cubic-bezier(0.16,1,0.3,1) 200ms,
                transform 500ms cubic-bezier(0.16,1,0.3,1) 200ms;
  }
  .ticker.revealed { opacity: 1; transform: translateY(0); }
  .ticker::before, .ticker::after {
    content: ''; position: absolute; top: 0; bottom: 0; width: 40px; z-index: 1; pointer-events: none;
  }
  .ticker::before { left: 0; background: linear-gradient(to right, var(--surface, #fff), transparent); }
  .ticker::after { right: 0; background: linear-gradient(to left, var(--surface, #fff), transparent); }
  .ticker-track {
    display: flex; gap: 32px; white-space: nowrap;
    animation: tickerScroll 24s linear infinite; width: max-content;
  }
  .ticker-item {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 0.66rem; font-family: var(--font-mono); color: var(--text-muted, #9a9590);
  }
  .td {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--accent); animation: breathe 2s ease-in-out infinite;
  }
  .td.training { background: var(--accent); }
  .td.evaluating { background: var(--gold, #b7860e); }
  .td.keep { background: var(--green); }
  .td.discard { background: var(--red, #c0392b); }
  .td.online { background: rgba(80,170,255,0.8); }

  @media (max-width: 860px) {
    .net { padding: 0 24px 40px; }
    .net-bar { flex-wrap: wrap; gap: 12px; }
    .ghost-btn { width: 100%; text-align: center; justify-content: center; display: flex; }
  }
  @media (max-width: 600px) {
    .net { padding: 0 16px 32px; }
    .net-bar { flex-direction: column; gap: 10px; padding: 12px; }
    .net-live { justify-content: center; }
    .net-nums { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; overflow-x: visible; }
    .nn { align-items: center; text-align: center; }
    .nv { font-size: 0.95rem; }
    .nk { font-size: 0.5rem; }
    .ticker-track { animation-duration: 20s; }
  }
  @media (max-width: 400px) {
    .net-nums { grid-template-columns: repeat(2, 1fr); }
    .nv { font-size: 0.85rem; }
  }
</style>
