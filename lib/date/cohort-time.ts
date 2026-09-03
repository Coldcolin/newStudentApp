/**
 * Assignment deadlines are cohort wall-clock times, not viewer-local ones.
 *
 * The API stores a `dueDateTime` instant but accepts `dueDate` + `dueTime` as
 * naive strings, so anything that converts between the two has to name the
 * cohort's zone. Reading the instant with local getters (or slicing its ISO
 * string) silently shifts the deadline by the viewer's UTC offset.
 *
 * Mirrors COHORT_TIMEZONE in the backend's utils/cohortTime.js.
 */
export const COHORT_TIMEZONE = "Africa/Lagos";

type Parts = Record<string, string>;

function cohortParts(value: string, options: Intl.DateTimeFormatOptions): Parts | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: COHORT_TIMEZONE, ...options })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
}

/**
 * Splits a stored `dueDateTime` into the `{ dueDate, dueTime }` strings the API
 * expects back, read in the cohort's zone. The inverse of the backend's
 * parseCohortDateTime, so a task can be opened and saved without drifting.
 */
export function splitCohortDateTime(value: string): {
  deadline: string;
  deadlineTime: string;
} {
  const parts = cohortParts(value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (!parts) return { deadline: "", deadlineTime: "23:59" };

  // en-CA renders midnight as "24" in some runtimes; the API wants "00".
  const hour = parts.hour === "24" ? "00" : parts.hour;

  return {
    deadline: `${parts.year}-${parts.month}-${parts.day}`,
    deadlineTime: `${hour}:${parts.minute}`,
  };
}

/**
 * "10 Sep 2026, 2:00 am" in the cohort's zone — the fallback for when the
 * server has not sent its own `formattedDueDate`. Keeps the time, which the
 * previous `toLocaleDateString()` dropped while also shifting the date.
 */
export function formatCohortDueDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-GB", {
    timeZone: COHORT_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
