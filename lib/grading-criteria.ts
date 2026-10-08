export interface GradingCriterion {
  _id: string;
  label: string;
  maxPoints: number;
}

export interface CriterionScore {
  _id?: string;
  criterion: string;
  score: number;
}

export interface CriterionDraft {
  label: string;
  maxPoints: string;
}

export interface CriterionPayload {
  label: string;
  maxPoints: number;
}

const LABEL_REQUIRED = "Each criterion needs a label";
const MAX_POINTS_RANGE =
  "Each criterion's maxPoints must be greater than 0 and at most 20";
const SUM_REQUIRED = "Criterion maxima must add up to 20";
const AT_LEAST_ONE =
  "Add at least one grading criterion, or omit criteria to grade with a single score";
const EVERY_CRITERION = "criterionScores must list a score for every criterion";
const GRADE_RANGE = "Grade must be between 0 and 20";

export function roundTo2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Up to two decimal places, without a trailing zero. */
export function formatPoints(value: number): string {
  const rounded = roundTo2(value);
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/0$/, "");
}

export function criteriaMaxTotal(maxPoints: number[]): number {
  return roundTo2(maxPoints.reduce((sum, value) => sum + roundTo2(value), 0));
}

function parsedMax(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return roundTo2(parsed);
}

/** A blank row means the tutor started a rubric but has not filled it in. */
function isBlankDraft(draft: CriterionDraft): boolean {
  return draft.label.trim() === "" && draft.maxPoints.trim() === "";
}

/**
 * null when the draft is a single score (no rows) or a rubric whose maxima
 * sum to 20. Otherwise the server message the form should show.
 */
export function criteriaDraftError(drafts: CriterionDraft[]): string | null {
  if (drafts.length === 0) return null;
  if (drafts.every(isBlankDraft)) return AT_LEAST_ONE;

  const rounded: number[] = [];
  for (const draft of drafts) {
    if (draft.label.trim() === "") return LABEL_REQUIRED;
    const maxPoints = parsedMax(draft.maxPoints);
    if (maxPoints === null || maxPoints <= 0 || maxPoints > 20) {
      return MAX_POINTS_RANGE;
    }
    rounded.push(maxPoints);
  }

  if (criteriaMaxTotal(rounded) !== 20) return SUM_REQUIRED;
  return null;
}

function toPayload(drafts: CriterionDraft[]): CriterionPayload[] {
  return drafts.map((draft) => ({
    label: draft.label.trim(),
    maxPoints: parsedMax(draft.maxPoints) ?? 0,
  }));
}

/** Omit the field when there is no rubric. Call only after criteriaDraftError is null. */
export function criteriaCreatePayload(
  drafts: CriterionDraft[],
): CriterionPayload[] | undefined {
  if (drafts.length === 0) return undefined;
  return toPayload(drafts);
}

function sameRubric(
  drafts: CriterionDraft[],
  existing: GradingCriterion[],
): boolean {
  if (drafts.length !== existing.length) return false;
  return drafts.every((draft, index) => {
    const current = existing[index];
    return (
      draft.label.trim() === current.label &&
      parsedMax(draft.maxPoints) === roundTo2(current.maxPoints)
    );
  });
}

/**
 * undefined leaves the stored rubric alone. [] clears it. A list replaces it.
 * Call only after criteriaDraftError is null.
 */
export function criteriaUpdatePayload(
  drafts: CriterionDraft[],
  existing: GradingCriterion[],
): CriterionPayload[] | undefined {
  if (sameRubric(drafts, existing)) return undefined;
  if (drafts.length === 0) return [];
  return toPayload(drafts);
}

export function scoreByCriterionId(
  scores: CriterionScore[] | undefined,
  criterionId: string,
): number | undefined {
  const match = scores?.find((score) => score.criterion === criterionId);
  return match ? match.score : undefined;
}

/** Sum of the numbers the tutor has typed. Empty inputs are skipped. */
export function runningTotal(scores: string[]): number {
  const entered = scores
    .map((score) => score.trim())
    .filter((score) => score !== "")
    .map((score) => Number(score))
    .filter((score) => Number.isFinite(score));
  return roundTo2(entered.reduce((sum, score) => sum + score, 0));
}

function formatMax(maxPoints: number): string {
  const rounded = roundTo2(maxPoints);
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export type GradeBody =
  | { grade: number; feedback?: string }
  | {
      criterionScores: { criterion: string; score: number }[];
      feedback?: string;
    };

export type GradeRequest = GradeBody | { error: string };

export function gradeRequest(input: {
  criteria: GradingCriterion[];
  grade: string;
  criterionInputs: Record<string, string>;
  feedback: string;
  initialFeedback: string;
}): GradeRequest {
  const feedback =
    input.feedback === input.initialFeedback
      ? {}
      : { feedback: input.feedback };

  if (input.criteria.length === 0) {
    const grade = Number(input.grade);
    if (!Number.isFinite(grade) || grade < 0 || grade > 20) {
      return { error: GRADE_RANGE };
    }
    return { grade, ...feedback };
  }

  const criterionScores: { criterion: string; score: number }[] = [];
  for (const criterion of input.criteria) {
    const raw = input.criterionInputs[criterion._id]?.trim() ?? "";
    if (raw === "") return { error: EVERY_CRITERION };
    const score = Number(raw);
    const maxPoints = roundTo2(criterion.maxPoints);
    if (!Number.isFinite(score) || score < 0 || score > maxPoints) {
      return {
        error: `"${criterion.label}" must be scored between 0 and ${formatMax(criterion.maxPoints)}`,
      };
    }
    criterionScores.push({ criterion: criterion._id, score });
  }

  return { criterionScores, ...feedback };
}
