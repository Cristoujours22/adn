# Deliver configurable module grouping and precise service detection

Build four coordinated ADN improvements without rewriting raw piece details: configurable module parsing, persisted super-groups, non-overlapping service aliases, and a compact scrollable service summary.

## Objective

Users can adapt module detection to their detail convention, super-group detected modules through the existing row selector, count explicit service aliases without overlap, and navigate long service summaries.

## Problem

The stable application hard-codes `/D\d+-\d+/i`, duplicates module parsing, physically groups rows without higher-level metadata, counts services through independent overlapping regex paths, and lets the right summary grow without an internal scroll region.

## Why

Different users encode module identities and service names differently. ADN needs deterministic, reviewable configuration instead of hard-coded exceptions, while preserving existing projects and raw `detalle` values.

## Scope

- User-level module-detection defaults copied into each project.
- Shared parser supporting configurable design prefixes and group-ID position.
- One-level persisted super-groups with unique module membership.
- Existing row-number selection expands selected rows to complete modules after preview.
- Explicit aliases per service with longest non-overlapping span ownership.
- Native vertical scrolling and modest density changes in the right service summary.
- Backward compatibility for projects without the new fields.

## Non-goals

- Fuzzy or machine-learned nomenclature matching.
- Nested super-groups or multiple group membership.
- Rewriting raw `detalle` values.
- Drag-and-drop or context-menu-only workflows.
- Push, pull request creation, merge, or deployment.

## Constraints

- Worktree: `/mnt/c/Users/Cristian/Desktop/adn-worktrees/ajustes-adn`.
- Branch: `feature/ajustes-adn`, based on stable commit `6cb94aafbb31283ab41a32c3a7664fd62be6ddf7`.
- Technical artifacts remain in English unless existing UI conventions require Spanish copy.
- Test-first behavior changes: observe focused RED, implement minimum GREEN, then refactor.
- Preserve legacy `D1-005` behavior when configuration is absent.
- Keep raw rows flat and preserve `detalle` semantics used by calculations.
- One delegated writer at a time; every task ends in a Conventional Commit work unit.

## Delivery forecast

| Task | Forecast A+D | Route | Trigger |
|---|---:|---|---|
| ADN-1 | 250 | delegated writer | multi-file parser + tests |
| ADN-2 | 380 | delegated writer | UI + persistence + tests |
| ADN-3 | 300 | delegated writer | domain operations + tests |
| ADN-4 | 400 | delegated writer | table integration + accessibility |
| ADN-5 | 420 | delegated writer | matcher replacement + regressions |
| ADN-6 | 140 | delegated writer | component + responsive styles/tests |
| **Total** | **1,890** |  |  |

Delivery strategy: `feature-branch-chain` selected by the user.

Planned chain:

1. Module detection: ADN-1, then ADN-2.
2. Super-grouping: ADN-3, then ADN-4.
3. Nomenclature matching: ADN-5.
4. Service summary: ADN-6.

Each task remains an independent work-unit commit and candidate chain slice. Push, PR creation, merge, and deployment remain separate user decisions.

## Tasks

### ADN-1 — Create the shared configurable module parser

- [ ] Add a pure parser and configuration normalizer.
- [ ] Support design prefixes such as `D`, `T`, and `A`.
- [ ] Support group IDs before or after the design token.
- [ ] Preserve legacy `D1-005` fallback behavior.
- [ ] Replace duplicated parser calls only within this bounded domain unit.
- [ ] Add focused unit tests for valid, invalid, case, spacing, punctuation, and boundary cases.

Acceptance:
- `D1-005`, `005-D1`, `T1-005`, and `005-A1` behave according to configuration.
- Incidental embedded text is not classified as a module.
- Both grouping and table rendering consume the same parser result.

Checks:
- Focused parser tests.
- Related module-rendering tests.
- `git diff --check`.

Planned commit: `feat(despiece): add configurable module detection`

### ADN-2 — Persist and edit module-detection configuration

- [ ] Store a user default and copy it into new projects.
- [ ] Load project-specific configuration without global retroactive changes.
- [ ] Provide a configuration UI with example input and detection preview.
- [ ] Preview conflicts before a configuration change invalidates known modules or super-groups.
- [ ] Keep old project documents readable without migration jobs.

Acceptance:
- Existing projects without configuration retain legacy behavior.
- New projects inherit the current user default once.
- Editing the user default does not mutate saved projects.
- Unsafe configuration changes fail with actionable feedback.

Checks:
- Focused configuration/persistence tests with mocked Firestore.
- Relevant UI tests.
- `git diff --check`.

Planned commit: `feat(despiece): persist module detection settings`

### ADN-3 — Implement pure super-group domain operations

- [ ] Resolve selected row IDs to complete distinct modules.
- [ ] Produce a preview model with module keys and piece counts.
- [ ] Reorder selected modules contiguously at the first selected module position.
- [ ] Preserve module order, row order within modules, and relative order of unaffected rows.
- [ ] Enforce one-level groups, unique membership, and a minimum of two modules.
- [ ] Define deterministic behavior for delete, ungroup, paste, and changed details.

Acceptance:
- Selecting one row expands to its complete module in preview.
- Confirmation reorders and persists complete modules only.
- Raw `detalle` values remain byte-for-byte unchanged.
- Invalid or stale selection cannot partially mutate state.

Checks:
- Focused pure-function RED/GREEN tests.
- Edge cases for interleaved, missing, duplicate, and changed module keys.
- `git diff --check`.

Planned commit: `feat(despiece): add super-group domain operations`

### ADN-4 — Integrate accessible super-group controls

- [ ] Reuse the existing row-number selector.
- [ ] Add an action enabled only for at least two detected modules.
- [ ] Add an explicit preview/confirmation dialog.
- [ ] Persist `superGroups` in tabs, autosave, version history, and undo snapshots.
- [ ] Add semantic super-group headers and session-local collapse state.
- [ ] Reset index-based selection safely after reordering.
- [ ] Cover desktop, keyboard, high-contrast, and mobile behavior.

Acceptance:
- The UI does not add a permanent checkbox column.
- Preview lists every module and piece count before movement.
- Reload and version restore preserve membership and order.
- Totals include collapsed pieces.

Checks:
- Focused React Testing Library interaction tests.
- Persistence/history regression tests.
- Relevant despiece regression suite.
- Production build.
- `git diff --check`.

Planned commit: `feat(despiece): add super-group workflow`

### ADN-5 — Replace overlapping nomenclature detection

- [ ] Introduce canonical service identity and explicit aliases.
- [ ] Normalize case, accents, whitespace, and punctuation consistently.
- [ ] Detect candidate spans and assign longest/specific matches first.
- [ ] Allow separate non-overlapping mentions in the same detail.
- [ ] Reject alias collisions across services with actionable feedback.
- [ ] Use the same matcher for totals and table actions.
- [ ] Correct quantity parsing and regressions around Curva, Nariz, and ENGNA.

Acceptance:
- `sencha curva` counts the specific service only.
- `sencha curva + curva` counts one of each.
- `2 curva`, `curva x2`, and equivalent configured forms count deterministically.
- `curvado` and `naranja` do not trigger shorter service aliases.
- Existing supported aliases remain representable explicitly.

Checks:
- Focused matcher and quantity tests.
- Table-action parity tests.
- Relevant calculation regression suite.
- Production build.
- `git diff --check`.

Planned commit: `fix(services): prevent overlapping nomenclature matches`

### ADN-6 — Make the service summary compact and scrollable

- [ ] Add a labelled, keyboard-focusable native scroll region.
- [ ] Bound its height relative to the viewport.
- [ ] Reduce service-row padding and typography only modestly.
- [ ] Add responsive behavior when the sticky panel wraps below the table.
- [ ] Preserve semantic list structure, focus visibility, and high-contrast support.

Acceptance:
- Every positive active service remains reachable by mouse, keyboard, and touch.
- The panel shows more rows without reducing primary text below 12px or secondary text below 10px.
- Empty states and totals remain unchanged.

Checks:
- Focused component/structural tests.
- Responsive style readback.
- Production build.
- `git diff --check`.

Planned commit: `feat(services): make summary list scrollable`

## Progress

- Current task: ADN-1 — Create the shared configurable module parser.
- Completed tasks: none.
- Running authored-line count: 0.
- Last reviewed boundary: `6cb94aafbb31283ab41a32c3a7664fd62be6ddf7`.

## Verification evidence

No implementation checks have run yet. Exploration confirmed the clean feature worktree and current code paths.

## Next step

Start ADN-1 with an observed focused RED test, then implement the smallest parser behavior that makes it pass.
