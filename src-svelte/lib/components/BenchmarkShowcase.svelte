<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let revealed = false;

  const dispatch = createEventDispatcher<{ viewBenchmark: void }>();
</script>

<section class="featured" class:revealed>
  <div class="feat-card">
    <span class="feat-kicker">PROVEN RESULTS</span>
    <h2 class="feat-h2">Autoresearch matched hand-built<br/>model performance — autonomously.</h2>
    <div class="feat-nums">
      <div class="feat-n">
        <span class="feat-v accent">0.9851</span>
        <span class="feat-d green">+3.7% vs baseline</span>
        <span class="feat-l">Balanced Accuracy</span>
      </div>
      <div class="feat-n">
        <span class="feat-v green">FN = 0</span>
        <span class="feat-d green">-100% (11 → 0)</span>
        <span class="feat-l">False Negatives</span>
      </div>
      <div class="feat-n">
        <span class="feat-v">5,000+</span>
        <span class="feat-d">autonomous</span>
        <span class="feat-l">Configs Explored</span>
      </div>
    </div>
    <div class="feat-bars">
      <div class="bar-row">
        <span class="bar-name">Rule-based Pipeline</span>
        <div class="bar-track"><div class="bar-fill base" style="width:95%"></div></div>
        <span class="bar-v">0.9499</span>
      </div>
      <div class="bar-row">
        <span class="bar-name">ML Ensemble (Ours)</span>
        <div class="bar-track"><div class="bar-fill best" style="width:98.5%"></div></div>
        <span class="bar-v hi">0.9851</span>
      </div>
    </div>
    <button class="feat-btn" on:click={() => dispatch('viewBenchmark')}>
      View full benchmark →
    </button>
  </div>
</section>

<style>
  .featured {
    max-width: 960px; margin: 0 auto; padding: 0 40px 64px;
    opacity: 0; transform: translateY(24px);
    transition: opacity 700ms cubic-bezier(0.16,1,0.3,1), transform 700ms cubic-bezier(0.16,1,0.3,1);
  }
  .featured.revealed { opacity: 1; transform: translateY(0); }
  .feat-card {
    background: linear-gradient(135deg, #3D2B22, #2A1E18);
    border-radius: 20px; padding: 56px 48px;
    color: #fff; border: 1px solid rgba(217, 119, 87, 0.15);
  }
  .feat-kicker {
    display: block; font-family: var(--font-mono);
    font-size: 0.56rem; font-weight: 700; letter-spacing: 0.14em;
    color: rgba(255,255,255,0.4); margin-bottom: 16px;
  }
  .feat-h2 {
    font-family: var(--font-display);
    font-size: 1.6rem; font-weight: 600; line-height: 1.4;
    color: #fff; margin: 0 0 40px;
  }
  .feat-nums {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 1px; margin-bottom: 36px;
  }
  .feat-n {
    display: flex; flex-direction: column; gap: 6px;
    padding: 20px 0; border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .feat-v {
    font-size: 2rem; font-weight: 700; font-family: var(--font-mono);
    line-height: 1; letter-spacing: -0.02em; color: #fff;
  }
  .feat-v.accent { color: var(--accent, #D97757); }
  .feat-v.green { color: #4ade80; }
  .feat-d { font-size: 0.6rem; font-weight: 600; font-family: var(--font-mono); color: rgba(255,255,255,0.35); }
  .feat-d.green { color: #4ade80; }
  .feat-l { font-size: 0.54rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.3); font-family: var(--font-mono); }
  .feat-bars { display: flex; flex-direction: column; gap: 10px; margin-bottom: 32px; }
  .bar-row { display: flex; align-items: center; gap: 14px; }
  .bar-name { width: 160px; text-align: right; font-size: 0.72rem; font-weight: 600; color: rgba(255,255,255,0.4); font-family: var(--font-mono); flex-shrink: 0; }
  .bar-track { flex: 1; height: 10px; background: rgba(255,255,255,0.06); border-radius: 5px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 5px; transition: width 1.4s cubic-bezier(0.16,1,0.3,1); }
  .bar-fill.base { background: rgba(255,255,255,0.2); }
  .bar-fill.best { background: linear-gradient(90deg, var(--accent, #D97757), #4ade80); }
  .bar-v { width: 52px; font-size: 0.78rem; font-weight: 700; font-family: var(--font-mono); color: rgba(255,255,255,0.5); flex-shrink: 0; }
  .bar-v.hi { color: var(--accent, #D97757); }
  .feat-btn {
    appearance: none; border: 1px solid rgba(255,255,255,0.15);
    background: none; padding: 10px 20px; border-radius: 100px;
    font-size: 0.72rem; font-weight: 600; color: rgba(255,255,255,0.7);
    cursor: pointer; transition: all 200ms;
  }
  .feat-btn:hover { border-color: rgba(255,255,255,0.4); color: #fff; }

  @media (max-width: 860px) {
    .featured { padding: 0 24px 48px; }
    .feat-card { padding: 40px 28px; }
    .feat-nums { grid-template-columns: 1fr; }
    .feat-h2 { font-size: 1.3rem; }
    .bar-name { width: 120px; font-size: 0.66rem; }
  }
  @media (max-width: 600px) {
    .featured { padding: 0 16px 40px; }
    .feat-card { padding: 32px 20px; border-radius: 16px; }
    .feat-v { font-size: 1.5rem; }
    .feat-h2 { font-size: 1.15rem; }
  }
  @media (max-width: 400px) {
    .feat-nums { grid-template-columns: 1fr; }
    .feat-v { font-size: 1.3rem; }
  }
</style>
