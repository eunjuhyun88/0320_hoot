<script lang="ts">
  import { agentStore, agentMessages, agentLoading } from "../../stores/agentStore.ts";
  import { router, type AppView } from "../../stores/router.ts";
  import {
    dockStore,
    dockContext,
    dockMode,
    dockTopic,
    detectIntent,
    type DockMode,
  } from "../../stores/dockStore.ts";
  import { jobStore, jobProgress } from "../../stores/jobStore.ts";
  import {
    ASK_CHIPS,
    COMPLETE_CHIPS,
    IDLE_CHIPS,
    INFERENCE_CHIPS,
    RUNNING_CHIPS,
    type SuggestionChip,
  } from "../../data/dockSuggestions.ts";
  import PixelIcon from "../PixelIcon.svelte";

  let inputValue = "";

  const ASK_ACTION_MAP: Record<string, string> = {
    "ask:capabilities": "What can I do here?",
    "ask:myModels": "Show my models",
    "ask:networkStatus": "Network status",
    "ask:howHoot": "How does HOOT work?",
  };

  $: paneMode = $dockMode;
  $: currentPhase = $dockContext;
  $: activeTopic = $jobStore.topic || $dockTopic || "Mesh Assistant";
  $: phaseLabel =
    currentPhase === "running"
      ? `${$jobProgress}% in progress`
      : currentPhase === "complete"
      ? "Latest mission complete"
      : "Ready for a new task";
  $: helperText =
    paneMode === "ask"
      ? "Ask about models, protocol, or network state."
      : paneMode === "research"
      ? "Launch and steer autonomous research without leaving the shell."
      : "Queue quick model runs and lightweight checks.";
  $: visibleMessages = $agentMessages.slice(-4).reverse();
  $: chips = (() => {
    if (paneMode === "ask") return ASK_CHIPS;
    if (paneMode === "inference") return INFERENCE_CHIPS;
    if (currentPhase === "running") return RUNNING_CHIPS;
    if (currentPhase === "complete") return COMPLETE_CHIPS;
    return IDLE_CHIPS;
  })();

  function setMode(mode: DockMode) {
    dockStore.setMode(mode);
  }

  function handleSubmit() {
    const value = inputValue.trim();
    if (!value) return;

    const resolvedMode = paneMode === "ask" ? detectIntent(value) : paneMode;

    if (resolvedMode === "ask") {
      dockStore.setMode("ask");
      agentStore.send(value);
      inputValue = "";
      return;
    }

    if (resolvedMode === "inference") {
      dockStore.setMode("inference");
      agentStore.send(value);
      inputValue = "";
      return;
    }

    dockStore.setMode("research");
    dockStore.setTopic(value);
    if ($dockContext === "idle") {
      dockStore.launch();
    } else {
      router.navigate("studio");
    }
    inputValue = "";
  }

  function handleChipClick(chip: SuggestionChip) {
    if (chip.action?.startsWith("ask:")) {
      agentStore.send(ASK_ACTION_MAP[chip.action] ?? chip.label);
      dockStore.setMode("ask");
      return;
    }

    if (chip.presetId) {
      dockStore.selectPreset(chip.presetId, chip.label);
      dockStore.setMode("research");
      inputValue = chip.label;
      return;
    }

    if (chip.modelId) {
      dockStore.setInferenceModel(chip.modelId);
      dockStore.setMode("inference");
      inputValue = `Run ${chip.label}`;
      return;
    }

    switch (chip.action) {
      case "viewRunning":
      case "viewResults":
        router.navigate("studio");
        return;
      case "stop":
        dockStore.handleCommand("/stop");
        return;
      case "improve":
        dockStore.handleCommand("/improve");
        return;
      case "retry":
        dockStore.handleCommand("/retry");
        return;
      case "deploy":
        dockStore.handleCommand("/deploy");
        return;
      default:
        inputValue = chip.label;
    }
  }

  function handleMessageAction(action: { label: string; view?: AppView; handler?: () => void }) {
    if (action.handler) {
      action.handler();
      return;
    }
    if (action.view) {
      router.navigate(action.view);
    }
  }
</script>

<aside class="assistant-pane" aria-label="Assistant panel">
  <div class="assistant-shell">
    <div class="assistant-head">
      <div class="assistant-mark">
        <span class="assistant-mark-icon">
          <PixelIcon type="sparkle" size={20} />
        </span>
        <div class="assistant-mark-copy">
          <span class="assistant-kicker">Assistant</span>
          <strong>{activeTopic}</strong>
        </div>
      </div>
      <span class="assistant-phase" class:running={currentPhase === "running"}>{phaseLabel}</span>
    </div>

    <div class="assistant-modes" role="tablist" aria-label="Assistant mode">
      <button class="assistant-mode" class:active={paneMode === "ask"} type="button" on:click={() => setMode("ask")}>
        Ask
      </button>
      <button class="assistant-mode" class:active={paneMode === "research"} type="button" on:click={() => setMode("research")}>
        Research
      </button>
      <button class="assistant-mode" class:active={paneMode === "inference"} type="button" on:click={() => setMode("inference")}>
        Run
      </button>
    </div>

    <div class="assistant-body">
      {#if visibleMessages.length > 0}
        <div class="message-stack">
          {#each visibleMessages as message (message.id)}
            <article class="message-card" class:user={message.role === "user"}>
              <span class="message-role">{message.role === "agent" ? "Mesh" : "You"}</span>
              <p>{message.content}</p>
              {#if message.actions?.length}
                <div class="message-actions">
                  {#each message.actions as action (action.label)}
                    <button class="message-action" type="button" on:click={() => handleMessageAction(action)}>
                      {action.label}
                    </button>
                  {/each}
                </div>
              {/if}
            </article>
          {/each}
        </div>
      {:else}
        <div class="assistant-empty">
          <div class="assistant-empty-mark">
            <PixelIcon type="research" size={24} />
          </div>
          <strong>Quiet, but ready.</strong>
          <p>{helperText}</p>
        </div>
      {/if}
    </div>

    <div class="assistant-chip-row">
      {#each chips as chip (chip.label)}
        <button class="assistant-chip" class:primary={chip.variant === "primary"} class:danger={chip.variant === "danger"} type="button" on:click={() => handleChipClick(chip)}>
          {chip.label}
        </button>
      {/each}
    </div>

    <div class="assistant-composer">
      <textarea
        bind:value={inputValue}
        rows="3"
        class="assistant-input"
        placeholder={paneMode === "ask" ? "Ask anything about the mesh…" : paneMode === "research" ? "Describe the next research mission…" : "Run a model or quick check…"}
      ></textarea>
      <div class="assistant-composer-foot">
        <span class="assistant-hint">{$agentLoading ? "Thinking…" : helperText}</span>
        <button class="assistant-send" type="button" on:click={handleSubmit} disabled={!inputValue.trim()}>
          {paneMode === "research" && $dockContext === "idle" ? "Launch" : "Send"}
        </button>
      </div>
    </div>
  </div>
</aside>

<style>
  .assistant-pane {
    display: none;
  }

  @media (min-width: 1180px) {
    .assistant-pane {
      display: block;
      padding: 18px 18px 18px 0;
      height: 100vh;
      position: sticky;
      top: 0;
    }

    .assistant-shell {
      height: 100%;
      border-radius: 30px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background:
        linear-gradient(180deg, rgba(247, 243, 236, 0.94), rgba(233, 228, 220, 0.92)),
        rgba(245, 240, 231, 0.92);
      color: #161e27;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.18);
      backdrop-filter: blur(22px);
      padding: 20px 18px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 0;
    }

    .assistant-head,
    .assistant-mark,
    .assistant-composer-foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .assistant-mark {
      justify-content: flex-start;
      min-width: 0;
      flex: 1;
    }

    .assistant-mark-icon {
      width: 42px;
      height: 42px;
      border-radius: 16px;
      display: grid;
      place-items: center;
      background: rgba(18, 24, 33, 0.08);
      color: #1d252d;
      flex-shrink: 0;
    }

    .assistant-mark-copy {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .assistant-kicker {
      font: 700 0.58rem/1 var(--font-mono, "IBM Plex Mono", monospace);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(73, 84, 94, 0.72);
    }

    .assistant-mark-copy strong {
      font: 700 1.02rem/1.15 var(--font-body, "Space Grotesk", sans-serif);
      color: #151d24;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .assistant-phase {
      flex-shrink: 0;
      border-radius: 999px;
      padding: 7px 10px;
      background: rgba(20, 27, 37, 0.06);
      color: rgba(50, 58, 67, 0.72);
      font: 700 0.56rem/1 var(--font-mono, "IBM Plex Mono", monospace);
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .assistant-phase.running {
      background: rgba(114, 246, 255, 0.14);
      color: #0f6f77;
    }

    .assistant-modes {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      padding: 4px;
      border-radius: 18px;
      background: rgba(20, 27, 37, 0.05);
    }

    .assistant-mode {
      appearance: none;
      border: 0;
      border-radius: 14px;
      background: transparent;
      color: rgba(50, 58, 67, 0.7);
      font: 600 0.76rem/1 var(--font-body, "Space Grotesk", sans-serif);
      padding: 10px 12px;
      cursor: pointer;
    }

    .assistant-mode.active {
      background: rgba(255, 255, 255, 0.76);
      color: #131b23;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.06);
    }

    .assistant-body {
      flex: 1;
      min-height: 0;
      overflow: auto;
      padding-right: 4px;
    }

    .assistant-body::-webkit-scrollbar {
      width: 8px;
    }

    .assistant-body::-webkit-scrollbar-thumb {
      background: rgba(23, 31, 41, 0.12);
      border-radius: 999px;
    }

    .message-stack {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .message-card,
    .assistant-empty {
      border-radius: 20px;
      border: 1px solid rgba(23, 31, 41, 0.08);
      background: rgba(255, 255, 255, 0.56);
      padding: 14px;
    }

    .message-card.user {
      background: linear-gradient(135deg, rgba(19, 26, 37, 0.96), rgba(39, 49, 61, 0.94));
      color: #f6f7f8;
    }

    .message-role {
      display: inline-flex;
      margin-bottom: 8px;
      font: 700 0.55rem/1 var(--font-mono, "IBM Plex Mono", monospace);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(73, 84, 94, 0.72);
    }

    .message-card.user .message-role {
      color: rgba(255, 255, 255, 0.64);
    }

    .message-card p,
    .assistant-empty p {
      margin: 0;
      font-size: 0.76rem;
      line-height: 1.55;
      color: inherit;
      white-space: pre-line;
    }

    .message-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .message-action,
    .assistant-chip,
    .assistant-send {
      appearance: none;
      border: 0;
      cursor: pointer;
    }

    .message-action,
    .assistant-chip {
      border-radius: 999px;
      padding: 8px 10px;
      background: rgba(20, 27, 37, 0.06);
      color: #1c242c;
      font: 600 0.68rem/1 var(--font-body, "Space Grotesk", sans-serif);
    }

    .assistant-empty {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .assistant-empty-mark {
      width: 38px;
      height: 38px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      background: rgba(20, 27, 37, 0.06);
      color: #1c242c;
    }

    .assistant-empty strong {
      font-size: 0.9rem;
      color: #151d24;
    }

    .assistant-chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .assistant-chip.primary {
      background: rgba(114, 246, 255, 0.18);
      color: #0f6f77;
    }

    .assistant-chip.danger {
      background: rgba(255, 122, 122, 0.14);
      color: #b54848;
    }

    .assistant-composer {
      border-radius: 22px;
      border: 1px solid rgba(23, 31, 41, 0.08);
      background: rgba(255, 255, 255, 0.7);
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .assistant-input {
      width: 100%;
      border: 0;
      resize: none;
      background: transparent;
      color: #161e27;
      font: 500 0.82rem/1.55 var(--font-body, "Space Grotesk", sans-serif);
      outline: none;
    }

    .assistant-input::placeholder {
      color: rgba(73, 84, 94, 0.62);
    }

    .assistant-hint {
      font-size: 0.68rem;
      line-height: 1.4;
      color: rgba(73, 84, 94, 0.72);
      max-width: 68%;
    }

    .assistant-send {
      flex-shrink: 0;
      border-radius: 999px;
      padding: 10px 16px;
      background: linear-gradient(135deg, rgba(19, 26, 37, 0.96), rgba(39, 49, 61, 0.94));
      color: #f6f7f8;
      font: 700 0.72rem/1 var(--font-body, "Space Grotesk", sans-serif);
    }

    .assistant-send:disabled {
      opacity: 0.45;
      cursor: default;
    }
  }
</style>
