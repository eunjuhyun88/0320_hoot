<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { OntologyBranch, BranchTypeId, BranchTypeDefinition } from '../data/ontologyData.ts';

  export let def: BranchTypeDefinition;
  export let branch: OntologyBranch;
  export let expanded = false;

  const dispatch = createEventDispatcher<{
    toggle: BranchTypeId;
    expand: BranchTypeId;
    updateIters: { type: BranchTypeId; value: number };
    toggleModel: { branchType: BranchTypeId; modelId: string };
    toggleCategory: { branchType: BranchTypeId; catId: string };
    toggleArrayItem: { branchType: BranchTypeId; field: 'selectedStrategies' | 'selectedMethods' | 'selectedTransforms'; item: string };
    updateOptimizer: { branchType: BranchTypeId; optimizer: string };
  }>();
</script>

<div class="branch-card" class:disabled={!branch.enabled} class:expanded>
  <div class="branch-header">
    <button class="branch-toggle" on:click={() => dispatch('toggle', def.id)}>
      <span class="toggle-track" class:on={branch.enabled}>
        <span class="toggle-thumb"></span>
      </span>
    </button>
    <span class="branch-icon" style="color:{def.color}">{def.icon}</span>
    <div class="branch-info">
      <span class="branch-name">{def.label}</span>
      <span class="branch-desc">{def.description}</span>
    </div>
    <div class="branch-iters">
      <input
        type="number"
        class="iter-input"
        min="1"
        max="200"
        value={branch.iters}
        on:change={(e) => dispatch('updateIters', { type: def.id, value: parseInt(e.currentTarget.value) || def.defaultIters })}
        disabled={!branch.enabled}
      />
      <span class="iter-label">iters</span>
    </div>
    <button
      class="expand-btn"
      on:click={() => dispatch('expand', def.id)}
      disabled={!branch.enabled}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  </div>

  {#if expanded && branch.enabled}
    <div class="branch-config">
      {#if def.id === 'model_architecture' && def.models}
        <span class="config-label">Models</span>
        <div class="chip-grid">
          {#each def.models as model}
            <button
              class="config-chip"
              class:selected={branch.selectedModels?.includes(model.id)}
              on:click={() => dispatch('toggleModel', { branchType: def.id, modelId: model.id })}
              title={model.description}
            >{model.label}</button>
          {/each}
        </div>

      {:else if def.id === 'feature_engineering' && def.featureCategories}
        <span class="config-label">Feature Categories</span>
        <div class="chip-grid">
          {#each def.featureCategories as cat}
            <button
              class="config-chip"
              class:selected={branch.selectedCategories?.includes(cat.id)}
              on:click={() => dispatch('toggleCategory', { branchType: def.id, catId: cat.id })}
              title={cat.description}
            >{cat.label}</button>
          {/each}
        </div>

      {:else if def.id === 'ensemble_methods' && def.strategies}
        <span class="config-label">Strategies</span>
        <div class="chip-grid">
          {#each def.strategies as s}
            <button
              class="config-chip"
              class:selected={branch.selectedStrategies?.includes(s)}
              on:click={() => dispatch('toggleArrayItem', { branchType: def.id, field: 'selectedStrategies', item: s })}
            >{s}</button>
          {/each}
        </div>

      {:else if def.id === 'regularization' && def.methods}
        <span class="config-label">Methods</span>
        <div class="chip-grid">
          {#each def.methods as m}
            <button
              class="config-chip"
              class:selected={branch.selectedMethods?.includes(m)}
              on:click={() => dispatch('toggleArrayItem', { branchType: def.id, field: 'selectedMethods', item: m })}
            >{m}</button>
          {/each}
        </div>

      {:else if def.id === 'hyperparameter_tuning' && def.optimizers}
        <span class="config-label">Optimizer</span>
        <div class="chip-grid">
          {#each def.optimizers as opt}
            <button
              class="config-chip"
              class:selected={branch.selectedOptimizer === opt}
              on:click={() => dispatch('updateOptimizer', { branchType: def.id, optimizer: opt })}
            >{opt}</button>
          {/each}
        </div>

      {:else if def.id === 'data_preprocessing' && def.transforms}
        <span class="config-label">Transforms</span>
        <div class="chip-grid">
          {#each def.transforms as t}
            <button
              class="config-chip"
              class:selected={branch.selectedTransforms?.includes(t)}
              on:click={() => dispatch('toggleArrayItem', { branchType: def.id, field: 'selectedTransforms', item: t })}
            >{t}</button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .branch-card {
    background: var(--surface, #fff);
    border: 1px solid var(--border, #E5E0DA);
    border-radius: 8px;
    overflow: hidden;
    transition: border-color 120ms;
  }
  .branch-card.disabled { opacity: 0.5; }
  .branch-card.expanded { border-color: var(--accent, #D97757); }
  .branch-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
  }
  .branch-toggle {
    appearance: none;
    border: none;
    background: none;
    padding: 0;
    cursor: pointer;
    flex-shrink: 0;
  }
  .toggle-track {
    display: block;
    width: 32px;
    height: 18px;
    border-radius: 9px;
    background: var(--border, #E5E0DA);
    position: relative;
    transition: background 150ms;
  }
  .toggle-track.on { background: var(--accent, #D97757); }
  .toggle-thumb {
    display: block;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #fff;
    position: absolute;
    top: 2px;
    left: 2px;
    transition: transform 150ms;
    box-shadow: 0 1px 2px rgba(0,0,0,0.15);
  }
  .toggle-track.on .toggle-thumb { transform: translateX(14px); }

  .branch-icon {
    font-size: 1.1rem;
    flex-shrink: 0;
    width: 22px;
    text-align: center;
  }
  .branch-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .branch-name {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-primary, #2D2D2D);
  }
  .branch-desc {
    font-size: 0.64rem;
    color: var(--text-muted, #9a9590);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .branch-iters {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
  .iter-input {
    width: 52px;
    padding: 4px 6px;
    border: 1px solid var(--border, #E5E0DA);
    border-radius: 4px;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.72rem;
    text-align: center;
    color: var(--text-primary, #2D2D2D);
    background: var(--bg, #FAF8F5);
  }
  .iter-input:focus { outline: none; border-color: var(--accent, #D97757); }
  .iter-input:disabled { opacity: 0.4; }
  .iter-label {
    font-size: 0.6rem;
    color: var(--text-muted, #9a9590);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }
  .expand-btn {
    appearance: none;
    border: none;
    background: none;
    padding: 4px;
    cursor: pointer;
    color: var(--text-muted, #9a9590);
    display: flex;
    border-radius: 4px;
    transition: all 120ms;
  }
  .expand-btn:hover:not(:disabled) { color: var(--text-primary, #2D2D2D); }
  .expand-btn:disabled { opacity: 0.3; cursor: default; }
  .branch-card.expanded .expand-btn { transform: rotate(180deg); }

  .branch-config {
    padding: 10px 14px 14px;
    border-top: 1px solid var(--border-subtle, #EDEAE5);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .config-label {
    font-size: 0.64rem;
    font-weight: 600;
    color: var(--text-muted, #9a9590);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }
  .chip-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .config-chip {
    appearance: none;
    border: 1px solid var(--border, #E5E0DA);
    background: var(--surface, #fff);
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 0.68rem;
    font-weight: 500;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    color: var(--text-secondary, #6b6560);
    cursor: pointer;
    transition: all 120ms;
  }
  .config-chip:hover { border-color: var(--accent, #D97757); }
  .config-chip.selected {
    background: var(--text-primary, #2D2D2D);
    color: #fff;
    border-color: var(--text-primary, #2D2D2D);
  }
</style>
