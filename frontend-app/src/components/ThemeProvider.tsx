"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "dark" | "light";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);
const THEME_KEY = "ancap-theme-v1";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    if (stored === "dark" || stored === "light") {
      setThemeState(stored);
      applyTheme(stored);
    } else {
      applyTheme("dark");
    }
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === "light") {
      root.style.setProperty("--bg", "#f8fafc");
      root.style.setProperty("--bg-elev-1", "#ffffff");
      root.style.setProperty("--bg-card", "#f1f5f9");
      root.style.setProperty("--text", "#0f172a");
      root.style.setProperty("--text-muted", "#64748b");
      root.style.setProperty("--accent", "#059669");
      root.style.setProperty("--accent-strong", "#10b981");
      root.style.setProperty("--accent-dim", "rgba(5, 150, 105, 0.12)");
      root.style.setProperty("--border", "#cbd5e1");
      root.style.setProperty("--border-strong", "#94a3b8");
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.style.setProperty("--bg", "#070b16");
      root.style.setProperty("--bg-elev-1", "#0f1526");
      root.style.setProperty("--bg-card", "#121a2d");
      root.style.setProperty("--text", "#ecf4ff");
      root.style.setProperty("--text-muted", "#9fb3cc");
      root.style.setProperty("--accent", "#19c38a");
      root.style.setProperty("--accent-strong", "#31d79f");
      root.style.setProperty("--accent-dim", "rgba(25, 195, 138, 0.18)");
      root.style.setProperty("--border", "#24324b");
      root.style.setProperty("--border-strong", "#33486b");
      root.classList.remove("light");
      root.classList.add("dark");
    }
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    applyTheme(t);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
