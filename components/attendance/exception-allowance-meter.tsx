"use client";

import type { ExceptionAllowance } from "@/lib/api/class-exceptions";

/**
 * How many exception days a student has left, shown as a number they can't
 * miss.
 *
 * The pips make the count readable at a glance without reading the sentence;
 * they are decorative, so the sentence beside them carries the whole meaning
 * for screen readers.
 */
export function ExceptionAllowanceMeter({
  allowance,
}: {
  allowance: ExceptionAllowance;
}) {
  const { remaining, limit, emergencyOnly } = allowance;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 ${
        emergencyOnly
          ? "border-[#ec1c24]/30 bg-[#ec1c24]/5"
          : "border-border bg-card"
      }`}
    >
      <div className="flex shrink-0 gap-1.5" aria-hidden="true">
        {Array.from({ length: limit }, (_, index) => (
          <span
            key={index}
            className={`h-2.5 w-2.5 rounded-full ${
              index < remaining ? "bg-[#ffb703]" : "bg-muted-foreground/25"
            }`}
          />
        ))}
      </div>

      <p className="text-sm leading-tight">
        <span
          className={`text-lg font-bold ${
            emergencyOnly ? "text-[#ec1c24]" : "text-foreground"
          }`}
        >
          {remaining}
        </span>{" "}
        <span className="text-muted-foreground">
          of {limit} exception day{limit === 1 ? "" : "s"} left
        </span>
        {emergencyOnly && (
          <span className="block text-xs font-medium text-[#ec1c24]">
            Emergency requests only
          </span>
        )}
      </p>
    </div>
  );
}
