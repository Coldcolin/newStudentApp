"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestExceptionDialog } from "./request-exception-dialog";
import { ExceptionStatusBadge } from "./exception-status-badge";
import {
  getMyExceptionRequests,
  formatExceptionDate,
  type ClassExceptionRequest,
} from "@/lib/api/class-exceptions";

/**
 * A student's own class-exception requests, with the entry point to make a new
 * one.
 *
 * Nothing here shows how many requests are left, and nothing should: the cap is
 * enforced server-side and deliberately hidden. The button stays visible even
 * once a student is out of tries — a disappearing button is conspicuous, and
 * comparing notes with a classmate would give the limit away.
 */
export function MyExceptionRequests() {
  const [requests, setRequests] = useState<ClassExceptionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await getMyExceptionRequests();
      setRequests(data.requests ?? []);
    } catch (error) {
      console.error("Failed to load exception requests:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Class exceptions
          </h2>
          <p className="text-sm text-muted-foreground">
            Let your tutors know in advance when you can&apos;t make a class
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
        >
          <CalendarOff className="mr-2 h-4 w-4" />
          Request exception
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-[#ffb703]" />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
          <CalendarOff className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            You haven&apos;t requested any class exceptions yet.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {requests.map((request) => (
            <li
              key={request._id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {request.dates.map(formatExceptionDate).join(" · ")}
                  </p>
                  <p className="text-xs font-medium text-[#219ebc]">
                    {request.reasonCategory}
                  </p>
                </div>
                <ExceptionStatusBadge status={request.status} />
              </div>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {request.reason}
              </p>

              {request.reviewNote && (
                <div className="mt-3 rounded-md bg-muted/60 px-3 py-2">
                  <p className="text-xs font-medium text-foreground">
                    Note from your tutor
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {request.reviewNote}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <RequestExceptionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmitted={fetchRequests}
      />
    </div>
  );
}
