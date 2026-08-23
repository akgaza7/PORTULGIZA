"use client";

import { useEffect, useRef, useState } from "react";
import { ProgressStrip } from "@/components/progress-strip";
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
  ready: boolean;
};

const activityLabels: Record<LearningAnswer["activity"], string> = {
  quiz: "Quiz",
  sentenceBuilder: "Sentence",
  listening: "Listening",
  crisisGame: "Tourist challenge",
  flashcard: "Flashcard",
  roleplay: "Character role-play"
};

function findAnswerPhrase(answer: LearningAnswer) {
  const correctAnswer = answer.correctAnswer.trim().toLocaleLowerCase("pt-PT");
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

  const lesson = lessons.find((candidate) => candidate.slug === answer.lessonSlug);
  if (!lesson) return null;

  const prompt = answer.prompt.toLocaleLowerCase("pt-PT");

  return lesson.phrases.find((phrase) => {
    const portuguese = phrase.portuguese.trim().toLocaleLowerCase("pt-PT");
    const english = phrase.english.trim().toLocaleLowerCase("pt-PT");

    return correctAnswer === portuguese || correctAnswer === english || prompt.includes(portuguese);
  }) ?? null;
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
                    voiceGender: avatar === "female" ? "feminine" : "masculine",
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

export function StudentProgressDashboard({ progress, ready }: StudentProgressDashboardProps) {
  const [openReview, setOpenReview] = useState<"correct" | "practice" | null>(null);
  const reviewPanelsRef = useRef<HTMLDivElement>(null);
  const mastery = calculateCourseMastery(progress, lessons.map((lesson) => lesson.slug));
  const answers = getAnswerReview(progress);
  const reviewedAnswers = [...answers.correct, ...answers.needsPractice];
  const matchingScores = lessons.flatMap((lesson) => {
    const lessonMatches = reviewedAnswers.filter(
      (answer) => answer.lessonSlug === lesson.slug && answer.activity === "flashcard" && answer.prompt.startsWith("Match “")
    );

    return lessonMatches.length
      ? [{
          lessonTitle: lesson.title,
          correct: lessonMatches.filter((answer) => answer.correct).length,
          total: lessonMatches.length,
          needsPractice: lessonMatches.filter((answer) => !answer.correct).length
        }]
      : [];
  });
  const hasDetailedProgress = ready && answers.correct.length + answers.needsPractice.length > 0;
  const nextLesson = lessons.find((lesson) => !progress.completedLessons[lesson.slug]?.completed) ?? lessons[0];
  const today = new Date();
  const attemptedToday = new Set(
    ready
      ? progress.answerHistory
          .filter((answer) => new Date(answer.attemptedAt).toDateString() === today.toDateString())
          .map((answer) => answer.lessonSlug)
      : []
  );
  const todayLessonTitles = lessons
    .filter((lesson) => attemptedToday.has(lesson.slug))
    .map((lesson) => lesson.title);
  const practisedLessonTitles = ready
    ? lessons
        .filter((lesson) =>
          progress.practiceByLesson[lesson.slug] ||
          progress.completedLessons[lesson.slug] ||
          progress.answerHistory.some((answer) => answer.lessonSlug === lesson.slug)
        )
        .map((lesson) => lesson.title)
    : [];
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
    <section id="learning-dashboard" className="card-surface mx-auto w-full max-w-5xl scroll-mt-6 overflow-hidden p-4 sm:p-5" aria-labelledby="student-progress-heading">
      <div className="relative -mx-4 -mt-4 mb-5 flex h-2 overflow-visible sm:-mx-5 sm:-mt-5" aria-hidden="true">
        <span className="w-2/5 bg-portugalGreen" />
        <span className="w-3/5 bg-portugalRed" />
        <span
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-portugalGold shadow-sm"
          style={{ left: "40%" }}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="student-progress-heading" className="font-display text-2xl font-bold sm:text-3xl">
            DASHBOARD
          </h2>
        </div>
        <span className="w-fit rounded-full border border-portugalGold/50 bg-portugalGold/35 px-4 py-2 text-sm font-bold text-black">
          {ready ? mastery.score : 0}/100 progress
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-[1.25rem] bg-portugalBlue p-3 text-white">
          <p className="metric-label text-white/70">Today</p>
          <p className="mt-2 font-display text-xl font-bold leading-snug">
            {todayLessonTitles.length ? todayLessonTitles.join(" · ") : "Nothing covered yet"}
          </p>
        </div>
        <div className="rounded-[1.25rem] bg-portugalGreen p-3 text-white">
          <p className="metric-label text-white/75">Practised</p>
          <p className="mt-2 font-display text-xl font-bold leading-snug">
            {practisedLessonTitles.length ? practisedLessonTitles.join(" · ") : "No lessons yet"}
          </p>
        </div>
        <div className="relative overflow-hidden rounded-[1.25rem] border border-ink/10 bg-sand/65 p-3 text-ink">
          <span className="absolute right-3 top-3 h-3 w-3 rounded-full bg-portugalGold" aria-hidden="true" />
          <p className="metric-label text-ink/65">Next lesson</p>
          <p className="mt-2 font-display text-xl font-bold leading-snug">{nextLesson.title}</p>
        </div>
      </div>

      <div className="mt-4">
        <ProgressStrip value={ready ? mastery.score : 0} max={100} label="Progresso · Progress" tone="gold" />
      </div>

      {hasDetailedProgress ? (
        <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Quiz", mastery.breakdown.quiz],
            ["Retention", mastery.breakdown.retention],
            ["Practice", mastery.breakdown.practice],
            ["Sentences", mastery.breakdown.sentenceBuilding],
            ["Completion", mastery.breakdown.completion],
            ["Consistency", mastery.breakdown.consistency]
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-sand/75 p-3">
              <p className="text-lg font-bold text-ink">{value}%</p>
              <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink/50">{label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[1.25rem] border border-portugalGreen/15 bg-portugalGreen/5 p-4 text-center">
          <p className="font-display text-xl font-bold text-ink">Your detailed progress will grow with you.</p>
          <p className="mt-1 text-sm text-ink/60">Complete your first lesson to unlock detailed progress.</p>
        </div>
      )}

      {matchingScores.length ? (
        <section className="mt-4 rounded-[1.25rem] border border-portugalGold/35 bg-portugalGold/10 p-4" aria-labelledby="matching-scores-heading">
          <p id="matching-scores-heading" className="text-xs font-bold uppercase tracking-[0.16em] text-ink/60">
            First-attempt word matching
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {matchingScores.map((score) => (
              <div key={score.lessonTitle} className="rounded-2xl border border-portugalGold/30 bg-white/75 px-4 py-3">
                <p className="text-xs font-semibold text-ink/55">{score.lessonTitle} matching</p>
                <p className="mt-1 font-display text-2xl font-bold text-ink">{score.correct}/{score.total}</p>
                <p className="mt-1 text-xs font-semibold text-portugalRed">
                  {score.needsPractice} {score.needsPractice === 1 ? "word" : "words"} to practise
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div ref={reviewPanelsRef} className="mt-4 grid items-start gap-3 md:grid-cols-2">
        <div className="rounded-[1.5rem] border border-portugalGreen/15 bg-portugalGreen/5 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-portugalGreen">Correct answers</p>
              <h3 className="mt-2">
                <button
                  type="button"
                  aria-expanded={openReview === "correct"}
                  aria-controls="correct-answers-list"
                  onClick={() => setOpenReview((current) => current === "correct" ? null : "correct")}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-portugalGreen px-5 py-2 font-display text-lg font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portugalGreen"
                >
                  Review correct answers
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
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-portugalRed">Needs practice</p>
              <h3 className="mt-2">
                <button
                  type="button"
                  aria-expanded={openReview === "practice"}
                  aria-controls="needs-practice-list"
                  onClick={() => setOpenReview((current) => current === "practice" ? null : "practice")}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-portugalRed px-5 py-2 font-display text-lg font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portugalRed"
                >
                  Practise weak areas
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
  const { progress, ready } = useProgressState();
  return <StudentProgressDashboard progress={progress} ready={ready} />;
}
