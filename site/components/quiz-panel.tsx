"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProgressStrip } from "@/components/progress-strip";
import { speakEuropeanPortuguese } from "@/components/speech-button";
import type { QuizQuestion } from "@/lib/lesson-data";

type QuizPanelProps = {
  questions: QuizQuestion[];
  phraseBuilderComplete: boolean;
  onComplete: (score: number) => boolean;
  onListen?: () => void;
  onAnswer: (answer: {
    prompt: string;
    correctAnswer: string;
    learnerAnswer: string;
    correct: boolean;
  }) => void;
};

export function QuizPanel({ questions, phraseBuilderComplete, onComplete, onListen, onAnswer }: QuizPanelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [passed, setPassed] = useState(false);

  const current = questions[currentIndex];
  const score = useMemo(
    () => answers.reduce((total, answer, index) => (answer === questions[index].answer ? total + 1 : total), 0),
    [answers, questions]
  );

  const selectOption = (option: string) => {
    setSelected(option);
    const audio = current.audioByOption?.[option];
    if (audio) {
      speakEuropeanPortuguese(audio.text, {
        voiceGender: audio.voiceGender,
        onStart: onListen
      });
    }
  };

  const speakQuizOption = (question: QuizQuestion, option: string) => {
    const audio = question.audioByOption?.[option];
    speakEuropeanPortuguese(audio?.text ?? option, {
      voiceGender: audio?.voiceGender,
      rate: 0.9,
      onStart: onListen
    });
  };

  const submitAnswer = () => {
    if (!selected) {
      return;
    }

    onAnswer({
      prompt: current.prompt,
      correctAnswer: current.answer,
      learnerAnswer: selected,
      correct: selected === current.answer
    });

    const nextAnswers = [...answers, selected];
    const lastQuestion = currentIndex === questions.length - 1;
    setAnswers(nextAnswers);
    setSelected(null);

    if (lastQuestion) {
      const finalScore = nextAnswers.reduce(
        (total, answer, index) => (answer === questions[index].answer ? total + 1 : total),
        0
      );
      setPassed(onComplete(finalScore));
      setFinished(true);
      return;
    }

    setCurrentIndex((value) => value + 1);
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setSelected(null);
    setAnswers([]);
    setFinished(false);
    setPassed(false);
  };

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    const review = questions.map((question, index) => ({
      ...question,
      learnerAnswer: answers[index],
      correct: answers[index] === question.answer
    }));
    const correctItems = review.filter((item) => item.correct);
    const practiceItems = review.filter((item) => !item.correct);

    return (
      <section className="card-surface p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-pine/60">
          {passed ? "Lesson complete" : "Keep practising"}
        </p>
        <h3 className="mt-2 text-3xl font-semibold">{passed ? "You passed this lesson" : "Quiz score summary"}</h3>
        <p className="mt-3 max-w-2xl text-ink/70">
          You answered {score} out of {questions.length} correctly. All 10 assessment questions were checked.
          Your exact results have also been added to the learning dashboard.
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
          <a
            href={!phraseBuilderComplete ? "#phrase-builder" : percentage >= 80 ? "#translate-crisis-game" : "#core-phrases"}
            className="group rounded-3xl bg-white p-4 transition hover:bg-portugalGreen/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portugalGreen"
          >
            <p className="text-sm text-ink/60">Next focus</p>
            <p className="mt-2 text-lg font-semibold text-portugalGreen group-hover:text-ink">
              {!phraseBuilderComplete
                ? "Complete the Phrase Builder"
                : percentage >= 80
                  ? "Play the sentence challenge"
                  : "Replay the phrases once more"}
            </p>
            <p className="mt-2 text-sm font-semibold text-portugalGreen" aria-hidden="true">Go there ↑</p>
          </a>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.75rem] border border-portugalGreen/15 bg-portugalGreen/5 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-portugalGreen">Correct</p>
                <h4 className="mt-1 font-display text-2xl font-bold">You got these right</h4>
              </div>
              <span className="rounded-full bg-portugalGreen px-3 py-1 text-xs font-bold text-white">{correctItems.length}</span>
            </div>
            {correctItems.length ? (
              <ul className="mt-4 grid gap-2">
                {correctItems.map((item) => (
                  <li key={item.prompt} className="rounded-2xl bg-white p-3">
                    <p className="text-sm text-ink/55">{item.prompt}</p>
                    <button
                      type="button"
                      onClick={() => speakQuizOption(item, item.answer)}
                      aria-label={`Hear ${item.answer} in European Portuguese`}
                      title="Click to hear this in European Portuguese"
                      data-portuguese-voice-managed="true"
                      className="mt-1 inline-flex items-center gap-2 rounded-lg font-bold text-portugalGreen transition hover:bg-portugalGreen/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portugalGreen"
                    >
                      <span lang="pt-PT">{item.answer}</span>
                      <span aria-hidden="true">🔊</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-4 rounded-2xl bg-white p-3 text-sm text-ink/55">No correct answers yet. Review the phrases and try again.</p>}
          </div>

          <div className="rounded-[1.75rem] border border-portugalRed/15 bg-portugalRed/5 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-portugalRed">Needs practice</p>
              </div>
              <span className="rounded-full bg-portugalRed px-3 py-1 text-xs font-bold text-white">{practiceItems.length}</span>
            </div>
            {practiceItems.length ? (
              <ul className="mt-4 grid gap-2">
                {practiceItems.map((item) => (
                  <li key={item.prompt} className="rounded-2xl bg-white p-3">
                    <p className="text-sm text-ink/55">{item.prompt}</p>
                    <button
                      type="button"
                      onClick={() => speakQuizOption(item, item.answer)}
                      aria-label={`Hear the correct answer ${item.answer} in European Portuguese`}
                      title="Click to hear this in European Portuguese"
                      data-portuguese-voice-managed="true"
                      className="mt-1 inline-flex items-center gap-2 rounded-lg font-bold text-portugalRed transition hover:bg-portugalRed/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portugalRed"
                    >
                      <span>Correct:</span>
                      <span lang="pt-PT">{item.answer}</span>
                      <span aria-hidden="true">🔊</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => speakQuizOption(item, item.learnerAnswer)}
                      aria-label={`Hear your answer ${item.learnerAnswer} in European Portuguese`}
                      title="Click to hear this in European Portuguese"
                      data-portuguese-voice-managed="true"
                      className="mt-1 flex items-center gap-1 rounded-lg text-xs text-ink/45 transition hover:bg-sand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean"
                    >
                      <span>Your answer:</span>
                      <span lang="pt-PT">{item.learnerAnswer}</span>
                      <span aria-hidden="true">🔊</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-4 rounded-2xl bg-white p-3 text-sm font-semibold text-portugalGreen">Excellent — every lesson phrase was correct.</p>}
          </div>
        </div>
        <Link href="/dashboard" className="mt-5 inline-flex rounded-full border border-ocean/20 px-5 py-3 text-sm font-bold text-ocean transition hover:bg-sky/20">
          View the full learning dashboard ↑
        </Link>
        <button
          type="button"
          onClick={restartQuiz}
          className="mt-6 rounded-full bg-portugalGreen px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink"
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
          <p className="text-lg font-bold uppercase tracking-[0.16em] text-black">QUIZ</p>
        </div>
        <div className="w-full max-w-xs">
          <ProgressStrip value={currentIndex + 1} max={questions.length} label="Questions" tone="beginner" />
        </div>
      </div>

      <h4 className="mt-8 text-xl font-semibold">{current.prompt}</h4>
      <div className="mt-3 rounded-2xl border border-portugalGold/30 bg-portugalGold/10 p-3 text-sm leading-6 text-ink/70" role="note">
        Choose an answer and hear its European Portuguese audio. You may change your choice before submitting. Once submitted, the answer is final and you cannot return to this question.
      </div>
      <div className="mt-4 grid gap-3">
        {current.options.map((option) => {
          const isSelected = selected === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => selectOption(option)}
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                isSelected
                  ? "border-portugalGreen bg-portugalGreen text-white"
                  : "border-portugalGreen/10 bg-white text-ink hover:border-portugalGreen/40"
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
        className="mt-6 rounded-full bg-clay px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
      >
        {currentIndex === questions.length - 1 ? "Submit final answer" : "Submit answer"}
      </button>
    </section>
  );
}
