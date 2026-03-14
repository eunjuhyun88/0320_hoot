<script lang="ts">
  export let label: string;
  export let active = false;
  export let disabled = false;
</script>

<button class:active class="btn" {disabled} on:click>
  {#if active}
    <span class="active-dot"></span>
  {/if}
  {label}
</button>

<style>
  .btn {
    appearance: none;
    border: 1px solid var(--border, #E5E0DA);
    background: transparent;
    color: var(--text-muted, #9a9590);
    border-radius: 100px;
    padding: 5px 12px;
    font: inherit;
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: all 150ms ease;
    -webkit-user-select: none;
    user-select: none;
  }

  .btn:hover:not(:disabled) {
    border-color: var(--text-secondary, #6b6560);
    color: var(--text-secondary, #6b6560);
  }

  .btn.active {
    background: rgba(217, 119, 87, 0.08);
    border-color: rgba(217, 119, 87, 0.3);
    color: var(--accent, #D97757);
  }

  .btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .active-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--accent, #D97757);
    box-shadow: 0 0 6px rgba(217, 119, 87, 0.4);
  }

  /* Dark theme override (for Globe view) */
  :global([data-theme="dark"]) .btn {
    border-color: rgba(255, 255, 255, 0.06);
    background: rgba(255, 255, 255, 0.04);
    color: rgba(255, 255, 255, 0.4);
  }

  :global([data-theme="dark"]) .btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.6);
  }

  :global([data-theme="dark"]) .btn.active {
    background: rgba(217, 119, 87, 0.12);
    border-color: rgba(217, 119, 87, 0.3);
    color: #E8D5C4;
  }

  :global([data-theme="dark"]) .active-dot {
    background: var(--accent, #D97757);
    box-shadow: 0 0 8px rgba(217, 119, 87, 0.5);
  }
</style>
