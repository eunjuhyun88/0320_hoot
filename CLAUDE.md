# CLAUDE.md

## MANDATORY: Session Start

**Every new session MUST begin by reading memory files before any other work:**

1. Read `memory/MEMORY.md` — user prefs, project state, key decisions
2. Read `memory/session-log.md` — pending tasks, last session context
3. Read `memory/architecture.md` and `memory/protocol-domain.md` as needed

**Every session MUST end by updating memory:**

1. Update `memory/session-log.md` with completed/pending work
2. Update `memory/MEMORY.md` if project state or decisions changed
3. Add new topic files if significant domain knowledge was gained

These are NOT optional. Skipping memory check causes context loss and repeated work.

---

## Project

**HOOT Protocol Visualizer** — Interactive protocol explorer and autonomous research mesh dashboard.

- Repo: `eunjuhyun88/holostudio_magnet`
- Stack: **Svelte 4 + TypeScript + Vite 6**
- Entry: `src-svelte/main.ts` → `App.svelte`
- Live product: https://hoot.holostudio.io/

## Quick Start

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build → dist/
```

No test runner configured. Verify with `npm run build`.

## Architecture

### Routing (hash-based)

| Hash | AppView | Component | Label |
|------|---------|-----------|-------|
| `/#/` | dashboard | DashboardPage | Dashboard |
| `/#/research` | research | AutoresearchPage | Magnet |
| `/#/models` | models | ModelsPage | Models |
| `/#/network` | network | NetworkView | Network |
| `/#/protocol` | protocol | EconomicsPage | Protocol |
| `/#/ontology` | ontology | OntologyPage | — |
| `/#/model-detail` | model-detail | ModelDetailPage | — |

Router: `src-svelte/lib/router.ts` — `AppView` type union, `ROUTE_MAP`, `VIEW_TO_HASH`.
Legacy aliases: `/economics` → protocol, `/autoresearch` → research, `/magnet` → research.

### State (Svelte writable stores)

| Store | File | Purpose |
|-------|------|---------|
| `router` | `router.ts` | Current view + query params |
| `jobStore` | `jobStore.ts` | Research job simulation (phase, experiments, metrics) |
| `wallet` | `walletStore.ts` | Simulated wallet connect (Phantom/Solflare/Backpack) |

Derived stores: `completedCount`, `keepCount`, `discardCount`, `crashCount`, `metricHistory`, `qualityScore`, `statusMessage`, `latestFinding`.

### Key Files

```
src-svelte/
├── App.svelte                 # Root shell + routing switch
├── main.ts                    # Mount point
├── lib/
│   ├── router.ts              # Hash router + AppView type
│   ├── jobStore.ts            # Research job state machine
│   ├── walletStore.ts         # Wallet simulation
│   ├── tokens.css             # Design tokens (colors, spacing, fonts)
│   ├── types.ts               # Shared types (Worker, Node, Job, etc.)
│   ├── NavBar.svelte          # Top nav with pixel icons
│   ├── PixelOwl.svelte        # Animated pixel owl character
│   ├── MeshCanvas.svelte      # Three.js globe visualization
│   ├── DashboardPage.svelte   # Hero + search + feature showcase
│   ├── AutoresearchPage.svelte # Experiment tape + worker board
│   ├── ModelsPage.svelte      # Model registry cards
│   ├── NetworkView.svelte     # 4 tabs (My GPU, Jobs, Swarms, Feed)
│   ├── EconomicsPage.svelte   # Protocol page (bonds, burn, PPAP, trust)
│   ├── OntologyPage.svelte    # Research ontology config form
│   ├── ModelDetailPage.svelte # Model analytics deep-dive
│   ├── ExperimentTape.svelte  # Scrolling experiment results
│   ├── WorkerBoard.svelte     # Worker status grid
│   ├── MetricCard.svelte      # Stat display card
│   └── MetricChart.svelte     # Sparkline charts
```

## Conventions

### Component patterns

- **Pages**: `[Name]Page.svelte` or `[Name]View.svelte`
- **Stores**: `[name]Store.ts` — factory pattern with `createXxxStore()`
- **Types**: centralized in `types.ts`
- **CSS**: scoped `<style>` blocks, reference `tokens.css` variables
- **Icons**: Pixel SVG inline, `shape-rendering="crispEdges"`, 16x16 viewBox

### Svelte specifics

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { store } from './store.ts';

  let localState = '';
  $: derived = compute($store);       // reactive
</script>
```

- Always `lang="ts"` in script tags
- Use `$:` reactive declarations
- Use `$store` auto-subscription syntax
- CSS variables: `var(--accent)`, `var(--font-mono)`, `var(--radius-lg)`

### Design tokens (tokens.css)

| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#D97757` | Primary brand (terracotta) |
| `--green` | `#27864a` | Success, active |
| `--red` | `#c0392b` | Burn, danger |
| `--gold` | `#d4a017` | Warning, premium |
| `--blue` | `#2980b9` | Info, tier 1 |
| `--font-display` | Playfair Display | Headings |
| `--font-body` | Inter | Body text |
| `--font-mono` | JetBrains Mono | Code, numbers |

### Pixel art style

- All icons use `shape-rendering="crispEdges"` + `image-rendering: pixelated`
- Grid-aligned to 2px increments within 16x16 viewBox
- PixelOwl has moods: `idle`, `research`, `happy`

## Protocol Domain

### HOOT Protocol Layers
- **L1 PROOF** — Data provenance (PPAP)
- **L2 MODEL** — Hyperparameter search (Model Magnet)
- **L3 AGENT** — Autonomous agent bundles

### Key Objects
PPAP, NodeCapacity, ResearchJob, VTR, ModelRights, UsageSettlement, BundleAsset

### Token Economics
- Total supply: 1B HOOT, TGE: $0.10
- Pool A: Creator 60% / Notary 15% / Treasury 15% / Burn 10%
- Pool B: GPU 95% / Treasury 5%
- Bond tiers: Lite 500 / Standard 2,000 / Enterprise 10,000 HOOT
- Deflation target: MAU 1,443

### Naming
- "Magnet" = NavBar label for Research tab
- "Model Magnet Research" = full product name
- "Protocol" = tab for on-chain operations (was "Economics")

## Scripts

```bash
npm run dev              # Svelte dev server
npm run build            # Production build
npm run preview          # Preview built app
npm run telemetry:mock   # Fixture SSE server on :8787
npm run controller:loop  # Autoresearch loop controller
npm run swarm:supervisor # Swarm supervisor
```

## Git

- Branch: `main` (production), feature branches `feat/xxx`
- Commit style: `feat:`, `fix:`, `chore:` prefixed
- Co-author: `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
- No pre-commit hooks configured
