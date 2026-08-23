"use client";

import { useMemo, useState } from "react";
import type { CategoryLesson } from "@/lib/lesson-data";
import { splitWordMeanings } from "@/lib/word-meanings";

type PhraseBuilderProps = {
  lesson: CategoryLesson;
  onComplete: () => void;
  onAttempt: (answer: {
    prompt: string;
    correctAnswer: string;
    learnerAnswer: string;
    correct: boolean;
  }) => void;
};

type Challenge = {
  portuguese: string;
  english: string;
  words: string[];
  wordMeanings: string[];
  order: number[];
};

function createChallenges(lesson: CategoryLesson): Challenge[] {
  const candidates = lesson.phrases
    .filter((item, index, items) => items.findIndex((candidate) => candidate.portuguese === item.portuguese) === index)
    .filter((item) => item.portuguese.trim().split(/\s+/).length >= 2)
    .slice(0, 3);

  return candidates.map((item, challengeIndex) => {
    const words = item.portuguese.trim().split(/\s+/);
    const indices = words.map((_, index) => index);
    const offset = (challengeIndex + 1) % words.length;
    const rotated = [...indices.slice(offset), ...indices.slice(0, offset)];
    const order = rotated.every((wordIndex, position) => wordIndex === position) ? rotated.reverse() : rotated;

    return {
      portuguese: item.portuguese,
      english: item.english,
      words,
      wordMeanings: splitWordMeanings(item.portuguese, item.english).map((word) => word.english),
      order
    };
  });
}

export function PhraseBuilder({ lesson, onComplete, onAttempt }: PhraseBuilderProps) {
  const challenges = useMemo(() => createChallenges(lesson), [lesson]);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [finished, setFinished] = useState(false);
  const challenge = challenges[challengeIndex];

  if (!challenge) {
    return (
      <section id="phrase-builder" className="scroll-mt-6 card-surface p-6">
        <p className="eyebrow">Phrase Builder</p>
        <h3 className="mt-2 font-display text-3xl font-bold">Sentence practice coming next</h3>
        <p className="mt-3 leading-7 text-ink/65">
          Learn the vocabulary first. This exercise appears when the lesson contains a phrase with two or more words.
        </p>
      </section>
    );
  }

  const chooseWord = (wordIndex: number) => {
    if (result || selected.includes(wordIndex)) return;
    setSelected((current) => [...current, wordIndex]);
  };

  const removeWord = (wordIndex: number) => {
    if (result) return;
    setSelected((current) => current.filter((index) => index !== wordIndex));
  };

  const moveWord = (fromPosition: number, toPosition: number) => {
    if (result || fromPosition === toPosition || toPosition < 0 || toPosition >= selected.length) return;

    setSelected((current) => {
      const next = [...current];
      const [word] = next.splice(fromPosition, 1);
      next.splice(toPosition, 0, word);
      return next;
    });
  };

  const checkAnswer = () => {
    const answer = selected.map((index) => challenge.words[index]).join(" ");
    const correct = answer === challenge.portuguese;
    setResult(correct ? "correct" : "incorrect");
    onAttempt({
      prompt: challenge.english,
      correctAnswer: challenge.portuguese,
      learnerAnswer: answer,
      correct
    });
  };

  const continueGame = () => {
    if (result === "incorrect") {
      setSelected([]);
      setResult(null);
      return;
    }

    if (challengeIndex === challenges.length - 1) {
      setFinished(true);
      onComplete();
      return;
    }

    setChallengeIndex((current) => current + 1);
    setSelected([]);
    setResult(null);
  };

  const restartGame = () => {
    setChallengeIndex(0);
    setSelected([]);
    setResult(null);
    setFinished(false);
  };

  if (finished) {
    return (
      <section id="phrase-builder" className="scroll-mt-6 card-surface flex h-full flex-col justify-between p-6">
        <div>
          <p className="eyebrow">Phrase Builder</p>
          <h3 className="mt-2 font-display text-3xl font-bold">Sentence complete</h3>
          <p className="mt-3 leading-7 text-ink/65">
            You rebuilt {challenges.length} useful Portuguese phrases in the correct order.
          </p>
        </div>
        <button type="button" onClick={restartGame} className="mt-6 w-fit rounded-full bg-portugalGreen px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink">
          Play again
        </button>
      </section>
    );
  }

  return (
    <section id="phrase-builder" className="scroll-mt-6 card-surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Phrase Builder</p>
          <h3 className="mt-2 font-display text-3xl font-bold">Put the words in order</h3>
        </div>
        <span className="rounded-full bg-sun/30 px-3 py-1.5 text-sm font-semibold text-ink">
          {challengeIndex + 1}/{challenges.length}
        </span>
      </div>

      <p className="mt-5 text-sm font-medium text-ink/55">Build this phrase:</p>
      <p className="mt-2 text-lg font-semibold text-ink">{challenge.english}</p>

      <div className="mt-5 min-h-24 rounded-[1.5rem] border border-dashed border-portugalGreen/25 bg-portugalGreen/5 p-4" aria-label="Your Portuguese phrase">
        <div className="flex flex-wrap gap-2">
          {selected.length ? selected.map((wordIndex, position) => (
            <div
              key={wordIndex}
              draggable={!result}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", String(position));
              }}
              onDragOver={(event) => {
                if (!result) event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                moveWord(Number(event.dataTransfer.getData("text/plain")), position);
              }}
              className="flex items-center rounded-full bg-portugalGreen text-white shadow-sm"
            >
              <button
                type="button"
                lang="pt-PT"
                onClick={() => removeWord(wordIndex)}
                className="cursor-grab rounded-l-full px-4 py-2 text-sm font-semibold active:cursor-grabbing"
                aria-label={`Return ${challenge.words[wordIndex]} to the word bank`}
                title="Drag to reorder or tap to return"
              >
                {challenge.words[wordIndex]}
              </button>
              <span className="flex border-l border-white/25 pr-1">
                <button
                  type="button"
                  disabled={position === 0 || Boolean(result)}
                  onClick={() => moveWord(position, position - 1)}
                  className="px-2 py-2 text-sm font-bold disabled:opacity-25"
                  aria-label={`Move ${challenge.words[wordIndex]} left`}
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled={position === selected.length - 1 || Boolean(result)}
                  onClick={() => moveWord(position, position + 1)}
                  className="rounded-r-full px-2 py-2 text-sm font-bold disabled:opacity-25"
                  aria-label={`Move ${challenge.words[wordIndex]} right`}
                >
                  →
                </button>
              </span>
            </div>
          )) : <p className="text-sm text-ink/40">Choose the Portuguese words below.</p>}
        </div>
        {selected.length > 1 && !result ? (
          <p className="mt-3 text-xs text-ink/50">Drag the words or use the arrows to change their order. Tap a word to return it.</p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {challenge.order.map((wordIndex) => (
          <button
            key={wordIndex}
            type="button"
            lang="pt-PT"
            disabled={selected.includes(wordIndex)}
            onClick={() => chooseWord(wordIndex)}
            className="rounded-full border border-portugalGreen/15 bg-white px-4 py-2 text-sm font-semibold text-portugalGreen transition hover:border-portugalGreen/40 disabled:opacity-30"
          >
            {challenge.words[wordIndex]}
          </button>
        ))}
      </div>

      {result ? (
        <p className={`mt-5 rounded-2xl p-4 text-sm font-semibold ${result === "correct" ? "bg-moss text-pine" : "bg-clay/10 text-clay"}`} role="status">
          {result === "correct" ? "Correct — that sounds natural." : <>Not quite. The correct phrase is “<span lang="pt-PT">{challenge.portuguese}</span>”.</>}
        </p>
      ) : null}

      <div className={`mt-5 flex gap-4 ${result === "incorrect" ? "flex-col sm:flex-row sm:items-start" : "items-center"}`}>
        <button
          type="button"
          disabled={!selected.length}
          onClick={result ? continueGame : checkAnswer}
          className="shrink-0 rounded-full bg-clay px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          {result === "incorrect" ? "Try again" : result === "correct" ? "Next phrase" : "Check phrase"}
        </button>

        {result === "incorrect" ? (
          <aside className="min-w-0 flex-1 rounded-[1.25rem] border border-portugalGold/35 bg-portugalGold/10 p-3" aria-label="Word meanings">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-ink/55">What each word means</p>
            <div className="flex flex-wrap gap-2">
              {challenge.words.map((word, index) => (
                <div key={`${word}-${index}`} className="min-w-20 rounded-xl border border-white bg-white/90 px-3 py-2 text-center shadow-sm">
                  <p lang="pt-PT" className="font-display text-base font-bold text-portugalGreen">{word}</p>
                  <p className="mt-1 text-xs leading-4 text-ink/60">{challenge.wordMeanings[index]}</p>
                </div>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
