"use client";

import { speakEuropeanPortuguese } from "@/components/speech-button";

const foodConversations = [
  {
    situation: "At a café",
    request: "Queria café, por favor.",
    meaning: "I would like coffee, please.",
    reply: "Sim.",
    replyMeaning: "Yes."
  },
  {
    situation: "Without sugar",
    request: "Queria café sem açúcar, por favor.",
    meaning: "I would like coffee without sugar, please.",
    reply: "Sim.",
    replyMeaning: "Yes."
  },
  {
    situation: "At a food shop",
    request: "Queria pão e queijo, por favor.",
    meaning: "I would like bread and cheese, please.",
    reply: "Sim.",
    replyMeaning: "Yes."
  },
  {
    situation: "Ordering a meal",
    request: "Queria sopa e peixe, por favor.",
    meaning: "I would like soup and fish, please.",
    reply: "Sim.",
    replyMeaning: "Yes."
  },
  {
    situation: "Asking for the bill",
    request: "A conta, por favor.",
    meaning: "The bill, please.",
    reply: "Sim.",
    replyMeaning: "Yes."
  }
];

function SpokenPhrase({ portuguese, english }: { portuguese: string; english: string }) {
  return (
    <button
      type="button"
      onClick={() => speakEuropeanPortuguese(portuguese, { rate: 0.9 })}
      data-portuguese-voice-managed="true"
      className="min-h-14 w-full rounded-2xl border border-portugalGreen/20 bg-white px-4 py-3 text-left shadow-sm transition hover:border-portugalGreen/40 hover:bg-portugalGreen/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portugalGreen"
      lang="pt-PT"
      aria-label={`${portuguese} Hear this phrase in European Portuguese.`}
    >
      <span className="block font-bold text-portugalGreen">{portuguese} <span aria-hidden="true">▶</span></span>
      <span className="mt-1 block text-sm text-ink/65" lang="en">{english}</span>
    </button>
  );
}

export function FoodConversationGuide() {
  return (
    <div className="space-y-3">
      <p className="rounded-2xl bg-white px-4 py-3 text-sm text-ink/70 sm:text-base">
        Use the food words you have just learned in short, polite conversations. Select any Portuguese phrase to hear it.
      </p>
      {foodConversations.map((conversation) => (
        <section key={conversation.situation} className="rounded-[1.35rem] border border-portugalGreen/15 bg-white p-4 sm:p-5">
          <h3 className="font-bold text-ink">{conversation.situation}</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-ink/55">Ask with</p>
              <SpokenPhrase portuguese={conversation.request} english={conversation.meaning} />
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-ink/55">Reply with</p>
              <SpokenPhrase portuguese={conversation.reply} english={conversation.replyMeaning} />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
