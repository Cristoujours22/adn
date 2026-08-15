# Module Renaming Specification

## Purpose

Rename a module through an explicit modal while preserving module integrity, validation rules, accessibility, and persistence consistency.

## Requirements

### Requirement: Open one consistent rename interaction

The system MUST allow the selected module to be renamed from the rename modal and MUST open that same modal from the module's double-click interaction. The rename action MUST also be reachable through keyboard focus and activation, with the current module name visible for editing.

#### Scenario: Rename modal opens from double click

- GIVEN a module is visible and selectable
- WHEN the user double-clicks the module
- THEN the rename modal opens for that module with its current name

#### Scenario: Keyboard user opens rename

- GIVEN the module or its rename affordance is focused
- WHEN the keyboard user activates the available rename action
- THEN the same rename modal opens without requiring a pointer or double click

### Requirement: Reject empty and duplicate module names

The system MUST reject an empty or whitespace-only proposed name. It MUST reject a name that duplicates another module in the applicable module scope, and MUST preserve the original name while reporting the validation reason. A rejected name MUST NOT be persisted.

#### Scenario: Empty name is submitted

- GIVEN the rename modal contains an empty or whitespace-only proposed name
- WHEN the user attempts to confirm the rename
- THEN confirmation is blocked, an actionable validation message is shown, and the original name remains

#### Scenario: Duplicate name is submitted

- GIVEN another module in the applicable scope already has the proposed name
- WHEN the user attempts to confirm the rename
- THEN confirmation is blocked, the duplicate is reported, and no module is merged or overwritten

### Requirement: Persist valid renames and honor cancellation

The system MUST apply a valid rename only to the selected module and MUST keep displayed state, module references within the active workflow, and persisted data consistent. Cancelling, closing, rejecting, or failing to persist a rename MUST leave the prior name and persisted state unchanged or clearly report an unsaved failure without claiming success.

#### Scenario: Valid rename is confirmed

- GIVEN the proposed name is non-empty and unique in the applicable scope
- WHEN the user confirms and persistence succeeds
- THEN the selected module, its active-workflow references, and persisted data use the new name consistently

#### Scenario: Rename is cancelled or persistence fails

- GIVEN a rename is pending or a valid rename cannot be persisted
- WHEN the user cancels, closes, or the save fails
- THEN the previous name remains authoritative and the UI does not present the rename as successfully saved
