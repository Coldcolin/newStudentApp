import axiosInstance from "./axios";

/**
 * Attendance (check-in) data.
 *
 * These endpoints live on the backend's `/api/v1` router, so the paths here
 * carry a literal `/api/v1` prefix. (`NEXT_PUBLIC_API_URL` is `/api` and
 * `next.config.mjs` rewrites `/api/:path*` to the backend root, so the leading
 * `/api` is consumed there and `v1` reaches the router intact.)
 *
 * Scores are stored on a 0-20 scale — 20 on time, 10 late, 0 absent — so a
 * percentage is `score * 5`. Use `punctualityPercent` below rather than
 * open-coding the multiplier.
 */

/** One check-in, or one approved absence. */
export interface AttendanceRecord {
  _id: string;
  date: string;
  /** Absent on excused rows: nobody checked in. */
  time?: string;
  location: string;
  punctualityScore: number;
  image?: {
    url: string;
    public_id: string;
  };
  /**
   * "excused" rows come from an approved class-exception request rather than a
   * check-in: no time, no location, no image. They carry a 0 the backend
   * excludes from every average, so never render their score as a result.
   */
  status?: "present" | "excused";
  userId: string[];
  createdAt: string;
  updatedAt: string;
}

/** One row of the tutor-facing attendance table: a student and their totals. */
export interface AttendanceOverviewStudent {
  _id: string;
  name: string;
  email: string;
  image?: string;
  stack: string;
  presentCount: number;
  excusedCount: number;
  /** Class days that passed with neither a check-in nor an approved excuse. */
  missedCount: number;
  /** 0-20, excused days excluded. Null when the student has no scored days. */
  averagePunctualityScore: number | null;
  /** "YYYY-MM-DD", or null if they have never checked in. */
  lastCheckIn: string | null;
}

export interface AttendanceOverviewResponse {
  message: string;
  /** The program week this covers, or null for all-time. */
  week: number | null;
  /** The "YYYY-MM-DD" window `week` resolved to, or null for all-time. */
  range: { from: string; to: string } | null;
  /** The score a fully punctual day is worth — the denominator for a percentage. */
  maxScore: number;
  students: AttendanceOverviewStudent[];
}

export interface StudentAttendanceResponse {
  message: string;
  /** 0-20, excused days excluded. Undefined when nothing has been scored. */
  averagePunctualityScore?: number;
  data: AttendanceRecord[];
}

/**
 * Every student with their attendance rolled up (tutors/admins only).
 *
 * Summaries only — no individual records. Fetch those per student with
 * `getStudentAttendance` when a row is opened.
 *
 * Omit `week` for the whole program. Filtering by name is done client-side on
 * the returned roster, so `search` is here only for callers that want the
 * server to narrow it instead.
 */
export async function getAttendanceOverview(params?: {
  week?: number;
  search?: string;
  stack?: string;
}): Promise<AttendanceOverviewResponse> {
  const response = await axiosInstance.get(`/api/v1/attendanceOverview`, {
    params,
  });
  return response.data;
}

/**
 * One student's check-ins. Omit `week` for their whole history — which is what
 * every existing caller wants, and the endpoint's default.
 */
export async function getStudentAttendance(
  studentId: string,
  params?: { week?: number },
): Promise<StudentAttendanceResponse> {
  const response = await axiosInstance.get(
    `/api/v1/studentAttendance/${studentId}`,
    { params },
  );
  return response.data;
}

/**
 * A 0-20 punctuality score as a percentage string. Returns an em dash for null,
 * so a student with nothing scored reads as "no data" rather than "0%" — those
 * mean very different things to a tutor.
 */
export function punctualityPercent(
  score: number | null | undefined,
  maxScore = 20,
): string {
  if (score === null || score === undefined) return "—";
  return `${Math.round((score / maxScore) * 100)}%`;
}
