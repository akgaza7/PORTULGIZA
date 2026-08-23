"use client";

import Image from "next/image";
import { avatarDetails, type AvatarPreference, useAvatarPreference } from "@/lib/avatar-preference";

type AvatarChoiceProps = {
  compact?: boolean;
};

const avatarOptions: AvatarPreference[] = ["female", "male"];

const genderGuidance: Record<AvatarPreference, { heading: string; description: string }> = {
  female: {
    heading: "Feminine forms",
    description: "Inês helps you recognise feminine words."
  },
  male: {
    heading: "Masculine forms",
    description: "Tiago helps you recognise masculine words."
  }
};

export function AvatarChoice({ compact = false }: AvatarChoiceProps) {
  const { avatar, setAvatar } = useAvatarPreference();

  return (
    <section
      className={compact ? "rounded-[1.5rem] border border-ocean/10 bg-white/85 p-4" : "card-surface p-5 sm:p-6"}
      aria-labelledby={compact ? "lesson-avatar-choice" : "avatar-choice"}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div>
          <p className="eyebrow">Your learning guide</p>
          <h2
            id={compact ? "lesson-avatar-choice" : "avatar-choice"}
            className={`mt-2 font-display font-bold tracking-tight ${compact ? "text-2xl" : "text-3xl sm:text-4xl"}`}
          >
            Choose your avatar
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
            Choose Inês or Tiago as your guide. You can change this at any time.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3" role="group" aria-label="Choose a learning avatar">
          {avatarOptions.map((option) => {
            const details = avatarDetails[option];
            const guidance = genderGuidance[option];
            const selected = avatar === option;

            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => setAvatar(option)}
                className={`avatar-choice-option flex min-w-72 items-center gap-3 rounded-2xl border p-2 pr-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean ${
                  selected
                    ? "border-portugalGreen bg-portugalGreen/10 shadow-sm"
                    : "border-ocean/10 bg-white hover:border-ocean/30"
                }`}
              >
                <span
                  className={`avatar-choice-portrait relative h-[3.54rem] w-[3.54rem] shrink-0 overflow-hidden rounded-full bg-sand ${
                    selected ? "avatar-choice-portrait--selected" : ""
                  }`}
                >
                  <Image
                    src={details.image}
                    alt=""
                    fill
                    sizes="57px"
                    className={`object-cover ${details.imagePosition}`}
                  />
                </span>
                <span>
                  <span className="block text-sm font-bold text-ink">{details.name}</span>
                  <span className="block text-xs text-ink/55">{details.label}</span>
                  <span className={`mt-1 block text-xs font-bold ${option === "female" ? "text-portugalRed" : "text-ocean"}`}>
                    {guidance.heading}
                  </span>
                  <span className="mt-0.5 block max-w-44 text-[0.7rem] leading-4 text-ink/60">
                    {guidance.description}
                  </span>
                </span>
                <span className={`ml-auto grid h-5 w-5 place-items-center rounded-full border text-xs ${selected ? "border-portugalGreen bg-portugalGreen text-white" : "border-ink/20 text-transparent"}`} aria-hidden="true">
                  ✓
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
}
