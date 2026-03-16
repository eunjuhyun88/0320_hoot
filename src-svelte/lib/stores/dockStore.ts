/**
 * dockStore.ts — Universal AI terminal dock state
 *
 * Three modes: ask (chat), research (autoresearch launcher), inference (model execution).
 * Smart intent detection routes user input to the correct mode.
 *
 * Does NOT own research lifecycle — reads from jobStore/studioStore,
 * dispatches actions to them.
 */
import { writable, derived, get } from 'svelte/store';
import { jobStore } from './jobStore.ts';
import { studioStore } from './studioStore.ts';
import { toastStore } from './toastStore.ts';
import { router } from './router.ts';
import {
  createOntologyFromPreset,
  getEnabledBranches,
  getTotalExperiments,
  estimateBudgetHoot,
} from '../data/ontologyData.ts';

// ── Types ──

export type DockExpansion = 'collapsed' | 'expanded';
export type LauncherIntent = 'new' | 'improve' | 'retry';
export type DockContextPhase = 'idle' | 'running' | 'complete';
export type DockMode = 'ask' | 'research' | 'inference';

interface DockState {
  expansion: DockExpansion;
  launcherTopic: string;
  selectedPresetId: string | null;
  intent: LauncherIntent;
  mode: DockMode;
  inferenceModelId: string | null;
}

// ── Intent detection ──

const ASK_PATTERNS = /^(what|how|why|when|where|who|is |are |can |does |do |show|tell|explain|help|list|find|search|check|get |describe|compare|which|should)/i;
const INFERENCE_PATTERNS = /^(run |test |predict |inference|execute|try |deploy )/i;
const MODEL_REF_PATTERN = /(model[-\s]?\w+|crypto[-\s]?24h|defi[-\s]?risk|eth[-\s]?gas|nlp[-\s]?sentiment)/i;

export function detectIntent(input: string): DockMode {
  const trimmed = input.trim();
  if (!trimmed) return 'ask';
  // Explicit inference trigger
  if (INFERENCE_PATTERNS.test(trimmed)) return 'inference';
  // Model reference without question word → inference
  if (MODEL_REF_PATTERN.test(trimmed) && !ASK_PATTERNS.test(trimmed)) return 'inference';
  // Question patterns → ask
  if (ASK_PATTERNS.test(trimmed)) return 'ask';
  // Ends with ? → ask
  if (trimmed.endsWith('?')) return 'ask';
  // Default: research
  return 'research';
}

// ── Initial State ──

const initialState: DockState = {
  expansion: 'collapsed',
  launcherTopic: '',
  selectedPresetId: null,
  intent: 'new',
  mode: 'ask',
  inferenceModelId: null,
};

// ── Store ──

function createDockStore() {
  const { subscribe, set, update } = writable<DockState>(initialState);

  return {
    subscribe,

    /** Expand dock with optional topic pre-fill */
    expand(topic?: string, intent: LauncherIntent = 'new') {
      update(s => ({
        ...s,
        expansion: 'expanded',
        launcherTopic: topic ?? s.launcherTopic,
        intent,
        selectedPresetId: intent === 'new' ? s.selectedPresetId : s.selectedPresetId,
      }));
    },

    /** Expand dock in a specific mode */
    expandWithMode(mode: DockMode, topic?: string) {
      update(s => ({
        ...s,
        expansion: 'expanded',
        mode,
        launcherTopic: topic ?? s.launcherTopic,
      }));
    },

    /** Switch mode (stays expanded) */
    setMode(mode: DockMode) {
      update(s => ({ ...s, mode }));
    },

    /** Set inference model target */
    setInferenceModel(modelId: string) {
      update(s => ({ ...s, inferenceModelId: modelId, mode: 'inference' }));
    },

    /** Collapse dock */
    collapse() {
      update(s => ({ ...s, expansion: 'collapsed' }));
    },

    /** Toggle expansion */
    toggle() {
      update(s => ({
        ...s,
        expansion: s.expansion === 'collapsed' ? 'expanded' : 'collapsed',
      }));
    },

    /** Set launcher topic */
    setTopic(topic: string) {
      update(s => ({ ...s, launcherTopic: topic }));
    },

    /** Select a preset → updates topic + preset ID */
    selectPreset(presetId: string, topic: string) {
      update(s => ({ ...s, selectedPresetId: presetId, launcherTopic: topic }));
    },

    /** Clear preset selection */
    clearPreset() {
      update(s => ({ ...s, selectedPresetId: null }));
    },

    /** Launch research from dock — bypasses STEP1/STEP2 */
    launch() {
      const state = get({ subscribe });
      if (!state.launcherTopic.trim()) return;

      const topic = state.launcherTopic.trim();

      // Calculate branch/iter from ontology
      const ont = state.selectedPresetId
        ? createOntologyFromPreset(state.selectedPresetId)
        : createOntologyFromPreset('balanced');
      const branches = getEnabledBranches(ont).length;
      const totalExp = getTotalExperiments(ont);
      const itersPerBranch = Math.round(totalExp / Math.max(branches, 1));

      // Execute
      jobStore.startJob(topic, branches, itersPerBranch);
      studioStore.launchFromDock(topic, state.selectedPresetId ?? undefined);
      toastStore.success('Research started');

      // Navigate to studio if on another page
      router.navigate('studio');

      // Collapse dock
      update(s => ({ ...s, expansion: 'collapsed' }));
    },

    /** Handle slash commands — global terminal interface */
    handleCommand(input: string) {
      const parts = input.slice(1).split(' ');
      const cmd = parts[0].toLowerCase();
      const arg = parts.slice(1).join(' ').trim();
      const job = get(jobStore);

      switch (cmd) {
        // ── Research lifecycle ──
        case 'improve': {
          const topic = arg || job.topic || get(studioStore).createTopic;
          update(s => ({ ...s, expansion: 'expanded', launcherTopic: topic, intent: 'improve' }));
          break;
        }
        case 'retry': {
          const topic = arg || job.topic || get(studioStore).createTopic;
          update(s => ({ ...s, expansion: 'expanded', launcherTopic: topic, intent: 'retry' }));
          break;
        }
        case 'stop': {
          if (job.phase === 'running') {
            jobStore.stopJob();
            studioStore.reset();
            toastStore.warning('Research stopped');
          } else {
            toastStore.info('No research currently running');
          }
          break;
        }
        case 'status': {
          if (job.phase === 'running' || job.phase === 'setup') {
            studioStore.syncFromJobStore();
            router.navigate('studio');
          } else if (job.phase === 'complete') {
            studioStore.syncFromJobStore();
            router.navigate('studio');
          } else {
            toastStore.info('No active research. Type a topic to start.');
          }
          break;
        }
        case 'deploy':
        case 'publish': {
          if (job.phase === 'complete' || get(studioStore).phase === 'complete') {
            studioStore.goToPublish();
            router.navigate('studio');
          } else {
            toastStore.info('Complete a research first before deploying');
          }
          break;
        }

        // ── Navigation ──
        case 'home':
          router.navigate('home');
          break;
        case 'studio':
        case 'research':
          studioStore.syncFromJobStore();
          router.navigate('studio');
          break;
        case 'models':
          router.navigate('models');
          break;
        case 'network':
        case 'nodes':
          router.navigate('network');
          break;
        case 'protocol':
        case 'economics':
          router.navigate('protocol');
          break;
        case 'new': {
          const topic = arg || '';
          studioStore.startCreate(topic || undefined);
          router.navigate('studio');
          break;
        }

        // ── Help ──
        case 'help':
          toastStore.info(
            'Commands: /status /stop /improve /retry /deploy /new · Navigation: /studio /models /network /protocol /home'
          );
          break;

        default:
          toastStore.info(`Unknown: /${cmd} — type /help for commands`);
      }
      // Collapse after command
      update(s => ({ ...s, expansion: 'collapsed' }));
    },

    /** Reset to initial state */
    reset() {
      set({ ...initialState });
    },
  };
}

export const dockStore = createDockStore();

// ── Derived Stores ──

/** Current dock context phase — derived from jobStore */
export const dockContext = derived<typeof jobStore, DockContextPhase>(
  jobStore,
  ($job) => {
    if ($job.phase === 'running' || $job.phase === 'setup') return 'running';
    if ($job.phase === 'complete') return 'complete';
    return 'idle';
  }
);

/** Dock expansion state */
export const dockExpansion = derived(dockStore, $s => $s.expansion);

/** Launcher topic */
export const dockTopic = derived(dockStore, $s => $s.launcherTopic);

/** Selected preset */
export const dockPresetId = derived(dockStore, $s => $s.selectedPresetId);

/** Launcher intent */
export const dockIntent = derived(dockStore, $s => $s.intent);

/** Current dock mode */
export const dockMode = derived(dockStore, $s => $s.mode);

/** Inference model target */
export const dockInferenceModelId = derived(dockStore, $s => $s.inferenceModelId);
