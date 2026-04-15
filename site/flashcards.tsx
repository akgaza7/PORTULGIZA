"use client";

import { useState } from "react";
import { SpeechButton } from "@/components/speech-button";
import type { LessonPhrase } from "@/lib/lesson-data";

type FlashcardsProps = {
  phrases: LessonPhrase[];
};

export function Flashcards({ phrases }: FlashcardsProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const current = phrases[index];

  const move = (direction: "prev" | "next") => {
    setFlipped(false);
    setIndex((currentIndex) => {
      if (direction === "prev") {
        return currentIndex === 0 ? phrases.length - 1 : currentIndex - 1;
      }
      return currentIndex === phrases.length - 1 ? 0 : currentIndex + 1;
    });
  };

  return (
    <section className="card-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-pine/60">Flashcards</p>
          <h3 className="text-2xl font-semibold">Review and flip</h3>
        </div>
        <p className="text-sm text-ink/60">
          {index + 1} of {phrases.length}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        className="flex min-h-64 w-full flex-col justify-between rounded-[2rem] bg-pine p-6 text-left text-white transition hover:-translate-y-1"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">
              {flipped ? "Meaning" : "Portuguese"}
            </p>
            <h4 className="mt-4 text-3xl font-semibold sm:text-4xl">
              {flipped ? current.english : current.portuguese}
            </h4>
          </div>
          <SpeechButton text={current.portuguese} />
        </div>
        <p className="max-w-xl text-sm text-white/75">{current.tip}</p>
      </button>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => move("prev")}
          className="rounded-full border border-pine/15 px-4 py-2 text-sm font-medium text-pine"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => setFlipped((value) => !value)}
          className="rounded-full bg-coral px-5 py-2 text-sm font-semibold text-white"
        >
          {flipped ? "Show Portuguese" : "Reveal meaning"}
        </button>
        <button
          type="button"
          onClick={() => move("next")}
          className="rounded-full border border-pine/15 px-4 py-2 text-sm font-medium text-pine"
        >
          Next
        </button>
      </div>
    </section>
  );
}
