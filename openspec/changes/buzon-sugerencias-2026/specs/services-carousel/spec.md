# Services Carousel Specification

## Purpose

Provide a responsive, accessible way to browse the services available in the active despiece workflow.

## Requirements

### Requirement: Browse available services

The system MUST present the available services as navigable carousel items without changing service data or selection merely because the user browses. Every available item MUST remain reachable through the carousel controls and its content MUST remain identifiable.

#### Scenario: User browses multiple services

- GIVEN the active workflow has more services than the currently visible carousel area
- WHEN the user advances or reverses the carousel
- THEN the next or previous services become visible without altering their data

#### Scenario: Carousel has no services

- GIVEN the active workflow has an empty service collection
- WHEN the services area is rendered
- THEN a clear empty-state fallback is shown, carousel navigation is not presented as usable, and no service is selected

### Requirement: Provide responsive and safe layout behavior

The carousel MUST adapt its visible items and controls to the available viewport width. It MUST NOT require horizontal page scrolling, clip service identity or actions, or make an item unreachable at supported responsive sizes. If carousel presentation cannot be used for the current layout, the services MUST remain available through the workflow's non-carousel fallback.

#### Scenario: Viewport changes size

- GIVEN services are available and the viewport changes between supported desktop and narrow widths
- WHEN the services area reflows
- THEN visible items and controls fit the viewport and remain usable without clipped content

#### Scenario: Carousel presentation is unavailable

- GIVEN the carousel cannot be rendered or its layout is not usable in the current context
- WHEN the services area is displayed
- THEN the fallback presents the available services without data loss or an unusable blank area

### Requirement: Support keyboard-accessible browsing

The system MUST expose carousel navigation and service items through a logical keyboard focus order. Keyboard users MUST be able to reach the same services and actions available to pointer users, and focus MUST remain visible while browsing.

#### Scenario: Keyboard user navigates services

- GIVEN the services carousel contains available items
- WHEN a keyboard user focuses the carousel and uses its navigation controls
- THEN focusable controls move through the services without requiring a pointer or double click
