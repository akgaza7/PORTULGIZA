import { useState, useEffect } from "react";
import { appendLog } from "./progressLog";

export interface LessonProgress {
  lessonId: string;
  completedCards: number;
  totalCards: number;
  quizScore: number | null;
  quizTotal: number | null;
  lastStudied: string | null;
  /** portuguese strings the learner answered correctly in the last flashcard session */
  flashcardCorrect?: string[];
  /** portuguese strings the learner got wrong — shown in "Try again" */
  flashcardWrong?: string[];
  /** All words answered correctly across every activity — drives the proficiency bar */
  masteredWords?: string[];
  /** Words the learner got wrong in any activity and should practise */
  practiceWords?: string[];
}

const STORAGE_KEY = "pt-learning-progress";

export function loadProgress(): Record<string, LessonProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveProgress(progress: Record<string, LessonProgress>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function updateLessonProgress(
  lessonId: string,
  update: Partial<LessonProgress>
): void {
  const all = loadProgress();
  const merged: LessonProgress = {
    lessonId,
    completedCards: 0,
    totalCards: 0,
    quizScore: null,
    quizTotal: null,
    lastStudied: new Date().toISOString(),
    ...(all[lessonId] || {}),
    ...update,
  };
  // Safety cap: quizScore must never exceed quizTotal
  if (
    merged.quizScore !== null &&
    merged.quizTotal !== null &&
    merged.quizScore > merged.quizTotal
  ) {
    merged.quizScore = merged.quizTotal;
  }
  all[lessonId] = merged;
  saveProgress(all);
}

/**
 * Merge word-level outcomes from any activity into the persistent mastered/practice lists.
 * - Correct words are added to masteredWords and removed from practiceWords.
 * - Wrong words are added to practiceWords only if they are not already mastered.
 */
export function mergeProficiency(
  lessonId: string,
  correctWords: string[],
  wrongWords: string[]
): void {
  if (correctWords.length === 0 && wrongWords.length === 0) return;
  const all = loadProgress();
  const p: LessonProgress = all[lessonId] ?? {
    lessonId, completedCards: 0, totalCards: 0,
    quizScore: null, quizTotal: null, lastStudied: null,
  };

  const prevMastered: string[] = p.masteredWords ?? [];
  const prevPractice: string[] = p.practiceWords ?? [];

  const mastered = Array.from(new Set([...prevMastered, ...correctWords]));
  const practice = Array.from(new Set([...prevPractice, ...wrongWords]))
    .filter((w) => !mastered.includes(w));

  all[lessonId] = { ...p, masteredWords: mastered, practiceWords: practice, lastStudied: new Date().toISOString() };
  saveProgress(all);

  const now = new Date().toISOString();
  appendLog([
    ...correctWords.map((word) => ({ ts: now, word, lessonId, result: "correct" as const })),
    ...wrongWords.map((word) => ({ ts: now, word, lessonId, result: "wrong" as const })),
  ]);
}

export function useProgress() {
  const [progress, setProgress] = useState<Record<string, LessonProgress>>(loadProgress);

  const refresh = () => setProgress(loadProgress());

  useEffect(() => {
    const onStorage = () => refresh();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { progress, refresh };
}
