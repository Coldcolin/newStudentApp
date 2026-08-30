import axiosInstance from "./axios";

/**
 * Student-of-the-Week selection.
 *
 * These endpoints live at the root of the backend (`/algo/*`), not under its
 * `/api` prefix, so the paths here carry no `/api` segment — the same as
 * `/rating/*` in `./assignments`.
 *
 * The algorithm ranks students on their weekly `ratings.total` (the five-category
 * grade), not on assignment grades directly, so a week with no ratings entered
 * is rejected even when every assignment has been graded. Selections are also
 * not idempotent: a second run for a week that already has a winner is refused.
 */

export type SotwStack = "front" | "back" | "product";

const SOTW_ENDPOINTS: Record<SotwStack, string> = {
  front: "/algo/sotwfront",
  back: "/algo/sotwback",
  product: "/algo/sotwproduct",
};

export const SOTW_STACK_LABELS: Record<SotwStack, string> = {
  front: "Front-End",
  back: "Back-End",
  product: "Product Design",
};

export interface SelectStudentOfTheWeekResponse {
  data?: string;
  message?: string;
}

export interface StudentOfTheMonthWinner {
  id: string;
  name: string;
  average: number;
}

export interface SelectStudentsOfTheMonthResponse {
  front?: StudentOfTheMonthWinner;
  back?: StudentOfTheMonthWinner;
  product?: StudentOfTheMonthWinner;
}

/**
 * Pick the student of the week for one stack (Admin/Tutor only).
 * Endpoint: POST /algo/sotwfront | /algo/sotwback | /algo/sotwproduct
 */
export async function selectStudentOfTheWeek(
  stack: SotwStack,
  week: number,
): Promise<SelectStudentOfTheWeekResponse> {
  const response = await axiosInstance.post(SOTW_ENDPOINTS[stack], { week });
  return response.data;
}

/**
 * Pick the students of the month across all three stacks, from each student's
 * last four weekly ratings (Admin/Tutor only).
 *
 * Note: the backend saves these winners into the same weekly SOW/BSOW/PSOW
 * records the weekly picks use, under the `week` passed here, and does not check
 * for an existing winner first — so this overwrites what the dashboard shows as
 * that week's Student of the Week.
 *
 * Endpoint: POST /algo/sotm
 */
export async function selectStudentsOfTheMonth(
  week: number,
): Promise<SelectStudentsOfTheMonthResponse> {
  const response = await axiosInstance.post("/algo/sotm", { week });
  return response.data;
}
