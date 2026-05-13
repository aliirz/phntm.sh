## Context

PHNTM currently renders a single dark theme via CSS custom properties in `globals.css`. The `<html>` element is hard-coded with `className="dark"` in `layout.tsx`. Tailwind v4 is configured with an inline `@theme` block that maps those custom properties to utility classes. All components reference `var(--bg)`, `var(--fg)`, `var(--accent)`, etc., rather than using Tailwind `dark:` variants. There is no existing theme infrastructure.

## Goals / Non-Goals

**Goals:**
- Introduce a light-mode color palette that inverts backgrounds and foregrounds while preserving the cyan accent.
- Provide a visible theme toggle (icon button) in the global nav/header. Needs to properly accomodate mobile/responsive view as well.
- Respect `prefers-color-scheme` on first visit.
- Persist the user’s choice in `localStorage`.
- Prevent flash-of-unstyled-content (FOUC) so the correct theme renders before first paint.
- Ensure the film-grain overlay and event-horizon animation remain subtle and on-brand in light mode.

**Non-Goals:**
- No additional themes (no "system" auto-switching after first load beyond the initial default).
- No changes to encryption, upload/download flow, API routes, or Supabase integration.
- No redesign of component layouts or copy text.

## Decisions

### 1. Theme toggle mechanism: `data-theme` attribute on `<html>`
**Rationale:** CSS custom properties are already the source of truth. Toggling a `data-theme="light | dark"` attribute on `<html>` lets us scope overrides cleanly without fighting Tailwind’s `dark:` variant system, which the project does not currently use. An inline `<script>` in the `<head>` reads `localStorage` or `prefers-color-scheme` and sets the attribute before React hydrates, eliminating FOUC.

**Alternative considered:** Toggle the `dark` class already present on `<html>`. Rejected because `data-theme` is more explicit and avoids confusion with Tailwind v4’s automatic `dark` class behavior.

### 2. CSS architecture: dual `:root` blocks scoped by attribute
**Rationale:** Instead of flipping the existing `:root` to light and adding a `.dark` override, we introduce a second `:root` block gated by `html[data-theme="light"]`. This keeps the current dark values as the default (zero migration risk for any hard-coded dark assumptions) and only overrides when the user explicitly opts into light mode. All components continue to use `var(--bg)`, `var(--fg)`, etc., so zero component rewrites are required beyond ensuring no hard-coded hex values remain.

### 3. Film-grain overlay: reduce opacity in light mode
**Rationale:** The current `opacity: 0.035` is nearly invisible on white. We will raise it to `0.06` under `html[data-theme="light"]` so the texture remains perceptible without becoming noisy.

### 4. Event-horizon ring: swap to dark grays with reduced glow
**Rationale:** White glow on a white background is invisible. In light mode the ring will use `#bbb → #999` and a faint black shadow (`rgba(0,0,0,0.04)`).

### 5. Selection color: keep accent on dark text
**Rationale:** `::selection { background: var(--accent); color: #000; }` already works for both themes because light-mode text will be near-black and the cyan highlight provides sufficient contrast.

## Risks / Trade-offs

- **[Risk]** Any hard-coded color values inside components (e.g., `className="text-white"` or inline styles) will not respond to the theme.  
  → **Mitigation:** Audit components with `grep` for hex colors, `white`, `black`, `#fff`, `#000`, and replace with `var(--fg)` / `var(--bg)` or Tailwind `text-fg` / `bg-bg` utilities.

- **[Risk]** Third-party embedded widgets (if any) may not adapt.  
  → **Mitigation:** PHNTM has no third-party UI widgets beyond analytics, which is unaffected.

- **[Risk]** The accent color (`#00FFD1`) has lower contrast on a white background (≈1.8:1).  
  → **Mitigation:** Use the accent only for decorative elements, focus rings, and hover states, never for body text on white. Focus rings are thin (1px) and acceptable per WCAG for UI components.

## Migration Plan

1. Add the FOUC-prevention script tag to `layout.tsx` `<head>`.
2. Extend `globals.css` with light-mode custom properties under `html[data-theme="light"]` and adjust overlay/animation opacity.
3. Audit and fix any hard-coded dark colors in JSX/TSX files.
4. Add a theme-toggle React component (client) that reads/writes `localStorage` and toggles the `data-theme` attribute.
5. Place the toggle in a persistent location (e.g., top-right corner of the header or footer).
6. Manual QA: test both themes on upload, download, file-info, and expiry pages.

## Open Questions

- Should the toggle be a sun/moon icon pair or text labels (`DARK / LIGHT` in all-caps monospace to match brand voice)?  
  → *Recommendation:* Icon pair for compactness; label on hover for accessibility.

  Answer: We cannot break the brand we need no sun/moon. We need something like DARK/LIGHT or D/L we canot absolutely break the personaloty of the app.
