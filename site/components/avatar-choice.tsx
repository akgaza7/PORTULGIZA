"use client";

import Image from "next/image";
import { avatarDetails, type AvatarPreference, useAvatarPreference } from "@/lib/avatar-preference";

type AvatarChoiceProps = {
  compact?: boolean;
};

const avatarOptions: AvatarPreference[] = ["female", "male"];

const genderGuidance: Record<AvatarPreference, string> = {
  female: "Inês guides feminine words",
  male: "Tiago guides masculine words"
};

export function AvatarChoice({ compact = false }: AvatarChoiceProps) {
  const { avatar, setAvatar } = useAvatarPreference();

  return (
    <section
      className={compact ? "rounded-[1.5rem] border border-ocean/10 bg-white/85 p-4" : "card-surface p-5 sm:p-6"}
      aria-label="Choose a learning avatar"
    >
      <div className="flex flex-col items-center gap-4 text-center">
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
                  <span className={`mt-1 block text-xs font-bold ${option === "female" ? "text-portugalRed" : "text-ocean"}`}>
                    {guidance}
                  </span>
                </span>
                <span className={`ml-auto grid h-5 w-5 place-items-center rounded-full border text-xs ${selected ? "border-portugalGreen bg-portugalGreen text-white" : "border-ink/20 text-transparent"}`} aria-hidden="true">
                  ✓
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs font-medium text-ink/60">You will see them during your lessons.</p>
      </div>
    </section>
  );
}
