"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ThemePreference = "light" | "dark" | "system";

const THEME_KEY = "theme";
const COMPACT_KEY = "appearance-compact";
const REDUCE_MOTION_KEY = "appearance-reduce-motion";

interface AppearanceContextValue {
  theme: ThemePreference;
  compact: boolean;
  reduceMotion: boolean;
  setTheme: (value: ThemePreference) => void;
  setCompact: (value: boolean) => void;
  setReduceMotion: (value: boolean) => void;
}

const AppearanceContext = createContext<AppearanceContextValue>({
  theme: "system",
  compact: false,
  reduceMotion: false,
  setTheme: () => {},
  setCompact: () => {},
  setReduceMotion: () => {},
});

function applyClass(className: string, enabled: boolean) {
  document.documentElement.classList.toggle(className, enabled);
}

function resolveTheme(theme: ThemePreference) {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: ThemePreference) {
  const resolved = resolveTheme(theme);
  applyClass("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

function readStoredBoolean(key: string) {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(key) === "true";
}

function readStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

export function AppearanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const [compact, setCompactState] = useState(false);
  const [reduceMotion, setReduceMotionState] = useState(false);

  useEffect(() => {
    const storedTheme = readStoredTheme();
    const storedCompact = readStoredBoolean(COMPACT_KEY);
    const storedReduceMotion = readStoredBoolean(REDUCE_MOTION_KEY);
    setThemeState(storedTheme);
    setCompactState(storedCompact);
    setReduceMotionState(storedReduceMotion);
    applyTheme(storedTheme);
    applyClass("compact", storedCompact);
    applyClass("reduce-motion", storedReduceMotion);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readStoredTheme() === "system") {
        applyTheme("system");
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((value: ThemePreference) => {
    setThemeState(value);
    applyTheme(value);
    window.localStorage.setItem(THEME_KEY, value);
  }, []);

  const setCompact = useCallback((value: boolean) => {
    setCompactState(value);
    applyClass("compact", value);
    window.localStorage.setItem(COMPACT_KEY, String(value));
  }, []);

  const setReduceMotion = useCallback((value: boolean) => {
    setReduceMotionState(value);
    applyClass("reduce-motion", value);
    window.localStorage.setItem(REDUCE_MOTION_KEY, String(value));
  }, []);

  return (
    <AppearanceContext.Provider
      value={{
        theme,
        compact,
        reduceMotion,
        setTheme,
        setCompact,
        setReduceMotion,
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  return useContext(AppearanceContext);
}
