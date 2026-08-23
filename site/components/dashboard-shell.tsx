"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { AvatarChoice } from "@/components/avatar-choice";
import { CoreWordMatch } from "@/components/greeting-word-match";
import { GreetingResponseGuide } from "@/components/greeting-response-guide";
import { GreetingVocabularyGuide } from "@/components/greeting-vocabulary-guide";
import { NumbersInSentences } from "@/components/numbers-in-sentences";
import { StudentProgressDashboard } from "@/components/student-progress-dashboard";
import { lessons, type CategoryLesson } from "@/lib/lesson-data";
import { markAnswerAttempt, markPracticeActivity, useProgressState } from "@/lib/storage";

const coreMatchLabels: Record<
  CategoryLesson["slug"],
  { coreLabel: string; itemLabel: string; objective: string }
> = {
  greetings: {
    coreLabel: "10 Core greeting words",
    itemLabel: "greeting phrases",
    objective: "Match the words"
  },
  numbers: {
    coreLabel: "10 Core number words",
    itemLabel: "number words",
    objective: "Match the number words"
  },
  food: {
    coreLabel: "10 Core food words",
    itemLabel: "food words and phrases",
    objective: "Match food words and phrases"
  },
  travel: {
    coreLabel: "10 Core travel phrases",
    itemLabel: "travel phrases",
    objective: "Match travel words and phrases"
  }
};

export function DashboardShell() {
  const { progress, setProgress, ready } = useProgressState();
  const [openLesson, setOpenLesson] = useState<CategoryLesson["slug"] | "greeting-responses" | "numbers-in-sentences" | null>(null);
  const lessonListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openLesson) return;

    const closeWhenClickingAway = (event: PointerEvent) => {
      if (!lessonListRef.current?.contains(event.target as Node)) {
        setOpenLesson(null);
      }
    };

    document.addEventListener("pointerdown", closeWhenClickingAway);
    return () => document.removeEventListener("pointerdown", closeWhenClickingAway);
  }, [openLesson]);

  return (
    <main className="page-shell">
      <div className="mb-6 flex items-center justify-end gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/account"
            className="hidden rounded-full border border-ocean/15 bg-white px-4 py-2.5 text-sm font-semibold text-ocean transition hover:border-ocean/35 hover:text-ink sm:inline-flex"
          >
            Subscriber&apos;s log in
          </Link>
        </div>
      </div>

      <div className="mb-6 grid items-start gap-6 lg:grid-cols-2">
        <section className="hero-panel relative aspect-[5/2] w-full overflow-hidden rounded-[2.25rem]">
          <Image
            src="/portulgiza-community-banner-v2.png"
            alt="Inês and Tiago learning with older and younger people from diverse backgrounds in Portugal"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center"
          />
        </section>

        <section className="card-surface p-5 sm:p-6" aria-label="Course pathway">
        <div className="mb-5">
          <p className="eyebrow">Course pathway</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3" aria-label="Course levels">
          <Link
            href="/lesson/greetings"
            className="rounded-[1.5rem] border border-portugalGreen/20 bg-portugalGreen/10 p-4 transition hover:-translate-y-0.5 hover:border-portugalGreen/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portugalGreen"
          >
            <span className="inline-flex rounded-full bg-portugalGreen px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white">
              Start
            </span>
          </Link>
          <Link
            href="/lesson/greetings?level=Intermediate#translate-crisis-game"
            className="rounded-[1.5rem] border border-portugalBlue/20 bg-portugalBlue/5 p-4 transition hover:-translate-y-0.5 hover:border-portugalBlue/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portugalBlue"
          >
            <span className="inline-flex rounded-full bg-portugalBlue px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white">
              Smooth
            </span>
            <p className="mt-3 text-sm font-semibold text-portugalBlue">Unlocks after START</p>
          </Link>
          <Link
            href="/lesson/greetings?level=Advanced#translate-crisis-game"
            className="rounded-[1.5rem] border border-portugalRed/20 bg-portugalRed/5 p-4 transition hover:-translate-y-0.5 hover:border-portugalRed/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portugalRed"
          >
            <span className="inline-flex rounded-full bg-portugalRed px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white">
              STURDY
            </span>
            <p className="mt-3 text-sm font-semibold text-portugalRed">Unlocks after SMOOTH</p>
          </Link>
        </div>
        <p className="mt-3 text-xs text-muted">Each level must be completed before another level opens.</p>
        </section>
      </div>

      <div className="mb-6">
        <AvatarChoice />
      </div>

      <StudentProgressDashboard progress={progress} ready={ready} />

      <section className="card-surface mt-6 p-5 sm:p-7" aria-labelledby="daily-recall-heading">
        <h2 id="daily-recall-heading" className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Daily learning catch-ups
        </h2>
        <p className="mt-4 max-w-5xl leading-7 text-ink/65">Daily learning catch-ups will be emailed to you.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2" aria-label="Daily learning catch-up preference">
          <Link
            href="/sign-up?reminder=yes#daily-learning-preference"
            className="flex items-center gap-3 rounded-2xl border border-portugalGreen/30 bg-portugalGreen/5 p-4 font-semibold text-portugalGreen transition hover:border-portugalGreen hover:bg-portugalGreen/10"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded border border-portugalGreen" aria-hidden="true" />
            Opt in
          </Link>
          <Link
            href="/sign-up?reminder=no#daily-learning-preference"
            className="flex items-center gap-3 rounded-2xl border border-ocean/20 bg-white p-4 font-semibold text-ocean transition hover:border-ocean hover:bg-sky/10"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded border border-ocean/40" aria-hidden="true" />
            Opt out
          </Link>
        </div>
      </section>

      <section id="learn" className="mt-14 scroll-mt-6 pb-6">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-portugalGreen sm:text-5xl">Start</h2>
          </div>
        </div>

        <div ref={lessonListRef} className="grid gap-3">
          {lessons.map((lesson) => {
            const labels = coreMatchLabels[lesson.slug];
            const expanded = openLesson === lesson.slug;
            const panelId = `start-here-${lesson.slug}-lesson`;
            return (
              <Fragment key={lesson.slug}>
              <div className="overflow-hidden rounded-[1.75rem] border border-portugalGreen/20 bg-white/90 shadow-soft">
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => setOpenLesson((current) => current === lesson.slug ? null : lesson.slug)}
                  className="flex min-h-20 w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-portugalGreen/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-portugalGreen sm:px-6"
                >
                  <span>
                    <span className="block font-display text-2xl font-bold text-ink sm:text-3xl">
                      {lesson.title}{lesson.slug === "greetings" ? (
                        <span className="mt-1 block text-portugalGreen">Match the words</span>
                      ) : (
                        <>: <span className="text-portugalGreen">{labels.objective}</span></>
                      )}
                    </span>
                    {lesson.slug === "greetings" ? null : <span className="mt-1 block text-sm text-ink/55">{labels.coreLabel}</span>}
                  </span>
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border border-portugalGreen/20 bg-portugalGreen/10 text-xl font-bold text-portugalGreen transition-transform ${expanded ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  >
                    ↓
                  </span>
                </button>

                {expanded ? (
                  <div id={panelId} className="border-t border-portugalGreen/15 bg-sand/20 p-2 sm:p-3">
                    <CoreWordMatch
                      phrases={lesson.phrases}
                      lessonSlug={lesson.slug}
                      title={lesson.title}
                      coreLabel={labels.coreLabel}
                      itemLabel={labels.itemLabel}
                      showLessonHeading={false}
                      onAttempt={(phrase, learnerAnswer, correct) => setProgress((current) => markAnswerAttempt(current, {
                        lessonSlug: lesson.slug,
                        activity: "flashcard",
                        prompt: `Match “${phrase.portuguese}” to its English meaning.`,
                        correctAnswer: phrase.english,
                        learnerAnswer,
                        correct
                      }))}
                      onComplete={() => setProgress((current) => markPracticeActivity(current, lesson.slug, "flashcards"))}
                    />
                  </div>
                ) : null}
              </div>
              {lesson.slug === "greetings" ? (
                <GreetingVocabularyGuide />
              ) : null}
              {lesson.slug === "greetings" ? (
                <div className="overflow-hidden rounded-[1.75rem] border border-portugalGreen/20 bg-white/90 shadow-soft">
                  <button
                    type="button"
                    aria-expanded={openLesson === "greeting-responses"}
                    aria-controls="start-here-greeting-responses"
                    onClick={() => setOpenLesson((current) => current === "greeting-responses" ? null : "greeting-responses")}
                    className="flex min-h-20 w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-portugalGreen/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-portugalGreen sm:px-6"
                  >
                    <span className="font-display text-2xl font-bold text-portugalGreen sm:text-3xl">Reply to Greetings</span>
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border border-portugalGreen/20 bg-portugalGreen/10 text-xl font-bold text-portugalGreen transition-transform ${openLesson === "greeting-responses" ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    >
                      ↓
                    </span>
                  </button>
                  {openLesson === "greeting-responses" ? (
                    <div id="start-here-greeting-responses" className="border-t border-portugalGreen/15 bg-sand/20 p-2 sm:p-3">
                      <GreetingResponseGuide />
                    </div>
                  ) : null}
                </div>
              ) : null}
              {lesson.slug === "numbers" ? (
                <div className="overflow-hidden rounded-[1.75rem] border border-portugalGreen/20 bg-white/90 shadow-soft">
                  <button
                    type="button"
                    aria-expanded={openLesson === "numbers-in-sentences"}
                    aria-controls="start-here-numbers-in-sentences"
                    onClick={() => setOpenLesson((current) => current === "numbers-in-sentences" ? null : "numbers-in-sentences")}
                    className="flex min-h-20 w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-portugalGreen/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-portugalGreen sm:px-6"
                  >
                    <span className="font-display text-2xl font-bold text-portugalGreen sm:text-3xl">Numbers in sentences</span>
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border border-portugalGreen/20 bg-portugalGreen/10 text-xl font-bold text-portugalGreen transition-transform ${openLesson === "numbers-in-sentences" ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    >
                      ↓
                    </span>
                  </button>
                  {openLesson === "numbers-in-sentences" ? (
                    <div id="start-here-numbers-in-sentences" className="border-t border-portugalGreen/15 bg-sand/20 p-2 sm:p-3">
                      <NumbersInSentences
                        onAttempt={(question, learnerAnswer, correct) => setProgress((current) => markAnswerAttempt(current, {
                          lessonSlug: "numbers",
                          activity: "sentenceBuilder",
                          prompt: question.prompt,
                          correctAnswer: question.answer,
                          learnerAnswer,
                          correct
                        }))}
                        onComplete={() => setProgress((current) => markPracticeActivity(current, "numbers", "phraseBuilder"))}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
              </Fragment>
            );
          })}
        </div>
      </section>
    </main>
  );
}
