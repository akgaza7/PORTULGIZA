"use client";

import { speakEuropeanPortuguese } from "@/components/speech-button";
import type { PortugueseVoiceGender } from "@/components/speech-button";
import { useAvatarPreference } from "@/lib/avatar-preference";

type GreetingItem = {
  portuguese: string;
  english: string;
  note?: string;
  gender?: PortugueseVoiceGender;
};

type GreetingSection = {
  title: string;
  introduction: string;
  items: GreetingItem[];
};

const greetingSections: GreetingSection[] = [
  {
    title: "🌅 General & Standard Greetings",
    introduction: "Safe to use in formal or casual situations across Portugal.",
    items: [
      { portuguese: "Olá!", english: "Hello! / Hi!", note: "The most common, universal greeting." },
      { portuguese: "Bom dia!", english: "Good morning!", note: "Used from sunrise until lunchtime, usually around 1:00 PM.", gender: "feminine" },
      { portuguese: "Boa tarde!", english: "Good afternoon!", note: "Used from lunchtime until nightfall, usually around 8:00 PM.", gender: "feminine" },
      { portuguese: "Boa noite!", english: "Good evening! / Good night!", note: "Used after dark, both as a greeting and a farewell.", gender: "feminine" }
    ]
  },
  {
    title: "🤝 Casual & Informal Greetings",
    introduction: "Use these with friends, peers or people younger than you.",
    items: [
      { portuguese: "Viva!", english: "Hi! / Cheers!", note: "A popular, friendly way to greet someone quickly." },
      { portuguese: "Tudo bem?", english: "How are you? / Is everything good?", note: "Often paired directly with Olá." },
      { portuguese: "Como estás?", english: "How are you?", note: "Informal, addressing someone as tu." },
      { portuguese: "Então?", english: "Hey! / What’s up?", note: "Very casual and usually used with a close friend." }
    ]
  },
  {
    title: "👔 Formal Greetings",
    introduction: "Use these with strangers, elders or in a professional setting.",
    items: [
      { portuguese: "Como está?", english: "How are you?", note: "A respectful, formal form." },
      { portuguese: "Como passa?", english: "How are you doing?", note: "A polite, slightly older traditional greeting." }
    ]
  },
  {
    title: "📞 Answering the Phone",
    introduction: "Common phrases used when answering a telephone call in Portugal.",
    items: [
      { portuguese: "Estou?", english: "Hello?", note: "The standard way to answer a phone call in Portugal." },
      { portuguese: "Está lá?", english: "Hello?", note: "Literally: Are you there?" }
    ]
  },
  {
    title: "👋 Say Goodbye",
    introduction: "Choose the farewell that matches when you expect to meet again.",
    items: [
      { portuguese: "Adeus!", english: "Goodbye!", note: "Slightly formal or used when you may not see the person for a while." },
      { portuguese: "Até logo!", english: "See you later!", note: "Used when you expect to see the person later the same day." },
      { portuguese: "Até amanhã!", english: "See you tomorrow!" },
      { portuguese: "Até à próxima!", english: "Until next time!" },
      { portuguese: "Tchau!", english: "Bye!", note: "An informal farewell." }
    ]
  }
];

export function GreetingVocabularyGuide() {
  const { avatar } = useAvatarPreference();
  const voiceGender = avatar === "male" ? "masculine" : "feminine";

  return (
    <div className="grid gap-3" aria-label="European Portuguese greeting vocabulary">
      {greetingSections.map((section) => (
        <details key={section.title} className="group overflow-hidden rounded-[1.5rem] border border-portugalGreen/20 bg-white/90 shadow-soft">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-portugalGreen/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-portugalGreen [&::-webkit-details-marker]:hidden">
            <span className="text-lg font-bold text-portugalGreen sm:text-xl">{section.title}</span>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-portugalGreen/20 bg-portugalGreen/10 font-bold text-portugalGreen transition-transform group-open:rotate-180" aria-hidden="true">↓</span>
          </summary>
          <div className="border-t border-portugalGreen/15 bg-sand/20 p-3 sm:p-4">
            <p className="mb-3 text-sm text-ink/65">{section.introduction}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {section.items.map((item) => (
                <div key={item.portuguese} className="rounded-2xl border border-portugalGreen/15 bg-white p-3 shadow-sm">
                  <button
                    type="button"
                    onClick={() => speakEuropeanPortuguese(item.portuguese, { voiceGender: item.gender ?? voiceGender, rate: 0.9 })}
                    data-portuguese-voice-managed="true"
                    className="inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-xl bg-portugalGreen/5 px-3 py-2 text-left font-bold text-portugalGreen transition hover:bg-portugalGreen/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portugalGreen"
                    lang="pt-PT"
                    aria-label={`${item.portuguese} Hear this in European Portuguese.`}
                  >
                    <span>{item.portuguese}</span>
                    <span aria-hidden="true">▶</span>
                  </button>
                  <p className="mt-2 font-bold text-ink">{item.english}</p>
                  {item.note ? <p className="mt-1 text-sm leading-5 text-ink/60">{item.note}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
