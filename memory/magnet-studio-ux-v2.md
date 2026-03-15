# HOOT Magnet Studio — UX Design Spec v2.0

> Supersedes: page-redesign-spec.md (v1.0)
> Based on: User Journey L1 v1.0, State Machine v2.5, Tokenomics v1.9
> Design language: Apple Maps bottom-sheet + Perplexity input + Vercel project dashboard
> Date: 2026-03-16

---

## 0. Core Design Decisions

### 0.1 Resolved through discussion

| # | Decision | Rationale |
|---|---|---|
| D1 | Dashboard absorbed into Studio IDLE | 3 pages → 1 state machine. Apple Pages/Keynote pattern |
| D2 | STEP1 + STEP2 → CREATE (single screen) | Spotlight pattern: input → results below, no page switch |
| D3 | Activity-First IDLE, not role-based | GitHub/Notion/Figma: show what you've done, not who you are |
| D4 | Agent Bar at bottom dock (always visible) | Apple Maps search bar: persistent input → sheet slides up |
| D5 | Single app, no splitting | io.net/Akash split ≠ good UX. Cross-role users need one place |
| D6 | GPU deep management → Hoot Browser | Hardware concerns belong in node software, not studio |
| D7 | InfoBar contextual (Network/Protocol only) | Studio/Models don't need node counts |
| D8 | Widgets default OFF, add via dock gear | Reduce initial clutter |
| D9 | Stage gate = Preview + Unlock CTA | Don't lock tabs. Show preview, give goal |
| D10 | Protocol terms hidden outside Protocol tab | VTR/PPAP/PoAW = Protocol only. Studio uses plain language |

### 0.2 Serving 2.5 Actors (not 5)

| Actor | Magnet Studio | Hoot Browser |
|---|---|---|
| Builder/Researcher | ✅ Full workflow | GPU setup (own GPU) |
| Buyer/Agent User | ✅ Models tab | — |
| Compute Provider | 👀 Status view + Job Claim | ✅ Full GPU management |
| Contributor | 👀 PPAP status view | ✅ Data contribution |
| Verifier/Notary | 👀 Events view | ✅ Challenge + Arbitration |

### 0.3 User-facing terminology

| Internal | User-facing (Studio) | User-facing (Protocol) |
|---|---|---|
| ResearchJob | 연구 | ResearchJob |
| Experiment | 실험 | Experiment |
| Branch | 탐색 경로 | Branch |
| ModelNFT | 모델 | ModelNFT |
| VTR | (hidden) | VTR Certificate |
| PPAP | (hidden) | PPAP Record |
| PoAW | (hidden) | Proof of AI Work |

---

## 1. Global Layout

```
┌──────────────────────────────────────────────────────────┐
│  🦉 HOOT          [◐ Studio]  Models  Network  Protocol  │ ← NavBar
│                                               [● LIVE] [W]│
├──────────────────────────────────────────────────────────┤
│                                                           │
│                    [ Page Content ]                        │ ← Main Area
│                                                           │
├──────────────────────────────────────────────────────────┤
│  🦉 [무엇이든 물어보세요...]      🔬2 📦3 🌐1 💰$12M ⚙ │ ← Agent Dock
└──────────────────────────────────────────────────────────┘
```

### 1.1 NavBar

- 🦉 Logo: click → Studio (home)
- 4 tabs: Studio · Models · Network · Protocol
- Studio tab shows circular progress ring when research is running (Xcode build pattern)
- [● LIVE]: runtime connection status (ConnectionBadge)
- [W]: wallet button (connect/disconnect)
- Mobile (≤860px): hamburger menu
- InfoBar: NOT global. Only shown on Network and Protocol pages.

### 1.2 Agent Dock (replaces AppDock)

Always visible at bottom of every page. Two sections:

```
┌──────────────────────────────────────────────────────────┐
│  🦉 [무엇이든 물어보세요...]                    [→]       │ ← Agent Input
│  🔬2  📦3  🌐1  💰$12.4M  ⚙                              │ ← Status Icons
└──────────────────────────────────────────────────────────┘
```

**Status Icons (from current AppDock):**
- 🔬 Running research count (click → Studio RUNNING)
- 📦 Active models count (click → Models)
- 🌐 Online nodes count (click → Network)
- 💰 TVL or personal balance (click → Protocol)
- ⚙ Widget/settings gear (click → widget add panel)

**Dock States:**

1. **Collapsed** (default): single-line input + icons
2. **Focused**: keyboard active, input expanded
3. **Sheet open**: response panel slides up from dock

### 1.3 Agent Sheet (Apple Maps bottom-sheet pattern)

When user types in Agent Dock and hits enter:

```
┌──────────────────────────────────────────────────────────┐
│  [Studio]  [Models]  [Network]  [Protocol]                │
├──────────────────────────────────────────────────────────┤
│                                                           │
│         [ Current tab content — dimmed ]                   │
│                                                           │
│  ┌────────────────────────────────────────────────────┐   │
│  │ 🦉 Response content                                │   │
│  │   Rich cards, action buttons, model comparisons    │   │ ← Sheet
│  │                                          [닫기 ▾]  │   │    slides up
│  └────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────┤
│  🦉 [Follow-up question...]                       [→]    │
│  🔬2  📦3  🌐1  💰$12.4M  ⚙                              │
└──────────────────────────────────────────────────────────┘
```

**Sheet behaviors:**
- Swipe down or click [닫기 ▾] → sheet closes, tab content restores
- Action button in sheet → sheet closes + navigates/transitions
- Sheet grows upward as conversation continues (max 70vh)
- Esc key closes sheet
- Sheet overlays current tab (does NOT replace it)

**Agent capabilities:**
- "BTC 예측 모델 만들어줘" → research setup card → [시작] → Studio RUNNING
- "spam 모델 찾아줘" → model cards → click → Models > ModelDetail
- "내 GPU 상태" → GPU summary card → [상세] → Network tab
- "이번 주 수익" → earnings card → [상세] → Protocol tab
- "지금 어떤 브랜치가 잘돼?" → branch performance card (during RUNNING)

### 1.4 Routing

```
/                → studio
/models          → models
/models/:id      → model-detail
/network         → network
/protocol        → protocol
/research-lab    → research-lab (hidden, accessed from Studio RUNNING)
/pipeline        → pipeline (hidden)

Legacy redirects:
/dashboard       → /
/research        → /
/magnet          → /
/ontology        → /
/economics       → /protocol
/autoresearch    → /
/semantic-zoom   → /research-lab
```

### 1.5 Stage Gate (Preview + Unlock CTA)

All 4 tabs always visible. Locked tabs show preview + unlock prompt:

```
Stage 1: [studio]
Stage 2: [studio, research-lab]
Stage 3: + [models, model-detail]
Stage 4: + [network]
Stage 5: + [protocol, pipeline]
```

Locked tab click behavior:
```
┌──────────────────────────────────────────┐
│  Models                                  │
│                                          │
│  🔒 Preview                              │
│                                          │
│  [blurred model cards grid]              │
│                                          │
│  연구 1개를 완료하면 Models가 열립니다     │
│  [Studio에서 연구 시작하기 →]             │
│                                          │
└──────────────────────────────────────────┘
```

---

## 2. Magnet Studio (/)

### 2.1 State Machine

```
                    ┌──────────┐
        ┌──────────▶│   IDLE   │◀─── [New] / reset ──┐
        │           └────┬─────┘                      │
        │                │                            │
        │      [+ New] or search                      │
        │                │                            │
        │                ▼                            │
        │           ┌──────────┐                      │
        │      ┌────│  CREATE  │ topic + AI reco      │
        │      │    └────┬─────┘                      │
        │      │         │ [시작하기]                   │
        │      │         ▼                            │
        │      │    ┌──────────┐                      │
        │      │    │ RUNNING  │ 5-column grid        │
        │      │    └────┬─────┘                      │
        │      │         │ complete                   │
        │      │         ▼                            │
        │      │    ┌──────────┐                      │
        └──────┼────│ COMPLETE │ results + deploy     │
               │    └──────────┘                      │
               │                                      │
               │ [세부 설정]                            │
               ▼                                      │
          ┌──────────┐                                │
          │  SETUP   │ Ontology full config            │
          └────┬─────┘                                │
               │ [Launch]                              │
               └──────────────▶ RUNNING ──────────────┘
```

**Auto-state on page entry:**
```typescript
if (jobStore.phase === 'running' || jobStore.phase === 'setup') → RUNNING
else if (jobStore.phase === 'complete') → COMPLETE
else → IDLE
```

### 2.2 IDLE — Activity-First (Guest)

When wallet not connected AND no activity:

```
┌──────────────────────────────────────────────────────┐
│  Magnet Studio                                        │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │  무엇을 연구하고 싶으세요?             [→]    │    │
│  │  bitcoin prediction · spam · sentiment...    │    │
│  └──────────────────────────────────────────────┘    │
│                                                       │
│  지금 커뮤니티에서                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │  ● spam-detect-v3  실험 중  0.94 F1          │    │ ← live mini-view
│  │    ██████████░░  78%  ·  by 0x4a2...         │    │    (read-only)
│  └──────────────────────────────────────────────┘    │
│                                                       │
└──────────────────────────────────────────────────────┘
```

- Search bar + suggestion chips (HeroSection reuse)
- Live community research mini-view (zero-input value)
- NO 3-step explanation, NO wallet CTA, NO download CTA
- Wallet CTA appears contextually AFTER user starts CREATE

### 2.3 IDLE — Activity-First (Member)

Cards appear based on what user has done. Empty sections don't render.

```
┌──────────────────────────────────────────────────────┐
│  Magnet Studio                            [+ New ▾]  │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │  ● bitcoin-nano    42%   ━━━━░░   ETA 38m   │    │ ← Hero: most important
│  │    1.082 bpb · branch 3 · 32/75             │    │    running research
│  │    [열기 →]                                  │    │
│  └──────────────────────────────────────────────┘    │
│                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ ⚡ GPU    │ │ 📦 모델 3 │ │ 💰 +16.6H│             │ ← Activity cards
│  │ ON · 67% │ │ 47 calls │ │ 이번 주  │             │    (only if active)
│  └──────────┘ └──────────┘ └──────────┘             │
│                                                       │
│  🔔 중재 요청 1건 · 마감 18시간                       │ ← Urgent banner
│                                                       │
│  연구 없으면 Hero = 검색바 (Guest와 동일)               │
└──────────────────────────────────────────────────────┘
```

**Activity card rules:**
- GPU card: appears only when `connectionStore.hasGpu === true`
- Model card: appears only when user has ≥1 model
- Earnings card: appears only when earnings > 0
- Data card: appears only when PPAP count > 0
- Verification card: appears only when pending arbitration exists
- If ALL empty → shows search bar (same as Guest)

**Card click targets:**
- GPU → Network tab (My GPU focus)
- Model → Models tab (My Models filter)
- Earnings → Protocol tab (Rewards section)
- Running research → Studio RUNNING
- Urgent banner → Protocol tab (relevant section)

**[+ New] dropdown (max 4 items):**
```
직접 입력          → CREATE
프리셋에서 시작     → CREATE (preset selector inline)
────────
고급 설정           → SETUP
기존 연구 Fork      → SETUP (fork source pre-filled)
```

### 2.4 CREATE — Topic + AI Recommendation (Spotlight pattern)

Single screen. Progressive disclosure: input first, then AI recommendation slides in.

```
┌──────────────────────────────────────────────────────┐
│  ← Magnet Studio                                      │
│                                                       │
│         어떤 연구를 하고 싶으세요?                       │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │  비트코인 가격 예측 모델                        │    │
│  └──────────────────────────────────────────────┘    │
│                                                       │
│  [한국어 법률] [스팸 탐지] [의료 영상] [감성 분석]       │ ← preset chips
│                                                       │
│  ── 입력 후 아래로 슬라이드 인 ──                       │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │  🏗 Model Architecture         30 iterations │    │
│  │  ⚙ Feature Engineering         25 iterations │    │
│  │  🎯 Hyperparameter Tuning      20 iterations │    │
│  │                                              │    │
│  │  총 75회 실험 · ~2시간 · ~12 HOOT            │    │
│  │  메트릭: MSE (minimize)                      │    │
│  └──────────────────────────────────────────────┘    │
│                                                       │
│  실행 방식                                             │
│  ○ 데모 (무료, 시뮬레이션)                              │
│  ● 내 GPU (무료, RTX 4090)                             │ ← shown if GPU connected
│  ○ 네트워크 (~12 HOOT, ~45분)                           │ ← shown if wallet connected
│  ○ 하이브리드 (~6 HOOT, ~1시간)                          │ ← shown if both
│                                                       │
│  [세부 설정 변경 →]              [연구 시작하기 →]       │
│                                                       │
│  Guest + no wallet:                                   │
│  🔗 지갑 연결하면 실제 GPU로 실행할 수 있어요            │
│  [Phantom 연결]                                       │
└──────────────────────────────────────────────────────┘
```

**Data sources (reuse from ontologyData.ts):**
- `getEnabledBranches()` → branch display
- `getTotalExperiments()` → total count
- `estimateBudgetHoot()` → cost estimate

**Resource selection logic:**
```typescript
const options = [];
options.push({ id: 'demo', label: '데모', cost: 0 });
if ($connectionStore.hasGpu) options.push({ id: 'local', label: '내 GPU', cost: 0 });
if ($wallet.connected) options.push({ id: 'network', label: '네트워크', cost: estimated });
if ($connectionStore.hasGpu && $wallet.connected) options.push({ id: 'hybrid', label: '하이브리드', cost: estimated / 2 });
```

**[세부 설정 변경] → SETUP**
**[연구 시작하기] → jobStore.startJob() or startRuntimeJob() → RUNNING**
**[←] → IDLE**

### 2.5 SETUP — Full Ontology Configuration

Extracted from OntologyPage.svelte. Identical content, different wrapper.

```
┌──────────────────────────────────────────────────────┐
│  ← 돌아가기                    비트코인 가격 예측 모델  │
├──────────────────────────────────────────────────────┤
│  Presets: [crypto_market] [defi_risk] [fraud] [ts]    │
│                                                       │
│  ◉ Overview                                          │
│  ⊞ Branch Strategy                                   │
│  ◲ Dataset                                           │
│  ◈ Evaluation                                        │
│  ⚙ Resources & Config                                │
├──────────────────────────────────────────────────────┤
│  Branches 3 · Exp 75 · ~12 HOOT    [Launch Research →]│
└──────────────────────────────────────────────────────┘
```

- SETUP visible only at Stage 3+ (D9 decision)
- Before Stage 3, [세부 설정 변경] link is hidden in CREATE
- All sections from OntologyPage preserved: Overview, Branch, Dataset, Eval, Resources
- [← 돌아가기] → CREATE
- [Launch] → RUNNING

### 2.6 RUNNING — Experiment Dashboard

100% reuse from AutoresearchPage running layout.

```
Desktop 5-column grid:
  prompt    prompt    prompt    prompt    prompt
  hero      converge  converge  converge  stats
  branches  stream    scatter   effect    context
  branches  treemap   lineage   mesh      terminal
  footer    footer    footer    footer    footer

Tablet (≤1024px): 2-column
Mobile (≤600px): 1-column + segment tabs [Activity/Charts/Mesh]
```

**Components (extracted from AutoresearchPage):**
- PromptBar, ActiveOps, ConvergenceChart, ResearchStats
- BranchList, ActivityStream, ParamScatterChart, ModificationHeatmap
- ExperimentTreemap, ExperimentTree, DistributedView
- ContextPanel, ResearchTerminal
- ResearchFocusModal
- Footer with progress bar

**Events preserved:**
- handleStop() → jobStore.stopJob() → IDLE
- handlePause() → jobStore.togglePause()
- handleNewResearch() → jobStore.reset() → IDLE
- handleDeploy() → deploy flow
- handleRetrain() → reset + new research
- handleImprove() → improve logic

**ZoomLab link:** Footer or PromptBar → "Semantic Zoom →" → /research-lab

**Agent Dock during RUNNING:**
- Dock still visible at bottom
- User can ask questions about running research
- Sheet appears over RUNNING dashboard as overlay

### 2.7 COMPLETE — Results + Deploy

```
┌──────────────────────────────────────────────────────┐
│  PromptBar: bitcoin-nano · ✓ Complete · 75/75        │
├──────────────────────────────────────────────────────┤
│                                                       │
│  연구가 완료되었습니다                                   │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │  Best: experiment #47                         │    │
│  │  MSE: 0.00234 (▼ 67.2% from baseline)       │    │
│  │  Branch: Model Architecture (Transformer)     │    │
│  └──────────────────────────────────────────────┘    │
│                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ Deploy → │ │ Retrain  │ │ Improve  │             │
│  │ 모델 발행 │ │ 설정 변경 │ │ 추가 학습 │             │
│  └──────────┘ └──────────┘ └──────────┘             │
│                                                       │
│  코드 미리보기 · 브랜치별 성적 · 실험 로그              │
│                                                       │
│  ── 모델 등록 (Member only) ─────────────────────    │
│  [모델 발행 →]  [내 모델에서 보기 →]                   │
│                                                       │
│                              [새 연구 시작하기 →]      │
└──────────────────────────────────────────────────────┘
```

- Based on ContextPanel CompletePanel expansion
- [Deploy] → Models > ModelDetail
- [Retrain] → CREATE (existing config loaded)
- [Improve] → CREATE (improvement config)
- [새 연구] → jobStore.reset() → IDLE
- Member-only: model publishing UI (VTR hidden, shown as "모델 인증 완료")

---

## 3. Models Tab (/models)

### 3.1 ModelsPage — Minimal changes

```
┌──────────────────────────────────────────────────────┐
│  Models                                  [New Research]│
│                                                       │
│  [검색]  [All] [Prediction] [Classification] [NLP]   │
│                                                       │
│  Trending                                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                │
│  │spam  │ │eth   │ │kor-qa│ │image │                │
│  │0.94F1│ │0.023M│ │1.082b│ │0.91ac│                │
│  │● LIVE│ │● LIVE│ │○ DRFT│ │● LIVE│                │
│  │47call│ │12call│ │—     │ │156cal│                │
│  └──────┘ └──────┘ └──────┘ └──────┘                │
│                                                       │
│  내가 사용 중 (Member)                                 │
│  spam-v2 · 이번 주 47회 · -0.3 HOOT                  │
│                                                       │
│  내가 만든 (Builder Member)                            │
│  kor-qa · ● ACTIVE · +2.1 HOOT                       │
└──────────────────────────────────────────────────────┘
```

**Changes from current:**
- "New Research" → router.navigate('studio')
- Model card adds: status badge (DRAFT/ACTIVE), usage count, earnings
- Guest: search + trending (read-only playground)
- Member: + "내가 사용 중" + "내가 만든" sections

### 3.2 ModelDetailPage — Minimal changes

Existing 5 tabs preserved: Card / Experiments / Benchmark / Playground / API

**Changes:**
- Breadcrumb: Magnet Studio / Models / [slug]
- Card tab: add model status section (plain language, not VTR)
- Add Usage tab: calls, revenue, settlement history
- Guest: Playground read-only
- Member: Deploy/Download/Fork + x402 calls

---

## 4. Network Tab (/network)

### 4.1 NetworkView — Observatory + Light Management

```
┌──────────────────────────────┬───────────────────────┐
│  Globe (MeshCanvas)          │  Network Stats         │
│                              │  ● 847 nodes           │
│                              │  ● 12 active jobs      │
│                              │  ● 3.2M HOOT TVL       │
│                              │                        │
│  NetworkHUD                  │  실시간 활동            │
│                              │  Job #4521 완료         │
│                              │  Node 0x4a 접속         │
│                              │                        │
│                              │  ── 내 노드 ──         │
│                              │  RTX 4090 ● ON         │
│                              │  47 jobs · +4.2H       │
│                              │  [Hoot Browser에서      │
│                              │   관리 →]              │
│                              │                        │
│                              │  ── 가용 Job ──        │
│                              │  eth-ts  Tier2+ 8H     │
│                              │  spam-v3 Tier1+ 3H     │
│                              │  [Claim →]             │
│                              │                        │
│                              │  ── Bond ──            │
│                              │  Tier 2 · 2,000 H      │
│                              │  Trust: 87/100          │
└──────────────────────────────┴───────────────────────┘
```

- InfoBar shown on this page
- Globe + HUD: existing MeshCanvas + NetworkHUD
- Right panel segments: Stats / Feed / My Node / Jobs / Bond
- "My Node" shows summary. Deep management → Hoot Browser deeplink.
- Job Claim inline (existing ClaimModal reuse)
- Guest: Globe + HUD read-only. Claim/Bond buttons disabled.
- Member: Full interaction.

**Changes from current:**
- Add "가용 Job" section with Claim
- Add "내 노드" summary (when GPU connected)
- Add PoAW block contribution counter
- Trust Score with recovery formula display

---

## 5. Protocol Tab (/protocol)

### 5.1 EconomicsPage — Metrics + Participation + Earnings

```
┌──────────────────────────────────────────────────────┐
│  HOOT Protocol                                        │
│  [TVL] [Burned] [Treasury] [Bonds] [MAU→Deflation]   │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ── 내 활동 (Member only) ──────────────────────     │
│  ┌────────────────────────────────────────────┐      │
│  │ Builder   +12.4H  3 models active          │      │
│  │ Compute   +4.2H   47 jobs done             │      │
│  │ Data      3 PPAP  confirmed                │      │
│  │ ───────── +16.6H  순수익 ────────          │      │
│  └────────────────────────────────────────────┘      │
│                                                       │
│  ── Operations ──────────────────────────────────    │
│  BurnPanel · JobCreatorPanel                          │
│                                                       │
│  ── Analytics ───────────────────────────────────    │
│  TokenFlowPanel · PPAPPipeline · Reward Distribution │
│                                                       │
│  ── Events ──────────────────────────────────────    │
│  Protocol Events feed                                 │
│                                                       │
│  ── Your Journey ────────────────────────────────    │
│  (existing component)                                 │
└──────────────────────────────────────────────────────┘
```

- InfoBar shown on this page
- "내 활동" = unified earnings dashboard (all pools combined)
- Guest: Metrics + Analytics read-only. Operations disabled.
- Member: Full operations + personal activity view.

**Changes from current:**
- Add "내 활동" section (unified earnings across all roles)
- Add PPAP status section (Contributor journey D2/D3/D4)
- Verifier events visible but deep actions → Hoot Browser deeplink

---

## 6. Agent Dock — Technical Spec

### 6.1 Component: AgentDock.svelte (replaces AppDock.svelte)

```typescript
// Props
interface AgentDockProps {
  // inherits from dashboardStore for status icon data
}

// State
let inputValue = '';
let sheetOpen = false;
let sheetMessages: AgentMessage[] = [];

// Types
interface AgentMessage {
  role: 'user' | 'agent';
  content: string;
  cards?: AgentCard[];
  actions?: AgentAction[];
}

interface AgentCard {
  type: 'model' | 'research' | 'gpu' | 'earnings' | 'branch';
  data: Record<string, any>;
}

interface AgentAction {
  label: string;
  handler: () => void; // navigate, start research, etc.
}
```

### 6.2 Status Icons (from dashboardStore)

```typescript
const statusItems = [
  { icon: '🔬', value: $dashboardStore.runningCount, view: 'studio' },
  { icon: '📦', value: $dashboardStore.modelsSummary.count, view: 'models' },
  { icon: '🌐', value: $dashboardStore.networkSummary.nodes, view: 'network' },
  { icon: '💰', value: formatCurrency($dashboardStore.protocolSummary.tvl), view: 'protocol' },
];
```

### 6.3 Sheet Positioning

```css
.agent-sheet {
  position: fixed;
  bottom: var(--dock-height);  /* sits above dock */
  left: 50%;
  transform: translateX(-50%);
  width: min(600px, 90vw);
  max-height: 70vh;
  overflow-y: auto;
  z-index: var(--z-sheet);
  border-radius: 16px 16px 0 0;
  backdrop-filter: blur(20px);
  transition: transform 0.3s ease;
}
```

### 6.4 Agent Response Rendering

Agent responses render as rich cards, not plain text:

```svelte
{#each sheetMessages as msg}
  {#if msg.role === 'agent'}
    <div class="agent-bubble">
      <p>{msg.content}</p>
      {#each msg.cards ?? [] as card}
        {#if card.type === 'model'}
          <ModelMiniCard data={card.data} on:click={() => navigateToModel(card.data.id)} />
        {:else if card.type === 'research'}
          <ResearchSetupCard data={card.data} on:start={handleStartResearch} />
        {:else if card.type === 'gpu'}
          <GpuStatusCard data={card.data} on:detail={() => router.navigate('network')} />
        {:else if card.type === 'earnings'}
          <EarningsSummaryCard data={card.data} on:detail={() => router.navigate('protocol')} />
        {/if}
      {/each}
      {#each msg.actions ?? [] as action}
        <button on:click={action.handler}>{action.label}</button>
      {/each}
    </div>
  {:else}
    <div class="user-bubble">{msg.content}</div>
  {/if}
{/each}
```

---

## 7. Widget System

### 7.1 Default: All OFF

```typescript
// widgetDefaults.ts change
// All widgets: visible: false by default
```

### 7.2 Widget Add Panel (via ⚙ in dock)

```
⚙ 클릭 →
┌──────────────────────────────┐
│  위젯 추가                    │
│                              │
│  연구                        │
│  □ Research Metrics          │
│  □ Research Jobs             │
│  □ Findings                  │
│  □ Event Log                 │
│                              │
│  인프라                       │
│  □ Network Status            │
│                              │
│  프로토콜                     │
│  □ Ecosystem                 │
│                              │
│  포트폴리오 (지갑 필요) 🔒     │
│  □ My Models                 │
│  □ My Bonds                  │
│                              │
│  [초기화]                     │
└──────────────────────────────┘
```

- Widgets shown only on Studio IDLE (hidden during RUNNING/SETUP/CREATE/COMPLETE)
- Portfolio widgets: Member only (🔒 for Guest)
- Existing drag/resize functionality preserved

---

## 8. Cross-Page Navigation Map

```
Studio IDLE
├── Running research click → Studio RUNNING
├── Activity card (GPU) → Network tab
├── Activity card (Models) → Models tab
├── Activity card (Earnings) → Protocol tab
├── [+ New] → Studio CREATE / SETUP
└── Widget double-click → related tab

Studio CREATE
├── [시작하기] → Studio RUNNING
├── [세부 설정] → Studio SETUP (Stage 3+)
├── [←] → Studio IDLE
└── Wallet CTA → wallet connect flow

Studio RUNNING
├── [Stop] → Studio IDLE
├── [New Research] → Studio IDLE
├── [Semantic Zoom] → /research-lab
├── Completion → Studio COMPLETE
└── Agent Dock query → Sheet overlay

Studio COMPLETE
├── [Deploy] → Models > ModelDetail
├── [Retrain] → Studio CREATE (existing config)
├── [Improve] → Studio CREATE (improve config)
├── [New Research] → Studio IDLE
└── [모델 발행] → Models > ModelDetail (Member)

Models
├── Model card click → ModelDetail
├── [New Research] → Studio IDLE
└── ModelDetail > Fork → Studio SETUP

Network
├── Job Claim → ClaimModal (inline)
├── [Hoot Browser에서 관리] → external deeplink
└── Bond action → ContractCallModal

Protocol
├── Event click → ContractCallModal
├── Burn/Job creation → ContractCallModal
└── Earnings detail → per-source breakdown

Agent Dock (any page)
├── Research query → Sheet with setup card → Studio RUNNING
├── Model query → Sheet with model cards → Models
├── Status query → Sheet with summary → relevant tab
└── Esc / swipe down → Sheet close
```

---

## 9. File Structure

```
src-svelte/lib/
├── pages/
│   ├── MagnetStudioPage.svelte     ← NEW (state machine)
│   ├── ModelsPage.svelte           ← navigate fix only
│   ├── ModelDetailPage.svelte      ← breadcrumb fix only
│   ├── NetworkView.svelte          ← add Job Queue, My Node summary
│   ├── EconomicsPage.svelte        ← add 내 활동 section
│   ├── ResearchZoomLabPage.svelte  ← back link fix only
│   └── PipelinePage.svelte         ← no change
│
├── components/studio/               ← NEW folder
│   ├── StudioIdle.svelte            ← Activity-First (Guest/Member)
│   ├── StudioCreate.svelte          ← Topic + AI reco + resource select
│   ├── OntologySetup.svelte         ← Extracted from OntologyPage
│   ├── ResearchRunning.svelte       ← Extracted from AutoresearchPage
│   ├── ResearchComplete.svelte      ← Extended from CompletePanel
│   └── ActivityCard.svelte          ← Reusable activity card
│
├── components/agent/                ← NEW folder
│   ├── AgentDock.svelte             ← Bottom dock with input + icons
│   ├── AgentSheet.svelte            ← Bottom sheet overlay
│   ├── AgentBubble.svelte           ← Message bubble
│   ├── ModelMiniCard.svelte         ← Rich card for model results
│   ├── ResearchSetupCard.svelte     ← Rich card for research setup
│   ├── GpuStatusCard.svelte         ← Rich card for GPU status
│   └── EarningsSummaryCard.svelte   ← Rich card for earnings
│
├── components/                       (existing — preserved)
│   ├── HeroSection.svelte           ← used in StudioIdle Guest
│   ├── InfoBar.svelte               ← used in Network + Protocol only
│   ├── DashboardGrid.svelte         ← used in StudioIdle Member (partial)
│   ├── WidgetContainer.svelte       ← preserved
│   ├── ContextPanel.svelte          ← preserved (Running/Complete)
│   ├── PromptBar.svelte             ← preserved
│   ├── OntologyBranchCard.svelte    ← preserved
│   ├── ContractCallModal.svelte     ← preserved
│   ├── research/                    ← preserved
│   └── widgets/                     ← preserved
│
├── stores/
│   ├── studioStore.ts               ← NEW (phase management)
│   ├── agentStore.ts                ← NEW (agent state + messages)
│   ├── router.ts                    ← AppView type update
│   ├── stageStore.ts                ← STAGE_PAGES update
│   ├── jobStore.ts                  ← no change
│   ├── dashboardStore.ts            ← remove navigate calls
│   ├── widgetStore.ts               ← no change
│   ├── walletStore.ts               ← no change
│   ├── connectionStore.ts           ← no change
│   └── selectionStore.ts            ← no change
│
├── data/
│   ├── ontologyData.ts              ← no change
│   ├── widgetDefaults.ts            ← all visible: false
│   └── (rest unchanged)
│
├── layout/
│   ├── NavBar.svelte                ← 4-Tab + progress ring
│   └── SiteFooter.svelte            ← no change
│
└── App.svelte                        ← pageLoaders + guard update

DELETE:
  pages/DashboardPage.svelte
  pages/AutoresearchPage.svelte
  pages/OntologyPage.svelte
  components/AppDock.svelte
  components/research/OnboardingPanel.svelte
```

---

## 10. New Stores

### 10.1 studioStore.ts

```typescript
export type StudioPhase = 'idle' | 'create' | 'setup' | 'running' | 'complete';

interface StudioState {
  phase: StudioPhase;
  createTopic: string;
  createPreset: string | null;
  resourceMode: 'demo' | 'local' | 'network' | 'hybrid';
  forkSource: string | null;
}

export const studioStore = {
  subscribe,
  setPhase: (phase: StudioPhase) => void,
  setTopic: (topic: string) => void,
  setPreset: (presetId: string) => void,
  setResourceMode: (mode: ResourceMode) => void,
  reset: () => void,
};
```

### 10.2 agentStore.ts

```typescript
interface AgentState {
  messages: AgentMessage[];
  sheetOpen: boolean;
  loading: boolean;
}

export const agentStore = {
  subscribe,
  send: (input: string) => Promise<void>,  // process input, generate response
  closeSheet: () => void,
  clearMessages: () => void,
};
```

---

## 11. Implementation Phases

### Phase 1: Foundation (build must pass at each step)

```
1. router.ts — Add 'studio' to AppView, update ROUTE_MAP
2. stageStore.ts — Update STAGE_PAGES with 'studio'
3. App.svelte — Update pageLoaders, guard, eager load
4. NavBar.svelte — 4-Tab (Studio/Models/Network/Protocol) + progress ring
5. Commit + verify build
```

### Phase 2: Agent Dock (replaces AppDock)

```
6. AgentDock.svelte — Input + status icons (no sheet yet)
7. AgentSheet.svelte — Bottom sheet component
8. agentStore.ts — Basic state management
9. Replace AppDock references in App.svelte / DashboardPage.svelte
10. Commit + verify build
```

### Phase 3: Component Extraction (extract, don't modify)

```
11. OntologySetup.svelte — Extract from OntologyPage (remove header only)
12. ResearchRunning.svelte — Extract from AutoresearchPage running layout
13. ResearchComplete.svelte — Extract from CompletePanel
14. Commit + verify build
```

### Phase 4: Studio Page

```
15. studioStore.ts — Phase management
16. StudioIdle.svelte — Activity-First (Guest/Member)
17. StudioCreate.svelte — Topic + AI reco + resource select
18. ActivityCard.svelte — Reusable card component
19. MagnetStudioPage.svelte — State machine (IDLE/CREATE/SETUP/RUNNING/COMPLETE)
20. Commit + verify build
```

### Phase 5: Wiring + Tab Updates

```
21. widgetDefaults.ts — All visible: false
22. All router.navigate calls updated (dashboard→studio, research→studio, etc.)
23. ModelsPage.svelte — navigate fix
24. ModelDetailPage.svelte — breadcrumb fix
25. ResearchZoomLabPage.svelte — back link fix
26. dashboardStore.ts — Remove navigate calls, keep store
27. NetworkView.svelte — Add Job Queue, My Node summary
28. EconomicsPage.svelte — Add 내 활동 section
29. Commit + verify build
```

### Phase 6: Cleanup

```
30. Delete: DashboardPage.svelte
31. Delete: AutoresearchPage.svelte
32. Delete: OntologyPage.svelte
33. Delete: AppDock.svelte
34. Delete: OnboardingPanel.svelte
35. Legacy redirect verification
36. Full flow test (IDLE → CREATE → RUNNING → COMPLETE → Models → Network → Protocol)
37. Commit + verify build
```

---

## 12. Migration Safety Rules

- Each phase ends with `npm run build` pass
- Each file change = individual commit (per CLAUDE.md rules)
- Old pages kept alive until Phase 6 (parallel existence)
- dashboardStore stays — only navigation calls removed
- jobStore unchanged — consumed as-is by ResearchRunning
- widgetStore unchanged — just default visibility flipped
- No store interface changes — only consumers rewired
