"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { SpeechButton, speakEuropeanPortuguese } from "@/components/speech-button";
import { useAvatarPreference } from "@/lib/avatar-preference";
import type { LessonPhrase } from "@/lib/lesson-data";

type FlashcardAnswer = {
  prompt: string;
  correctAnswer: string;
  learnerAnswer: string;
  correct: boolean;
};

type FlashcardsProps = {
  phrases: LessonPhrase[];
  onPractice?: () => void;
  onListen?: () => void;
  onAnswer: (answer: FlashcardAnswer) => void;
};

type CardState = {
  attempts: number;
  selected: string | null;
  revealed: boolean;
  correct: boolean;
  locked: boolean;
};

const emptyCardState: CardState = {
  attempts: 0,
  selected: null,
  revealed: false,
  correct: false,
  locked: false
};

export function Flashcards({ phrases, onPractice, onListen, onAnswer }: FlashcardsProps) {
  const [index, setIndex] = useState(0);
  const [cardStates, setCardStates] = useState<Record<number, CardState>>({});
  const { details: avatar } = useAvatarPreference();
  const current = phrases[index];
  const state = cardStates[index] ?? emptyCardState;
  const options = useMemo(
    () => phrases.map((phrase, phraseIndex) => {
      const choices = [
        phrase.english,
        phrases[(phraseIndex + 1) % phrases.length].english,
        phrases[(phraseIndex + 2) % phrases.length].english
      ];
      const shift = (phraseIndex * 2) % choices.length;
      return [...choices.slice(shift), ...choices.slice(0, shift)];
    }),
    [phrases]
  )[index];

  const updateCurrent = (update: Partial<CardState>) => {
    setCardStates((currentStates) => ({
      ...currentStates,
      [index]: { ...(currentStates[index] ?? emptyCardState), ...update }
    }));
  };

  const selectAnswer = (answer: string) => {
    if (state.revealed || state.locked) return;
    updateCurrent({ selected: answer });
    speakEuropeanPortuguese(current.portuguese, {
      voiceGender: current.genderCue?.gender,
      onStart: onListen
    });
  };

  const submitAnswer = () => {
    if (!state.selected || state.revealed || state.locked) return;
    const correct = state.selected === current.english;
    const attempts = state.attempts + 1;
    const locked = !correct && attempts >= 3;

    updateCurrent({ attempts, correct, locked, revealed: true });
    onPractice?.();
    onAnswer({
      prompt: `What does “${current.portuguese}” mean?`,
      correctAnswer: current.english,
      learnerAnswer: state.selected,
      correct
    });
  };

  const tryAgain = () => {
    if (state.correct || state.locked) return;
    updateCurrent({ selected: null, revealed: false });
  };

  const moveNext = () => {
    setIndex((currentIndex) => {
      return currentIndex === phrases.length - 1 ? 0 : currentIndex + 1;
    });
  };

  return (
    <section
      id="flashcards"
      className="scroll-mt-6 card-surface mx-auto w-full max-w-[24rem] p-3 sm:p-4"
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm uppercase tracking-[0.2em] text-ocean/60">Flashcards</p>
        <p className="text-sm text-ink/60">{index + 1} of {phrases.length}</p>
      </div>

      <div className="flex min-h-36 w-full flex-col justify-between rounded-[1.5rem] bg-ocean p-4 text-left text-white shadow-[0_18px_40px_rgba(13,75,116,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">Portuguese</p>
            <h4 lang="pt-PT" className="mt-2 text-2xl font-semibold sm:text-3xl">{current.portuguese}</h4>
          </div>
          <SpeechButton text={current.portuguese} onListen={onListen} voiceGender={current.genderCue?.gender} />
        </div>
        <p className="mt-2 max-w-xl text-xs text-white/75 sm:text-sm">{current.tip}</p>
      </div>

      <h3 className="mt-4 text-2xl font-semibold text-ink">Choose the meaning</h3>
      <div className="mt-3 grid gap-3" aria-label="Choose one meaning">
        {options.map((option, optionIndex) => {
          const selected = state.selected === option;
          const correctOption = state.revealed && option === current.english;
          return (
            <button
              key={option}
              type="button"
              disabled={state.revealed || state.locked}
              onClick={() => selectAnswer(option)}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-left text-sm font-semibold transition ${
                correctOption
                  ? "border-portugalGreen bg-portugalGreen/10 text-portugalGreen"
                  : state.revealed && selected
                    ? "border-portugalRed bg-portugalRed/5 text-portugalRed"
                    : selected
                      ? "border-ocean bg-ocean/5 text-ocean"
                      : "border-ocean/10 bg-white text-ink hover:border-ocean/35"
              } disabled:cursor-default`}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink/5">{optionIndex + 1}</span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      {state.revealed ? (
        <div className={`mt-4 rounded-2xl p-4 ${state.correct ? "bg-portugalGreen/10" : "bg-portugalRed/5"}`} role="status">
          <p className={`font-bold ${state.correct ? "text-portugalGreen" : "text-portugalRed"}`}>
            {state.correct
              ? "Correct — you matched the meaning."
              : state.locked
                ? "Three attempts used — revise this sentence before trying again."
                : "Not quite — review the meaning, then try again."}
          </p>
          {!state.correct ? (
            <>
              <p className="mt-2 text-sm text-ink/60">Correct meaning: <strong className="text-ink">{current.english}</strong></p>
              <p className="mt-1 text-xs text-ink/50">Your answer: {state.selected}</p>
            </>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink/55">Choose one answer, then submit it. You can try again twice.</p>
      )}

      <div className="mt-4 grid min-h-20 grid-cols-[1fr_auto_1fr] items-center gap-2">
        {state.revealed && !state.correct && !state.locked ? (
          <button type="button" onClick={tryAgain} className="justify-self-start rounded-full bg-portugalRed px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink">
            Try again
          </button>
        ) : (
          <button
            type="button"
            onClick={submitAnswer}
            disabled={!state.selected || state.revealed || state.locked}
            className="justify-self-start rounded-full bg-clay px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-ink/10 disabled:text-ink/40"
          >
            {state.locked ? "Revise first" : state.correct ? "Submitted" : "Submit"}
          </button>
        )}

        {state.revealed ? (
          <div className="flex flex-col items-center justify-center" aria-label={state.correct ? `${avatar.name} celebrates your correct answer` : `${avatar.name} encourages you to try again`}>
            <div className={`relative h-14 w-14 overflow-hidden rounded-full border-2 bg-white ${state.correct ? "border-portugalGreen" : "border-portugalRed"}`}>
              <Image src={avatar.image} alt="" fill sizes="56px" className={`object-cover ${avatar.imagePosition}`} />
              <span className="absolute bottom-0 right-0 grid h-6 w-6 place-items-center rounded-full bg-white text-sm shadow" aria-hidden="true">
                {state.correct ? "👏" : "↻"}
              </span>
            </div>
            <span className="mt-1 text-center text-xs font-bold text-ink">
              {state.correct ? "Well done!" : state.locked ? "Revise this" : `Try again · ${3 - state.attempts} left`}
            </span>
          </div>
        ) : (
          <span aria-hidden="true" />
        )}

        <button
          type="button"
          onClick={moveNext}
          disabled={!state.revealed}
          className="justify-self-end rounded-full border border-ocean/20 px-4 py-2 text-sm font-medium text-ocean transition hover:bg-sky/20 disabled:cursor-not-allowed disabled:border-ink/10 disabled:text-ink/30 disabled:hover:bg-transparent"
        >
          Next
        </button>
      </div>
    </section>
  );
}
