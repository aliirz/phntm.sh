## Why

PHNTM currently ships with a single dark cyberpunk/terminal aesthetic. User feedback and accessibility best practices demand an alternative light mode. A light theme improves usability in bright environments and broadens the app's appeal without compromising the existing brand identity.

## What Changes

- Add a toggleable light/dark theme system across the entire UI.
- Introduce a light-mode color palette mapped to existing CSS custom properties.
- Persist user theme preference in `localStorage` and default to system preference via `prefers-color-scheme`.
- Update all UI components (buttons, inputs, modals, progress indicators, file cards, auth screens) to respect the active theme.
- Adjust the film-grain overlay and "event horizon" animation so they remain visible and on-brand in light mode.
- **BREAKING**: The `dark` class on `<html>` will no longer be hard-coded; theme initialization will run before first paint to avoid flash-of-unstyled-content (FOUC).

## Capabilities

### New Capabilities
- `light-mode`: Theme toggle, light palette, and system-preference detection for the entire application surface.

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- `src/app/globals.css` — expanded design tokens for light mode.
- `src/app/layout.tsx` — script injection for FOUC-free theme initialization.
- All page and component files — conditional class/styles based on theme state.
- `tailwind.config.ts` (if present) or Tailwind v4 CSS config — extended color/background mappings.
- No API, encryption, or storage changes.
