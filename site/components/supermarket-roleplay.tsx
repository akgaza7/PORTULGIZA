"use client";

import Image from "next/image";
import { useState } from "react";
import { speakEuropeanPortuguese } from "@/components/speech-button";

type RoleplayAnswer = {
  prompt: string;
  correctAnswer: string;
  learnerAnswer: string;
  correct: boolean;
};

type SupermarketRoleplayProps = {
  onAnswer: (answer: RoleplayAnswer) => void;
};

type WordTile = {
  id: string;
  portuguese: string;
  english: string;
};

const prompt = "Supermarket: Tiago needs milk and bread. What should he say to Inês?";
const correctSentence = "Queria leite e pão, por favor.";
const wordTiles: WordTile[] = [
  { id: "bread", portuguese: "pão,", english: "bread" },
  { id: "please", portuguese: "por favor.", english: "please" },
  { id: "milk", portuguese: "leite", english: "milk" },
  { id: "request", portuguese: "Queria", english: "I would like" },
  { id: "and", portuguese: "e", english: "and" }
];
const correctWordOrder = ["request", "milk", "and", "bread", "please"];

export function SupermarketRoleplay({ onAnswer }: SupermarketRoleplayProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);

  const selectedTiles = selectedIds.map((id) => wordTiles.find((tile) => tile.id === id)!).filter(Boolean);
  const availableTiles = wordTiles.filter((tile) => !selectedIds.includes(tile.id));
  const learnerAnswer = selectedTiles.map((tile) => tile.portuguese).join(" ");
  const revisionRequired = result === "incorrect" && attempts >= 2;

  const chooseTile = (id: string) => {
    if (result || selectedIds.includes(id)) return;
    setSelectedIds((current) => [...current, id]);
  };

  const removeTile = (id: string) => {
    if (result) return;
    setSelectedIds((current) => current.filter((selectedId) => selectedId !== id));
  };

  const checkAnswer = () => {
    if (selectedIds.length !== wordTiles.length || result) return;

    const correct = learnerAnswer === correctSentence;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setResult(correct ? "correct" : "incorrect");
    onAnswer({ prompt, correctAnswer: correctSentence, learnerAnswer, correct });

    if (correct) {
      speakEuropeanPortuguese(correctSentence, { voiceGender: "masculine" });
    }
  };

  const resetAttempt = () => {
    setSelectedIds([]);
    setResult(null);
    if (revisionRequired) setAttempts(0);
  };

  return (
    <section id="supermarket-roleplay" className="card-surface overflow-hidden p-5 sm:p-7" aria-labelledby="supermarket-roleplay-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Character role-play</p>
          <h2 id="supermarket-roleplay-heading" className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            Tiago goes shopping
          </h2>
        </div>
        <span className="w-fit rounded-full bg-portugalGold/30 px-4 py-2 text-sm font-bold text-ink">
          Attempt {Math.min(attempts + 1, 2)} of 2
        </span>
      </div>

      <p className="mt-3 max-w-3xl text-base leading-7 text-ink/65">
        Tiago is in a supermarket. He needs milk and bread. Inês works in the shop. Put the taught words in the correct order to help Tiago ask politely.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <article className={`rounded-[1.75rem] border p-4 transition ${result === "correct" ? "border-portugalGreen bg-portugalGreen/10" : "border-portugalBlue/15 bg-portugalBlue/5"}`}>
          <div className="flex items-center gap-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-white">
              <Image src="/portulgiza-male-avatar.webp" alt="Tiago in the supermarket" fill sizes="96px" className="object-cover object-top" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-portugalBlue">Tiago · Customer</p>
              <p className="mt-2 font-display text-xl font-bold text-ink">What should I say?</p>
            </div>
          </div>
        </article>

        <span className="hidden text-2xl text-ink/25 sm:block" aria-hidden="true">→</span>

        <article className={`relative rounded-[1.75rem] border p-4 transition ${result === "correct" ? "border-portugalGreen bg-portugalGreen/10" : result === "incorrect" ? "border-portugalRed/35 bg-portugalRed/5" : "border-portugalRed/15 bg-portugalRed/5"}`}>
          <div className="flex items-center gap-4">
            <div className={`relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-white ${result === "correct" ? "animate-pulse" : ""}`}>
              <Image src="/portulgiza-female-avatar.png" alt="Inês working in the supermarket" fill sizes="96px" className="object-cover object-top" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-portugalRed">Inês · Shop worker</p>
              <p className="mt-2 font-display text-xl font-bold text-ink">
                {result === "correct" ? "Here are your items!" : result === "incorrect" ? "Try the word order again." : "I am listening."}
              </p>
            </div>
          </div>
          {result === "correct" ? (
            <div className="absolute right-4 top-3 rounded-full bg-white px-3 py-1 text-2xl shadow-sm" aria-label="Milk and bread received">
              🥛 🥖
            </div>
          ) : null}
        </article>
      </div>

      <div className="mt-6 rounded-[1.75rem] border border-dashed border-portugalGreen/30 bg-portugalGreen/5 p-4">
        <p className="text-sm font-semibold text-ink/60">Tiago says:</p>
        <div className="mt-3 flex min-h-16 flex-wrap items-center gap-2" aria-label="Your Portuguese sentence">
          {selectedTiles.length ? selectedTiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              lang="pt-PT"
              onClick={() => removeTile(tile.id)}
              disabled={Boolean(result)}
              className="rounded-full bg-portugalGreen px-4 py-2 font-bold text-white transition hover:bg-ink disabled:cursor-default"
              aria-label={`Remove ${tile.portuguese} from the sentence`}
            >
              {tile.portuguese}
            </button>
          )) : (
            <span className="text-sm text-ink/45">Choose the Portuguese words below.</span>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Available Portuguese words">
        {availableTiles.map((tile) => (
          <button
            key={tile.id}
            type="button"
            lang="pt-PT"
            onClick={() => chooseTile(tile.id)}
            disabled={Boolean(result)}
            className="rounded-full border border-portugalBlue/20 bg-white px-4 py-2 font-bold text-portugalBlue transition hover:border-portugalBlue hover:bg-portugalBlue/5 disabled:opacity-45"
          >
            {tile.portuguese}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {!result ? (
          <button
            type="button"
            onClick={checkAnswer}
            disabled={selectedIds.length !== wordTiles.length}
            className="rounded-full bg-clay px-6 py-3 font-bold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            Check sentence
          </button>
        ) : null}
        {result === "incorrect" ? (
          <button type="button" onClick={resetAttempt} className="rounded-full bg-portugalRed px-6 py-3 font-bold text-white transition hover:bg-ink">
            {revisionRequired ? "Revise and restart" : "Try again"}
          </button>
        ) : null}
        {result === "correct" ? (
          <button type="button" onClick={resetAttempt} className="rounded-full bg-portugalGreen px-6 py-3 font-bold text-white transition hover:bg-ink">
            Play again
          </button>
        ) : null}
      </div>

      <div aria-live="polite" className="mt-4">
        {result === "correct" ? (
          <div className="rounded-2xl bg-portugalGreen/10 p-4 text-portugalGreen">
            <p className="font-display text-xl font-bold">Correct — Inês gives Tiago the milk and bread.</p>
            <p lang="pt-PT" className="mt-1 font-bold">{correctSentence}</p>
          </div>
        ) : null}
        {result === "incorrect" ? (
          <div className="rounded-2xl bg-portugalRed/10 p-4 text-portugalRed">
            <p className="font-display text-xl font-bold">{revisionRequired ? "Pause and revise these words first." : "Not quite — you have one more try."}</p>
            <p className="mt-1 text-sm text-ink/60">Your attempt has been added to Working Towards on the dashboard.</p>
          </div>
        ) : null}
      </div>

      {result === "incorrect" ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5" aria-label="Portuguese word meanings">
          {correctWordOrder.map((id) => wordTiles.find((tile) => tile.id === id)!).map((tile) => (
            <div key={tile.id} className="rounded-2xl border border-portugalRed/15 bg-white p-3 text-center">
              <p lang="pt-PT" className="font-display text-lg font-bold text-portugalRed">{tile.portuguese.replace(/[,.]$/, "")}</p>
              <p className="mt-1 text-sm text-ink/55">{tile.english}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
