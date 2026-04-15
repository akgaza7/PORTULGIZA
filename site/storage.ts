"use client";

import { useEffect, useState } from "react";

export type LessonRecord = {
  completed: boolean;
  bestScore: number;
  lastVisited: string | null;
};

export type AppProgress = {
  streak: number;
  lastActiveDate: string | null;
  dailyGoal: number;
  lessonsToday: number;
  completedLessons: Record<string, LessonRecord>;
};

export const defaultProgress: AppProgress = {
  streak: 1,
  lastActiveDate: null,
  dailyGoal: 2,
  lessonsToday: 0,
  completedLessons: {}
};

const STORAGE_KEY = "portuguese-path-progress";

function sameDay(first: Date, second: Date) {
  return first.toDateString() === second.toDateString();
}

function isYesterday(lastDate: Date, currentDate: Date) {
  const clone = new Date(currentDate);
  clone.setDate(currentDate.getDate() - 1);
  return sameDay(lastDate, clone);
}

export function loadProgress(): AppProgress {
  if (typeof window === "undefined") {
    return defaultProgress;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultProgress;
    }
    const parsed = JSON.parse(raw) as AppProgress;
    return { ...defaultProgress, ...parsed, completedLessons: parsed.completedLessons ?? {} };
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress: AppProgress) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }
}

export function hydrateDailyState(progress: AppProgress) {
  const today = new Date();
  if (!progress.lastActiveDate) {
    return progress;
  }

  const lastActive = new Date(progress.lastActiveDate);
  if (sameDay(lastActive, today)) {
    return progress;
  }

  return {
    ...progress,
    streak: isYesterday(lastActive, today) ? progress.streak : 1,
    lessonsToday: 0
  };
}

export function markLessonActivity(progress: AppProgress, slug: string, score: number) {
  const now = new Date();
  const todayIso = now.toISOString();
  const previous = progress.completedLessons[slug];
  const alreadyCountedToday = previous?.lastVisited ? sameDay(new Date(previous.lastVisited), now) : false;

  return {
    ...progress,
    lastActiveDate: todayIso,
    streak:
      progress.lastActiveDate && sameDay(new Date(progress.lastActiveDate), now)
        ? progress.streak
        : progress.lastActiveDate && isYesterday(new Date(progress.lastActiveDate), now)
          ? progress.streak + 1
          : 1,
    lessonsToday: alreadyCountedToday ? progress.lessonsToday : progress.lessonsToday + 1,
    completedLessons: {
      ...progress.completedLessons,
      [slug]: {
        completed: true,
        bestScore: Math.max(previous?.bestScore ?? 0, score),
        lastVisited: todayIso
      }
    }
  };
}

export function useProgressState() {
  const [progress, setProgress] = useState<AppProgress>(defaultProgress);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hydrated = hydrateDailyState(loadProgress());
    setProgress(hydrated);
    saveProgress(hydrated);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      saveProgress(progress);
    }
  }, [progress, ready]);

  return { progress, setProgress, ready };
}
