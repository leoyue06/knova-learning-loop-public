import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Rating } from "ts-fsrs";
import {
  gradeAnswer,
  isDue,
  normalizeText,
  pickNextNote,
  ratingLabel,
  scheduleReview,
  scoreToRating,
  validateWorkspace,
} from "../src/core.js";

const rubric = [
  { id: "result", label: "Observable result", keywords: ["test passed", "evidence"] },
  { id: "risk", label: "Remaining risk", keywords: ["remaining risk", "edge case"] },
  { id: "next", label: "Next check", keywords: ["retest", "verify next"] },
];

test("empty answers are rejected", () => {
  assert.throws(() => gradeAnswer("  !!!  ", rubric), /answer before checking/i);
});

test("normalization ignores punctuation, accents, and case", () => {
  assert.equal(normalizeText("  ÉVIDENCE—First!  "), "evidence first");
  const result = gradeAnswer("The TEST passed; an EDGE-CASE remains, so we will RETEST.", rubric);
  assert.equal(result.score, 10);
});

test("rubric reports partial and full matches", () => {
  const partial = gradeAnswer("The test passed, but there is a remaining risk.", rubric);
  assert.equal(partial.score, 6.7);
  assert.deepEqual(partial.missing.map(({ id }) => id), ["next"]);
  const full = gradeAnswer("The test passed. One edge case remains. We will retest.", rubric);
  assert.equal(full.score, 10);
});

test("score boundaries map to the expected FSRS ratings", () => {
  const cases = [
    [3.9, Rating.Again], [4, Rating.Hard], [6.4, Rating.Hard],
    [6.5, Rating.Good], [8.5, Rating.Good], [8.6, Rating.Easy],
  ];
  for (const [score, rating] of cases) {
    assert.equal(scoreToRating(score), rating);
    assert.ok(ratingLabel(rating));
  }
  assert.throws(() => scoreToRating(10.1), RangeError);
});

test("an injected clock produces a stable first review date", () => {
  const now = new Date("2026-08-08T12:00:00.000Z");
  const result = scheduleReview(null, 7.5, now);
  assert.equal(result.rating, Rating.Good);
  assert.equal(result.due.toISOString(), "2026-08-11T12:00:00.000Z");
  assert.equal(result.card.due, result.due.toISOString());
});

test("malformed browser progress falls back to a new FSRS card", () => {
  const now = new Date("2026-08-08T12:00:00.000Z");
  const malformed = { due: "2026-08-09T12:00:00.000Z", stability: 1 };
  const result = scheduleReview(malformed, 7.5, now);
  assert.equal(result.due.toISOString(), "2026-08-11T12:00:00.000Z");
});

test("due-note selection skips cards scheduled in the future", () => {
  const notes = [{ id: "first" }, { id: "second" }];
  const now = new Date("2026-08-08T12:00:00.000Z");
  const progress = { first: { nextReviewAt: "2026-08-09T12:00:00.000Z" } };
  assert.equal(isDue(progress.first.nextReviewAt, now), false);
  assert.equal(pickNextNote(notes, progress, now).id, "second");
});

test("the checked-in sample workspace is valid and contains unique ids", async () => {
  const url = new URL("../public/data/sample-workspace.json", import.meta.url);
  const workspace = JSON.parse(await readFile(url, "utf8"));
  assert.equal(validateWorkspace(workspace), true);
  assert.equal(workspace.notes.length, 3);
});
