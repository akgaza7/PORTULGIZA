"use client";

import { useMemo, useState } from "react";
import { ProgressStrip } from "@/components/progress-strip";
import type { QuizQuestion } from "@/lib/lesson-data";

type QuizPanelProps = {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
};

export function QuizPanel({ questions, onComplete }: QuizPanelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  const current = questions[currentIndex];
  const score = useMemo(
    () => answers.reduce((total, answer, index) => (answer === questions[index].answer ? total + 1 : total), 0),
    [answers, questions]
  );

  const submitAnswer = () => {
    if (!selected) {
      return;
    }

    const nextAnswers = [...answers, selected];
    const lastQuestion = currentIndex === questions.length - 1;
    setAnswers(nextAnswers);
    setSelected(null);

    if (lastQuestion) {
      const finalScore = nextAnswers.reduce(
        (total, answer, index) => (answer === questions[index].answer ? total + 1 : total),
        0
      );
      setFinished(true);
      onComplete(finalScore);
      return;
    }

    setCurrentIndex((value) => value + 1);
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setSelected(null);
    setAnswers([]);
    setFinished(false);
  };

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <section className="card-surface p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-pine/60">Lesson Complete</p>
        <h3 className="mt-2 text-3xl font-semibold">Quiz score summary</h3>
        <p className="mt-3 max-w-2xl text-ink/70">
          You answered {score} out of {questions.length} correctly. Keep replaying the audio and revisiting
          the flashcards to lock in the sounds and meanings.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-moss p-4">
            <p className="text-sm text-ink/60">Correct answers</p>
            <p className="mt-2 text-3xl font-semibold">{score}</p>
          </div>
          <div className="rounded-3xl bg-white p-4">
            <p className="text-sm text-ink/60">Accuracy</p>
            <p className="mt-2 text-3xl font-semibold">{percentage}%</p>
          </div>
          <div className="rounded-3xl bg-white p-4">
            <p className="text-sm text-ink/60">Next focus</p>
            <p className="mt-2 text-lg font-semibold text-pine">
              {percentage >= 80 ? "Try conversation practice again" : "Replay the phrases once more"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={restartQuiz}
          className="mt-6 rounded-full bg-pine px-5 py-3 text-sm font-semibold text-white"
        >
          Retake quiz
        </button>
      </section>
    );
  }

  return (
    <section className="card-surface p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-pine/60">Quiz</p>
          <h3 className="text-2xl font-semibold">End-of-lesson check</h3>
        </div>
        <div className="w-full max-w-xs">
          <ProgressStrip value={currentIndex + 1} max={questions.length} label="Questions" />
        </div>
      </div>

      <h4 className="mt-6 text-xl font-semibold">{current.prompt}</h4>
      <div className="mt-4 grid gap-3">
        {current.options.map((option) => {
          const isSelected = selected === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setSelected(option)}
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                isSelected ? "border-pine bg-pine text-white" : "border-pine/10 bg-white text-ink hover:border-pine/40"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={submitAnswer}
        disabled={!selected}
        className="mt-6 rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {currentIndex === questions.length - 1 ? "Finish lesson" : "Next question"}
      </button>
    </section>
  );
}
