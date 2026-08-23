"use client";

import { useState } from "react";
import Image from "next/image";
import { avatarDetails } from "@/lib/avatar-preference";
import { speakEuropeanPortuguese, type PortugueseVoiceGender } from "@/components/speech-button";

type SpokenPhrase = {
  portuguese: string;
  english: string;
  gender?: PortugueseVoiceGender;
};

type PracticeQuestion = {
  prompt: string;
  options: string[];
  answer: string;
};

type NumbersInSentencesProps = {
  onAttempt: (question: PracticeQuestion, learnerAnswer: string, correct: boolean) => void;
  onComplete: () => void;
};

const sentenceWords: SpokenPhrase[] = [
  { portuguese: "Queria", english: "I would like" },
  { portuguese: "café", english: "coffee", gender: "masculine" },
  { portuguese: "água", english: "water", gender: "feminine" },
  { portuguese: "cerveja", english: "beer", gender: "feminine" },
  { portuguese: "imperial", english: "small draught beer", gender: "feminine" },
  { portuguese: "pastel de nata", english: "custard tart", gender: "masculine" },
  { portuguese: "pão", english: "bread roll", gender: "masculine" },
  { portuguese: "papo-seco", english: "bread roll", gender: "masculine" },
  { portuguese: "maçã", english: "apple", gender: "feminine" },
  { portuguese: "mesa", english: "table", gender: "feminine" },
  { portuguese: "para", english: "for" },
  { portuguese: "por favor", english: "please" },
  { portuguese: "Quanto custa?", english: "How much does it cost?" }
];

const quantityExamples: SpokenPhrase[] = [
  { portuguese: "um café", english: "one coffee", gender: "masculine" },
  { portuguese: "uma água", english: "one water", gender: "feminine" },
  { portuguese: "dois cafés", english: "two coffees", gender: "masculine" },
  { portuguese: "duas cervejas", english: "two beers", gender: "feminine" },
  { portuguese: "três pastéis de nata", english: "three custard tarts", gender: "masculine" },
  { portuguese: "quatro pães", english: "four bread rolls", gender: "masculine" },
  { portuguese: "cinco maçãs", english: "five apples", gender: "feminine" }
];

const sentenceExamples: SpokenPhrase[] = [
  { portuguese: "Queria um café, por favor.", english: "I would like one coffee, please.", gender: "masculine" },
  { portuguese: "Queria uma água, por favor.", english: "I would like one water, please.", gender: "feminine" },
  { portuguese: "Queria dois cafés, por favor.", english: "I would like two coffees, please.", gender: "masculine" },
  { portuguese: "Queria duas cervejas, por favor.", english: "I would like two beers, please.", gender: "feminine" },
  { portuguese: "Uma mesa para três, por favor.", english: "A table for three, please.", gender: "feminine" },
  { portuguese: "Quanto custa um pastel de nata?", english: "How much does one custard tart cost?", gender: "masculine" }
];

const questions: PracticeQuestion[] = [
  {
    prompt: "Choose: I would like one coffee, please.",
    options: ["Queria uma café, por favor.", "Queria um café, por favor.", "Queria dois cafés, por favor."],
    answer: "Queria um café, por favor."
  },
  {
    prompt: "Choose: I would like two beers, please.",
    options: ["Queria duas cervejas, por favor.", "Queria dois cervejas, por favor.", "Queria uma cerveja, por favor."],
    answer: "Queria duas cervejas, por favor."
  },
  {
    prompt: "Choose: A table for three, please.",
    options: ["Uma mesa para dois, por favor.", "Um mesa para três, por favor.", "Uma mesa para três, por favor."],
    answer: "Uma mesa para três, por favor."
  }
];

function AudioPhrase({ phrase }: { phrase: SpokenPhrase }) {
  const avatar = phrase.gender === "masculine" ? avatarDetails.male : phrase.gender === "feminine" ? avatarDetails.female : null;

  return (
    <button
      type="button"
      onClick={() => speakEuropeanPortuguese(phrase.portuguese, { voiceGender: phrase.gender, rate: 0.9 })}
      data-portuguese-voice-managed="true"
      className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-portugalGreen/15 bg-white p-3 text-left transition hover:border-portugalGreen/40 hover:bg-portugalGreen/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portugalGreen"
      lang="pt-PT"
      aria-label={`${phrase.portuguese}. Hear ${avatar ? avatar.name : "this phrase"} in European Portuguese.`}
    >
      {avatar ? (
        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-portugalGreen/15 bg-sand">
          <Image src={avatar.image} alt="" fill sizes="40px" className={`object-cover ${avatar.imagePosition}`} />
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block font-bold text-portugalGreen">{phrase.portuguese}</span>
        <span className="mt-0.5 block text-sm text-ink/60">{phrase.english}</span>
      </span>
      <span className="ml-auto text-xs text-portugalGreen" aria-hidden="true">▶</span>
    </button>
  );
}

export function NumbersInSentences({ onAttempt, onComplete }: NumbersInSentencesProps) {
  const [unlockedStage, setUnlockedStage] = useState(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [completed, setCompleted] = useState(false);
  const question = questions[questionIndex];
  const correct = selectedAnswer === question.answer;

  const checkAnswer = () => {
    if (!selectedAnswer) return;
    setChecked(true);
    onAttempt(question, selectedAnswer, selectedAnswer === question.answer);
  };

  const tryAgain = () => {
    setSelectedAnswer(null);
    setChecked(false);
  };

  const nextQuestion = () => {
    if (questionIndex === questions.length - 1) {
      setCompleted(true);
      onComplete();
      return;
    }
    setQuestionIndex((current) => current + 1);
    setSelectedAnswer(null);
    setChecked(false);
  };

  return (
    <div className="space-y-3">
      <details className="group overflow-hidden rounded-[1.35rem] border border-portugalGreen/15 bg-white">
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-bold text-ink marker:content-none sm:px-5">
          <span>1. Learn every word first</span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-portugalGreen/10 text-portugalGreen transition-transform group-open:rotate-180" aria-hidden="true">↓</span>
        </summary>
        <div className="border-t border-portugalGreen/10 bg-sand/20 p-4 sm:p-5">
          <p className="text-sm leading-6 text-ink/70 sm:text-base">Learn these words before they appear in a sentence. Click every Portuguese word to hear it.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {sentenceWords.map((phrase) => <AudioPhrase key={phrase.portuguese} phrase={phrase} />)}
          </div>
          <button type="button" onClick={() => setUnlockedStage((current) => Math.max(current, 2))} className="mt-4 rounded-full bg-portugalGreen px-5 py-3 font-bold text-white">
            Continue to number changes
          </button>
        </div>
      </details>

      {unlockedStage >= 2 ? (
      <details className="group overflow-hidden rounded-[1.35rem] border border-portugalGreen/15 bg-white">
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-bold text-ink marker:content-none sm:px-5">
          <span>2. Combine numbers and words</span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-portugalGreen/10 text-portugalGreen transition-transform group-open:rotate-180" aria-hidden="true">↓</span>
        </summary>
        <div className="border-t border-portugalGreen/10 bg-sand/20 p-4 sm:p-5">
          <p className="text-sm leading-6 text-ink/70 sm:text-base">
            <strong>Um</strong> and <strong>dois</strong> are used with masculine words. They change to <strong>uma</strong> and <strong>duas</strong> with feminine words.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {quantityExamples.map((phrase) => <AudioPhrase key={phrase.portuguese} phrase={phrase} />)}
          </div>
          <button type="button" onClick={() => setUnlockedStage((current) => Math.max(current, 3))} className="mt-4 rounded-full bg-portugalGreen px-5 py-3 font-bold text-white">
            Continue to sentences
          </button>
        </div>
      </details>
      ) : null}

      {unlockedStage >= 3 ? (
      <details className="group overflow-hidden rounded-[1.35rem] border border-portugalGreen/15 bg-white">
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-bold text-ink marker:content-none sm:px-5">
          <span>3. Hear numbers in sentences</span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-portugalGreen/10 text-portugalGreen transition-transform group-open:rotate-180" aria-hidden="true">↓</span>
        </summary>
        <div className="border-t border-portugalGreen/10 bg-sand/20 p-4 sm:p-5">
          <p className="mb-4 text-sm text-ink/70 sm:text-base">Now listen to the words combined into complete sentences.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {sentenceExamples.map((phrase) => <AudioPhrase key={phrase.portuguese} phrase={phrase} />)}
          </div>
          <button type="button" onClick={() => setUnlockedStage((current) => Math.max(current, 4))} className="mt-4 rounded-full bg-portugalGreen px-5 py-3 font-bold text-white">
            Start the sentence check
          </button>
        </div>
      </details>
      ) : null}

      {unlockedStage >= 4 ? (
      <details className="group overflow-hidden rounded-[1.35rem] border border-portugalGreen/15 bg-white">
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-bold text-ink marker:content-none sm:px-5">
          <span>4. Check the sentence</span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-portugalGreen/10 text-portugalGreen transition-transform group-open:rotate-180" aria-hidden="true">↓</span>
        </summary>
        <div className="border-t border-portugalGreen/10 bg-sand/20 p-4 sm:p-5">
          {completed ? (
            <div className="rounded-2xl bg-portugalGreen/10 p-5 text-center">
              <p className="text-2xl font-bold text-portugalGreen">Well done!</p>
              <p className="mt-2 text-ink/70">You completed Numbers in sentences.</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-ink">{question.prompt}</p>
                <span className="shrink-0 rounded-full bg-portugalGreen/10 px-3 py-1 text-sm font-bold text-portugalGreen">{questionIndex + 1}/{questions.length}</span>
              </div>
              <div className="mt-4 grid gap-2">
                {question.options.map((option) => {
                  const selected = selectedAnswer === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={checked}
                      onClick={() => {
                        setSelectedAnswer(option);
                        speakEuropeanPortuguese(option, { rate: 0.9 });
                      }}
                      className={`min-h-14 rounded-2xl border px-4 py-3 text-left font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portugalGreen ${selected ? "border-portugalGreen bg-portugalGreen/10 text-portugalGreen" : "border-ink/10 bg-white text-ink hover:border-portugalGreen/30"}`}
                      lang="pt-PT"
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {checked ? (
                <div className={`mt-4 rounded-2xl p-4 ${correct ? "bg-portugalGreen/10 text-portugalGreen" : "bg-portugalRed/10 text-portugalRed"}`}>
                  <p className="font-bold">{correct ? "Correct — well done!" : "Try again. Listen for the number and the word gender."}</p>
                </div>
              ) : null}
              <div className="mt-4">
                {!checked ? (
                  <button type="button" disabled={!selectedAnswer} onClick={checkAnswer} className="rounded-full bg-portugalGreen px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Check answer</button>
                ) : correct ? (
                  <button type="button" onClick={nextQuestion} className="rounded-full bg-portugalGreen px-5 py-3 font-bold text-white">{questionIndex === questions.length - 1 ? "Finish" : "Next"}</button>
                ) : (
                  <button type="button" onClick={tryAgain} className="rounded-full bg-portugalBlue px-5 py-3 font-bold text-white">Try again</button>
                )}
              </div>
            </div>
          )}
        </div>
      </details>
      ) : null}
    </div>
  );
}
