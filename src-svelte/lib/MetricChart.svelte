<script lang="ts">
  import { onMount } from "svelte";

  export let data: { x: number; y: number; status: string }[] = [];
  export let bestIndex: number = -1;
  export let width: number = 320;
  export let height: number = 120;

  const PAD = { top: 12, right: 12, bottom: 24, left: 44 };

  $: plotW = width - PAD.left - PAD.right;
  $: plotH = height - PAD.top - PAD.bottom;

  $: yVals = data.map(d => d.y);
  $: yMin = yVals.length ? Math.min(...yVals) - 0.01 : 0;
  $: yMax = yVals.length ? Math.max(...yVals) + 0.01 : 1;
  $: yRange = yMax - yMin || 1;

  $: xMin = data.length ? Math.min(...data.map(d => d.x)) : 0;
  $: xMax = data.length ? Math.max(...data.map(d => d.x)) : 1;
  $: xRange = xMax - xMin || 1;

  function sx(x: number): number { return PAD.left + ((x - xMin) / xRange) * plotW; }
  function sy(y: number): number { return PAD.top + plotH - ((y - yMin) / yRange) * plotH; }

  $: linePath = data.length > 1
    ? data.map((d, i) => `${i === 0 ? 'M' : 'L'}${sx(d.x).toFixed(1)},${sy(d.y).toFixed(1)}`).join(' ')
    : '';

  $: areaPath = data.length > 1
    ? linePath + ` L${sx(data[data.length - 1].x).toFixed(1)},${(PAD.top + plotH).toFixed(1)} L${sx(data[0].x).toFixed(1)},${(PAD.top + plotH).toFixed(1)} Z`
    : '';

  // Y-axis ticks
  $: yTicks = (() => {
    if (!data.length) return [];
    const count = 4;
    const step = yRange / count;
    return Array.from({ length: count + 1 }, (_, i) => {
      const val = yMin + step * i;
      return { val, y: sy(val) };
    });
  })();

  // Best point
  $: bestPoint = bestIndex >= 0 && bestIndex < data.length ? data[bestIndex] : null;

  // ---------- Animation state ----------
  let mounted = false;
  let lineLength = 0;
  let lineEl: SVGPathElement | undefined;

  onMount(() => {
    mounted = true;
  });

  // Measure the line path length whenever it changes
  $: if (lineEl && linePath) {
    lineLength = lineEl.getTotalLength();
  }
</script>

<div class="chart-container" class:mounted>
  <svg {width} {height} viewBox="0 0 {width} {height}" class="chart-svg">
    <!-- Gradient, glow & filter defs (placed first so refs resolve) -->
    <defs>
      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--accent, #D97757)" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="var(--accent, #D97757)" stop-opacity="0"/>
      </linearGradient>

      <!-- Drop-shadow glow on line -->
      <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="rgba(217,119,87,0.25)" />
      </filter>

      <!-- Brighter glow for best-point -->
      <filter id="best-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="rgba(39,134,74,0.55)" />
      </filter>
    </defs>

    <!-- Grid lines -->
    {#each yTicks as tick}
      <line
        x1={PAD.left}
        y1={tick.y}
        x2={width - PAD.right}
        y2={tick.y}
        stroke="var(--border-subtle, #EDEAE5)"
        stroke-width="0.5"
        stroke-dasharray="3,3"
      />
      <text
        x={PAD.left - 6}
        y={tick.y + 3}
        text-anchor="end"
        fill="var(--text-muted, #9a9590)"
        font-size="9"
        font-family="var(--font-mono, 'JetBrains Mono', monospace)"
      >{tick.val.toFixed(3)}</text>
    {/each}

    <!-- Area fill with fade-in -->
    {#if areaPath}
      <path
        class="area-path"
        d={areaPath}
        fill="url(#areaGrad)"
      />
    {/if}

    <!-- Line with draw animation + drop-shadow glow -->
    {#if linePath}
      <path
        bind:this={lineEl}
        class="line-path"
        d={linePath}
        fill="none"
        stroke="var(--accent, #D97757)"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        filter="url(#line-glow)"
        style="stroke-dasharray:{lineLength};stroke-dashoffset:{mounted ? 0 : lineLength}"
      />
    {/if}

    <!-- Data points with staggered opacity fade-in -->
    {#each data as d, i}
      <circle
        class="data-point"
        class:is-best={i === bestIndex}
        cx={sx(d.x)}
        cy={sy(d.y)}
        r={i === bestIndex ? 4 : 2}
        fill={d.status === 'keep' ? 'var(--green, #27864a)' : 'var(--red, #c0392b)'}
        stroke={i === bestIndex ? '#fff' : 'none'}
        stroke-width={i === bestIndex ? 1.5 : 0}
        filter={i === bestIndex ? 'url(#best-glow)' : undefined}
        style="transition-delay:{mounted ? (60 + i * 40) : 0}ms"
      />
    {/each}

    <!-- Best point pulse ring -->
    {#if bestPoint}
      <circle
        class="best-pulse"
        cx={sx(bestPoint.x)}
        cy={sy(bestPoint.y)}
        r="6"
        fill="none"
        stroke="var(--green, #27864a)"
        stroke-width="1.5"
      />
    {/if}

    <!-- Best point label -->
    {#if bestPoint}
      <text
        class="best-label"
        x={sx(bestPoint.x)}
        y={sy(bestPoint.y) - 10}
        text-anchor="middle"
        fill="var(--green, #27864a)"
        font-size="9"
        font-weight="700"
        font-family="var(--font-mono, 'JetBrains Mono', monospace)"
      >{bestPoint.y.toFixed(3)}</text>
    {/if}

    <!-- X-axis label -->
    <text
      x={width / 2}
      y={height - 2}
      text-anchor="middle"
      fill="var(--text-muted, #9a9590)"
      font-size="9"
      font-family="var(--font-mono, 'JetBrains Mono', monospace)"
    >experiment #</text>
  </svg>

  {#if data.length === 0}
    <div class="chart-empty">
      <span>Waiting for experiment results...</span>
    </div>
  {/if}
</div>

<style>
  .chart-container {
    position: relative;
    width: 100%;
    overflow: hidden;
  }

  .chart-svg {
    display: block;
    width: 100%;
    height: auto;
  }

  .chart-empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.72rem;
    color: var(--text-muted, #9a9590);
  }

  /* ─── Line draw animation ─── */
  .line-path {
    transition: stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* ─── Area fade-in ─── */
  .area-path {
    opacity: 0;
    transition: opacity 0.9s ease 0.4s;
  }
  .mounted .area-path {
    opacity: 0.3;
  }

  /* ─── Data point fade-in ─── */
  .data-point {
    opacity: 0;
    transition: opacity 0.35s ease;
  }
  .mounted .data-point {
    opacity: 1;
  }

  /* ─── Best point pulse ─── */
  .best-pulse {
    opacity: 0;
    transform-origin: center;
    transform-box: fill-box;
  }
  .mounted .best-pulse {
    animation: pulse-ring 2s ease-in-out 0.8s infinite;
  }

  @keyframes pulse-ring {
    0% {
      opacity: 0.7;
      r: 4;
    }
    50% {
      opacity: 0;
      r: 12;
    }
    100% {
      opacity: 0;
      r: 12;
    }
  }

  /* ─── Best point scale-glow ─── */
  .data-point.is-best {
    transform-origin: center;
    transform-box: fill-box;
  }
  .mounted .data-point.is-best {
    animation: best-scale 2.4s ease-in-out 1s infinite;
  }

  @keyframes best-scale {
    0%, 100% {
      transform: scale(1);
      filter: url(#best-glow);
    }
    50% {
      transform: scale(1.35);
      filter: url(#best-glow) drop-shadow(0 0 6px rgba(39, 134, 74, 0.55));
    }
  }

  /* ─── Best label fade ─── */
  .best-label {
    opacity: 0;
    transition: opacity 0.5s ease 1s;
  }
  .mounted .best-label {
    opacity: 1;
  }
</style>
