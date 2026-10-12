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

- [ ] Add failing component assertions for grouped versus ungrouped module badges.
- [ ] Add failing contrast assertions for light and dark module backgrounds and selected rows.
- [ ] Suppress only redundant badge rows inside super-groups.
- [ ] Apply deterministic black/white foreground contrast to row numbers.
- [ ] Preserve collapse controls, row selection, and module colors.

Acceptance:
- No per-module pill appears between a super-group header and its grouped rows.
- Ungrouped modules still display their pills when module colors are enabled.
- Every colored row number uses either black or white text chosen for stronger contrast.
- Selected row numbers remain white on the blue selection background.

Planned commit: `fix(despiece): simplify grouped module visuals`

### GVS-2 — Verify browser behavior and record evidence

- [ ] Run focused component/layout suites.
- [ ] Run desktop/mobile Chromium super-group and geometry coverage against local emulators.
- [ ] Run a production build with emulator variables unset.
- [ ] Confirm endpoint isolation, clean generated artifacts, and run `git diff --check`.
- [ ] Record exact evidence and remaining boundaries.

Acceptance:
- The annotated screenshot scenarios are covered at desktop and mobile widths.
- No existing grouping, layout, or selection regression remains in the tested Chromium lane.
- The feature branch is clean with reviewable work-unit commits.

Planned commit: `docs(odd): record grouped visual evidence`

## Progress

- Current task: GVS-1.
- Completed tasks: none.
- Existing code renders module labels whenever a module starts, even when `currentSuperGroup` is present.
- Row-number foreground currently uses fixed gray text unless selected, while the parent row supplies vivid module backgrounds.

## Verification evidence

Pending.

## Next step

Create focused RED assertions for badge suppression and foreground contrast, then implement the smallest presentation-only correction.
