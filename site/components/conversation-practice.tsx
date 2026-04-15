"use client";

import { useMemo, useState } from "react";
import { SpeechButton } from "@/components/speech-button";
import type { ConversationTurn } from "@/lib/lesson-data";

type ConversationPracticeProps = {
  conversation: ConversationTurn[];
};

export function ConversationPractice({ conversation }: ConversationPracticeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const turn = conversation[currentStep];
  const isLastStep = currentStep === conversation.length - 1;

  const prompt = useMemo(() => {
    return turn.speaker === "learner"
      ? "Say this line aloud, then reveal the meaning if you need support."
      : "Listen first, then repeat the line and move on when you feel comfortable.";
  }, [turn.speaker]);

  return (
    <section className="card-surface p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-pine/60">Conversation</p>
          <h3 className="text-2xl font-semibold">Simple speaking practice</h3>
        </div>
        <p className="text-sm text-ink/60">
          Turn {currentStep + 1} of {conversation.length}
        </p>
      </div>

      <div className="mt-6 rounded-[2rem] bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-pine/60">
              {turn.speaker === "guide" ? "Guide" : "Your line"}
            </p>
            <h4 className="mt-3 text-3xl font-semibold">{turn.portuguese}</h4>
            <p className="mt-3 text-sm text-ink/65">{prompt}</p>
          </div>
          <SpeechButton text={turn.portuguese} />
        </div>

        {revealed ? <p className="mt-6 rounded-2xl bg-moss p-4 text-ink/75">{turn.english}</p> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setRevealed((value) => !value)}
          className="rounded-full border border-pine/15 px-4 py-2 text-sm font-medium text-pine"
        >
          {revealed ? "Hide translation" : "Reveal translation"}
        </button>
        <button
          type="button"
          onClick={() => {
            setCurrentStep(isLastStep ? 0 : currentStep + 1);
            setRevealed(false);
          }}
          className="rounded-full bg-pine px-5 py-2 text-sm font-semibold text-white"
        >
          {isLastStep ? "Restart practice" : "Next turn"}
        </button>
      </div>
    </section>
  );
}
