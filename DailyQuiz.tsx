import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, CheckCircle, XCircle, Flame } from "lucide-react";
import { lessons } from "@/data/lessons";
import type { DailyQuestionKey } from "@/store/daily";
import { mergeProficiency } from "@/store/progress";
import { useSpeech } from "@/hooks/useSpeech";
import { useSound } from "@/hooks/useSound";
import { Volume2 } from "lucide-react";
import { PT } from "@/lib/colors";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface MCQQuestion {
  lessonId: string;
  portuguese: string;
  english: string;
  pronunciation?: string;
  correct: string;
  options: string[];
  direction: "pt-to-en" | "en-to-pt";
}

// ─── Build MCQ questions from keys ────────────────────────────────────────────

function buildDailyQuestions(keys: DailyQuestionKey[]): MCQQuestion[] {
  // Flat pool for distractors
  const allEnglish = lessons.flatMap((l) => l.items.map((i) => i.english));
  const allPortuguese = lessons.flatMap((l) => l.items.map((i) => i.portuguese));

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  return keys.map(({ lessonId, itemIndex }) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return null;
    const item = lesson.items[itemIndex];
    if (!item) return null;

    const dir: "pt-to-en" | "en-to-pt" = Math.random() > 0.5 ? "pt-to-en" : "en-to-pt";

    if (dir === "pt-to-en") {
      const wrong = shuffle(allEnglish.filter((e) => e !== item.english)).slice(0, 3);
      return {
        lessonId,
        portuguese: item.portuguese,
        english: item.english,
        pronunciation: item.pronunciation,
        correct: item.english,
        options: shuffle([item.english, ...wrong]),
        direction: dir,
      };
    } else {
      const wrong = shuffle(allPortuguese.filter((p) => p !== item.portuguese)).slice(0, 3);
      return {
        lessonId,
        portuguese: item.portuguese,
        english: item.english,
        pronunciation: item.pronunciation,
        correct: item.portuguese,
        options: shuffle([item.portuguese, ...wrong]),
        direction: dir,
      };
    }
  }).filter(Boolean) as MCQQuestion[];
}

// ─── Option button ────────────────────────────────────────────────────────────

function OptionBtn({
  option, selected, correct, onChoose, index
}: {
  option: string; selected: string | null; correct: string;
  onChoose: (o: string) => void; index: number;
}) {
  const isSelected = selected === option;
  const isCorrect = option === correct;
  const revealed = selected !== null;

  const baseBtn = "w-full text-left px-4 py-4 rounded-3xl border-2 text-sm font-semibold transition-all duration-200 ";
  let cls = baseBtn;
  let inlineStyle: React.CSSProperties = {};
  if (!revealed) {
    cls += "bg-white border-slate-200 text-slate-700 active:scale-[0.97]";
    inlineStyle = {};
  } else if (isCorrect) {
    inlineStyle = { backgroundColor: PT.greenBg, borderColor: PT.green, color: PT.green };
  } else if (isSelected) {
    inlineStyle = { backgroundColor: PT.redBg, borderColor: PT.red, color: PT.red };
  } else {
    cls += "bg-white border-slate-100 text-slate-400 opacity-50";
  }

  return (
    <div
      className="relative"
      style={{
        transform: revealed && isCorrect ? "scale(1.015)" : "scale(1)",
        transition: "transform 0.2s ease",
      }}
    >
      <button
        onClick={() => onChoose(option)}
        className={cls}
        style={inlineStyle}
        disabled={revealed}
        data-testid={`daily-option-${index}`}
      >
        <span className="pr-8">{option}</span>
      </button>
      {revealed && isCorrect && (
        <CheckCircle size={20} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: PT.green }} />
      )}
      {revealed && isSelected && !isCorrect && (
        <XCircle size={20} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: PT.red }} />
      )}
    </div>
  );
}

// ─── DailyQuiz ────────────────────────────────────────────────────────────────

interface Props {
  questionKeys: DailyQuestionKey[];
  currentStreak: number;
  onComplete: (score: number) => void;
  onBack: () => void;
}

export default function DailyQuiz({ questionKeys, currentStreak, onComplete, onBack }: Props) {
  const [questions] = useState<MCQQuestion[]>(() => buildDailyQuestions(questionKeys));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [outcomes, setOutcomes] = useState<Array<"correct" | "wrong">>([]);
  const { speak, speaking } = useSpeech();
  const { playCorrect, playWrong, playClapping } = useSound();

  useEffect(() => {
    if (finished && score === questions.length) {
      playClapping();
    }
  }, [finished, score, questions.length, playClapping]);

  const q = questions[index];

  const choose = useCallback((option: string) => {
    if (selected !== null) return;
    setSelected(option);
    if (option === q.correct) {
      setScore((s) => s + 1);
      setOutcomes((o) => [...o, "correct"]);
      playCorrect();
      speak("Perfeito!");
    } else {
      setOutcomes((o) => [...o, "wrong"]);
      playWrong();
      speak("Boa tentativa — vamos outra vez.");
    }
  }, [selected, q, playCorrect, playWrong, speak]);

  const next = () => {
    if (index + 1 >= questions.length) {
      const finalOutcomes = [...outcomes];
      const grouped: Record<string, { correct: string[]; wrong: string[] }> = {};
      questions.forEach((question, i) => {
        if (!grouped[question.lessonId]) grouped[question.lessonId] = { correct: [], wrong: [] };
        if (finalOutcomes[i] === "correct") grouped[question.lessonId].correct.push(question.portuguese);
        else grouped[question.lessonId].wrong.push(question.portuguese);
      });
      Object.entries(grouped).forEach(([lessonId, { correct, wrong }]) => {
        mergeProficiency(lessonId, correct, wrong);
      });
      onComplete(Math.min(score, questions.length));
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  };

  const pct = Math.round(((index + 1) / questions.length) * 100);

  // ── Results ──
  if (finished) {
    const finalScore = score;
    const pctScore = Math.round((finalScore / questions.length) * 100);
    const isPerfect = pctScore === 100;
    const newStreak = currentStreak + 1;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: `linear-gradient(135deg, ${PT.goldBg}, #fff9e0)` }}>
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 max-w-sm w-full text-center">

          {/* Streak badge */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div
              className="flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm"
              style={{ backgroundColor: PT.goldBg, border: `1px solid ${PT.goldBorder}`, color: PT.goldText }}
            >
              <Flame size={16} style={{ color: PT.gold }} />
              🔥 Day {newStreak} streak!
            </div>
          </div>

          {/* Animated result emoji */}
          <div
            className={isPerfect ? "animate-celebration" : "animate-encouragement"}
            style={{ fontSize: "68px", lineHeight: 1, marginBottom: "14px" }}
          >
            {isPerfect ? "👏" : "😉"}
          </div>

          <h2 className="text-xl font-bold text-slate-800 mb-1">
            {isPerfect ? "Excellent! You got them all right 👏" : "Good try — you can do it! 😉"}
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            {isPerfect ? "A perfect daily score! Impressive." : "Come back tomorrow and keep building your streak."}
          </p>

          <div className="text-5xl font-extrabold mb-2" style={{ color: PT.goldText }}>
            {finalScore}/{questions.length}
          </div>
          <div className="text-sm text-slate-500 mb-5">{pctScore}% correct</div>

          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-8">
            <div
              className="h-2.5 rounded-full transition-all duration-700"
              style={{ width: `${pctScore}%`, backgroundColor: PT.gold }}
            />
          </div>

          <div
            className="rounded-2xl px-4 py-3 mb-6 text-sm font-medium"
            style={{ backgroundColor: PT.goldBg, border: `1px solid ${PT.goldBorder}`, color: PT.goldText }}
          >
            Come back tomorrow to continue your streak 🌟
          </div>

          <button
            onClick={onBack}
            className="w-full py-3 rounded-3xl text-white font-bold text-sm transition-colors"
            style={{ backgroundColor: PT.gold, color: "#1a1000" }}
            data-testid="button-daily-done"
          >
            {isPerfect ? "Keep going →" : "Back to Home"}
          </button>
        </div>
      </div>
    );
  }

  // ── Quiz ──
  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${PT.goldBg}, #ffffff)` }}>
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-2xl hover:bg-slate-100 transition-colors"
            data-testid="button-back-daily"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold" style={{ color: PT.blue }}>Daily Challenge</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Flame size={12} style={{ color: PT.gold }} />
              <p className="text-xs font-semibold" style={{ color: PT.goldText }}>
                {currentStreak > 0 ? `🔥 ${currentStreak}-day streak` : "Start your streak!"}
              </p>
            </div>
          </div>
          <span className="text-sm text-slate-500 font-medium">{index + 1} / {questions.length}</span>
        </div>
        <div className="w-full bg-slate-100 h-1.5">
          <div
            className="h-1.5 transition-all duration-300"
            style={{ width: `${pct}%`, backgroundColor: PT.gold }}
            data-testid="progress-bar-daily"
          />
        </div>
      </header>

      <main className="flex-1 flex flex-col px-4 py-5 max-w-lg mx-auto w-full">
        {/* Question card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-5 mt-2">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-3">
            {q.direction === "pt-to-en" ? "What does this mean in English?" : "How do you say this in Portuguese?"}
          </p>
          <div className="flex items-start gap-3">
            <p className="text-2xl font-bold text-slate-800 flex-1">
              {q.direction === "pt-to-en" ? q.portuguese : q.english}
            </p>
            {q.direction === "pt-to-en" && (
              <button
                onClick={() => speak(q.portuguese)}
                className="mt-1 p-2.5 rounded-2xl border-2 transition-all shrink-0"
              style={speaking
                ? { backgroundColor: PT.goldBg, borderColor: PT.goldBorder, color: PT.goldText }
                : { backgroundColor: "#f8fafc", borderColor: "#e2e8f0", color: "#94a3b8" }
              }
                data-testid="button-speak-daily"
                aria-label="Listen"
              >
                <Volume2 size={18} className={speaking ? "animate-pulse" : ""} />
              </button>
            )}
          </div>
          {q.direction === "pt-to-en" && q.pronunciation && (
            <p className="text-sm text-slate-400 italic mt-1">/{q.pronunciation}/</p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-2.5 mb-5">
          {q.options.map((option, i) => (
            <OptionBtn key={option} option={option} selected={selected} correct={q.correct} onChoose={choose} index={i} />
          ))}
        </div>

        {selected !== null && (
          <button
            onClick={next}
            className="w-full py-4 rounded-3xl font-bold text-sm transition-all active:scale-[0.98]"
            style={{ backgroundColor: PT.gold, color: "#1a1000" }}
            data-testid="button-next-daily"
          >
            {index + 1 < questions.length ? "Next Question →" : "See Results"}
          </button>
        )}
      </main>
    </div>
  );
}
