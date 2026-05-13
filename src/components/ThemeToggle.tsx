"use client";

import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      onClick={toggleTheme}
      className={`font-mono text-[10px] tracking-[0.2em] uppercase border border-border px-3 py-1.5 bg-transparent text-fg hover:bg-fg hover:text-bg transition-all duration-100 ${className}`}
      aria-label={`Current theme is ${theme}. Click to switch to ${isLight ? "dark" : "light"} mode.`}
      title={`Switch to ${isLight ? "D" : "L"} mode`}
    >
      {isLight ? "D" : "L"}
    </button>
  );
}
