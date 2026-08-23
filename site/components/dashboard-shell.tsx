"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AvatarChoice } from "@/components/avatar-choice";
import { CoreWordMatch } from "@/components/greeting-word-match";
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
  const [openLesson, setOpenLesson] = useState<CategoryLesson["slug"] | null>(null);
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
      <header className="mb-6 flex items-center justify-between gap-4 rounded-full border border-[#F8E7D4] bg-[#F8E7D4] px-4 py-3 shadow-soft sm:px-5">
        <Link href="/" className="group block" aria-label="Portulgiza home">
          <Image
            src="/portulgiza-logo-v2.png"
            alt="Portulgiza — European Portuguese Language Learning App"
            width={1946}
            height={808}
            priority
            sizes="(max-width: 640px) 224px, (max-width: 1024px) 288px, 320px"
            className="h-auto w-56 transition group-hover:scale-[1.01] sm:w-72 lg:w-80"
          />
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-sm text-ink/60 md:flex">
            <span className="h-2 w-2 rounded-full bg-clay" />
            <span>
              {ready
                ? progress.streak === 0
                  ? "Not started"
                  : progress.streak === 1
                    ? "Started today"
                    : `${progress.streak}-day streak`
                : "–"}
            </span>
          </div>
          <Link
            href="/account"
            className="hidden rounded-full border border-ocean/15 bg-white px-4 py-2.5 text-sm font-semibold text-ocean transition hover:border-ocean/35 hover:text-ink sm:inline-flex"
          >
            Subscriber&apos;s log in
          </Link>
        </div>
      </header>

      <section className="hero-panel relative mx-auto mb-6 aspect-[5/2] w-full overflow-hidden rounded-[2.25rem] sm:w-3/4 lg:w-1/2 xl:w-1/4">
        <Image
          src="/portulgiza-community-banner-v2.png"
          alt="Inês and Tiago learning with older and younger people from diverse backgrounds in Portugal"
          fill
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 75vw, (max-width: 1280px) 50vw, 25vw"
          className="object-cover object-center"
        />
      </section>

      <section className="card-surface mb-6 p-5 sm:p-6" aria-label="Course pathway">
        <div className="mb-5">
          <p className="eyebrow">Course pathway</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3" aria-label="Course levels">
          <Link
            href="/lesson/greetings"
            className="rounded-[1.5rem] border border-portugalGreen/20 bg-portugalGreen/10 p-4 transition hover:-translate-y-0.5 hover:border-portugalGreen/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portugalGreen"
          >
            <span className="inline-flex rounded-full bg-portugalGreen px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white">
              Start Here
            </span>
            <p className="mt-3 text-sm font-semibold text-portugalGreen">Active learning level</p>
            <span className="mt-3 inline-flex text-xs font-bold uppercase tracking-[0.12em] text-portugalGreen">Open Start Here →</span>
          </Link>
          <Link
            href="/lesson/greetings?level=Intermediate#translate-crisis-game"
            className="rounded-[1.5rem] border border-portugalBlue/20 bg-portugalBlue/5 p-4 transition hover:-translate-y-0.5 hover:border-portugalBlue/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portugalBlue"
          >
            <span className="inline-flex rounded-full bg-portugalBlue px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white">
              Smooth
            </span>
            <p className="mt-3 text-sm font-semibold text-portugalBlue">Unlocks after Start Here</p>
            <span className="mt-3 inline-flex text-xs font-bold uppercase tracking-[0.12em] text-portugalBlue">Open Smooth →</span>
          </Link>
          <Link
            href="/lesson/greetings?level=Advanced#translate-crisis-game"
            className="rounded-[1.5rem] border border-portugalRed/20 bg-portugalRed/5 p-4 transition hover:-translate-y-0.5 hover:border-portugalRed/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portugalRed"
          >
            <span className="inline-flex rounded-full bg-portugalRed px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white">
              Sturdy
            </span>
            <p className="mt-3 text-sm font-semibold text-portugalRed">Unlocks after Smooth</p>
            <span className="mt-3 inline-flex text-xs font-bold uppercase tracking-[0.12em] text-portugalRed">Open Sturdy →</span>
          </Link>
        </div>
      </section>

      <div className="mb-6">
        <AvatarChoice />
      </div>

      <StudentProgressDashboard progress={progress} ready={ready} />

      <section className="card-surface mt-6 p-5 sm:p-7" aria-labelledby="daily-recall-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="daily-recall-heading" className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Your daily recall
          </h2>
          <button
            type="button"
            disabled
            className="w-fit cursor-not-allowed rounded-full bg-portugalGold/30 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-ink/70"
          >
            Delivery setup in progress
          </button>
        </div>
        <p className="mt-4 max-w-5xl leading-7 text-ink/65">
          Subscribers will receive one Portuguese-only prompt each day. Portulgiza will repeat phrases you answered incorrectly first, then revisit other phrases you have already learned—never unfamiliar words.
        </p>
        <p className="mt-3 text-sm font-semibold leading-6 text-portugalGreen">
          Trial customers can receive this by email for 14 days. It continues while a paid subscription is active and can be switched off at any time.
        </p>
      </section>

      <section id="learn" className="mt-14 scroll-mt-6 pb-6">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Start Here lessons</p>
            <h2 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">Start</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-ink/50 sm:text-right">
            Each lesson combines useful phrases, functional visual links, listening, and a quick confidence check.
          </p>
        </div>

        <div ref={lessonListRef} className="grid gap-3">
          {lessons.map((lesson) => {
            const labels = coreMatchLabels[lesson.slug];
            const expanded = openLesson === lesson.slug;
            const panelId = `start-here-${lesson.slug}-lesson`;
            return (
              <div key={lesson.slug} className="overflow-hidden rounded-[1.75rem] border border-portugalGreen/20 bg-white/90 shadow-soft">
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => setOpenLesson((current) => current === lesson.slug ? null : lesson.slug)}
                  className="flex min-h-20 w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-portugalGreen/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-portugalGreen sm:px-6"
                >
                  <span>
                    <span className="block font-display text-2xl font-bold text-ink sm:text-3xl">
                      {lesson.title}: <span className="text-portugalGreen">{labels.objective}</span>
                    </span>
                    <span className="mt-1 block text-sm text-ink/55">{labels.coreLabel}</span>
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
            );
          })}
        </div>
      </section>
    </main>
  );
}
