## 1. Theme Infrastructure

- [x] 1.1 Add FOUC-prevention inline script to `layout.tsx` `<head>` that reads `localStorage` / `prefers-color-scheme` and sets `data-theme` on `<html>` before paint
- [x] 1.2 Create `ThemeProvider` client component that syncs React state with `data-theme`, `localStorage`, and responds to system preference changes
- [x] 1.3 Remove hard-coded `className="dark"` from `<html>` in `layout.tsx` and inject the inline script block

## 2. Design Tokens & Global Styles

- [x] 2.1 Extend `globals.css` with a light-mode `:root` block gated by `html[data-theme="light"]` overriding `--bg`, `--fg`, `--border`, `--muted`, and derived tokens
- [x] 2.2 Adjust film-grain overlay opacity for light mode (`opacity: 0.06`) under the light data-theme selector
- [x] 2.3 Add light-mode variants for event-horizon keyframes and active/dragover states using dark borders and faint dark shadows
- [x] 2.4 Verify `::selection` and `focus-visible` styles remain legible in both themes

## 3. Component Audit & Hard-coded Color Cleanup

- [x] 3.1 Run `grep` across `src/` for hard-coded dark colors (`#fff`, `#000`, `white`, `black`, `#0a0a0a`, `#333`, etc.) in JSX/TSX and CSS
- [x] 3.2 Replace all hard-coded colors with `var(--bg)` / `var(--fg)` / `var(--border)` / `var(--muted)` or Tailwind `bg-bg`, `text-fg`, `border-border` utilities
- [x] 3.3 Audit `src/components/` for any inline styles or SVG fills that ignore theme tokens and fix them

## 4. Theme Toggle UI

- [x] 4.1 Build `ThemeToggle` client component with D/L toggle no sun moon icons etc. we cannot break the design philosiphy and `aria-label` that announces current theme
- [x] 4.2 Place `ThemeToggle` in a persistent global location (e.g., top-right of header or footer) across all pages
- [x] 4.3 Ensure toggle is keyboard accessible and triggers theme change on Enter/Space

## 5. QA & Verification

- [x] 5.1 Verify no FOUC when loading the app directly in light mode (hard refresh)
- [x] 5.2 Verify theme preference persists across navigation and hard reloads
- [x] 5.3 Test upload page, download page, and file-info cards in both themes
- [x] 5.4 Run `npm run lint` and `npx tsc --noEmit` to confirm no TypeScript or lint regressions
