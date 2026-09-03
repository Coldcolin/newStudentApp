import axiosInstance from "./axios";

/**
 * Class-day exception requests.
 *
 * A student asks to be excused from one or more class days; every tutor is
 * notified, and a tutor approves or declines. An approved request marks those
 * days excused in attendance, so they are never scored as an absence.
 *
 * These endpoints live under the backend's own `/api` router, so the paths here
 * carry a literal `/api` segment — the same as `/api/assignments/*` in
 * `./assignments`. (`NEXT_PUBLIC_API_URL` is `/api` and `next.config.mjs`
 * rewrites `/api/:path*` to the backend root, so the prefix is consumed there.)
 *
 * There is a server-side cap on how many exceptions a student may hold, and it
 * is deliberately invisible to them: the backend never sends a count, a
 * remaining, or a distinguishable error when it is reached — a blocked student
 * just gets a generic "speak with your tutor" message through the normal error
 * path. Nothing in the student-facing types below should ever grow a quota
 * field.
 */

export const EXCEPTION_REASON_CATEGORIES = [
  "Medical",
  "Family emergency",
  "Work / Interview",
  "Travel",
  "Bereavement",
  "Other",
] as const;

export type ExceptionReasonCategory =
  (typeof EXCEPTION_REASON_CATEGORIES)[number];

export type ExceptionStatus = "Pending" | "Approved" | "Declined";

/** At most this many class days may be named in a single request. */
export const MAX_EXCEPTION_DATES = 3;

/** The shape students receive. Carries no quota information, by design. */
export interface ClassExceptionRequest {
  _id: string;
  /** Class days being missed, as "YYYY-MM-DD". */
  dates: string[];
  reasonCategory: ExceptionReasonCategory;
  reason: string;
  catchUpPlan?: string;
  impactAcknowledged?: boolean;
  status: ExceptionStatus;
  reviewNote?: string;
  reviewedAt?: string | null;
  weekAtRequest?: number;
  createdAt: string;
}

/** The tutor view: the same request, plus who asked and where they stand. */
export interface ClassExceptionRequestForTutor extends ClassExceptionRequest {
  student: {
    _id: string;
    name: string;
    image?: string;
    stack?: string;
    email?: string;
  };
  quotaUsed: number;
  quotaRemaining: number;
  quotaLimit: number;
}

export interface CreateExceptionRequestPayload {
  dates: string[];
  reasonCategory: ExceptionReasonCategory;
  reason: string;
  catchUpPlan?: string;
  impactAcknowledged?: boolean;
}

/**
 * Submit a request to be excused from class (students only).
 *
 * Rejections arrive as a normal API error — surface `error.message` as-is. Do
 * not special-case it: the message for a student who has used their allowance
 * is intentionally indistinguishable from any other refusal, and branching on
 * it here would leak the cap the backend works to hide.
 */
export async function createExceptionRequest(
  payload: CreateExceptionRequestPayload,
): Promise<{ message: string; request: ClassExceptionRequest }> {
  const response = await axiosInstance.post(`/api/class-exceptions`, payload);
  return response.data;
}

/** The signed-in student's own requests, newest first. */
export async function getMyExceptionRequests(): Promise<{
  requests: ClassExceptionRequest[];
}> {
  const response = await axiosInstance.get(`/api/class-exceptions/mine`);
  return response.data;
}

/** The review queue, pending first (Tutor/Admin only). */
export async function getExceptionRequests(params?: {
  status?: ExceptionStatus;
  stack?: string;
}): Promise<{ requests: ClassExceptionRequestForTutor[] }> {
  const response = await axiosInstance.get(`/api/class-exceptions`, { params });
  return response.data;
}

/** Approve or decline a pending request (Tutor/Admin only). */
export async function reviewExceptionRequest(
  id: string,
  data: { status: "Approved" | "Declined"; reviewNote?: string },
): Promise<{ message: string; request: ClassExceptionRequestForTutor }> {
  const response = await axiosInstance.patch(
    `/api/class-exceptions/${id}/review`,
    data,
  );
  return response.data;
}

// ---------- Date helpers ----------

/** Weekday numbers classes run on, mirroring CLASS_DAYS in the backend. */
const CLASS_DAYS = [1, 3, 5]; // Mon, Wed, Fri

export const CLASS_DAY_HINT =
  "Classes run on Mondays, Wednesdays and Fridays.";

/**
 * Whether a "YYYY-MM-DD" string falls on a class day.
 *
 * Parsed by parts rather than with `new Date(str)`, which reads the string as
 * UTC and can land on the wrong weekday west of Greenwich.
 */
export function isClassDay(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return false;
  return CLASS_DAYS.includes(new Date(year, month - 1, day).getDay());
}

/** "2026-09-07" → "Mon, 7 Sep 2026". Same by-parts parsing as above. */
export function formatExceptionDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;

  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Today as "YYYY-MM-DD" in local time, for a date input's `min`. */
export function todayISO(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
