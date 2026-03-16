<script lang="ts">
  /**
   * StudioStep1 — Research Type Selection + Topic Input
   *
   * Two sub-views:
   *   A) Preset card grid (5 research types) — Apple-grade design
   *   B) Type-specific topic input (after selecting a type)
   *
   * Events:
   *   back: void — go to IDLE / go back to type selection
   *   continue: { topic: string } — go to STEP2
   *   selectType: { type: ResearchTypeId } — type selected, show topic input
   */
  import { createEventDispatcher, onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { studioStore, studioTopic, studioResearchType } from '../../stores/studioStore.ts';
  import { RESEARCH_TYPES, LEVEL_LABELS, LEVEL_COLORS, type ResearchTypeId } from '../../data/researchTypes.ts';
  import PixelIcon from '../PixelIcon.svelte';

  const dispatch = createEventDispatcher<{
    back: void;
    continue: { topic: string };
    selectType: { type: ResearchTypeId };
  }>();

  /** Which sub-view: 'types' (card grid) or 'topic' (input) */
  let view: 'types' | 'topic' = $studioResearchType ? 'topic' : 'types';
  let selectedType: ResearchTypeId | null = $studioResearchType;
  let topic = $studioTopic || '';
  let inputEl: HTMLInputElement;

  $: typeData = selectedType ? RESEARCH_TYPES.find(t => t.id === selectedType) : null;

  function selectPreset(type: ResearchTypeId) {
    selectedType = type;
    studioStore.setResearchType(type);
    view = 'topic';
    dispatch('selectType', { type });
    setTimeout(() => inputEl?.focus(), 350);
  }

  function selectExample(ex: { label: string; topic: string }) {
    topic = ex.topic;
    inputEl?.focus();
  }

  function handleContinue() {
    if (!topic.trim()) return;
    studioStore.setTopic(topic.trim());
    dispatch('continue', { topic: topic.trim() });
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && topic.trim()) {
      handleContinue();
    }
  }

  function handleBack() {
    if (view === 'topic') {
      view = 'types';
      selectedType = null;
      return;
    }
    dispatch('back');
  }

  onMount(() => {
    if (view === 'topic') {
      inputEl?.focus();
    }
  });
</script>

<div class="step1">
  <div class="step1-header">
    <button class="back-btn" on:click={handleBack} aria-label="Back">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>{view === 'topic' ? 'Change Type' : 'Back'}</span>
    </button>
  </div>

  {#if view === 'types'}
    <!-- TYPE SELECTION GRID -->
    <div class="step1-body" in:fly={{ x: -24, duration: 400, delay: 60 }} out:fade={{ duration: 150 }}>
      <h2 class="step1-title">What would you like to create?</h2>
      <p class="step1-subtitle">Choose a research type to get started</p>

      <div class="type-grid">
        {#each RESEARCH_TYPES as rt, i (rt.id)}
          <button
            class="type-card"
            on:click={() => selectPreset(rt.id)}
            style:--card-accent={rt.accentColor}
            style:animation-delay="{i * 60}ms"
          >
            <div class="tc-icon-wrap">
              <PixelIcon type={rt.pixelIcon} size={20} />
            </div>
            <div class="tc-body">
              <div class="tc-top">
                <h3 class="tc-name">{rt.name}</h3>
                <div class="tc-meta">
                  <span class="tc-level" style:color={LEVEL_COLORS[rt.level]}>{LEVEL_LABELS[rt.level]}</span>
                  <span class="tc-sep"></span>
                  <span class="tc-time">{rt.time}</span>
                </div>
              </div>
              <p class="tc-desc">{rt.desc}</p>
              <div class="tc-tags">
                {#each rt.tags as tag}
                  <span class="tc-tag">{tag}</span>
                {/each}
              </div>
            </div>
            <div class="tc-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </button>
        {/each}
      </div>
    </div>

  {:else if view === 'topic' && typeData}
    <!-- TYPE-SPECIFIC TOPIC INPUT -->
    <div class="step1-body step1-topic-view" in:fly={{ x: 24, duration: 400, delay: 60 }} out:fade={{ duration: 150 }}>
      <div class="type-badge" style:--badge-color={typeData.accentColor}>
        <span class="tb-icon-wrap">
          <PixelIcon type={typeData.pixelIcon} size={14} />
        </span>
        <span class="tb-name">{typeData.name}</span>
      </div>

      <h2 class="step1-question">{typeData.step1Question}</h2>

      <div class="input-wrap">
        <input
          bind:this={inputEl}
          bind:value={topic}
          type="text"
          class="topic-input"
          class:has-value={topic.trim().length > 0}
          placeholder={typeData.step1Placeholder}
          on:keydown={handleKeydown}
        />
        <div class="input-glow"></div>
      </div>

      <div class="examples">
        <span class="examples-label">Try an example</span>
        <div class="example-chips">
          {#each typeData.step1Examples as ex, i}
            <button
              class="example-chip"
              class:active={topic === ex.topic}
              style:animation-delay="{i * 60}ms"
              on:click={() => selectExample(ex)}
            >
              {ex.label}
            </button>
          {/each}
        </div>
      </div>

      <div class="step1-footer">
        <button
          class="continue-btn"
          disabled={!topic.trim()}
          on:click={handleContinue}
        >
          <span>Continue</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .step1 {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
  }

  .step1-header {
    padding: 16px 28px 8px;
  }

  .back-btn {
    appearance: none;
    border: none;
    background: none;
    padding: 6px 10px 6px 6px;
    cursor: pointer;
    color: var(--text-muted, #9a9590);
    display: flex;
    align-items: center;
    gap: 6px;
    border-radius: 100px;
    font-size: 0.76rem;
    font-weight: 500;
    transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .back-btn:hover {
    color: var(--accent, #D97757);
    background: rgba(217, 119, 87, 0.06);
  }

  .step1-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28px;
    padding: 16px 32px 100px;
    max-width: 640px;
    margin: 0 auto;
    width: 100%;
  }

  .step1-topic-view {
    max-width: 520px;
    gap: 32px;
    padding-top: 40px;
  }

  /* ── Title ── */
  .step1-title {
    font-family: var(--font-display, 'Playfair Display', serif);
    font-size: 1.65rem;
    font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    margin: 0;
    text-align: center;
    line-height: 1.25;
    letter-spacing: -0.01em;
  }
  .step1-subtitle {
    margin: -18px 0 0;
    font-size: 0.86rem;
    color: var(--text-secondary, #6b6560);
    text-align: center;
    line-height: 1.4;
  }

  /* ═══ TYPE CARD GRID ═══ */
  .type-grid {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  @keyframes cardEntrance {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .type-card {
    appearance: none;
    border: 1px solid var(--border, #E5E0DA);
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    padding: 18px 20px;
    text-align: left;
    cursor: pointer;
    transition: all 280ms cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    align-items: flex-start;
    gap: 16px;
    position: relative;
    overflow: hidden;
    animation: cardEntrance 700ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
  }
  .type-card::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--card-accent, var(--accent));
    opacity: 0;
    transition: opacity 280ms;
  }
  .type-card:hover {
    border-color: color-mix(in srgb, var(--card-accent, var(--accent)) 40%, transparent);
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.04),
      0 1px 4px rgba(0, 0, 0, 0.02),
      0 0 0 1px color-mix(in srgb, var(--card-accent, var(--accent)) 8%, transparent);
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.88);
  }
  .type-card:hover::before {
    opacity: 1;
  }
  .type-card:active {
    transform: scale(0.995) translateY(0);
    transition-duration: 80ms;
  }

  .tc-icon-wrap {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--card-accent, var(--accent)) 10%, transparent);
    color: var(--card-accent, var(--accent));
    transition: all 280ms cubic-bezier(0.16, 1, 0.3, 1);
    animation: iconBreath 3s ease-in-out infinite;
  }
  @keyframes iconBreath {
    0%, 100% { box-shadow: 0 0 0 0 transparent; }
    50% { box-shadow: 0 0 12px color-mix(in srgb, var(--card-accent, var(--accent)) 15%, transparent); }
  }
  .type-card:hover .tc-icon-wrap {
    background: color-mix(in srgb, var(--card-accent, var(--accent)) 16%, transparent);
    transform: scale(1.05);
  }

  .tc-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .tc-top {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }
  .tc-name {
    margin: 0;
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    line-height: 1.3;
    letter-spacing: -0.005em;
  }
  .tc-desc {
    margin: 0;
    font-size: 0.74rem;
    color: var(--text-secondary, #6b6560);
    line-height: 1.45;
  }

  .tc-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.62rem;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    margin-left: auto;
    flex-shrink: 0;
  }
  .tc-level { font-weight: 600; letter-spacing: 0.02em; }
  .tc-sep {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--border, #E5E0DA);
  }
  .tc-time { color: var(--text-muted, #9a9590); }

  .tc-tags {
    display: flex;
    gap: 5px;
  }
  .tc-tag {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.56rem;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 100px;
    background: rgba(0, 0, 0, 0.035);
    color: var(--text-muted, #9a9590);
    letter-spacing: 0.02em;
  }

  .tc-arrow {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    color: var(--text-muted, #9a9590);
    transition: all 280ms cubic-bezier(0.16, 1, 0.3, 1);
    margin-top: 8px;
    opacity: 0.5;
  }
  .type-card:hover .tc-arrow {
    color: var(--card-accent, var(--accent));
    transform: translateX(4px);
    opacity: 1;
  }

  /* ═══ TYPE-SPECIFIC TOPIC VIEW ═══ */
  .type-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 16px 7px 8px;
    border-radius: 100px;
    background: color-mix(in srgb, var(--badge-color, var(--accent)) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--badge-color, var(--accent)) 18%, transparent);
    animation: cardEntrance 700ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
  }
  .tb-icon-wrap {
    width: 26px;
    height: 26px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--badge-color, var(--accent)) 14%, transparent);
    color: var(--badge-color, var(--accent));
  }
  .tb-name {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--badge-color, var(--accent));
    letter-spacing: 0.01em;
  }

  .step1-question {
    font-family: var(--font-display, 'Playfair Display', serif);
    font-size: 1.55rem;
    font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    margin: 0;
    text-align: center;
    line-height: 1.25;
    letter-spacing: -0.01em;
    animation: cardEntrance 700ms cubic-bezier(0.16, 1, 0.3, 1) 80ms backwards;
  }

  .input-wrap {
    width: 100%;
    position: relative;
    animation: cardEntrance 700ms cubic-bezier(0.16, 1, 0.3, 1) 140ms backwards;
  }
  .topic-input {
    width: 100%;
    padding: 18px 24px;
    border: 2px solid var(--border, #E5E0DA);
    border-radius: 16px;
    font-size: 1.05rem;
    color: var(--text-primary, #2D2D2D);
    background: rgba(255, 255, 255, 0.95);
    transition: all 280ms cubic-bezier(0.16, 1, 0.3, 1);
    text-align: center;
    letter-spacing: -0.005em;
  }
  .topic-input.has-value {
    border-color: var(--accent, #D97757);
  }
  .topic-input:focus {
    outline: none;
    border-color: var(--accent, #D97757);
    box-shadow: 0 0 0 4px rgba(217, 119, 87, 0.1), 0 4px 16px rgba(217, 119, 87, 0.06);
    background: rgba(255, 255, 255, 0.92);
  }
  .topic-input::placeholder {
    color: var(--text-muted, #9a9590);
  }
  .input-glow {
    position: absolute;
    inset: -1px;
    border-radius: 17px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 400ms;
    background: conic-gradient(from 0deg, transparent 0%, rgba(217, 119, 87, 0.08) 25%, transparent 50%, rgba(217, 119, 87, 0.05) 75%, transparent 100%);
    filter: blur(8px);
  }
  .topic-input:focus ~ .input-glow {
    opacity: 1;
  }

  .examples {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: 100%;
    animation: cardEntrance 700ms cubic-bezier(0.16, 1, 0.3, 1) 200ms backwards;
  }
  .examples-label {
    font-size: 0.7rem;
    color: var(--text-muted, #9a9590);
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .example-chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .example-chip {
    appearance: none;
    border: 1px solid var(--border, #E5E0DA);
    background: rgba(255, 255, 255, 0.95);
    padding: 8px 16px;
    border-radius: 100px;
    font-size: 0.76rem;
    font-weight: 500;
    color: var(--text-secondary, #6b6560);
    cursor: pointer;
    transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
    white-space: nowrap;
    animation: cardEntrance 600ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
  }
  .example-chip:hover {
    border-color: var(--accent, #D97757);
    color: var(--accent, #D97757);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(217, 119, 87, 0.08);
    background: rgba(255, 255, 255, 0.92);
  }
  .example-chip.active {
    border-color: var(--accent, #D97757);
    background: rgba(217, 119, 87, 0.06);
    color: var(--accent, #D97757);
    font-weight: 600;
    box-shadow: 0 0 0 2px rgba(217, 119, 87, 0.1);
  }

  .step1-footer {
    width: 100%;
    display: flex;
    justify-content: center;
    animation: cardEntrance 700ms cubic-bezier(0.16, 1, 0.3, 1) 280ms backwards;
  }
  .continue-btn {
    appearance: none;
    border: none;
    background: var(--accent, #D97757);
    color: #fff;
    padding: 14px 36px;
    border-radius: 100px;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 2px 12px rgba(217, 119, 87, 0.3), 0 1px 4px rgba(217, 119, 87, 0.15);
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
    overflow: hidden;
    letter-spacing: 0.01em;
  }
  .continue-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 48%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.25) 52%, transparent 60%);
    transform: translateX(-200%);
  }
  .continue-btn:hover:not(:disabled)::after {
    animation: shimmer 700ms ease-out;
  }
  @keyframes shimmer {
    from { transform: translateX(-200%); }
    to { transform: translateX(200%); }
  }
  .continue-btn:hover:not(:disabled) {
    background: var(--accent-hover, #C4644A);
    box-shadow: 0 6px 24px rgba(217, 119, 87, 0.35), 0 2px 8px rgba(217, 119, 87, 0.2);
    transform: translateY(-2px);
  }
  .continue-btn:active:not(:disabled) {
    transform: translateY(0);
    transition-duration: 80ms;
  }
  .continue-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .continue-btn svg {
    transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .continue-btn:hover:not(:disabled) svg {
    transform: translateX(3px);
  }

  @media (max-width: 640px) {
    .step1-body {
      padding: 12px 16px 80px;
      gap: 22px;
    }
    .step1-topic-view {
      padding-top: 24px;
      gap: 26px;
    }
    .step1-title { font-size: 1.35rem; }
    .step1-question { font-size: 1.3rem; }
    .topic-input { font-size: 0.95rem; padding: 14px 18px; }
    .example-chip { padding: 7px 14px; font-size: 0.72rem; }
    .tc-icon-wrap { width: 36px; height: 36px; border-radius: 10px; }
    .tc-name { font-size: 0.86rem; }
    .tc-desc { font-size: 0.7rem; }
    .type-card { padding: 14px 16px; gap: 12px; border-radius: 14px; }
    .continue-btn { padding: 12px 28px; }
  }
</style>
