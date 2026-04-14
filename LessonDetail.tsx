import { useState, useCallback, useRef, useEffect } from "react";
import carImg from "@assets/Car_1775995617306.jpg";
import { useParams, useLocation } from "wouter";
import { lessons } from "@/data/lessons";
import { updateLessonProgress, useProgress, mergeProficiency } from "@/store/progress";
import { ChevronRight, User, Users, Volume2, Timer, Mic } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import AppHeader from "@/components/AppHeader";
import Flashcards, { type FlashcardResults } from "@/components/Flashcards";
import Quiz, { type QuizMode } from "@/components/Quiz";
import { useSpeech } from "@/hooks/useSpeech";
import UpgradeScreen from "@/components/UpgradeScreen";
import { useAuth } from "@/store/authContext";
import { hasFullAccess, isTrialActive } from "@/store/auth";
import { PT } from "@/lib/colors";
import { GenderPairInline, GenderBadge, ColoredGenderWord } from "@/components/GenderWord";
import WordPracticeButton from "@/components/WordPracticeButton";

type Mode = "overview" | "flashcards" | "quiz-select" | "quiz" | "retry";

export default function LessonDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const lesson = lessons.find((l) => l.id === id);
  const lessonIndex = lessons.findIndex((l) => l.id === id);
  const [mode, setMode] = useState<Mode>("overview");
  const [quizMode, setQuizMode] = useState<QuizMode>("single");
  const [retryWords, setRetryWords] = useState<string[]>([]);
  const { progress, refresh: refreshProgress } = useProgress();
  const { speak } = useSpeech();
  const { user, refresh: refreshAuth } = useAuth();
  const p = progress[id ?? ""];

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Lesson not found.</p>
      </div>
    );
  }

  // Access control — first lesson is always free, rest require full access
  const isLocked = lessonIndex > 0 && user !== null && !hasFullAccess(user);
  if (isLocked) {
    return (
      <UpgradeScreen
        isExpired={user ? !isTrialActive(user) : true}
        onSubscribed={() => { refreshAuth(); }}
        onDismiss={() => navigate("/")}
      />
    );
  }

  const handleFlashcardsComplete = (seen: number, results: FlashcardResults) => {
    updateLessonProgress(lesson.id, {
      completedCards: seen,
      totalCards: lesson.items.length,
      flashcardCorrect: results.correct,
      flashcardWrong: results.wrong,
    });
    mergeProficiency(lesson.id, results.correct, results.wrong);
    refreshProgress();
    setMode("overview");
  };

  const handleRetryComplete = (_seen: number, results: FlashcardResults) => {
    mergeProficiency(lesson.id, results.correct, results.wrong);
    refreshProgress();
    setMode("overview");
  };

  const handleQuizComplete = (score: number, total: number, correct: string[], wrong: string[]) => {
    updateLessonProgress(lesson.id, { quizScore: score, quizTotal: total });
    mergeProficiency(lesson.id, correct, wrong);
    refreshProgress();
    setMode("overview");
  };

  const startQuiz = (selectedMode: QuizMode) => {
    setQuizMode(selectedMode);
    setMode("quiz");
  };

  const startRetry = (words?: string[]) => {
    const targets = words ?? p?.practiceWords ?? p?.flashcardWrong ?? [];
    if (targets.length === 0) return;
    setRetryWords(targets);
    setMode("retry");
  };

  if (mode === "flashcards") {
    return <Flashcards lesson={lesson} onComplete={handleFlashcardsComplete} onBack={() => setMode("overview")} />;
  }

  if (mode === "retry") {
    const retryLesson = { ...lesson, items: lesson.items.filter((it) => retryWords.includes(it.portuguese)) };
    if (retryLesson.items.length === 0) { setMode("overview"); return null; }
    return <Flashcards lesson={retryLesson} onComplete={handleRetryComplete} onBack={() => setMode("overview")} />;
  }

  if (mode === "quiz") {
    return <Quiz lesson={lesson} mode={quizMode} onComplete={handleQuizComplete} onBack={() => setMode("overview")} />;
  }

  // ── Quiz mode selection ──
  if (mode === "quiz-select") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
        <AppHeader
          onBack={() => setMode("overview")}
          right={
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-base leading-none">{lesson.icon}</span>
              <span className="text-sm font-semibold text-slate-700" data-testid="button-back-quiz-select">Quiz Mode</span>
            </div>
          }
        />

        <main className="flex-1 flex flex-col justify-center px-4 py-8 max-w-lg mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black uppercase tracking-widest text-slate-800 leading-tight">
              Take The Quiz
            </h1>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mt-1">Choose</p>
          </div>

          <div className="w-full space-y-3">
            {/* SINGLE PLAYER */}
            <button
              onClick={() => startQuiz("single")}
              className="w-full rounded-3xl p-5 shadow-sm border-2 transition-all active:scale-[0.98] flex items-center gap-5 text-left"
              style={{ backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }}
              data-testid="button-mode-single"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                <User size={26} style={{ color: PT.blue }} />
              </div>
              <div className="flex-1">
                <p className="font-black text-lg uppercase tracking-wide leading-none" style={{ color: PT.blue }}>
                  Single Player
                </p>
                <p className="text-xs text-slate-500 mt-1">10 questions · track your score and streak</p>
              </div>
              <ChevronRight size={18} className="text-blue-300" />
            </button>

            {/* TIMED SINGLE */}
            <button
              onClick={() => startQuiz("timed")}
              className="w-full bg-white rounded-3xl p-5 shadow-sm border-2 border-slate-100 transition-all active:scale-[0.98] flex items-center gap-5 text-left"
              data-testid="button-mode-timed"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                <Timer size={26} className="text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-base text-slate-700 leading-none">Timed Single ⏱</p>
                <p className="text-xs text-slate-500 mt-1">8 seconds per question · beat the clock</p>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </button>

            {/* TWO PLAYERS */}
            <button
              onClick={() => startQuiz("two-player")}
              className="w-full rounded-3xl p-5 shadow-sm border-2 transition-all active:scale-[0.98] flex items-center gap-5 text-left"
              style={{ backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }}
              data-testid="button-mode-two-player"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#DCFCE7" }}>
                <Users size={26} style={{ color: PT.green }} />
              </div>
              <div className="flex-1">
                <p className="font-black text-lg uppercase tracking-wide leading-none" style={{ color: PT.green }}>
                  Two Players
                </p>
                <p className="text-xs text-slate-500 mt-1">Take turns on the same device · who wins?</p>
              </div>
              <ChevronRight size={18} style={{ color: "#86EFAC" }} />
            </button>

            {/* TWO PLAYERS TIMED */}
            <button
              onClick={() => startQuiz("two-player-timed")}
              className="w-full bg-white rounded-3xl p-5 shadow-sm border-2 border-slate-100 transition-all active:scale-[0.98] flex items-center gap-5 text-left"
              data-testid="button-mode-two-player-timed"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Timer size={26} style={{ color: PT.green }} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-base leading-none" style={{ color: PT.green }}>Two Players Timed ⏱</p>
                <p className="text-xs text-slate-500 mt-1">Two players · 8 seconds each · fastest wins!</p>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── Overview ──
  const total = lesson.items.length;
  const masteredWords: string[] = p?.masteredWords ?? [];
  const practiceWords: string[] = p?.practiceWords ?? [];
  const masteredCount = masteredWords.length;
  const practiceCount = practiceWords.length;
  const pct = total > 0 ? Math.round((masteredCount / total) * 100) : 0;
  const hasProficiency = masteredCount > 0 || practiceCount > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <AppHeader
        onBack={() => navigate("/")}
        right={
          <div className="flex flex-col items-end gap-1 min-w-[110px]" data-testid="button-back-home">
            <span className="text-xs font-bold tabular-nums" style={{ color: pct > 0 ? "#16a34a" : "#94a3b8" }}>
              {pct}%
            </span>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden ring-1 ring-slate-200">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: "#22c55e" }}
                data-testid="progress-bar-lesson"
              />
            </div>
            {hasProficiency ? (
              <span className="text-[10px] text-slate-400">{masteredCount} / {total} mastered</span>
            ) : (
              <span className="text-[10px] text-slate-400">No progress yet</span>
            )}
          </div>
        }
        bottom={
          <div className="max-w-lg mx-auto px-4 pb-2.5 flex items-center gap-2">
            <span className="text-base leading-none">{lesson.icon}</span>
            <span className="text-sm font-bold text-slate-700">{lesson.title}</span>
          </div>
        }
      />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Progress card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          {/* Learner name */}
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-base font-bold text-slate-900 leading-snug">
              {user?.name ?? "Your Progress"}
            </span>
          </div>

          {/* Proficiency summary */}
          {hasProficiency ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: "#16a34a" }}>
                {masteredCount} mastered
              </span>
              {practiceCount > 0 && (
                <>
                  <span className="text-slate-300 text-xs select-none">•</span>
                  <span className="text-xs font-semibold" style={{ color: PT.red }}>
                    {practiceCount} to practise
                  </span>
                </>
              )}
              <span className="text-slate-300 text-xs select-none">•</span>
              <span className="text-xs text-slate-400">of {total}</span>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Start a flashcard or quiz to track progress</p>
          )}

          {/* Practise weak words section */}
          {practiceCount > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold text-slate-700">Needs practice</p>
                <button
                  onClick={() => startRetry()}
                  className="text-xs font-semibold px-2.5 py-1 rounded-xl border transition-all active:scale-[0.97]"
                  style={{ color: PT.red, borderColor: "#fca5a5", backgroundColor: "#fff5f5" }}
                >
                  Practise all →
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-2">Focus on these to improve your score</p>
              <div className="space-y-1.5">
                {practiceWords.map((word) => (
                  <button
                    key={word}
                    onClick={() => startRetry([word])}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all active:scale-[0.98] text-left"
                    style={{ backgroundColor: "#fff5f5" }}
                  >
                    <span className="text-sm font-semibold" style={{ color: PT.red }}>{word}</span>
                    <span className="text-xs text-slate-400">Practise →</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">

          {/* ── Flashcards card ── */}
          <button
            onClick={() => setMode("flashcards")}
            className="w-full bg-white rounded-3xl px-5 py-4 shadow-sm border-2 border-slate-100 hover:shadow-md hover:border-slate-200 transition-all active:scale-[0.98] text-left"
            data-testid="button-start-flashcards"
          >
            <p className="font-black text-slate-900 text-sm tracking-widest">FLASHCARDS</p>
            <p className="text-sm text-slate-400 mt-0.5">{total} vocabulary cards · tap to hear audio</p>
          </button>

          {/* ── Quiz card ── */}
          <div className="bg-white rounded-3xl px-5 py-4 shadow-sm border-2 border-slate-100">
            <div className="flex items-start justify-between gap-4">
              {/* Label */}
              <div className="pt-0.5">
                <p className="font-black text-sm tracking-widest" style={{ color: PT.blue }}>QUIZ</p>
                {p?.quizScore !== null && p?.quizScore !== undefined && (
                  <p className="text-xs text-slate-400 mt-1">
                    Last: {Math.min(p.quizScore!, p.quizTotal!)}/{p.quizTotal}
                  </p>
                )}
              </div>

              {/* Mode buttons */}
              <div className="flex flex-col gap-2 items-end">
                <button
                  onClick={() => startQuiz("single")}
                  className="px-3.5 py-1.5 rounded-2xl text-xs font-black tracking-wide uppercase transition-all active:scale-[0.96]"
                  style={{ backgroundColor: "#EFF6FF", color: PT.blue, border: "1px solid #BFDBFE" }}
                  data-testid="button-mode-single"
                >
                  Single Player
                </button>
                <button
                  onClick={() => startQuiz("timed")}
                  className="px-3.5 py-1.5 rounded-2xl text-xs font-bold tracking-wide transition-all active:scale-[0.96]"
                  style={{ backgroundColor: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A" }}
                  data-testid="button-mode-timed"
                >
                  Timed Single ⏱
                </button>
                <button
                  onClick={() => startQuiz("two-player")}
                  className="px-3.5 py-1.5 rounded-2xl text-xs font-black tracking-wide uppercase transition-all active:scale-[0.96]"
                  style={{ backgroundColor: "#F0FDF4", color: PT.green, border: "1px solid #BBF7D0" }}
                  data-testid="button-mode-two-player"
                >
                  Two Players
                </button>
                <button
                  onClick={() => startQuiz("two-player-timed")}
                  className="px-3.5 py-1.5 rounded-2xl text-xs font-bold tracking-wide transition-all active:scale-[0.96]"
                  style={{ backgroundColor: "#ECFDF5", color: "#065F46", border: "1px solid #6EE7B7" }}
                  data-testid="button-mode-two-player-timed"
                >
                  Two Players Timed ⏱
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Tonic pronoun reference table — shown only for this lesson */}
        {lesson.id === "pronouns-prepositions" && (
          <TonicPronounTable speak={speak} />
        )}

        {/* Conjunctions intro — shown only for the conjunctions lesson */}
        {lesson.id === "conjunctions" && (
          <ConjunctionsIntro speak={speak} />
        )}

        {/* Additive conjunctions interactive game */}
        {lesson.id === "conjunctions" && (
          <AdditiveConjunctionsSection speak={speak} />
        )}

        {/* Conditional conjunctions game */}
        {lesson.id === "conjunctions" && (
          <ConjunctionGameSection
            title="Conjunções Condicionais"
            subtitle="Conditional Conjunctions"
            emoji="🤝"
            accent="#0891b2"
            accentBg="#ecfeff"
            accentBorder="#a5f3fc"
            teaching={CONDITIONAL_TEACHING}
            quiz={CONDITIONAL_QUIZ}
            speak={speak}
          />
        )}

        {/* Conclusion conjunctions game */}
        {lesson.id === "conjunctions" && (
          <ConjunctionGameSection
            title="Conjunções Conclusivas"
            subtitle="Conclusion Conjunctions"
            emoji="🏁"
            accent="#d97706"
            accentBg="#fffbeb"
            accentBorder="#fde68a"
            teaching={CONCLUSION_TEACHING}
            quiz={CONCLUSION_QUIZ}
            speak={speak}
          />
        )}

        {/* Comprehension survival phrases — travel lesson */}
        {lesson.id === "travel" && (
          <ComprehensionPhrasesCard speak={speak} />
        )}

        {/* Travel phrases + transport vocabulary game */}
        {lesson.id === "travel" && (
          <TravelPhrasesGame speak={speak} lessonId={lesson.id} />
        )}

        {/* Directions vocabulary + quiz */}
        {lesson.id === "travel" && (
          <DirectionsSection speak={speak} lessonId={lesson.id} />
        )}

        {/* Shopping vocabulary + quiz */}
        {lesson.id === "travel" && (
          <ShoppingSection speak={speak} lessonId={lesson.id} />
        )}

        {/* Food & Drink vocabulary + quiz */}
        {lesson.id === "travel" && (
          <FoodDrinkSection speak={speak} lessonId={lesson.id} />
        )}

        {/* Word list */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">
            Vocabulary ({total} words)
          </h2>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
            {lesson.items.map((item, i) => {
              if (item.genderForms) {
                const { masculine, feminine } = item.genderForms;
                return (
                  <div key={i} className="px-4 py-3" data-testid={`row-vocab-${i}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <GenderPairInline masculine={masculine.word} feminine={feminine.word} />
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "#dbeafe", color: PT.blue }}>
                            ♂ Male speech
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "#fdecea", color: PT.red }}>
                            ♀ Female speech
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 text-right shrink-0">{item.english}</p>
                      <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                        <button
                          onClick={() => speak(masculine.word)}
                          className="p-2 rounded-2xl border border-blue-200 bg-blue-50 text-blue-500 hover:bg-blue-100 transition-all"
                          aria-label={`Hear ${masculine.word}`}
                          data-testid={`button-speak-vocab-${i}`}
                          title="♂ Hear male form"
                        >
                          <Volume2 size={14} />
                        </button>
                        <button
                          onClick={() => speak(feminine.word)}
                          className="p-2 rounded-2xl border border-red-200 bg-red-50 text-red-400 hover:bg-red-100 transition-all"
                          aria-label={`Hear ${feminine.word}`}
                          title="♀ Hear female form"
                        >
                          <Volume2 size={14} />
                        </button>
                        <WordPracticeButton word={masculine.word} speak={speak} />
                        <WordPracticeButton word={feminine.word} speak={speak} />
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={i} className="px-4 py-3 flex items-center gap-3" data-testid={`row-vocab-${i}`}>
                  <div className="flex-1 min-w-0">
                    {item.gender ? (
                      <>
                        <ColoredGenderWord word={item.portuguese} gender={item.gender} />
                        <div className="mt-1">
                          <GenderBadge gender={item.gender} size="xs" />
                        </div>
                      </>
                    ) : (
                      <p className="font-semibold text-slate-800">{item.portuguese}</p>
                    )}
                    {item.pronunciation && (
                      <p className="text-xs text-slate-400 italic mt-0.5">{item.pronunciation}</p>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 text-right max-w-[32%]">{item.english}</p>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => speak(item.portuguese)}
                      className="p-2 rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all shrink-0"
                      aria-label={`Listen to ${item.portuguese}`}
                      data-testid={`button-speak-vocab-${i}`}
                    >
                      <Volume2 size={15} />
                    </button>
                    <WordPracticeButton word={item.portuguese} speak={speak} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Tonic Pronoun Interactive Reference Table ─────────────────────────────────

interface PronounRow { person: string; pronouns: string[]; english: string; }

const TONIC_ROWS: PronounRow[] = [
  { person: "1st person sg.", pronouns: ["mim"],          english: "me"              },
  { person: "2nd person sg.", pronouns: ["ti"],           english: "you"             },
  { person: "3rd person sg.", pronouns: ["ele", "ela"],   english: "he / she"        },
  { person: "1st person pl.", pronouns: ["nós"],          english: "we"              },
  { person: "2nd person pl.", pronouns: ["vós"],          english: "you (plural)"    },
  { person: "3rd person pl.", pronouns: ["eles", "elas"], english: "they"            },
];

const COM_ROWS: PronounRow[] = [
  { person: "1st person sg.", pronouns: ["comigo"],              english: "with me"           },
  { person: "2nd person sg.", pronouns: ["contigo"],             english: "with you"          },
  { person: "3rd person sg.", pronouns: ["com ele", "com ela"],  english: "with him / her"    },
  { person: "1st person pl.", pronouns: ["connosco"],             english: "with us"           },
  { person: "2nd person pl.", pronouns: ["convosco"],            english: "with you (plural)" },
  { person: "3rd person pl.", pronouns: ["com eles", "com elas"],english: "with them"         },
];

function PronounTableSection({
  rows,
  accentColor,
  borderColor,
  bgColor,
  speak,
}: {
  rows: PronounRow[];
  accentColor: string;
  borderColor: string;
  bgColor: string;
  speak: (text: string) => void;
}) {
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleHear = useCallback((word: string) => {
    speak(word);
    setActiveWord(word);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setActiveWord(null), 1800);
  }, [speak]);

  return (
    <div className="divide-y" style={{ borderColor }}>
      {rows.map((row) => {
        const isRowActive = row.pronouns.some((w) => w === activeWord);
        return (
          <div
            key={row.person}
            className="px-4 py-3 transition-colors duration-150"
            style={{ backgroundColor: isRowActive ? bgColor : "transparent" }}
          >
            <div className="flex items-start gap-2">
              {/* Person label */}
              <span className="text-[11px] text-slate-400 leading-tight pt-1.5 min-w-[80px] shrink-0">{row.person}</span>

              {/* Pronoun buttons + practice buttons */}
              <div className="flex-1 flex flex-wrap gap-x-3 gap-y-2">
                {row.pronouns.map((word, wi) => (
                  <div key={word} className="flex flex-col items-center gap-1">
                    {/* Hear button */}
                    <button
                      onClick={() => handleHear(word)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.94]"
                      style={{
                        backgroundColor: activeWord === word ? accentColor : bgColor,
                        color: activeWord === word ? "#fff" : accentColor,
                        border: `1.5px solid ${activeWord === word ? accentColor : borderColor}`,
                        boxShadow: activeWord === word ? `0 2px 8px ${accentColor}44` : "none",
                      }}
                      aria-label={`Hear ${word}`}
                      data-testid={`btn-pronoun-${word}`}
                    >
                      <Volume2 size={13} />
                      {word}
                    </button>

                    {/* Masc / Fem label for dual-form rows */}
                    {row.pronouns.length > 1 && (
                      <span className="text-[9px] font-semibold text-slate-400">
                        {wi === 0 ? "masc." : "fem."}
                      </span>
                    )}

                    {/* Practice button — speak then listen */}
                    <WordPracticeButton word={word} speak={speak} compact={false} />
                  </div>
                ))}
              </div>

              {/* English */}
              <span className="text-xs text-slate-500 text-right leading-snug pt-1.5 shrink-0 max-w-[90px]">{row.english}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TonicPronounTable({ speak }: { speak: (text: string) => void }) {
  return (
    <div className="space-y-4">

      {/* ── Tonic pronouns (Por / Para / Até) ── */}
      <div className="rounded-3xl overflow-hidden shadow-sm" style={{ border: "1.5px solid #fecdd3" }}>
        <div className="px-5 pt-4 pb-3" style={{ background: "linear-gradient(135deg, #fff1f2, #fff)" }}>
          <p className="font-black text-sm tracking-wide uppercase" style={{ color: "#e11d48" }}>
            Tonic Pronouns · Por / Para / Até
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            🔊 Tap to hear · 🎤 Tap Repeat to practise speaking
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["Por + mim", "Para + ti", "Até + nós"].map((ex) => (
              <span key={ex} className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "#fce7f3", color: "#be185d" }}>{ex}</span>
            ))}
          </div>
        </div>
        {/* Column headers */}
        <div className="grid grid-cols-[80px_1fr_auto] px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400"
          style={{ borderTop: "1px solid #fce7f3", background: "#fff8f9" }}>
          <span>Person</span><span>Pronoun</span><span className="text-right">English</span>
        </div>
        <PronounTableSection rows={TONIC_ROWS} accentColor="#e11d48" borderColor="#fecdd3" bgColor="#fff1f2" speak={speak} />
        <div className="px-5 py-2.5 text-xs text-slate-400 text-center"
          style={{ borderTop: "1px solid #fce7f3", background: "#fff8f9" }}>
          Always follow a preposition · <span className="font-semibold text-slate-500">never stand alone</span>
        </div>
      </div>

      {/* ── Com special forms ── */}
      <div className="rounded-3xl overflow-hidden shadow-sm" style={{ border: "1.5px solid #bfdbfe" }}>
        <div className="px-5 pt-4 pb-3" style={{ background: "linear-gradient(135deg, #eff6ff, #fff)" }}>
          <p className="font-black text-sm tracking-wide uppercase" style={{ color: "#2563eb" }}>
            Com ("With") · Special Forms
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            The preposition <em>com</em> uses unique merged forms
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["Vem comigo!", "Vamos connosco", "Com eles"].map((ex) => (
              <span key={ex} className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }}>{ex}</span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-[80px_1fr_auto] px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400"
          style={{ borderTop: "1px solid #dbeafe", background: "#f8faff" }}>
          <span>Person</span><span>With + Pronoun</span><span className="text-right">English</span>
        </div>
        <PronounTableSection rows={COM_ROWS} accentColor="#2563eb" borderColor="#bfdbfe" bgColor="#eff6ff" speak={speak} />
        <div className="px-5 py-2.5 text-xs text-slate-400 text-center"
          style={{ borderTop: "1px solid #dbeafe", background: "#f8faff" }}>
          Example: <em>Vem dançar comigo!</em> — Come dance with me!
        </div>
      </div>

    </div>
  );
}

// ─── ConjunctionsIntro ────────────────────────────────────────────────────────

const ACCENT = "#046A38";
const ACCENT_BG = "#f0fdf4";
const ACCENT_BORDER = "#FFCC29";

const SIMPLE_CONJUNCTIONS = [
  { pt: "e", en: "and" },
  { pt: "mas", en: "but" },
  { pt: "ou", en: "or" },
  { pt: "porque", en: "because" },
  { pt: "então", en: "so/then" },
  { pt: "porém", en: "however" },
  { pt: "nem", en: "nor" },
  { pt: "logo", en: "therefore" },
];

const CONJ_PHRASES = [
  { pt: "para que", en: "so that" },
  { pt: "já que", en: "since" },
  { pt: "uma vez que", en: "since/given that" },
  { pt: "mesmo que", en: "even if" },
  { pt: "desde que", en: "as long as" },
  { pt: "a não ser que", en: "unless" },
  { pt: "no entanto", en: "nevertheless" },
  { pt: "de modo que", en: "in such a way that" },
];

const EXAMPLE_SENTENCES: { sentence: string; highlight: string; english: string }[] = [
  {
    sentence: "Farei uma reunião com os professores para que não haja nenhum mal-entendido.",
    highlight: "para que",
    english: "I'll have a meeting with all the professors so that there is no misunderstanding.",
  },
  {
    sentence: "Já que não queres mais, vou comer o bolo.",
    highlight: "Já que",
    english: "Since you don't want it anymore, I'll eat the cake.",
  },
  {
    sentence: "Podemos sair agora, uma vez que a ama chegou.",
    highlight: "uma vez que",
    english: "We can go now, since the nanny has arrived.",
  },
];

function HighlightedSentence({
  sentence,
  highlight,
  english,
  speak,
}: {
  sentence: string;
  highlight: string;
  english: string;
  speak: (t: string) => void;
}) {
  const lc = sentence.toLowerCase();
  const hl = highlight.toLowerCase();
  const idx = lc.indexOf(hl);

  const sentenceNode = idx === -1 ? (
    <span>{sentence}</span>
  ) : (
    <>
      <span>{sentence.slice(0, idx)}</span>
      <button
        onClick={() => speak(sentence.slice(idx, idx + highlight.length))}
        className="inline-flex items-baseline font-bold rounded px-0.5 mx-0.5 transition-colors active:opacity-70"
        style={{ color: ACCENT, background: ACCENT_BG }}
      >
        {sentence.slice(idx, idx + highlight.length)}
      </button>
      <span>{sentence.slice(idx + highlight.length)}</span>
    </>
  );

  return (
    <div>
      <div className="flex items-start gap-2">
        <p className="text-sm text-slate-700 leading-relaxed flex-1 flex flex-wrap items-baseline gap-x-0">
          {sentenceNode}
        </p>
        <button
          onClick={() => speak(sentence)}
          className="shrink-0 mt-0.5 rounded-full p-1.5 transition-colors active:opacity-60"
          style={{ background: ACCENT_BG, color: ACCENT }}
          title="Hear full sentence"
        >
          <Volume2 size={13} />
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-0.5 italic">{english}</p>
    </div>
  );
}

function ConjunctionsIntro({ speak }: { speak: (t: string) => void }) {
  return (
    <div className="space-y-4">

      {/* What are conjunctions */}
      <div className="rounded-3xl overflow-hidden shadow-sm border"
        style={{ borderColor: ACCENT_BORDER, background: "#fff" }}>
        <div className="px-5 pt-5 pb-3" style={{ borderBottom: `1px solid ${ACCENT_BORDER}` }}>
          <p className="text-[11px] font-black uppercase tracking-widest mb-1" style={{ color: ACCENT }}>
            O que são Conjunções?
          </p>
          <p className="text-sm font-bold text-slate-800 leading-snug mb-2">
            What are Conjunctions?
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            Conjunctions connect words, phrases, and clauses. They are{" "}
            <span className="font-semibold text-slate-800">invariable</span> — they never change for gender,
            number, or tense — making them simple but incredibly useful. You'll use them even more in Portuguese
            than in English.
          </p>
        </div>

        {/* English comparison */}
        <div className="px-5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Role in a sentence — English examples
          </p>
          <div className="space-y-1.5">
            {[
              { sentence: "She likes to dance and sing.", highlight: "and" },
              { sentence: "I'm a good cook, but my desserts are not great.", highlight: "but" },
              { sentence: "We slept early, so we turned off the lights.", highlight: "so" },
            ].map(({ sentence, highlight }) => {
              const lc = sentence.toLowerCase();
              const hl = highlight.toLowerCase();
              const idx = lc.indexOf(hl);
              if (idx === -1) return <p key={sentence} className="text-xs text-slate-600">{sentence}</p>;
              return (
                <p key={sentence} className="text-xs text-slate-600">
                  {sentence.slice(0, idx)}
                  <span className="font-bold" style={{ color: ACCENT }}>
                    {sentence.slice(idx, idx + highlight.length)}
                  </span>
                  {sentence.slice(idx + highlight.length)}
                </p>
              );
            })}
          </div>
        </div>
      </div>

      {/* Simple conjunctions vs conjunctive phrases */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: ACCENT_BORDER }}>
          <div className="px-3 py-2 text-center" style={{ background: ACCENT }}>
            <p className="text-[10px] font-black uppercase tracking-widest text-white">Simple Conjunctions</p>
            <p className="text-[9px] text-purple-200">single word</p>
          </div>
          <div className="divide-y" style={{ divideColor: ACCENT_BORDER }}>
            {SIMPLE_CONJUNCTIONS.map(({ pt, en }) => (
              <div key={pt} className="flex items-center justify-between px-3 py-1.5">
                <button
                  onClick={() => speak(pt)}
                  className="text-sm font-bold transition-colors active:opacity-60"
                  style={{ color: ACCENT }}
                >
                  {pt}
                </button>
                <span className="text-[11px] text-slate-500">{en}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: "#bbf7d0" }}>
          <div className="px-3 py-2 text-center" style={{ background: "#15803d" }}>
            <p className="text-[10px] font-black uppercase tracking-widest text-white">Conjunctive Phrases</p>
            <p className="text-[9px] text-green-200">two or more words</p>
          </div>
          <div className="divide-y divide-green-50">
            {CONJ_PHRASES.map(({ pt, en }) => (
              <div key={pt} className="flex items-center justify-between px-3 py-1.5">
                <button
                  onClick={() => speak(pt)}
                  className="text-sm font-bold text-left transition-colors active:opacity-60"
                  style={{ color: "#15803d" }}
                >
                  {pt}
                </button>
                <span className="text-[11px] text-slate-500 text-right">{en}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive example sentences */}
      <div className="rounded-3xl overflow-hidden shadow-sm border" style={{ borderColor: ACCENT_BORDER, background: "#fff" }}>
        <div className="px-5 pt-4 pb-2" style={{ borderBottom: `1px solid ${ACCENT_BORDER}` }}>
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: ACCENT }}>
            Conjunctive Phrases in Action
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Tap the <span style={{ color: ACCENT, fontWeight: 600 }}>highlighted word</span> or 🔊 to hear the full sentence</p>
        </div>
        <div className="divide-y" style={{ divideColor: ACCENT_BORDER }}>
          {EXAMPLE_SENTENCES.map(({ sentence, highlight, english }) => (
            <div key={sentence} className="px-5 py-3.5">
              <HighlightedSentence
                sentence={sentence}
                highlight={highlight}
                english={english}
                speak={speak}
              />
            </div>
          ))}
        </div>
      </div>


    </div>
  );
}

// ─── Additive Conjunctions Game ───────────────────────────────────────────────

const ADDITIVE_TEACHING = [
  {
    pt: "e",
    en: "and",
    examples: [
      { pt: "Eu posso escutar podcasts e cozinhar ao mesmo tempo.", en: "I can listen to podcasts and cook at the same time." },
      { pt: "Gostas do verão e da primavera, certo?", en: "You like summer and spring, right?" },
    ],
  },
  {
    pt: "nem",
    en: "nor",
    examples: [
      { pt: "A tua mãe não ligou nem mandou mensagem.", en: "Your mother hasn't called nor sent a message." },
      { pt: "Não como peixe nem frutos do mar.", en: "I don't eat fish nor seafood." },
    ],
  },
  {
    pt: "não só…mas também",
    en: "not only…but also",
    examples: [
      { pt: "Ele não só ganhou o prémio, mas também o bónus.", en: "Not only did he get the prize, but also the bonus." },
      { pt: "Vocês não só são bonitas, como também são muito engraçadas.", en: "You are not only pretty, but also very funny. (variant: como também)" },
    ],
  },
];

const ADDITIVE_QUIZ: {
  before: string; after: string; options: string[];
  correct: string; english: string; fullSentence: string;
}[] = [
  {
    before: "Eu posso escutar podcasts",
    after: "cozinhar ao mesmo tempo.",
    options: ["e", "nem", "mas", "ou"],
    correct: "e",
    english: "I can listen to podcasts and cook at the same time.",
    fullSentence: "Eu posso escutar podcasts e cozinhar ao mesmo tempo.",
  },
  {
    before: "Gostas do verão",
    after: "da primavera, certo?",
    options: ["e", "nem", "mas", "porque"],
    correct: "e",
    english: "You like summer and spring, right?",
    fullSentence: "Gostas do verão e da primavera, certo?",
  },
  {
    before: "A tua mãe não ligou",
    after: "mandou mensagem.",
    options: ["nem", "e", "mas", "ou"],
    correct: "nem",
    english: "Your mother hasn't called nor sent a message.",
    fullSentence: "A tua mãe não ligou nem mandou mensagem.",
  },
  {
    before: "Não como peixe",
    after: "frutos do mar.",
    options: ["nem", "e", "mas", "logo"],
    correct: "nem",
    english: "I don't eat fish nor seafood.",
    fullSentence: "Não como peixe nem frutos do mar.",
  },
  {
    before: "Ele não só ganhou o prémio,",
    after: "também o bónus.",
    options: ["mas", "como", "e", "nem"],
    correct: "mas",
    english: "Not only did he get the prize, but also the bonus.",
    fullSentence: "Ele não só ganhou o prémio, mas também o bónus.",
  },
  {
    before: "Vocês não só são bonitas,",
    after: "também são muito engraçadas.",
    options: ["como", "mas", "e", "nem"],
    correct: "como",
    english: "You are not only pretty, you are also very funny.",
    fullSentence: "Vocês não só são bonitas, como também são muito engraçadas.",
  },
];

function AdditiveConjunctionsSection({ speak }: { speak: (t: string) => void }) {
  const [phase, setPhase] = useState<"learn" | "play" | "done">("learn");
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const q = ADDITIVE_QUIZ[qIndex];
  const isCorrect = selected === q?.correct;
  const total = ADDITIVE_QUIZ.length;

  function handleNext() {
    if (qIndex + 1 >= total) {
      setPhase("done");
    } else {
      setQIndex(i => i + 1);
      setSelected(null);
    }
  }

  function handleRestart() {
    setQIndex(0);
    setSelected(null);
    setScore(0);
    setPhase("play");
  }

  function handleSelectAndScore(opt: string) {
    if (selected !== null) return;
    setSelected(opt);
    if (opt === q.correct) {
      setScore(s => s + 1);
      speak(q.correct);
    }
  }

  const perfect = score === total;

  return (
    <div className="space-y-4">

      {/* Section header */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-lg">🔗</span>
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: ACCENT }}>
            Conjunções Aditivas
          </p>
          <p className="text-xs text-slate-500">Additive Conjunctions</p>
        </div>
      </div>

      {/* ── LEARN PHASE ── */}
      {phase === "learn" && (
        <div className="space-y-3">
          {/* Sticky Start Quiz button */}
          <div className="sticky z-20 -mx-4 px-4 py-2" style={{ top: 52, background: "linear-gradient(to bottom, #f1f5f9 85%, transparent)" }}>
            <button
              onClick={() => setPhase("play")}
              className="w-full py-3.5 rounded-2xl font-black text-white text-sm tracking-wide shadow-lg active:opacity-80 transition-opacity"
              style={{ background: ACCENT }}
            >
              Start Quiz →
            </button>
          </div>
          {ADDITIVE_TEACHING.map((conj) => (
            <div key={conj.pt} className="rounded-2xl overflow-hidden shadow-sm border"
              style={{ borderColor: ACCENT_BORDER, background: "#fff" }}>
              <div className="px-4 py-3 flex items-center gap-3"
                style={{ background: ACCENT_BG, borderBottom: `1px solid ${ACCENT_BORDER}` }}>
                <button
                  onClick={() => speak(conj.pt)}
                  className="text-xl font-black tracking-tight active:opacity-60 transition-opacity"
                  style={{ color: ACCENT }}
                >
                  {conj.pt}
                </button>
                <span className="text-sm text-slate-500">— {conj.en}</span>
                <button
                  onClick={() => speak(conj.pt)}
                  className="ml-auto rounded-full p-1.5 active:opacity-60"
                  style={{ background: ACCENT, color: "#fff" }}
                >
                  <Volume2 size={12} />
                </button>
              </div>
              <div className="divide-y" style={{ divideColor: ACCENT_BORDER }}>
                {conj.examples.map((ex) => (
                  <div key={ex.pt} className="px-4 py-2.5 flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 leading-snug">{ex.pt}</p>
                      <p className="text-xs text-slate-400 italic mt-0.5">{ex.en}</p>
                    </div>
                    <button
                      onClick={() => speak(ex.pt)}
                      className="shrink-0 mt-0.5 rounded-full p-1.5 active:opacity-60"
                      style={{ background: ACCENT_BG, color: ACCENT }}
                    >
                      <Volume2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PLAY PHASE ── */}
      {phase === "play" && q && (
        <div className="rounded-3xl overflow-hidden shadow-md border" style={{ borderColor: ACCENT_BORDER }}>
          <div style={{ background: ACCENT }} className="px-5 pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-white/80 uppercase tracking-widest">
                Question {qIndex + 1} of {total}
              </p>
              <p className="text-xs font-black text-white">Score: {score} / {total}</p>
            </div>
            <div className="flex gap-1">
              {ADDITIVE_QUIZ.map((_, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
                  style={{
                    background: i < qIndex
                      ? "rgba(255,255,255,0.9)"
                      : i === qIndex
                      ? "rgba(255,255,255,0.5)"
                      : "rgba(255,255,255,0.2)",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="px-5 py-5 bg-white" style={{ borderBottom: `1px solid ${ACCENT_BORDER}` }}>
            <p className="text-base text-slate-800 leading-relaxed text-center font-medium">
              {q.before}{" "}
              <span
                className="inline-block px-3 py-0.5 rounded-lg font-black text-sm mx-0.5 align-middle"
                style={{
                  background: selected ? (isCorrect ? "#dcfce7" : "#fee2e2") : ACCENT_BG,
                  color: selected ? (isCorrect ? "#15803d" : "#dc2626") : ACCENT,
                  border: `2px solid ${selected ? (isCorrect ? "#bbf7d0" : "#fecaca") : ACCENT_BORDER}`,
                }}
              >
                {selected ?? "___"}
              </span>
              {" "}{q.after}
            </p>
            <p className="text-xs text-slate-400 italic text-center mt-2">{q.english}</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 p-4 bg-white">
            {q.options.map((opt) => {
              const isSelected = selected === opt;
              const isCorrectOpt = opt === q.correct;
              let bg = "#f8faff";
              let border = ACCENT_BORDER;
              let textColor = ACCENT;
              let icon = "";
              if (selected !== null) {
                if (isCorrectOpt) { bg = "#dcfce7"; border = "#86efac"; textColor = "#15803d"; icon = " ✓"; }
                else if (isSelected) { bg = "#fee2e2"; border = "#fca5a5"; textColor = "#dc2626"; icon = " ✗"; }
                else { bg = "#f1f5f9"; border = "#e2e8f0"; textColor = "#94a3b8"; }
              }
              return (
                <button
                  key={opt}
                  onClick={() => handleSelectAndScore(opt)}
                  disabled={selected !== null}
                  className="py-3 px-2 rounded-xl font-bold text-sm text-center transition-all active:scale-95 border-2"
                  style={{ background: bg, borderColor: border, color: textColor }}
                >
                  {opt}{icon}
                </button>
              );
            })}
          </div>

          {selected !== null && (
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{
                background: isCorrect ? "#f0fdf4" : "#fff7f7",
                borderTop: `1px solid ${isCorrect ? "#bbf7d0" : "#fecaca"}`,
              }}
            >
              <div>
                <p className="text-sm font-black" style={{ color: isCorrect ? "#15803d" : "#dc2626" }}>
                  {isCorrect ? "✓ Correct!" : `✗ The answer is "${q.correct}"`}
                </p>
                {!isCorrect && (
                  <button
                    onClick={() => speak(q.fullSentence)}
                    className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 active:opacity-60"
                  >
                    <Volume2 size={11} /> Hear correct sentence
                  </button>
                )}
              </div>
              <button
                onClick={handleNext}
                className="px-5 py-2 rounded-xl font-black text-sm text-white active:opacity-80"
                style={{ background: ACCENT }}
              >
                {qIndex + 1 >= total ? "Finish" : "Next →"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── DONE PHASE ── */}
      {phase === "done" && (
        <div
          className="rounded-3xl overflow-hidden shadow-md border text-center"
          style={{ borderColor: ACCENT_BORDER, background: "#fff" }}
        >
          <div className="px-5 py-8">
            <p className="text-5xl mb-3">{perfect ? "🏆" : score >= 4 ? "⭐⭐⭐" : score >= 2 ? "⭐⭐" : "⭐"}</p>
            <p className="text-2xl font-black mb-1" style={{ color: ACCENT }}>
              {score} / {total}
            </p>
            <p className="text-sm font-semibold text-slate-600 mb-1">
              {perfect
                ? "Perfect score! Impressionante!"
                : score >= 4
                ? "Great work! Muito bem!"
                : score >= 2
                ? "Good effort! Keep practising."
                : "Keep going — practice makes perfect!"}
            </p>
            <p className="text-xs text-slate-400 mb-6">
              {score >= 4 ? "You've mastered additive conjunctions!" : "Review the examples above and try again."}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRestart}
                className="px-6 py-2.5 rounded-xl font-black text-sm text-white active:opacity-80"
                style={{ background: ACCENT }}
              >
                Play Again
              </button>
              <button
                onClick={() => setPhase("learn")}
                className="px-6 py-2.5 rounded-xl font-black text-sm border-2 active:opacity-80"
                style={{ borderColor: ACCENT_BORDER, color: ACCENT, background: ACCENT_BG }}
              >
                Review
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Generic Conjunction Game Section ─────────────────────────────────────────

interface TeachingConj {
  pt: string;
  en: string;
  examples: { pt: string; en: string }[];
}

interface QuizQuestion {
  before: string;
  after: string;
  options: string[];
  correct: string;
  english: string;
  fullSentence: string;
}

interface ConjunctionGameProps {
  title: string;
  subtitle: string;
  emoji: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  teaching: TeachingConj[];
  quiz: QuizQuestion[];
  speak: (t: string) => void;
}

function ConjunctionGameSection({
  title, subtitle, emoji, accent, accentBg, accentBorder, teaching, quiz, speak,
}: ConjunctionGameProps) {
  const [phase, setPhase] = useState<"learn" | "play" | "done">("learn");
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const q = quiz[qIndex];
  const isCorrect = selected === q?.correct;
  const total = quiz.length;

  function handleSelect(opt: string) {
    if (selected !== null) return;
    setSelected(opt);
    if (opt === q.correct) {
      setScore(s => s + 1);
      speak(q.correct);
    }
  }

  function handleNext() {
    if (qIndex + 1 >= total) { setPhase("done"); }
    else { setQIndex(i => i + 1); setSelected(null); }
  }

  function handleRestart() {
    setQIndex(0); setSelected(null); setScore(0); setPhase("play");
  }

  const perfect = score === total;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <span className="text-lg">{emoji}</span>
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: accent }}>{title}</p>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>

      {/* LEARN */}
      {phase === "learn" && (
        <div className="space-y-3">
          {/* Sticky Start Quiz button */}
          <div className="sticky z-20 -mx-4 px-4 py-2" style={{ top: 52, background: "linear-gradient(to bottom, #f1f5f9 85%, transparent)" }}>
            <button
              onClick={() => setPhase("play")}
              className="w-full py-3.5 rounded-2xl font-black text-white text-sm tracking-wide shadow-lg active:opacity-80 transition-opacity"
              style={{ background: accent }}
            >
              Start Quiz →
            </button>
          </div>
          {teaching.map((conj) => (
            <div key={conj.pt} className="rounded-2xl overflow-hidden shadow-sm border" style={{ borderColor: accentBorder, background: "#fff" }}>
              <div className="px-4 py-3 flex items-center gap-3" style={{ background: accentBg, borderBottom: `1px solid ${accentBorder}` }}>
                <button onClick={() => speak(conj.pt)} className="text-xl font-black active:opacity-60" style={{ color: accent }}>{conj.pt}</button>
                <span className="text-sm text-slate-500">— {conj.en}</span>
                <button onClick={() => speak(conj.pt)} className="ml-auto rounded-full p-1.5 active:opacity-60" style={{ background: accent, color: "#fff" }}>
                  <Volume2 size={12} />
                </button>
              </div>
              <div className="divide-y" style={{ divideColor: accentBorder }}>
                {conj.examples.map((ex) => (
                  <div key={ex.pt} className="px-4 py-2.5 flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 leading-snug">{ex.pt}</p>
                      <p className="text-xs text-slate-400 italic mt-0.5">{ex.en}</p>
                    </div>
                    <button onClick={() => speak(ex.pt)} className="shrink-0 mt-0.5 rounded-full p-1.5 active:opacity-60" style={{ background: accentBg, color: accent }}>
                      <Volume2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PLAY */}
      {phase === "play" && q && (
        <div className="rounded-3xl overflow-hidden shadow-md border" style={{ borderColor: accentBorder }}>
          <div style={{ background: accent }} className="px-5 pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-white/80 uppercase tracking-widest">Question {qIndex + 1} of {total}</p>
              <p className="text-xs font-black text-white">Score: {score} / {total}</p>
            </div>
            <div className="flex gap-1">
              {quiz.map((_, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full transition-all" style={{ background: i < qIndex ? "rgba(255,255,255,0.9)" : i === qIndex ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)" }} />
              ))}
            </div>
          </div>

          <div className="px-5 py-5 bg-white" style={{ borderBottom: `1px solid ${accentBorder}` }}>
            <p className="text-base text-slate-800 leading-relaxed text-center font-medium">
              {q.before && <span>{q.before} </span>}
              <span className="inline-block px-3 py-0.5 rounded-lg font-black text-sm mx-0.5 align-middle"
                style={{
                  background: selected ? (isCorrect ? "#dcfce7" : "#fee2e2") : accentBg,
                  color: selected ? (isCorrect ? "#15803d" : "#dc2626") : accent,
                  border: `2px solid ${selected ? (isCorrect ? "#bbf7d0" : "#fecaca") : accentBorder}`,
                }}>
                {selected ?? "___"}
              </span>
              {q.after && <span> {q.after}</span>}
            </p>
            <p className="text-xs text-slate-400 italic text-center mt-2">{q.english}</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 p-4 bg-white">
            {q.options.map((opt) => {
              const isSelected = selected === opt;
              const isCorrectOpt = opt === q.correct;
              let bg = "#f8f9ff"; let border = accentBorder; let color = accent; let icon = "";
              if (selected !== null) {
                if (isCorrectOpt) { bg = "#dcfce7"; border = "#86efac"; color = "#15803d"; icon = " ✓"; }
                else if (isSelected) { bg = "#fee2e2"; border = "#fca5a5"; color = "#dc2626"; icon = " ✗"; }
                else { bg = "#f1f5f9"; border = "#e2e8f0"; color = "#94a3b8"; }
              }
              return (
                <button key={opt} onClick={() => handleSelect(opt)} disabled={selected !== null}
                  className="py-3 px-2 rounded-xl font-bold text-sm text-center transition-all active:scale-95 border-2"
                  style={{ background: bg, borderColor: border, color }}>
                  {opt}{icon}
                </button>
              );
            })}
          </div>

          {selected !== null && (
            <div className="px-5 py-4 flex items-center justify-between"
              style={{ background: isCorrect ? "#f0fdf4" : "#fff7f7", borderTop: `1px solid ${isCorrect ? "#bbf7d0" : "#fecaca"}` }}>
              <div>
                <p className="text-sm font-black" style={{ color: isCorrect ? "#15803d" : "#dc2626" }}>
                  {isCorrect ? "✓ Correct!" : `✗ The answer is "${q.correct}"`}
                </p>
                {!isCorrect && (
                  <button onClick={() => speak(q.fullSentence)} className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 active:opacity-60">
                    <Volume2 size={11} /> Hear correct sentence
                  </button>
                )}
              </div>
              <button onClick={handleNext} className="px-5 py-2 rounded-xl font-black text-sm text-white active:opacity-80" style={{ background: accent }}>
                {qIndex + 1 >= total ? "Finish" : "Next →"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* DONE */}
      {phase === "done" && (
        <div className="rounded-3xl overflow-hidden shadow-md border text-center" style={{ borderColor: accentBorder, background: "#fff" }}>
          <div className="px-5 py-8">
            <p className="text-5xl mb-3">{perfect ? "🏆" : score >= 4 ? "⭐⭐⭐" : score >= 2 ? "⭐⭐" : "⭐"}</p>
            <p className="text-2xl font-black mb-1" style={{ color: accent }}>{score} / {total}</p>
            <p className="text-sm font-semibold text-slate-600 mb-1">
              {perfect ? "Perfect score! Impressionante!" : score >= 4 ? "Great work! Muito bem!" : score >= 2 ? "Good effort! Keep practising." : "Keep going — practice makes perfect!"}
            </p>
            <p className="text-xs text-slate-400 mb-6">{score >= 4 ? "You've got these conjunctions down!" : "Review the examples and try again."}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={handleRestart} className="px-6 py-2.5 rounded-xl font-black text-sm text-white active:opacity-80" style={{ background: accent }}>Play Again</button>
              <button onClick={() => setPhase("learn")} className="px-6 py-2.5 rounded-xl font-black text-sm border-2 active:opacity-80" style={{ borderColor: accentBorder, color: accent, background: accentBg }}>Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Conditional Conjunctions Data ────────────────────────────────────────────

const CONDITIONAL_TEACHING: TeachingConj[] = [
  {
    pt: "se",
    en: "if",
    examples: [
      { pt: "Eu lavo a roupa se tu varreres o chão.", en: "I'll do the laundry if you sweep the floor." },
      { pt: "Se não tiver comida, posso pedir uma pizza.", en: "If there is no food, I can order a pizza." },
    ],
  },
  {
    pt: "desde que / contanto que",
    en: "as long as",
    examples: [
      { pt: "Compre o que quiser, desde que esteja dentro do orçamento.", en: "Buy whatever you want, as long as it is within budget." },
      { pt: "Podemos assar um bolo, contanto que a cozinha continue arrumada.", en: "(variant: contanto que) We can bake a cake, as long as the kitchen remains tidy." },
    ],
  },
  {
    pt: "a não ser que / a menos que",
    en: "unless",
    examples: [
      { pt: "Não me ligue a não ser que haja uma emergência.", en: "Don't call me unless there's an emergency." },
      { pt: "Temos que sair, a menos que a aula tenha sido adiada.", en: "(variant: a menos que) We have to leave, unless the class has been postponed." },
    ],
  },
];

const CONDITIONAL_QUIZ: QuizQuestion[] = [
  {
    before: "Eu lavo a roupa",
    after: "tu varreres o chão.",
    options: ["se", "desde que", "a não ser que", "portanto"],
    correct: "se",
    english: "I'll do the laundry if you sweep the floor.",
    fullSentence: "Eu lavo a roupa se tu varreres o chão.",
  },
  {
    before: "",
    after: "não tiver comida, posso pedir uma pizza.",
    options: ["Se", "Desde que", "Logo", "Portanto"],
    correct: "Se",
    english: "If there is no food, I can order a pizza.",
    fullSentence: "Se não tiver comida, posso pedir uma pizza.",
  },
  {
    before: "Compre o que quiser,",
    after: "esteja dentro do orçamento.",
    options: ["desde que", "se", "a não ser que", "então"],
    correct: "desde que",
    english: "Buy whatever you want, as long as it is within budget.",
    fullSentence: "Compre o que quiser, desde que esteja dentro do orçamento.",
  },
  {
    before: "Ela vai organizar o evento,",
    after: "pagues adiantado.",
    options: ["desde que", "se", "a não ser que", "logo"],
    correct: "desde que",
    english: "She will organize the event, as long as you pay in advance.",
    fullSentence: "Ela vai organizar o evento, desde que pagues adiantado.",
  },
  {
    before: "Não me ligue",
    after: "haja uma emergência.",
    options: ["a não ser que", "se", "desde que", "logo"],
    correct: "a não ser que",
    english: "Don't call me unless there's an emergency.",
    fullSentence: "Não me ligue a não ser que haja uma emergência.",
  },
  {
    before: "Preciso ir embora,",
    after: "eu cancele a consulta.",
    options: ["a não ser que", "se", "desde que", "portanto"],
    correct: "a não ser que",
    english: "I need to leave, unless I cancel the appointment.",
    fullSentence: "Preciso ir embora, a não ser que eu cancele a consulta.",
  },
];

// ─── Conclusion Conjunctions Data ─────────────────────────────────────────────

const CONCLUSION_TEACHING: TeachingConj[] = [
  {
    pt: "então",
    en: "so / therefore",
    examples: [
      { pt: "Hoje é o meu aniversário, então vamos comemorar.", en: "Today is my birthday, so let's celebrate." },
      { pt: "Vamos dormir tarde, então não me ligue de manhã.", en: "We're going to sleep late, so don't call me in the morning." },
    ],
  },
  {
    pt: "logo",
    en: "so / therefore",
    examples: [
      { pt: "Não concordo com isso, logo prefiro não me envolver.", en: "I don't agree with that, so I prefer not to get involved." },
      { pt: "Conheces o Luís há anos, logo faz sentido que faças o convite.", en: "You have known Luís for years, therefore it makes sense that you invite him." },
    ],
  },
  {
    pt: "portanto",
    en: "therefore / so",
    examples: [
      { pt: "Tenho muito trabalho para fazer, portanto não espere por mim.", en: "I have a lot of work to do, so don't wait for me." },
      { pt: "Este carro é muito caro, portanto não posso comprar agora.", en: "This car is very expensive, therefore I can't buy it now." },
    ],
  },
];

const CONCLUSION_QUIZ: QuizQuestion[] = [
  {
    before: "Hoje é o meu aniversário,",
    after: "vamos comemorar.",
    options: ["então", "logo", "portanto", "desde que"],
    correct: "então",
    english: "Today is my birthday, so let's celebrate.",
    fullSentence: "Hoje é o meu aniversário, então vamos comemorar.",
  },
  {
    before: "Vamos dormir tarde,",
    after: "não me ligue de manhã.",
    options: ["então", "logo", "portanto", "se"],
    correct: "então",
    english: "We're going to sleep late, so don't call me in the morning.",
    fullSentence: "Vamos dormir tarde, então não me ligue de manhã.",
  },
  {
    before: "Não concordo com isso,",
    after: "prefiro não me envolver.",
    options: ["logo", "então", "portanto", "nem"],
    correct: "logo",
    english: "I don't agree with that, so I prefer not to get involved.",
    fullSentence: "Não concordo com isso, logo prefiro não me envolver.",
  },
  {
    before: "Conheces o Luís há anos,",
    after: "faz sentido que faças o convite.",
    options: ["logo", "então", "portanto", "se"],
    correct: "logo",
    english: "You have known Luís for years, therefore it makes sense that you invite him.",
    fullSentence: "Conheces o Luís há anos, logo faz sentido que faças o convite.",
  },
  {
    before: "Tenho muito trabalho para fazer,",
    after: "não espere por mim.",
    options: ["portanto", "então", "logo", "a não ser que"],
    correct: "portanto",
    english: "I have a lot of work to do, so don't wait for me.",
    fullSentence: "Tenho muito trabalho para fazer, portanto não espere por mim.",
  },
  {
    before: "Este carro é muito caro,",
    after: "não posso comprar agora.",
    options: ["portanto", "então", "logo", "desde que"],
    correct: "portanto",
    english: "This car is very expensive, therefore I can't buy it now.",
    fullSentence: "Este carro é muito caro, portanto não posso comprar agora.",
  },
];

// ─── Comprehension Phrases (Travel lesson) ────────────────────────────────────

const COMPREHENSION_PHRASES = [
  { pt: "Fala inglês?", en: "Do you speak English?" },
  { pt: "Alguém aqui fala inglês?", en: "Does anyone here speak English?" },
  { pt: "Não compreendo", en: "I don't understand" },
  { pt: "Eu compreendo", en: "I understand" },
  { pt: "Não entendi", en: "I didn't understand" },
  { pt: "Entendi", en: "I understood / I understand" },
  { pt: "Eu não sei", en: "I don't know" },
  { pt: "Como se diz... em português?", en: "How do you say… in Portuguese?" },
  { pt: "Fale mais devagar, por favor", en: "Please speak more slowly" },
  { pt: "Que horas são?", en: "What time is it?" },
  { pt: "Preciso de sua/tua ajuda", en: "I need your help" },
  { pt: "Eu estou doente", en: "I'm sick" },
];

const TRAVEL_BLUE = "#1d4ed8";
const TRAVEL_BG = "#eff6ff";
const TRAVEL_BORDER = "#bfdbfe";

function ComprehensionPhrasesCard({ speak }: { speak: (t: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span className="text-lg">💬</span>
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: TRAVEL_BLUE }}>Frases de Compreensão</p>
          <p className="text-xs text-slate-500">Survival phrases for speaking with natives</p>
        </div>
      </div>

      <div className="rounded-3xl overflow-hidden shadow-sm border" style={{ borderColor: TRAVEL_BORDER, background: "#fff" }}>
        <div className="px-5 pt-4 pb-2" style={{ borderBottom: `1px solid ${TRAVEL_BORDER}`, background: TRAVEL_BG }}>
          <p className="text-xs text-slate-600 leading-relaxed">
            Use these phrases when you need help understanding a native speaker. Tap any Portuguese phrase to hear it spoken aloud.
          </p>
          <p className="text-[10px] text-slate-400 mt-1 italic">
            Note: <em>sua</em> is used in Brazil; <em>tua</em> in Portugal — both mean "your".
          </p>
        </div>

        <div className="divide-y" style={{ divideColor: TRAVEL_BORDER }}>
          {COMPREHENSION_PHRASES.map(({ pt, en }) => (
            <div key={pt} className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={() => speak(pt)}
                className="flex-1 text-left active:opacity-60 transition-opacity"
              >
                <p className="text-sm font-bold" style={{ color: TRAVEL_BLUE }}>{pt}</p>
                <p className="text-xs text-slate-400 mt-0.5">{en}</p>
              </button>
              <button
                onClick={() => speak(pt)}
                className="shrink-0 rounded-full p-2 active:opacity-60"
                style={{ background: TRAVEL_BG, color: TRAVEL_BLUE }}
              >
                <Volume2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Travel Phrases Game ───────────────────────────────────────────────────────

const CORRECT_MSG = [
  "Muito bem! 🎉",
  "Excelente! 👏",
  "Perfeito! ✨",
  "Fantástico! 🌟",
  "Correto! Ótimo trabalho! 👍",
  "Incrível! Continua assim! 🔥",
];

const INCORRECT_MSG = [
  "Quase! Continua! 💪",
  "Não desistas! 🔥",
  "Estás no caminho certo! 👍",
  "Boa tentativa! Tenta outra vez! 🌟",
  "Continua a praticar! 🌱",
  "Não te preocupes! Consegues! 💫",
];

interface TravelQ {
  english: string;
  options: string[];
  correct: string;
  tts: string;
  matchPhrase: string;
  note?: string;
  section?: string;
}

const TRAVEL_QUIZ: TravelQ[] = [
  {
    section: "🗣️ Travel Phrases",
    english: "I need to exchange money.",
    options: ["Preciso trocar dinheiro", "Fala inglês?", "Que horas são?", "Onde fica a casa de banho?"],
    correct: "Preciso trocar dinheiro",
    tts: "Preciso trocar dinheiro",
    matchPhrase: "preciso trocar dinheiro",
  },
  {
    english: "How do I get to the bus stop?",
    options: ["Como chego à paragem de autocarro?", "Sabe onde fica a paragem?", "Para onde vai este autocarro?", "A que horas chega o autocarro?"],
    correct: "Como chego à paragem de autocarro?",
    tts: "Como chego à paragem de autocarro?",
    matchPhrase: "como chego paragem",
    note: "Tip: use ao for masculine, à for feminine nouns.",
  },
  {
    english: "Where does this train go?",
    options: ["Para onde vai este comboio?", "Como chego ao comboio?", "A que horas chega o comboio?", "Sabe onde fica o comboio?"],
    correct: "Para onde vai este comboio?",
    tts: "Para onde vai este comboio?",
    matchPhrase: "para onde vai comboio",
  },
  {
    english: "Could you show me on the map?",
    options: ["Pode mostrar-me no mapa?", "Sabe onde fica o mapa?", "Como chego ao centro?", "Para onde vai este comboio?"],
    correct: "Pode mostrar-me no mapa?",
    tts: "Pode mostrar-me no mapa?",
    matchPhrase: "mostrar no mapa",
  },
  {
    english: "What time does the train arrive?",
    options: ["A que horas chega o comboio?", "Para onde vai o comboio?", "Como chego ao comboio?", "Sabe onde fica o comboio?"],
    correct: "A que horas chega o comboio?",
    tts: "A que horas chega o comboio?",
    matchPhrase: "que horas chega",
  },
  {
    english: "Where is the bathroom?",
    options: ["Onde fica a casa de banho?", "Onde está a farmácia?", "Como chego à casa de banho?", "Há uma casa de banho por aqui?"],
    correct: "Onde fica a casa de banho?",
    tts: "Onde fica a casa de banho?",
    matchPhrase: "onde fica casa banho",
    note: "In Portugal: 'casa de banho' — not 'banheiro' which is Brazilian Portuguese.",
  },
  {
    english: "Do you know where the station is?",
    options: ["Sabe onde fica a estação?", "Como chego à estação?", "A que horas chega o comboio?", "Para onde vai este autocarro?"],
    correct: "Sabe onde fica a estação?",
    tts: "Sabe onde fica a estação?",
    matchPhrase: "sabe onde fica",
  },
  {
    section: "🚗 Transport Vocabulary",
    english: "Bus — European Portuguese",
    options: ["Autocarro", "Carruagem", "Comboio", "Táxi"],
    correct: "Autocarro",
    tts: "Autocarro",
    matchPhrase: "autocarro",
    note: "Autocarro = Portugal English: bus | Comboio = train",
  },
  {
    english: "Plane",
    options: ["Avião", "Carro", "Táxi", "Bicicleta"],
    correct: "Avião",
    tts: "Avião",
    matchPhrase: "avião",
  },
  {
    english: "Bus stop",
    options: ["Paragem de autocarro", "Estação de comboio", "Bicicleta", "Aeroporto"],
    correct: "Paragem de autocarro",
    tts: "Paragem de autocarro",
    matchPhrase: "paragem autocarro",
  },
];

// ─── Portuguese Car Animation ──────────────────────────────────────────────────

function useCarAnimation() {
  const [carActive, setCarActive] = useState(false);
  const carTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function triggerCar() {
    setCarActive(false);
    // Force a repaint so the animation replays from scratch
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCarActive(true);
        if (carTimerRef.current) clearTimeout(carTimerRef.current);
        carTimerRef.current = setTimeout(() => setCarActive(false), 4400);
      });
    });
  }
  useEffect(() => () => { if (carTimerRef.current) clearTimeout(carTimerRef.current); }, []);
  return { carActive, triggerCar };
}

function PortugueseCarAnimation({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="fixed bottom-24 left-0 w-full z-50 pointer-events-none overflow-hidden" style={{ height: 80 }}>
      <div className="car-zoom absolute bottom-0 left-0">
        {/* Crop container — hides the football by showing only the car body */}
        <div style={{ width: 160, height: 74, overflow: "hidden", position: "relative" }}>
          <img
            src={carImg}
            alt="Portuguese car"
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: 160,
              height: "auto",
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.25))",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function TravelPhrasesGame({ speak, lessonId }: { speak: (t: string) => void; lessonId: string }) {
  const { listen, status: srStatus, supported: srSupported } = useSpeechRecognition();
  const [phase, setPhase] = useState<"play" | "done">("play");
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [repeatState, setRepeatState] = useState<"idle" | "listening" | "matched" | "missed">("idle");
  const [score, setScore] = useState(0);
  const [wrongItems, setWrongItems] = useState<{en:string;pt:string}[]>([]);
  const wrongItemsRef = useRef<{en:string;pt:string}[]>([]);
  const speakTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { carActive, triggerCar } = useCarAnimation();

  const q = TRAVEL_QUIZ[qIndex];
  const isCorrect = selected === q?.correct;
  const total = TRAVEL_QUIZ.length;

  useEffect(() => {
    if (selected !== null) {
      speakTimer.current = setTimeout(() => speak(q.tts), 350);
    }
    return () => { if (speakTimer.current) clearTimeout(speakTimer.current); };
  }, [selected, qIndex]);

  function handleSelect(opt: string) {
    if (selected !== null) return;
    setSelected(opt);
    if (opt === q.correct) { setScore(s => s + 1); triggerCar(); }
    else wrongItemsRef.current.push({ en: q.english, pt: q.correct });
  }

  function handleRepeat() {
    if (srStatus === "listening") return;
    setRepeatState("listening");
    listen(
      (_, matches) => setRepeatState(matches(q.matchPhrase) ? "matched" : "missed"),
      () => setRepeatState("idle"),
    );
  }

  function handleNext() {
    if (speakTimer.current) clearTimeout(speakTimer.current);
    if (qIndex + 1 >= total) {
      const wrongs = [...wrongItemsRef.current];
      const wrongPts = wrongs.map(w => w.pt);
      const correctPts = TRAVEL_QUIZ.map(q2 => q2.correct).filter(c => !wrongPts.includes(c));
      mergeProficiency(lessonId, correctPts, wrongPts);
      updateLessonProgress(lessonId, { quizScore: score, quizTotal: total });
      setWrongItems(wrongs);
      setPhase("done");
    } else { setQIndex(i => i + 1); setSelected(null); setRepeatState("idle"); }
  }

  function handleRestart() {
    wrongItemsRef.current = [];
    setWrongItems([]);
    setQIndex(0); setSelected(null); setRepeatState("idle"); setScore(0); setPhase("play");
  }

  const motivMsg = selected !== null
    ? (isCorrect ? CORRECT_MSG[qIndex % CORRECT_MSG.length] : INCORRECT_MSG[qIndex % INCORRECT_MSG.length])
    : "";

  const perfect = score === total;

  return (
    <div className="space-y-4">
      <PortugueseCarAnimation active={carActive} />
      <div className="flex items-center gap-2 px-1">
        <span className="text-lg">✈️</span>
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: TRAVEL_BLUE }}>Travel Quiz</p>
          <p className="text-xs text-slate-500">Phrases &amp; transport vocabulary</p>
        </div>
      </div>

      {phase === "play" && q && (
        <div className="rounded-3xl overflow-hidden shadow-md border" style={{ borderColor: TRAVEL_BORDER }}>

          {/* Progress header */}
          <div style={{ background: TRAVEL_BLUE }} className="px-5 pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                {q.section && (
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{q.section}</p>
                )}
                <p className="text-xs font-bold text-white/80">Question {qIndex + 1} of {total}</p>
              </div>
              <p className="text-xs font-black text-white">Score: {score} / {total}</p>
            </div>
            <div className="flex gap-1">
              {TRAVEL_QUIZ.map((_, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
                  style={{ background: i < qIndex ? "rgba(255,255,255,0.9)" : i === qIndex ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)" }} />
              ))}
            </div>
          </div>

          {/* Question */}
          <div className="px-5 py-5 bg-white" style={{ borderBottom: `1px solid ${TRAVEL_BORDER}` }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 text-center">What's the Portuguese for…</p>
            <p className="text-lg font-black text-slate-800 text-center leading-snug">{q.english}</p>
            {q.note && (
              <p className="text-[10px] text-slate-400 text-center mt-2 italic">{q.note}</p>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-2 p-4 bg-white">
            {q.options.map((opt) => {
              const isSelected = selected === opt;
              const isCorrectOpt = opt === q.correct;
              let bg = TRAVEL_BG; let border = TRAVEL_BORDER; let color = TRAVEL_BLUE; let icon = "";
              if (selected !== null) {
                if (isCorrectOpt) { bg = "#dcfce7"; border = "#86efac"; color = "#15803d"; icon = " ✓"; }
                else if (isSelected) { bg = "#fee2e2"; border = "#fca5a5"; color = "#dc2626"; icon = " ✗"; }
                else { bg = "#f1f5f9"; border = "#e2e8f0"; color = "#94a3b8"; }
              }
              return (
                <button key={opt} onClick={() => handleSelect(opt)} disabled={selected !== null}
                  className="py-3 px-4 rounded-xl font-semibold text-sm text-left transition-all active:scale-95 border-2 leading-snug"
                  style={{ background: bg, borderColor: border, color }}>
                  {opt}{icon}
                </button>
              );
            })}
          </div>

          {/* Feedback + Repeat + Next */}
          {selected !== null && (
            <div style={{ background: isCorrect ? "#f0fdf4" : "#fff7f7", borderTop: `1px solid ${isCorrect ? "#bbf7d0" : "#fecaca"}` }}>
              {/* Motivation */}
              <div className="px-5 pt-4 pb-2 flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-base font-black" style={{ color: isCorrect ? "#15803d" : "#d97706" }}>
                    {motivMsg}
                  </p>
                  {!isCorrect && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      A resposta correta é: <span className="font-bold" style={{ color: TRAVEL_BLUE }}>{q.correct}</span>
                    </p>
                  )}
                </div>
                <button onClick={() => speak(q.tts)} className="shrink-0 rounded-full p-2 active:opacity-60" style={{ background: TRAVEL_BG, color: TRAVEL_BLUE }} title="Hear again">
                  <Volume2 size={15} />
                </button>
              </div>

              {/* Listen-and-repeat row */}
              <div className="px-5 pb-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Repeat after me</p>
                  <p className="text-sm font-bold" style={{ color: TRAVEL_BLUE }}>{q.tts}</p>
                </div>
                {srSupported ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <button
                      onClick={handleRepeat}
                      disabled={repeatState === "listening"}
                      className="rounded-full p-3 transition-all active:scale-95 shadow-sm"
                      style={{
                        background: repeatState === "listening" ? "#dc2626" : repeatState === "matched" ? "#15803d" : TRAVEL_BLUE,
                        color: "#fff",
                      }}
                    >
                      <Mic size={18} />
                    </button>
                    {repeatState === "listening" && <p className="text-[10px] text-slate-400 animate-pulse">Ouvindo…</p>}
                    {repeatState === "matched" && <p className="text-[10px] font-bold text-green-600">Bem dito! ✓</p>}
                    {repeatState === "missed" && <p className="text-[10px] font-bold text-orange-500">Tenta outra vez!</p>}
                  </div>
                ) : (
                  <button onClick={() => speak(q.tts)} className="rounded-full p-3 active:opacity-60" style={{ background: TRAVEL_BG, color: TRAVEL_BLUE }}>
                    <Volume2 size={18} />
                  </button>
                )}
              </div>

              {/* Next button */}
              <div className="px-5 pb-4 flex justify-end">
                <button onClick={handleNext} className="px-6 py-2.5 rounded-xl font-black text-sm text-white active:opacity-80" style={{ background: TRAVEL_BLUE }}>
                  {qIndex + 1 >= total ? "Finish" : "Next →"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === "done" && (
        <div className="rounded-3xl overflow-hidden shadow-md border text-center" style={{ borderColor: TRAVEL_BORDER, background: "#fff" }}>
          <div className="px-5 py-8">
            <p className="text-5xl mb-3">{perfect ? "🏆" : score >= 7 ? "⭐⭐⭐" : score >= 5 ? "⭐⭐" : "⭐"}</p>
            <p className="text-2xl font-black mb-1" style={{ color: TRAVEL_BLUE }}>{score} / {total}</p>
            <p className="text-sm font-semibold text-slate-700 mb-1">
              {perfect ? "Perfeito! Estás pronto para viajar! 🌍" : score >= 7 ? "Muito bem! Quase lá! 👏" : score >= 5 ? "Bom trabalho! Continua! 💪" : "Não desistas! Continua a praticar! 🌱"}
            </p>
            <p className="text-xs text-slate-400 mb-6">
              {score >= 7 ? "You're ready for your trip to Portugal or Brazil!" : "Review the phrases and try again — you'll get there!"}
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={handleRestart} className="px-6 py-2.5 rounded-xl font-black text-sm text-white active:opacity-80" style={{ background: TRAVEL_BLUE }}>Play Again</button>
            </div>
            {wrongItems.length > 0 && (
              <div className="mt-5 text-left">
                <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: TRAVEL_BLUE }}>📋 Words to revisit</p>
                <div className="space-y-1.5">
                  {wrongItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-red-50 rounded-xl px-3 py-2">
                      <span className="text-xs text-slate-500">{item.en}</span>
                      <span className="text-xs font-bold text-red-600">{item.pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Directions Section ────────────────────────────────────────────────────────

const DIR_GREEN = "#059669";
const DIR_BG = "#ecfdf5";
const DIR_BORDER = "#a7f3d0";

const DIR_CATEGORIES: { label: string; items: { pt: string; en: string }[] }[] = [
  {
    label: "💬 Key Phrases",
    items: [
      { pt: "Pode me dizer como chegar?", en: "Could you tell me how to get to...?" },
      { pt: "Onde está?", en: "Where is...?" },
    ],
  },
  {
    label: "🏛️ Places",
    items: [
      { pt: "O hotel", en: "The hotel" },
      { pt: "O quarto", en: "The room" },
      { pt: "O museu", en: "The museum" },
      { pt: "O parque", en: "The park" },
      { pt: "A catedral", en: "The cathedral" },
      { pt: "A cascata", en: "The waterfall" },
      { pt: "O aeroporto", en: "The airport" },
    ],
  },
  {
    label: "🧭 Directions",
    items: [
      { pt: "Esquerda", en: "Left" },
      { pt: "Direita", en: "Right" },
      { pt: "Reto", en: "Straight ahead" },
      { pt: "Por aí", en: "Around there" },
      { pt: "Em frente", en: "In front of" },
      { pt: "Atrás", en: "Behind" },
    ],
  },
  {
    label: "🛣️ Roads",
    items: [
      { pt: "Rua", en: "Road" },
      { pt: "Avenida", en: "Avenue" },
      { pt: "Estrada", en: "Highway" },
      { pt: "Faixa", en: "Lane" },
    ],
  },
  {
    label: "🚶 Verbs",
    items: [
      { pt: "Seguir", en: "To follow" },
      { pt: "Virar", en: "To turn" },
      { pt: "Vira a...", en: "Turn..." },
    ],
  },
];

const DIR_QUIZ: TravelQ[] = [
  { english: "Left", options: ["Esquerda", "Direita", "Reto", "Por aí"], correct: "Esquerda", tts: "Esquerda", matchPhrase: "esquerda" },
  { english: "Right", options: ["Direita", "Esquerda", "Em frente", "Atrás"], correct: "Direita", tts: "Direita", matchPhrase: "direita" },
  { english: "Straight ahead", options: ["Reto", "Por aí", "Atrás", "Virar"], correct: "Reto", tts: "Reto", matchPhrase: "reto" },
  { english: "In front of", options: ["Em frente", "Atrás", "Esquerda", "Reto"], correct: "Em frente", tts: "Em frente", matchPhrase: "em frente" },
  { english: "Behind", options: ["Atrás", "Em frente", "Por aí", "Seguir"], correct: "Atrás", tts: "Atrás", matchPhrase: "atrás" },
  { english: "The airport", options: ["O aeroporto", "O museu", "O parque", "A catedral"], correct: "O aeroporto", tts: "O aeroporto", matchPhrase: "aeroporto" },
  { english: "The waterfall", options: ["A cascata", "O parque", "A catedral", "O museu"], correct: "A cascata", tts: "A cascata", matchPhrase: "cascata" },
  { english: "Could you tell me how to get to...?", options: ["Pode dizer-me como chegar?", "Onde está?", "Sabe onde fica?", "Como chego ao?"], correct: "Pode dizer-me como chegar?", tts: "Pode dizer-me como chegar?", matchPhrase: "pode dizer chegar" },
  { english: "Highway", options: ["Estrada", "Rua", "Avenida", "Faixa"], correct: "Estrada", tts: "Estrada", matchPhrase: "estrada" },
  { english: "To turn", options: ["Virar", "Seguir", "Reto", "Por aí"], correct: "Virar", tts: "Virar", matchPhrase: "virar" },
];

// ─── Syllabification helper ────────────────────────────────────────────────────

function syllabify(raw: string): string[] {
  const VOWELS = new Set([..."aeiouáéíóúâêôãõà"]);
  const isV = (c: string) => VOWELS.has((c ?? "").toLowerCase());
  const clean = raw.replace(/[.,?!…]/g, "").trim();
  const words = clean.split(/\s+/);
  if (words.length > 1) return words;
  const w = words[0];
  const out: string[] = [];
  let syl = "";
  let i = 0;
  while (i < w.length) {
    syl += w[i];
    if (isV(w[i])) {
      // absorb trailing vowels (diphthong / hiatus treated simply)
      while (i + 1 < w.length && isV(w[i + 1]) && !["a","e","o"].includes(w[i].toLowerCase())) {
        i++; syl += w[i];
      }
      // count consonants before next vowel
      let j = i + 1; let cons = 0;
      while (j < w.length && !isV(w[j])) { cons++; j++; }
      if (j >= w.length) {
        syl += w.slice(i + 1); out.push(syl); syl = ""; i = w.length - 1;
      } else if (cons <= 1) {
        out.push(syl); syl = "";
      } else {
        syl += w[i + 1]; out.push(syl); syl = ""; i++;
      }
    }
    i++;
  }
  if (syl) out.push(syl);
  return out.filter(Boolean).map(s => s.toLowerCase());
}

// ─── VocabDrillCard ────────────────────────────────────────────────────────────

type DrillPhase = "auto" | "ready" | "listening" | "correct" | "wrong" | "sounding";

function VocabDrillCard({
  items, speak, accentColor, bgColor, borderColor,
}: {
  items: { pt: string; en: string }[];
  speak: (t: string) => void;
  accentColor: string; bgColor: string; borderColor: string;
}) {
  const { listen, status: srStatus, supported: srSupported } = useSpeechRecognition();
  const [idx, setIdx] = useState(0);
  const [drillPhase, setDrillPhase] = useState<DrillPhase>("auto");
  const [litSyl, setLitSyl] = useState(-1);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soundRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const item = items[idx];
  const syllables = syllabify(item.pt);

  // Auto-speak on mount and whenever idx changes
  useEffect(() => {
    setDrillPhase("auto");
    setLitSyl(-1);
    autoRef.current = setTimeout(() => {
      speak(item.pt);
      setDrillPhase("ready");
    }, 500);
    return () => {
      if (autoRef.current) clearTimeout(autoRef.current);
      if (soundRef.current) clearTimeout(soundRef.current);
    };
  }, [idx]);

  function handleListen() {
    if (drillPhase !== "ready" && drillPhase !== "wrong") return;
    if (srStatus === "listening") return;
    setDrillPhase("listening");
    const target = item.pt.toLowerCase().replace(/[^a-záéíóúâêôãõàç\s]/gi, "").trim();
    listen(
      (_raw, matches) => {
        if (matches(target.split(" ").slice(0, 2).join(" "))) {
          setDrillPhase("correct");
          autoRef.current = setTimeout(() => {
            setIdx(i => (i + 1) % items.length);
          }, 1400);
        } else {
          setDrillPhase("wrong");
        }
      },
      () => { if (drillPhase === "listening") setDrillPhase("ready"); },
    );
  }

  async function soundOut() {
    setDrillPhase("sounding");
    for (let s = 0; s < syllables.length; s++) {
      setLitSyl(s);
      speak(syllables[s]);
      await new Promise<void>(res => { soundRef.current = setTimeout(res, 850); });
    }
    setLitSyl(-1);
    await new Promise<void>(res => { soundRef.current = setTimeout(res, 300); });
    speak(item.pt);
    await new Promise<void>(res => { soundRef.current = setTimeout(res, 900); });
    setDrillPhase("ready");
  }

  const isMultiWord = item.pt.trim().includes(" ");

  return (
    <div className="rounded-2xl overflow-hidden border shadow-sm" style={{ borderColor, background: "#fff" }}>
      {/* Word display */}
      <div className="px-5 pt-5 pb-3 text-center" style={{ background: bgColor }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Say this out loud</p>
        <p className="text-2xl font-black mb-1" style={{ color: accentColor }}>{item.pt}</p>
        <p className="text-sm text-slate-500">{item.en}</p>
        {/* Syllable breakdown — always shown, highlights current during sounding */}
        {!isMultiWord && syllables.length > 1 && (
          <div className="flex justify-center gap-0.5 mt-2 flex-wrap">
            {syllables.map((s, si) => (
              <span key={si} className="transition-all duration-200">
                <span className="text-sm font-bold px-1 py-0.5 rounded"
                  style={{
                    background: litSyl === si ? accentColor : "transparent",
                    color: litSyl === si ? "#fff" : "#94a3b8",
                  }}>
                  {s}
                </span>
                {si < syllables.length - 1 && (
                  <span className="text-slate-300 text-xs">·</span>
                )}
              </span>
            ))}
          </div>
        )}
        {isMultiWord && (
          <div className="flex justify-center gap-1 mt-2 flex-wrap">
            {syllables.map((w, wi) => (
              <span key={wi} className="text-sm font-bold px-1.5 py-0.5 rounded transition-all duration-200"
                style={{
                  background: litSyl === wi ? accentColor : "rgba(0,0,0,0.06)",
                  color: litSyl === wi ? "#fff" : "#64748b",
                }}>
                {w}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Status + controls */}
      <div className="px-5 py-4 space-y-3">
        {/* Phase message */}
        {drillPhase === "auto" && (
          <p className="text-xs text-center text-slate-400 animate-pulse">Listening…</p>
        )}
        {drillPhase === "ready" && (
          <p className="text-xs text-center text-slate-500">
            {srSupported ? "Now repeat it — tap the mic when ready" : "Tap 🔊 to hear it again"}
          </p>
        )}
        {drillPhase === "listening" && (
          <p className="text-xs text-center animate-pulse" style={{ color: accentColor }}>Ouvindo… speak now</p>
        )}
        {drillPhase === "correct" && (
          <p className="text-sm font-black text-center text-green-600">Bem dito! ✓</p>
        )}
        {drillPhase === "wrong" && (
          <div className="space-y-1 text-center">
            <p className="text-sm font-bold text-orange-500">Tenta outra vez! — let me sound it out</p>
          </div>
        )}
        {drillPhase === "sounding" && (
          <p className="text-xs text-center animate-pulse" style={{ color: accentColor }}>Sounding out…</p>
        )}

        {/* Mic / speak buttons */}
        <div className="flex items-center justify-center gap-4">
          {/* Replay button always available */}
          <button onClick={() => { speak(item.pt); setDrillPhase("ready"); }}
            className="rounded-full p-3 active:opacity-60 transition-all"
            style={{ background: bgColor, color: accentColor }}>
            <Volume2 size={20} />
          </button>

          {/* Sound-out button — shown when wrong */}
          {drillPhase === "wrong" && (
            <button onClick={soundOut}
              className="rounded-full px-4 py-2.5 font-bold text-xs text-white active:opacity-70 shadow-sm"
              style={{ background: accentColor }}>
              Sound it out
            </button>
          )}

          {/* Mic button */}
          {srSupported && (
            <button onClick={handleListen}
              disabled={drillPhase === "auto" || drillPhase === "sounding" || drillPhase === "correct"}
              className="rounded-full p-3 transition-all active:scale-95 shadow-sm disabled:opacity-30"
              style={{
                background: drillPhase === "listening" ? "#dc2626"
                  : drillPhase === "correct" ? "#15803d"
                  : accentColor,
                color: "#fff",
              }}>
              <Mic size={20} />
            </button>
          )}
        </div>

        {/* Word counter + skip */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-slate-400 font-semibold">{idx + 1} / {items.length}</p>
          <button onClick={() => setIdx(i => (i + 1) % items.length)}
            className="text-[11px] font-bold active:opacity-60 px-2 py-1 rounded-lg"
            style={{ color: accentColor, background: bgColor }}>
            Skip →
          </button>
        </div>
      </div>
    </div>
  );
}

function DirectionsSection({ speak, lessonId }: { speak: (t: string) => void; lessonId: string }) {
  const { listen, status: srStatus, supported: srSupported } = useSpeechRecognition();
  const [phase, setPhase] = useState<"learn" | "play" | "done">("learn");
  const [selectedCat, setSelectedCat] = useState(0);
  const [drillMode, setDrillMode] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [repeatState, setRepeatState] = useState<"idle" | "listening" | "matched" | "missed">("idle");
  const [score, setScore] = useState(0);
  const [wrongItems, setWrongItems] = useState<{en:string;pt:string}[]>([]);
  const wrongItemsRef = useRef<{en:string;pt:string}[]>([]);
  const speakTimer2 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { carActive, triggerCar } = useCarAnimation();

  const q = DIR_QUIZ[qIndex];
  const isCorrect = selected === q?.correct;
  const total = DIR_QUIZ.length;

  useEffect(() => {
    if (selected !== null) {
      speakTimer2.current = setTimeout(() => speak(q.tts), 350);
    }
    return () => { if (speakTimer2.current) clearTimeout(speakTimer2.current); };
  }, [selected, qIndex]);

  function handleSelect(opt: string) {
    if (selected !== null) return;
    setSelected(opt);
    if (opt === q.correct) { setScore(s => s + 1); triggerCar(); }
    else wrongItemsRef.current.push({ en: q.english, pt: q.correct });
  }

  function handleRepeat() {
    if (srStatus === "listening") return;
    setRepeatState("listening");
    listen(
      (_, matches) => setRepeatState(matches(q.matchPhrase) ? "matched" : "missed"),
      () => setRepeatState("idle"),
    );
  }

  function handleNext() {
    if (speakTimer2.current) clearTimeout(speakTimer2.current);
    if (qIndex + 1 >= total) {
      const wrongs = [...wrongItemsRef.current];
      const wrongPts = wrongs.map(w => w.pt);
      const correctPts = DIR_QUIZ.map(q2 => q2.correct).filter(c => !wrongPts.includes(c));
      mergeProficiency(lessonId, correctPts, wrongPts);
      updateLessonProgress(lessonId, { quizScore: score, quizTotal: total });
      setWrongItems(wrongs);
      setPhase("done");
    } else { setQIndex(i => i + 1); setSelected(null); setRepeatState("idle"); }
  }

  function handleRestart() {
    wrongItemsRef.current = [];
    setWrongItems([]);
    setQIndex(0); setSelected(null); setRepeatState("idle"); setScore(0); setPhase("play");
  }

  const motivMsg = selected !== null
    ? (isCorrect ? CORRECT_MSG[qIndex % CORRECT_MSG.length] : INCORRECT_MSG[qIndex % INCORRECT_MSG.length])
    : "";
  const perfect = score === total;

  return (
    <div className="space-y-4">
      <PortugueseCarAnimation active={carActive} />
      <div className="flex items-center gap-2 px-1">
        <span className="text-lg">🧭</span>
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: DIR_GREEN }}>Direções</p>
          <p className="text-xs text-slate-500">Asking for directions</p>
        </div>
      </div>

      {/* LEARN */}
      {phase === "learn" && (
        <div className="space-y-3">
          {/* Category pill selector */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {DIR_CATEGORIES.map((cat, i) => (
              <button key={i} onClick={() => { setSelectedCat(i); setDrillMode(false); }}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all active:scale-95 whitespace-nowrap"
                style={selectedCat === i
                  ? { background: DIR_GREEN, borderColor: DIR_GREEN, color: "#fff" }
                  : { background: "#fff", borderColor: DIR_BORDER, color: DIR_GREEN }}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Active category card header */}
          <div className="rounded-2xl overflow-hidden shadow-sm border" style={{ borderColor: DIR_BORDER, background: "#fff" }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: DIR_BG, borderBottom: `1px solid ${DIR_BORDER}` }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">You're learning</p>
                <p className="text-sm font-black" style={{ color: DIR_GREEN }}>{DIR_CATEGORIES[selectedCat].label}</p>
              </div>
              {/* Browse / Drill toggle */}
              <div className="flex rounded-lg overflow-hidden border-2" style={{ borderColor: DIR_BORDER }}>
                <button onClick={() => setDrillMode(false)}
                  className="px-2.5 py-1 text-[11px] font-bold transition-all"
                  style={!drillMode ? { background: DIR_GREEN, color: "#fff" } : { background: "#fff", color: DIR_GREEN }}>
                  Browse
                </button>
                <button onClick={() => setDrillMode(true)}
                  className="px-2.5 py-1 text-[11px] font-bold transition-all"
                  style={drillMode ? { background: DIR_GREEN, color: "#fff" } : { background: "#fff", color: DIR_GREEN }}>
                  🎤 Drill
                </button>
              </div>
            </div>

            {!drillMode ? (
              <div className="divide-y" style={{ divideColor: DIR_BORDER }}>
                {DIR_CATEGORIES[selectedCat].items.map(({ pt, en }) => (
                  <div key={pt} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: DIR_GREEN }}>{pt}</p>
                      <p className="text-xs text-slate-400">{en}</p>
                    </div>
                    <button onClick={() => speak(pt)} className="shrink-0 rounded-full p-1.5 active:opacity-60" style={{ background: DIR_BG, color: DIR_GREEN }}>
                      <Volume2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3">
                <VocabDrillCard
                  items={DIR_CATEGORIES[selectedCat].items}
                  speak={speak}
                  accentColor={DIR_GREEN}
                  bgColor={DIR_BG}
                  borderColor={DIR_BORDER}
                />
              </div>
            )}
          </div>

          {/* Prev / Next navigation */}
          <div className="flex gap-2">
            <button onClick={() => { setSelectedCat(i => Math.max(0, i - 1)); setDrillMode(false); }} disabled={selectedCat === 0}
              className="flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all active:opacity-70 disabled:opacity-30"
              style={{ borderColor: DIR_BORDER, color: DIR_GREEN, background: "#fff" }}>
              ← Previous
            </button>
            <button onClick={() => { setSelectedCat(i => Math.min(DIR_CATEGORIES.length - 1, i + 1)); setDrillMode(false); }} disabled={selectedCat === DIR_CATEGORIES.length - 1}
              className="flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all active:opacity-70 disabled:opacity-30"
              style={{ borderColor: DIR_BORDER, color: DIR_GREEN, background: "#fff" }}>
              Next →
            </button>
          </div>

          <button onClick={() => setPhase("play")} className="w-full py-3.5 rounded-2xl font-black text-white text-sm tracking-wide shadow-md active:opacity-80" style={{ background: DIR_GREEN }}>
            Start Directions Quiz →
          </button>
        </div>
      )}

      {/* PLAY */}
      {phase === "play" && q && (
        <div className="rounded-3xl overflow-hidden shadow-md border" style={{ borderColor: DIR_BORDER }}>
          <div style={{ background: DIR_GREEN }} className="px-5 pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-white/80 uppercase tracking-widest">Question {qIndex + 1} of {total}</p>
              <p className="text-xs font-black text-white">Score: {score} / {total}</p>
            </div>
            <div className="flex gap-1">
              {DIR_QUIZ.map((_, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
                  style={{ background: i < qIndex ? "rgba(255,255,255,0.9)" : i === qIndex ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)" }} />
              ))}
            </div>
          </div>

          <div className="px-5 py-5 bg-white" style={{ borderBottom: `1px solid ${DIR_BORDER}` }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 text-center">What's the Portuguese for…</p>
            <p className="text-lg font-black text-slate-800 text-center leading-snug">{q.english}</p>
          </div>

          <div className="grid grid-cols-1 gap-2 p-4 bg-white">
            {q.options.map((opt) => {
              const isSelected = selected === opt;
              const isCorrectOpt = opt === q.correct;
              let bg = DIR_BG; let border = DIR_BORDER; let color = DIR_GREEN; let icon = "";
              if (selected !== null) {
                if (isCorrectOpt) { bg = "#dcfce7"; border = "#86efac"; color = "#15803d"; icon = " ✓"; }
                else if (isSelected) { bg = "#fee2e2"; border = "#fca5a5"; color = "#dc2626"; icon = " ✗"; }
                else { bg = "#f1f5f9"; border = "#e2e8f0"; color = "#94a3b8"; }
              }
              return (
                <button key={opt} onClick={() => handleSelect(opt)} disabled={selected !== null}
                  className="py-3 px-4 rounded-xl font-semibold text-sm text-left transition-all active:scale-95 border-2 leading-snug"
                  style={{ background: bg, borderColor: border, color }}>
                  {opt}{icon}
                </button>
              );
            })}
          </div>

          {selected !== null && (
            <div style={{ background: isCorrect ? "#f0fdf4" : "#fff7f7", borderTop: `1px solid ${isCorrect ? "#bbf7d0" : "#fecaca"}` }}>
              <div className="px-5 pt-4 pb-2 flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-base font-black" style={{ color: isCorrect ? "#15803d" : "#d97706" }}>{motivMsg}</p>
                  {!isCorrect && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      A resposta correta é: <span className="font-bold" style={{ color: DIR_GREEN }}>{q.correct}</span>
                    </p>
                  )}
                </div>
                <button onClick={() => speak(q.tts)} className="shrink-0 rounded-full p-2 active:opacity-60" style={{ background: DIR_BG, color: DIR_GREEN }}>
                  <Volume2 size={15} />
                </button>
              </div>

              <div className="px-5 pb-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Repeat after me</p>
                  <p className="text-sm font-bold" style={{ color: DIR_GREEN }}>{q.tts}</p>
                </div>
                {srSupported ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <button onClick={handleRepeat} disabled={repeatState === "listening"}
                      className="rounded-full p-3 transition-all active:scale-95 shadow-sm"
                      style={{ background: repeatState === "listening" ? "#dc2626" : repeatState === "matched" ? "#15803d" : DIR_GREEN, color: "#fff" }}>
                      <Mic size={18} />
                    </button>
                    {repeatState === "listening" && <p className="text-[10px] text-slate-400 animate-pulse">Ouvindo…</p>}
                    {repeatState === "matched" && <p className="text-[10px] font-bold text-green-600">Bem dito! ✓</p>}
                    {repeatState === "missed" && <p className="text-[10px] font-bold text-orange-500">Tenta outra vez!</p>}
                  </div>
                ) : (
                  <button onClick={() => speak(q.tts)} className="rounded-full p-3 active:opacity-60" style={{ background: DIR_BG, color: DIR_GREEN }}>
                    <Volume2 size={18} />
                  </button>
                )}
              </div>

              <div className="px-5 pb-4 flex justify-end">
                <button onClick={handleNext} className="px-6 py-2.5 rounded-xl font-black text-sm text-white active:opacity-80" style={{ background: DIR_GREEN }}>
                  {qIndex + 1 >= total ? "Finish" : "Next →"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DONE */}
      {phase === "done" && (
        <div className="rounded-3xl overflow-hidden shadow-md border text-center" style={{ borderColor: DIR_BORDER, background: "#fff" }}>
          <div className="px-5 py-8">
            <p className="text-5xl mb-3">{perfect ? "🏆" : score >= 7 ? "⭐⭐⭐" : score >= 5 ? "⭐⭐" : "⭐"}</p>
            <p className="text-2xl font-black mb-1" style={{ color: DIR_GREEN }}>{score} / {total}</p>
            <p className="text-sm font-semibold text-slate-700 mb-1">
              {perfect ? "Perfeito! Já encontras o caminho! 🗺️" : score >= 7 ? "Muito bem! Continua! 👏" : score >= 5 ? "Bom trabalho! Mais um pouco! 💪" : "Não desistas! Revê as palavras! 🌱"}
            </p>
            <p className="text-xs text-slate-400 mb-6">{score >= 7 ? "You can confidently ask for directions in Portuguese!" : "Review the vocabulary cards above and try again."}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={handleRestart} className="px-6 py-2.5 rounded-xl font-black text-sm text-white active:opacity-80" style={{ background: DIR_GREEN }}>Play Again</button>
              <button onClick={() => setPhase("learn")} className="px-6 py-2.5 rounded-xl font-black text-sm border-2 active:opacity-80" style={{ borderColor: DIR_BORDER, color: DIR_GREEN, background: DIR_BG }}>Review</button>
            </div>
            {wrongItems.length > 0 && (
              <div className="mt-5 text-left">
                <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: DIR_GREEN }}>📋 Words to revisit</p>
                <div className="space-y-1.5">
                  {wrongItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-red-50 rounded-xl px-3 py-2">
                      <span className="text-xs text-slate-500">{item.en}</span>
                      <span className="text-xs font-bold text-red-600">{item.pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shopping Section ──────────────────────────────────────────────────────────

const SHOP_ORANGE = "#ea580c";
const SHOP_BG = "#fff7ed";
const SHOP_BORDER = "#fed7aa";

const SHOP_CATEGORIES: { label: string; items: { pt: string; en: string }[] }[] = [
  {
    label: "🛍️ Key Phrases",
    items: [
      { pt: "Quanto custa?", en: "How much does it cost?" },
      { pt: "Quanto custa esta...?", en: "How much does this... cost?" },
      { pt: "Tem...?", en: "Do you have...?" },
      { pt: "A que horas abre/fecha?", en: "What time does it open/close?" },
      { pt: "A que horas abrem/fecham?", en: "What time do you open/close?" },
      { pt: "Vou pagar só 5 euros. Nada mais.", en: "I'll only pay five euros. Nothing more." },
    ],
  },
  {
    label: "👗 Clothing & Souvenirs",
    items: [
      { pt: "Camisa", en: "Shirt" },
      { pt: "Saia", en: "Skirt" },
      { pt: "Calças", en: "Pants" },
      { pt: "Vestido", en: "Dress" },
      { pt: "Sapatos", en: "Shoes" },
      { pt: "Souvenir", en: "Souvenir" },
      { pt: "Lembrança", en: "Souvenir (alternative)" },
    ],
  },
];

const SHOP_QUIZ: TravelQ[] = [
  {
    english: "How much does it cost?",
    options: ["Quanto custa?", "Tem?", "Que horas fecha?", "Onde está?"],
    correct: "Quanto custa?",
    tts: "Quanto custa?",
    matchPhrase: "quanto custa",
  },
  {
    english: "Do you have...?",
    options: ["Tem?", "Quanto custa?", "Onde fica?", "Para onde vai?"],
    correct: "Tem?",
    tts: "Tem?",
    matchPhrase: "tem",
  },
  {
    english: "What time does it open/close?",
    options: ["A que horas abre/fecha?", "Tem?", "Quanto custa?", "Onde está?"],
    correct: "A que horas abre/fecha?",
    tts: "A que horas abre e fecha?",
    matchPhrase: "que horas abre",
  },
  {
    english: "I'll only pay five euros. Nothing more.",
    options: ["Vou pagar só 5 euros. Nada mais.", "Quanto custa?", "Tem?", "Que horas fecha?"],
    correct: "Vou pagar só 5 euros. Nada mais.",
    tts: "Vou pagar só 5 euros. Nada mais.",
    matchPhrase: "vou pagar nada mais",
  },
  {
    english: "Shirt",
    options: ["Camisa", "Saia", "Vestido", "Calças"],
    correct: "Camisa",
    tts: "Camisa",
    matchPhrase: "camisa",
  },
  {
    english: "Skirt",
    options: ["Saia", "Camisa", "Vestido", "Sapatos"],
    correct: "Saia",
    tts: "Saia",
    matchPhrase: "saia",
  },
  {
    english: "Dress",
    options: ["Vestido", "Saia", "Calças", "Camisa"],
    correct: "Vestido",
    tts: "Vestido",
    matchPhrase: "vestido",
  },
  {
    english: "Pants",
    options: ["Calças", "Sapatos", "Saia", "Vestido"],
    correct: "Calças",
    tts: "Calças",
    matchPhrase: "calças",
  },
  {
    english: "Shoes",
    options: ["Sapatos", "Calças", "Camisa", "Souvenir"],
    correct: "Sapatos",
    tts: "Sapatos",
    matchPhrase: "sapatos",
  },
  {
    english: "Souvenir — alternative Portuguese word",
    options: ["Lembrança", "Souvenir", "Camisa", "Saia"],
    correct: "Lembrança",
    tts: "Lembrança",
    matchPhrase: "lembrança",
  },
];

function ShoppingSection({ speak, lessonId }: { speak: (t: string) => void; lessonId: string }) {
  const { listen, status: srStatus, supported: srSupported } = useSpeechRecognition();
  const [phase, setPhase] = useState<"learn" | "play" | "done">("learn");
  const [selectedCat, setSelectedCat] = useState(0);
  const [drillMode, setDrillMode] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [repeatState, setRepeatState] = useState<"idle" | "listening" | "matched" | "missed">("idle");
  const [score, setScore] = useState(0);
  const [wrongItems, setWrongItems] = useState<{en:string;pt:string}[]>([]);
  const wrongItemsRef = useRef<{en:string;pt:string}[]>([]);
  const shopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { carActive, triggerCar } = useCarAnimation();

  const q = SHOP_QUIZ[qIndex];
  const isCorrect = selected === q?.correct;
  const total = SHOP_QUIZ.length;

  useEffect(() => {
    if (selected !== null) {
      shopTimer.current = setTimeout(() => speak(q.tts), 350);
    }
    return () => { if (shopTimer.current) clearTimeout(shopTimer.current); };
  }, [selected, qIndex]);

  function handleSelect(opt: string) {
    if (selected !== null) return;
    setSelected(opt);
    if (opt === q.correct) { setScore(s => s + 1); triggerCar(); }
    else wrongItemsRef.current.push({ en: q.english, pt: q.correct });
  }

  function handleRepeat() {
    if (srStatus === "listening") return;
    setRepeatState("listening");
    listen(
      (_, matches) => setRepeatState(matches(q.matchPhrase) ? "matched" : "missed"),
      () => setRepeatState("idle"),
    );
  }

  function handleNext() {
    if (shopTimer.current) clearTimeout(shopTimer.current);
    if (qIndex + 1 >= total) {
      const wrongs = [...wrongItemsRef.current];
      const wrongPts = wrongs.map(w => w.pt);
      const correctPts = SHOP_QUIZ.map(q2 => q2.correct).filter(c => !wrongPts.includes(c));
      mergeProficiency(lessonId, correctPts, wrongPts);
      updateLessonProgress(lessonId, { quizScore: score, quizTotal: total });
      setWrongItems(wrongs);
      setPhase("done");
    } else { setQIndex(i => i + 1); setSelected(null); setRepeatState("idle"); }
  }

  function handleRestart() {
    wrongItemsRef.current = [];
    setWrongItems([]);
    setQIndex(0); setSelected(null); setRepeatState("idle"); setScore(0); setPhase("play");
  }

  const motivMsg = selected !== null
    ? (isCorrect ? CORRECT_MSG[qIndex % CORRECT_MSG.length] : INCORRECT_MSG[qIndex % INCORRECT_MSG.length])
    : "";
  const perfect = score === total;

  return (
    <div className="space-y-4">
      <PortugueseCarAnimation active={carActive} />
      <div className="flex items-center gap-2 px-1">
        <span className="text-lg">🛒</span>
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: SHOP_ORANGE }}>Às Compras</p>
          <p className="text-xs text-slate-500">Shopping phrases &amp; clothing vocabulary</p>
        </div>
      </div>

      {/* LEARN */}
      {phase === "learn" && (
        <div className="space-y-3">
          {/* Category pill selector */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {SHOP_CATEGORIES.map((cat, i) => (
              <button key={i} onClick={() => { setSelectedCat(i); setDrillMode(false); }}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all active:scale-95 whitespace-nowrap"
                style={selectedCat === i
                  ? { background: SHOP_ORANGE, borderColor: SHOP_ORANGE, color: "#fff" }
                  : { background: "#fff", borderColor: SHOP_BORDER, color: SHOP_ORANGE }}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Active category card */}
          <div className="rounded-2xl overflow-hidden shadow-sm border" style={{ borderColor: SHOP_BORDER, background: "#fff" }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: SHOP_BG, borderBottom: `1px solid ${SHOP_BORDER}` }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">You're learning</p>
                <p className="text-sm font-black" style={{ color: SHOP_ORANGE }}>{SHOP_CATEGORIES[selectedCat].label}</p>
              </div>
              {/* Browse / Drill toggle */}
              <div className="flex rounded-lg overflow-hidden border-2" style={{ borderColor: SHOP_BORDER }}>
                <button onClick={() => setDrillMode(false)}
                  className="px-2.5 py-1 text-[11px] font-bold transition-all"
                  style={!drillMode ? { background: SHOP_ORANGE, color: "#fff" } : { background: "#fff", color: SHOP_ORANGE }}>
                  Browse
                </button>
                <button onClick={() => setDrillMode(true)}
                  className="px-2.5 py-1 text-[11px] font-bold transition-all"
                  style={drillMode ? { background: SHOP_ORANGE, color: "#fff" } : { background: "#fff", color: SHOP_ORANGE }}>
                  🎤 Drill
                </button>
              </div>
            </div>

            {!drillMode ? (
              <div className="divide-y" style={{ divideColor: SHOP_BORDER }}>
                {SHOP_CATEGORIES[selectedCat].items.map(({ pt, en }) => (
                  <div key={pt} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: SHOP_ORANGE }}>{pt}</p>
                      <p className="text-xs text-slate-400">{en}</p>
                    </div>
                    <button onClick={() => speak(pt)} className="shrink-0 rounded-full p-1.5 active:opacity-60" style={{ background: SHOP_BG, color: SHOP_ORANGE }}>
                      <Volume2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3">
                <VocabDrillCard
                  items={SHOP_CATEGORIES[selectedCat].items}
                  speak={speak}
                  accentColor={SHOP_ORANGE}
                  bgColor={SHOP_BG}
                  borderColor={SHOP_BORDER}
                />
              </div>
            )}
          </div>

          {/* Prev / Next navigation */}
          <div className="flex gap-2">
            <button onClick={() => { setSelectedCat(i => Math.max(0, i - 1)); setDrillMode(false); }} disabled={selectedCat === 0}
              className="flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all active:opacity-70 disabled:opacity-30"
              style={{ borderColor: SHOP_BORDER, color: SHOP_ORANGE, background: "#fff" }}>
              ← Previous
            </button>
            <button onClick={() => { setSelectedCat(i => Math.min(SHOP_CATEGORIES.length - 1, i + 1)); setDrillMode(false); }} disabled={selectedCat === SHOP_CATEGORIES.length - 1}
              className="flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all active:opacity-70 disabled:opacity-30"
              style={{ borderColor: SHOP_BORDER, color: SHOP_ORANGE, background: "#fff" }}>
              Next →
            </button>
          </div>

          {/* Haggling tip */}
          <div className="rounded-2xl px-4 py-3 flex gap-3 items-start" style={{ background: SHOP_BG, border: `1px solid ${SHOP_BORDER}` }}>
            <span className="text-xl mt-0.5">💡</span>
            <p className="text-xs text-slate-700 leading-relaxed">
              <span className="font-bold" style={{ color: SHOP_ORANGE }}>Bargaining tip:</span>{" "}
              Haggling is normal in many markets in Brazil and Portugal. Start low and use{" "}
              <button onClick={() => speak("Vou pagar só 5 euros. Nada mais.")} className="font-bold italic underline decoration-dotted active:opacity-60" style={{ color: SHOP_ORANGE }}>
                Vou pagar só... Nada mais.
              </button>{" "}
              to hold your ground.
            </p>
          </div>

          <button onClick={() => setPhase("play")} className="w-full py-3.5 rounded-2xl font-black text-white text-sm tracking-wide shadow-md active:opacity-80" style={{ background: SHOP_ORANGE }}>
            Start Shopping Quiz →
          </button>
        </div>
      )}

      {/* PLAY */}
      {phase === "play" && q && (
        <div className="rounded-3xl overflow-hidden shadow-md border" style={{ borderColor: SHOP_BORDER }}>
          <div style={{ background: SHOP_ORANGE }} className="px-5 pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-white/80 uppercase tracking-widest">Question {qIndex + 1} of {total}</p>
              <p className="text-xs font-black text-white">Score: {score} / {total}</p>
            </div>
            <div className="flex gap-1">
              {SHOP_QUIZ.map((_, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
                  style={{ background: i < qIndex ? "rgba(255,255,255,0.9)" : i === qIndex ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)" }} />
              ))}
            </div>
          </div>

          <div className="px-5 py-5 bg-white" style={{ borderBottom: `1px solid ${SHOP_BORDER}` }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 text-center">What's the Portuguese for…</p>
            <p className="text-lg font-black text-slate-800 text-center leading-snug">{q.english}</p>
          </div>

          <div className="grid grid-cols-1 gap-2 p-4 bg-white">
            {q.options.map((opt) => {
              const isSelected = selected === opt;
              const isCorrectOpt = opt === q.correct;
              let bg = SHOP_BG; let border = SHOP_BORDER; let color = SHOP_ORANGE; let icon = "";
              if (selected !== null) {
                if (isCorrectOpt) { bg = "#dcfce7"; border = "#86efac"; color = "#15803d"; icon = " ✓"; }
                else if (isSelected) { bg = "#fee2e2"; border = "#fca5a5"; color = "#dc2626"; icon = " ✗"; }
                else { bg = "#f1f5f9"; border = "#e2e8f0"; color = "#94a3b8"; }
              }
              return (
                <button key={opt} onClick={() => handleSelect(opt)} disabled={selected !== null}
                  className="py-3 px-4 rounded-xl font-semibold text-sm text-left transition-all active:scale-95 border-2 leading-snug"
                  style={{ background: bg, borderColor: border, color }}>
                  {opt}{icon}
                </button>
              );
            })}
          </div>

          {selected !== null && (
            <div style={{ background: isCorrect ? "#f0fdf4" : "#fff7f7", borderTop: `1px solid ${isCorrect ? "#bbf7d0" : "#fecaca"}` }}>
              <div className="px-5 pt-4 pb-2 flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-base font-black" style={{ color: isCorrect ? "#15803d" : "#d97706" }}>{motivMsg}</p>
                  {!isCorrect && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      A resposta correta é: <span className="font-bold" style={{ color: SHOP_ORANGE }}>{q.correct}</span>
                    </p>
                  )}
                </div>
                <button onClick={() => speak(q.tts)} className="shrink-0 rounded-full p-2 active:opacity-60" style={{ background: SHOP_BG, color: SHOP_ORANGE }}>
                  <Volume2 size={15} />
                </button>
              </div>

              <div className="px-5 pb-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Repeat after me</p>
                  <p className="text-sm font-bold" style={{ color: SHOP_ORANGE }}>{q.tts}</p>
                </div>
                {srSupported ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <button onClick={handleRepeat} disabled={repeatState === "listening"}
                      className="rounded-full p-3 transition-all active:scale-95 shadow-sm"
                      style={{ background: repeatState === "listening" ? "#dc2626" : repeatState === "matched" ? "#15803d" : SHOP_ORANGE, color: "#fff" }}>
                      <Mic size={18} />
                    </button>
                    {repeatState === "listening" && <p className="text-[10px] text-slate-400 animate-pulse">Ouvindo…</p>}
                    {repeatState === "matched" && <p className="text-[10px] font-bold text-green-600">Bem dito! ✓</p>}
                    {repeatState === "missed" && <p className="text-[10px] font-bold text-orange-500">Tenta outra vez!</p>}
                  </div>
                ) : (
                  <button onClick={() => speak(q.tts)} className="rounded-full p-3 active:opacity-60" style={{ background: SHOP_BG, color: SHOP_ORANGE }}>
                    <Volume2 size={18} />
                  </button>
                )}
              </div>

              <div className="px-5 pb-4 flex justify-end">
                <button onClick={handleNext} className="px-6 py-2.5 rounded-xl font-black text-sm text-white active:opacity-80" style={{ background: SHOP_ORANGE }}>
                  {qIndex + 1 >= total ? "Finish" : "Next →"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DONE */}
      {phase === "done" && (
        <div className="rounded-3xl overflow-hidden shadow-md border text-center" style={{ borderColor: SHOP_BORDER, background: "#fff" }}>
          <div className="px-5 py-8">
            <p className="text-5xl mb-3">{perfect ? "🏆" : score >= 7 ? "⭐⭐⭐" : score >= 5 ? "⭐⭐" : "⭐"}</p>
            <p className="text-2xl font-black mb-1" style={{ color: SHOP_ORANGE }}>{score} / {total}</p>
            <p className="text-sm font-semibold text-slate-700 mb-1">
              {perfect ? "Perfeito! Estás pronto para ir às compras! 🛍️" : score >= 7 ? "Muito bem! Quase lá! 👏" : score >= 5 ? "Bom trabalho! Continua! 💪" : "Não desistas! Revê as palavras! 🌱"}
            </p>
            <p className="text-xs text-slate-400 mb-6">
              {score >= 7 ? "You're ready to shop and haggle in Portuguese!" : "Review the vocabulary cards above and try again."}
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={handleRestart} className="px-6 py-2.5 rounded-xl font-black text-sm text-white active:opacity-80" style={{ background: SHOP_ORANGE }}>Play Again</button>
              <button onClick={() => setPhase("learn")} className="px-6 py-2.5 rounded-xl font-black text-sm border-2 active:opacity-80" style={{ borderColor: SHOP_BORDER, color: SHOP_ORANGE, background: SHOP_BG }}>Review</button>
            </div>
            {wrongItems.length > 0 && (
              <div className="mt-5 text-left">
                <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: SHOP_ORANGE }}>📋 Words to revisit</p>
                <div className="space-y-1.5">
                  {wrongItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-red-50 rounded-xl px-3 py-2">
                      <span className="text-xs text-slate-500">{item.en}</span>
                      <span className="text-xs font-bold text-red-600">{item.pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Food & Drink Section ──────────────────────────────────────────────────────

const FOOD_ROSE = "#be185d";
const FOOD_BG = "#fdf2f8";
const FOOD_BORDER = "#fbcfe8";

const FOOD_CATEGORIES: { label: string; items: { pt: string; en: string }[] }[] = [
  {
    label: "🗣️ Key Phrases",
    items: [
      { pt: "Eu quero...", en: "I want..." },
      { pt: "Pode dar-me..., por favor?", en: "Can you please give me...?" },
    ],
  },
  {
    label: "🥤 Bebidas — Drinks",
    items: [
      { pt: "Água", en: "Water" },
      { pt: "Refrigerante", en: "Soda" },
      { pt: "Sumo", en: "Juice" },
      { pt: "Leite", en: "Milk" },
      { pt: "Vinho", en: "Wine" },
      { pt: "Cerveja", en: "Beer" },
    ],
  },
  {
    label: "🍽️ Comida — Food",
    items: [
      { pt: "Salada", en: "Salad" },
      { pt: "Sardinhas assadas", en: "Grilled sardines" },
      { pt: "Bacalhau", en: "Salted cod" },
      { pt: "Carne", en: "Meat" },
      { pt: "Frango", en: "Chicken" },
      { pt: "Sobremesa", en: "Dessert" },
      { pt: "Bolo", en: "Cake" },
      { pt: "Gelado", en: "Ice cream" },
    ],
  },
  {
    label: "🍎 Frutas — Fruit",
    items: [
      { pt: "Maçã", en: "Apple" },
      { pt: "Papaia", en: "Papaya" },
      { pt: "Morango", en: "Strawberry" },
      { pt: "Manga", en: "Mango" },
      { pt: "Maracujá", en: "Passionfruit" },
      { pt: "Goiaba", en: "Guava" },
      { pt: "Cereja", en: "Cherry" },
      { pt: "Caju", en: "Cashew fruit" },
    ],
  },
];

const FOOD_QUIZ: TravelQ[] = [
  {
    english: "I want...",
    options: ["Eu quero...", "Tem?", "Quanto custa?", "Onde está?"],
    correct: "Eu quero...",
    tts: "Eu quero",
    matchPhrase: "eu quero",
  },
  {
    english: "Can you please give me...?",
    options: ["Pode dar-me..., por favor?", "Eu quero...", "Quanto custa?", "Tem?"],
    correct: "Pode dar-me..., por favor?",
    tts: "Pode dar-me, por favor?",
    matchPhrase: "pode dar por favor",
  },
  {
    english: "Water",
    options: ["Água", "Sumo", "Leite", "Vinho"],
    correct: "Água",
    tts: "Água",
    matchPhrase: "água",
  },
  {
    english: "Beer",
    options: ["Cerveja", "Vinho", "Refrigerante", "Sumo"],
    correct: "Cerveja",
    tts: "Cerveja",
    matchPhrase: "cerveja",
  },
  {
    english: "Chicken",
    options: ["Frango", "Carne", "Arroz", "Feijão"],
    correct: "Frango",
    tts: "Frango",
    matchPhrase: "frango",
  },
  {
    english: "Grilled sardines",
    options: ["Sardinhas assadas", "Frango e Salada", "Bolo e Gelado", "Bacalhau"],
    correct: "Sardinhas assadas",
    tts: "Sardinhas assadas",
    matchPhrase: "sardinhas",
  },
  {
    english: "Dessert",
    options: ["Sobremesa", "Bolo", "Gelado", "Salada"],
    correct: "Sobremesa",
    tts: "Sobremesa",
    matchPhrase: "sobremesa",
  },
  {
    english: "Passionfruit",
    options: ["Maracujá", "Manga", "Morango", "Goiaba"],
    correct: "Maracujá",
    tts: "Maracujá",
    matchPhrase: "maracujá",
  },
  {
    english: "Cherry",
    options: ["Cereja", "Caju", "Papaia", "Maçã"],
    correct: "Cereja",
    tts: "Cereja",
    matchPhrase: "cereja",
  },
  {
    english: "Strawberry",
    options: ["Morango", "Manga", "Maçã", "Papaia"],
    correct: "Morango",
    tts: "Morango",
    matchPhrase: "morango",
  },
];

function FoodDrinkSection({ speak, lessonId }: { speak: (t: string) => void; lessonId: string }) {
  const { listen, status: srStatus, supported: srSupported } = useSpeechRecognition();
  const [phase, setPhase] = useState<"learn" | "play" | "done">("learn");
  const [selectedCat, setSelectedCat] = useState(0);
  const [drillMode, setDrillMode] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [repeatState, setRepeatState] = useState<"idle" | "listening" | "matched" | "missed">("idle");
  const [score, setScore] = useState(0);
  const [wrongItems, setWrongItems] = useState<{en:string;pt:string}[]>([]);
  const wrongItemsRef = useRef<{en:string;pt:string}[]>([]);
  const foodTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { carActive, triggerCar } = useCarAnimation();

  const q = FOOD_QUIZ[qIndex];
  const isCorrect = selected === q?.correct;
  const total = FOOD_QUIZ.length;

  useEffect(() => {
    if (selected !== null) {
      foodTimer.current = setTimeout(() => speak(q.tts), 350);
    }
    return () => { if (foodTimer.current) clearTimeout(foodTimer.current); };
  }, [selected, qIndex]);

  function handleSelect(opt: string) {
    if (selected !== null) return;
    setSelected(opt);
    if (opt === q.correct) { setScore(s => s + 1); triggerCar(); }
    else wrongItemsRef.current.push({ en: q.english, pt: q.correct });
  }

  function handleRepeat() {
    if (srStatus === "listening") return;
    setRepeatState("listening");
    listen(
      (_, matches) => setRepeatState(matches(q.matchPhrase) ? "matched" : "missed"),
      () => setRepeatState("idle"),
    );
  }

  function handleNext() {
    if (foodTimer.current) clearTimeout(foodTimer.current);
    if (qIndex + 1 >= total) {
      const wrongs = [...wrongItemsRef.current];
      const wrongPts = wrongs.map(w => w.pt);
      const correctPts = FOOD_QUIZ.map(q2 => q2.correct).filter(c => !wrongPts.includes(c));
      mergeProficiency(lessonId, correctPts, wrongPts);
      updateLessonProgress(lessonId, { quizScore: score, quizTotal: total });
      setWrongItems(wrongs);
      setPhase("done");
    } else { setQIndex(i => i + 1); setSelected(null); setRepeatState("idle"); }
  }

  function handleRestart() {
    wrongItemsRef.current = [];
    setWrongItems([]);
    setQIndex(0); setSelected(null); setRepeatState("idle"); setScore(0); setPhase("play");
  }

  const motivMsg = selected !== null
    ? (isCorrect ? CORRECT_MSG[qIndex % CORRECT_MSG.length] : INCORRECT_MSG[qIndex % INCORRECT_MSG.length])
    : "";
  const perfect = score === total;

  return (
    <div className="space-y-4">
      <PortugueseCarAnimation active={carActive} />
      <div className="flex items-center gap-2 px-1">
        <span className="text-lg">🍽️</span>
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: FOOD_ROSE }}>Comida &amp; Bebidas</p>
          <p className="text-xs text-slate-500">Ordering food &amp; drinks</p>
        </div>
      </div>

      {/* LEARN */}
      {phase === "learn" && (
        <div className="space-y-3">
          {/* Category pill selector */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {FOOD_CATEGORIES.map((cat, i) => (
              <button key={i} onClick={() => { setSelectedCat(i); setDrillMode(false); }}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all active:scale-95 whitespace-nowrap"
                style={selectedCat === i
                  ? { background: FOOD_ROSE, borderColor: FOOD_ROSE, color: "#fff" }
                  : { background: "#fff", borderColor: FOOD_BORDER, color: FOOD_ROSE }}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Active category card */}
          <div className="rounded-2xl overflow-hidden shadow-sm border" style={{ borderColor: FOOD_BORDER, background: "#fff" }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: FOOD_BG, borderBottom: `1px solid ${FOOD_BORDER}` }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">You're learning</p>
                <p className="text-sm font-black" style={{ color: FOOD_ROSE }}>{FOOD_CATEGORIES[selectedCat].label}</p>
              </div>
              {/* Browse / Drill toggle */}
              <div className="flex rounded-lg overflow-hidden border-2" style={{ borderColor: FOOD_BORDER }}>
                <button onClick={() => setDrillMode(false)}
                  className="px-2.5 py-1 text-[11px] font-bold transition-all"
                  style={!drillMode ? { background: FOOD_ROSE, color: "#fff" } : { background: "#fff", color: FOOD_ROSE }}>
                  Browse
                </button>
                <button onClick={() => setDrillMode(true)}
                  className="px-2.5 py-1 text-[11px] font-bold transition-all"
                  style={drillMode ? { background: FOOD_ROSE, color: "#fff" } : { background: "#fff", color: FOOD_ROSE }}>
                  🎤 Drill
                </button>
              </div>
            </div>

            {!drillMode ? (
              <div className="divide-y" style={{ divideColor: FOOD_BORDER }}>
                {FOOD_CATEGORIES[selectedCat].items.map(({ pt, en }) => (
                  <div key={pt} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: FOOD_ROSE }}>{pt}</p>
                      <p className="text-xs text-slate-400">{en}</p>
                    </div>
                    <button onClick={() => speak(pt)} className="shrink-0 rounded-full p-1.5 active:opacity-60" style={{ background: FOOD_BG, color: FOOD_ROSE }}>
                      <Volume2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3">
                <VocabDrillCard
                  items={FOOD_CATEGORIES[selectedCat].items}
                  speak={speak}
                  accentColor={FOOD_ROSE}
                  bgColor={FOOD_BG}
                  borderColor={FOOD_BORDER}
                />
              </div>
            )}
          </div>

          {/* Prev / Next navigation */}
          <div className="flex gap-2">
            <button onClick={() => { setSelectedCat(i => Math.max(0, i - 1)); setDrillMode(false); }} disabled={selectedCat === 0}
              className="flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all active:opacity-70 disabled:opacity-30"
              style={{ borderColor: FOOD_BORDER, color: FOOD_ROSE, background: "#fff" }}>
              ← Previous
            </button>
            <button onClick={() => { setSelectedCat(i => Math.min(FOOD_CATEGORIES.length - 1, i + 1)); setDrillMode(false); }} disabled={selectedCat === FOOD_CATEGORIES.length - 1}
              className="flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all active:opacity-70 disabled:opacity-30"
              style={{ borderColor: FOOD_BORDER, color: FOOD_ROSE, background: "#fff" }}>
              Next →
            </button>
          </div>

          {/* Ordering tip */}
          <div className="rounded-2xl px-4 py-3 flex gap-3 items-start" style={{ background: FOOD_BG, border: `1px solid ${FOOD_BORDER}` }}>
            <span className="text-xl mt-0.5">💡</span>
            <p className="text-xs text-slate-700 leading-relaxed">
              <span className="font-bold" style={{ color: FOOD_ROSE }}>Ordering tip:</span>{" "}
              Use{" "}
              <button onClick={() => speak("Eu quero")} className="font-bold italic underline decoration-dotted active:opacity-60" style={{ color: FOOD_ROSE }}>
                Eu quero...
              </button>{" "}
              for a direct order, or the more polite{" "}
              <button onClick={() => speak("Pode dar-me, por favor?")} className="font-bold italic underline decoration-dotted active:opacity-60" style={{ color: FOOD_ROSE }}>
                Pode dar-me..., por favor?
              </button>{" "}
              — both are widely used and understood.
            </p>
          </div>

          <button onClick={() => setPhase("play")} className="w-full py-3.5 rounded-2xl font-black text-white text-sm tracking-wide shadow-md active:opacity-80" style={{ background: FOOD_ROSE }}>
            Start Food &amp; Drink Quiz →
          </button>
        </div>
      )}

      {/* PLAY */}
      {phase === "play" && q && (
        <div className="rounded-3xl overflow-hidden shadow-md border" style={{ borderColor: FOOD_BORDER }}>
          <div style={{ background: FOOD_ROSE }} className="px-5 pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-white/80 uppercase tracking-widest">Question {qIndex + 1} of {total}</p>
              <p className="text-xs font-black text-white">Score: {score} / {total}</p>
            </div>
            <div className="flex gap-1">
              {FOOD_QUIZ.map((_, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
                  style={{ background: i < qIndex ? "rgba(255,255,255,0.9)" : i === qIndex ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)" }} />
              ))}
            </div>
          </div>

          <div className="px-5 py-5 bg-white" style={{ borderBottom: `1px solid ${FOOD_BORDER}` }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 text-center">What's the Portuguese for…</p>
            <p className="text-lg font-black text-slate-800 text-center leading-snug">{q.english}</p>
          </div>

          <div className="grid grid-cols-1 gap-2 p-4 bg-white">
            {q.options.map((opt) => {
              const isSelected = selected === opt;
              const isCorrectOpt = opt === q.correct;
              let bg = FOOD_BG; let border = FOOD_BORDER; let color = FOOD_ROSE; let icon = "";
              if (selected !== null) {
                if (isCorrectOpt) { bg = "#dcfce7"; border = "#86efac"; color = "#15803d"; icon = " ✓"; }
                else if (isSelected) { bg = "#fee2e2"; border = "#fca5a5"; color = "#dc2626"; icon = " ✗"; }
                else { bg = "#f1f5f9"; border = "#e2e8f0"; color = "#94a3b8"; }
              }
              return (
                <button key={opt} onClick={() => handleSelect(opt)} disabled={selected !== null}
                  className="py-3 px-4 rounded-xl font-semibold text-sm text-left transition-all active:scale-95 border-2 leading-snug"
                  style={{ background: bg, borderColor: border, color }}>
                  {opt}{icon}
                </button>
              );
            })}
          </div>

          {selected !== null && (
            <div style={{ background: isCorrect ? "#f0fdf4" : "#fff7f7", borderTop: `1px solid ${isCorrect ? "#bbf7d0" : "#fecaca"}` }}>
              <div className="px-5 pt-4 pb-2 flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-base font-black" style={{ color: isCorrect ? "#15803d" : "#d97706" }}>{motivMsg}</p>
                  {!isCorrect && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      A resposta correta é: <span className="font-bold" style={{ color: FOOD_ROSE }}>{q.correct}</span>
                    </p>
                  )}
                </div>
                <button onClick={() => speak(q.tts)} className="shrink-0 rounded-full p-2 active:opacity-60" style={{ background: FOOD_BG, color: FOOD_ROSE }}>
                  <Volume2 size={15} />
                </button>
              </div>

              <div className="px-5 pb-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Repeat after me</p>
                  <p className="text-sm font-bold" style={{ color: FOOD_ROSE }}>{q.tts}</p>
                </div>
                {srSupported ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <button onClick={handleRepeat} disabled={repeatState === "listening"}
                      className="rounded-full p-3 transition-all active:scale-95 shadow-sm"
                      style={{ background: repeatState === "listening" ? "#dc2626" : repeatState === "matched" ? "#15803d" : FOOD_ROSE, color: "#fff" }}>
                      <Mic size={18} />
                    </button>
                    {repeatState === "listening" && <p className="text-[10px] text-slate-400 animate-pulse">Ouvindo…</p>}
                    {repeatState === "matched" && <p className="text-[10px] font-bold text-green-600">Bem dito! ✓</p>}
                    {repeatState === "missed" && <p className="text-[10px] font-bold text-orange-500">Tenta outra vez!</p>}
                  </div>
                ) : (
                  <button onClick={() => speak(q.tts)} className="rounded-full p-3 active:opacity-60" style={{ background: FOOD_BG, color: FOOD_ROSE }}>
                    <Volume2 size={18} />
                  </button>
                )}
              </div>

              <div className="px-5 pb-4 flex justify-end">
                <button onClick={handleNext} className="px-6 py-2.5 rounded-xl font-black text-sm text-white active:opacity-80" style={{ background: FOOD_ROSE }}>
                  {qIndex + 1 >= total ? "Finish" : "Next →"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DONE */}
      {phase === "done" && (
        <div className="rounded-3xl overflow-hidden shadow-md border text-center" style={{ borderColor: FOOD_BORDER, background: "#fff" }}>
          <div className="px-5 py-8">
            <p className="text-5xl mb-3">{perfect ? "🏆" : score >= 7 ? "⭐⭐⭐" : score >= 5 ? "⭐⭐" : "⭐"}</p>
            <p className="text-2xl font-black mb-1" style={{ color: FOOD_ROSE }}>{score} / {total}</p>
            <p className="text-sm font-semibold text-slate-700 mb-1">
              {perfect ? "Perfeito! Podes pedir qualquer coisa! 🍽️" : score >= 7 ? "Muito bem! Quase lá! 👏" : score >= 5 ? "Bom trabalho! Continua! 💪" : "Não desistas! Revê as palavras! 🌱"}
            </p>
            <p className="text-xs text-slate-400 mb-6">
              {score >= 7 ? "You can confidently order food and drinks in Portuguese!" : "Review the vocabulary cards above and try again."}
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={handleRestart} className="px-6 py-2.5 rounded-xl font-black text-sm text-white active:opacity-80" style={{ background: FOOD_ROSE }}>Play Again</button>
              <button onClick={() => setPhase("learn")} className="px-6 py-2.5 rounded-xl font-black text-sm border-2 active:opacity-80" style={{ borderColor: FOOD_BORDER, color: FOOD_ROSE, background: FOOD_BG }}>Review</button>
            </div>
            {wrongItems.length > 0 && (
              <div className="mt-5 text-left">
                <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: FOOD_ROSE }}>📋 Words to revisit</p>
                <div className="space-y-1.5">
                  {wrongItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-red-50 rounded-xl px-3 py-2">
                      <span className="text-xs text-slate-500">{item.en}</span>
                      <span className="text-xs font-bold text-red-600">{item.pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
