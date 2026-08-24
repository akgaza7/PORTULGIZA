"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useState } from "react";
import { CoreWordMatch } from "@/components/greeting-word-match";
import { FoodConversationGuide } from "@/components/food-conversation-guide";
import { GreetingResponseGuide } from "@/components/greeting-response-guide";
import { GreetingVocabularyGuide } from "@/components/greeting-vocabulary-guide";
import { NumbersInSentences } from "@/components/numbers-in-sentences";
import { StudentProgressDashboard } from "@/components/student-progress-dashboard";
import { getLearningAccess } from "@/lib/learning-access";
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
  const { progress, setProgress, ready, subscriptionStatus, trialEndsAt } = useProgressState();
  const [openLesson, setOpenLesson] = useState<CategoryLesson["slug"] | "greeting-responses" | "food-conversations" | "numbers-in-sentences" | null>(null);
  const access = getLearningAccess(progress, subscriptionStatus, trialEndsAt);

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

        <section className="card-surface p-5 sm:p-6" aria-label="Lessons">
        <div className="mb-5">
          <p className="eyebrow text-[0.8175rem]">Lessons</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3" aria-label="Course levels">
          {access.canAccessStart ? (
            <Link
              href="/#learn"
              aria-label="Open the START lesson plan"
              className="rounded-[1.5rem] border border-portugalGreen bg-portugalGreen p-4 text-white transition hover:-translate-y-0.5 hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portugalGreen"
            >
              <span className="text-[0.8175rem] font-bold uppercase tracking-[0.14em] text-white">START</span>
              <p className="mt-3 text-sm font-semibold text-white">14-day trial — no card required</p>
            </Link>
          ) : (
            <Link
              href="/sign-up"
              className="rounded-[1.5rem] border border-portugalGreen bg-portugalGreen p-4 text-white transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portugalGreen"
            >
              <span className="flex items-center justify-between gap-2 text-[0.8175rem] font-bold uppercase tracking-[0.14em] text-white">
                START <span aria-hidden="true">🔒</span>
              </span>
              <p className="mt-3 text-sm font-semibold text-white">14-day trial — no card required</p>
            </Link>
          )}
          {access.canAccessSmooth ? (
            <Link
              href="/lesson/greetings?level=Intermediate#translate-crisis-game"
              aria-label="Open the SMOOTH lesson plan"
              className="rounded-[1.5rem] border border-portugalBlue bg-portugalBlue p-4 text-white transition hover:-translate-y-0.5 hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portugalBlue"
            >
              <span className="text-[0.8175rem] font-bold uppercase tracking-[0.14em] text-white">SMOOTH</span>
            </Link>
          ) : (
            <div aria-disabled="true" className="cursor-not-allowed rounded-[1.5rem] border border-portugalBlue bg-portugalBlue p-4 text-white">
              <span className="flex items-center justify-between gap-2 text-[0.8175rem] font-bold uppercase tracking-[0.14em] text-white">
                SMOOTH <span aria-hidden="true">🔒</span>
              </span>
            </div>
          )}
          {access.canAccessSturdy ? (
            <Link
              href="/lesson/greetings?level=Advanced#translate-crisis-game"
              aria-label="Open the STURDY lesson plan"
              className="rounded-[1.5rem] border border-portugalGold bg-portugalGold p-4 text-black transition hover:-translate-y-0.5 hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portugalGold"
            >
              <span className="inline-flex rounded-full border border-black/15 bg-white/30 px-3 py-1 text-[0.8175rem] font-bold uppercase tracking-[0.14em] text-black">STURDY</span>
            </Link>
          ) : (
            <div aria-disabled="true" className="cursor-not-allowed rounded-[1.5rem] border border-portugalGold bg-portugalGold p-4 text-black opacity-60">
              <span className="flex items-center justify-between gap-2 text-[0.8175rem] font-bold uppercase tracking-[0.14em] text-black">
                STURDY <span aria-hidden="true">🔒</span>
              </span>
            </div>
          )}
        </div>
        <p className="mt-3 text-sm text-ink/70">When you subscribe all lessons will be available.</p>
        </section>
      </div>

      {ready && access.canAccessStart ? (
      <section id="learn" className="mt-6 scroll-mt-6 pb-6">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-portugalGreen sm:text-5xl">START</h2>
            <p className="mt-2 text-sm text-ink/65 sm:text-base">
              The lessons will involve you matching the correct words or numbers.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {lessons.map((lesson) => {
            const labels = coreMatchLabels[lesson.slug];
            const expanded = openLesson === lesson.slug;
            const panelId = `start-here-${lesson.slug}-lesson`;
            return (
              <Fragment key={lesson.slug}>
              <div className={`overflow-hidden rounded-[1.75rem] border border-portugalGreen/20 bg-white/90 shadow-soft transition-[width] ${expanded ? "w-full" : "w-full sm:w-[42%]"}`}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => setOpenLesson((current) => current === lesson.slug ? null : lesson.slug)}
                  className="flex min-h-20 w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-portugalGreen/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-portugalGreen sm:px-6"
                >
                  <span>
                    <span className="block font-display text-2xl font-bold text-ink sm:text-3xl">
                      {lesson.title}
                    </span>
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
                <div className={`overflow-hidden rounded-[1.75rem] border border-portugalGreen/20 bg-white/90 shadow-soft transition-[width] ${openLesson === "greeting-responses" ? "w-full" : "w-full sm:w-[42%]"}`}>
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
              {lesson.slug === "food" ? (
                <div className={`overflow-hidden rounded-[1.75rem] border border-portugalGreen/20 bg-white/90 shadow-soft transition-[width] ${openLesson === "food-conversations" ? "w-full" : "w-full sm:w-[42%]"}`}>
                  <button
                    type="button"
                    aria-expanded={openLesson === "food-conversations"}
                    aria-controls="start-here-food-conversations"
                    onClick={() => setOpenLesson((current) => current === "food-conversations" ? null : "food-conversations")}
                    className="flex min-h-20 w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-portugalGreen/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-portugalGreen sm:px-6"
                  >
                    <span className="font-display text-2xl font-bold text-portugalGreen sm:text-3xl">Food Conversations</span>
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border border-portugalGreen/20 bg-portugalGreen/10 text-xl font-bold text-portugalGreen transition-transform ${openLesson === "food-conversations" ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    >
                      ↓
                    </span>
                  </button>
                  {openLesson === "food-conversations" ? (
                    <div id="start-here-food-conversations" className="border-t border-portugalGreen/15 bg-sand/20 p-2 sm:p-3">
                      <FoodConversationGuide />
                    </div>
                  ) : null}
                </div>
              ) : null}
              {lesson.slug === "numbers" ? (
                <div className={`overflow-hidden rounded-[1.75rem] border border-portugalGreen/20 bg-white/90 shadow-soft transition-[width] ${openLesson === "numbers-in-sentences" ? "w-full" : "w-full sm:w-[42%]"}`}>
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
      ) : null}

      <StudentProgressDashboard progress={progress} subscriptionStatus={subscriptionStatus} />
    </main>
  );
}
