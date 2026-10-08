"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  criteriaDraftError,
  criteriaMaxTotal,
  formatPoints,
  scoreByCriterionId,
  type CriterionDraft,
  type CriterionScore,
  type GradingCriterion,
} from "@/lib/grading-criteria";

export interface CriterionFormRow extends CriterionDraft {
  key: string;
}

export function emptyCriterionRow(): CriterionFormRow {
  return {
    key: crypto.randomUUID(),
    label: "",
    maxPoints: "",
  };
}

export function CriterionBreakdown({
  criteria,
  scores,
}: {
  criteria?: GradingCriterion[];
  scores?: CriterionScore[];
}) {
  if (!criteria?.length) return null;

  return (
    <ul className="mt-2 space-y-1">
      {criteria.map((criterion) => {
        const score = scoreByCriterionId(scores, criterion._id);
        const max = formatPoints(criterion.maxPoints);
        return (
          <li
            key={criterion._id}
            className="flex items-baseline justify-between gap-3 text-xs text-muted-foreground"
          >
            <span className="min-w-0 break-words">{criterion.label}</span>
            <span className="shrink-0 tabular-nums">
              {score === undefined ? max : `${formatPoints(score)} / ${max}`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function parsedMaxima(rows: CriterionFormRow[]): number[] {
  return rows.flatMap((row) => {
    const trimmed = row.maxPoints.trim();
    if (!trimmed) return [];
    const value = Number(trimmed);
    return Number.isFinite(value) ? [value] : [];
  });
}

export function CriteriaEditor({
  idPrefix,
  rows,
  locked,
  onChange,
}: {
  idPrefix: string;
  rows: CriterionFormRow[];
  locked: boolean;
  onChange: (rows: CriterionFormRow[]) => void;
}) {
  if (locked && rows.length === 0) return null;

  const total = criteriaMaxTotal(parsedMaxima(rows));
  const error = locked ? null : criteriaDraftError(rows);
  const totalReady = rows.length > 0 && error === null;

  if (locked) {
    return (
      <div className="space-y-2 rounded-lg border border-border p-4">
        <Label className="text-sm font-medium">Grading criteria</Label>
        <ul className="space-y-1">
          {rows.map((row) => (
            <li
              key={row.key}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="min-w-0 break-words">{row.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {row.maxPoints}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Criteria cannot be changed after a submission has been graded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-medium">Grading criteria</Label>
        {rows.length > 0 && (
          <span
            className={`text-sm font-medium tabular-nums ${
              totalReady ? "text-[#34a853]" : "text-[#ec1c24]"
            }`}
          >
            {formatPoints(total)} / 20
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Leave this empty to grade the task with one score out of 20. With
        criteria, the maxima must add up to 20.
      </p>

      {rows.map((row, index) => (
        <div key={row.key} className="flex items-center gap-2">
          <Input
            id={`${idPrefix}CriterionLabel${index}`}
            aria-label={`Criterion ${index + 1} label`}
            placeholder="Criterion"
            value={row.label}
            onChange={(event) =>
              onChange(
                rows.map((item) =>
                  item.key === row.key
                    ? { ...item, label: event.target.value }
                    : item,
                ),
              )
            }
            className="h-12 flex-1"
          />
          <Input
            id={`${idPrefix}CriterionMax${index}`}
            aria-label={`Criterion ${index + 1} max points`}
            type="number"
            min="0"
            max="20"
            step="0.01"
            placeholder="Max"
            value={row.maxPoints}
            onChange={(event) =>
              onChange(
                rows.map((item) =>
                  item.key === row.key
                    ? { ...item, maxPoints: event.target.value }
                    : item,
                ),
              )
            }
            className="h-12 w-24"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove criterion ${index + 1}`}
            className="h-12 w-12 shrink-0 text-[#ec1c24] hover:bg-[#ec1c24]/10 hover:text-[#ec1c24]"
            onClick={() => onChange(rows.filter((item) => item.key !== row.key))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...rows, emptyCriterionRow()])}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add criterion
      </Button>

      {error && <p className="text-xs text-[#ec1c24]">{error}</p>}
    </div>
  );
}
