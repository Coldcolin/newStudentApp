"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useIsAuthenticated } from "@/lib/store/hooks";
import {
  DEFAULT_PROGRAM_SETTINGS,
  getProgramSettings,
  type ProgramSettings,
} from "@/lib/api/settings";

interface ProgramSettingsContextValue extends ProgramSettings {
  isLoading: boolean;
  /**
   * False until the first fetch has settled. Callers that seed a default week
   * must wait for this — otherwise they latch onto the placeholder week 1 and
   * never move to the configured week.
   */
  isLoaded: boolean;
  /** Re-fetch after a save, so the new week reaches every page without a reload. */
  refresh: () => Promise<void>;
  /** Apply a settings payload the caller already has, avoiding a second round trip. */
  applySettings: (settings: ProgramSettings) => void;
}

const ProgramSettingsContext = createContext<ProgramSettingsContextValue>({
  ...DEFAULT_PROGRAM_SETTINGS,
  isLoading: false,
  isLoaded: false,
  refresh: async () => {},
  applySettings: () => {},
});

/**
 * Fetches the cohort's program settings once and shares them app-wide, so every
 * week picker, greeting and grading default reads from the same value.
 */
export function ProgramSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = useIsAuthenticated();
  const [settings, setSettings] = useState<ProgramSettings>(
    DEFAULT_PROGRAM_SETTINGS,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    // Nothing to wait for when signed out — mark it settled so the week pickers
    // on any public surface still render.
    if (!isAuthenticated) {
      setIsLoaded(true);
      return;
    }
    setIsLoading(true);
    try {
      const data = await getProgramSettings();
      setSettings(data.settings);
    } catch (error) {
      // Fall back to the defaults rather than blocking the page — an unreachable
      // settings endpoint should degrade to "week 1", not an empty task board.
      console.error("Failed to load program settings:", error);
    } finally {
      setIsLoading(false);
      setIsLoaded(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ProgramSettingsContext.Provider
      value={{
        ...settings,
        isLoading,
        isLoaded,
        refresh,
        applySettings: setSettings,
      }}
    >
      {children}
    </ProgramSettingsContext.Provider>
  );
}

export const useProgramSettings = () => useContext(ProgramSettingsContext);
