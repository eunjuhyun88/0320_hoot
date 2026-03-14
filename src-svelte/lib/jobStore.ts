import { writable, derived, get } from 'svelte/store';

/* ─── Types ─── */

export type ExperimentStatus = 'training' | 'evaluating' | 'keep' | 'discard' | 'crash';
export type JobPhase = 'idle' | 'setup' | 'running' | 'complete';

export interface Experiment {
  id: number;
  status: ExperimentStatus;
  modification: string;
  metric: number;
  delta: number;
  nodeId: string;
  branchId: number;
  duration: number;
  progress: number;
  timestamp: number;
}

export interface Branch {
  id: number;
  completed: number;
  total: number;
  bestMetric: number;
}

export interface AutoresearchJob {
  topic: string;
  phase: JobPhase;
  setupMessage: string;
  experiments: Experiment[];
  branches: Branch[];
  bestMetric: number;
  totalExperiments: number;
  startedAt: number;
  elapsedSeconds: number;
}

/* ─── Default State ─── */

function createEmptyJob(): AutoresearchJob {
  return {
    topic: '',
    phase: 'idle',
    setupMessage: '',
    experiments: [],
    branches: [],
    bestMetric: Infinity,
    totalExperiments: 60,
    startedAt: 0,
    elapsedSeconds: 0,
  };
}

/* ─── Store ─── */

function createJobStore() {
  const store = writable<AutoresearchJob>(createEmptyJob());
  const { subscribe, set, update } = store;

  let timers: ReturnType<typeof setTimeout | typeof setInterval>[] = [];

  function addTimer(t: ReturnType<typeof setTimeout | typeof setInterval>) {
    timers.push(t);
  }

  function clearAllTimers() {
    timers.forEach(t => { clearTimeout(t as any); clearInterval(t as any); });
    timers = [];
  }

  /** Start a new autoresearch job */
  function startJob(topic: string, branchCount = 6, itersPerBranch = 10) {
    clearAllTimers();

    const branches: Branch[] = Array.from({ length: branchCount }, (_, i) => ({
      id: i + 1,
      completed: 0,
      total: itersPerBranch,
      bestMetric: Infinity,
    }));

    set({
      topic,
      phase: 'setup',
      setupMessage: `Initializing autoresearch for "${topic}"...`,
      experiments: [],
      branches,
      bestMetric: Infinity,
      totalExperiments: branchCount * itersPerBranch,
      startedAt: Date.now(),
      elapsedSeconds: 0,
    });

    simulateSetup(topic);
  }

  /** Setup phase — fast streaming messages */
  function simulateSetup(topic: string) {
    const messages = [
      `Analyzing research domain: "${topic}"...`,
      'Generating program.md with Claude...',
      'Configuring train.py template...',
      'Setting up evaluation pipeline...',
      'Distributing to compute nodes...',
      'Starting first experiments...',
    ];
    let idx = 0;

    const interval = setInterval(() => {
      if (idx >= messages.length) {
        clearInterval(interval);
        update(s => ({ ...s, phase: 'running', setupMessage: '' }));
        startSimulation();
        return;
      }
      update(s => ({ ...s, setupMessage: messages[idx] }));
      idx++;
    }, 350);  // fast setup
    addTimer(interval);
  }

  /** Main simulation loop — fast experiment generation */
  function startSimulation() {
    // Clock: tick elapsed time (accelerated — 3x speed)
    const clock = setInterval(() => {
      update(s => ({ ...s, elapsedSeconds: s.elapsedSeconds + 3 }));
    }, 1000);
    addTimer(clock);

    // Track next experiment ID
    let nextId = 1;
    // Currently training experiment ref
    let trainingId: number | null = null;

    // Push first training experiment immediately
    const firstExp: Experiment = {
      id: nextId++,
      status: 'training',
      modification: 'baseline model (initial run)',
      metric: 0,
      delta: 0,
      nodeId: `node-${randomHex(4)}`,
      branchId: 1,
      duration: 0,
      progress: 0,
      timestamp: Date.now(),
    };
    trainingId = firstExp.id;
    update(s => ({ ...s, experiments: [firstExp] }));

    // Progress ticker for training experiments — fast
    const progressTick = setInterval(() => {
      if (trainingId === null) return;
      update(s => {
        const exps = s.experiments.map(e => {
          if (e.id === trainingId && e.status === 'training') {
            const newProgress = Math.min(100, e.progress + 12 + Math.random() * 15);
            if (newProgress >= 100) {
              // Complete this training → becomes a result
              const metric = 1.4 + Math.random() * 0.3;
              trainingId = null;
              return {
                ...e,
                status: 'keep' as ExperimentStatus,
                progress: 100,
                metric: Math.round(metric * 1000) / 1000,
                delta: 0,
                duration: Math.round(280 + Math.random() * 40),
              };
            }
            return { ...e, progress: newProgress };
          }
          return e;
        });
        const keeps = exps.filter(e => e.status === 'keep');
        const best = keeps.length > 0 ? Math.min(...keeps.map(k => k.metric)) : s.bestMetric;
        return { ...s, experiments: exps, bestMetric: best === Infinity ? s.bestMetric : best };
      });
    }, 200);
    addTimer(progressTick);

    // Main experiment generator — fast cadence
    function scheduleNext() {
      const delay = 500 + Math.random() * 700; // 0.5-1.2s between experiments
      const timer = setTimeout(() => {
        const state = get(store);
        if (state.phase !== 'running') return;

        // Count completed experiments
        const doneCount = state.experiments.filter(
          e => e.status === 'keep' || e.status === 'discard' || e.status === 'crash'
        ).length;

        if (doneCount >= state.totalExperiments) {
          update(s => ({ ...s, phase: 'complete' }));
          clearAllTimers();
          return;
        }

        // Find branch with room
        const available = state.branches.filter(b => b.completed < b.total);
        if (available.length === 0) {
          update(s => ({ ...s, phase: 'complete' }));
          clearAllTimers();
          return;
        }

        const branch = available[Math.floor(Math.random() * available.length)];

        // Sometimes push a "training" in-progress experiment
        if (trainingId === null && Math.random() < 0.25) {
          const trainExp: Experiment = {
            id: nextId++,
            status: 'training',
            modification: MODIFICATIONS[Math.floor(Math.random() * MODIFICATIONS.length)],
            metric: 0,
            delta: 0,
            nodeId: `node-${randomHex(4)}`,
            branchId: branch.id,
            duration: 0,
            progress: 0,
            timestamp: Date.now(),
          };
          trainingId = trainExp.id;
          update(s => ({ ...s, experiments: [trainExp, ...s.experiments] }));
          scheduleNext();
          return;
        }

        // Generate a completed experiment
        const newExp = generateExperiment(nextId++, branch.id, state.bestMetric);

        update(s => {
          // Replace any completed training with this, or prepend
          const exps = [newExp, ...s.experiments];
          const updatedBranches = s.branches.map(b => {
            if (b.id !== branch.id) return b;
            const newBest = newExp.status === 'keep' && newExp.metric < b.bestMetric
              ? newExp.metric : b.bestMetric;
            return { ...b, completed: b.completed + 1, bestMetric: newBest };
          });
          const newBest = newExp.status === 'keep' && newExp.metric < s.bestMetric
            ? newExp.metric : s.bestMetric;
          return { ...s, experiments: exps, branches: updatedBranches, bestMetric: newBest };
        });

        scheduleNext();
      }, delay);
      addTimer(timer);
    }

    // Start generating after first training completes
    const kickoff = setTimeout(() => scheduleNext(), 1200);
    addTimer(kickoff);
  }

  function reset() {
    clearAllTimers();
    set(createEmptyJob());
  }

  return {
    subscribe,
    startJob,
    reset,
  };
}

/* ─── Helpers ─── */

const MODIFICATIONS = [
  'lr: 3e-4 → 1e-4',
  'added dropout 0.1',
  'batch_size: 64 → 128',
  'added layer norm',
  'widened hidden dim 256 → 512',
  'added residual connection',
  'lr: 1e-4 → 5e-5, warmup 100',
  'replaced ReLU with GELU',
  'added weight decay 0.01',
  'increased depth 4 → 6 layers',
  'added attention head',
  'reduced lr to 3e-5',
  'added gradient clipping 1.0',
  'doubled context window',
  'switched to AdamW',
  'added cosine lr schedule',
  'embedding dim 128 → 256',
  'added skip connection',
  'removed dropout, added mixup',
  'sequence length 256 → 512',
];

function generateExperiment(id: number, branchId: number, currentBest: number): Experiment {
  const rand = Math.random();
  let status: ExperimentStatus;
  let metric: number;

  if (rand < 0.03) {
    status = 'crash';
    metric = 0;
  } else if (rand < 0.35) {
    status = 'keep';
    const base = currentBest === Infinity ? 1.45 : currentBest;
    metric = Math.max(0.8, base - Math.random() * 0.015 - 0.001);
  } else {
    status = 'discard';
    const base = currentBest === Infinity ? 1.45 : currentBest;
    metric = base + Math.random() * 0.05;
  }

  const delta = currentBest === Infinity ? 0 : currentBest - metric;
  const mod = MODIFICATIONS[Math.floor(Math.random() * MODIFICATIONS.length)];

  return {
    id,
    status,
    modification: mod,
    metric: Math.round(metric * 1000) / 1000,
    delta: Math.round(delta * 1000) / 1000,
    nodeId: `node-${randomHex(4)}`,
    branchId,
    duration: Math.round(280 + Math.random() * 40),
    progress: 100,
    timestamp: Date.now(),
  };
}

function randomHex(len: number): string {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

/* ─── Human-readable modification translations ─── */

const HUMAN_READABLE: Record<string, string> = {
  'lr: 3e-4 → 1e-4': 'Slowing down learning speed for better precision',
  'added dropout 0.1': 'Adding noise resilience to prevent overfitting',
  'batch_size: 64 → 128': 'Processing more data at once for stability',
  'added layer norm': 'Normalizing layer outputs for smoother training',
  'widened hidden dim 256 → 512': 'Expanding model capacity to capture more patterns',
  'added residual connection': 'Adding shortcut paths for better gradient flow',
  'lr: 1e-4 → 5e-5, warmup 100': 'Fine-tuning with gradual learning warmup',
  'replaced ReLU with GELU': 'Switching to smoother activation for better learning',
  'added weight decay 0.01': 'Adding regularization to prevent memorization',
  'increased depth 4 → 6 layers': 'Making the model deeper for complex patterns',
  'added attention head': 'Adding attention mechanism to focus on key signals',
  'reduced lr to 3e-5': 'Reducing learning speed for final refinement',
  'added gradient clipping 1.0': 'Preventing training instability from large updates',
  'doubled context window': 'Looking at more historical data for predictions',
  'switched to AdamW': 'Using advanced optimizer with better convergence',
  'added cosine lr schedule': 'Gradually reducing learning rate like a cooling process',
  'embedding dim 128 → 256': 'Enriching data representation for nuanced features',
  'added skip connection': 'Adding information highway for faster learning',
  'removed dropout, added mixup': 'Switching regularization strategy for better generalization',
  'sequence length 256 → 512': 'Extending analysis window for longer-range patterns',
  'baseline model (initial run)': 'Starting with baseline configuration',
};

export function humanizeModification(mod: string): string {
  return HUMAN_READABLE[mod] || mod;
}

/* ─── Derived stores ─── */

export const jobStore = createJobStore();

export const completedCount = derived(jobStore, $j =>
  $j.experiments.filter(e => e.status === 'keep' || e.status === 'discard' || e.status === 'crash').length
);

export const keepCount = derived(jobStore, $j =>
  $j.experiments.filter(e => e.status === 'keep').length
);

export const discardCount = derived(jobStore, $j =>
  $j.experiments.filter(e => e.status === 'discard').length
);

export const crashCount = derived(jobStore, $j =>
  $j.experiments.filter(e => e.status === 'crash').length
);

export const metricHistory = derived(jobStore, $j => {
  return $j.experiments
    .filter(e => e.status === 'keep' || e.status === 'discard')
    .reverse()
    .map((e, i) => ({ x: i + 1, y: e.metric, status: e.status }));
});

/** Quality score 0-100: ratio of kept experiments */
export const qualityScore = derived([jobStore, keepCount, completedCount], ([$j, $keeps, $completed]) => {
  if ($completed === 0) return 0;
  return Math.round(($keeps / $completed) * 100);
});

/** Human-readable status message based on current phase */
export const statusMessage = derived([jobStore, completedCount], ([$j, $completed]) => {
  switch ($j.phase) {
    case 'idle': return '';
    case 'setup': return $j.setupMessage || 'Setting up research pipeline...';
    case 'running': return `Testing ${$completed} of ${$j.totalExperiments} approaches`;
    case 'complete': return 'Your model is ready!';
    default: return '';
  }
});

/** Latest human-readable finding from the most recent keep experiment */
export const latestFinding = derived(jobStore, $j => {
  const lastKeep = $j.experiments.find(e => e.status === 'keep');
  if (!lastKeep) return null;
  return {
    modification: lastKeep.modification,
    humanReadable: humanizeModification(lastKeep.modification),
    delta: lastKeep.delta,
    metric: lastKeep.metric,
  };
});
