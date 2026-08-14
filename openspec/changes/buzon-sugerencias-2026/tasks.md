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

- [ ] 2.1 RED: Add unit tests for valid wording/format variants, substring false positives, unresolved/invalid/empty results, canonical-ID totals, and rejected acceptance.
- [ ] 2.2 GREEN: Update `src/utils/despieceCalculations.js` and `src/ModeloDespiece.js` to validate canonical services and mutate only accepted candidates.
- [ ] 2.3 RED: Add RTL tests for carousel navigation, empty and unavailable-render fallbacks, responsive item reachability, focus visibility, and keyboard controls.
- [ ] 2.4 GREEN: Create `src/components/Despieces/ServicesCarousel.js` and wire it through `ModeloDespiece.js` without browse-time mutation.

## Phase 3: Transformations and Dialogs (PR 3)

- [ ] 3.1 RED: Test literal escaping, valid/invalid regex, active-despiece scope, no-match previews, stale fingerprints, apply, cancel, and close behavior.
- [ ] 3.2 GREEN: Create `src/utils/despieceTransformations.js` and `FindReplaceModal.js` with reviewed-preview-only application.
- [ ] 3.3 RED: Test double-click/keyboard opening, labelled dialog focus trap, Escape/return focus, blank/duplicate rejection, valid rename, cancel, and save failure.
- [ ] 3.4 GREEN: Create `ModuleRenameModal.js`; update `TablaPiezas.js`, `TabsDespiece.js`, and `PanelResumen.js` to preserve module identity and references.

## Phase 4: Wiring, Accessibility, and Verification (PR 4)

- [ ] 4.1 RED: Add `ModeloDespiece` integration/regression tests for candidate commit ordering, secondary warnings/retry, legacy documents, and all four capability entry points.
- [ ] 4.2 GREEN: Wire coordinator paths in `src/ModeloDespiece.js`, add `role="dialog"`/`aria-modal`/live validation, focus management, and failure messaging.
- [ ] 4.3 GREEN: Update `src/App.module.css`, `src/index.js`, `package.json`, and `package-lock.json` for responsive dialogs, Slick CSS, `react-slick`, and `slick-carousel`.
- [ ] 4.4 Verify `npm test -- --coverage --watchAll=false`, full Jest regression, lint via `react-scripts`, and manual runtime scenarios; record results and confirm no threat-matrix tests are required (design marks it N/A).
