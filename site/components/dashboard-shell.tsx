"use client";

import Link from "next/link";
import { ProgressStrip } from "@/components/progress-strip";
import { lessons } from "@/lib/lesson-data";
import { useProgressState } from "@/lib/storage";

export function DashboardShell() {
  const { progress, setProgress, ready } = useProgressState();
  const completedCount = Object.values(progress.completedLessons).filter((lesson) => lesson.completed).length;
  const totalBestScore = Object.values(progress.completedLessons).reduce((total, lesson) => total + lesson.bestScore, 0);
  const overallScore = completedCount === 0 ? 0 : Math.round(totalBestScore / completedCount);

  return (
    <main className="page-shell">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card-surface overflow-hidden p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-pine/55">European Portuguese</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Build your first Portuguese phrases with calm, daily practice.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink/72 sm:text-lg">
            Learn useful European Portuguese through audio, flashcards, conversation practice, and quick
            quizzes designed for total beginners.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-pine p-5 text-white">
              <p className="text-sm text-white/70">Current streak</p>
              <p className="mt-2 text-3xl font-semibold">{ready ? progress.streak : "--"} days</p>
            </div>
            <div className="rounded-3xl bg-moss p-5">
              <p className="text-sm text-ink/60">Lessons completed</p>
              <p className="mt-2 text-3xl font-semibold">{completedCount}/4</p>
            </div>
            <div className="rounded-3xl bg-white p-5">
              <p className="text-sm text-ink/60">Average quiz score</p>
              <p className="mt-2 text-3xl font-semibold">{overallScore}%</p>
            </div>
          </div>
        </div>

        <aside className="card-surface p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-pine/60">Daily rhythm</p>
          <h2 className="mt-2 text-2xl font-semibold">Keep momentum</h2>
          <div className="mt-6 space-y-5">
            <ProgressStrip value={ready ? progress.lessonsToday : 0} max={ready ? progress.dailyGoal : 2} label="Daily goal" />

            <div className="rounded-3xl bg-white p-4">
              <p className="text-sm text-ink/60">Goal setting</p>
              <div className="mt-3 flex gap-2">
                {[1, 2, 3].map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setProgress((current) => ({ ...current, dailyGoal: goal }))}
                    className={`rounded-full px-4 py-2 text-sm font-medium ${
                      progress.dailyGoal === goal ? "bg-pine text-white" : "bg-moss text-pine"
                    }`}
                  >
                    {goal} lesson{goal > 1 ? "s" : ""}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-4">
              <p className="text-sm text-ink/60">Today&apos;s nudge</p>
              <p className="mt-2 text-base leading-7 text-ink/72">
                A short 10-minute session is enough. Tap any category below and complete the quiz to count it
                toward today&apos;s goal.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="mt-8">
        <div className="mb-5">
          <p className="text-sm uppercase tracking-[0.2em] text-pine/60">Categories</p>
          <h2 className="text-3xl font-semibold">Choose a beginner lesson</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {lessons.map((lesson) => {
            const lessonProgress = progress.completedLessons[lesson.slug];
            return (
              <Link key={lesson.slug} href={`/lesson/${lesson.slug}`} className="card-surface group p-5 transition hover:-translate-y-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-pine/55">{lesson.subtitle}</p>
                    <h3 className="mt-2 text-2xl font-semibold">{lesson.title}</h3>
                  </div>
                  <div className="rounded-full bg-moss px-3 py-1 text-sm font-medium text-pine">
                    {lessonProgress?.completed ? `${lessonProgress.bestScore}%` : "New"}
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-ink/70">{lesson.description}</p>
                <div className="mt-6 flex items-center justify-between text-sm text-pine">
                  <span>{lesson.phrases.length} core phrases</span>
                  <span className="font-semibold transition group-hover:translate-x-1">Open</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
