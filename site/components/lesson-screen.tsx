"use client";

import Link from "next/link";
import { Flashcards } from "@/components/flashcards";
import { GenderCoach, GenderedPhrase } from "@/components/gender-coach";
import { ListeningMatch } from "@/components/listening-match";
import { PhraseBuilder } from "@/components/phrase-builder";
import { QuizPanel } from "@/components/quiz-panel";
import { speakEuropeanPortuguese } from "@/components/speech-button";
import { StudentProgressDashboard } from "@/components/student-progress-dashboard";
import { SupermarketRoleplay } from "@/components/supermarket-roleplay";
import { TranslateCrisisGame } from "@/components/translate-crisis-game";
import { getLearningAccess } from "@/lib/learning-access";
import type { CategoryLesson } from "@/lib/lesson-data";
import {
  markAnswerAttempt,
  markLessonActivity,
  markPracticeActivity,
  type PracticeActivity,
  useProgressState
} from "@/lib/storage";

type LessonScreenProps = {
  lesson: CategoryLesson;
};

export function LessonScreen({ lesson }: LessonScreenProps) {
  const { progress, setProgress, ready, subscriptionStatus, trialEndsAt } = useProgressState();
  const access = getLearningAccess(progress, subscriptionStatus, trialEndsAt);

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

  if (!ready) {
    return (
      <main className="page-shell">
        <section className="card-surface p-6 sm:p-8" aria-live="polite">
          <p className="font-semibold text-ink/65">Checking lesson access…</p>
        </section>
      </main>
    );
  }

  if (!access.canAccessStart) {
    return (
      <main className="page-shell">
        <section className="card-surface p-6 sm:p-8">
          <p className="eyebrow">START is locked</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Begin your 14-day START trial</h1>
          <p className="mt-3 max-w-2xl leading-7 text-ink/65">
            START lessons are available during your 14-day free trial and remain available with an active subscription.
          </p>
          <Link href="/sign-up" className="mt-5 inline-flex rounded-full bg-portugalGreen px-5 py-3 font-bold text-white transition hover:bg-ink">
            Start 14-day trial
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell learning-page">
      <Link href="/" className="text-sm font-semibold text-portugalGreen transition hover:text-ink">
        ← Back
      </Link>

      <div className="mt-4">
        <StudentProgressDashboard progress={progress} subscriptionStatus={subscriptionStatus} />
      </div>

      <section className="mt-6">
        <div className="card-surface p-6 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-portugalGreen">START</p>
          <h1 className="mt-5 text-4xl font-semibold">{lesson.title}</h1>
        </div>
      </section>

      <section
        id="core-phrases"
        className="mt-6 scroll-mt-6 rounded-[2rem] border border-white/80 bg-sand p-3 shadow-soft sm:p-4"
      >
        <div className="grid gap-3 md:grid-cols-2">
          {lesson.phrases.map((phrase) => (
            <article key={phrase.portuguese} className="rounded-[1.5rem] bg-white p-4">
              <div>
                <div>
                  <button
                    type="button"
                    lang="pt-PT"
                    data-portuguese-voice-managed="true"
                    onClick={() => speakEuropeanPortuguese(phrase.portuguese, {
                      onStart: () => handlePractice("listen"),
                      voiceGender: phrase.genderCue?.gender
                    })}
                    className="rounded-lg text-left text-2xl font-semibold transition hover:text-portugalGreen focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-portugalGreen"
                    aria-label={`Hear ${phrase.portuguese} in European Portuguese`}
                  >
                    <GenderedPhrase phrase={phrase} />
                  </button>
                  <p className="mt-2 text-base text-ink/70">{phrase.english}</p>
                </div>
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
              Hear useful European Portuguese, rebuild each sentence, and train your ear with immediate, friendly feedback.
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
        <TranslateCrisisGame
          canAccessSmooth={access.canAccessSmooth}
          canAccessSturdy={access.canAccessSturdy}
          onAnswer={(answer) => handleAnswer("crisisGame", answer)}
        />
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
