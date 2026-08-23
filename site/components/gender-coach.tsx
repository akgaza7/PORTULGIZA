import Image from "next/image";
import type { GenderCue } from "@/lib/lesson-data";

type GenderCoachProps = {
  phrase: {
    portuguese: string;
    genderCue?: GenderCue;
  };
};

const kindLabels: Record<GenderCue["appliesTo"], string> = {
  noun: "Grammatical gender",
  speaker: "Speaker form",
  listener: "Listener form",
  agreement: "Gender agreement"
};

export function GenderedPhrase({ phrase }: GenderCoachProps) {
  const cue = phrase.genderCue;
  if (!cue) return <>{phrase.portuguese}</>;

  const index = phrase.portuguese.toLocaleLowerCase("pt-PT").indexOf(cue.word.toLocaleLowerCase("pt-PT"));
  if (index < 0) return <>{phrase.portuguese}</>;

  return (
    <>
      {phrase.portuguese.slice(0, index)}
      <mark
        className={`rounded px-1 text-inherit ${cue.gender === "masculine" ? "bg-portugalBlue/15" : "bg-portugalRed/15"}`}
      >
        {phrase.portuguese.slice(index, index + cue.word.length)}
      </mark>
      {phrase.portuguese.slice(index + cue.word.length)}
    </>
  );
}

export function GenderCoach({ phrase }: GenderCoachProps) {
  const cue = phrase.genderCue;
  if (!cue) return null;

  const masculine = cue.gender === "masculine";
  const avatarSource = masculine ? "/portulgiza-male-avatar.webp" : "/portulgiza-hero.webp";
  const genderLabel = masculine ? "Masculine" : "Feminine";
  const opening = cue.appliesTo === "noun"
    ? `Yes — ${cue.word} is a ${cue.gender} noun.`
    : cue.appliesTo === "speaker"
      ? `Yes — this form changes with the speaker.`
      : cue.appliesTo === "listener"
        ? `Yes — this form changes with the person you are speaking to.`
        : `Yes — use the ${cue.gender} form here.`;

  return (
    <aside
      className={`mt-4 flex items-center gap-4 rounded-2xl border p-3 ${
        masculine ? "border-portugalBlue/15 bg-portugalBlue/5" : "border-portugalRed/15 bg-portugalRed/5"
      }`}
      aria-label={`${genderLabel} gender coach`}
    >
      <div className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 ${masculine ? "border-portugalBlue" : "border-portugalRed"}`}>
        <Image
          src={avatarSource}
          alt={masculine ? "Male Portulgiza gender coach" : "Female Portulgiza gender coach"}
          fill
          sizes="64px"
          className={`object-cover ${masculine ? "object-center" : "object-[50%_38%]"}`}
        />
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs font-bold uppercase tracking-[0.12em] ${masculine ? "text-portugalBlue" : "text-portugalRed"}`}>
            {genderLabel}
          </span>
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink/45">
            {kindLabels[cue.appliesTo]}
          </span>
        </div>
        <p className="mt-1 text-sm font-semibold text-ink">{opening}</p>
        <p className="mt-1 text-xs leading-5 text-ink/60">{cue.explanation}</p>
        {cue.counterpart ? (
          <p className="mt-1 text-xs font-bold text-ink/65">Paired form: {cue.counterpart}</p>
        ) : null}
      </div>
    </aside>
  );
}
