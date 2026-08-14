# Tasks: Buzón de Sugerencias 2026

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 750–1,050 authored lines across utilities, adapters, UI, tests, CSS, and dependency manifests |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 foundation → PR 2 detection/carousel → PR 3 transformations/dialogs → PR 4 wiring/regression |
| Delivery strategy | ask-always |
| Chain strategy | pending user choice |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Schema identity and safe primary/secondary persistence | PR 1 | `npm test -- --watchAll=false src/utils src/services` | N/A: Jest Firestore mocks are the available harness | `moduleIdentity.js`, `despiecePersistence.js`, schema fields, and tests |
| 2 | Semantic detection and accessible service browsing | PR 2 | `npm test -- --watchAll=false src/utils src/components/Despieces` | N/A: no E2E runner; RTL covers keyboard/fallback behavior | detection/calculation and carousel files plus tests |
| 3 | Reviewed find/replace and module rename behaviors | PR 3 | `npm test -- --watchAll=false src/utils src/components/Despieces` | N/A: modal behavior is covered with RTL | transformation/modal files plus tests |
| 4 | Coordinator wiring, dependency integration, and regression proof | PR 4 | `npm test -- --watchAll=false` | `npm start`; manually verify one save, fallback, replace, and rename flow | `ModeloDespiece.js`, integration styles/imports/manifests, regression tests |

## Phase 1: Foundation and Persistence (PR 1)

- [x] 1.1 RED: Add Jest cases for deterministic legacy `serviceId`, exact legacy module-token parsing, module hydration/fallback, and stable row references.
- [x] 1.2 GREEN: Create `src/utils/moduleIdentity.js` and schema hydration for `despiece.modules`, `fila.moduleId`, and service IDs without rewriting legacy tokens.
- [x] 1.3 RED: Add adapter tests for primary batch success/failure, delayed local commit, secondary history/default warnings, retry payloads, and unchanged state after failure.
- [x] 1.4 GREEN: Create `src/services/despiecePersistence.js` preserving the Firestore envelope and implementing primary `writeBatch` plus best-effort secondary results.

## Phase 2: Detection and Carousel (PR 2)

- [x] 2.1 RED: Add unit tests for valid wording/format variants, substring false positives, unresolved/invalid/empty results, canonical-ID totals, and rejected acceptance.
- [x] 2.2 GREEN: Update `src/utils/despieceCalculations.js` and `src/ModeloDespiece.js` to validate canonical services and mutate only accepted candidates.
- [x] 2.3 RED: Add RTL tests for carousel navigation, empty and unavailable-render fallbacks, responsive item reachability, focus visibility, and keyboard controls.
- [x] 2.4 GREEN: Create `src/components/Despieces/ServicesCarousel.js` and wire it through `ModeloDespiece.js` without browse-time mutation.

### Slice 2 evidence synchronization

- Maintainer-authorized exceptional native continuation: current-state behavior evidence is accepted; perfect historical RED→GREEN chronology is not claimed.
- Focused evidence: 4 suites / 12 tests pass, repeated three times. Slice 1+2 regression: 5 suites / 16 tests pass. Full Jest: 7 suites / 23 of 24 tests pass; only the proven pre-existing `src/App.test.js` failure remains. Build warnings are proven pre-existing and tolerated by the exception.
- Independent current authored Slice 2 count: **272** (<=400), recomputed from baseline commit `5de51821d0182f10d4d0612729df3c6de68b411f` using tracked `git diff --numstat` plus full line counts for the six untracked Slice 2 paths. The external manifest's 269 is historical/non-authoritative; prior 307 is maintainer-accepted metadata only, not independently verified. No independent pre-compression assertion/mock inventory exists; compression preservation is not claimed.
- Evidence-only continuation changed no production code, tests, package files, lockfiles, modes, or unrelated metadata. Phase 3 and Phase 4 remain pending.
- Recommendation: `sdd-verify` applies only to scoped Slice 2; the full change remains `apply` with 8/16 tasks complete.

## Phase 3: Transformations and Dialogs (PR 3)

- [x] 3.1 RED: Test literal escaping, valid/invalid regex, active-despiece scope, no-match previews, stale fingerprints, apply, cancel, and close behavior. (Maintainer-accepted process-evidence exception: current behavior/tests verified; historical RED chronology is not claimed.)
- [x] 3.2 GREEN: Create `src/utils/despieceTransformations.js` and `FindReplaceModal.js` with reviewed-preview-only application.
- [x] 3.3 RED: Test double-click/keyboard opening, labelled dialog focus trap, Escape/return focus, blank/duplicate rejection, valid rename, cancel, and save failure. (Maintainer-accepted process-evidence exception: current behavior/tests verified; historical RED chronology is not claimed.)
- [x] 3.4 GREEN: Create `ModuleRenameModal.js` and update `TablaPiezas.js` for module rename entry points. `TabsDespiece.js` and `PanelResumen.js` were reviewed; no identity/reference edits are claimed.

## Phase 4: Wiring, Accessibility, and Verification (PR 4)

- [x] 4.1 RED: Add `ModeloDespiece` integration/regression tests for candidate commit ordering, secondary warnings/retry, legacy documents, and all four capability entry points.
- [x] 4.2 GREEN: Wire coordinator paths in `src/ModeloDespiece.js`, add `role="dialog"`/`aria-modal`/live validation, focus management, and failure messaging.
- [x] 4.3 GREEN: Update `src/App.module.css`, `src/index.js`, `package.json`, and `package-lock.json` for responsive dialogs, Slick CSS, `react-slick`, and `slick-carousel`.
- [x] 4.4 Verify `npm test -- --coverage --watchAll=false`, full Jest regression, lint via `react-scripts`, and manual runtime scenarios; record results and confirm no threat-matrix tests are required (design marks it N/A).

### Slice 3 evidence synchronization

- Maintainer-accepted process-evidence exception applies only to tasks 3.1 and 3.3: current behavior and tests are verified; historical RED chronology is explicitly not claimed.
- Generation 11 native evidence: corrective successor ordinal 14 passed; 2 focused suites / 7 tests passed and 7 relevant regression suites / 21 tests passed. Evidence revision: `sha256:2825ef9eac515901eb52b173f4c6c2f3d57b44a2ae35bf4d9696a8fbdb329a17`.
- Current behavior covered: literal/regex replacement and stale previews; cancel/close/Escape; boundary-aware Tab/Shift+Tab traversal and opener focus restoration; rename validation, save failure, and double-click/keyboard entry.
- Correction delta: **35** changed lines, native-bound only. No independent reproduction is claimed because no canonical native preimage is available.
- Cumulative Slice 3 authored implementation count is **288/400** native-bound arithmetic: prior 253 + correction 35 (earlier Slice 3 native counts: 181 + 72 + 35). Evidence-only metadata changes are excluded.
- Task 3.4 claim is limited to `ModuleRenameModal.js` and `TablaPiezas.js`; `TabsDespiece.js` and `PanelResumen.js` identity/reference edits are not claimed.
- No source, test, package, lockfile, runtime, or integration changes were made during this evidence synchronization. Scoped recommendation: `sdd-verify` for Slice 3. Full change remains `apply` until Slice 4 completes.

### Terminal remediation successor

- Task parity remains **16/16 complete** after the bounded successor `terminal-remediation-20260814-001`.
- Persistence now writes the complete snapshot through `despiecePersistence` before local commit or dialog close. Primary failure preserves local/modal state; secondary failure preserves the commit and exposes retry.
- Service edits preserve canonical identity and metadata; legacy totals, empty-service semantics, literal metacharacters, and preview invalidation have focused behavior coverage.
- Strict-TDD successor evidence: RED reproduced 9 failures across 4 suites; GREEN passed 11 suites / 54 tests. Full coverage passed 11 suites and 54/55 tests; only the unchanged pre-existing `src/App.test.js` assertion failed.
- Production build passed. The prior verify report remains failed and is superseded for candidate evidence only; a new independent verification is required and no PASS is claimed here.
