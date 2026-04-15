"use client";

import Link from "next/link";
import { ConversationPractice } from "@/components/conversation-practice";
import { Flashcards } from "@/components/flashcards";
import { ProgressStrip } from "@/components/progress-strip";
import { QuizPanel } from "@/components/quiz-panel";
import { SpeechButton } from "@/components/speech-button";
import type { CategoryLesson } from "@/lib/lesson-data";
import { markLessonActivity, useProgressState } from "@/lib/storage";

type LessonScreenProps = {
  lesson: CategoryLesson;
};

export function LessonScreen({ lesson }: LessonScreenProps) {
  const { progress, setProgress, ready } = useProgressState();
  const completedLessons = Object.values(progress.completedLessons).filter((entry) => entry.completed).length;

  const handleQuizComplete = (score: number) => {
    const percentage = Math.round((score / lesson.quiz.length) * 100);
    setProgress((current) => markLessonActivity(current, lesson.slug, percentage));
  };

  return (
    <main className="page-shell">
      <Link href="/" className="text-sm font-medium text-pine">
        ← Back to home
      </Link>

      <section className="mt-4 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="card-surface p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-pine/55">{lesson.subtitle}</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-4xl font-semibold">{lesson.title}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-ink/72">{lesson.description}</p>
            </div>
            <div className="rounded-3xl bg-moss px-4 py-3 text-sm text-pine">
              <p className="font-semibold">Accent note</p>
              <p className="mt-1 max-w-xs text-ink/72">{lesson.accentHint}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-white p-4">
              <p className="text-sm text-ink/60">Lesson phrases</p>
              <p className="mt-2 text-3xl font-semibold">{lesson.phrases.length}</p>
            </div>
            <div className="rounded-3xl bg-pine p-4 text-white">
              <p className="text-sm text-white/65">Streak</p>
              <p className="mt-2 text-3xl font-semibold">{ready ? progress.streak : "--"} days</p>
            </div>
            <div className="rounded-3xl bg-white p-4">
              <p className="text-sm text-ink/60">Best score</p>
              <p className="mt-2 text-3xl font-semibold">{progress.completedLessons[lesson.slug]?.bestScore ?? 0}%</p>
            </div>
          </div>
        </div>

        <aside className="card-surface p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-pine/60">Your progress</p>
          <h2 className="mt-2 text-2xl font-semibold">Stay on track</h2>
          <div className="mt-6 space-y-5">
            <ProgressStrip value={completedLessons} max={4} label="Course progress" />
            <ProgressStrip
              value={progress.completedLessons[lesson.slug]?.completed ? 4 : 1}
              max={4}
              label="This lesson"
            />
            <div className="rounded-3xl bg-white p-4">
              <p className="text-sm text-ink/60">Daily goal</p>
              <p className="mt-2 text-lg font-semibold">
                {progress.lessonsToday}/{progress.dailyGoal} lessons today
              </p>
            </div>
            <div className="rounded-3xl bg-moss p-4">
              <p className="text-sm text-ink/60">Score tracker</p>
              <p className="mt-2 text-lg font-semibold">
                {progress.completedLessons[lesson.slug]?.bestScore
                  ? `${progress.completedLessons[lesson.slug]?.bestScore}% best score`
                  : "Finish the quiz to log your score"}
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="mt-8 card-surface p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-pine/60">Core phrases</p>
            <h2 className="text-2xl font-semibold">Listen and repeat</h2>
          </div>
          <div className="rounded-full bg-moss px-4 py-2 text-sm font-medium text-pine">
            Beginner-friendly European Portuguese
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {lesson.phrases.map((phrase) => (
            <article key={phrase.portuguese} className="rounded-[2rem] bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold">{phrase.portuguese}</h3>
                  <p className="mt-2 text-base text-ink/70">{phrase.english}</p>
                </div>
                <SpeechButton text={phrase.portuguese} />
              </div>
              <p className="mt-4 text-sm leading-7 text-ink/65">{phrase.tip}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-8">
        <Flashcards phrases={lesson.phrases} />
        <ConversationPractice conversation={lesson.conversation} />
        <QuizPanel questions={lesson.quiz} onComplete={handleQuizComplete} />
      </div>
    </main>
  );
}
