import axiosInstance from "./axios";

// Types

export interface ProgramSettings {
  /** Cohort start date as "YYYY-MM-DD", or null when not configured yet. */
  startDate: string | null;
  /** When set, pins the current week regardless of startDate. */
  weekOverride: number | null;
  totalWeeks: number;
  /** Resolved server-side: the override if pinned, otherwise derived from startDate. */
  currentWeek: number;
}

export type ProgramSettingsUpdate = Partial<
  Pick<ProgramSettings, "startDate" | "weekOverride" | "totalWeeks">
>;

/** Used when the settings request fails, so a settings outage never blanks the week pickers. */
export const DEFAULT_PROGRAM_SETTINGS: ProgramSettings = {
  startDate: null,
  weekOverride: null,
  totalWeeks: 24,
  currentWeek: 1,
};

/**
 * Get the program settings (any authenticated user)
 */
export async function getProgramSettings(): Promise<{
  settings: ProgramSettings;
}> {
  const response = await axiosInstance.get(`/api/settings/program`);
  return response.data;
}

/**
 * Update the program settings (Tutor/Admin access).
 * Every field is optional — send only what changed. Pass null to clear
 * `startDate` or `weekOverride`.
 */
export async function updateProgramSettings(
  data: ProgramSettingsUpdate,
): Promise<{ message: string; settings: ProgramSettings }> {
  const response = await axiosInstance.patch(`/api/settings/program`, data);
  return response.data;
}
