# Contextual Retrieval

This generated artifact summarizes the query-time retrieval index for canonical docs.

## Retrieval Model

- Retrieval mode: deterministic contextual BM25
- Chunk context: path, authority, section headings, and surface ownership are prepended before indexing
- Goal: reduce full-doc scanning when the agent is uncertain what to open next

## Index Stats

- Source docs indexed: `37`
- Chunks indexed: `525`
- Chunk size (words): `120`
- Overlap size (words): `30`
- Default top-k: `5`

## Top Indexed Paths

| Path | Chunk Count |
| --- | --- |
| `memory/session-log.md` | 131 |
| `memory/page-redesign-spec.md` | 59 |
| `memory/magnet-studio-ux-v2.md` | 56 |
| `memory/architecture.md` | 33 |
| `docs/design-docs/research-semantic-zoom.md` | 27 |
| `memory/MEMORY.md` | 25 |
| `docs/CONTEXT_EVALUATION.md` | 22 |
| `README.md` | 20 |
| `docs/CONTEXT_ENGINEERING.md` | 18 |
| `AGENTS.md` | 10 |
| `docs/CONTEXT_PLATFORM.md` | 9 |
| `docs/MULTI_AGENT_COORDINATION.md` | 9 |
| `docs/AGENT_FACTORY.md` | 8 |
| `docs/ENGINEERING.md` | 8 |
| `docs/AGENT_OBSERVABILITY.md` | 7 |

## Commands

- `npm run retrieve:query -- --q "<term>"`
- `npm run registry:serve` then `GET /retrieve?q=<term>`

## Limits

- This is a lexical/contextual bootstrap index, not an embedding+rereank system.
- For very large repos, the JSON index may later move to runtime-only storage.

