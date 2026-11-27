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

- [x] Add a pure parser and configuration normalizer.
- [x] Support design prefixes such as `D`, `T`, and `A`.
- [x] Support group IDs before or after the design token.
- [x] Preserve legacy `D1-005` fallback behavior.
- [x] Replace duplicated parser calls only within this bounded domain unit.
- [x] Add focused unit tests for valid, invalid, case, spacing, punctuation, and boundary cases.

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

- [x] Store a user default and copy it into new projects.
- [x] Load project-specific configuration without global retroactive changes.
- [x] Provide a configuration UI with example input and detection preview.
- [x] Preview conflicts before a configuration change invalidates known modules or super-groups.
- [x] Keep old project documents readable without migration jobs.

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

- [x] Resolve selected row IDs to complete distinct modules.
- [x] Produce a preview model with module keys and piece counts.
- [x] Reorder selected modules contiguously at the first selected module position.
- [x] Preserve module order, row order within modules, and relative order of unaffected rows.
- [x] Enforce one-level groups, unique membership, and a minimum of two modules.
- [x] Define deterministic behavior for delete, ungroup, paste, and changed details.

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

- [x] Reuse the existing row-number selector.
- [x] Add an action enabled only for at least two detected modules.
- [x] Add an explicit preview/confirmation dialog.
- [x] Persist `superGroups` in tabs, autosave, version history, and undo snapshots.
- [x] Add semantic super-group headers and session-local collapse state.
- [x] Reset index-based selection safely after reordering.
- [x] Cover desktop, keyboard, high-contrast, and mobile behavior.

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

- [x] Introduce canonical service identity and explicit aliases.
- [x] Normalize case, accents, whitespace, and punctuation consistently.
- [x] Detect candidate spans and assign longest/specific matches first.
- [x] Allow separate non-overlapping mentions in the same detail.
- [x] Reject alias collisions across services with actionable feedback.
- [x] Use the same matcher for totals and table actions.
- [x] Correct quantity parsing and regressions around Curva, Nariz, and ENGNA.

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

- [x] Add a labelled, keyboard-focusable native scroll region.
- [x] Bound its height relative to the viewport.
- [x] Reduce service-row padding and typography only modestly.
- [x] Add responsive behavior when the sticky panel wraps below the table.
- [x] Preserve semantic list structure, focus visibility, and high-contrast support.

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

- Current task: Complete.
- Completed tasks: ADN-1, ADN-2, ADN-3, ADN-4, ADN-5, ADN-6.
- Planning commit: `f175be87c3bbedfacbb260093628de0ac8bbbe10` (`docs(odd): track ADN adjustment work units`).
- ADN-1 commit: `8c468a7` (`feat(despiece): add configurable module detection`).
- ADN-2 commit: `7d9e6de` (`feat(despiece): persist module detection settings`).
- ADN-3 commit: `1d0e543` (`feat(despiece): add super-group domain operations`).
- ADN-4 commit: `3e25d24` (`feat(despiece): add super-group workflow`).
- ADN-5 commit: `b03a9e0` (`fix(services): prevent overlapping nomenclature matches`).
- ADN-6 commit: `fc4c2d6` (`feat(services): make summary list scrollable`).
- Running authored-line count: 4,053 (219 planning + 206 ADN-1 + 620 ADN-2 + 542 ADN-3 + 653 ADN-4 + 1,560 ADN-5 + 253 ADN-6).
- Current verification boundary: `fc4c2d6`; native reviews remain unavailable on the Windows-mounted Git common directory and prior candidates remain unconsumed.

## Verification evidence

Exploration confirmed the clean feature worktree and current code paths. The planning commit initially failed because Git identity was unset; it was recovered with the existing repository identity scoped to one command, then independently verified clean.

ADN-1 writer evidence:

- Changed `src/utils/moduleDetection.js`, `src/utils/moduleDetection.test.js`, `src/ModeloDespiece.js`, and `src/components/Despieces/TablaPiezas.js`.
- Diff size: 195 additions + 11 deletions = 206 A+D.
- Required CRA command did not execute tests because `@testing-library/jest-dom` could not resolve from the borrowed dependency tree.
- A direct Jest invocation passed 5/5 focused tests, but it does not replace the required repository command.
- `git diff --check` passed.
- Independent verification established that Jest ignores `NODE_PATH`; adding `--modulePaths /mnt/c/Users/Cristian/Desktop/adn/node_modules --runInBand` preserved CRA/Babel/jsdom/setup semantics and passed 1 suite / 5 tests.
- Parent spot check `git diff --check` passed.
- Work-unit commit `8c468a7` contains 195 additions + 11 deletions = 206 A+D.
- Native assessment: medium risk, `reviewDue=false`, reason `under_budget`; writer verification stands and review was deferred to the module-detection slice.

ADN-2 writer evidence:

- RED: 3 suites executed with 5 expected failures before implementation.
- GREEN/refactor: 3 suites passed, 13 tests passed, 0 failed.
- `git diff --check` passed in the writer and parent spot check.
- Work-unit commit `7d9e6de` contains 609 additions + 11 deletions = 620 A+D. The cohesive persistence, accessible dialog, preview, conflict confirmation, and tests exceeded the planning heuristic; no code-golf or test omission was used.
- Slice assessment from `f175be8`: medium risk, 822 committed changed lines, `reviewDue=true`, reason `slice_budget_reached`.
- Native START created no lineage and performed no mutation because the Windows-mounted Git common directory does not honor required POSIX permission changes (`candidate-owner-parent-chmod-ineffective`).
- Reassessment recorded `nativeReviewOutcome=unavailable`; the risk-gated plan accepted writer verification for the large writer profile and required no separate verifier. The native candidate remains unconsumed.

ADN-3 writer evidence:

- RED: 1 suite ran with 10 expected failures against stubs.
- GREEN/refactor: 1 suite passed, 10 tests passed, 0 failed.
- `git diff --check` passed in the writer and parent spot check.
- Work-unit commit `1d0e543` adds 370 implementation lines + 172 test lines = 542 A+D. The pure stale-safe domain API and edge-case coverage form one cohesive unit.
- Native assessment from `7d9e6de`: medium risk, 542 committed changed lines, `reviewDue=true`, reason `slice_budget_reached`.
- Native START again created no lineage and performed no mutation because the Git common directory lacks required POSIX permission semantics.
- Reassessment recorded `nativeReviewOutcome=unavailable`; writer verification stands under the risk-gated fallback, no separate verifier is required, and the candidate remains unconsumed.

ADN-4 writer evidence (partial):

- RED observed missing dialog and table behaviors.
- GREEN/refactor: 4 suites passed, 16 tests passed, 0 failed; focus-return and semantic heading refinements remained green.
- `git diff --check` passed.
- The source/test diff is 653 A+D in allowed files.
- Production build did not run to completion because CRA webpack could not resolve `react-dom/client` from the borrowed dependency tree; `NODE_PATH` was insufficient.
- Independent diagnosis confirmed the declared, locked, and borrowed physical versions match (`react`/`react-dom` 18.3.1, `react-scripts` 5.0.1, `@testing-library/jest-dom` 6.6.3), and `react-dom/client.js` exists. CRA strips absolute `NODE_PATH` and webpack excludes the borrowed tree; this is search-path isolation, not a version mismatch.
- No deterministic source compile blocker was found in the scoped diff. The first authorized disposable Docker/npm-ci build then exposed one candidate lint blocker: an unnecessary `despieces` dependency in the cut-row callback.
- Removed that unnecessary dependency and re-ran independent verification in a clean Node 20 Bookworm container with a read-only host mount.
- Final isolated verification: `npm ci` succeeded; 4 suites and 16 tests passed; the production build compiled successfully; `git diff --check` passed; the host worktree was unchanged apart from the intended candidate/task files.
- Work-unit commit `3e25d24` contains 633 additions + 20 deletions = 653 A+D across eight implementation/test files.
- Native assessment from `1d0e543`: medium risk, 653 committed changed lines, `reviewDue=true`, reason `slice_budget_reached`.
- Native START created no lineage and performed no mutation because the Windows-mounted Git common directory still lacks required POSIX permission semantics (`candidate-owner-parent-chmod-ineffective`).
- Reassessment recorded `nativeReviewOutcome=unavailable`; the risk-gated plan accepted writer verification for the large writer profile and required no separate verifier. The native candidate remains unconsumed.
- Non-blocking environment warnings: deprecated transitive packages, 113 npm audit findings, and Browserslist data 17 months old.

ADN-5 writer evidence (partial):

- Added a shared span-owning matcher with normalization, token boundaries, deterministic quantities, and exact normalized alias-collision validation.
- Rewired totals and table actions to shared span ownership, and preserved aliases through defaults, service editing, project load/save, and version history.
- The initial pre-implementation CRA RED attempt timed out; direct Jest then failed in the borrowed runner's Babel setup, so no behavioral RED was observed. This lifecycle gap is recorded rather than claimed as TDD evidence.
- GREEN/refactor: 4 focused suites passed, 24 tests passed, 0 failed with the required CRA borrowed-dependency command.
- `git diff --check` passed.
- Current implementation/test diff is 1,377 A+D across eight allowed files.
- Independent clean-container verification passed 4 suites/24 tests, the production build, and `git diff --check`; the read-only mount left the host unchanged.
- Independent spot review found one high and four medium deterministic blockers: aliases colliding with canonical Manigaveta/Manichaflán ownership, `2Lservicio` quantity regression, reused numeric tokens between adjacent mentions, omitted legacy Ranura aliases, and omitted singular `circulo` behavior.
- Focused correction RED: 4 suites ran 36 tests with 10 expected regression failures covering all five findings.
- Focused correction GREEN/refactor: 4 suites passed, 36 tests passed, 0 failed; `git diff --check` passed.
- Final independent clean-container verification: `npm ci` succeeded; 4 suites/36 tests passed; production build compiled successfully; `git diff --check` passed; no prior blocker remained; the read-only container left the host unchanged.
- Final candidate size is 1,560 A+D across eight implementation/test files. Unrelated full-suite behavior and live Firestore integration were not exercised.
- Work-unit commit `b03a9e0` contains 1,026 additions + 534 deletions = 1,560 A+D.
- Native assessment from `3e25d24`: medium risk, 1,560 committed changed lines, `reviewDue=true`, reason `slice_budget_reached`.
- Native START created no lineage and performed no mutation because the Windows-mounted Git common directory still lacks required POSIX permission semantics (`candidate-owner-parent-chmod-ineffective`).
- Reassessment recorded `nativeReviewOutcome=unavailable`; the risk-gated plan accepted writer verification for the large writer profile and required no separate verifier. The native candidate remains unconsumed.

ADN-6 writer evidence (partial):

- RED: 2 focused tests failed because the summary exposed no labelled scroll region.
- GREEN/refactor: 1 suite passed, 2 tests passed, 0 failed; filtering, focusability, dark empty state, and empty copy remained covered.
- Added a focusable labelled native scroll region, viewport-relative bounds, responsive non-sticky behavior, modest density, visible focus, dark-mode support, and forced-colors support while preserving list semantics and count filtering.
- `git diff --check` passed. Structural readback confirmed `50vh`/`34vh`, `overflow-y: auto`, stable scrollbar gutter, 8px row padding, 13px primary/count text, 11px secondary text, `:focus-visible`, and forced-colors support.
- Current scoped diff is 253 A+D across three files.
- Independent clean-container verification: `npm ci` succeeded; 1 suite/2 tests passed; production build compiled successfully; `git diff --check` passed; component/CSS review found no blocker; the read-only container left the host unchanged.
- Full-suite and browser-level testing remain outside this task boundary.
- Work-unit commit `fc4c2d6` contains 220 additions + 33 deletions = 253 A+D.
- Native assessment from `b03a9e0`: medium risk, 253 committed changed lines, `reviewDue=false`, reason `under_budget`.
- Native INSPECT still offered START; START created no lineage and performed no mutation because the Windows-mounted Git common directory lacks required POSIX permission semantics (`candidate-owner-parent-chmod-ineffective`).
- Reassessment recorded `nativeReviewOutcome=unavailable`; the risk-gated plan accepted writer verification for the large writer profile and required no separate verifier. The native candidate remains unconsumed.

## Next step

The feature branch is complete and locally verified. Push, pull-request creation, merge, deployment, full-suite execution, and browser-level acceptance remain separate user decisions.
