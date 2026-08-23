"use client";

import Image from "next/image";
import { avatarDetails } from "@/lib/avatar-preference";
import { speakEuropeanPortuguese, type PortugueseVoiceGender } from "@/components/speech-button";

type SpokenOption = {
  text: string;
  gender?: PortugueseVoiceGender;
  translation?: string;
};

type ResponseRow = {
  label?: string;
  prompts?: SpokenOption[];
  replies: SpokenOption[];
};

type ResponseGroup = {
  title: string;
  introduction: string;
  rows: ResponseRow[];
  conversation?: SpokenOption[];
};

const responseGroups: ResponseGroup[] = [
  {
    title: "🌅 Time of Day Greetings",
    introduction: "The easiest rule in Portugal is to repeat the exact greeting back to the person.",
    rows: [
      { prompts: [{ text: "Bom dia!", gender: "feminine" }], replies: [{ text: "Bom dia!", gender: "feminine" }] },
      { prompts: [{ text: "Boa tarde!", gender: "feminine" }], replies: [{ text: "Boa tarde!", gender: "feminine" }] },
      { prompts: [{ text: "Boa noite!", gender: "feminine" }], replies: [{ text: "Boa noite!", gender: "feminine" }] }
    ]
  },
  {
    title: "🤝 How Are You?",
    introduction: "Say how you feel, then politely ask how the other person is.",
    rows: [
      {
        label: "Standard answers",
        prompts: [{ text: "Tudo bem?" }, { text: "Como estás?" }],
        replies: [
          { text: "Tudo bem, obrigado.", gender: "masculine", translation: "Everything is good, thank you." },
          { text: "Tudo bem, obrigada.", gender: "feminine", translation: "Everything is good, thank you." },
          { text: "Estou bem, obrigado.", gender: "masculine", translation: "I am well, thank you." },
          { text: "Estou bem, obrigada.", gender: "feminine", translation: "I am well, thank you." },
          { text: "Tudo ótimo!", translation: "Everything is great!" },
          { text: "Mais ou menos.", translation: "So-so / Not too bad." }
        ]
      },
      {
        label: "Ask ‘And you?’",
        replies: [
          { text: "E tu?", translation: "And you? Casual, with friends." },
          { text: "E o senhor?", gender: "masculine", translation: "And you, sir? Formal." },
          { text: "E a senhora?", gender: "feminine", translation: "And you, ma’am? Formal." }
        ]
      }
    ],
    conversation: [
      { text: "Olá, tudo bem?", translation: "Person A" },
      { text: "Tudo bem, obrigado. E tu?", gender: "masculine", translation: "Person B" },
      { text: "Tudo bem também!", translation: "Person A: Everything is good too!" }
    ]
  },
  {
    title: "📞 Answering the Phone",
    introduction: "After you answer with ‘Estou?’, the caller will usually introduce themselves or ask for someone.",
    rows: [
      {
        prompts: [{ text: "Estou?", translation: "Hello?" }],
        replies: [
          { text: "Sim, bom dia, fala o [nome].", translation: "Yes, good morning, this is [Name] speaking." },
          { text: "Está lá? Queria falar com o [nome], por favor.", translation: "Hello? I would like to speak with [Name], please." }
        ]
      }
    ]
  },
  {
    title: "👋 Farewell Words",
    introduction: "Mirror the timeframe of the farewell whenever possible.",
    rows: [
      { prompts: [{ text: "Até amanhã!" }], replies: [{ text: "Até amanhã!", translation: "See you tomorrow!" }] },
      {
        prompts: [{ text: "Até logo!" }],
        replies: [
          { text: "Até logo!", translation: "See you later!" },
          { text: "Tchau!", translation: "Bye!" }
        ]
      },
      { prompts: [{ text: "Adeus!" }], replies: [{ text: "Adeus!", translation: "Goodbye!" }] }
    ]
  }
];

function PhraseButton({ option }: { option: SpokenOption }) {
  const avatar = option.gender === "masculine"
    ? avatarDetails.male
    : option.gender === "feminine"
      ? avatarDetails.female
      : null;

  return (
    <button
      type="button"
      onClick={() => speakEuropeanPortuguese(option.text, { voiceGender: option.gender, rate: 0.9 })}
      data-portuguese-voice-managed="true"
      className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-portugalGreen/20 bg-white px-3 py-2 text-left text-sm font-bold text-portugalGreen shadow-sm transition hover:border-portugalGreen/40 hover:bg-portugalGreen/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portugalGreen sm:text-base"
      lang="pt-PT"
      aria-label={`${option.text}. Hear ${avatar ? avatar.name : "this phrase"} in European Portuguese.`}
    >
      {avatar ? (
        <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-portugalGreen/15 bg-sand">
          <Image src={avatar.image} alt="" fill sizes="36px" className={`object-cover ${avatar.imagePosition}`} />
        </span>
      ) : null}
      <span>
        <span className="block">{option.text}</span>
        {option.translation ? <span className="mt-0.5 block text-xs font-normal text-ink/65">{option.translation}</span> : null}
      </span>
      <span className="ml-auto text-xs" aria-hidden="true">▶</span>
    </button>
  );
}

export function GreetingResponseGuide() {
  return (
    <div className="space-y-3">
      {responseGroups.map((group) => (
        <details
          key={group.title}
          className="group overflow-hidden rounded-[1.35rem] border border-portugalGreen/15 bg-white"
        >
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-bold text-ink marker:content-none sm:px-5">
            <span>{group.title}</span>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-portugalGreen/10 text-portugalGreen transition-transform group-open:rotate-180" aria-hidden="true">↓</span>
          </summary>
          <div className="border-t border-portugalGreen/10 bg-sand/20 p-4 sm:p-5">
            <p className="text-sm text-ink/70 sm:text-base">{group.introduction}</p>
            <div className="mt-4 space-y-3">
              {group.rows.map((row, index) => (
                <div
                  key={`${group.title}-${index}`}
                  className="grid gap-3 rounded-2xl border border-ink/10 bg-white p-3 md:grid-cols-2 md:items-start sm:p-4"
                >
                  {row.prompts ? (
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-ink/55">When you hear</p>
                      <div className="flex flex-wrap gap-2">
                        {row.prompts.map((option) => <PhraseButton key={`${option.text}-${option.gender ?? "general"}`} option={option} />)}
                      </div>
                    </div>
                  ) : null}
                  <div className={row.prompts ? undefined : "md:col-span-2"}>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-ink/55">{row.label ?? "Reply with"}</p>
                    <div className="flex flex-wrap gap-2">
                      {row.replies.map((option) => <PhraseButton key={`${option.text}-${option.gender ?? "general"}`} option={option} />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {group.conversation ? (
              <div className="mt-4 rounded-2xl border border-portugalBlue/15 bg-portugalBlue/5 p-3 sm:p-4">
                <p className="mb-3 text-sm font-bold text-portugalBlue">Example conversation</p>
                <div className="flex flex-wrap gap-2">
                  {group.conversation.map((option) => <PhraseButton key={`${option.text}-${option.gender ?? "general"}`} option={option} />)}
                </div>
              </div>
            ) : null}
          </div>
        </details>
      ))}
    </div>
  );
}
