import { writable, derived, get } from 'svelte/store';
import type { JobPhase, AutoresearchJob } from './jobTypes.ts';
import { createEmptyJob } from './jobTypes.ts';
import { jobState } from './jobState.ts';

/**
 * jobSessionStore — Multi-research session manager.
 *
 * Enables running multiple research sessions concurrently.
 * Each session stores a snapshot of its AutoresearchJob state.
 * The active session is the one displayed in the UI.
 *
 * Flow:
 *   1. User starts Research A → session created, becomes active
 *   2. User wants new research → saves A's snapshot, creates B, switches to B
 *   3. Dashboard shows all sessions with progress
 *   4. User can switch between sessions to view them
 */

export interface JobSession {
  id: string;
  topic: string;
  phase: JobPhase;
  progress: number;
  bestMetric: number;
  totalExperiments: number;
  completedExperiments: number;
  createdAt: number;
  /** Full job state snapshot (saved when switching away) */
  snapshot: AutoresearchJob | null;
}

interface SessionStoreState {
  sessions: JobSession[];
  activeSessionId: string | null;
}

let sessionCounter = 0;

function generateSessionId(): string {
  sessionCounter += 1;
  return `session-${Date.now()}-${sessionCounter}`;
}

function createSessionStore() {
  const { subscribe, set, update } = writable<SessionStoreState>({
    sessions: [],
    activeSessionId: null,
  });

  return {
    subscribe,

    /** Create a new session and make it active. Returns the session ID. */
    createSession(topic: string): string {
      const id = generateSessionId();
      const session: JobSession = {
        id,
        topic,
        phase: 'setup',
        progress: 0,
        bestMetric: Infinity,
        totalExperiments: 0,
        completedExperiments: 0,
        createdAt: Date.now(),
        snapshot: null,
      };

      // Save current active session's snapshot before switching
      const state = get({ subscribe });
      if (state.activeSessionId) {
        const currentJob = get(jobState);
        update(s => ({
          ...s,
          sessions: s.sessions.map(sess =>
            sess.id === s.activeSessionId
              ? {
                  ...sess,
                  topic: currentJob.topic || sess.topic,
                  phase: currentJob.phase,
                  progress: computeProgress(currentJob),
                  bestMetric: currentJob.bestMetric,
                  totalExperiments: currentJob.totalExperiments,
                  completedExperiments: currentJob.experiments.filter(e => e.status !== 'training' && e.status !== 'evaluating').length,
                  snapshot: currentJob,
                }
              : sess
          ),
        }));
      }

      update(s => ({
        sessions: [...s.sessions, session],
        activeSessionId: id,
      }));

      return id;
    },

    /** Switch to a different session. Saves current, restores target. */
    switchSession(sessionId: string) {
      const state = get({ subscribe });
      if (state.activeSessionId === sessionId) return;

      // Save current active session
      if (state.activeSessionId) {
        const currentJob = get(jobState);
        update(s => ({
          ...s,
          sessions: s.sessions.map(sess =>
            sess.id === s.activeSessionId
              ? {
                  ...sess,
                  topic: currentJob.topic || sess.topic,
                  phase: currentJob.phase,
                  progress: computeProgress(currentJob),
                  bestMetric: currentJob.bestMetric,
                  totalExperiments: currentJob.totalExperiments,
                  completedExperiments: currentJob.experiments.filter(e => e.status !== 'training' && e.status !== 'evaluating').length,
                  snapshot: currentJob,
                }
              : sess
          ),
        }));
      }

      // Restore target session
      const target = state.sessions.find(s => s.id === sessionId);
      if (target?.snapshot) {
        jobState.set(target.snapshot);
      }

      update(s => ({ ...s, activeSessionId: sessionId }));
    },

    /** Update the active session's metadata from jobStore (call periodically) */
    syncActiveSession() {
      const currentJob = get(jobState);
      update(s => {
        if (!s.activeSessionId) return s;
        return {
          ...s,
          sessions: s.sessions.map(sess =>
            sess.id === s.activeSessionId
              ? {
                  ...sess,
                  topic: currentJob.topic || sess.topic,
                  phase: currentJob.phase,
                  progress: computeProgress(currentJob),
                  bestMetric: currentJob.bestMetric,
                  totalExperiments: currentJob.totalExperiments,
                  completedExperiments: currentJob.experiments.filter(e => e.status !== 'training' && e.status !== 'evaluating').length,
                }
              : sess
          ),
        };
      });
    },

    /** Remove a session */
    removeSession(sessionId: string) {
      update(s => ({
        ...s,
        sessions: s.sessions.filter(sess => sess.id !== sessionId),
        activeSessionId: s.activeSessionId === sessionId ? null : s.activeSessionId,
      }));
    },

    /** Reset everything */
    reset() {
      set({ sessions: [], activeSessionId: null });
    },
  };
}

function computeProgress(job: AutoresearchJob): number {
  if (job.phase === 'complete') return 100;
  if (job.phase === 'idle') return 0;
  if (job.totalExperiments <= 0) return 0;
  const done = job.experiments.filter(e => e.status !== 'training' && e.status !== 'evaluating').length;
  return Math.min(Math.round((done / job.totalExperiments) * 100), 99);
}

export const jobSessionStore = createSessionStore();

// ── Derived stores ──

export const activeSessions = derived(jobSessionStore, $s =>
  $s.sessions.filter(sess => sess.phase === 'running' || sess.phase === 'setup')
);

export const completedSessions = derived(jobSessionStore, $s =>
  $s.sessions.filter(sess => sess.phase === 'complete')
);

export const allSessions = derived(jobSessionStore, $s => $s.sessions);

export const activeSessionId = derived(jobSessionStore, $s => $s.activeSessionId);

export const sessionCount = derived(jobSessionStore, $s => $s.sessions.length);
