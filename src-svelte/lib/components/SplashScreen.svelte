<script lang="ts">
  import { onMount } from 'svelte';
  import PixelOwl from './PixelOwl.svelte';

  export let onDone: () => void = () => {};

  let phase: 'enter' | 'show' | 'exit' = 'enter';

  onMount(() => {
    setTimeout(() => { phase = 'show'; }, 50);
    setTimeout(() => { phase = 'exit'; }, 550);
    setTimeout(() => { onDone(); }, 1000);
  });
</script>

<div class="splash" class:exit={phase === 'exit'}>
  <div class="splash-owl" class:entered={phase !== 'enter'}>
    <PixelOwl size={1.6} mood="celebrate" />
  </div>
</div>

<style>
  .splash {
    position: fixed;
    inset: 0;
    z-index: var(--z-splash, 9999);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    transition: opacity 0.5s ease;
    background:
      radial-gradient(circle at center, rgba(114, 246, 255, 0.12), transparent 34%),
      linear-gradient(180deg, rgba(4, 10, 18, 0.84), rgba(2, 6, 12, 0.96));
    backdrop-filter: blur(12px);
  }
  .splash.exit {
    opacity: 0;
  }

  .splash-owl {
    opacity: 0;
    transform: translateY(12px) scale(0.9);
    transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    filter: drop-shadow(0 0 22px rgba(114, 246, 255, 0.18));
  }
  .splash-owl.entered {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
</style>
