import { writable, derived, get } from 'svelte/store';
import { router } from './router.ts';
import type { AppView } from './router.ts';

// ── Types ──

export interface AgentCard {
  type: 'model' | 'research' | 'gpu' | 'earnings' | 'branch';
  data: Record<string, any>;
}

export interface AgentAction {
  label: string;
  view?: AppView;      // optional navigation target
  handler?: () => void; // custom handler (overrides view navigation)
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  cards?: AgentCard[];
  actions?: AgentAction[];
  timestamp: number;
}

interface AgentState {
  messages: AgentMessage[];
  sheetOpen: boolean;
  loading: boolean;
  inputFocused: boolean;
}

// ── Initial State ──

const initialState: AgentState = {
  messages: [],
  sheetOpen: false,
  loading: false,
  inputFocused: false,
};

// ── Store ──

function createAgentStore() {
  const { subscribe, set, update } = writable<AgentState>(initialState);

  let messageCounter = 0;

  function nextId(): string {
    return `msg-${++messageCounter}-${Date.now()}`;
  }

  return {
    subscribe,

    /** Send user input — generates a smart placeholder agent response */
    async send(input: string) {
      if (!input.trim()) return;

      const userMsg: AgentMessage = {
        id: nextId(),
        role: 'user',
        content: input.trim(),
        timestamp: Date.now(),
      };

      update(s => ({
        ...s,
        messages: [...s.messages, userMsg],
        loading: true,
      }));

      // Simulate agent response (placeholder — will be replaced by real API)
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400));

      const response = getSmartResponse(input.trim());

      const agentMsg: AgentMessage = {
        id: nextId(),
        role: 'agent',
        content: response.content,
        actions: response.actions,
        timestamp: Date.now(),
      };

      update(s => ({
        ...s,
        messages: [...s.messages, agentMsg],
        loading: false,
      }));
    },

    /** Add a system-generated agent message directly */
    addAgentMessage(content: string, actions?: AgentAction[]) {
      const msg: AgentMessage = {
        id: nextId(),
        role: 'agent',
        content,
        actions,
        timestamp: Date.now(),
      };
      update(s => ({
        ...s,
        messages: [...s.messages, msg],
      }));
    },

    /** Open sheet without sending */
    openSheet() {
      update(s => ({ ...s, sheetOpen: true }));
    },

    /** Close sheet (keep messages) */
    closeSheet() {
      update(s => ({ ...s, sheetOpen: false }));
    },

    /** Toggle sheet */
    toggleSheet() {
      update(s => ({ ...s, sheetOpen: !s.sheetOpen }));
    },

    /** Set input focus state */
    setInputFocused(focused: boolean) {
      update(s => ({ ...s, inputFocused: focused }));
    },

    /** Clear all messages and close */
    clearMessages() {
      update(s => ({ ...s, messages: [], sheetOpen: false, loading: false }));
    },

    /** Reset to initial state */
    reset() {
      set(initialState);
    },
  };
}

// ── Smart Responses ──

interface SmartResponse {
  content: string;
  actions?: AgentAction[];
}

function getSmartResponse(input: string): SmartResponse {
  const lower = input.toLowerCase();

  // Capabilities / help
  if (lower.includes('what can i') || lower.includes('what do') || lower.includes('capabilities') || lower === 'help') {
    return {
      content: 'You can do 3 things here:\n\n• Ask — Ask questions about models, network, protocol\n• Research — Launch autonomous AI research on any topic\n• Inference — Run any published model instantly\n\nTry typing a topic to start research, or ask me anything.',
      actions: [
        { label: 'Start Research', handler: () => router.navigate('studio') },
        { label: 'Browse Models', handler: () => router.navigate('models') },
      ],
    };
  }

  // Model related
  if (lower.includes('my model') || lower.includes('show model') || lower.includes('list model')) {
    return {
      content: 'You have 4 models:\n\n• Crypto 24h v3 — 89.1% accuracy, 12.4K calls\n• DeFi Risk v1 — 93.1% accuracy, 3.2K calls\n• ETH Gas v2 — 83.4% accuracy, 890 calls\n• NLP Sentiment v1 — Draft, not deployed yet',
      actions: [
        { label: 'View All Models →', handler: () => router.navigate('models') },
      ],
    };
  }

  // Network
  if (lower.includes('network') || lower.includes('node') || lower.includes('gpu')) {
    return {
      content: 'Network status: 847 nodes active across 12 regions. Total compute: 2.4 PetaFLOPS. Average latency: 42ms.',
      actions: [
        { label: 'View Network →', handler: () => router.navigate('network') },
      ],
    };
  }

  // HOOT protocol
  if (lower.includes('hoot') || lower.includes('protocol') || lower.includes('token') || lower.includes('economics')) {
    return {
      content: 'HOOT is the utility token for the Magnet protocol. It powers:\n\n• Model inference payments (0.001 HOOT per call)\n• Research compute costs\n• GPU node rewards\n• Protocol governance\n\nTotal value locked: $2.4M. 60% to creators, 15% to notaries, 15% to treasury, 10% burned.',
      actions: [
        { label: 'View Protocol →', handler: () => router.navigate('protocol') },
      ],
    };
  }

  // Earnings / rewards
  if (lower.includes('earn') || lower.includes('reward') || lower.includes('revenue') || lower.includes('income')) {
    return {
      content: 'Your total earnings: 6.26 HOOT (~$7.83 USD)\n\n• Model inference revenue: 4.82 HOOT\n• Research rewards: 1.08 HOOT\n• Node contributions: 0.36 HOOT',
      actions: [
        { label: 'View Earnings →', handler: () => router.navigate('protocol') },
      ],
    };
  }

  // Research related
  if (lower.includes('research') || lower.includes('train') || lower.includes('experiment')) {
    return {
      content: 'You can start autonomous AI research right from this dock. Just switch to Research mode and enter a topic like "Crypto price prediction" or "DeFi risk scoring".',
      actions: [
        { label: 'New Research', handler: () => router.navigate('studio') },
      ],
    };
  }

  // Bitcoin / crypto specific
  if (lower.includes('btc') || lower.includes('bitcoin') || lower.includes('crypto') || lower.includes('eth')) {
    return {
      content: 'For crypto-related tasks, you can:\n\n• Run the Crypto 24h v3 model for price predictions\n• Start a new crypto research to train a custom model\n• Check DeFi risk scores with the DeFi Risk v1 model',
      actions: [
        { label: 'Run Crypto Model', handler: () => router.navigate('models') },
        { label: 'Start Crypto Research', handler: () => router.navigate('studio') },
      ],
    };
  }

  // Prediction / inference
  if (lower.includes('predict') || lower.includes('inference') || lower.includes('run model') || lower.includes('test model')) {
    return {
      content: 'To run inference, switch to Inference mode or type "run [model-name]". Each call costs 0.001 HOOT with ~42ms latency via x402 payment protocol.',
      actions: [
        { label: 'Browse Models →', handler: () => router.navigate('models') },
      ],
    };
  }

  // Fallback — still helpful
  return {
    content: `I'll look into "${input}". You can also:\n\n• Switch to Research mode to start autoresearch on this topic\n• Switch to Inference mode to run a model\n• Type /help for all commands`,
  };
}

export const agentStore = createAgentStore();

// ── Derived Stores ──

export const agentMessages = derived(agentStore, $s => $s.messages);
export const agentSheetOpen = derived(agentStore, $s => $s.sheetOpen);
export const agentLoading = derived(agentStore, $s => $s.loading);
export const agentInputFocused = derived(agentStore, $s => $s.inputFocused);
