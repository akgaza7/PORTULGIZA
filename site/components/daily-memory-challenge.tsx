"use client";

import { useState } from "react";
import { lessons, type CategoryLesson } from "@/lib/lesson-data";
import type { AppProgress } from "@/lib/storage";

type DailyMemoryChallengeProps = {
  progress: AppProgress;
  onReview: (slug: CategoryLesson["slug"]) => void;
};

type ReviewItem = {
  slug: CategoryLesson["slug"];
  lessonTitle: string;
  portuguese: string;
  english: string;
  priority: number;
};

function createReviewItems(progress: AppProgress): ReviewItem[] {
  return lessons
    .flatMap((lesson) => lesson.phrases.map((phrase, phraseIndex) => {
      const record = progress.completedLessons[lesson.slug];
      const practice = progress.practiceByLesson[lesson.slug];
      const priority =
        (record?.bestScore ?? 0) +
        (practice?.memoryReviewCount ?? 0) * 4 +
        phraseIndex;
      return {
        slug: lesson.slug,
        lessonTitle: lesson.title,
        portuguese: phrase.portuguese,
        english: phrase.english,
        priority
      };
    }))
    .sort((first, second) => first.priority - second.priority || first.portuguese.localeCompare(second.portuguese))
    .slice(0, 5);
}

export function DailyMemoryChallenge({ progress, onReview }: DailyMemoryChallengeProps) {
  const [items] = useState(() => createReviewItems(progress));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [remembered, setRemembered] = useState(0);
  const [neededHint, setNeededHint] = useState(0);
  const [finished, setFinished] = useState(false);
  const item = items[index];

  const rateAnswer = (rating: "remembered" | "hint" | "notYet") => {
    if (rating === "remembered") setRemembered((current) => current + 1);
    if (rating === "hint") setNeededHint((current) => current + 1);
    onReview(item.slug);

    if (index === items.length - 1) {
      setFinished(true);
      return;
    }

    setIndex((current) => current + 1);
    setRevealed(false);
  };

  const restart = () => {
    setIndex(0);
    setRevealed(false);
    setRemembered(0);
    setNeededHint(0);
    setFinished(false);
  };

  if (finished) {
    const notYet = items.length - remembered - neededHint;
    return (
      <section className="mt-8 overflow-hidden rounded-[2.25rem] bg-ink p-6 text-white shadow-soft sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky">Daily Memory Challenge</p>
        <h2 className="mt-3 font-display text-4xl font-bold">Review complete</h2>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-3xl bg-white/10 p-4"><p className="text-3xl font-bold">{remembered}</p><p className="mt-1 text-sm text-white/60">Remembered</p></div>
          <div className="rounded-3xl bg-white/10 p-4"><p className="text-3xl font-bold">{neededHint}</p><p className="mt-1 text-sm text-white/60">With a hint</p></div>
          <div className="rounded-3xl bg-white/10 p-4"><p className="text-3xl font-bold">{notYet}</p><p className="mt-1 text-sm text-white/60">Review again</p></div>
        </div>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-white/65">Every honest answer helps Portulgiza choose better review phrases for you.</p>
        <button type="button" onClick={restart} className="mt-6 rounded-full bg-sun px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white">
          Review these again
        </button>
      </section>
    );
  }

  return (
    <section className="mt-8 overflow-hidden rounded-[2.25rem] bg-ink p-6 text-white shadow-soft sm:p-8">
      <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky">Daily Memory Challenge</p>
          <h2 className="mt-3 font-display text-4xl font-bold">Can you remember it?</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/60">
            Five short reviews chosen from the phrases that need your attention most.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">{index + 1}/{items.length}</span>
            <span className="text-sm text-white/55">{item.lessonTitle}</span>
          </div>
        </div>

        <div className="rounded-[1.75rem] bg-white p-5 text-ink sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean/55">Say it in Portuguese</p>
          <p className="mt-3 font-display text-3xl font-bold">{item.english}</p>

          {revealed ? (
            <div className="mt-5 rounded-2xl bg-sky/25 p-4" role="status">
              <p className="text-sm text-ink/50">Portuguese</p>
              <p lang="pt-PT" className="mt-1 font-display text-2xl font-bold text-ocean">{item.portuguese}</p>
            </div>
          ) : (
            <button type="button" onClick={() => setRevealed(true)} className="mt-6 rounded-full bg-ocean px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink">
              Reveal answer
            </button>
          )}

          {revealed ? (
            <div className="mt-5 flex flex-wrap gap-2" aria-label="Rate your memory">
              <button type="button" onClick={() => rateAnswer("remembered")} className="rounded-full bg-pine px-4 py-2.5 text-sm font-semibold text-white">Remembered</button>
              <button type="button" onClick={() => rateAnswer("hint")} className="rounded-full bg-sun px-4 py-2.5 text-sm font-semibold text-ink">Needed a hint</button>
              <button type="button" onClick={() => rateAnswer("notYet")} className="rounded-full border border-clay/25 bg-clay/10 px-4 py-2.5 text-sm font-semibold text-clay">Not yet</button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
