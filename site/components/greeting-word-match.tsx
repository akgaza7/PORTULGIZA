"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { speakEuropeanPortuguese } from "@/components/speech-button";
import { avatarDetails, useAvatarPreference } from "@/lib/avatar-preference";
import type { LessonPhrase } from "@/lib/lesson-data";

type CoreWordMatchProps = {
  phrases: LessonPhrase[];
  lessonSlug: string;
  title: string;
  coreLabel: string;
  itemLabel: string;
  onAttempt: (phrase: LessonPhrase, learnerAnswer: string, correct: boolean) => void;
  onComplete: () => void;
  showLessonHeading?: boolean;
};

const englishOrder = [4, 0, 7, 2, 9, 1, 6, 3, 8, 5];

export function CoreWordMatch({ phrases, lessonSlug, title, coreLabel, itemLabel, onAttempt, onComplete, showLessonHeading = true }: CoreWordMatchProps) {
  const corePhrases = phrases.slice(0, 10);
  const { avatar, details: selectedAvatar } = useAvatarPreference();
  const [selectedPortuguese, setSelectedPortuguese] = useState<number | null>(null);
  const [selectedEnglish, setSelectedEnglish] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [attemptedPhrases, setAttemptedPhrases] = useState<number[]>([]);
  const [firstTryCorrect, setFirstTryCorrect] = useState<number[]>([]);
  const [feedback, setFeedback] = useState("Choose one Portuguese phrase and its English meaning.");
  const [showReview, setShowReview] = useState(false);
  const [incorrectPair, setIncorrectPair] = useState<{ portugueseIndex: number; englishIndex: number } | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const complete = matched.length === corePhrases.length;
  const portugueseGroups = lessonSlug === "greetings"
    ? [
        {
          key: "masculine",
          label: "Masculine",
          detail: "2 gendered greetings",
          avatar: avatarDetails.male,
          panelClass: "border-portugalBlue/20 bg-portugalBlue/5 text-portugalBlue",
          indices: corePhrases.flatMap((phrase, index) => phrase.genderCue?.gender === "masculine" ? [index] : [])
        },
        {
          key: "feminine",
          label: "Feminine",
          detail: "3 gendered greetings",
          avatar: avatarDetails.female,
          panelClass: "border-portugalRed/20 bg-portugalRed/5 text-portugalRed",
          indices: corePhrases.flatMap((phrase, index) => phrase.genderCue?.gender === "feminine" ? [index] : [])
        },
        {
          key: "general",
          label: "General",
          detail: "5 phrases without a gender change",
          avatar: null,
          panelClass: "border-portugalGreen/20 bg-portugalGreen/5 text-portugalGreen",
          indices: corePhrases.flatMap((phrase, index) => phrase.genderCue ? [] : [index])
        }
      ]
    : [{
        key: "all",
        label: "All",
        detail: "",
        avatar: null,
        panelClass: "",
        indices: corePhrases.map((_, index) => index)
      }];

  useEffect(() => () => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
  }, []);

  const checkMatch = (portugueseIndex: number, englishIndex: number) => {
    const phrase = corePhrases[portugueseIndex];
    const learnerAnswer = corePhrases[englishIndex].english;
    const correct = portugueseIndex === englishIndex;
    const firstAttempt = !attemptedPhrases.includes(portugueseIndex);
    const nextAttemptedPhrases = firstAttempt ? [...attemptedPhrases, portugueseIndex] : attemptedPhrases;
    const nextFirstTryCorrect = firstAttempt && correct
      ? [...firstTryCorrect, portugueseIndex]
      : firstTryCorrect;

    if (firstAttempt) {
      setAttemptedPhrases(nextAttemptedPhrases);
      setFirstTryCorrect(nextFirstTryCorrect);
      onAttempt(phrase, learnerAnswer, correct);
    }

    if (correct) {
      const nextMatched = [...matched, portugueseIndex];
      setMatched(nextMatched);
      setFeedback(
        nextMatched.length === corePhrases.length
          ? `Completed. Your first-attempt score is ${nextFirstTryCorrect.length}/${corePhrases.length}.`
          : `Correct — that pair has disappeared. First-attempt score: ${nextFirstTryCorrect.length}/${nextAttemptedPhrases.length}.`
      );
      if (nextMatched.length === corePhrases.length) onComplete();
      setSelectedPortuguese(null);
      setSelectedEnglish(null);
    } else {
      setIncorrectPair({ portugueseIndex, englishIndex });
      setFeedback("Those words do not match…");

      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      const feedbackDelay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 420;
      feedbackTimerRef.current = setTimeout(() => {
        setFeedback(`Try again. “${learnerAnswer}” does not match “${phrase.portuguese}”. This phrase will stay in your dashboard practice list.`);
        setIncorrectPair(null);
        setSelectedPortuguese(null);
        setSelectedEnglish(null);
      }, feedbackDelay);
    }
  };

  const choosePortuguese = (index: number) => {
    speakEuropeanPortuguese(corePhrases[index].portuguese, {
      voiceGender: corePhrases[index].genderCue?.gender ?? (avatar === "female" ? "feminine" : "masculine")
    });

    if (selectedEnglish !== null) {
      checkMatch(index, selectedEnglish);
      return;
    }
    setSelectedPortuguese(index);
    setFeedback("Now choose its English meaning.");
  };

  const chooseEnglish = (index: number) => {
    if (selectedPortuguese !== null) {
      checkMatch(selectedPortuguese, index);
      return;
    }
    setSelectedEnglish(index);
    setFeedback("Now choose the matching Portuguese phrase.");
  };

  const handleReview = () => {
    if (showReview && complete) {
      setMatched([]);
      setAttemptedPhrases([]);
      setFirstTryCorrect([]);
      setFeedback("Choose one Portuguese phrase and its English meaning.");
    }
    setShowReview((current) => !current);
  };

  return (
    <article className="rounded-[2rem] border border-portugalGreen/20 bg-white/90 p-4 shadow-soft sm:p-5 md:col-span-2 xl:col-span-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {showLessonHeading ? (
            <>
              <Link href={`/lesson/${lessonSlug}`} className="font-display text-3xl font-bold tracking-tight text-ink transition hover:text-portugalGreen">
                {title}
              </Link>
              {lessonSlug === "greetings" ? (
                <p className="mt-1 font-display text-lg font-semibold text-ink">Click and match the correct word</p>
              ) : null}
            </>
          ) : null}
          {lessonSlug === "greetings" ? null : <p className="mt-1 text-sm font-semibold text-portugalGreen">{coreLabel}</p>}
        </div>
        <button
          type="button"
          onClick={handleReview}
          className="min-h-11 rounded-full bg-ocean px-5 py-2 text-sm font-bold text-white transition hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean"
        >
          {showReview ? (complete ? "Start again" : "Continue matching") : "Check the words"}
        </button>
      </div>

      {showReview ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2" aria-label={`Ten Portuguese ${itemLabel} with their English meanings`}>
          {corePhrases.map((phrase) => (
            <div key={phrase.portuguese} className="grid grid-cols-2 gap-3 rounded-2xl bg-sand/75 p-3">
              <span className="font-bold text-portugalGreen" lang="pt-PT">{phrase.portuguese}</span>
              <span className="text-ink/70">{phrase.english}</span>
            </div>
          ))}
        </div>
      ) : complete ? (
        <div className="mt-4 rounded-2xl bg-portugalGreen/10 p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-portugalGreen">First-attempt result</p>
          <p className="mt-2 font-display text-4xl font-bold text-portugalGreen">{firstTryCorrect.length}/{corePhrases.length}</p>
          <p className="mt-2 text-sm text-ink/65">
            You completed all 10 matches. Words missed on the first attempt remain in your dashboard practice list.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-4 rounded-xl bg-sand/70 px-3 py-2 text-sm text-ink/65" aria-live="polite">{feedback}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              {lessonSlug === "greetings" ? null : (
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-portugalGreen">Portuguese</p>
              )}
              <div className={`grid gap-3 ${lessonSlug === "greetings" ? "lg:grid-cols-3" : ""}`}>
                {portugueseGroups.map((group) => (
                  <section
                    key={group.key}
                    aria-label={`${group.label} Portuguese words`}
                    className={lessonSlug === "greetings" ? `rounded-2xl border p-3 ${group.panelClass}` : ""}
                  >
                    {lessonSlug === "greetings" ? (
                      <div className="mb-3 flex min-h-12 items-center gap-2">
                        {group.avatar ? (
                          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-white bg-white shadow-sm">
                            <Image
                              src={group.avatar.image}
                              alt=""
                              fill
                              sizes="44px"
                              className={`object-cover ${group.avatar.imagePosition}`}
                            />
                          </span>
                        ) : (
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-portugalGreen/10 font-display text-sm font-bold" aria-hidden="true">Aa</span>
                        )}
                        <div>
                          <h3 className="font-display text-lg font-bold">{group.label}</h3>
                          <p className="text-xs text-ink/55">{group.detail}</p>
                        </div>
                      </div>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      {group.indices.map((index) => {
                        const phrase = corePhrases[index];
                        return matched.includes(index) ? null : (
                          <button
                            key={phrase.portuguese}
                            type="button"
                            onClick={() => choosePortuguese(index)}
                            disabled={incorrectPair !== null}
                            aria-pressed={selectedPortuguese === index}
                            aria-label={`${phrase.portuguese}. Hear ${phrase.genderCue?.gender === "masculine" ? avatarDetails.male.name : phrase.genderCue?.gender === "feminine" ? avatarDetails.female.name : selectedAvatar.name} say it and select this Portuguese word.`}
                            data-portuguese-voice-managed="true"
                            className={`min-h-11 rounded-full border px-4 py-2 text-sm font-bold transition ${selectedPortuguese === index ? "border-portugalGreen bg-portugalGreen text-white" : "border-portugalGreen/20 bg-white/70 text-portugalGreen hover:bg-portugalGreen/10"} ${incorrectPair?.portugueseIndex === index ? "match-error-shake border-portugalRed bg-portugalRed text-white" : ""}`}
                            lang="pt-PT"
                          >
                            {phrase.portuguese}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-ocean">English</p>
              <div className="flex flex-wrap gap-2">
                {englishOrder.map((index) => {
                  if (matched.includes(index)) return null;

                  const phrase = corePhrases[index];
                  const genderAvatar = phrase.genderCue?.gender === "masculine"
                    ? avatarDetails.male
                    : phrase.genderCue?.gender === "feminine"
                      ? avatarDetails.female
                      : null;
                  const englishLabel = phrase.english.replace(/\s*\((?:female|male) speaker\)\s*$/i, "");

                  return (
                    <button
                      key={phrase.english}
                      type="button"
                      onClick={() => chooseEnglish(index)}
                      disabled={incorrectPair !== null}
                      aria-pressed={selectedEnglish === index}
                      aria-label={genderAvatar ? `${englishLabel}. ${genderAvatar.name} indicates ${phrase.genderCue?.gender} grammar.` : englishLabel}
                      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${selectedEnglish === index ? "border-ocean bg-ocean text-white" : "border-ocean/20 bg-ocean/5 text-ocean hover:bg-ocean/10"} ${incorrectPair?.englishIndex === index ? "match-error-shake border-portugalRed bg-portugalRed text-white" : ""}`}
                    >
                      {genderAvatar ? (
                        <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/80 bg-white">
                          <Image
                            src={genderAvatar.image}
                            alt=""
                            fill
                            sizes="32px"
                            className={`object-cover ${genderAvatar.imagePosition}`}
                          />
                        </span>
                      ) : null}
                      <span>{englishLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </article>
  );
}
