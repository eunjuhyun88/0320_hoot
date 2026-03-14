# Page Redesign Spec — Protocol-Aligned UI Architecture

> Based on: State Machine v2.5, Fee Design v1.0, Tokenomics v1.9, User Journey L1 v1.0

## 0. 설계 원칙

**페이지 = 프로토콜 객체 + 사용자 액션의 교차점**

기존 문제: 데이터 카테고리(모델/네트워크/이코노믹스)로 나눴더니 흐름이 끊김.
해결: 프로토콜 상태 전이를 따라가는 액션 중심 페이지.

5 Actors × 6 Journeys → **5 Pages**로 매핑:

| Page | Primary Journey | Protocol Objects | Actor |
|---|---|---|---|
| Dashboard | 전체 | 모든 객체 요약 | 모두 |
| Research | D (Builder) | ResearchJob + PPAPRecord | Builder + Contributor |
| Models | D→E (Builder→Buyer) | VTR + ModelRights + UsageSettlement | Builder + Buyer |
| Network | C (Compute) | NodeCapacity + ResearchJob(queue) | Compute Node |
| Protocol | B (Verifier) + 경제 | NodeBond + Pool A/B + BundleAsset | Notary + 모두 |

---

## 1. Dashboard — 개인 허브

### 역할
모든 Actor의 현재 상태를 한눈에. "지금 나한테 뭐가 일어나고 있는지."

### 시각화 구성

```
┌─────────────────────────────────────────────────────┐
│ Dashboard                                            │
│                                                      │
│ ┌─ My Status Card ─────────────────────────────────┐ │
│ │ Wallet: 0x1234...5678  ·  Trust Score: 87        │ │
│ │ Tier 2 (2,000 HOOT bonded)  ·  Balance: 12,450  │ │
│ │ Role: Builder + Compute                           │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─ Active Items ───────────────────────────────────┐ │
│ │ 🔬 2 Research Jobs running                       │ │
│ │    └ "Crypto 24h" — EXECUTING (67%)   [보기]     │ │
│ │    └ "DeFi Risk"  — OPEN (GPU 대기)   [보기]     │ │
│ │ 📦 3 Models published                            │ │
│ │    └ crypto-24h-v2 — 12 calls today              │ │
│ │ 🖥 1 Node active                                  │ │
│ │    └ seoul-4090 — Job #2891 실행 중              │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─ Earnings ────────┐ ┌─ Protocol Activity ────────┐ │
│ │ Today   +3.2 HOOT │ │ 📊 TVL: $12.4M            │ │
│ │ 7 days +18.7 HOOT │ │ 🔥 Burned: 847K           │ │
│ │ Total  +142 HOOT  │ │ 👥 MAU: 892               │ │
│ │                   │ │ 📡 Active Nodes: 48        │ │
│ │ [보상 히스토리]    │ │ 📝 Open Jobs: 12          │ │
│ └───────────────────┘ └────────────────────────────┘ │
│                                                      │
│ ┌─ Recent Events (onchain) ────────────────────────┐ │
│ │ 2m ago  PPAPConfirmed — batch #2891              │ │
│ │ 5m ago  ConfigRevealed — exp #147 keep           │ │
│ │ 8m ago  SettlementExecuted — +0.8 HOOT           │ │
│ └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 데이터 소스
- walletStore: 잔액, 연결 상태
- jobStore: 진행 중 Job
- 온체인 이벤트 피드: 21개 이벤트 중 내 관련 필터

---

## 2. Research (Magnet) — 만들기

### 역할
Builder Journey 전체. "토픽 입력 → Job 생성 → 실험 → 모델 생성까지."
Job은 여기서 자동 생성. 별도 Job 페이지 불필요.

### ResearchJob 상태 전이 시각화

```
DRAFT → PUBLISHED → OPEN → EXECUTING → EVALUATING → COMPLETED
                                                        ↓
                                                   VTR → ModelNFT
```

### 화면 구성

#### Phase 1: 시작 전 (DRAFT)

```
┌─────────────────────────────────────────────────────┐
│ 🔬 Magnet Research                                   │
│                                                      │
│ ┌─ New Research ──────────────────────────────────┐  │
│ │ Research Topic                                   │  │
│ │ ┌───────────────────────────────────────────┐   │  │
│ │ │ Ethereum price prediction using...        │   │  │
│ │ └───────────────────────────────────────────┘   │  │
│ │                                                  │  │
│ │ Base Model: [GPT-2 Small ▾]                     │  │
│ │ Dataset:    [Upload / IPFS CID]                 │  │
│ │ Budget:     [50 HOOT]  Est. cost: ~2.4 HOOT     │  │
│ │ Deadline:   [24h ▾]                              │  │
│ │                                                  │  │
│ │ Tier Discount: Tier2 → $0.018/run (80% off)     │  │
│ │                                                  │  │
│ │        [▶ Launch Research]                       │  │
│ │ → Job will be auto-created and published         │  │
│ └──────────────────────────────────────────────────┘  │
│                                                      │
│ ┌─ Quick Presets ─────────────────────────────────┐  │
│ │ Crypto Market Prediction                        │  │
│ │ DeFi Protocol Risk                              │  │
│ │ Fraud Detection                                 │  │
│ └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

#### Phase 2: Job 생성됨 → GPU 대기 (PUBLISHED → OPEN)

```
┌─────────────────────────────────────────────────────┐
│ 🔬 Research: "Crypto 24h Prediction"                 │
│                                                      │
│ ┌─ Job Status Banner ─────────────────────────────┐  │
│ │ 📋 Job #2891                                     │  │
│ │ State: OPEN — waiting for GPU nodes              │  │
│ │                                                  │  │
│ │ ┌─ State Flow ────────────────────────────────┐  │  │
│ │ │ DRAFT → PUBLISHED → [OPEN] → EXECUTING     │  │  │
│ │ │  ✓        ✓         ● ←you                 │  │  │
│ │ └─────────────────────────────────────────────┘  │  │
│ │                                                  │  │
│ │ Budget: 50 HOOT (escrowed)                      │  │
│ │ Required: 4 GPUs  ·  Deadline: 23h 42m left     │  │
│ │ Claimed: 0/4 nodes                               │  │
│ │                                                  │  │
│ │ ⏳ Waiting for compute nodes to claim...         │  │
│ │ 12 nodes available in network                    │  │
│ └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

#### Phase 3: 실행 중 (EXECUTING)

```
┌─────────────────────────────────────────────────────┐
│ 🔬 Research: "Crypto 24h Prediction"                 │
│                                                      │
│ ┌─ Job Status ────────────────────────────────────┐  │
│ │ 🟢 EXECUTING  ·  Job #2891  ·  3 nodes active   │  │
│ │ Budget: 47.6/50 HOOT remaining  ·  18h left      │  │
│ │ seoul-4090 ✓ · tokyo-4090 ✓ · berlin-a100 ✓     │  │
│ └──────────────────────────────────────────────────┘  │
│                                                      │
│ ┌─ Experiment Stream ────┐ ┌─ Metric Convergence ──┐ │
│ │ #12 keep  lr=0.001     │ │      ▲                 │ │
│ │   1.231 bpb  +0.012    │ │  ~~~~/\~~~▲            │ │
│ │ #11 disc dropout=0.3   │ │ /                      │ │
│ │   1.243 bpb  -0.004    │ │/                       │ │
│ │ #10 keep  batch=64     │ │──────────► exp         │ │
│ │   1.239 bpb  +0.008    │ │                        │ │
│ │                        │ │ Best: 1.231 bpb        │ │
│ │ Commit-Reveal:         │ │ Target: < 1.200        │ │
│ │  ■ committed  3        │ └────────────────────────┘ │
│ │  ■ revealed   2        │                            │
│ │  ■ verified   7        │ ┌─ Category Heatmap ─────┐ │
│ │  ■ spot-check 1        │ │ lr        ███░░  60%   │ │
│ └────────────────────────┘ │ dropout   ██░░░  40%   │ │
│                            │ batch     ████░  80%   │ │
│ ┌─ Branch Tree ──────────┐ │ arch      █░░░░  20%   │ │
│ │     main               │ └────────────────────────┘ │
│ │    / | \               │                            │
│ │  lr drop batch         │ ┌─ PPAP Pipeline ────────┐ │
│ │  /\   |   \            │ │ Batch #2891            │ │
│ │ 3  2  1    4           │ │ POSTED → CHALLENGE     │ │
│ └────────────────────────┘ │ ████████░░  16h left    │ │
│                            └────────────────────────┘ │
│                                                       │
│ ┌─ Cost Tracker ──────────────────────────────────┐   │
│ │ Spent: 2.4 HOOT  ·  12 runs × $0.018/run       │   │
│ │ Pool B distribution: GPU 95% / Treasury 5%      │   │
│ │ Per-node earnings: seoul +0.8 / tokyo +0.6      │   │
│ └─────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────┘
```

#### Phase 4: 완료 (COMPLETED → VTR → ModelNFT)

```
┌─────────────────────────────────────────────────────┐
│ 🔬 Research: "Crypto 24h Prediction"                 │
│                                                      │
│ ┌─ Completed ─────────────────────────────────────┐  │
│ │ ✅ COMPLETED  ·  Job #2891                       │  │
│ │ Duration: 4h 23m  ·  Total cost: 2.4 HOOT       │  │
│ │ Experiments: 147 total / 48 kept / 92 discarded  │  │
│ │ Best metric: 1.231 val_bpb                       │  │
│ │                                                  │  │
│ │ ┌─ VTR Status ──────────────────────────────┐    │  │
│ │ │ training_seed: ✓ provided                  │    │  │
│ │ │ base_model: GPT-2 Small (verified)         │    │  │
│ │ │ ckpt_hash: 0xa1b2...c3d4                   │    │  │
│ │ │ ppap_root_ref: batch #2891 (CONFIRMED)     │    │  │
│ │ │ Grade: DETERMINISTIC  ·  ν(M) = 0          │    │  │
│ │ └───────────────────────────────────────────┘    │  │
│ │                                                  │  │
│ │ [Mint ModelNFT]  [Export Results]  [New Research] │  │
│ └──────────────────────────────────────────────────┘  │
│                                                      │
│ ┌─ Results Summary ──────────────────────────────┐   │
│ │ Top 5 configs:                                  │   │
│ │ 1. lr=0.001 + batch=64        1.231 bpb  keep  │   │
│ │ 2. lr=0.0005 + dropout=0.1    1.238 bpb  keep  │   │
│ │ 3. arch=wider + lr=0.001      1.242 bpb  keep  │   │
│ │ ...                                             │   │
│ │                                                 │   │
│ │ Node contributions:                             │   │
│ │ seoul-4090:  52 runs  ·  earned 0.95 HOOT       │   │
│ │ tokyo-4090:  48 runs  ·  earned 0.82 HOOT       │   │
│ │ berlin-a100: 47 runs  ·  earned 0.63 HOOT       │   │
│ └─────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────┘
```

### 모바일 (≤600px)
기존 세그먼트 컨트롤 유지: [Status] [Experiments] [Charts]

---

## 3. Models — 결과물 + 사용

### 역할
ModelRights 라이프사이클 전체. 탐색 + 내 모델 관리 + 추론(UsageSettlement).

### ModelRights 상태 전이

```
DRAFT → MINTED → PRIVATE_ACTIVE / NETWORK_ACTIVE → DEPRECATED
                                    ↕
                                  DISPUTED → FROZEN
```

### 화면 구성

#### 세그먼트: [Explore] [My Models] [Inference]

```
┌─────────────────────────────────────────────────────┐
│ 📦 Models                                            │
│                                                      │
│ [Explore]  [My Models]  [Inference]                  │
│                                                      │
│ ═══ Explore ═════════════════════════════════════════ │
│                                                      │
│ 🔍 Search models...        [Category ▾] [Sort ▾]    │
│                                                      │
│ ┌─ Model Card ─────────────────────────────────────┐ │
│ │ 🏷 hoot/crypto-24h-v3                            │ │
│ │ Crypto Market 24h Prediction                     │ │
│ │                                                  │ │
│ │ Metric: 1.231 bpb  ·  147 experiments            │ │
│ │ VTR: DETERMINISTIC  ·  Trust: ●●●●○              │ │
│ │ Creator: 0x1234...  ·  ♥ 38  ·  ↓ 1,243         │ │
│ │                                                  │ │
│ │ Inference pricing:                               │ │
│ │   $0.20 / 1M tokens  ·  Free: 1,000 calls (T1)  │ │
│ │                                                  │ │
│ │ Pool A split: Creator 60% / Notary 15% /         │ │
│ │               Treasury 15% / Burn 10%            │ │
│ │                                                  │ │
│ │ [Use Model]  [View Details]  [Fork & Train]      │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ═══ My Models ═══════════════════════════════════════ │
│                                                      │
│ ┌─ My Model Row ───────────────────────────────────┐ │
│ │ crypto-24h-v3                                    │ │
│ │ State: NETWORK_ACTIVE  ·  Minted: 3 days ago     │ │
│ │                                                  │ │
│ │ ┌─ Origin ─────────────────────────────────────┐ │ │
│ │ │ Job #2891 → COMPLETED                        │ │ │
│ │ │ 147 experiments  ·  Cost: 2.4 HOOT           │ │ │
│ │ │ Nodes: seoul-4090, tokyo-4090, berlin-a100   │ │ │
│ │ └──────────────────────────────────────────────┘ │ │
│ │                                                  │ │
│ │ ┌─ Usage Stats ────────────────────────────────┐ │ │
│ │ │ Today: 12 calls  ·  Revenue: 0.48 HOOT       │ │ │
│ │ │ Total: 1,243 calls  ·  Total earned: 14.2H   │ │ │
│ │ │ ~~~usage sparkline~~~                         │ │ │
│ │ └──────────────────────────────────────────────┘ │ │
│ │                                                  │ │
│ │ ┌─ Experiment History ─────────────────────────┐ │ │
│ │ │ ~~~metric convergence sparkline~~~            │ │ │
│ │ │ 48 kept / 92 discarded / 7 crashed            │ │ │
│ │ │ Best: lr=0.001, batch=64 → 1.231 bpb         │ │ │
│ │ └──────────────────────────────────────────────┘ │ │
│ │                                                  │ │
│ │ [View Full History]  [Run Inference]  [Deprecate] │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ═══ Inference (Running) ═════════════════════════════ │
│                                                      │
│ ┌─ Active Inference ───────────────────────────────┐ │
│ │ 🟢 crypto-24h-v3                                 │ │
│ │ Route: ROUTED_NETWORK  ·  Node: tokyo-4090       │ │
│ │ State: EXECUTING  ·  Metered: 2,341 tokens       │ │
│ │ Cost: ~0.0005 HOOT                                │ │
│ │                                                  │ │
│ │ Settlement preview:                              │ │
│ │   Creator (you): $0.12  ·  Notary: $0.03         │ │
│ │   Treasury: $0.03  ·  Burn: $0.02                │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─ Inference History ──────────────────────────────┐ │
│ │ 3/15 14:30  crypto-24h  SETTLED  0.02 HOOT       │ │
│ │ 3/15 14:22  defi-risk   SETTLED  0.01 HOOT       │ │
│ │ 3/15 13:00  crypto-24h  SETTLED  0.03 HOOT       │ │
│ └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Model Detail Page (확장)

```
┌─────────────────────────────────────────────────────┐
│ Models / hoot/crypto-24h-v3                          │
│                                                      │
│ [Card] [Experiments] [Benchmark] [Usage] [API]       │
│                                                      │
│ ═══ Experiments Tab ═════════════════════════════════ │
│                                                      │
│ ┌─ Origin Job ─────────────────────────────────────┐ │
│ │ Job #2891  ·  COMPLETED  ·  Duration: 4h 23m     │ │
│ │ Nodes: 3 (seoul-4090, tokyo-4090, berlin-a100)   │ │
│ │ Total cost: 2.4 HOOT  ·  Pool B: GPU 95% / T 5% │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─ VTR Certificate ───────────────────────────────┐  │
│ │ Grade: DETERMINISTIC                             │  │
│ │ base_model: GPT-2 Small (BaseModelRegistry ✓)   │  │
│ │ dataset_ref: ipfs://Qm...abc                    │  │
│ │ training_seed: 42                                │  │
│ │ ckpt_hash: 0xa1b2...c3d4                        │  │
│ │ ppap_root_ref: batch #2891 → CONFIRMED          │  │
│ │ Reproducibility: ν(M) = 0 ✓                     │  │
│ └─────────────────────────────────────────────────┘  │
│                                                      │
│ ┌─ Experiment Log (scrollable) ───────────────────┐  │
│ │ #  Status  Modification     Metric   Δ     Node  │  │
│ │ 147 keep  lr=0.001        1.231  +0.012  seoul  │  │
│ │ 146 disc  dropout=0.3     1.243  -0.004  tokyo  │  │
│ │ 145 keep  batch=64        1.239  +0.008  berlin │  │
│ │ 144 crash arch=deep       —      —       seoul  │  │
│ │ ...                                              │  │
│ └─────────────────────────────────────────────────┘  │
│                                                      │
│ ┌─ Metric Charts ─────────────────────────────────┐  │
│ │ [Convergence Curve] [Category Heatmap] [Tree]   │  │
│ │                                                  │  │
│ │        ▲ metric                                  │  │
│ │   ~~~~/ \~~~~/\~~~~▲                             │  │
│ │  /                                               │  │
│ │ /                                                │  │
│ │ ────────────────────► experiments                 │  │
│ └─────────────────────────────────────────────────┘  │
│                                                      │
│ ═══ Usage Tab ═══════════════════════════════════════ │
│                                                      │
│ ┌─ Revenue Dashboard ─────────────────────────────┐  │
│ │ Total Revenue: 14.2 HOOT                        │  │
│ │ Your share (Creator 60%): 8.52 HOOT             │  │
│ │                                                  │  │
│ │ ┌─ Pool A Distribution ──────────────────────┐  │  │
│ │ │ Creator  ████████████░░  60%  8.52 HOOT    │  │  │
│ │ │ Notary   ███░░░░░░░░░░  15%  2.13 HOOT    │  │  │
│ │ │ Treasury ███░░░░░░░░░░  15%  2.13 HOOT    │  │  │
│ │ │ Burn     ██░░░░░░░░░░░  10%  1.42 HOOT    │  │  │
│ │ └───────────────────────────────────────────┘  │  │
│ │                                                  │  │
│ │ ┌─ Usage Timeline ──────────────────────────┐    │  │
│ │ │ ~~~daily calls bar chart~~~                │    │  │
│ │ └───────────────────────────────────────────┘    │  │
│ └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 4. Network — 인프라 + 마켓

### 역할
Compute Node Journey. GPU 제공자의 허브.
"내 노드 관리 + Job 찾기 + 매칭 + 실행 + 보상."

### NodeCapacity 상태 전이

```
DISCONNECTED → CONNECTED → AVAILABLE → CLAIMED → EXECUTING
                                                     ↓
                                         SUBMITTED → VERIFIED → AVAILABLE
                                                     ↓
                                                  DISPUTED → PENALIZED → AVAILABLE/BLOCKED
```

### 화면 구성

#### 세그먼트: [Mesh Map] [Job Queue] [My Nodes]

```
┌─────────────────────────────────────────────────────┐
│ 🌐 Network                                          │
│                                                      │
│ [Mesh Map]  [Job Queue]  [My Nodes]                  │
│                                                      │
│ ═══ Mesh Map ════════════════════════════════════════ │
│                                                      │
│ ┌─ MeshCanvas (기존 3D 시각화 유지) ──────────────┐  │
│ │       🌍                                         │  │
│ │    seoul ● ─── tokyo ●                           │  │
│ │         \       /                                │  │
│ │    mumbai ● ── singapore ●                       │  │
│ │              \                                   │  │
│ │         berlin ● ── dubai ●                      │  │
│ │                                                  │  │
│ │  Nodes: 48  ·  GPUs: 192  ·  Active Jobs: 12    │  │
│ │  Training: 8  ·  Inference: 3  ·  Both: 1       │  │
│ └──────────────────────────────────────────────────┘  │
│                                                      │
│ ┌─ Network HUD ───────────────────────────────────┐  │
│ │ Avg Trust Score: 87  ·  Spot-check pass: 98.2%  │  │
│ │ Total bonded: 124,000 HOOT                      │  │
│ │ Pool B distributed (7d): 42.3 HOOT              │  │
│ └──────────────────────────────────────────────────┘  │
│                                                      │
│ ═══ Job Queue (Provider 뷰) ═════════════════════════ │
│                                                      │
│ ┌─ Available Jobs ─────────────────────────────────┐ │
│ │ [Training Only] [Inference Only] [All]            │ │
│ │                                                  │ │
│ │ ┌─ Job Card ──────────────────────────────────┐  │ │
│ │ │ 🟡 OPEN  ·  Job #2893                       │  │ │
│ │ │ "DeFi protocol risk classification"         │  │ │
│ │ │                                             │  │ │
│ │ │ Type: Training (XGBoost)                    │  │ │
│ │ │ Required: Tier 1+ (500 HOOT bond)           │  │ │
│ │ │ GPUs needed: 2 more                         │  │ │
│ │ │ Budget remaining: 48 HOOT                   │  │ │
│ │ │ Deadline: 22h left                          │  │ │
│ │ │                                             │  │ │
│ │ │ Est. reward: ~1.8 HOOT (Pool B 95%)         │  │ │
│ │ │ Est. duration: ~2h                          │  │ │
│ │ │                                             │  │ │
│ │ │ [Claim This Job]                            │  │ │
│ │ └─────────────────────────────────────────────┘  │ │
│ │                                                  │ │
│ │ ┌─ Inference Request ─────────────────────────┐  │ │
│ │ │ 🟢 ROUTED_NETWORK  ·  Settlement #4412     │  │ │
│ │ │ Model: crypto-24h-v3                        │  │ │
│ │ │ Est. tokens: ~50K  ·  Payment: HOOT         │  │ │
│ │ │ Est. revenue: 0.01 HOOT (per call)          │  │ │
│ │ │ [Accept Inference]                          │  │ │
│ │ └─────────────────────────────────────────────┘  │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ═══ My Nodes ════════════════════════════════════════ │
│                                                      │
│ ┌─ Node Card ──────────────────────────────────────┐ │
│ │ seoul-4090  ·  State: EXECUTING                  │ │
│ │ Tier: 2 (2,000 HOOT bonded)                      │ │
│ │ Mode: BOTH  ·  Trust Score: 87 (+1 last job)     │ │
│ │ Weight: 1.5x × (87/100) = 1.305x                │ │
│ │                                                  │ │
│ │ Current: Job #2891 — "Crypto 24h"               │ │
│ │ Progress: ████████████░░  78%                    │ │
│ │ Runs completed: 52  ·  Keep rate: 42%            │ │
│ │                                                  │ │
│ │ Commit-Reveal status:                            │ │
│ │   committed: 3  ·  revealed: 2  ·  verified: 47 │ │
│ │   spot-checked: 5 (all passed ✓)                 │ │
│ │                                                  │ │
│ │ ┌─ Earnings ──────────────────────────────────┐  │ │
│ │ │ This job:  0.95 HOOT (Pool B share)         │  │ │
│ │ │ Today:     1.82 HOOT                        │  │ │
│ │ │ 7 days:    12.4 HOOT                        │  │ │
│ │ │ Total:     142.3 HOOT                       │  │ │
│ │ └─────────────────────────────────────────────┘  │ │
│ │                                                  │ │
│ │ [Change Mode] [Upgrade Tier] [Disconnect]        │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─ Trust Score History ────────────────────────────┐ │
│ │ ~~~trust score timeline chart~~~                  │ │
│ │ Recovery rate: +⌊(100-87)/10⌋ = +1 per job      │ │
│ │ Spot-check ratio: r=0.20 (TS 50~89 bracket)     │ │
│ └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 5. Protocol — 참여 + 경제

### 역할
토큰 이코노믹스 + Bond/Burn + Notary + 보상 이력.
"프로토콜에 참여하려면 여기."

### 화면 구성

#### 세그먼트: [Participate] [Token Flow] [Rewards]

```
┌─────────────────────────────────────────────────────┐
│ ⚙ Protocol                                          │
│                                                      │
│ ┌─ Metrics Strip ─────────────────────────────────┐  │
│ │ TVL $12.4M  ·  Burned 847K  ·  Treasury $3.2M   │  │
│ │ Active Bonds 2,341  ·  MAU 892/1,443             │  │
│ │                          (디플레 전환점)          │  │
│ └──────────────────────────────────────────────────┘  │
│                                                      │
│ [Participate]  [Token Flow]  [Rewards]                │
│                                                      │
│ ═══ Participate ═════════════════════════════════════ │
│                                                      │
│ ┌─ Node Bond ──────────────────────────────────────┐ │
│ │ [Lite 500H] [Standard 2,000H] [Enterprise 10,000H] │
│ │                                                  │ │
│ │ Current: Tier 2 (2,000 HOOT)                     │ │
│ │ Benefits:                                        │ │
│ │   · Weight: 1.5x  ·  Training cost: $0.018/run  │ │
│ │   · Free inference: 5,000 calls/mo              │ │
│ │   · Medium job access                            │ │
│ │                                                  │ │
│ │ Upgrade to Tier 3:                               │ │
│ │   · +8,000 HOOT  ·  Weight: 2.5x                │ │
│ │   · Training: FREE  ·  Free: 20,000 calls/mo    │ │
│ │   · Priority job assignment                      │ │
│ │                                                  │ │
│ │ [Bond 2,000 HOOT]  ·  Balance: 12,450 HOOT      │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─ Burn to Credit ─────────────────────────────────┐ │
│ │ Burn HOOT → GPU credits for pre-training         │ │
│ │                                                  │ │
│ │ 500 HOOT → $25 credit  (50% off)                │ │
│ │ 2,500 HOOT → $140 credit  (44% off)             │ │
│ │ 10,000 HOOT → $600 credit  (40% off)            │ │
│ │                                                  │ │
│ │ [Burn & Convert]                                 │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─ PPAP Pipeline ──────────────────────────────────┐ │
│ │ My PPAP submissions:                             │ │
│ │ #2891  CONFIRMED   3.0 HOOT fee paid             │ │
│ │ #2890  CHALLENGE_WINDOW  16h remaining           │ │
│ │ #2889  CONFIRMED   3.0 HOOT fee paid             │ │
│ │                                                  │ │
│ │ Fee breakdown:                                   │ │
│ │   3.0 HOOT → Treasury 70% (2.1) / Burn 30% (0.9) │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ═══ Token Flow ══════════════════════════════════════ │
│                                                      │
│ ┌─ Token Flow Diagram (기존 시각화 확장) ──────────┐ │
│ │                                                  │ │
│ │     ┌─ Pool A ─┐      ┌─ Pool B ─┐              │ │
│ │     │ Usage    │      │ Compute  │              │ │
│ │     │ Revenue  │      │ Rewards  │              │ │
│ │     └─┬──┬──┬─┘      └──┬────┬─┘              │ │
│ │       │  │  │            │    │                  │ │
│ │    60% 15% 15%  10%    95%   5%                  │ │
│ │       │  │  │    │      │    │                  │ │
│ │       ▼  ▼  ▼    ▼      ▼    ▼                  │ │
│ │    Cre Not Tre  Burn   GPU  Tre                  │ │
│ │                                                  │ │
│ │ Emission: 948,000 HOOT/yr (E_base)               │ │
│ │ + E_work: 3.0 HOOT/job                           │ │
│ │ Deflation point: MAU 1,443                       │ │
│ │ Current: MAU 892 → 🔴 inflationary              │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─ Supply Dynamics ───────────────────────────────┐  │
│ │ ~~~emission vs burn chart over time~~~           │  │
│ │ Annual emission: 989,062 HOOT                    │  │
│ │ Annual burn:     359,116 HOOT                    │  │
│ │ Net: +629,946 HOOT (inflationary)                │  │
│ └─────────────────────────────────────────────────┘  │
│                                                      │
│ ═══ Rewards ═════════════════════════════════════════ │
│                                                      │
│ ┌─ My Reward History ──────────────────────────────┐ │
│ │ Date    Source           Amount    Pool           │ │
│ │ 3/15    Job #2891 完了   +0.95H   Pool B (GPU)   │ │
│ │ 3/15    Inference serve  +0.08H   Pool B (GPU)   │ │
│ │ 3/15    Model usage      +0.48H   Pool A (Cre)   │ │
│ │ 3/14    Job #2887 完了   +1.20H   Pool B (GPU)   │ │
│ │ 3/14    Challenge valid  +50.0H   Challenge rwd  │ │
│ │ ...                                              │ │
│ │                                                  │ │
│ │ ┌─ Reward Breakdown ─────────────────────────┐   │ │
│ │ │ Pool B (Compute): 142.3 HOOT  (78%)        │   │ │
│ │ │ Pool A (Creator):  38.2 HOOT  (21%)        │   │ │
│ │ │ Challenge rewards:  1.5 HOOT  (1%)         │   │ │
│ │ └────────────────────────────────────────────┘   │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─ Trust & Governance ─────────────────────────────┐ │
│ │ Trust Score: 87 / 100                            │ │
│ │ ████████████████████████████████░░░░  87%        │ │
│ │                                                  │ │
│ │ veHOOT: Phase 2 (coming soon)                    │ │
│ │ Lock HOOT → vote on emission params              │ │
│ └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 6. 페이지 간 연결 (Cross-page Actions)

### 인라인 액션 (페이지 이동 없이)

| 현재 페이지 | 상황 | 인라인 액션 |
|---|---|---|
| Research | Launch 클릭 | Job 자동 생성 → 상태 배너로 전이 표시 |
| Research | GPU 매칭 중 | "12 nodes available" 표시, 자동 매칭 대기 |
| Research | 완료 | [Mint ModelNFT] 버튼 → 모달로 VTR 생성 |
| Models | Use Model 클릭 | 추론 Job 자동 생성 → 인라인 상태 표시 |
| Models | Fork & Train | Research 페이지로 이동 (토픽+base model 프리필) |
| Network | Claim Job | 즉시 CLAIMED → EXECUTING 전이 |
| Network | Upgrade Tier | Protocol/Participate로 이동 |
| Protocol | Bond 완료 | "Now you can claim jobs" → Network로 이동 |

### 딥링크 구조

```
/#/research?jobId=2891          → 특정 Job 실시간 뷰
/#/models?modelId=crypto-24h    → 모델 상세
/#/network?nodeId=seoul-4090    → 노드 상세
/#/protocol?section=bond        → Bond 섹션으로 스크롤
```

---

## 7. 새로 필요한 Store / 타입

### jobLifecycleStore (신규)
```typescript
interface JobLifecycle {
  id: string;
  state: 'DRAFT' | 'PUBLISHED' | 'OPEN' | 'EXECUTING' | 'EVALUATING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  topic: string;
  baseModel: string;
  datasetRef: string;
  budget: number;
  budgetRemaining: number;
  deadline: number;
  claimedNodes: string[];
  experiments: Experiment[];
  vtrState?: 'DRAFT' | 'SUBMITTED' | 'DETERMINISTIC' | 'SELF_ATTESTED';
  modelNftId?: string;
  costBreakdown: { total: number; perRun: number; poolB: number; treasury: number; };
}
```

### modelRegistryStore (신규)
```typescript
interface ModelRecord {
  id: string;
  slug: string;
  name: string;
  state: 'DRAFT' | 'MINTED' | 'PRIVATE_ACTIVE' | 'NETWORK_ACTIVE' | 'DEPRECATED';
  originJobId: string;
  vtr: {
    grade: 'DETERMINISTIC' | 'SELF_ATTESTED';
    trainingSeed?: number;
    baseModelId: string;
    ckptHash: string;
    ppapRootRef: string;
  };
  metrics: { best: number; experiments: number; kept: number; };
  usage: { totalCalls: number; totalRevenue: number; dailyCalls: number[]; };
  poolA: { creator: number; notary: number; treasury: number; burn: number; };
  createdAt: string;
}
```

### rewardStore (신규)
```typescript
interface RewardEntry {
  timestamp: string;
  source: 'pool_b_compute' | 'pool_a_creator' | 'pool_a_notary' | 'challenge_reward' | 'ppap_fee';
  amount: number;
  jobId?: string;
  modelId?: string;
  pool: 'A' | 'B';
}
```

---

## 8. 구현 우선순위

### Phase 1: 핵심 플로우 (Research → Models 연결)
1. Research 페이지에 Job Status Banner 추가
2. Job 상태 전이 시각화 (state flow indicator)
3. 완료 시 VTR + ModelNFT Mint 플로우
4. Models 페이지에 My Models 탭 + Origin Job 연결

### Phase 2: Provider 뷰 (Network 개선)
5. Network에 Job Queue 탭 추가
6. My Nodes에 Trust Score + earnings 상세
7. Claim → Executing 인라인 전이

### Phase 3: 경제 뷰 (Protocol 개선)
8. Protocol에 Rewards 탭 추가
9. Token Flow 시각화에 실제 Pool A/B 데이터 연결
10. Emission vs Burn 차트

### Phase 4: 데이터 연결
11. jobLifecycleStore 구현
12. modelRegistryStore 구현
13. rewardStore 구현
14. 페이지 간 딥링크
