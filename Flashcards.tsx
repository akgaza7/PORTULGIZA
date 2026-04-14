import { useState, useEffect, useCallback } from "react";
import { RotateCcw, ChevronLeft, ChevronRight, Check, Volume2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import type { Lesson } from "@/data/lessons";
import { useSpeech } from "@/hooks/useSpeech";
import { PT } from "@/lib/colors";
import { getGenderParts, GenderFormRow, GenderBadge, ColoredGenderWord } from "@/components/GenderWord";

export interface FlashcardResults {
  /** item.portuguese values answered correctly */
  correct: string[];
  /** item.portuguese values answered wrong */
  wrong: string[];
}

interface Props {
  lesson: Lesson;
  onComplete: (seen: number, results: FlashcardResults) => void;
  onBack: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildOptions(lesson: Lesson, correctIndex: number): [string, string[]] {
  const correct = lesson.items[correctIndex].english;
  const pool = lesson.items.filter((_, i) => i !== correctIndex).map((it) => it.english);
  const wrong = shuffle(pool).slice(0, 2);
  return [correct, shuffle([correct, ...wrong])];
}

export default function Flashcards({ lesson, onComplete, onBack }: Props) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seen, setSeen] = useState<Set<number>>(new Set());
  const [answer, setAnswer] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [correct, setCorrect] = useState<string>("");
  const [studying, setStudying] = useState(true);
  // Tracks the most-recent outcome for each card index (handles back-nav re-answers)
  const [outcomes, setOutcomes] = useState<Map<number, "correct" | "wrong">>(new Map());

  const { speak, speaking } = useSpeech();

  const item = lesson.items[index];
  const total = lesson.items.length;
  const pct = Math.round(((index + 1) / total) * 100);
  const revealed = answer !== null;
  const gotItRight = answer === correct;

  useEffect(() => {
    const [c, opts] = buildOptions(lesson, index);
    setCorrect(c);
    setOptions(opts);
    setAnswer(null);
    setFlipped(false);
    setStudying(true);
  }, [index, lesson]);

  // Auto-play voice whenever a new card loads in study phase
  useEffect(() => {
    if (!studying) return;
    const word = lesson.items[index]?.genderForms
      ? lesson.items[index].genderForms!.masculine.word
      : lesson.items[index]?.portuguese;
    if (!word) return;
    const t = setTimeout(() => speak(word), 400);
    return () => clearTimeout(t);
  }, [index, studying, lesson]);

  const flip = () => setFlipped((f) => !f);

  const next = () => {
    setSeen((s) => new Set([...s, index]));
    if (index + 1 >= total) {
      const correctWords = lesson.items
        .filter((_, i) => outcomes.get(i) === "correct")
        .map((it) => it.portuguese);
      const wrongWords = lesson.items
        .filter((_, i) => outcomes.get(i) === "wrong")
        .map((it) => it.portuguese);
      onComplete(total, { correct: correctWords, wrong: wrongWords });
      return;
    }
    setIndex((i) => i + 1);
  };

  const prev = () => {
    if (index === 0) return;
    setIndex((i) => i - 1);
  };

  const speakWord = item.genderForms ? item.genderForms.masculine.word : item.portuguese;

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(speakWord);
  };

  const chooseAnswer = useCallback((option: string) => {
    if (revealed) return;
    setAnswer(option);
    // Record outcome for this card (replaces any earlier answer if user went back)
    const outcome = option === correct ? "correct" : "wrong";
    setOutcomes((m) => new Map([...m, [index, outcome]]));
    if (option === correct) {
      speak(speakWord);
      setTimeout(() => setFlipped(true), 1100);
    } else {
      speak(speakWord);
    }
  }, [revealed, correct, speak, index, speakWord]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #FEFCE8 0%, #FEF9C3 60%, #FEF08A 100%)" }}>
      <AppHeader
        onBack={onBack}
        shrink
        right={
          <span className="text-sm text-slate-500 font-medium tabular-nums">{index + 1} / {total}</span>
        }
        bottom={
          <div className="w-full bg-slate-100 h-1.5">
            <div
              className="h-1.5 transition-all duration-300"
              style={{ width: `${pct}%`, backgroundColor: "#22c55e" }}
              data-testid="progress-bar-flashcard"
            />
          </div>
        }
      />

      <main className="flex-1 flex flex-col items-center px-4 py-6 max-w-lg mx-auto w-full">

        {/* ── Flashcard ── */}
        <div className="w-full mb-5" style={{ perspective: "1000px" }}>
          <div
            className="relative w-full transition-transform duration-500"
            style={{
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              minHeight: "240px",
            }}
            data-testid="button-flip-card"
          >

            {/* ── Front: PT word left · answer choices right ── */}
            <div
              className="absolute inset-0 rounded-3xl shadow-lg flex p-5 gap-3"
              style={{ backfaceVisibility: "hidden", backgroundColor: "#FFCC29", border: "2px solid #F59E0B" }}
            >
              {/* Left column — Portuguese (full width when studying) */}
              {item.genderForms ? (() => {
                const { masculine, feminine } = item.genderForms;
                const parts = getGenderParts(masculine.word, feminine.word);
                return (
                  <div className="flex flex-col justify-center flex-1 min-w-0 gap-2.5">
                    <GenderFormRow
                      prefix={parts.mascPrefix}
                      suffix={parts.mascSuffix}
                      gender="masculine"
                      pronunciation={masculine.pronunciation}
                      onSpeak={(e) => { e.stopPropagation(); speak(masculine.word); }}
                      speaking={speaking}
                      textSize="text-2xl"
                    />
                    <div className="border-t border-slate-100" />
                    <GenderFormRow
                      prefix={parts.femPrefix}
                      suffix={parts.femSuffix}
                      gender="feminine"
                      pronunciation={feminine.pronunciation}
                      onSpeak={(e) => { e.stopPropagation(); speak(feminine.word); }}
                      speaking={speaking}
                      textSize="text-2xl"
                    />
                  </div>
                );
              })() : (
                <div className="flex flex-col justify-center items-center flex-1 min-w-0 text-center">
                  {item.gender ? (
                    <ColoredGenderWord
                      word={item.portuguese}
                      gender={item.gender}
                      className="text-3xl font-bold leading-tight break-words"
                    />
                  ) : (
                    <p className="text-3xl font-bold leading-tight break-words" style={{ color: PT.green }}>
                      {item.portuguese}
                    </p>
                  )}
                  {item.pronunciation && (
                    <p className="text-sm italic mt-1 leading-snug font-semibold" style={{ color: "#166534" }}>
                      /{item.pronunciation}/
                    </p>
                  )}
                  {item.gender && (
                    <div className="mt-1.5">
                      <GenderBadge gender={item.gender} size="xs" />
                    </div>
                  )}
                  <button
                    onClick={handleSpeak}
                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 transition-all text-xs font-bold"
                    style={speaking
                      ? { backgroundColor: "#dcfce7", borderColor: PT.green, color: PT.green }
                      : { backgroundColor: "#f0fdf4", borderColor: "#86efac", color: PT.green }
                    }
                    data-testid="button-speak-front"
                    aria-label="Listen to pronunciation"
                  >
                    <Volume2 size={13} className={speaking ? "animate-pulse" : ""} />
                    {speaking ? "Playing…" : "Listen"}
                  </button>
                </div>
              )}

              {/* Right column — 3 answer choices (hidden during study phase) */}
              {!studying && <div className="flex flex-col gap-2 justify-center w-[46%] shrink-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-center mb-0.5" style={{ color: "#92400E" }}>
                  Which one is correct?
                </p>
                {options.map((opt, i) => {
                  const isSelected = answer === opt;
                  const isCorrectOpt = opt === correct;

                  let optStyle: React.CSSProperties = {
                    backgroundColor: "#ffffff",
                    borderColor: PT.green,
                    color: PT.green,
                  };
                  if (revealed) {
                    if (isCorrectOpt) {
                      optStyle = { backgroundColor: PT.greenBg, borderColor: PT.green, color: PT.green };
                    } else if (isSelected) {
                      optStyle = { backgroundColor: PT.redBg, borderColor: PT.red, color: PT.red, opacity: 0.9, textDecoration: "line-through" };
                    } else {
                      optStyle = { backgroundColor: "#F8FAFC", borderColor: "#E2E8F0", color: "#CBD5E1" };
                    }
                  }

                  return (
                    <button
                      key={opt + i}
                      onClick={() => chooseAnswer(opt)}
                      disabled={revealed}
                      className="py-2.5 px-3 rounded-2xl border-2 text-xs font-semibold text-left transition-all duration-200 leading-snug active:scale-[0.96] break-words"
                      style={optStyle}
                      data-testid={`answer-option-${i}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>}
            </div>

            {/* ── Back: PT + EN on same line ── */}
            <div
              className="absolute inset-0 rounded-3xl shadow-lg flex flex-col items-center justify-center p-7"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", backgroundColor: "#FFCC29", border: "2px solid #F59E0B" }}
            >
              <div className="flex items-baseline gap-3 flex-wrap justify-center mb-1">
                {item.genderForms ? (() => {
                  const { masculine, feminine } = item.genderForms;
                  const parts = getGenderParts(masculine.word, feminine.word);
                  return (
                    <>
                      <span className="text-3xl font-bold" style={{ color: PT.green }}>
                        {parts.mascPrefix}<span style={{ color: "#1e40af" }}>{parts.mascSuffix}</span>
                      </span>
                      <span className="text-2xl font-light" style={{ color: "#92400E" }}>/</span>
                      <span className="text-3xl font-bold" style={{ color: PT.green }}>
                        {parts.femPrefix}<span style={{ color: "#9f1239" }}>{parts.femSuffix}</span>
                      </span>
                    </>
                  );
                })() : item.gender ? (
                  <ColoredGenderWord
                    word={item.portuguese}
                    gender={item.gender}
                    className="text-3xl font-bold"
                  />
                ) : (
                  <span className="text-3xl font-bold" style={{ color: PT.green }}>
                    {item.portuguese}
                  </span>
                )}
                <span className="text-3xl font-bold" style={{ color: "#92400E" }}>
                  {item.english}
                </span>
              </div>
              {item.genderForms && (
                <div className="flex gap-2 mt-1 flex-wrap justify-center">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: "#dbeafe", color: PT.blue }}>♂ Male speech</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: "#fdecea", color: PT.red }}>♀ Female speech</span>
                </div>
              )}
              {item.gender && (
                <div className="mt-1">
                  <GenderBadge gender={item.gender} size="xs" />
                </div>
              )}

              {item.example && (
                <div className="mt-4 rounded-xl px-4 py-3 w-full" style={{ backgroundColor: "#FEF9C3", border: "1px solid #FDE68A" }}>
                  <p className="text-xs font-bold mb-1" style={{ color: "#92400E" }}>Example</p>
                  <p className="text-sm italic font-medium" style={{ color: PT.green }}>{item.example}</p>
                </div>
              )}

              <button
                onClick={handleSpeak}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all text-sm font-bold"
                style={speaking
                  ? { backgroundColor: "#dcfce7", borderColor: PT.green, color: PT.green }
                  : { backgroundColor: "#f0fdf4", borderColor: "#86efac", color: PT.green }
                }
                data-testid="button-speak-back"
                aria-label="Replay Portuguese pronunciation"
              >
                <Volume2 size={16} className={speaking ? "animate-pulse" : ""} />
                {speaking ? "Playing…" : "Replay Portuguese"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Study phase CTA ── */}
        {studying && (
          <div className="w-full flex flex-col items-center gap-2 mt-1 mb-2">
            <button
              onClick={() => setStudying(false)}
              className="w-full max-w-xs py-3.5 rounded-2xl font-black text-base tracking-wide shadow-md transition-all active:scale-[0.97]"
              style={{ backgroundColor: PT.green, color: "#FFCC29" }}
              data-testid="button-ready-to-answer"
            >
              I'm ready — test me →
            </button>
            <p className="text-xs text-slate-400">Tap when you know the word</p>
          </div>
        )}

        {/* ── Wrong-answer feedback ── */}
        {!studying && revealed && !gotItRight && (
          <div className="w-full mb-4 feedback-reveal text-center">
            <p className="text-sm text-slate-500">
              Correct answer:{" "}
              <span className="font-bold" style={{ color: PT.green }}>{correct}</span>
            </p>
          </div>
        )}

        {/* ── Nav controls (hidden during study phase) ── */}
        {!studying && (
          <div className="flex items-center gap-4 w-full justify-center">
            <button
              onClick={prev}
              disabled={index === 0}
              className="p-3 rounded-2xl bg-white shadow-sm border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
              data-testid="button-prev-card"
            >
              <ChevronLeft size={22} className="text-slate-600" />
            </button>

            <button
              onClick={flip}
              className="px-6 py-3 rounded-2xl bg-white shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-2 text-slate-600 font-medium"
              data-testid="button-flip-card-bottom"
            >
              <RotateCcw size={16} />
              Flip
            </button>

            {index + 1 < total ? (
              <button
                onClick={next}
                className="p-3 rounded-2xl shadow-sm border text-white transition-colors"
                style={{ backgroundColor: "#22c55e", borderColor: "#22c55e" }}
                data-testid="button-next-card"
              >
                <ChevronRight size={22} />
              </button>
            ) : (
              <button
                onClick={next}
                className="p-3 rounded-2xl shadow-sm border text-white transition-colors bg-green-500 border-green-500"
                data-testid="button-finish-flashcards"
              >
                <Check size={22} />
              </button>
            )}
          </div>
        )}

        <p className="mt-5 text-xs text-slate-400">
          {seen.size + 1} reviewed · {total - seen.size - 1} remaining
        </p>
      </main>
    </div>
  );
}
