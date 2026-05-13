## ADDED Requirements

### Requirement: Theme preference detection
The system SHALL detect the user's theme preference before the first paint and apply it to the document root element.

#### Scenario: Default to system preference on first visit
- **WHEN** a user visits the application for the first time with no stored preference
- **THEN** the system MUST read `prefers-color-scheme` and set `data-theme` to `"light"` or `"dark"` accordingly

#### Scenario: Restore persisted preference
- **WHEN** a user has previously selected a theme
- **THEN** the system MUST read the stored choice from `localStorage` and apply it before React hydration

### Requirement: Light-mode color palette
The system SHALL render all UI surfaces using a light-mode color palette when `data-theme="light"` is active.

#### Scenario: Light-mode background and foreground
- **WHEN** the active theme is `"light"`
- **THEN** the background color MUST be a near-white value and the foreground text color MUST be a near-black value

#### Scenario: Accent color preserved
- **WHEN** the active theme is `"light"`
- **THEN** the accent color MUST remain the same cyan value (`#00FFD1`) used in dark mode

#### Scenario: Interactive element contrast
- **WHEN** the active theme is `"light"`
- **THEN** ghost buttons, inputs, borders, and muted text MUST use darkened equivalents of their dark-mode values to maintain readability

### Requirement: Theme toggle control
The system SHALL provide a user-visible control to switch between light and dark themes.

#### Scenario: Toggle switches theme
- **WHEN** the user activates the theme toggle
- **THEN** the system MUST flip the active theme, update the `data-theme` attribute, and persist the new choice in `localStorage`

#### Scenario: Toggle reflects current theme
- **WHEN** the active theme is `"light"` or `"dark"`
- **THEN** the toggle icon MUST visually indicate the current theme (e.g., sun for light, moon for dark)

### Requirement: Visual effects adaptation
The system SHALL adapt decorative visual effects so they remain visible in light mode.

#### Scenario: Film-grain overlay visibility
- **WHEN** the active theme is `"light"`
- **THEN** the film-grain overlay opacity MUST increase sufficiently to remain perceptible on a light background

#### Scenario: Event-horizon ring visibility
- **WHEN** the active theme is `"light"`
- **THEN** the event-horizon ring MUST use dark border colors and faint dark shadows instead of light ones

### Requirement: No flash of unstyled content
The system SHALL ensure the correct theme is applied before any content is rendered.

#### Scenario: Theme renders before paint
- **WHEN** the page loads with any theme preference
- **THEN** the correct theme colors MUST be active before the first frame is painted to the screen

### Requirement: Accessibility of theme choice
The system SHALL expose the theme toggle and state in an accessible manner.

#### Scenario: Toggle keyboard accessible
- **WHEN** a keyboard user tabs to the theme toggle
- **THEN** the toggle MUST be focusable and activatable via keyboard

#### Scenario: Toggle labeled for screen readers
- **WHEN** a screen reader encounters the theme toggle
- **THEN** the toggle MUST announce the current theme and the action the control will perform
