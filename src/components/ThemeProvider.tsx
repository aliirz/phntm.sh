"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback for test environments / SSR where provider isn't mounted
    return { theme: "dark" as Theme, toggleTheme: () => {} };
  }
  return ctx;
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem("phntm-theme") as Theme | null;
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("phntm-theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    const listener = (e: MediaQueryListEvent) => {
      // Only react if no user preference is stored
      try {
        const stored = localStorage.getItem("phntm-theme");
        if (!stored) {
          setTheme(e.matches ? "light" : "dark");
        }
      } catch {
        // ignore
      }
    };
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
