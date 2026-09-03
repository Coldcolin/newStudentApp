"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
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
import type { ApiError } from "@/lib/api/axios";
import {
  createExceptionRequest,
  isClassDay,
  todayISO,
  CLASS_DAY_HINT,
  EXCEPTION_REASON_CATEGORIES,
  MAX_EXCEPTION_DATES,
  type ExceptionReasonCategory,
} from "@/lib/api/class-exceptions";

interface RequestExceptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a request is successfully submitted, so the list can refresh. */
  onSubmitted: () => void;
}

const emptyForm = {
  dates: [""] as string[],
  reasonCategory: "" as ExceptionReasonCategory | "",
  reason: "",
  catchUpPlan: "",
  impactAcknowledged: false,
};

export function RequestExceptionDialog({
  open,
  onOpenChange,
  onSubmitted,
}: RequestExceptionDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const today = todayISO();

  const setDate = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      dates: prev.dates.map((date, i) => (i === index ? value : date)),
    }));
  };

  const addDate = () => {
    setForm((prev) =>
      prev.dates.length >= MAX_EXCEPTION_DATES
        ? prev
        : { ...prev, dates: [...prev.dates, ""] },
    );
  };

  const removeDate = (index: number) => {
    setForm((prev) => ({
      ...prev,
      dates: prev.dates.filter((_, i) => i !== index),
    }));
  };

  const close = () => {
    onOpenChange(false);
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    const dates = form.dates.map((date) => date.trim()).filter(Boolean);

    if (dates.length === 0) {
      toast.error("Please select at least one class day");
      return;
    }
    if (new Set(dates).size !== dates.length) {
      toast.error("You've selected the same date more than once");
      return;
    }
    // Checked here as well as on the server so the correction is immediate
    // rather than a round trip away.
    if (dates.some((date) => !isClassDay(date))) {
      toast.error(CLASS_DAY_HINT);
      return;
    }
    if (!form.reasonCategory) {
      toast.error("Please choose a reason");
      return;
    }
    if (!form.reason.trim()) {
      toast.error("Please tell your tutors why you'll be missing class");
      return;
    }
    if (!form.impactAcknowledged) {
      toast.error("Please confirm you'll catch up on what you miss");
      return;
    }

    setIsSubmitting(true);
    try {
      await createExceptionRequest({
        dates,
        reasonCategory: form.reasonCategory,
        reason: form.reason.trim(),
        catchUpPlan: form.catchUpPlan.trim() || undefined,
        impactAcknowledged: form.impactAcknowledged,
      });

      toast.success("Request sent to your tutors");
      close();
      onSubmitted();
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Failed to submit exception request:", error);
      // Surfaced verbatim, with no branching on the text. The server sends a
      // deliberately generic message when a student has used their allowance,
      // and special-casing it here would give away the limit it hides.
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
          <DialogTitle className="text-xl">Request a class exception</DialogTitle>
          <DialogDescription>
            Let your tutors know ahead of time which class you&apos;ll be
            missing and why.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Class days */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Which class day(s) will you miss?
            </Label>
            <div className="space-y-3">
              {form.dates.map((date, index) => {
                const invalid = Boolean(date) && !isClassDay(date);

                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        min={today}
                        value={date}
                        onChange={(e) => setDate(index, e.target.value)}
                        className="h-12 flex-1"
                        aria-invalid={invalid}
                      />
                      {form.dates.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDate(index)}
                          aria-label="Remove this date"
                          className="h-12 w-12 shrink-0 text-muted-foreground hover:text-[#ec1c24]"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {invalid && (
                      <p className="text-xs text-[#ec1c24]">{CLASS_DAY_HINT}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {form.dates.length < MAX_EXCEPTION_DATES && (
              <button
                type="button"
                onClick={addDate}
                className="inline-flex items-center gap-1 text-sm font-medium text-[#219ebc] hover:underline"
              >
                <Plus className="h-4 w-4" />
                Add another date
              </button>
            )}

            <p className="text-xs text-muted-foreground">{CLASS_DAY_HINT}</p>
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
              Tell your tutors more
            </Label>
            <Textarea
              id="exceptionReason"
              value={form.reason}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, reason: e.target.value }))
              }
              placeholder="A short explanation of why you'll be away"
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
            className="bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
