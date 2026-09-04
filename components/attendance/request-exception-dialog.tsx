"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ExceptionAllowanceMeter } from "./exception-allowance-meter";
import type { ApiError } from "@/lib/api/axios";
import {
  createExceptionRequest,
  isExceptionDay,
  todayISO,
  EXCEPTION_DAY_HINT,
  EXCEPTION_REASON_CATEGORIES,
  type ExceptionAllowance,
  type ExceptionReasonCategory,
} from "@/lib/api/class-exceptions";

interface RequestExceptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allowance: ExceptionAllowance | null;
  /** Called after a request is submitted, so the list and counter can refresh. */
  onSubmitted: () => void;
}

const emptyForm = {
  date: "",
  reasonCategory: "" as ExceptionReasonCategory | "",
  reason: "",
  catchUpPlan: "",
  impactAcknowledged: false,
};

export function RequestExceptionDialog({
  open,
  onOpenChange,
  allowance,
  onSubmitted,
}: RequestExceptionDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const today = todayISO();

  // The allowance is spent, so anything filed now is an emergency.
  const isEmergency = allowance?.emergencyOnly === true;
  const dateInvalid = Boolean(form.date) && !isExceptionDay(form.date);

  const close = () => {
    onOpenChange(false);
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    if (!form.date) {
      toast.error("Please pick the day you'll be missing");
      return;
    }
    // Checked here as well as on the server so the correction is immediate
    // rather than a round trip away.
    if (!isExceptionDay(form.date)) {
      toast.error(EXCEPTION_DAY_HINT);
      return;
    }
    if (!form.reasonCategory) {
      toast.error("Please choose a reason");
      return;
    }
    if (!form.reason.trim()) {
      toast.error(
        isEmergency
          ? "Please tell your tutors what the emergency is"
          : "Please tell your tutors why you'll be missing class",
      );
      return;
    }
    if (!form.impactAcknowledged) {
      toast.error("Please confirm you'll catch up on what you miss");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createExceptionRequest({
        date: form.date,
        reasonCategory: form.reasonCategory,
        reason: form.reason.trim(),
        catchUpPlan: form.catchUpPlan.trim() || undefined,
        impactAcknowledged: form.impactAcknowledged,
        isEmergency,
      });

      if (isEmergency) {
        toast.success("Emergency request sent to your tutors");
      } else {
        const left = result.allowance?.remaining ?? 0;
        toast.success(
          `Request sent. You have ${left} exception day${left === 1 ? "" : "s"} left.`,
        );
      }

      close();
      onSubmitted();
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Failed to submit exception request:", error);
      // The server's refusals already say what to do next, so they go straight
      // through without rewriting.
      toast.error(
        apiError.message || "Couldn't submit your request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && isSubmitting) return;
        if (!next) close();
        else onOpenChange(true);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEmergency
              ? "Emergency exception request"
              : "Request a class exception"}
          </DialogTitle>
          <DialogDescription>
            {isEmergency
              ? "Your tutors will review this as an emergency."
              : "Let your tutors know ahead of time which day you'll be missing and why."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {isEmergency ? (
            <div className="flex gap-3 rounded-lg border border-[#ec1c24]/30 bg-[#ec1c24]/5 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#ec1c24]" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  You&apos;ve used all {allowance?.limit} of your exception days
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  You can still ask to be excused in a genuine emergency. Your
                  tutors will decide, and you can only have one emergency
                  request waiting at a time.
                </p>
              </div>
            </div>
          ) : (
            allowance && <ExceptionAllowanceMeter allowance={allowance} />
          )}

          {/* Day */}
          <div className="space-y-2">
            <Label htmlFor="exceptionDate" className="text-sm font-medium">
              Which day will you miss?
            </Label>
            <Input
              id="exceptionDate"
              type="date"
              min={today}
              value={form.date}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, date: e.target.value }))
              }
              className="h-12"
              aria-invalid={dateInvalid}
            />
            <p
              className={`text-xs ${dateInvalid ? "text-[#ec1c24]" : "text-muted-foreground"}`}
            >
              {EXCEPTION_DAY_HINT}
            </p>
          </div>

          {/* Reason category */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Reason</Label>
            <div className="flex flex-wrap gap-2">
              {EXCEPTION_REASON_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, reasonCategory: category }))
                  }
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                    form.reasonCategory === category
                      ? "border-[#ffb703] bg-[#ffb703] text-[#08022b]"
                      : "border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <Label htmlFor="exceptionReason" className="text-sm font-medium">
              {isEmergency
                ? "What's the emergency?"
                : "Tell your tutors more"}
            </Label>
            <Textarea
              id="exceptionReason"
              value={form.reason}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, reason: e.target.value }))
              }
              placeholder={
                isEmergency
                  ? "Explain what's happened — this is reviewed by a person"
                  : "A short explanation of why you'll be away"
              }
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {form.reason.length}/1000 characters
            </p>
          </div>

          {/* Catch-up plan */}
          <div className="space-y-2">
            <Label htmlFor="exceptionCatchUp" className="text-sm font-medium">
              How will you catch up?{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="exceptionCatchUp"
              value={form.catchUpPlan}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, catchUpPlan: e.target.value }))
              }
              placeholder="e.g. I'll go through the recording and submit the task on time"
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Acknowledgement */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5 pr-4">
              <Label
                htmlFor="exceptionAcknowledge"
                className="text-sm font-medium"
              >
                I&apos;ll catch up on what I miss
              </Label>
              <p className="text-xs text-muted-foreground">
                Being excused doesn&apos;t change your task deadlines
              </p>
            </div>
            <button
              id="exceptionAcknowledge"
              type="button"
              role="switch"
              aria-checked={form.impactAcknowledged}
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  impactAcknowledged: !prev.impactAcknowledged,
                }))
              }
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                form.impactAcknowledged ? "bg-[#ffb703]" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  form.impactAcknowledged ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={
              isEmergency
                ? "bg-[#ec1c24] text-white hover:bg-[#c81820]"
                : "bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : isEmergency ? (
              "Send emergency request"
            ) : (
              "Send request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
