# Find and Replace Specification

## Purpose

Allow controlled content replacement from a modal while making matching mode, affected scope, preview, and cancellation explicit.

## Requirements

### Requirement: Distinguish literal and regular-expression matching

The system MUST provide distinct literal and regular-expression modes. Literal mode MUST treat the search text as plain text, including regex metacharacters. Regular-expression mode MUST interpret the search text as a pattern and MUST reject invalid patterns before preview or replacement.

#### Scenario: Literal search contains metacharacters

- GIVEN literal mode is selected and the search text contains regex metacharacters
- WHEN the user searches or previews replacement
- THEN the characters are matched literally and are not interpreted as a pattern

#### Scenario: Valid regular expression is used

- GIVEN regular-expression mode is selected with a valid pattern
- WHEN the user searches
- THEN only content matching that pattern in the permitted scope is included in the result

#### Scenario: Invalid regular expression is entered

- GIVEN regular-expression mode is selected with an invalid pattern
- WHEN the user requests a search, preview, or replacement
- THEN the operation is blocked, an actionable validation error is shown, and content remains unchanged

### Requirement: Constrain replacement scope and preview changes

The system MUST limit find and replace to the active despiece content in the current workflow scope. Before applying a non-empty result, the modal MUST provide a preview that makes the affected matches and resulting change reviewable. A search with no matches MUST produce an explicit no-change result.

#### Scenario: Preview stays within workflow scope

- GIVEN matching text exists in the active despiece and in unrelated application data
- WHEN the user previews a replacement
- THEN only active despiece matches appear in the preview and unrelated data is untouched

#### Scenario: No matches are found

- GIVEN the selected mode and pattern are valid but no text matches within the active scope
- WHEN the user previews replacement
- THEN the preview reports no changes and applying it performs no mutation

### Requirement: Apply or cancel consistently

The system MUST apply only the reviewed search mode, pattern, replacement, and scope after explicit confirmation. A successful apply MUST update the workflow and persistence consistently. Cancelling or closing the modal MUST discard pending input and preview changes without mutating content.

#### Scenario: Reviewed replacement is applied

- GIVEN a valid preview exists for the active scope and the user confirms it
- WHEN replacement completes successfully
- THEN the displayed and persisted despiece contain the same intended replacements

#### Scenario: User cancels replacement

- GIVEN pending find/replace input or a preview exists
- WHEN the user cancels or closes the modal
- THEN the modal state is discarded and the original displayed and persisted content remains unchanged
