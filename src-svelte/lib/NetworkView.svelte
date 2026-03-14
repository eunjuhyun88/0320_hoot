<script lang="ts">
  import { onMount } from "svelte";

  import {
    buildJobNodeCountMap,
    buildJobSwarmGroups,
    buildScaledNodes,
    getJobFlowCount,
    isWorkerActiveState,
    oscillate01,
    smoothPulse,
  } from "../../src/core/meshSim.ts";
  import {
    createFixturePlayback,
    demoFixtureText,
    parseNdjson,
  } from "../../src/fixed/fixturePlayer.ts";
  import { connectTelemetryStream, resolveTelemetryUrl } from "../../src/fixed/liveTelemetry.ts";
  import type { TelemetryEvent, VisualizerModel, Worker } from "../../src/fixed/types.ts";
  import ExperimentTape from "./ExperimentTape.svelte";
  import MeshCanvas from "./MeshCanvas.svelte";
  import ModeButton from "./ModeButton.svelte";
  import NodeCard from "./NodeCard.svelte";
  import StatePipeline from "./StatePipeline.svelte";
  import WorkerBoard from "./WorkerBoard.svelte";
  import { router } from "./router.ts";
  import { wallet } from './walletStore.ts';
  import { jobStore } from './jobStore.ts';
  import type { Job } from '../../src/fixed/types.ts';

  // ── Wallet reactivity ──
  $: walletConnected = $wallet.connected;
  $: walletAddress = $wallet.address;

  // ── Live Jobs: derive from model.jobs (telemetry/fixture data) ──
  // Jobs appear when someone starts autoresearch or inference — not a static list
  $: liveJobs = model.jobs.map(j => {
    const nodeCount = j.nodeIds.length;
    const workerCount = j.workerIds.length;
    // Estimate budget from node count (Pool B: 95% GPU)
    const estBudget = Math.round(nodeCount * 180 + workerCount * 45);
    // Estimate progress from worker states
    const doneWorkers = model.workers.filter(w => j.workerIds.includes(w.id) && (w.state === 'keep' || w.state === 'discard')).length;
    const progress = workerCount > 0 ? Math.round((doneWorkers / workerCount) * 100) : 0;
    const rewardEst = +(3.0 + nodeCount * 0.8).toFixed(1);
    return { ...j, nodeCount, workerCount, estBudget, progress, doneWorkers, rewardEst };
  });
  $: queuedJobs = liveJobs.filter(j => j.state === 'queued');
  $: runningJobs = liveJobs.filter(j => j.state === 'training' || j.state === 'evaluating');
  $: doneJobs = liveJobs.filter(j => j.state === 'done');
  // Also reflect the autoresearch jobStore (user-triggered research)
  $: autoresearchActive = $jobStore.phase === 'running' || $jobStore.phase === 'setup';
  $: autoresearchTopic = $jobStore.topic;

  // ── Claim modal state ──
  let claimModalOpen = false;
  let claimModalStep: 'review' | 'pending' | 'confirmed' = 'review';
  let claimingJob: (typeof liveJobs)[number] | null = null;

  function handleClaimClick(job: (typeof liveJobs)[number]) {
    if (!walletConnected) {
      claimingJob = job;
      claimModalOpen = false;
      return;
    }
    claimingJob = job;
    claimModalStep = 'review';
    claimModalOpen = true;
  }

  function confirmClaim() {
    claimModalStep = 'pending';
    setTimeout(() => {
      claimModalStep = 'confirmed';
    }, 1500);
  }

  function closeClaimModal() {
    claimModalOpen = false;
    claimingJob = null;
    claimModalStep = 'review';
  }

  type TelemetryMode = "fixture" | "live";
  type TelemetryStatus = "offline" | "connecting" | "streaming" | "error";
  type ViewerLocation = { lat: number; lng: number; label: string; };

  const events = parseNdjson(demoFixtureText);
  const playback = createFixturePlayback(events);
  const emptyModel: VisualizerModel = { workers: [], nodes: [], jobs: [], tape: [] };

  let frameIndex = playback.length > 0 ? 0 : -1;
  let telemetryMode: TelemetryMode = "fixture";
  let liveModel: VisualizerModel | null = null;
  let lastTelemetryEvent: TelemetryEvent | null = null;
  let telemetryStatus: TelemetryStatus = "offline";
  let viewportWidth = 1440;
  let meshSimulationTime = 0;
  let meshPopulationDisplayed = 0;
  let selectedWorkerId: string | null = null;
  let recentNodeJoinDelta = 0;
  let previousNodeCount = 0;
  let telemetryUrl: string | null = null;
  let viewerLocation: ViewerLocation | null = null;

  let liveCleanup: (() => void) | null = null;
  let fixtureInterval: number | null = null;
  let meshClockInterval: number | null = null;
  let meshPopulationInterval: number | null = null;
  let joinDeltaTimeout: number | null = null;
  let mounted = false;

  let activeTab: "gpu" | "jobs" | "swarms" | "feed" = "gpu";

  function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

  $: fixtureModel = playback[Math.max(frameIndex, 0)] ?? emptyModel;
  $: model = telemetryMode === "live" ? liveModel ?? fixtureModel : fixtureModel;
  $: meshPopulationCeiling = model.nodes.length === 0 ? 0 : clamp(Math.max(3200, model.nodes.length * 660), 2200, 5600);
  $: meshPopulationTarget = (() => {
    if (model.nodes.length === 0) return 0;
    const lw = smoothPulse(oscillate01(meshSimulationTime / 24 - Math.PI / 2));
    const sw = smoothPulse(oscillate01(meshSimulationTime / 12.5 - 0.7));
    return Math.round(model.nodes.length + meshPopulationCeiling * clamp(0.07 + lw * 0.72 + sw * 0.12, 0.07, 0.97));
  })();
  $: renderNodes = buildScaledNodes(model.nodes, model.jobs, meshPopulationDisplayed, meshPopulationCeiling, meshSimulationTime);
  $: selectedWorker = model.workers.find(w => w.id === selectedWorkerId) ?? null;
  $: if (selectedWorkerId && !model.workers.some(w => w.id === selectedWorkerId)) {
    selectedWorkerId = model.workers[0]?.id ?? null;
  }
  $: totalGpu = model.nodes.reduce((s, n) => s + n.gpu, 0);
  $: activeWorkers = model.workers.filter(w => isWorkerActiveState(w.state)).length;
  $: claimedDonors = renderNodes.filter(n => n.jobId).length;
  $: evaluatingWorkers = model.workers.filter(w => w.state === "evaluating").length;
  $: activeFlowCount = model.jobs.reduce((s, j) => s + getJobFlowCount(j), 0);
  $: keepCount = model.tape.filter(e => e.result === "keep").length;
  $: discardCount = model.tape.filter(e => e.result === "discard").length;
  $: crashCount = model.tape.filter(e => e.result === "crash").length;
  $: jobNodeCountMap = buildJobNodeCountMap(renderNodes);
  $: activeSwarmPreview = buildJobSwarmGroups(model.jobs, jobNodeCountMap).slice(0, 4);
  $: runtimeLabel = telemetryMode === "live" ? telemetryStatus : playback.length > 0 ? `frame ${frameIndex + 1}/${playback.length}` : "replay idle";

  // "My GPU" — use first active worker's node, or first node
  $: myNode = model.nodes.find(n => n.state === 'training' || n.state === 'assigned') ?? model.nodes[0] ?? null;
  $: myWorker = myNode ? model.workers.find(w => w.nodeId === myNode.id) ?? null : null;
  $: myTrustScore = myNode ? Math.min(100, 65 + Math.floor(Math.abs(hashCode(myNode.id)) % 35)) : 0;

  // Simple hash for deterministic trust scores
  function hashCode(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
    return h;
  }

  // Activity log entries (simulated from tape + model state changes)
  $: activityLog = buildActivityLog(model, myNode);

  function buildActivityLog(m: typeof model, node: typeof myNode) {
    if (!node) return [];
    const entries: Array<{time: string; text: string; type: 'claim' | 'train' | 'eval' | 'result' | 'available'}> = [];

    // Generate from tape entries related to this node's worker
    const nodeWorker = m.workers.find(w => w.nodeId === node.id);
    if (nodeWorker) {
      const workerTapeEntries = m.tape.filter(e => e.workerId === nodeWorker.id).slice(-5);
      for (const e of workerTapeEntries) {
        if (e.result === 'keep') {
          entries.push({ time: e.ts.slice(11, 19), text: `Eval complete — keep ${e.metricDelta ? (e.metricDelta > 0 ? '+' : '') + e.metricDelta.toFixed(4) : ''} bpb`, type: 'result' });
        } else if (e.result === 'discard') {
          entries.push({ time: e.ts.slice(11, 19), text: `Eval complete — discard`, type: 'result' });
        } else {
          entries.push({ time: e.ts.slice(11, 19), text: `Experiment crashed`, type: 'result' });
        }
      }
    }

    // Add current state info
    if (node.state === 'training' && nodeWorker) {
      entries.push({ time: 'NOW', text: `Training ${nodeWorker.experimentId}...`, type: 'train' });
    } else if (node.state === 'assigned') {
      entries.push({ time: 'NOW', text: `GPU claimed for ${node.jobId ?? 'job'}`, type: 'claim' });
    } else if (node.state === 'available') {
      entries.push({ time: 'NOW', text: `GPU available — waiting for next job`, type: 'available' });
    }

    return entries.reverse().slice(0, 6);
  }

  $: {
    const nc = model.nodes.length;
    if (nc > previousNodeCount) {
      recentNodeJoinDelta = nc - previousNodeCount;
      if (joinDeltaTimeout !== null) window.clearTimeout(joinDeltaTimeout);
      joinDeltaTimeout = window.setTimeout(() => { recentNodeJoinDelta = 0; }, 900);
    }
    previousNodeCount = nc;
  }

  onMount(() => {
    viewportWidth = window.innerWidth;
    telemetryUrl = resolveTelemetryUrl(window.location.search);
    telemetryMode = telemetryUrl ? "live" : "fixture";
    telemetryStatus = telemetryUrl ? "connecting" : "offline";
    meshPopulationDisplayed = model.nodes.length;
    mounted = true;

    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => { viewerLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: "YOUR BROWSER" }; },
        () => {},
        { enableHighAccuracy: false, maximumAge: 300000, timeout: 6000 },
      );
    }

    const handleResize = () => { viewportWidth = window.innerWidth; };
    window.addEventListener("resize", handleResize);

    let dwellCount = 0;
    fixtureInterval = window.setInterval(() => {
      if (telemetryMode !== "fixture" || playback.length <= 1) return;
      if (frameIndex < 0) { frameIndex = 0; return; }
      if (frameIndex >= playback.length - 1) {
        dwellCount += 1;
        if (dwellCount >= 3) { dwellCount = 0; frameIndex = 0; }
        return;
      }
      frameIndex += 1;
    }, 2800);

    meshClockInterval = window.setInterval(() => { meshSimulationTime += 0.25; }, 250);
    meshPopulationInterval = window.setInterval(() => {
      const floor = model.nodes.length;
      const cur = Math.max(meshPopulationDisplayed, floor);
      if (cur === meshPopulationTarget) return;
      const step = Math.max(2, Math.ceil(Math.abs(meshPopulationTarget - cur) * 0.015));
      meshPopulationDisplayed = cur < meshPopulationTarget ? Math.min(meshPopulationTarget, cur + step) : Math.max(meshPopulationTarget, cur - step);
    }, 140);

    if (telemetryUrl) {
      const conn = connectTelemetryStream({
        url: telemetryUrl,
        onSnapshot(m, e) { liveModel = m; lastTelemetryEvent = e; telemetryStatus = "streaming"; },
        onError() { telemetryStatus = "error"; },
      });
      liveCleanup = () => conn.unsubscribe();
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (fixtureInterval !== null) clearInterval(fixtureInterval);
      if (meshClockInterval !== null) clearInterval(meshClockInterval);
      if (meshPopulationInterval !== null) clearInterval(meshPopulationInterval);
      if (joinDeltaTimeout !== null) clearTimeout(joinDeltaTimeout);
      liveCleanup?.();
    };
  });
</script>

<div class="network" class:mounted data-theme="light">
  <!-- Stats Banner -->
  <div class="stats-banner">
    <div class="banner-inner">
      <div class="banner-left">
        <div class="banner-live">
          <span class="live-dot"></span>
        </div>
        <div class="banner-identity">
          <span class="banner-eyebrow">GPU INFRASTRUCTURE</span>
          <h2 class="banner-heading">Compute Mesh</h2>
        </div>
      </div>
      <div class="banner-stats">
        <span class="bstat"><strong>{renderNodes.length.toLocaleString()}</strong> nodes{#if recentNodeJoinDelta > 0}<span class="delta">+{recentNodeJoinDelta}</span>{/if}</span>
        <span class="bstat-sep"></span>
        <span class="bstat"><strong>{totalGpu}</strong> GPU</span>
        <span class="bstat-sep"></span>
        <span class="bstat"><strong>{activeWorkers}</strong> workers</span>
        <span class="bstat-sep"></span>
        <span class="bstat"><strong>{activeFlowCount}</strong> flows</span>
        <span class="bstat-sep"></span>
        <span class="bstat muted">{runtimeLabel}</span>
        {#if myNode}
          <span class="bstat-sep"></span>
          <span class="bstat gpu-status">
            <span class="gpu-dot" class:training={myNode.state === 'training'} class:available={myNode.state === 'available'}></span>
            YOUR GPU: <strong>{myNode.state.toUpperCase()}</strong>
          </span>
        {/if}
      </div>
      <div class="banner-right">
        <ModeButton label="Fixture" active={telemetryMode === "fixture"} on:click={() => telemetryMode = "fixture"} />
        <ModeButton label="Live" active={telemetryMode === "live"} disabled={!telemetryUrl} on:click={() => telemetryUrl && (telemetryMode = "live")} />
        <button class="globe-link" on:click={() => router.navigate('globe')} title="3D Globe View">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Content: Canvas + Side Panel -->
  <div class="content">
    <div class="canvas-area">
      <MeshCanvas nodes={renderNodes} jobs={model.jobs} workers={model.workers} {selectedWorker} viewerLocation={viewerLocation ? {lat: viewerLocation.lat, lng: viewerLocation.lng} : null} />
    </div>

    <div class="side-panel">
      <div class="panel-tabs">
        <button class="ptab" class:active={activeTab === 'gpu'} on:click={() => activeTab = 'gpu'}>
          My GPU
        </button>
        <button class="ptab" class:active={activeTab === 'jobs'} on:click={() => activeTab = 'jobs'}>
          Jobs <span class="tbadge" class:tbadge-green={liveJobs.length > 0}>{liveJobs.length}</span>
        </button>
        <button class="ptab" class:active={activeTab === 'swarms'} on:click={() => activeTab = 'swarms'}>
          Swarms <span class="tbadge">{model.jobs.length}</span>
        </button>
        <button class="ptab" class:active={activeTab === 'feed'} on:click={() => activeTab = 'feed'}>
          Feed <span class="tbadge">{model.tape.length}</span>
        </button>
      </div>

      <div class="panel-body">
        {#if activeTab === 'gpu'}
          <div class="psection gpu-hero">
            {#if myNode}
              <h4 class="slabel">My Node</h4>
              <NodeCard node={myNode} worker={myWorker} trustScore={myTrustScore} selected={true} />

              <h4 class="slabel" style="margin-top: 16px;">Activity Log</h4>
              <div class="activity-log">
                {#each activityLog as entry, i}
                  <div class="log-entry" style:--delay="{i * 60}ms">
                    <div class="log-indicator">
                      <span class="log-dot" class:train={entry.type === 'train'} class:claim={entry.type === 'claim'} class:result={entry.type === 'result'} class:available={entry.type === 'available'}></span>
                      {#if i < activityLog.length - 1}
                        <span class="log-line"></span>
                      {/if}
                    </div>
                    <div class="log-content">
                      <span class="log-text">{entry.text}</span>
                      <span class="log-time">{entry.time}</span>
                    </div>
                  </div>
                {/each}
                {#if activityLog.length === 0}
                  <div class="empty">No activity yet</div>
                {/if}
              </div>
            {:else}
              <div class="empty">No GPU node detected</div>
            {/if}
          </div>
        {:else if activeTab === 'jobs'}
          <!-- Autoresearch indicator -->
          {#if autoresearchActive}
            <div class="psection rj-autoresearch-banner">
              <div class="rj-ar-dot"></div>
              <div class="rj-ar-info">
                <span class="rj-ar-label">Autoresearch Active</span>
                <span class="rj-ar-topic">{autoresearchTopic}</span>
              </div>
            </div>
          {/if}

          <!-- Queued — available for claim -->
          {#if queuedJobs.length > 0}
            <div class="psection">
              <h4 class="slabel">Queued <span class="slabel-count">{queuedJobs.length}</span></h4>
              {#each queuedJobs as job, i}
                <div class="rj-card" style:--delay="{i * 80}ms">
                  <div class="rj-header">
                    <span class="rj-id">{job.id.slice(0, 12)}</span>
                    <span class="rj-state-pill rj-open">QUEUED</span>
                  </div>
                  <div class="rj-meta-grid">
                    <div class="rj-meta-item">
                      <span class="rj-meta-label">Nodes</span>
                      <span class="rj-meta-value mono">{job.nodeCount}</span>
                    </div>
                    <div class="rj-meta-item">
                      <span class="rj-meta-label">Workers</span>
                      <span class="rj-meta-value mono">{job.workerCount}</span>
                    </div>
                    <div class="rj-meta-item">
                      <span class="rj-meta-label">Est. Budget</span>
                      <span class="rj-meta-value mono">{job.estBudget} HOOT</span>
                    </div>
                    <div class="rj-meta-item">
                      <span class="rj-meta-label">Reward</span>
                      <span class="rj-meta-value mono">~{job.rewardEst}/batch</span>
                    </div>
                  </div>
                  <div class="rj-footer">
                    <div class="rj-tags">
                      <span class="rj-dataset">{job.workerCount} workers assigned</span>
                    </div>
                    <button class="rj-claim-btn" on:click={() => handleClaimClick(job)}>
                      Claim
                    </button>
                  </div>
                  {#if !walletConnected && claimingJob?.id === job.id && !claimModalOpen}
                    <div class="rj-wallet-hint">Connect wallet first (see NavBar)</div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}

          <!-- Running — training / evaluating -->
          <div class="psection">
            <h4 class="slabel">Running <span class="slabel-count">{runningJobs.length}</span></h4>
            {#if runningJobs.length > 0}
              {#each runningJobs as job}
                <div class="rj-compact-card">
                  <div class="rj-compact-header">
                    <span class="rj-state-pill" class:rj-executing={job.state === 'training'} class:rj-submitted={job.state === 'evaluating'}>
                      {job.state.toUpperCase()}
                    </span>
                    <span class="rj-compact-topic">{job.id.slice(0, 10)}</span>
                  </div>
                  <div class="rj-compact-meta">
                    <span class="mono">{job.nodeCount} nodes</span>
                    <span class="rj-meta-sep">&middot;</span>
                    <span class="mono">{job.workerCount} workers</span>
                    <span class="rj-meta-sep">&middot;</span>
                    <span class="mono">~{job.rewardEst} HOOT/batch</span>
                  </div>
                </div>
              {/each}
            {:else}
              <div class="empty">No running jobs</div>
            {/if}
          </div>

          <!-- Done -->
          {#if doneJobs.length > 0}
            <div class="psection">
              <h4 class="slabel">Completed <span class="slabel-count">{doneJobs.length}</span></h4>
              {#each doneJobs as job}
                <div class="rj-compact-card rj-verified-card">
                  <div class="rj-compact-header">
                    <span class="rj-verified-check">
                      <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                        <circle cx="8" cy="8" r="7" stroke="var(--green, #27864a)" stroke-width="1.5"/>
                        <polyline points="5 8 7.2 10.2 11 6" stroke="var(--green, #27864a)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </span>
                    <span class="rj-compact-topic">{job.id.slice(0, 10)}</span>
                    <span class="rj-state-pill rj-verified">DONE</span>
                  </div>
                  <div class="rj-compact-meta">
                    <span class="mono rj-payout">{job.estBudget} HOOT settled</span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}

          <!-- Empty state when no jobs at all -->
          {#if liveJobs.length === 0 && !autoresearchActive}
            <div class="rj-empty-state">
              <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
                <circle cx="12" cy="12" r="10" stroke="var(--border, #E5E0DA)" stroke-width="1.5"/>
                <path d="M8 12h8M12 8v8" stroke="var(--text-muted, #9a9590)" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <p>No active jobs on the mesh</p>
              <p class="rj-empty-sub">Jobs appear when someone starts autoresearch or requests inference.</p>
            </div>
          {/if}

        {:else if activeTab === 'swarms'}
          <!-- Keep existing jobs content but rename section -->
          <div class="psection">
            <h4 class="slabel">Active Swarms</h4>
            {#if activeSwarmPreview.length > 0}
              {#each activeSwarmPreview as swarm}
                <div class="job-card" class:training={swarm.job.state === 'training'}>
                  <div class="jhead">
                    <span class="jdot" class:training={swarm.job.state === 'training'} class:evaluating={swarm.job.state === 'evaluating'}></span>
                    <span class="jid">{swarm.job.id.slice(0, 8)}</span>
                    <span class="jstate">{swarm.job.state}</span>
                  </div>
                  <div class="jmeta">
                    <span>{swarm.nodeCount} nodes</span>
                    <span>{getJobFlowCount(swarm.job)} flows</span>
                  </div>
                </div>
              {/each}
            {:else}
              <div class="empty">No active swarms</div>
            {/if}
          </div>
          <div class="psection">
            <h4 class="slabel">Mesh Stats</h4>
            <div class="stats-grid">
              <div class="scard"><span class="sv">{renderNodes.length.toLocaleString()}</span><span class="sl">Donors</span></div>
              <div class="scard"><span class="sv accent">{claimedDonors.toLocaleString()}</span><span class="sl">Claimed</span></div>
              <div class="scard"><span class="sv gold">{evaluatingWorkers}</span><span class="sl">Verifying</span></div>
              <div class="scard"><span class="sv">{activeFlowCount}</span><span class="sl">Flows</span></div>
            </div>
          </div>
          <div class="psection">
            <h4 class="slabel">Results</h4>
            <div class="results-row">
              <span class="rc keep">{keepCount} keep</span>
              <span class="rc discard">{discardCount} discard</span>
              <span class="rc crash">{crashCount} crash</span>
            </div>
          </div>
          <div class="psection scroll">
            <h4 class="slabel">Workers</h4>
            <WorkerBoard
              workers={model.workers} jobs={model.jobs} renderNodes={renderNodes}
              tape={model.tape} compact={true} tablet={viewportWidth < 1280}
              {selectedWorkerId} on:select={e => selectedWorkerId = e.detail}
            />
          </div>
        {:else if activeTab === 'feed'}
          <div class="psection scroll">
            <ExperimentTape tape={model.tape} compact={true} />
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Claim Job Modal -->
{#if claimModalOpen && claimingJob}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-interactive-supports-focus -->
  <div class="claim-overlay" on:click|self={closeClaimModal} role="dialog" aria-label="Claim Research Job">
    <div class="claim-modal" class:confirmed={claimModalStep === 'confirmed'}>
      <button class="claim-modal-close" on:click={closeClaimModal}>&times;</button>

      {#if claimModalStep === 'review'}
        <div class="claim-step-indicator">
          <span class="cm-step active">Review</span>
          <span class="cm-arrow">&rarr;</span>
          <span class="cm-step">Pending</span>
          <span class="cm-arrow">&rarr;</span>
          <span class="cm-step">Confirmed</span>
        </div>

        <h3 class="claim-modal-title">Claim Research Job</h3>

        {#if !walletConnected}
          <div class="claim-wallet-prompt">
            <span>No wallet connected</span>
            <button class="claim-wallet-connect" on:click={() => { wallet.connect('Phantom'); }}>Connect Wallet</button>
          </div>
        {:else}
          <div class="claim-wallet-connected">
            <span class="cw-dot"></span>
            <span>Connected: {walletAddress}</span>
          </div>
        {/if}

        <div class="claim-contract-row">
          <span class="claim-label">Contract</span>
          <span class="claim-mono">0x4F0a...7E3d  HootJobs.sol</span>
        </div>

        <div class="claim-fn-row">
          <span class="claim-fn">claimBatch(</span>
          <div class="claim-param">
            <span class="cp-name">jobId</span>
            <span class="cp-type">bytes32</span>
            <span class="cp-value">{claimingJob.id}</span>
          </div>
          <div class="claim-param">
            <span class="cp-name">nodeId</span>
            <span class="cp-type">bytes32</span>
            <span class="cp-value">{myNode?.id ?? 'N/A'}</span>
          </div>
          <span class="claim-fn">)</span>
        </div>

        <div class="claim-details">
          <div class="claim-detail"><span>Fee</span><span class="claim-mono">0 HOOT</span></div>
          <div class="claim-detail"><span>Est. Gas</span><span class="claim-mono">~52,000</span></div>
        </div>

        <p class="claim-note">
          Claim a batch from job {claimingJob.id.slice(0, 10)}. Your GPU will begin executing once confirmed. claimBatch is free per the HOOT FeeDesign.
        </p>

        <button
          class="claim-confirm-btn"
          disabled={!walletConnected}
          on:click={confirmClaim}
        >
          {walletConnected ? 'Confirm' : 'Connect Wallet First'}
        </button>

      {:else if claimModalStep === 'pending'}
        <div class="claim-step-indicator">
          <span class="cm-step done">Review</span>
          <span class="cm-arrow">&rarr;</span>
          <span class="cm-step active">Pending</span>
          <span class="cm-arrow">&rarr;</span>
          <span class="cm-step">Confirmed</span>
        </div>

        <div class="claim-pending">
          <div class="claim-spinner"></div>
          <h3>Confirming on HOOT L1...</h3>
          <div class="claim-tx-hash">
            tx: 0x{Math.random().toString(16).slice(2, 10)}...{Math.random().toString(16).slice(2, 6)}
          </div>
        </div>

      {:else if claimModalStep === 'confirmed'}
        <div class="claim-step-indicator">
          <span class="cm-step done">Review</span>
          <span class="cm-arrow">&rarr;</span>
          <span class="cm-step done">Pending</span>
          <span class="cm-arrow">&rarr;</span>
          <span class="cm-step active cm-confirmed">Confirmed</span>
        </div>

        <div class="claim-confirmed">
          <div class="claim-check-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--green, #27864a)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h3>Job Claimed!</h3>
          <p class="claim-confirmed-text">Your GPU will begin executing.</p>
          <div class="claim-confirmed-topic">{claimingJob.id.slice(0, 12)}</div>
          <button class="claim-done-btn" on:click={closeClaimModal}>Done</button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .network {
    min-height: calc(100vh - 52px);
    display: flex;
    flex-direction: column;
    background: var(--page-bg, #FAF9F7);
    opacity: 0;
    transition: opacity 400ms ease;
    overflow-x: hidden;
  }
  .network.mounted { opacity: 1; }

  /* Banner */
  .stats-banner {
    border-bottom: 1px solid var(--border, #E5E0DA);
    background: var(--surface, #fff);
    flex-shrink: 0;
  }
  .banner-inner {
    max-width: 1440px;
    margin: 0 auto;
    padding: 10px 24px;
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .banner-left { flex-shrink: 0; display: flex; align-items: center; gap: 10px; }
  .banner-live {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--green, #27864a);
    box-shadow: 0 0 12px rgba(39, 134, 74, 0.5);
    animation: pulse-live 2s ease-in-out infinite;
  }
  .live-dot { display: none; }
  @keyframes pulse-live {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  .banner-identity {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .banner-eyebrow {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.52rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent, #D97757);
    line-height: 1;
  }

  .banner-heading {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    margin: 0;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }
  .banner-stats {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    flex-wrap: wrap;
  }
  .bstat {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.74rem;
    color: var(--text-secondary, #6b6560);
    white-space: nowrap;
  }
  .bstat strong {
    font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    font-variant-numeric: tabular-nums;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }
  .bstat-sep { width: 1px; height: 14px; background: var(--border-subtle, #EDEAE5); }
  .bstat .delta { color: var(--green, #27864a); font-weight: 600; margin-left: 2px; font-size: 0.68rem; }
  .bstat.muted { color: var(--text-muted, #9a9590); font-size: 0.68rem; }
  .banner-right { display: flex; gap: 4px; align-items: center; flex-shrink: 0; }
  .globe-link {
    appearance: none;
    border: 1px solid var(--border, #E5E0DA);
    background: var(--surface, #fff);
    width: 30px; height: 30px;
    border-radius: var(--radius-sm, 6px);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted, #9a9590);
    cursor: pointer;
    transition: all 150ms ease;
    margin-left: 4px;
  }
  .globe-link:hover {
    border-color: var(--accent, #D97757);
    color: var(--accent, #D97757);
  }

  /* Content */
  .content {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 340px;
    min-height: 0;
  }
  .canvas-area {
    position: relative;
    min-height: 0;
    overflow: hidden;
  }
  /* Breathing ambient vignette */
  .canvas-area::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, transparent 50%, rgba(250, 249, 247, 0.15) 100%);
    pointer-events: none;
    animation: canvas-breathe 6s ease-in-out infinite;
    z-index: 1;
  }
  @keyframes canvas-breathe {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.5; }
  }

  /* Side Panel — Glass Morphism */
  .side-panel {
    display: flex;
    flex-direction: column;
    border-left: 1px solid rgba(229, 224, 218, 0.5);
    background: var(--glass-bg, rgba(255, 255, 255, 0.72));
    backdrop-filter: blur(var(--glass-blur, 24px));
    -webkit-backdrop-filter: blur(var(--glass-blur, 24px));
    overflow: hidden;
    animation: slideInRight var(--dur-entrance, 700ms) var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1)) both;
  }
  .panel-tabs {
    display: flex;
    border-bottom: 1px solid var(--border-subtle, #EDEAE5);
    flex-shrink: 0;
  }
  .ptab {
    appearance: none;
    border: none;
    background: none;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 10px 6px;
    font-size: 0.74rem;
    font-weight: 500;
    color: var(--text-muted, #9a9590);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 150ms ease;
  }
  .ptab:hover { color: var(--text-secondary, #6b6560); }
  .ptab.active { color: var(--text-primary, #2D2D2D); border-bottom-color: var(--accent, #D97757); }
  .tbadge {
    padding: 1px 5px;
    border-radius: 100px;
    background: var(--border-subtle, #EDEAE5);
    font-size: 0.6rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .ptab.active .tbadge {
    background: rgba(217, 119, 87, 0.1);
    color: var(--accent, #D97757);
  }

  .panel-body {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.08) transparent;
  }
  .panel-body::-webkit-scrollbar { width: 4px; }
  .panel-body::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 4px; }

  .psection { padding: 14px 16px; border-bottom: 1px solid var(--border-subtle, #EDEAE5); }
  .psection.scroll { padding: 8px; border-bottom: none; }
  .psection:last-child { border-bottom: none; }
  .slabel {
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent, #D97757);
    margin: 0 0 10px;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }

  /* Job Cards */
  .job-card {
    padding: 10px 12px;
    border-radius: var(--radius-sm, 6px);
    border: 1px solid var(--border, #E5E0DA);
    margin-bottom: 6px;
    transition: all 150ms ease;
  }
  .job-card:hover { border-color: var(--text-muted, #9a9590); }
  .job-card.training { border-color: rgba(217, 119, 87, 0.3); background: rgba(217, 119, 87, 0.03); }
  .jhead { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
  .jdot { width: 7px; height: 7px; border-radius: 50%; background: var(--text-muted); flex-shrink: 0; }
  .jdot.training { background: var(--accent, #D97757); box-shadow: 0 0 6px rgba(217, 119, 87, 0.4); }
  .jdot.evaluating { background: var(--gold, #b7860e); }
  .jid {
    font-size: 0.76rem;
    font-weight: 600;
    color: var(--text-primary, #2D2D2D);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }
  .jstate {
    margin-left: auto;
    font-size: 0.62rem;
    font-weight: 500;
    color: var(--text-muted, #9a9590);
    padding: 1px 6px;
    border-radius: 100px;
    background: var(--border-subtle, #EDEAE5);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .jmeta { display: flex; gap: 10px; font-size: 0.68rem; color: var(--text-muted, #9a9590); }

  /* Stats Grid */
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .scard {
    padding: 8px;
    border-radius: var(--radius-sm, 6px);
    border: 1px solid var(--border-subtle, #EDEAE5);
    text-align: center;
  }
  .sv {
    display: block;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary, #2D2D2D);
    font-variant-numeric: tabular-nums;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    line-height: 1.2;
  }
  .sv.accent { color: var(--accent, #D97757); }
  .sv.gold { color: var(--gold, #b7860e); }
  .sl {
    display: block;
    font-size: 0.56rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted, #9a9590);
    margin-top: 1px;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }

  /* Results */
  .results-row { display: flex; gap: 6px; }
  .rc {
    padding: 4px 10px;
    border-radius: var(--radius-sm, 6px);
    font-size: 0.7rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .rc.keep { background: rgba(39, 134, 74, 0.08); color: var(--green, #27864a); }
  .rc.discard { background: rgba(192, 57, 43, 0.08); color: var(--red, #c0392b); }
  .rc.crash { background: rgba(139, 58, 98, 0.08); color: #8b3a62; }

  .empty { padding: 20px; text-align: center; color: var(--text-muted, #9a9590); font-size: 0.78rem; }

  /* GPU Status in banner */
  .gpu-status {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.68rem !important;
    letter-spacing: 0.04em;
  }
  .gpu-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--text-muted, #9a9590);
    margin-right: 2px;
    vertical-align: middle;
  }
  .gpu-dot.training {
    background: var(--accent, #D97757);
    box-shadow: 0 0 8px rgba(217, 119, 87, 0.5);
    animation: pulse-live 2s ease-in-out infinite;
  }
  .gpu-dot.available {
    background: var(--green, #27864a);
    box-shadow: 0 0 8px rgba(39, 134, 74, 0.4);
  }

  /* My GPU tab */
  .gpu-hero {
    padding: 14px 16px;
  }

  /* Activity Log */
  .activity-log {
    display: flex;
    flex-direction: column;
  }
  .log-entry {
    display: flex;
    gap: 10px;
    animation: log-fade 300ms ease both;
    animation-delay: var(--delay, 0ms);
  }
  @keyframes log-fade {
    from { opacity: 0; transform: translateX(-4px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .log-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 12px;
    flex-shrink: 0;
    padding-top: 8px;
  }
  .log-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--text-muted, #9a9590);
    flex-shrink: 0;
    transition: all 200ms ease;
  }
  .log-dot.train {
    background: var(--accent, #D97757);
    box-shadow: 0 0 6px rgba(217, 119, 87, 0.4);
  }
  .log-dot.claim {
    background: var(--accent, #D97757);
    box-shadow: 0 0 4px rgba(217, 119, 87, 0.3);
  }
  .log-dot.result {
    background: var(--green, #27864a);
    box-shadow: 0 0 4px rgba(39, 134, 74, 0.3);
  }
  .log-dot.available {
    background: var(--green, #27864a);
  }
  .log-line {
    width: 1.5px;
    flex: 1;
    min-height: 12px;
    background: var(--border-subtle, #EDEAE5);
    margin: 3px 0;
  }
  .log-content {
    flex: 1;
    padding: 6px 10px;
    border-radius: var(--radius-sm, 6px);
    background: rgba(0, 0, 0, 0.015);
    border: 1px solid var(--border-subtle, #EDEAE5);
    margin-bottom: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  .log-text {
    font-size: 0.7rem;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    color: var(--text-secondary, #6b6560);
    line-height: 1.3;
  }
  .log-time {
    font-size: 0.6rem;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    color: var(--text-muted, #9a9590);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 1024px) { .content { grid-template-columns: 1fr 300px; } }
  @media (max-width: 860px) {
    .content { grid-template-columns: 1fr; grid-template-rows: 55vh 1fr; }
    .side-panel {
      border-left: none;
      border-top: 1px solid var(--border, #E5E0DA);
      animation: fadeInUp var(--dur-entrance, 700ms) var(--ease-out-expo) both;
    }
    .banner-inner { flex-wrap: wrap; gap: 8px; padding: 8px 16px; }
    .banner-stats { gap: 8px; }
  }
  @media (max-width: 600px) {
    .banner-stats { display: none; }
    .content { grid-template-rows: 45vh 1fr; }
    /* Mobile: fixed globe background */
    .canvas-area {
      position: fixed;
      top: calc(52px + 44px); /* navbar + banner */
      left: 0;
      right: 0;
      height: 45vh;
      z-index: 0;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      will-change: transform;
    }
    .side-panel {
      position: relative;
      z-index: 2;
      margin-top: 45vh;
      border-radius: var(--radius-lg, 16px) var(--radius-lg, 16px) 0 0;
      min-height: 50vh;
    }
    .content {
      display: block;
    }
  }

  /* ═══════ JOBS TAB ═══════ */

  /* Badge variant for green open-count */
  .tbadge-green {
    background: rgba(39, 134, 74, 0.12);
    color: var(--green, #27864a);
  }
  .ptab.active .tbadge-green {
    background: rgba(39, 134, 74, 0.15);
    color: var(--green, #27864a);
  }

  .slabel-count {
    color: var(--text-muted, #9a9590);
    font-weight: 500;
  }

  .mono {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-variant-numeric: tabular-nums;
  }

  /* Research Job Card (full — for OPEN jobs) */
  .rj-card {
    padding: 12px 14px;
    border-radius: var(--radius-md, 10px);
    border: 1px solid var(--border, #E5E0DA);
    margin-bottom: 8px;
    transition: all 180ms ease;
    animation: rj-fade 320ms ease both;
    animation-delay: var(--delay, 0ms);
  }
  .rj-card:hover {
    border-color: color-mix(in srgb, var(--accent, #D97757) 40%, var(--border, #E5E0DA));
    box-shadow: 0 2px 8px rgba(217, 119, 87, 0.06);
  }
  @keyframes rj-fade {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .rj-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }
  .rj-id {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.64rem;
    color: var(--text-muted, #9a9590);
    letter-spacing: 0.02em;
  }

  /* State pills */
  .rj-state-pill {
    font-size: 0.56rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 2px 8px;
    border-radius: var(--radius-pill, 100px);
    line-height: 1.4;
  }
  .rj-open {
    background: rgba(39, 134, 74, 0.1);
    color: var(--green, #27864a);
  }
  .rj-executing {
    background: rgba(217, 119, 87, 0.1);
    color: var(--accent, #D97757);
  }
  .rj-submitted {
    background: rgba(183, 134, 14, 0.1);
    color: var(--gold, #b7860e);
  }
  .rj-verified {
    background: rgba(39, 134, 74, 0.1);
    color: var(--green, #27864a);
  }

  .rj-meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 12px;
    margin-bottom: 8px;
  }
  .rj-meta-item {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .rj-meta-label {
    font-size: 0.54rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-muted, #9a9590);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }
  .rj-meta-value {
    font-size: 0.7rem;
    color: var(--text-secondary, #6b6560);
  }

  /* Budget bar */
  .rj-budget-bar {
    height: 3px;
    background: var(--border-subtle, #EDEAE5);
    border-radius: 2px;
    margin-bottom: 8px;
    overflow: hidden;
  }
  .rj-budget-bar.compact {
    flex: 1;
    margin-bottom: 0;
  }
  .rj-budget-fill {
    height: 100%;
    background: var(--accent, #D97757);
    border-radius: 2px;
    transition: width 400ms ease;
  }

  .rj-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .rj-tags {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    min-width: 0;
  }
  .rj-dataset {
    font-size: 0.6rem;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    color: var(--text-muted, #9a9590);
  }

  /* Claim button */
  .rj-claim-btn {
    appearance: none;
    border: none;
    background: var(--accent, #D97757);
    color: #fff;
    font-size: 0.68rem;
    font-weight: 700;
    padding: 5px 14px;
    border-radius: var(--radius-sm, 6px);
    cursor: pointer;
    transition: all 150ms ease;
    flex-shrink: 0;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    letter-spacing: 0.03em;
  }
  .rj-claim-btn:hover {
    background: var(--accent-hover, #C4644A);
    box-shadow: 0 2px 8px rgba(217, 119, 87, 0.3);
  }
  .rj-claim-btn:active {
    transform: scale(0.97);
  }

  .rj-wallet-hint {
    font-size: 0.66rem;
    color: var(--red, #c0392b);
    margin-top: 6px;
    padding: 4px 8px;
    background: rgba(192, 57, 43, 0.06);
    border-radius: var(--radius-sm, 6px);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }

  /* Compact card (for in-progress + completed) */
  .rj-compact-card {
    padding: 8px 12px;
    border-radius: var(--radius-sm, 6px);
    border: 1px solid var(--border, #E5E0DA);
    margin-bottom: 6px;
    transition: all 150ms ease;
  }
  .rj-compact-card:hover {
    border-color: var(--text-muted, #9a9590);
  }
  .rj-verified-card {
    border-color: rgba(39, 134, 74, 0.2);
    background: rgba(39, 134, 74, 0.02);
  }
  .rj-compact-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }
  .rj-compact-topic {
    font-size: 0.74rem;
    font-weight: 600;
    color: var(--text-primary, #2D2D2D);
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .rj-compact-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.66rem;
    color: var(--text-muted, #9a9590);
  }
  .rj-verified-check {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
  .rj-payout {
    color: var(--green, #27864a);
    font-weight: 600;
  }

  /* Autoresearch banner */
  .rj-autoresearch-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(217, 119, 87, 0.04);
    border-bottom: 1px solid rgba(217, 119, 87, 0.15);
  }
  .rj-ar-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent, #D97757);
    box-shadow: 0 0 10px rgba(217, 119, 87, 0.5);
    animation: pulse-live 2s ease-in-out infinite;
    flex-shrink: 0;
  }
  .rj-ar-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  .rj-ar-label {
    font-size: 0.56rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent, #D97757);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }
  .rj-ar-topic {
    font-size: 0.74rem;
    font-weight: 600;
    color: var(--text-primary, #2D2D2D);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Meta separator */
  .rj-meta-sep {
    color: var(--text-muted, #9a9590);
    font-size: 0.6rem;
  }

  /* Empty state */
  .rj-empty-state {
    padding: 40px 20px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .rj-empty-state p {
    margin: 0;
    font-size: 0.78rem;
    color: var(--text-muted, #9a9590);
  }
  .rj-empty-sub {
    font-size: 0.66rem !important;
    color: var(--text-muted, #9a9590);
    max-width: 220px;
    line-height: 1.4;
  }

  /* ═══════ CLAIM MODAL ═══════ */

  .claim-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 24px;
    animation: fadeIn 200ms ease;
  }

  .claim-modal {
    background: var(--surface, #fff);
    border: 1px solid var(--border, #E5E0DA);
    border-radius: var(--radius-lg, 16px);
    padding: 28px;
    max-width: 480px;
    width: 100%;
    max-height: 85vh;
    overflow-y: auto;
    position: relative;
    animation: scaleIn 300ms var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1));
    box-shadow: var(--shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.12));
  }

  .claim-modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 28px;
    height: 28px;
    border: none;
    background: var(--page-bg, #FAF9F7);
    border-radius: 50%;
    font-size: 1.1rem;
    color: var(--text-muted, #9a9590);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 150ms;
  }
  .claim-modal-close:hover {
    background: var(--accent-subtle, rgba(217, 119, 87, 0.12));
    color: var(--accent, #D97757);
  }

  /* Step indicator */
  .claim-step-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--text-muted, #9a9590);
  }
  .cm-step {
    padding: 4px 10px;
    border-radius: var(--radius-pill, 100px);
    transition: all 200ms;
  }
  .cm-step.active {
    background: rgba(217, 119, 87, 0.1);
    color: var(--accent, #D97757);
  }
  .cm-step.done {
    color: var(--green, #27864a);
  }
  .cm-step.cm-confirmed {
    background: rgba(39, 134, 74, 0.1);
    color: var(--green, #27864a);
  }
  .cm-arrow {
    color: var(--border, #E5E0DA);
  }

  .claim-modal-title {
    font-family: var(--font-display, 'Playfair Display', serif);
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0 0 16px 0;
    color: var(--text-primary, #2D2D2D);
  }

  /* Wallet status in modal */
  .claim-wallet-prompt {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: rgba(192, 57, 43, 0.06);
    border-radius: var(--radius-sm, 6px);
    margin-bottom: 16px;
    font-size: 0.8rem;
    color: var(--text-secondary, #6b6560);
  }
  .claim-wallet-connect {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.7rem;
    font-weight: 700;
    padding: 6px 12px;
    border-radius: var(--radius-sm, 6px);
    border: 1px solid var(--accent, #D97757);
    background: transparent;
    color: var(--accent, #D97757);
    cursor: pointer;
    transition: all 150ms;
  }
  .claim-wallet-connect:hover {
    background: var(--accent, #D97757);
    color: #fff;
  }

  .claim-wallet-connected {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    background: rgba(39, 134, 74, 0.06);
    border-radius: var(--radius-sm, 6px);
    margin-bottom: 16px;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.75rem;
    color: var(--green, #27864a);
    font-weight: 600;
  }
  .cw-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--green, #27864a);
    flex-shrink: 0;
  }

  /* Contract info */
  .claim-contract-row {
    margin-bottom: 12px;
  }
  .claim-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted, #9a9590);
    font-weight: 600;
    display: block;
    margin-bottom: 4px;
  }
  .claim-mono {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.78rem;
    color: var(--text-secondary, #6b6560);
    font-variant-numeric: tabular-nums;
  }

  .claim-fn-row {
    background: var(--page-bg, #FAF9F7);
    border-radius: var(--radius-sm, 6px);
    padding: 12px;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.75rem;
    margin-bottom: 12px;
  }
  .claim-fn {
    color: var(--accent, #D97757);
    font-weight: 700;
  }
  .claim-param {
    display: flex;
    gap: 8px;
    padding: 4px 0 4px 16px;
    align-items: baseline;
  }
  .cp-name {
    color: var(--text-primary, #2D2D2D);
    font-weight: 600;
  }
  .cp-type {
    color: var(--text-muted, #9a9590);
    font-size: 0.65rem;
  }
  .cp-value {
    color: var(--text-secondary, #6b6560);
    margin-left: auto;
  }

  .claim-details {
    display: flex;
    gap: 24px;
    margin-bottom: 12px;
  }
  .claim-detail {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 0.75rem;
  }
  .claim-detail span:first-child {
    color: var(--text-muted, #9a9590);
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 600;
  }

  .claim-note {
    font-size: 0.78rem;
    color: var(--text-secondary, #6b6560);
    line-height: 1.5;
    margin: 12px 0 20px;
    padding: 10px;
    background: var(--page-bg, #FAF9F7);
    border-radius: var(--radius-sm, 6px);
    border-left: 3px solid var(--accent, #D97757);
  }

  .claim-confirm-btn {
    appearance: none;
    border: none;
    background: var(--accent, #D97757);
    color: #fff;
    font-size: 0.82rem;
    font-weight: 700;
    padding: 10px 20px;
    border-radius: var(--radius-sm, 6px);
    cursor: pointer;
    width: 100%;
    transition: all 150ms ease;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
  }
  .claim-confirm-btn:hover:not(:disabled) {
    background: var(--accent-hover, #C4644A);
    box-shadow: 0 2px 12px rgba(217, 119, 87, 0.3);
  }
  .claim-confirm-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Pending state */
  .claim-pending {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 20px 0;
    text-align: center;
  }
  .claim-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border, #E5E0DA);
    border-top-color: var(--accent, #D97757);
    border-radius: 50%;
    animation: claim-spin 0.8s linear infinite;
  }
  @keyframes claim-spin {
    to { transform: rotate(360deg); }
  }
  .claim-pending h3 {
    font-family: var(--font-display, 'Playfair Display', serif);
    font-size: 1.1rem;
    margin: 0;
    color: var(--text-primary, #2D2D2D);
  }
  .claim-tx-hash {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.7rem;
    color: var(--text-muted, #9a9590);
    padding: 6px 12px;
    background: var(--page-bg, #FAF9F7);
    border-radius: var(--radius-sm, 6px);
  }

  /* Confirmed state */
  .claim-confirmed {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 20px 0;
    text-align: center;
  }
  .claim-check-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(39, 134, 74, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: scaleIn 300ms var(--ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1));
  }
  .claim-check-icon svg {
    width: 28px;
    height: 28px;
  }
  .claim-confirmed h3 {
    font-family: var(--font-display, 'Playfair Display', serif);
    font-size: 1.2rem;
    margin: 0;
    color: var(--green, #27864a);
  }
  .claim-confirmed-text {
    font-size: 0.82rem;
    color: var(--text-secondary, #6b6560);
    margin: 0;
  }
  .claim-confirmed-topic {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.78rem;
    color: var(--text-primary, #2D2D2D);
    font-weight: 600;
    padding: 6px 14px;
    background: var(--page-bg, #FAF9F7);
    border-radius: var(--radius-sm, 6px);
    border: 1px solid var(--border-subtle, #EDEAE5);
  }
  .claim-done-btn {
    appearance: none;
    border: 1px solid var(--border, #E5E0DA);
    background: var(--surface, #fff);
    color: var(--text-primary, #2D2D2D);
    font-size: 0.78rem;
    font-weight: 600;
    padding: 8px 24px;
    border-radius: var(--radius-sm, 6px);
    cursor: pointer;
    transition: all 150ms ease;
  }
  .claim-done-btn:hover {
    border-color: var(--accent, #D97757);
    color: var(--accent, #D97757);
  }

  /* Modal responsive */
  @media (max-width: 600px) {
    .claim-overlay {
      padding: 16px;
    }
    .claim-modal {
      max-width: 100%;
      padding: 20px;
      border-radius: var(--radius-md, 10px);
    }
  }
</style>
