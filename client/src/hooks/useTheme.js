import { useState, useEffect, useCallback } from "react";

/**
 * useTheme Hook: Manages 'dark' | 'light' mode with localStorage persistence.
 * Synchronizes class on `document.documentElement` (`<html>`).
 */
export const useTheme = () => {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === "undefined") return "dark";
    const saved = localStorage.getItem("easilia_theme");
    if (saved === "dark" || saved === "light") return saved;
    // Default to dark for merchant workstation or check system preference
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("easilia_theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const setTheme = useCallback((newTheme) => {
    if (newTheme === "dark" || newTheme === "light") {
      setThemeState(newTheme);
    }
  }, []);

  return {
    theme,
    isDark: theme === "dark",
    isLight: theme === "light",
    toggleTheme,
    setTheme,
  };
};

export default useTheme;
