"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestExceptionDialog } from "./request-exception-dialog";
import { ExceptionAllowanceMeter } from "./exception-allowance-meter";
import {
  ExceptionStatusBadge,
  EmergencyBadge,
} from "./exception-status-badge";
import {
  getMyExceptionRequests,
  formatExceptionDate,
  type ClassExceptionRequest,
  type ExceptionAllowance,
} from "@/lib/api/class-exceptions";

/**
 * A student's own class-exception requests, the days they have left, and the
 * entry point to make a new one.
 *
 * The button stays visible once the allowance is spent — at that point it opens
 * in emergency mode rather than disappearing, since an emergency is exactly
 * when someone needs it most.
 */
export function MyExceptionRequests() {
  const [requests, setRequests] = useState<ClassExceptionRequest[]>([]);
  const [allowance, setAllowance] = useState<ExceptionAllowance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await getMyExceptionRequests();
      setRequests(data.requests ?? []);
      setAllowance(data.allowance ?? null);
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Class exceptions
          </h2>
          <p className="text-sm text-muted-foreground">
            Let your tutors know in advance when you can&apos;t make a class
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {allowance && <ExceptionAllowanceMeter allowance={allowance} />}
          <Button
            onClick={() => setIsDialogOpen(true)}
            disabled={isLoading}
            className={
              allowance?.emergencyOnly
                ? "bg-[#ec1c24] text-white hover:bg-[#c81820]"
                : "bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
            }
          >
            <CalendarOff className="mr-2 h-4 w-4" />
            {allowance?.emergencyOnly
              ? "Emergency request"
              : "Request exception"}
          </Button>
        </div>
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
                    {formatExceptionDate(request.date)}
                  </p>
                  <p className="text-xs font-medium text-[#219ebc]">
                    {request.reasonCategory}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  {request.isEmergency && <EmergencyBadge />}
                  <ExceptionStatusBadge status={request.status} />
                </div>
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
        allowance={allowance}
        onSubmitted={fetchRequests}
      />
    </div>
  );
}
