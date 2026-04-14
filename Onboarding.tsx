import { useState } from "react";
import { ArrowLeft, ChevronRight, BookOpen, Zap } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import type { Level } from "@/store/onboarding";

interface Props {
  onComplete: (level: Level) => void;
  onBack: () => void;
}

export default function Onboarding({ onComplete, onBack }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [animating, setAnimating] = useState(false);

  const animate = (fn: () => void) => {
    setAnimating(true);
    setTimeout(() => {
      fn();
      setAnimating(false);
    }, 200);
  };

  const goToStep2 = () => animate(() => setStep(2));
  const goToStep1 = () => animate(() => setStep(1));

  const finish = () => {
    if (!selectedLevel) return;
    onComplete(selectedLevel);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      <AppHeader sticky={false} />

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div
          className="w-full max-w-sm transition-all duration-200"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating ? "translateY(10px)" : "translateY(0)",
          }}
        >
          {step === 1 ? (
            <StepWelcome onNext={goToStep2} onBack={onBack} />
          ) : (
            <StepLevel
              selected={selectedLevel}
              onSelect={setSelectedLevel}
              onFinish={finish}
              onBack={goToStep1}
            />
          )}
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-2 mt-10">
          {([1, 2] as const).map((s) => (
            <div
              key={s}
              className="rounded-full transition-all duration-300"
              style={{
                width: step === s ? 20 : 8,
                height: 8,
                backgroundColor: step === s ? "#2563eb" : "#cbd5e1",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Back button ──────────────────────────────────────────────────────────────

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      className="mb-5 flex items-center justify-center w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 active:opacity-60 transition-all -ml-1"
      aria-label="Go back"
      data-testid="button-onboarding-back"
    >
      <ArrowLeft size={20} className="text-slate-600" />
    </button>
  );
}

// ─── Step 1: Welcome ──────────────────────────────────────────────────────────

function StepWelcome({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div>
      <BackButton onBack={onBack} />

      <div className="text-center">
        <div className="flex items-center justify-center mb-8">
          <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-200">
            <span className="text-5xl">🇵🇹</span>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-800 mb-3 tracking-tight">
          Welcome to<br />
          <span className="text-blue-600">PORTULGIZA</span>
        </h1>

        <p className="text-slate-500 text-base leading-relaxed mb-10">
          Learn Portuguese in a fun<br />and simple way.
        </p>

        <div className="space-y-3 mb-10 text-left">
          {[
            { icon: "🎴", text: "Flashcards with real pronunciation" },
            { icon: "🧠", text: "Quizzes to test your knowledge" },
            { icon: "🔥", text: "Daily challenges to build a streak" },
            { icon: "🔊", text: "Hear authentic European Portuguese" },
          ].map((f) => (
            <div key={f.text} className="flex items-center gap-3 bg-white/80 rounded-2xl px-4 py-3 shadow-sm border border-slate-100">
              <span className="text-xl">{f.icon}</span>
              <p className="text-sm font-medium text-slate-700">{f.text}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onNext}
          className="w-full py-4 rounded-3xl bg-blue-600 text-white font-bold text-base shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
          data-testid="button-onboarding-next"
        >
          Let's get started
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Level selection ──────────────────────────────────────────────────

function StepLevel({
  selected,
  onSelect,
  onFinish,
  onBack,
}: {
  selected: Level | null;
  onSelect: (l: Level) => void;
  onFinish: () => void;
  onBack: () => void;
}) {
  const levels: {
    key: Level;
    icon: React.ReactNode;
    label: string;
    description: string;
    detail: string;
    color: string;
    bg: string;
    border: string;
  }[] = [
    {
      key: "beginner",
      icon: <BookOpen size={28} className="text-green-600" />,
      label: "Getting Started",
      description: "I'm new to Portuguese",
      detail: "Pronunciation guides, slower audio, tips for every word",
      color: "text-green-700",
      bg: "bg-green-50",
      border: "border-green-400",
    },
    {
      key: "intermediate",
      icon: <Zap size={28} className="text-blue-600" />,
      label: "Intermediate",
      description: "I know some Portuguese",
      detail: "Timed challenges, harder quizzes, fewer hints",
      color: "text-blue-700",
      bg: "bg-blue-50",
      border: "border-blue-400",
    },
  ];

  return (
    <div>
      <BackButton onBack={onBack} />

      <div className="text-center mb-8">
        <div className="text-4xl mb-4">🎯</div>
        <h2 className="text-2xl font-extrabold text-slate-800 mb-2">
          What's your level?
        </h2>
        <p className="text-slate-500 text-sm">
          We'll personalise your experience.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {levels.map((lvl) => {
          const isSelected = selected === lvl.key;
          return (
            <button
              key={lvl.key}
              onClick={() => onSelect(lvl.key)}
              className={`w-full text-left rounded-3xl p-5 border-2 transition-all duration-150 ${
                isSelected
                  ? `${lvl.bg} ${lvl.border} shadow-md scale-[1.01]`
                  : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm active:scale-[0.98]"
              }`}
              data-testid={`button-level-${lvl.key}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    isSelected ? lvl.bg : "bg-slate-50"
                  }`}
                >
                  {lvl.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`font-bold text-base ${isSelected ? lvl.color : "text-slate-800"}`}>
                      {lvl.label}
                    </p>
                    {isSelected && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${lvl.bg} ${lvl.color}`}>
                        Selected ✓
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{lvl.description}</p>
                  {isSelected && (
                    <p className={`text-xs mt-1.5 font-medium ${lvl.color}`}>{lvl.detail}</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={onFinish}
        disabled={!selected}
        className={`w-full py-4 rounded-3xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
          selected
            ? "bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.97]"
            : "bg-slate-100 text-slate-400 cursor-not-allowed"
        }`}
        data-testid="button-onboarding-finish"
      >
        Start learning
        {selected && <ChevronRight size={20} />}
      </button>
    </div>
  );
}
