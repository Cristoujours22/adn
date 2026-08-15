# Proposal: Buzón de Sugerencias 2026

## Intent

Improve the ADN despiece workflow with four frozen suggestions: reliable semantic service detection/validation, faster service browsing, controlled find/replace, and convenient module renaming. The change targets current editing friction without expanding beyond these four capabilities.

## Scope

### In Scope
- Semantic detection and validation of services in despiece content.
- A services carousel implemented with `react-slick`.
- Find/replace in a modal, including regex support.
- Module renaming through a modal and double-click interaction.

### Out of Scope
- Product requirements, workflows, or integrations not required by the four capabilities above.
- Unrelated despiece behavior, data migrations, or broad UI redesign.

## Capabilities

### New Capabilities
- `semantic-service-detection`: Detect and validate services semantically within the despiece workflow.
- `services-carousel`: Browse services through a `react-slick` carousel.
- `find-replace`: Find and replace content from a modal with regex support.
- `module-renaming`: Rename modules from a modal or double-click interaction.

### Modified Capabilities
- None. No existing OpenSpec capability requirements are present in this worktree.

## Approach

Extend the existing `ModeloDespiece` workflow and service/calculation utilities, keeping detection and transformation logic isolated from presentation where practical. Add the carousel and modal interactions within the existing Despieces components, reuse current state and persistence paths, and add only the dependency and styling required by the frozen scope. Define exact matching, replacement, rename, and validation scenarios during the specs phase.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/ModeloDespiece.js` | Modified | Coordinate service, modal, carousel, and rename interactions. |
| `src/utils/despieceCalculations.js` | Modified | Support semantic service matching/validation logic. |
| `src/components/Despieces/` | Modified | Add carousel, modal, and double-click editing UI. |
| `src/App.module.css` | Modified | Style the new controls and surfaces. |
| `package.json` | Modified | Add `react-slick` if not already available. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Semantic matching produces false positives or misses valid services. | Med | Define representative positive and negative scenarios before implementation. |
| Regex replacement or renaming alters unintended content. | High | Constrain transformations to the selected workflow scope and verify state before persistence. |
| Carousel dependency conflicts with the current CRA setup. | Med | Validate dependency compatibility and isolate the carousel integration. |

## Rollback Plan

Revert the feature changes and remove the carousel dependency if unused. Because the proposal introduces no data migration, rollback restores the existing despiece workflow and persistence behavior.

## Dependencies

- Existing React 18/Create React App despiece workflow and service data model.
- `react-slick` and its required styling/peer dependencies.

## Success Criteria

- [ ] Each of the four capabilities is available in the despiece workflow without unrelated behavior changes.
- [ ] Service detection/validation, carousel browsing, modal find/replace with regex, and modal/double-click renaming satisfy their approved spec scenarios.
- [ ] Existing service and module data remains usable after the change.
