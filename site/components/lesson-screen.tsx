"use client";

import Link from "next/link";
import { Flashcards } from "@/components/flashcards";
import { GenderCoach, GenderedPhrase } from "@/components/gender-coach";
import { ListeningMatch } from "@/components/listening-match";
import { PhraseBuilder } from "@/components/phrase-builder";
import { QuizPanel } from "@/components/quiz-panel";
import { SpeechButton } from "@/components/speech-button";
import { StudentProgressDashboard } from "@/components/student-progress-dashboard";
import { SupermarketRoleplay } from "@/components/supermarket-roleplay";
import { TranslateCrisisGame } from "@/components/translate-crisis-game";
import type { CategoryLesson } from "@/lib/lesson-data";
import {
  calculateLessonProgress,
  markAnswerAttempt,
  markLessonActivity,
  markPracticeActivity,
  type PracticeActivity,
  useProgressState
} from "@/lib/storage";

type LessonScreenProps = {
  lesson: CategoryLesson;
};

const lessonColours = {
  bar: "bg-portugalGreen",
  note: "border-portugalGreen/15 bg-portugalGreen/10",
  noteTitle: "text-portugalGreen"
};

export function LessonScreen({ lesson }: LessonScreenProps) {
  const { progress, setProgress, ready } = useProgressState();
  const colours = lessonColours;
  const lessonProgress = calculateLessonProgress(progress, lesson.slug);

  const handleQuizComplete = (score: number) => {
    const percentage = Math.round((score / lesson.quiz.length) * 100);
    const passed = percentage >= 80 && Boolean(progress.practiceByLesson[lesson.slug]?.phraseBuilderCompleted);
    setProgress((current) => markLessonActivity(current, lesson.slug, percentage));
    return passed;
  };

  const handlePractice = (activity: PracticeActivity) => {
    setProgress((current) => markPracticeActivity(current, lesson.slug, activity));
  };

  const handleAnswer = (
    activity: "quiz" | "sentenceBuilder" | "listening" | "crisisGame" | "flashcard" | "roleplay",
    answer: { prompt: string; correctAnswer: string; learnerAnswer: string; correct: boolean }
  ) => {
    setProgress((current) => markAnswerAttempt(current, { lessonSlug: lesson.slug, activity, ...answer }));
  };

  return (
    <main className="page-shell learning-page">
      <Link href="/" className="text-sm font-semibold text-portugalGreen transition hover:text-ink">
        ← Back to home
      </Link>

      <div className="mt-4">
        <StudentProgressDashboard progress={progress} ready={ready} />
      </div>

      <section className="mt-6">
        <div className="card-surface relative overflow-hidden p-6 sm:p-8">
          <div className={`absolute inset-x-0 top-0 h-1.5 ${colours.bar}`} />
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm uppercase tracking-[0.24em] text-portugalGreen/70">{lesson.subtitle}</p>
            <span className="rounded-full bg-portugalGreen px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white">
              Start Here
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-4xl font-semibold">{lesson.title}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-ink/72">{lesson.description}</p>
            </div>
            <div className={`rounded-3xl border px-4 py-3 text-sm ${colours.note}`}>
              <p className={`font-semibold ${colours.noteTitle}`}>Accent note</p>
              <p className="mt-1 max-w-xs text-ink/72">{lesson.accentHint}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-white p-4">
              <p className="text-sm text-ink/60">Lesson progress</p>
              <p className="mt-2 text-3xl font-semibold">{lessonProgress}/4</p>
              <p className="mt-1 text-xs font-medium text-ocean">
                {lessonProgress === 0 ? "Not started" : lessonProgress === 4 ? "Complete" : "In progress"}
              </p>
            </div>
            <div className="rounded-3xl bg-portugalGreen p-4 text-white">
              <p className="text-sm text-white/65">Streak</p>
              <p className="mt-2 text-3xl font-semibold">
                {ready
                  ? progress.streak === 0
                    ? "Not started"
                    : progress.streak === 1
                      ? "Started today"
                      : `${progress.streak}-day streak`
                  : "--"}
              </p>
            </div>
            <div className="rounded-3xl bg-portugalGold/30 p-4">
              <p className="text-sm text-ink/60">Best score</p>
              <p className="mt-2 text-3xl font-semibold">{progress.completedLessons[lesson.slug]?.bestScore ?? 0}%</p>
            </div>
          </div>
        </div>

      </section>

      <section id="core-phrases" className="mt-8 scroll-mt-6 card-surface p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-portugalGreen/70">Core phrases</p>
            <h2 className="text-2xl font-semibold">Listen and repeat</h2>
          </div>
          <div className="rounded-full bg-portugalGreen/10 px-4 py-2 text-sm font-medium text-portugalGreen">
            Start Here European Portuguese
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {lesson.phrases.map((phrase) => (
            <article key={phrase.portuguese} className="rounded-[2rem] bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 lang="pt-PT" className="text-2xl font-semibold"><GenderedPhrase phrase={phrase} /></h3>
                  <p className="mt-2 text-base text-ink/70">{phrase.english}</p>
                </div>
                <SpeechButton
                  text={phrase.portuguese}
                  onListen={() => handlePractice("listen")}
                  voiceGender={phrase.genderCue?.gender}
                />
              </div>
              <p className="mt-4 text-sm leading-7 text-ink/65">{phrase.tip}</p>
              <GenderCoach phrase={phrase} />
            </article>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-8">
        <Flashcards
          phrases={lesson.phrases}
          onPractice={() => handlePractice("flashcards")}
          onListen={() => handlePractice("listen")}
          onAnswer={(answer) => handleAnswer("flashcard", answer)}
        />
        <section>
          <div className="mb-5">
            <p className="eyebrow">Practice games</p>
            <h2 className="mt-2 font-display text-4xl font-bold">Learn by hearing</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/60">
              Listen to useful European Portuguese, rebuild each sentence, and train your ear with immediate, friendly feedback.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <PhraseBuilder
              lesson={lesson}
              onComplete={() => handlePractice("phraseBuilder")}
              onAttempt={(answer) => {
                handlePractice(answer.correct ? "phraseBuilderCorrect" : "phraseBuilderIncorrect");
                handleAnswer("sentenceBuilder", answer);
              }}
            />
            <ListeningMatch
              lesson={lesson}
              onComplete={() => handlePractice("listeningMatch")}
              onListen={() => handlePractice("listen")}
              onAnswer={(answer) => handleAnswer("listening", answer)}
            />
          </div>
        </section>
        {lesson.slug === "food" ? (
          <SupermarketRoleplay onAnswer={(answer) => handleAnswer("roleplay", answer)} />
        ) : null}
        <TranslateCrisisGame onAnswer={(answer) => handleAnswer("crisisGame", answer)} />
        <QuizPanel
          questions={lesson.quiz}
          phraseBuilderComplete={Boolean(progress.practiceByLesson[lesson.slug]?.phraseBuilderCompleted)}
          onComplete={handleQuizComplete}
          onListen={() => handlePractice("listen")}
          onAnswer={(answer) => handleAnswer("quiz", answer)}
        />
      </div>
    </main>
  );
}
