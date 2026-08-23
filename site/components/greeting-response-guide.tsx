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
  prompts: SpokenOption[];
  replies: SpokenOption[];
};

type ResponseGroup = {
  title: string;
  rows: ResponseRow[];
};

const responseGroups: ResponseGroup[] = [
  {
    title: "Greetings & Replies",
    rows: [
      {
        prompts: [{ text: "Bom dia" }],
        replies: [{ text: "Bom dia!" }, { text: "Bom dia, tudo bem?" }]
      },
      {
        prompts: [{ text: "Boa tarde" }],
        replies: [{ text: "Boa tarde!" }, { text: "Boa tarde, como está?" }]
      },
      {
        prompts: [{ text: "Boa noite" }],
        replies: [{ text: "Boa noite!" }, { text: "Boa noite, tudo bem?" }]
      }
    ]
  },
  {
    title: "Gratitude & Replies",
    rows: [
      {
        prompts: [
          { text: "Obrigado", gender: "masculine" },
          { text: "Obrigada", gender: "feminine" }
        ],
        replies: [{ text: "De nada." }, { text: "Por nada." }]
      }
    ]
  },
  {
    title: "General Phrases & Replies",
    rows: [
      {
        prompts: [{ text: "Olá" }],
        replies: [{ text: "Olá!" }, { text: "Oi!" }]
      },
      {
        prompts: [{ text: "Como está?" }],
        replies: [
          {
            text: "Estou bem, obrigado. E o amigo?",
            gender: "masculine",
            translation: "I am well, thank you. And you?"
          },
          {
            text: "Estou bem, obrigada. E o amigo?",
            gender: "feminine",
            translation: "I am well, thank you. And you?"
          }
        ]
      },
      {
        prompts: [{ text: "Por favor" }],
        replies: [
          { text: "Com certeza.", translation: "Of course." },
          { text: "Pois não?", translation: "Yes, how can I help?" }
        ]
      },
      {
        prompts: [{ text: "De nada" }],
        replies: [
          { text: "Obrigado.", gender: "masculine", translation: "Thank you." },
          { text: "Obrigada.", gender: "feminine", translation: "Thank you." }
        ]
      },
      {
        prompts: [{ text: "Adeus" }],
        replies: [{ text: "Adeus!" }, { text: "Até logo!", translation: "See you later!" }]
      }
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
    <div className="rounded-[1.5rem] bg-white p-4 sm:p-6">
      <p className="text-sm text-ink/65 sm:text-base">
        Listen to the greeting, then choose a natural European Portuguese reply.
      </p>

      <div className="mt-5 space-y-6">
        {responseGroups.map((group) => (
          <section key={group.title} aria-labelledby={`response-${group.title.replaceAll(" ", "-").toLowerCase()}`}>
            <h4
              id={`response-${group.title.replaceAll(" ", "-").toLowerCase()}`}
              className="text-lg font-bold text-ink"
            >
              {group.title}
            </h4>
            <div className="mt-3 space-y-3">
              {group.rows.map((row, index) => (
                <div
                  key={`${group.title}-${index}`}
                  className="grid gap-3 rounded-2xl border border-ink/10 bg-sand/35 p-3 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-start sm:p-4"
                >
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-ink/55">When you hear</p>
                    <div className="flex flex-wrap gap-2">
                      {row.prompts.map((option) => <PhraseButton key={`${option.text}-${option.gender ?? "general"}`} option={option} />)}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-ink/55">You can reply</p>
                    <div className="flex flex-wrap gap-2">
                      {row.replies.map((option) => <PhraseButton key={`${option.text}-${option.gender ?? "general"}`} option={option} />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
