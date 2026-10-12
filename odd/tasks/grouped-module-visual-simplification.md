# Simplify grouped-module presentation

Hide redundant per-module badges inside an expanded super-group and keep row numbers readable against module colors.

## Objective

A super-group uses its purple header as the only module-membership label, while every row number maintains strong black-or-white contrast against its effective background.

## Scope

- Suppress module badge rows only for modules that belong to a rendered super-group.
- Preserve module badges for ungrouped modules.
- Preserve the super-group title, module/row count, collapse, and ungroup actions.
- Select black or white row-number text from the effective module/selection background.
- Add focused component and browser acceptance coverage.

## Non-goals

- Removing module colors from grouped rows.
- Changing raw `detalle`, module parsing, group membership, row order, or persistence.
- Changing group depth or selection behavior.
- Redesigning table columns, actions, or service controls.
- Push, pull request, merge, deployment, Firefox, or WebKit testing.

## Constraints

- The purple super-group header remains visible and names its member modules.
- Grouped rows retain their existing module/door-panel background colors.
- Selected row numbers continue to use the existing blue selection background.
- Contrast selection must be deterministic and testable for every configured module color.
- Browser acceptance remains isolated to `demo-adn-e2e` and localhost Firebase emulators.

## Tasks

### GVS-1 — Hide grouped badges and improve row-number contrast

- [x] Add failing component assertions for grouped versus ungrouped module badges.
- [x] Add failing contrast assertions for light and dark module backgrounds and selected rows.
- [x] Suppress only redundant badge rows inside super-groups.
- [x] Apply deterministic black/white foreground contrast to row numbers.
- [x] Preserve collapse controls, row selection, and module colors.

Acceptance:
- No per-module pill appears between a super-group header and its grouped rows.
- Ungrouped modules still display their pills when module colors are enabled.
- Every colored row number uses either black or white text chosen for stronger contrast.
- Selected row numbers remain white on the blue selection background.

Planned commit: `fix(despiece): simplify grouped module visuals`

### GVS-2 — Verify browser behavior and record evidence

- [x] Run focused component/layout suites.
- [x] Run desktop/mobile Chromium super-group and geometry coverage against local emulators.
- [x] Run a production build with emulator variables unset.
- [x] Confirm endpoint isolation, clean generated artifacts, and run `git diff --check`.
- [x] Record exact evidence and remaining boundaries.

Acceptance:
- The annotated screenshot scenarios are covered at desktop and mobile widths.
- No existing grouping, layout, or selection regression remains in the tested Chromium lane.
- The feature branch is clean with reviewable work-unit commits.

Planned commit: `docs(odd): record grouped visual evidence`

## Progress

- Current task: Complete.
- Completed tasks: GVS-1, GVS-2.
- GVS-1 commit: `f3d0d6f` (`fix(despiece): simplify grouped module visuals`).
- Grouped module labels are suppressed only when `currentSuperGroup` is truthy; ungrouped labels remain unchanged.
- Row-number foreground now uses relative-luminance contrast against module/door-panel colors, with selected rows remaining white on blue.

## Verification evidence

- RED: `CI=true npm test -- --watchAll=false --runInBand src/components/Despieces/TablaPiezas.superGrouping.test.js` failed before implementation with 3 intended failures: grouped labels rendered 2 instead of 1, the contrast helper was absent, and rendered contrast assertions could not run.
- GREEN: `CI=true npm test -- --watchAll=false --runInBand src/components/Despieces/TablaPiezas.superGrouping.test.js src/components/Despieces/TablaPiezas.layout.test.js` passed: 2 suites, 8 tests.
- Focused Playwright assertions for grouped badge absence and computed row-number colors were added to `e2e/adn-workflows.spec.js`; E2E/build were not run per GVS-1 scope.
- `git diff --check`: passed.
- GVS-1 commit: `f3d0d6f` (`fix(despiece): simplify grouped module visuals`).

## GVS-2 verification evidence

- Independent focused Jest passed 2 suites and 8 tests.
- Production build passed with emulator variables explicitly unset.
- Desktop and mobile table geometry passed.
- The initial desktop/mobile super-group run reached the new contrast assertions and exposed a test-only contradiction: the loop compared the selected blue row against its underlying module color even though selection intentionally overrides it with white-on-blue. Product behavior was correct.
- The harness now excludes the selected row from the module-background loop and validates it separately. The focused rerun passed desktop and mobile Chromium: 2/2.
- Browser evidence confirmed zero grouped module pill rows, five non-selected colored row numbers using computed black/white contrast, one selected row using white on blue, and successful collapse, reload, persistence, ungroup, and final reload behavior.
- Browser execution used one worker, project `demo-adn-e2e`, temporary port 3001, and localhost Auth/Firestore/Storage emulators only. Production Firebase was not contacted and the user's port-3000 server remained running.
- `git diff --check` passed. Temporary verification servers, containers, logs, configs, build output, and test results were cleaned.
- Remaining boundaries: Firefox, WebKit, real Firebase, deployment, push, pull request, and merge were not exercised.

## Next step

The requested visual variation is implemented and verified. Push, pull-request creation, merge, deployment, and broader cross-browser testing remain separate user decisions.
