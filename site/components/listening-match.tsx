"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SpeechButton, speakEuropeanPortuguese, type PortugueseVoiceGender } from "@/components/speech-button";
import type { CategoryLesson } from "@/lib/lesson-data";
import { splitWordMeanings } from "@/lib/word-meanings";

type ListeningMatchProps = {
  lesson: CategoryLesson;
  onComplete: () => void;
  onListen: () => void;
  onAnswer: (answer: {
    prompt: string;
    correctAnswer: string;
    learnerAnswer: string;
    correct: boolean;
  }) => void;
};

type ListeningChallenge = {
  portuguese: string;
  answer: string;
  options: string[];
  voiceGender?: PortugueseVoiceGender;
};

function createChallenges(lesson: CategoryLesson): ListeningChallenge[] {
  const sourceItems = lesson.phrases.map(({ portuguese, english, genderCue }) => ({
    portuguese,
    answer: english,
    voiceGender: genderCue?.gender
  }));

  return Array.from({ length: 10 }, (_, index) => {
    const source = sourceItems[index % sourceItems.length];
    const distractors = sourceItems.filter((item) => item.answer !== source.answer);
    const options = [
      source.answer,
      distractors[(index + 1) % distractors.length].answer,
      distractors[(index + 3) % distractors.length].answer,
    ];
    const shift = (index * 2) % options.length;

    return {
      ...source,
      options: [...options.slice(shift), ...options.slice(0, shift)],
    };
  });
}

export function ListeningMatch({ lesson, onComplete, onListen, onAnswer }: ListeningMatchProps) {
  const challenges = useMemo(() => createChallenges(lesson), [lesson]);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [missedCurrent, setMissedCurrent] = useState(false);
  const [autoPlayRequested, setAutoPlayRequested] = useState(false);
  const [finished, setFinished] = useState(false);
  const onListenRef = useRef(onListen);
  const challenge = challenges[challengeIndex];
  const isCorrect = selected === challenge.answer;

  useEffect(() => {
    onListenRef.current = onListen;
  }, [onListen]);

  useEffect(() => {
    if (!autoPlayRequested) return;
    setAutoPlayRequested(false);
    speakEuropeanPortuguese(challenge.portuguese, {
      onStart: () => onListenRef.current(),
      voiceGender: challenge.voiceGender
    });
  }, [autoPlayRequested, challenge.portuguese, challenge.voiceGender]);

  const chooseAnswer = (option: string) => {
    if (selected) return;
    setSelected(option);
    onAnswer({
      prompt: `What did you hear? ${challenge.portuguese}`,
      correctAnswer: challenge.answer,
      learnerAnswer: option,
      correct: option === challenge.answer
    });
    if (option === challenge.answer) {
      speakEuropeanPortuguese(challenge.portuguese, {
        onStart: () => onListenRef.current(),
        voiceGender: challenge.voiceGender
      });
      if (!missedCurrent) setCorrectCount((current) => current + 1);
    }
    if (option !== challenge.answer) setMissedCurrent(true);
  };

  const continueGame = () => {
    if (!selected) return;

    if (!isCorrect) {
      setSelected(null);
      return;
    }

    if (challengeIndex === challenges.length - 1) {
      setFinished(true);
      onComplete();
      return;
    }
    setAutoPlayRequested(true);
    setChallengeIndex((current) => current + 1);
    setSelected(null);
    setMissedCurrent(false);
  };

  const restartGame = () => {
    setChallengeIndex(0);
    setSelected(null);
    setCorrectCount(0);
    setMissedCurrent(false);
    setFinished(false);
  };

  if (finished) {
    return (
      <section className="card-surface flex h-full flex-col justify-between p-6">
        <div>
          <p className="eyebrow">Listen &amp; Match</p>
          <h3 className="mt-2 font-display text-3xl font-bold">Listening complete</h3>
          <p className="mt-3 leading-7 text-ink/65">
            You matched {correctCount} of {challenges.length} phrases correctly on the first attempt.
          </p>
        </div>
        <button type="button" onClick={restartGame} className="mt-6 w-fit rounded-full bg-ocean px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink">
          Listen again
        </button>
      </section>
    );
  }

  return (
    <section className="card-surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Listen &amp; Match</p>
          <h3 className="mt-2 font-display text-3xl font-bold">What did you hear?</h3>
        </div>
        <span aria-live="polite" className="rounded-full bg-sky/30 px-3 py-1.5 text-sm font-semibold text-ocean">
          {challengeIndex + 1}/{challenges.length}
        </span>
      </div>

      <div className="mt-5 rounded-[1.5rem] bg-ocean p-5 text-white">
        <p className="text-sm text-white/65">Hear and read the Portuguese, then choose its meaning below.</p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <SpeechButton
            text={challenge.portuguese}
            onListen={onListen}
            label="Hear it again"
            voiceGender={challenge.voiceGender}
          />
          <p className="font-display text-2xl font-bold text-white" lang="pt-PT">{challenge.portuguese}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {challenge.options.map((option) => {
          const chosen = selected === option;
          const correct = selected && option === challenge.answer;
          return (
            <button
              key={option}
              type="button"
              disabled={Boolean(selected)}
              onClick={() => chooseAnswer(option)}
              className={`rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition ${
                correct
                  ? "border-pine bg-moss text-pine"
                  : chosen
                    ? "border-clay bg-clay/10 text-clay"
                    : "border-ocean/10 bg-white text-ink hover:border-ocean/35"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {selected ? (
        <div className="mt-5" role="status">
          <p className={`rounded-2xl p-4 text-sm font-semibold ${isCorrect ? "bg-moss text-pine" : "bg-clay/10 text-clay"}`}>
            {isCorrect ? "Correct — you heard it clearly." : `The phrase means “${challenge.answer}”.`}
          </p>
          <p lang="pt-PT" className="mt-3 font-display text-xl font-bold text-ink">{challenge.portuguese}</p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink/55">Choose the meaning you heard to unlock the next sound.</p>
      )}

      <div className={`mt-5 flex gap-4 ${selected && !isCorrect ? "flex-col sm:flex-row sm:items-start" : "items-center"}`}>
        <button
          type="button"
          disabled={!selected}
          onClick={continueGame}
          className={`shrink-0 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-ink/10 disabled:text-ink/45 ${selected && !isCorrect ? "bg-clay" : "bg-portugalGreen"}`}
        >
          {!selected
            ? "Choose an answer first"
            : !isCorrect
              ? "Try again"
              : challengeIndex === challenges.length - 1
                ? "Finish listening"
                : "Next"}
        </button>

        {selected && !isCorrect ? (
          <aside className="min-w-0 flex-1 rounded-[1.25rem] border border-portugalGold/35 bg-portugalGold/10 p-3" aria-label="Word meanings">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-ink/55">What each word means</p>
            <div className="flex flex-wrap gap-2">
              {splitWordMeanings(challenge.portuguese, challenge.answer).map((word, index) => (
                <div key={`${word.portuguese}-${index}`} className="min-w-20 rounded-xl border border-white bg-white/90 px-3 py-2 text-center shadow-sm">
                  <p lang="pt-PT" className="font-display text-base font-bold text-portugalGreen">{word.portuguese}</p>
                  <p className="mt-1 text-xs leading-4 text-ink/60">{word.english}</p>
                </div>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
