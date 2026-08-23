"use client";

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { lessons } from "@/lib/lesson-data";

export type LessonRecord = {
  completed: boolean;
  bestScore: number;
  lastVisited: string | null;
  quizAttempts: QuizAttempt[];
};

export type QuizAttempt = {
  score: number;
  completedAt: string;
};

export type LearningAnswer = {
  lessonSlug: string;
  activity: "quiz" | "sentenceBuilder" | "listening" | "crisisGame" | "flashcard" | "roleplay";
  prompt: string;
  correctAnswer: string;
  learnerAnswer: string;
  correct: boolean;
  attemptedAt: string;
};

export type LessonPracticeRecord = {
  flashcardsReviewed: boolean;
  conversationPractised: boolean;
  listenCount: number;
  phraseBuilderCompleted: boolean;
  phraseBuilderCorrectAttempts: number;
  phraseBuilderIncorrectAttempts: number;
  listeningMatchCompleted: boolean;
  memoryReviewCount: number;
};

export type PracticeActivity =
  | "flashcards"
  | "conversation"
  | "speaking"
  | "listen"
  | "phraseBuilder"
  | "phraseBuilderCorrect"
  | "phraseBuilderIncorrect"
  | "listeningMatch"
  | "memoryReview";

export type AppProgress = {
  curriculumVersion: 2;
  updatedAt: string | null;
  streak: number;
  lastActiveDate: string | null;
  dailyGoal: number;
  lessonsToday: number;
  completedLessons: Record<string, LessonRecord>;
  practiceByLesson: Record<string, LessonPracticeRecord>;
  answerHistory: LearningAnswer[];
};

export const defaultProgress: AppProgress = {
  curriculumVersion: 2,
  updatedAt: null,
  streak: 0,
  lastActiveDate: null,
  dailyGoal: 2,
  lessonsToday: 0,
  completedLessons: {},
  practiceByLesson: {},
  answerHistory: []
};

const STORAGE_KEY = "portuguese-path-progress";
const retiredScenarioPrompt = /^(The late arrival|The flat phone|The missed delivery|The missing item|The contract meeting|The wrong turning):/i;

function isCurrentLearningAnswer(answer: LearningAnswer) {
  return answer.activity !== "crisisGame" || !retiredScenarioPrompt.test(answer.prompt);
}

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
    const parsed = JSON.parse(raw) as Partial<AppProgress>;
    if (parsed.curriculumVersion !== defaultProgress.curriculumVersion) {
      return defaultProgress;
    }
    const completedLessons = Object.fromEntries(
      Object.entries(parsed.completedLessons ?? {}).map(([slug, record]) => {
        const quizAttempts =
          record.quizAttempts?.length
            ? record.quizAttempts
            : record.lastVisited
              ? [{ score: record.bestScore, completedAt: record.lastVisited }]
              : [];

        return [slug, { ...record, quizAttempts }];
      })
    );

    return {
      ...defaultProgress,
      ...parsed,
      completedLessons,
      practiceByLesson: parsed.practiceByLesson ?? {},
      answerHistory: (parsed.answerHistory ?? []).filter(isCurrentLearningAnswer)
    };
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

function applyActivityDate(progress: AppProgress, now: Date): AppProgress {
  const todayIso = now.toISOString();

  return {
    ...progress,
    lastActiveDate: todayIso,
    streak:
      progress.lastActiveDate && sameDay(new Date(progress.lastActiveDate), now)
        ? progress.streak
        : progress.lastActiveDate && isYesterday(new Date(progress.lastActiveDate), now)
          ? progress.streak + 1
          : 1
  };
}

export function markLessonActivity(progress: AppProgress, slug: string, score: number) {
  const now = new Date();
  const todayIso = now.toISOString();
  const previous = progress.completedLessons[slug];
  const passed = score >= 80 && Boolean(progress.practiceByLesson[slug]?.phraseBuilderCompleted);
  const alreadyCountedToday = previous?.completed && previous.lastVisited
    ? sameDay(new Date(previous.lastVisited), now)
    : false;
  const datedProgress = applyActivityDate(progress, now);

  return {
    ...datedProgress,
    lessonsToday: passed && !alreadyCountedToday ? progress.lessonsToday + 1 : progress.lessonsToday,
    completedLessons: {
      ...progress.completedLessons,
      [slug]: {
        completed: previous?.completed || passed,
        bestScore: Math.max(previous?.bestScore ?? 0, score),
        lastVisited: todayIso,
        quizAttempts: [...(previous?.quizAttempts ?? []), { score, completedAt: todayIso }]
      }
    }
  };
}

export function markPracticeActivity(
  progress: AppProgress,
  slug: string,
  activity: PracticeActivity
): AppProgress {
  const previous = progress.practiceByLesson[slug] ?? {
    flashcardsReviewed: false,
    conversationPractised: false,
    listenCount: 0,
    phraseBuilderCompleted: false,
    phraseBuilderCorrectAttempts: 0,
    phraseBuilderIncorrectAttempts: 0,
    listeningMatchCompleted: false,
    memoryReviewCount: 0
  };
  const datedProgress = applyActivityDate(progress, new Date());

  return {
    ...datedProgress,
    practiceByLesson: {
      ...progress.practiceByLesson,
      [slug]: {
        flashcardsReviewed: activity === "flashcards" ? true : previous.flashcardsReviewed,
        conversationPractised: activity === "conversation" || activity === "speaking" ? true : previous.conversationPractised,
        listenCount: activity === "listen" ? Math.min(previous.listenCount + 1, 3) : previous.listenCount,
        phraseBuilderCompleted:
          activity === "phraseBuilder" ? true : (previous.phraseBuilderCompleted ?? false),
        phraseBuilderCorrectAttempts:
          activity === "phraseBuilderCorrect"
            ? (previous.phraseBuilderCorrectAttempts ?? 0) + 1
            : (previous.phraseBuilderCorrectAttempts ?? 0),
        phraseBuilderIncorrectAttempts:
          activity === "phraseBuilderIncorrect"
            ? (previous.phraseBuilderIncorrectAttempts ?? 0) + 1
            : (previous.phraseBuilderIncorrectAttempts ?? 0),
        listeningMatchCompleted:
          activity === "listeningMatch" ? true : (previous.listeningMatchCompleted ?? false),
        memoryReviewCount:
          activity === "memoryReview"
            ? Math.min((previous.memoryReviewCount ?? 0) + 1, 10)
            : (previous.memoryReviewCount ?? 0)
      }
    }
  };
}

export function markAnswerAttempt(progress: AppProgress, answer: Omit<LearningAnswer, "attemptedAt">): AppProgress {
  const datedProgress = applyActivityDate(progress, new Date());

  return {
    ...datedProgress,
    answerHistory: [
      ...(progress.answerHistory ?? []),
      { ...answer, attemptedAt: new Date().toISOString() }
    ].slice(-200)
  };
}

export function getAnswerReview(progress: AppProgress) {
  const latestByItem = new Map<string, LearningAnswer>();

  for (const answer of (progress.answerHistory ?? []).filter(isCurrentLearningAnswer)) {
    latestByItem.set(`${answer.lessonSlug}:${answer.activity}:${answer.prompt}`, answer);
  }

  const latest = Array.from(latestByItem.values()).sort(
    (first, second) => Date.parse(second.attemptedAt) - Date.parse(first.attemptedAt)
  );

  return {
    correct: latest.filter((answer) => answer.correct),
    needsPractice: latest.filter((answer) => !answer.correct)
  };
}

export type MasteryStage = "Getting started" | "Developing" | "Making progress" | "Confident" | "Mastered";

export function getMasteryStage(score: number): MasteryStage {
  if (score < 40) return "Getting started";
  if (score < 60) return "Developing";
  if (score < 75) return "Making progress";
  if (score < 90) return "Confident";
  return "Mastered";
}

function practiceScore(practice?: LessonPracticeRecord) {
  if (!practice) return 0;

  const listeningScore = practice.listenCount >= 3 ? 20 : practice.listenCount > 0 ? 10 : 0;
  const existingPractice =
    (practice.flashcardsReviewed ? 40 : 0) +
    (practice.conversationPractised ? 40 : 0) +
    listeningScore;
  const gameBonus =
    (practice.phraseBuilderCompleted ? 15 : 0) +
    (practice.listeningMatchCompleted ? 15 : 0) +
    Math.min(practice.memoryReviewCount ?? 0, 5) * 2;

  return Math.min(existingPractice + gameBonus, 100);
}

function sentenceBuildingScore(practice?: LessonPracticeRecord) {
  if (!practice) return 0;
  const correct = practice.phraseBuilderCorrectAttempts ?? 0;
  const incorrect = practice.phraseBuilderIncorrectAttempts ?? 0;
  const attempts = correct + incorrect;
  return attempts ? Math.round((correct / attempts) * 100) : 0;
}

function retentionScore(record?: LessonRecord) {
  if (!record?.quizAttempts.length) return 0;

  const reviewDays = new Set(record.quizAttempts.map((attempt) => attempt.completedAt.slice(0, 10))).size;
  return record.bestScore * Math.min(reviewDays / 2, 1);
}

export function calculateLessonMastery(progress: AppProgress, slug: string) {
  const record = progress.completedLessons[slug];
  const quiz = record?.bestScore ?? 0;
  const retention = retentionScore(record);
  const practice = practiceScore(progress.practiceByLesson[slug]);
  const completion = record?.completed ? 100 : 0;
  const score = Math.round(quiz * 0.4 + retention * 0.25 + practice * 0.25 + completion * 0.1);

  return { score, stage: getMasteryStage(score) };
}

export function calculateLessonProgress(progress: AppProgress, slug: string) {
  const practice = progress.practiceByLesson[slug];
  const lesson = progress.completedLessons[slug];

  return [
    (practice?.listenCount ?? 0) > 0,
    practice?.flashcardsReviewed ?? false,
    practice?.phraseBuilderCompleted ?? false,
    lesson?.completed ?? false
  ].filter(Boolean).length;
}

export function calculateCourseMastery(progress: AppProgress, lessonSlugs: readonly string[]) {
  const average = (values: number[]) =>
    values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
  const quiz = average(lessonSlugs.map((slug) => progress.completedLessons[slug]?.bestScore ?? 0));
  const retention = average(lessonSlugs.map((slug) => retentionScore(progress.completedLessons[slug])));
  const practice = average(lessonSlugs.map((slug) => practiceScore(progress.practiceByLesson[slug])));
  const sentenceBuilding = average(
    lessonSlugs.map((slug) => sentenceBuildingScore(progress.practiceByLesson[slug]))
  );
  const completion = average(lessonSlugs.map((slug) => (progress.completedLessons[slug]?.completed ? 100 : 0)));
  const hasEvidence = lessonSlugs.some(
    (slug) => progress.completedLessons[slug] || progress.practiceByLesson[slug]
  );
  const consistency = hasEvidence ? Math.min(progress.streak / 7, 1) * 100 : 0;
  const score = Math.round(
    quiz * 0.3 + retention * 0.2 + practice * 0.15 + sentenceBuilding * 0.15 + completion * 0.1 + consistency * 0.1
  );

  return {
    score,
    stage: getMasteryStage(score),
    breakdown: {
      quiz: Math.round(quiz),
      retention: Math.round(retention),
      practice: Math.round(practice),
      sentenceBuilding: Math.round(sentenceBuilding),
      completion: Math.round(completion),
      consistency: Math.round(consistency)
    }
  };
}

export function useProgressState() {
  const [progress, setProgressState] = useState<AppProgress>(defaultProgress);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const localProgress = hydrateDailyState(loadProgress());

    async function hydrateAccountProgress() {
      let selected = localProgress;
      try {
        const response = await fetch("/api/subscriber/progress", { cache: "no-store" });
        if (response.ok) {
          const remote = await response.json() as { progress?: Partial<AppProgress> | null; updated_at?: string | null };
          if (remote.progress && Object.keys(remote.progress).length > 0) {
            const remoteProgress: AppProgress = { ...defaultProgress, ...remote.progress };
            if (remoteProgress.curriculumVersion === defaultProgress.curriculumVersion) {
              const localTime = Date.parse(localProgress.updatedAt ?? "") || 0;
              const remoteTime = Date.parse(remote.updated_at ?? remoteProgress.updatedAt ?? "") || 0;
              if (remoteTime > localTime) selected = remoteProgress;
            }
          }
        }
      } catch {
        // Anonymous and offline learners continue using local progress.
      }

      if (active) {
        setProgressState(selected);
        saveProgress(selected);
        setReady(true);
      }
    }

    void hydrateAccountProgress();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (ready) {
      saveProgress(progress);
      const timeout = window.setTimeout(() => {
        const mastery = calculateCourseMastery(progress, lessons.map((lesson) => lesson.slug));
        void fetch("/api/subscriber/progress", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ progress, masteryScore: mastery.score })
        }).catch(() => undefined);
      }, 800);
      return () => window.clearTimeout(timeout);
    }
  }, [progress, ready]);

  const setProgress = useCallback<Dispatch<SetStateAction<AppProgress>>>((update) => {
    setProgressState((current) => {
      const next = typeof update === "function" ? update(current) : update;
      return { ...next, updatedAt: new Date().toISOString() };
    });
  }, []);

  return { progress, setProgress, ready };
}
