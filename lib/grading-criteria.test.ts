import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  criteriaCreatePayload,
  criteriaDraftError,
  criteriaMaxTotal,
  criteriaUpdatePayload,
  gradeRequest,
  runningTotal,
  scoreByCriterionId,
} from "./grading-criteria.ts";

const api = { _id: "a", label: "API correctness", maxPoints: 8 };
const structure = { _id: "b", label: "Code structure", maxPoints: 6 };
const readme = { _id: "c", label: "README", maxPoints: 6 };

describe("criteria drafts", () => {
  it("omits criteria when the tutor leaves the rubric empty", () => {
    assert.equal(criteriaDraftError([]), null);
    assert.equal(criteriaCreatePayload([]), undefined);
  });

  it("accepts maxima that sum to 20 after each value is rounded to 2 decimals", () => {
    const drafts = [
      { label: "API correctness", maxPoints: "6.67" },
      { label: "Code structure", maxPoints: "6.67" },
      { label: "README", maxPoints: "6.66" },
    ];
    assert.equal(criteriaDraftError(drafts), null);
    assert.equal(criteriaMaxTotal([6.666, 6.666, 6.668]), 20.01);
    assert.deepEqual(criteriaCreatePayload(drafts), [
      { label: "API correctness", maxPoints: 6.67 },
      { label: "Code structure", maxPoints: 6.67 },
      { label: "README", maxPoints: 6.66 },
    ]);
  });

  it("rejects a rubric whose maxima do not add up to 20", () => {
    assert.equal(
      criteriaDraftError([
        { label: "API correctness", maxPoints: "10" },
        { label: "README", maxPoints: "9" },
      ]),
      "Criterion maxima must add up to 20",
    );
  });

  it("requires a label and a maxPoints from 0 exclusive through 20", () => {
    assert.equal(
      criteriaDraftError([{ label: "   ", maxPoints: "8" }]),
      "Each criterion needs a label",
    );
    assert.equal(
      criteriaDraftError([{ label: "API correctness", maxPoints: "0" }]),
      "Each criterion's maxPoints must be greater than 0 and at most 20",
    );
    assert.equal(
      criteriaDraftError([{ label: "API correctness", maxPoints: "21" }]),
      "Each criterion's maxPoints must be greater than 0 and at most 20",
    );
  });

  it("asks for a criterion when every added row is blank", () => {
    assert.equal(
      criteriaDraftError([{ label: "", maxPoints: "" }]),
      "Add at least one grading criterion, or omit criteria to grade with a single score",
    );
  });

  it("omits an unchanged rubric and sends an empty list to clear one", () => {
    const same = [
      { label: "API correctness", maxPoints: "8" },
      { label: "Code structure", maxPoints: "6" },
      { label: "README", maxPoints: "6" },
    ];
    assert.equal(criteriaUpdatePayload(same, [api, structure, readme]), undefined);
    assert.deepEqual(criteriaUpdatePayload([], [api]), []);
    assert.equal(criteriaUpdatePayload([], []), undefined);
  });
});

describe("grading", () => {
  it("keeps a single score and sends a remark only when it changed", () => {
    assert.deepEqual(
      gradeRequest({
        criteria: [],
        grade: "16",
        criterionInputs: {},
        feedback: "Submitted on time.",
        initialFeedback: "",
      }),
      { grade: 16, feedback: "Submitted on time." },
    );
    assert.deepEqual(
      gradeRequest({
        criteria: [],
        grade: "16",
        criterionInputs: {},
        feedback: "Submitted on time.",
        initialFeedback: "Submitted on time.",
      }),
      { grade: 16 },
    );
    assert.deepEqual(
      gradeRequest({
        criteria: [],
        grade: "0",
        criterionInputs: {},
        feedback: "",
        initialFeedback: "Submitted on time.",
      }),
      { grade: 0, feedback: "" },
    );
  });

  it("rejects a single score outside 0 to 20", () => {
    assert.deepEqual(
      gradeRequest({
        criteria: [],
        grade: "21",
        criterionInputs: {},
        feedback: "",
        initialFeedback: "",
      }),
      { error: "Grade must be between 0 and 20" },
    );
  });

  it("scores every criterion once and does not send grade", () => {
    const result = gradeRequest({
      criteria: [api, structure, readme],
      grade: "20",
      criterionInputs: { a: "6", b: "5", c: "4" },
      feedback: "Solid API. The README is missing setup steps.",
      initialFeedback: "",
    });
    assert.deepEqual(result, {
      criterionScores: [
        { criterion: "a", score: 6 },
        { criterion: "b", score: 5 },
        { criterion: "c", score: 4 },
      ],
      feedback: "Solid API. The README is missing setup steps.",
    });
  });

  it("requires a score for every criterion, inside that criterion's max", () => {
    assert.deepEqual(
      gradeRequest({
        criteria: [api, structure],
        grade: "",
        criterionInputs: { a: "6", b: "" },
        feedback: "",
        initialFeedback: "",
      }),
      { error: "criterionScores must list a score for every criterion" },
    );
    assert.deepEqual(
      gradeRequest({
        criteria: [api],
        grade: "",
        criterionInputs: { a: "9" },
        feedback: "",
        initialFeedback: "",
      }),
      { error: '"API correctness" must be scored between 0 and 8' },
    );
    assert.deepEqual(
      gradeRequest({
        criteria: [api],
        grade: "",
        criterionInputs: { a: "0" },
        feedback: "",
        initialFeedback: "",
      }),
      { criterionScores: [{ criterion: "a", score: 0 }] },
    );
  });

  it("matches a mark to its criterion by id and ignores the score row id", () => {
    assert.equal(
      scoreByCriterionId(
        [{ _id: "row", criterion: "a", score: 0 }],
        "a",
      ),
      0,
    );
    assert.equal(scoreByCriterionId([], "a"), undefined);
  });

  it("sums entered criterion scores for the running total", () => {
    assert.equal(runningTotal(["6", "5", ""]), 11);
    assert.equal(runningTotal(["6.67", "6.66"]), 13.33);
  });
});
