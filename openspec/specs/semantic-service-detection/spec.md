# Semantic Service Detection Specification

## Purpose

Detect and validate services from despiece content without relying on unsafe substring matches or changing persisted data unexpectedly.

## Requirements

### Requirement: Semantically detect services

The system MUST identify a known service when the despiece content expresses that service through supported wording or formatting variations. It MUST NOT classify unrelated text, partial words, or merely similar labels as that service. Detection SHOULD expose unresolved or ambiguous content for validation rather than silently guessing.

#### Scenario: Valid service wording is detected

- GIVEN despiece content clearly describes a known service with permitted wording or formatting variation
- WHEN service detection runs
- THEN the corresponding canonical service is returned

#### Scenario: Potential false positive is rejected

- GIVEN content contains a service-like substring inside unrelated text or a different word
- WHEN service detection runs
- THEN that content is not classified as the service

#### Scenario: Potential false negative is surfaced

- GIVEN content appears to describe a known service but does not match a supported semantic form unambiguously
- WHEN service detection runs
- THEN the result is unresolved or requires validation, and no unverified service is persisted

### Requirement: Validate detected services and empty results

The system MUST distinguish valid, invalid, and unresolved service results. A valid result MUST reference an available canonical service; an invalid or unresolved result MUST remain visibly actionable without being converted into a valid service. An empty service set MUST be represented as an intentional empty result.

#### Scenario: Valid result passes validation

- GIVEN detection returns a service available in the current service data
- WHEN validation runs
- THEN validation succeeds against that canonical service

#### Scenario: No services are available

- GIVEN the current despiece contains no detectable service or the available service set is empty
- WHEN detection and validation complete
- THEN the result is empty, no service is selected, and no error is reported as a detected service

#### Scenario: Invalid result is not accepted

- GIVEN a detected value cannot be resolved to an available canonical service
- WHEN validation runs
- THEN validation fails and the unresolved value is not saved as a valid service

### Requirement: Keep service state consistent

The system MUST use the validated canonical service result for the in-memory workflow and persistence. Cancelled, rejected, or failed validation MUST leave the previously persisted service state unchanged.

#### Scenario: Valid service is persisted consistently

- GIVEN a service has passed validation
- WHEN the user accepts the result and persistence completes
- THEN the workflow view and persisted despiece contain the same canonical service

#### Scenario: Validation is cancelled or fails

- GIVEN the current service state is persisted and a new result is unresolved, rejected, cancelled, or cannot be saved
- WHEN the operation ends
- THEN the previous service state remains unchanged and the UI does not report an uncommitted result as saved
