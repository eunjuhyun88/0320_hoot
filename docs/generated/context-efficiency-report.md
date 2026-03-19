# Context Efficiency Report

This report estimates how much context the routing system saves before the agent reaches implementation files.

## Core Bundles

| Bundle | Files | Lines | Approx Tokens | Reduction vs canonical | Reduction vs all docs |
| --- | --- | --- | --- | --- | --- |
| small map | 10 | 1103 | 9189 | 51.1% | 75.2% |
| canonical | 30 | 2417 | 18786 | 0.0% | 49.2% |
| all docs | 72 | 4379 | 37014 | -97.0% | 0.0% |

## Estimated Savings

- Small map saves approximately `9597` tokens vs the canonical bundle.
- Small map saves approximately `27825` tokens vs the all-doc bundle.
- Surface `web` saves approximately `26536` tokens vs the all-doc bundle.
- Surface `runtime-api` saves approximately `26532` tokens vs the all-doc bundle.
- Surface `protocol` saves approximately `26552` tokens vs the all-doc bundle.

## Surface Bundles

| Bundle | Files | Lines | Approx Tokens | Reduction vs canonical | Reduction vs all docs |
| --- | --- | --- | --- | --- | --- |
| web | 14 | 1251 | 10478 | 44.2% | 71.7% |
| runtime-api | 14 | 1250 | 10482 | 44.2% | 71.7% |
| protocol | 14 | 1244 | 10462 | 44.3% | 71.7% |

## Structural Scorecard

| Check | Actual | Target | Result |
| --- | --- | --- | --- |
| Small-map reduction vs canonical | 51.1% | >= 40% | PASS |
| Small-map reduction vs all docs | 75.2% | >= 55% | PASS |
| Worst surface reduction vs all docs | 71.7% | >= 50% | PASS |
| Small-map approx tokens | 9189 | <= 3800 | FAIL |
| Small-map file count | 10 | <= 6 | FAIL |
| Canonical approx tokens | 18786 | <= 12000 | FAIL |

## Structural Readiness

- FAIL: structural routing gate
- Final acceptance still requires a repeated runtime benchmark with controlled noise.

## Budget Checks

- FAIL: Small map approx tokens <= 3800
- FAIL: Small map files <= 6
- FAIL: Canonical approx tokens <= 12000

## Small Map Files

- `README.md`
- `AGENTS.md`
- `docs/README.md`
- `ARCHITECTURE.md`
- `docs/SYSTEM_INTENT.md`
- `docs/CONTEXT_ENGINEERING.md`
- `docs/CLAUDE_COMPATIBILITY.md`
- `docs/AGENT_FACTORY.md`
- `docs/TOOL_DESIGN.md`
- `docs/AGENT_OBSERVABILITY.md`

## How To Use

- Compare small-map and surface bundles against canonical/all-doc bundles.
- Review `docs/generated/contextual-retrieval.md` if ambiguous tasks still open too many docs.
- Review `docs/generated/agent-catalog.md` if outsiders still cannot discover reusable agents quickly.
- Use this with `docs/CONTEXT_EVALUATION.md` for task-level evaluation.
- Run `npm run harness:benchmark -- --base-url http://localhost:4173` for repeated runtime/noise validation.
- If the small map grows too much, routing quality is degrading even if docs remain correct.

