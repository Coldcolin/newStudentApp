"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type AttendanceRecord,
  punctualityPercent,
} from "@/lib/api/attendance";

/**
 * One attendance record: the check-in photo, when it happened, and what it
 * scored. Clicking opens the photo full size.
 *
 * An excused row is a different thing entirely — an approved absence, with no
 * check-in behind it — so it shows no time, no photo and no score. Its stored 0
 * is excluded from every average and must never be rendered as a result.
 */
export function StudentAttendanceCard({
  record,
}: {
  record: AttendanceRecord;
}) {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const isExcused = record.status === "excused";
  const hasImage = Boolean(record.image?.url);

  const formattedDate = new Date(record.date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Excused rows have no `time` at all, and "2000-01-01Tundefined" parses to an
  // Invalid Date that renders as the literal string "Invalid Date".
  const formattedTime = record.time
    ? new Date(`2000-01-01T${record.time}`).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsImageOpen(true);
    }
  };

  return (
    <>
      <Card
        className={`border border-border shadow-sm transition-shadow ${
          hasImage ? "cursor-pointer hover:shadow-md" : ""
        }`}
        onClick={hasImage ? () => setIsImageOpen(true) : undefined}
        onKeyDown={hasImage ? handleKeyDown : undefined}
        role={hasImage ? "button" : undefined}
        tabIndex={hasImage ? 0 : undefined}
      >
        <CardContent className="p-4 flex flex-col items-center text-center">
          {record.image?.url && (
            <div className="mb-3 w-full">
              <img
                src={record.image.url}
                alt="Check-in"
                className="w-full h-32 object-cover rounded-lg"
              />
            </div>
          )}
          <p className="text-sm text-muted-foreground">{formattedDate}</p>

          {isExcused ? (
            <span className="mt-2 rounded-full bg-[#219ebc]/10 px-3 py-1 text-xs font-medium text-[#219ebc]">
              Excused
            </span>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Check-in Time:{" "}
                <span className="font-medium text-foreground">
                  {formattedTime ?? "—"}
                </span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Score:{" "}
                <span className="font-medium text-foreground">
                  {punctualityPercent(record.punctualityScore)}
                </span>
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {hasImage && (
        <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
          <DialogContent className="sm:max-w-3xl p-4">
            <DialogTitle>Check-in Photo</DialogTitle>
            <DialogDescription>
              {formattedDate}
              {formattedTime ? ` · ${formattedTime}` : ""} · Score:{" "}
              {punctualityPercent(record.punctualityScore)}
            </DialogDescription>
            <img
              src={record.image!.url}
              alt="Check-in photo"
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
