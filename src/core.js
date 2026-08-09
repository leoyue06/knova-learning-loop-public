import { createEmptyCard, fsrs, generatorParameters, Rating } from "ts-fsrs";

const scheduler = fsrs(generatorParameters({ enable_short_term: false, enable_fuzz: false }));

export const STORAGE_KEY = "knova-learning-loop:v1";

export function normalizeText(value) {
  return String(value ?? "")
    .toLocaleLowerCase("en-US")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function includesPhrase(answer, phrase) {
  const normalizedAnswer = ` ${normalizeText(answer)} `;
  const normalizedPhrase = normalizeText(phrase);
  return normalizedPhrase.length > 0 && normalizedAnswer.includes(` ${normalizedPhrase} `);
}

export function gradeAnswer(answer, criteria) {
  if (!normalizeText(answer)) throw new Error("Write or speak an answer before checking it.");
  if (!Array.isArray(criteria) || criteria.length === 0) throw new Error("This question has no rubric.");

  const results = criteria.map((criterion) => ({
    id: criterion.id,
    label: criterion.label,
    matched: criterion.keywords.some((keyword) => includesPhrase(answer, keyword)),
  }));
  const matched = results.filter((criterion) => criterion.matched);

  return {
    score: Number(((matched.length / results.length) * 10).toFixed(1)),
    matched,
    missing: results.filter((criterion) => !criterion.matched),
  };
}

export function scoreToRating(score) {
  if (!Number.isFinite(score) || score < 0 || score > 10) throw new RangeError("Score must be between 0 and 10.");
  if (score < 4) return Rating.Again;
  if (score < 6.5) return Rating.Hard;
  if (score <= 8.5) return Rating.Good;
  return Rating.Easy;
}

export function ratingLabel(rating) {
  return ({
    [Rating.Again]: "Again",
    [Rating.Hard]: "Hard",
    [Rating.Good]: "Good",
    [Rating.Easy]: "Easy",
  })[rating] ?? "Good";
}

function storedCardIsValid(value) {
  const numericFields = ["stability", "difficulty", "elapsed_days", "scheduled_days", "reps", "lapses", "learning_steps", "state"];
  return Boolean(
    value
      && typeof value === "object"
      && typeof value.due === "string"
      && Number.isFinite(Date.parse(value.due))
      && numericFields.every((field) => Number.isFinite(value[field]))
      && (value.last_review == null || (typeof value.last_review === "string" && Number.isFinite(Date.parse(value.last_review))))
  );
}

export function scheduleReview(storedCard, score, now = new Date()) {
  const card = storedCardIsValid(storedCard) ? storedCard : createEmptyCard(now);
  const rating = scoreToRating(score);
  const { card: nextCard } = scheduler.next(card, now, rating);
  const serializedCard = JSON.parse(JSON.stringify(nextCard));
  return { card: serializedCard, due: new Date(serializedCard.due), rating };
}

export function isDue(nextReviewAt, now = new Date()) {
  return !nextReviewAt || new Date(nextReviewAt).getTime() <= now.getTime();
}

export function pickNextNote(notes, progress, now = new Date(), afterId = null) {
  const start = Math.max(0, notes.findIndex((note) => note.id === afterId) + 1);
  const ordered = [...notes.slice(start), ...notes.slice(0, start)];
  return ordered.find((note) => isDue(progress[note.id]?.nextReviewAt, now)) ?? null;
}

export function validateWorkspace(workspace) {
  if (!workspace || !Array.isArray(workspace.notes) || workspace.notes.length === 0) {
    throw new Error("The sample workspace needs at least one note.");
  }
  const ids = [];
  for (const note of workspace.notes) {
    ids.push(note.id);
    if (!note.id || !note.title || !note.source || !Array.isArray(note.questions) || note.questions.length === 0) {
      throw new Error("Every sample note needs an id, title, source, and question.");
    }
    for (const question of note.questions) {
      ids.push(`${note.id}:${question.id}`);
      if (!question.id || !question.prompt || !question.referenceAnswer || !Array.isArray(question.criteria) || question.criteria.length === 0) {
        throw new Error("Every sample question needs a prompt, reference answer, and rubric.");
      }
    }
  }
  if (new Set(ids).size !== ids.length) throw new Error("Sample ids must be unique.");
  return true;
}
