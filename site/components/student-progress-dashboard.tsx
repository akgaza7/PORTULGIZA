"use client";

import { useEffect, useRef, useState } from "react";
import { speakEuropeanPortuguese } from "@/components/speech-button";
import { sentenceBanks } from "@/components/translate-crisis-game";
import { useAvatarPreference } from "@/lib/avatar-preference";
import { lessons } from "@/lib/lesson-data";
import {
  calculateCourseMastery,
  getAnswerReview,
  type AppProgress,
  type LearningAnswer,
  useProgressState
} from "@/lib/storage";

type StudentProgressDashboardProps = {
  progress: AppProgress;
  subscriptionStatus?: string | null;
};

const activityLabels: Record<LearningAnswer["activity"], string> = {
  quiz: "Quiz",
  sentenceBuilder: "Sentence",
  listening: "Hearing",
  crisisGame: "Tourist challenge",
  flashcard: "Flashcard",
  roleplay: "Character role-play"
};

function findAnswerPhrase(answer: LearningAnswer) {
  const correctAnswer = answer.correctAnswer.trim().toLocaleLowerCase("pt-PT");
  const lesson = lessons.find((candidate) => candidate.slug === answer.lessonSlug);
  const prompt = answer.prompt.toLocaleLowerCase("pt-PT");
  const lessonPhrase = lesson?.phrases.find((phrase) => {
    const portuguese = phrase.portuguese.trim().toLocaleLowerCase("pt-PT");
    const english = phrase.english.trim().toLocaleLowerCase("pt-PT");

    return correctAnswer === portuguese || correctAnswer === english || prompt.includes(portuguese);
  });

  if (lessonPhrase) return lessonPhrase;

  const curriculumSentence = Object.values(sentenceBanks)
    .flat()
    .find((sentence) => sentence.portuguese.trim().toLocaleLowerCase("pt-PT") === correctAnswer);

  if (curriculumSentence) {
    return {
      portuguese: curriculumSentence.portuguese,
      english: curriculumSentence.meaning,
      genderCue: undefined
    };
  }

  return null;
}

function AnswerList({ answers, emptyMessage, needsPractice = false }: {
  answers: LearningAnswer[];
  emptyMessage: string;
  needsPractice?: boolean;
}) {
  const { avatar } = useAvatarPreference();

  if (!answers.length) {
    return <p className="rounded-2xl bg-white/70 p-3 text-sm leading-5 text-ink/55">{emptyMessage}</p>;
  }

  return (
    <ul className="grid gap-2">
      {answers.map((answer) => {
        const lessonTitle = lessons.find((lesson) => lesson.slug === answer.lessonSlug)?.title ?? answer.lessonSlug;
        const phrase = findAnswerPhrase(answer);

        return (
          <li
            key={`${answer.lessonSlug}-${answer.activity}-${answer.prompt}`}
            className="rounded-2xl border border-white/80 bg-white p-3 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-ink/45">
              <span>{lessonTitle}</span>
              <span aria-hidden="true">•</span>
              <span>{activityLabels[answer.activity]}</span>
            </div>
            {phrase ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => speakEuropeanPortuguese(phrase.portuguese, {
                    voiceGender: phrase.genderCue?.gender ?? (avatar === "female" ? "feminine" : "masculine"),
                    rate: 0.9
                  })}
                  aria-label={`Hear ${phrase.portuguese} in European Portuguese at medium speed`}
                  data-portuguese-voice-managed="true"
                  className={`rounded-xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean ${
                    needsPractice
                      ? "border-portugalRed/20 bg-portugalRed/5 hover:border-portugalRed/50"
                      : "border-portugalGreen/20 bg-portugalGreen/5 hover:border-portugalGreen/50"
                  }`}
                >
                  <span className="block text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink/45">
                    Portuguese · Hear at medium speed
                  </span>
                  <span
                    lang="pt-PT"
                    className={`mt-1 block font-display text-base font-bold ${needsPractice ? "text-portugalRed" : "text-portugalGreen"}`}
                  >
                    {phrase.portuguese}
                  </span>
                </button>
                <div className="rounded-xl border border-ocean/10 bg-sand/60 p-3">
                  <span className="block text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink/45">English</span>
                  <span className="mt-1 block font-display text-base font-bold text-ink">{phrase.english}</span>
                </div>
              </div>
            ) : (
              <>
                <p className="mt-1.5 text-sm leading-5 text-ink/60">{answer.prompt}</p>
                <p className={`mt-1.5 font-display text-base font-bold ${needsPractice ? "text-portugalRed" : "text-portugalGreen"}`}>
                  {answer.correctAnswer}
                </p>
              </>
            )}
            {needsPractice ? (
              <p className="mt-1 text-xs text-ink/50">Your answer: {answer.learnerAnswer || "No answer"}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function StudentProgressDashboard({ progress, subscriptionStatus }: StudentProgressDashboardProps) {
  const [openReview, setOpenReview] = useState<"correct" | "practice" | null>(null);
  const reviewPanelsRef = useRef<HTMLDivElement>(null);
  const answers = getAnswerReview(progress);
  const startPassed = lessons.every((lesson) => progress.completedLessons[lesson.slug]?.completed === true);
  const learningLevel = subscriptionStatus === "active" && startPassed ? "STURDY" : "START";
  const masteryScore = calculateCourseMastery(progress, lessons.map((lesson) => lesson.slug)).score;
  useEffect(() => {
    if (!openReview) return;

    const closeWhenClickingAway = (event: PointerEvent) => {
      if (!reviewPanelsRef.current?.contains(event.target as Node)) {
        setOpenReview(null);
      }
    };

    document.addEventListener("pointerdown", closeWhenClickingAway);
    return () => document.removeEventListener("pointerdown", closeWhenClickingAway);
  }, [openReview]);

  return (
    <section
      id="learning-dashboard"
      className="mx-auto w-full max-w-5xl scroll-mt-6 overflow-hidden rounded-[2rem] border border-[#E7D1B6] bg-[#F8E7D4] p-4 shadow-soft sm:p-5"
      aria-labelledby="student-progress-heading"
    >
      <div>
        <h2 id="student-progress-heading" className="font-display text-2xl font-bold sm:text-3xl">
          DASHBOARD
        </h2>
        <div
          className="mt-3 inline-flex rounded-full bg-portugalGreen px-5 py-3 text-white"
          aria-label={`Current learning level: ${learningLevel}`}
        >
          <p className="font-display text-lg font-bold leading-none sm:text-xl">{learningLevel}</p>
        </div>
      </div>

      <div className="mt-4" aria-label={`Learning progress: ${masteryScore} out of 100`}>
        <div className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-ink/70">
          <span>Progress</span>
          <span>{masteryScore}/100</span>
        </div>
        <div
          className="h-3 overflow-hidden rounded-full bg-white/80"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={masteryScore}
        >
          <div
            className="h-full rounded-full bg-portugalGreen transition-[width] duration-500"
            style={{ width: `${masteryScore}%` }}
          />
        </div>
      </div>

      <div ref={reviewPanelsRef} className="mt-4 grid items-start gap-3 md:grid-cols-2">
        <div className="rounded-[1.5rem] border border-portugalGreen/15 bg-portugalGreen/5 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3>
                <button
                  type="button"
                  aria-expanded={openReview === "correct"}
                  aria-controls="correct-answers-list"
                  onClick={() => setOpenReview((current) => current === "correct" ? null : "correct")}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-portugalGreen px-5 py-2 font-display text-lg font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portugalGreen"
                >
                  Correct answers
                  <span aria-hidden="true">{openReview === "correct" ? "↑" : "↓"}</span>
                </button>
              </h3>
            </div>
          </div>
          {openReview === "correct" ? (
            <div id="correct-answers-list" aria-label="Words and sentences answered correctly">
              <AnswerList answers={answers.correct} emptyMessage="Correct answers will appear here as you complete the activities." />
            </div>
          ) : null}
        </div>

        <div className="rounded-[1.5rem] border border-portugalRed/15 bg-portugalRed/5 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3>
                <button
                  type="button"
                  aria-expanded={openReview === "practice"}
                  aria-controls="needs-practice-list"
                  onClick={() => setOpenReview((current) => current === "practice" ? null : "practice")}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#F8E7D4] px-5 py-2 font-display text-lg font-bold text-black shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F1D7BB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                  Try again
                  <span aria-hidden="true">{openReview === "practice" ? "↑" : "↓"}</span>
                </button>
              </h3>
            </div>
          </div>
          {openReview === "practice" ? (
            <div id="needs-practice-list" aria-label="Words and sentences to practise">
              <AnswerList
                answers={answers.needsPractice}
                needsPractice
                emptyMessage="Any words or sentences you miss will appear here with the correct answer."
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function ConnectedStudentProgressDashboard() {
  const { progress, subscriptionStatus } = useProgressState();
  return <StudentProgressDashboard progress={progress} subscriptionStatus={subscriptionStatus} />;
}
