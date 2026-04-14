import { useState, useEffect, useCallback } from "react";
import { lessons } from "@/data/lessons";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DailyQuestionKey {
  lessonId: string;
  itemIndex: number;
}

export interface DailyState {
  date: string;             // "YYYY-MM-DD"
  questionKeys: DailyQuestionKey[];
  completed: boolean;
  streak: number;           // consecutive days completed
  lastCompleted: string | null;
}

const STORAGE_KEY = "pt-daily-challenge";
const DAILY_Q_COUNT = 5;

// ─── Date helpers ─────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

// ─── Question generation ──────────────────────────────────────────────────────

function generateQuestionKeys(): DailyQuestionKey[] {
  // Pool: every vocab item across all lessons
  const pool: DailyQuestionKey[] = [];
  lessons.forEach((lesson) => {
    lesson.items.forEach((_, idx) => {
      pool.push({ lessonId: lesson.id, itemIndex: idx });
    });
  });
  // Fisher-Yates shuffle then take DAILY_Q_COUNT
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, DAILY_Q_COUNT);
}

// ─── Persistence ──────────────────────────────────────────────────────────────

function loadDailyState(): DailyState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DailyState;
  } catch {
    return null;
  }
}

function saveDailyState(state: DailyState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ─── State machine ────────────────────────────────────────────────────────────

function buildFreshDayState(existing: DailyState | null): DailyState {
  // Carry the streak forward only if the user completed yesterday's challenge
  let newStreak = 0;
  if (existing?.completed && existing.date === yesterdayStr()) {
    newStreak = existing.streak; // Will be incremented on completion today
  }
  // If they missed yesterday (or earlier), streak resets to 0
  return {
    date: todayStr(),
    questionKeys: generateQuestionKeys(),
    completed: false,
    streak: newStreak,
    lastCompleted: existing?.lastCompleted ?? null,
  };
}

export function getDailyState(): DailyState {
  const stored = loadDailyState();
  if (!stored || stored.date !== todayStr()) {
    const fresh = buildFreshDayState(stored);
    saveDailyState(fresh);
    return fresh;
  }
  return stored;
}

export function completeDailyChallenge(): DailyState {
  const state = getDailyState();
  if (state.completed) return state;
  const updated: DailyState = {
    ...state,
    completed: true,
    streak: state.streak + 1,
    lastCompleted: todayStr(),
  };
  saveDailyState(updated);
  return updated;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDailyChallenge() {
  const [daily, setDaily] = useState<DailyState>(getDailyState);

  // Re-sync when the tab regains focus (catches midnight rollovers)
  useEffect(() => {
    const onFocus = () => setDaily(getDailyState());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const complete = useCallback((): DailyState => {
    const updated = completeDailyChallenge();
    setDaily(updated);
    return updated;
  }, []);

  return { daily, complete };
}
