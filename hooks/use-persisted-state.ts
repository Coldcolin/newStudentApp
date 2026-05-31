import { useCallback, useEffect, useState } from "react";

function readStoredValue<T extends string>(
  storageKey: string,
  defaultValue: T,
  validValues: readonly T[],
): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored && (validValues as readonly string[]).includes(stored)) {
      return stored as T;
    }
  } catch {
    // Ignore storage read errors (private mode, quota, etc.)
  }
  return defaultValue;
}

export function usePersistedState<T extends string>(
  storageKey: string,
  defaultValue: T,
  validValues: readonly T[],
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    setValue(readStoredValue(storageKey, defaultValue, validValues));
  }, [storageKey, defaultValue, validValues]);

  const setPersistedValue = useCallback(
    (next: T) => {
      setValue(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // Ignore storage write errors
      }
    },
    [storageKey],
  );

  return [value, setPersistedValue];
}
