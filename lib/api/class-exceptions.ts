import axiosInstance from "./axios";

/**
 * Class-day exception requests.
 *
 * A student asks to be excused from one class day; every tutor is notified, and
 * a tutor approves or declines. An approved request marks that day excused in
 * attendance, so it is never scored as an absence.
 *
 * These endpoints live under the backend's own `/api` router, so the paths here
 * carry a literal `/api` segment — the same as `/api/assignments/*` in
 * `./assignments`. (`NEXT_PUBLIC_API_URL` is `/api` and `next.config.mjs`
 * rewrites `/api/:path*` to the backend root, so the prefix is consumed there.)
 *
 * Each student gets an allowance of exception days per program, and it is shown
 * to them — see `ExceptionAllowance`, returned alongside their own requests.
 * Running out is not a dead end: `emergencyOnly` then goes true and they can
 * file emergency requests instead, which sit outside the allowance and are
 * still subject to a tutor's approval.
 */

export const EXCEPTION_REASON_CATEGORIES = [
  "Medical",
  "Family emergency",
  "Work / Interview",
  "Travel",
  "Bereavement",
  "Extra-curricular event",
  "Other",
] as const;

export type ExceptionReasonCategory =
  (typeof EXCEPTION_REASON_CATEGORIES)[number];

export type ExceptionStatus = "Pending" | "Approved" | "Declined";

/** Where a student stands. Describes the student, not any one request. */
export interface ExceptionAllowance {
  used: number;
  remaining: number;
  limit: number;
  /** True once the allowance is spent — new requests must be emergencies. */
  emergencyOnly: boolean;
}

/** The shape students receive. */
export interface ClassExceptionRequest {
  _id: string;
  /** The single class day being missed, as "YYYY-MM-DD". */
  date: string;
  /** Filed after the allowance ran out; does not consume it. */
  isEmergency: boolean;
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
  date: string;
  reasonCategory: ExceptionReasonCategory;
  reason: string;
  catchUpPlan?: string;
  impactAcknowledged?: boolean;
  /** Set when the allowance is spent; the server rejects it otherwise. */
  isEmergency?: boolean;
}

/**
 * Submit a request to be excused from class (students only).
 *
 * Rejections arrive as a normal API error — surface `error.message` as-is. The
 * server's messages already explain what to do (use an emergency request, wait
 * for the pending one to be reviewed, pick an eligible day), so there is
 * nothing to rewrite on this side.
 */
export async function createExceptionRequest(
  payload: CreateExceptionRequestPayload,
): Promise<{
  message: string;
  request: ClassExceptionRequest;
  allowance: ExceptionAllowance;
}> {
  const response = await axiosInstance.post(`/api/class-exceptions`, payload);
  return response.data;
}

/** The signed-in student's own requests, newest first, plus their allowance. */
export async function getMyExceptionRequests(): Promise<{
  requests: ClassExceptionRequest[];
  allowance: ExceptionAllowance;
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

/**
 * Weekday numbers an exception may be requested for, mirroring EXCEPTION_DAYS
 * in the backend controller: the three class days plus Saturday, which carries
 * extra-curricular events.
 *
 * Note this is wider than the days classes actually run — Saturday is not a
 * check-in day and is not scored.
 */
const EXCEPTION_DAYS = [1, 3, 5, 6]; // Mon, Wed, Fri, Sat

export const EXCEPTION_DAY_HINT =
  "You can request Mondays, Wednesdays, Fridays or Saturdays.";

/**
 * Whether a "YYYY-MM-DD" string falls on a day an exception can be requested
 * for.
 *
 * Parsed by parts rather than with `new Date(str)`, which reads the string as
 * UTC and can land on the wrong weekday west of Greenwich.
 */
export function isExceptionDay(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return false;
  return EXCEPTION_DAYS.includes(new Date(year, month - 1, day).getDay());
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
