import {
  STORAGE_KEY,
  gradeAnswer,
  pickNextNote,
  ratingLabel,
  scheduleReview,
  validateWorkspace,
} from "./core.js";
import "./styles.css";

const elements = Object.fromEntries(
  [
    "note-topic", "note-title", "note-position", "read-time", "note-body", "source-panel",
    "practice-panel", "feedback-panel", "complete-panel", "start-recall", "speak-note",
    "answer-form", "question-position", "question-prompt", "coach-hint", "answer", "voice-answer",
    "feedback-score", "feedback-label", "feedback-heading", "matched-list", "missing-list",
    "reference-answer", "continue-button", "final-score", "final-rating", "final-due", "next-note",
    "reset-progress", "footer-reset", "status-message",
  ].map((id) => [id, document.getElementById(id)])
);

const state = {
  workspace: null,
  note: null,
  questionIndex: 0,
  results: [],
  feedbackShown: false,
  completed: false,
  progress: loadProgress(),
  recognition: null,
};

function loadProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
    return true;
  } catch {
    return false;
  }
}

function announce(message) {
  elements["status-message"].textContent = message;
}

function setStep(step) {
  document.querySelectorAll(".stepper li").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.step === step);
    item.classList.toggle("is-complete", ["read", "recall", "reflect", "review"].indexOf(item.dataset.step) < ["read", "recall", "reflect", "review"].indexOf(step));
  });
}

function showOnly(panel) {
  ["source-panel", "practice-panel", "feedback-panel", "complete-panel"].forEach((id) => {
    elements[id].hidden = id !== panel;
  });
}

function renderNote(note) {
  state.note = note;
  state.questionIndex = 0;
  state.results = [];
  state.feedbackShown = false;
  state.completed = false;
  const noteIndex = state.workspace.notes.findIndex((item) => item.id === note.id);
  elements["note-topic"].textContent = note.topic;
  elements["note-title"].textContent = note.title;
  elements["note-position"].textContent = `Note ${noteIndex + 1} of ${state.workspace.notes.length}`;
  elements["read-time"].textContent = note.readTime;
  elements["note-body"].replaceChildren(...note.source.map((paragraph) => {
    const node = document.createElement("p");
    node.textContent = paragraph;
    return node;
  }));
  showOnly("source-panel");
  setStep("read");
}

function renderQuestion() {
  const question = state.note.questions[state.questionIndex];
  elements["question-position"].textContent = `Question ${state.questionIndex + 1} of ${state.note.questions.length}`;
  elements["question-prompt"].textContent = question.prompt;
  elements["coach-hint"].textContent = question.coachHint;
  elements.answer.value = "";
  state.feedbackShown = false;
  elements["continue-button"].disabled = false;
  showOnly("practice-panel");
  setStep("recall");
  elements.answer.focus();
}

function renderList(element, items, emptyLabel) {
  element.replaceChildren();
  const labels = items.length ? items.map((item) => item.label) : [emptyLabel];
  for (const label of labels) {
    const item = document.createElement("li");
    item.textContent = label;
    element.append(item);
  }
}

function renderFeedback(result) {
  const question = state.note.questions[state.questionIndex];
  elements["feedback-score"].textContent = result.score.toFixed(1);
  elements["feedback-label"].textContent = result.score >= 6.5 ? "Strong recall" : "Useful gap found";
  elements["feedback-heading"].textContent = result.score >= 6.5 ? "Your explanation carried the core idea." : "One more pass will make this easier to retrieve.";
  renderList(elements["matched-list"], result.matched, "No rubric point yet—use the model answer to retry later.");
  renderList(elements["missing-list"], result.missing, "Nothing missing from this rubric.");
  elements["reference-answer"].textContent = question.referenceAnswer;
  elements["continue-button"].textContent = state.questionIndex === state.note.questions.length - 1 ? "Finish & schedule review" : "Next question";
  showOnly("feedback-panel");
  setStep("reflect");
  elements["feedback-panel"].focus();
}

function finishLoop() {
  if (state.completed) return;
  state.completed = true;
  const average = Number((state.results.reduce((sum, result) => sum + result.score, 0) / state.results.length).toFixed(1));
  const previous = state.progress[state.note.id];
  const scheduled = scheduleReview(previous?.card ?? null, average, new Date());
  state.progress[state.note.id] = {
    card: scheduled.card,
    nextReviewAt: scheduled.due.toISOString(),
    lastScore: average,
    lastRating: ratingLabel(scheduled.rating),
    completedAt: new Date().toISOString(),
  };
  const persisted = saveProgress();

  elements["final-score"].textContent = `${average.toFixed(1)} / 10`;
  elements["final-rating"].textContent = ratingLabel(scheduled.rating);
  elements["final-due"].textContent = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(scheduled.due);
  const next = pickNextNote(state.workspace.notes, state.progress, new Date(), state.note.id);
  elements["next-note"].textContent = next ? "Practice another note" : "All samples scheduled";
  elements["next-note"].disabled = !next;
  showOnly("complete-panel");
  setStep("review");
  elements["complete-panel"].focus();
  announce(`Review scheduled for ${elements["final-due"].textContent}.${persisted ? "" : " Browser storage is unavailable, so this result will not survive a refresh."}`);
}

function speak(text) {
  if (!("speechSynthesis" in window)) {
    announce("Speech playback is unavailable in this browser.");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

function startVoiceAnswer() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    announce("Speech recognition is unavailable. You can keep typing.");
    elements.answer.focus();
    return;
  }
  state.recognition?.abort();
  const recognition = new Recognition();
  state.recognition = recognition;
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  elements["voice-answer"].textContent = "Listening…";
  recognition.onresult = (event) => {
    elements.answer.value = event.results[0][0].transcript;
    announce("Voice answer captured. Review it, then check your explanation.");
    elements.answer.focus();
  };
  recognition.onerror = () => announce("Voice capture did not finish. You can keep typing.");
  recognition.onend = () => {
    elements["voice-answer"].textContent = "Use microphone";
    state.recognition = null;
  };
  recognition.start();
}

function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // The in-memory sample can still reset when browser storage is unavailable.
  }
  state.progress = {};
  renderNote(state.workspace.notes[0]);
  announce("Local sample progress cleared.");
}

elements["start-recall"].addEventListener("click", renderQuestion);
elements["speak-note"].addEventListener("click", () => speak(state.note.source.join(" ")));
elements["voice-answer"].addEventListener("click", startVoiceAnswer);
elements["answer-form"].addEventListener("submit", (event) => {
  event.preventDefault();
  if (state.feedbackShown) return;
  try {
    const result = gradeAnswer(elements.answer.value, state.note.questions[state.questionIndex].criteria);
    state.feedbackShown = true;
    state.results.push(result);
    renderFeedback(result);
  } catch (error) {
    elements.answer.setCustomValidity(error.message);
    elements.answer.reportValidity();
    elements.answer.setCustomValidity("");
  }
});
elements["continue-button"].addEventListener("click", () => {
  elements["continue-button"].disabled = true;
  if (state.questionIndex < state.note.questions.length - 1) {
    state.questionIndex += 1;
    renderQuestion();
  } else {
    finishLoop();
  }
});
elements["next-note"].addEventListener("click", () => {
  const next = pickNextNote(state.workspace.notes, state.progress, new Date(), state.note.id);
  if (next) renderNote(next);
});
elements["reset-progress"].addEventListener("click", clearProgress);
elements["footer-reset"].addEventListener("click", clearProgress);

async function start() {
  try {
    const response = await fetch("./data/sample-workspace.json");
    if (!response.ok) throw new Error("Could not load the sample workspace.");
    state.workspace = await response.json();
    validateWorkspace(state.workspace);
    const note = pickNextNote(state.workspace.notes, state.progress) ?? state.workspace.notes[0];
    renderNote(note);
  } catch (error) {
    elements["note-title"].textContent = "The sample workspace could not load.";
    elements["note-body"].textContent = error.message;
  }
}

start();
