<script lang="ts">
  import PixelIcon from "./PixelIcon.svelte";
  export let revealed = false;
</script>

<section class="how" class:revealed>
  <span class="kicker">HOW IT WORKS</span>
  <h2 class="sec-h2">Three steps to a trained model</h2>
  <div class="steps">
    <div class="step">
      <div class="step-n">1</div>
      <h3>Describe your goal</h3>
      <p>Enter a research topic. An AI agent designs the ML pipeline, selects features, and configures the search space.</p>
    </div>
    <div class="step-arr">
      <PixelIcon type="arrow" size={20} />
    </div>
    <div class="step">
      <div class="step-n">2</div>
      <h3>Distributed training</h3>
      <p>A mesh of GPU nodes trains, evaluates, and evolves models in parallel — 12 experiments per hour per node.</p>
    </div>
    <div class="step-arr">
      <PixelIcon type="arrow" size={20} />
    </div>
    <div class="step">
      <div class="step-n">3</div>
      <h3>Collect your model</h3>
      <p>After hundreds of experiments, deploy the best model — or keep improving with more compute.</p>
    </div>
  </div>
</section>

<style>
  .how {
    max-width: 960px; margin: 0 auto; padding: 64px 40px;
    opacity: 0; transform: translateY(24px);
    transition: opacity 700ms cubic-bezier(0.16,1,0.3,1), transform 700ms cubic-bezier(0.16,1,0.3,1);
  }
  .how.revealed { opacity: 1; transform: translateY(0); }
  .kicker {
    display: block; text-align: center; font-family: var(--font-mono);
    font-size: 0.56rem; font-weight: 700; letter-spacing: 0.14em;
    color: var(--accent, #D97757); margin-bottom: 12px;
  }
  .sec-h2 {
    text-align: center; font-family: var(--font-display);
    font-size: 1.8rem; font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    margin: 0 0 48px; letter-spacing: -0.02em;
  }
  .steps { display: flex; align-items: flex-start; justify-content: center; }
  .step { flex: 1; max-width: 280px; padding: 0 24px; }
  .step h3 { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin: 0 0 8px; }
  .step p { font-size: 0.82rem; color: var(--text-secondary); margin: 0; line-height: 1.55; }
  .step-n {
    width: 32px; height: 32px; border-radius: 10px;
    background: var(--accent, #D97757); color: #fff;
    font-size: 0.72rem; font-weight: 700; font-family: var(--font-mono);
    display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
  }
  .step-arr {
    display: flex; align-items: center;
    color: var(--border, #E5E0DA); flex-shrink: 0; padding-top: 6px;
    animation: arrowDrift 1.8s ease-in-out infinite;
  }
  @keyframes arrowDrift { 0%,100% { transform: translateX(0); } 50% { transform: translateX(4px); } }

  @media (max-width: 860px) {
    .steps { flex-direction: column; align-items: center; }
    .step-arr { display: none; }
    .step { max-width: 100%; }
    .how { padding: 48px 24px; }
    .sec-h2 { font-size: 1.5rem; }
  }
  @media (max-width: 600px) {
    .how { padding: 40px 16px; }
    .sec-h2 { font-size: 1.3rem; margin-bottom: 28px; }
    .step { padding: 0 16px; }
    .step h3 { font-size: 0.88rem; }
    .step p { font-size: 0.78rem; }
  }
</style>
