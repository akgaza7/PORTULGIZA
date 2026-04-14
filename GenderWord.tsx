import { Volume2 } from "lucide-react";
import { PT } from "@/lib/colors";

// ─── Colour helpers ────────────────────────────────────────────────────────────

const MASC_BG = "#dbeafe";
const FEM_BG  = "#fdecea";

/**
 * Given a masculine and feminine word pair, compute:
 * - the rendered prefix for each form
 * - the suffix that changed (displayed in the gender colour)
 *
 * Examples:
 *   "Um"   / "Uma"   → mascPrefix:"U",  mascSuffix:"m",   femPrefix:"Um",  femSuffix:"a"
 *   "Dois" / "Duas"  → mascPrefix:"D",  mascSuffix:"ois", femPrefix:"D",   femSuffix:"uas"
 *   "obrigado" / "obrigada" → mascPrefix:"obrigad", mascSuffix:"o", femPrefix:"obrigad", femSuffix:"a"
 */
export function getGenderParts(masculine: string, feminine: string) {
  let i = 0;
  while (i < masculine.length && i < feminine.length && masculine[i] === feminine[i]) i++;

  const common     = masculine.slice(0, i);
  let mascSuffix   = masculine.slice(i);
  const femSuffix  = feminine.slice(i);

  if (mascSuffix === "" && common.length > 0) {
    return {
      mascPrefix: common.slice(0, -1),
      mascSuffix: common.slice(-1),
      femPrefix:  common,
      femSuffix,
    };
  }

  return { mascPrefix: common, mascSuffix, femPrefix: common, femSuffix };
}

// ─── Badge ─────────────────────────────────────────────────────────────────────

export function GenderBadge({ gender, size = "sm" }: { gender: "masculine" | "feminine"; size?: "sm" | "xs" }) {
  const isMasc = gender === "masculine";
  const sizeClass = size === "xs" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5";
  return (
    <span
      className={`font-bold rounded-md leading-5 inline-block ${sizeClass}`}
      style={{ backgroundColor: isMasc ? MASC_BG : FEM_BG, color: isMasc ? PT.blue : PT.red }}
    >
      {isMasc ? "♂ Male speech" : "♀ Female speech"}
    </span>
  );
}

// ─── Single-gender word with coloured last letter ──────────────────────────────

export function ColoredGenderWord({
  word,
  gender,
  className = "font-semibold text-slate-800",
}: {
  word: string;
  gender: "masculine" | "feminine";
  className?: string;
}) {
  const color = gender === "masculine" ? PT.blue : PT.red;
  return (
    <span className={className}>
      {word.slice(0, -1)}
      <span style={{ color }}>{word.slice(-1)}</span>
    </span>
  );
}

// ─── One row in the split gender display (flashcard front / vocab list) ─────────

export function GenderFormRow({
  prefix,
  suffix,
  gender,
  pronunciation,
  onSpeak,
  speaking,
  textSize = "text-2xl",
}: {
  prefix: string;
  suffix: string;
  gender: "masculine" | "feminine";
  pronunciation?: string;
  onSpeak: (e: React.MouseEvent) => void;
  speaking: boolean;
  textSize?: string;
}) {
  const isMasc = gender === "masculine";
  const color  = isMasc ? PT.blue : PT.red;
  const bg     = isMasc ? MASC_BG : FEM_BG;

  return (
    <div>
      <p className={`${textSize} font-bold leading-tight text-slate-800`}>
        {prefix}
        <span style={{ color }}>{suffix}</span>
      </p>
      {pronunciation && (
        <p className="text-xs text-slate-400 italic mt-0.5">/{pronunciation}/</p>
      )}
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-md"
          style={{ backgroundColor: bg, color }}
        >
          {isMasc ? "♂ Male speech" : "♀ Female speech"}
        </span>
        <button
          onClick={onSpeak}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium transition-all ${
            speaking
              ? "bg-blue-50 border-blue-300 text-blue-600"
              : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
          }`}
          aria-label={`Hear ${isMasc ? "male" : "female"} pronunciation`}
        >
          <Volume2 size={11} className={speaking ? "animate-pulse" : ""} />
          Hear
        </button>
      </div>
    </div>
  );
}

// ─── Compact paired display for vocab list rows ────────────────────────────────

export function GenderPairInline({
  masculine,
  feminine,
}: {
  masculine: string;
  feminine: string;
}) {
  const { mascPrefix, mascSuffix, femPrefix, femSuffix } = getGenderParts(masculine, feminine);
  return (
    <span className="font-semibold text-slate-800">
      {mascPrefix}
      <span style={{ color: PT.blue }}>{mascSuffix}</span>
      {" / "}
      {femPrefix}
      <span style={{ color: PT.red }}>{femSuffix}</span>
    </span>
  );
}
