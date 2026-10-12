# Correct piece-table and super-group regressions

Remove the table artifacts shown in the user screenshots and verify that a super-group represents every row of each selected complete module.

## Objective

The piece table has no empty bordered band, module labels remain visually separate from the sticky header, and super-group headers span the table cleanly while reporting complete-module membership accurately.

## Scope

- Replace fragile CSS-table row composition with one coherent eleven-column row layout.
- Remove the obsolete 50px table padding that exposes an empty grid.
- Render module labels and super-group headers as intentional full-width visual rows without anonymous or narrow cells.
- Reproduce complete-module grouping with suffix-format details such as `...-013-D1` and interleaved rows.
- Correct only deterministic grouping defects demonstrated by tests, including configuration/history consistency if implicated.
- Add desktop browser geometry and focused unit/component regression coverage.

## Non-goals

- Changing raw `detalle` values.
- Adding nested super-groups.
- Changing Firebase production behavior.
- Redesigning unrelated table controls or service summaries.
- Push, pull request, merge, deployment, Firefox, or WebKit testing.

## Constraints

- Keep eleven columns in header, module-label, and data rows.
- Keep `DETALLE` dominant, row numbers compact, and `ACCIONES` reachable.
- Preserve legacy module key `D1-005` and configurable prefix/position parsing.
- A selected row expands to its complete module before grouping.
- Super-group membership remains one-level and unique.
- Browser verification uses only `demo-adn-e2e` and localhost Firebase emulators.
- Use observed RED/GREEN evidence for behavior and geometry changes.

## Tasks

### REG-1 — Repair table and super-group composition

- [ ] Add regression assertions for the empty band and full-width super-group header.
- [ ] Establish one shared eleven-column layout for header, module labels, data rows, and super-group presentation.
- [ ] Remove obsolete spacing that creates the blank bordered grid.
- [ ] Keep desktop and mobile horizontal behavior stable.

Acceptance:
- No bordered empty row appears between the toolbar and header.
- Module labels do not sit behind the sticky header.
- A super-group header spans the complete table width without wrapping into the row-number column.
- Existing data-column proportions remain intact.

Planned commit: `fix(despiece): repair grouped table layout`

### REG-2 — Verify and correct complete-module grouping

- [ ] Reproduce grouping with multiple `...-013-D1` rows plus `...-003-D1`, including interleaving.
- [ ] Assert preview, persisted module keys, reordered rows, and rendered counts use all matching rows.
- [ ] Test configuration consistency across creation, reload/reconciliation, and history restore.
- [ ] Correct only the smallest proven functional defect.

Acceptance:
- Selecting one row from each module groups every row of both modules.
- The rendered summary distinguishes module membership from row count unambiguously.
- Suffix-format details resolve under the configured group-before-design/either mode.
- Restoring or loading cannot silently reinterpret a group under a mismatched parser configuration.

Planned commit: `fix(despiece): preserve complete super-group membership`

### REG-3 — Run isolated acceptance and record evidence

- [ ] Run focused Jest suites.
- [ ] Run desktop/mobile Chromium grouping and geometry coverage against local emulators.
- [ ] Run a production build with emulator variables unset.
- [ ] Confirm endpoint isolation, clean generated artifacts, and run `git diff --check`.
- [ ] Record exact evidence and remaining boundaries.

Acceptance:
- No candidate-caused blocker remains in the tested Chromium lane.
- Production Firebase and CSP behavior are unchanged.
- The feature branch is clean and each correction is a reviewable work unit.

Planned commit: `docs(odd): record grouped table regression evidence`

## Progress

- Current task: REG-1.
- Completed tasks: none.
- Read-only diagnosis confirmed two visual defects: obsolete table padding/sticky composition and a one-cell super-group row constrained to the 4% row-number column.
- Functional grouping remains under test: normal application code expands selected IDs through canonical module keys, but the screenshots require a suffix-format/configuration regression reproducer before declaring the count correct.

## Verification evidence

Pending.

## Next step

Create failing layout assertions, then implement the smallest coherent eleven-column composition correction.
