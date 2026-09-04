"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ExceptionStatusBadge,
  EmergencyBadge,
} from "./exception-status-badge";
import type { ApiError } from "@/lib/api/axios";
import {
  getExceptionRequests,
  reviewExceptionRequest,
  formatExceptionDate,
  type ClassExceptionRequestForTutor,
  type ExceptionStatus,
} from "@/lib/api/class-exceptions";

const FILTERS: Array<{ label: string; value: ExceptionStatus | "All" }> = [
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  { label: "Declined", value: "Declined" },
  { label: "All", value: "All" },
];

/**
 * The tutor review queue for class-exception requests.
 *
 * Unlike the student side, this shows each student's position against their
 * allowance — tutors are meant to see it, students are not.
 */
export function ExceptionReviewPanel() {
  const [requests, setRequests] = useState<ClassExceptionRequestForTutor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ExceptionStatus | "All">("Pending");
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [declining, setDeclining] =
    useState<ClassExceptionRequestForTutor | null>(null);
  const [declineNote, setDeclineNote] = useState("");

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getExceptionRequests(
        filter === "All" ? undefined : { status: filter },
      );
      setRequests(data.requests ?? []);
    } catch (error) {
      console.error("Failed to load exception requests:", error);
      toast.error("Failed to load exception requests");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const review = async (
    request: ClassExceptionRequestForTutor,
    status: "Approved" | "Declined",
    reviewNote?: string,
  ) => {
    setPendingActionId(request._id);
    try {
      await reviewExceptionRequest(request._id, { status, reviewNote });
      toast.success(
        status === "Approved"
          ? `Approved — ${request.student?.name} has been excused`
          : `Declined ${request.student?.name}'s request`,
      );
      setDeclining(null);
      setDeclineNote("");
      await fetchRequests();
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Failed to review exception request:", error);
      toast.error(apiError.message || "Couldn't update the request");
    } finally {
      setPendingActionId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
              filter === value
                ? "border-[#ffb703] bg-[#ffb703] text-[#08022b]"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#ffb703]" />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-16 text-center">
          <CalendarOff className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {filter === "Pending"
              ? "No requests waiting for review."
              : `No ${filter.toLowerCase()} requests.`}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {requests.map((request) => {
            const isBusy = pendingActionId === request._id;

            return (
              <li
                key={request._id}
                className={`rounded-lg border bg-card p-4 ${
                  request.isEmergency && request.status === "Pending"
                    ? "border-[#ec1c24]/40 ring-1 ring-[#ec1c24]/20"
                    : "border-border"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.student?.image} />
                      <AvatarFallback className="bg-[#ffb703] text-[#08022b]">
                        {request.student?.name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {request.student?.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {request.student?.stack}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {/* "3/3 used" beside a fourth request reads like a bug,
                          so an emergency says what it actually is. */}
                      {request.isEmergency
                        ? "Allowance spent"
                        : `${request.quotaUsed}/${request.quotaLimit} used`}
                    </span>
                    {request.isEmergency && <EmergencyBadge />}
                    <ExceptionStatusBadge status={request.status} />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground">
                    {formatExceptionDate(request.date)}
                  </p>
                  <p className="text-xs font-medium text-[#219ebc]">
                    {request.reasonCategory}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {request.reason}
                  </p>
                  {request.catchUpPlan && (
                    <div className="rounded-md bg-muted/60 px-3 py-2">
                      <p className="text-xs font-medium text-foreground">
                        Catch-up plan
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {request.catchUpPlan}
                      </p>
                    </div>
                  )}
                  {request.reviewNote && (
                    <div className="rounded-md bg-muted/60 px-3 py-2">
                      <p className="text-xs font-medium text-foreground">
                        Review note
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {request.reviewNote}
                      </p>
                    </div>
                  )}
                </div>

                {request.status === "Pending" && (
                  <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                      variant="outline"
                      disabled={isBusy}
                      onClick={() => {
                        setDeclining(request);
                        setDeclineNote("");
                      }}
                      className="text-[#ec1c24] hover:text-[#ec1c24]"
                    >
                      Decline
                    </Button>
                    <Button
                      disabled={isBusy}
                      onClick={() => review(request, "Approved")}
                      className="bg-[#34a853] text-white hover:bg-[#2c8c46]"
                    >
                      {isBusy ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Approve"
                      )}
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={declining !== null}
        onOpenChange={(open) => {
          if (!open && !pendingActionId) setDeclining(null);
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Decline this request?</DialogTitle>
            <DialogDescription>
              {declining?.student?.name} will be told their request was
              declined. This does not use up any of their allowance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Textarea
              value={declineNote}
              onChange={(e) => setDeclineNote(e.target.value)}
              placeholder="Add a note explaining why (optional)"
              rows={3}
            />
          </div>

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDeclining(null)}
              disabled={Boolean(pendingActionId)}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                declining &&
                review(declining, "Declined", declineNote.trim() || undefined)
              }
              disabled={Boolean(pendingActionId)}
              className="bg-[#ec1c24] text-white hover:bg-[#c81820]"
            >
              {pendingActionId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Declining...
                </>
              ) : (
                "Decline request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
