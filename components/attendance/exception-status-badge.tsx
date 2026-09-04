"use client";

import type { ExceptionStatus } from "@/lib/api/class-exceptions";

// The same status pill styling the assessments board uses for Graded/Pending,
// so a status reads the same wherever it appears.
const STATUS_STYLES: Record<ExceptionStatus, string> = {
  Pending: "bg-[#ffb703]/15 text-[#b07a00] dark:text-[#ffb703]",
  Approved: "bg-[#34a853]/15 text-[#34a853]",
  Declined: "bg-[#ec1c24]/15 text-[#ec1c24]",
};

export function ExceptionStatusBadge({ status }: { status: ExceptionStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

/**
 * Marks a request filed after the student's allowance ran out.
 *
 * Kept separate from the status pill rather than added to `ExceptionStatus`:
 * emergency is orthogonal to Pending/Approved/Declined, and the backend has no
 * such status.
 */
export function EmergencyBadge() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-[#ec1c24]/15 px-2.5 py-1 text-xs font-semibold text-[#ec1c24]">
      Emergency
    </span>
  );
}
