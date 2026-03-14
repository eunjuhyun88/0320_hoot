<script lang="ts">
  export let currentState: string;
  export let compact: boolean = false;

  const stages = [
    { key: "online",    label: "CON" },
    { key: "available", label: "AVL" },
    { key: "assigned",  label: "CLM" },
    { key: "training",  label: "EXE" },
    { key: "cooldown",  label: "SUB" },
    { key: "verified",  label: "VER" },
  ];

  const stateIndexMap: Record<string, number> = {
    online: 0,
    available: 1,
    assigned: 2,
    training: 3,
    cooldown: 4,
  };

  $: currentIndex = stateIndexMap[currentState] ?? 0;
</script>

<div class="pipeline" class:compact>
  {#each stages as stage, i}
    {@const isCompleted = i < currentIndex}
    {@const isCurrent = i === currentIndex}
    {@const isFuture = i > currentIndex}

    {#if i > 0}
      <svg class="line-seg" viewBox="0 0 24 4" preserveAspectRatio="none">
        {#if i <= currentIndex}
          <line x1="0" y1="2" x2="24" y2="2"
            stroke="#27864a"
            stroke-width="1.5"
          />
        {:else if i === currentIndex + 1}
          <line x1="0" y1="2" x2="24" y2="2"
            stroke="#D97757"
            stroke-width="1.5"
            stroke-dasharray="3 3"
            class="dash-animate"
          />
        {:else}
          <line x1="0" y1="2" x2="24" y2="2"
            stroke="#9a9590"
            stroke-width="1"
            stroke-dasharray="1.5 2.5"
            opacity="0.5"
          />
        {/if}
      </svg>
    {/if}

    <div class="stage" class:completed={isCompleted} class:current={isCurrent} class:future={isFuture}>
      <div class="dot"
        class:dot-completed={isCompleted}
        class:dot-current={isCurrent}
        class:dot-future={isFuture}
      ></div>
      {#if !compact}
        <span class="label"
          class:label-completed={isCompleted}
          class:label-current={isCurrent}
          class:label-future={isFuture}
        >{stage.label}</span>
      {/if}
    </div>
  {/each}
</div>

<style>
  .pipeline {
    display: flex;
    align-items: flex-start;
    gap: 0;
    padding: 4px 0;
  }

  .pipeline.compact {
    gap: 0;
  }

  .stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .pipeline.compact .stage {
    gap: 0;
  }

  /* ── Dots ── */
  .dot {
    border-radius: 50%;
    flex-shrink: 0;
    transition: all 200ms ease;
  }

  .dot-completed {
    width: 7px;
    height: 7px;
    background: #27864a;
  }

  .dot-current {
    width: 10px;
    height: 10px;
    background: #D97757;
    box-shadow: 0 0 0 0 rgba(217, 119, 87, 0.4);
    animation: state-pulse 2s ease-in-out infinite;
  }

  .dot-future {
    width: 7px;
    height: 7px;
    background: transparent;
    border: 1.5px solid #9a9590;
  }

  .pipeline.compact .dot-completed {
    width: 5px;
    height: 5px;
  }

  .pipeline.compact .dot-current {
    width: 7px;
    height: 7px;
  }

  .pipeline.compact .dot-future {
    width: 5px;
    height: 5px;
  }

  /* ── Labels ── */
  .label {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.5rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    line-height: 1;
    white-space: nowrap;
  }

  .label-completed {
    color: #27864a;
  }

  .label-current {
    color: #D97757;
  }

  .label-future {
    color: #9a9590;
  }

  /* ── Connector Lines (SVG) ── */
  .line-seg {
    width: 20px;
    height: 4px;
    flex-shrink: 0;
    align-self: center;
    margin-top: 0;
    overflow: visible;
  }

  /* offset for label push: center line with dots when labels are visible */
  .pipeline:not(.compact) .line-seg {
    margin-top: 0;
    /* align center to dot center: dot is at top of stage flex col */
    align-self: flex-start;
    margin-top: 3px;
  }

  .pipeline.compact .line-seg {
    width: 10px;
    align-self: center;
    margin-top: 0;
  }

  line.dash-animate {
    animation: dash-flow 0.6s linear infinite;
  }

  /* ── Keyframes ── */
  @keyframes state-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(217, 119, 87, 0.4); }
    50% { box-shadow: 0 0 0 6px rgba(217, 119, 87, 0); }
  }

  @keyframes dash-flow {
    to { stroke-dashoffset: -8; }
  }
</style>
