import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  CheckCircle, XCircle, Trophy, Users, User, Volume2,
  Timer, Flame, RotateCcw
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import type { Lesson, VocabItem } from "@/data/lessons";
import { useSpeech } from "@/hooks/useSpeech";
import { useSound } from "@/hooks/useSound";
import { PT } from "@/lib/colors";

export type QuizMode = "single" | "timed" | "two-player" | "two-player-timed";

interface Props {
  lesson: Lesson;
  mode: QuizMode;
  onComplete: (score: number, total: number, correct: string[], wrong: string[]) => void;
  onBack: () => void;
}

interface Question {
  item: VocabItem;
  options: string[];
  correct: string;
  direction: "pt-to-en" | "en-to-pt";
}

const TIMER_SECONDS = 8;
const PLAYER_COLORS = ["#2563eb", "#7c3aed"] as const;
const PLAYER_BG = ["#dbeafe", "#ede9fe"] as const;
const PLAYER_LABEL_BG = ["bg-blue-50", "bg-purple-50"] as const;
const PLAYER_LABEL_TEXT = ["text-blue-600", "text-purple-600"] as const;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(lesson: Lesson): Question[] {
  const items = lesson.items;
  const allEnglish = items.map((i) => i.english);
  const allPortuguese = items.map((i) => i.portuguese);
  const picked = shuffle(items).slice(0, Math.min(10, items.length));
  return picked.map((item) => {
    const dir: "pt-to-en" | "en-to-pt" = Math.random() > 0.5 ? "pt-to-en" : "en-to-pt";
    if (dir === "pt-to-en") {
      const wrong = shuffle(allEnglish.filter((e) => e !== item.english)).slice(0, 3);
      return { item, correct: item.english, options: shuffle([item.english, ...wrong]), direction: dir };
    } else {
      const wrong = shuffle(allPortuguese.filter((p) => p !== item.portuguese)).slice(0, 3);
      return { item, correct: item.portuguese, options: shuffle([item.portuguese, ...wrong]), direction: dir };
    }
  });
}

// ─── Option Button ────────────────────────────────────────────────────────────

function OptionButton({
  option, selected, correct, onChoose, index, onSpeak, correctPortuguese
}: {
  option: string;
  selected: string | null;
  correct: string;
  onChoose: (o: string) => void;
  index: number;
  onSpeak?: () => void;
  correctPortuguese?: string;
}) {
  const isSelected = selected === option;
  const isCorrect = option === correct;
  const gotItRight = selected === correct;
  const wasWrong = selected !== null && !gotItRight;
  const revealed = selected !== null;

  const baseBtn = "w-full text-left px-4 py-3 rounded-3xl border-2 text-sm font-semibold transition-all duration-200 relative ";
  let cls = baseBtn;
  let inlineStyle: React.CSSProperties = {};
  if (!revealed) {
    cls += "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.97]";
  } else if (isCorrect) {
    inlineStyle = { backgroundColor: PT.greenBg, borderColor: PT.green, color: PT.green };
  } else if (isSelected) {
    inlineStyle = { backgroundColor: PT.redBg, borderColor: PT.red, color: PT.red };
  } else {
    cls += "bg-white border-slate-100 text-slate-300";
  }

  return (
    <div
      style={{
        opacity: revealed && !isCorrect && !isSelected ? 0.28 : 1,
        transform: revealed && isCorrect ? "scale(1.018)" : revealed && isSelected && !isCorrect ? "scale(0.985)" : "scale(1)",
        transition: "transform 0.25s ease, opacity 0.35s ease",
      }}
    >
      <div className="relative">
        <button
          onClick={() => onChoose(option)}
          className={cls}
          style={inlineStyle}
          data-testid={`button-option-${index}`}
          disabled={revealed}
        >
          <span className="pr-8">{option}</span>
        </button>
        {revealed && isCorrect && (
          <CheckCircle size={18} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: PT.green }} />
        )}
        {revealed && isSelected && !isCorrect && (
          <XCircle size={18} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: PT.red }} />
        )}
      </div>

      {/* Feedback block — fades in below the correct option */}
      {revealed && isCorrect && (
        <div className="feedback-reveal mt-2 pl-1 space-y-1.5">
          {gotItRight ? (
            /* ── Correct answer chosen ── */
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold" style={{ color: PT.green }}>
                Correct — listen and repeat
              </span>
              {onSpeak && (
                <button
                  onClick={onSpeak}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: PT.greenBg, color: PT.green, border: `1px solid ${PT.green}33` }}
                  aria-label="Replay pronunciation"
                >
                  <Volume2 size={11} />
                  Replay
                </button>
              )}
            </div>
          ) : (
            /* ── Wrong answer chosen ── */
            <div className="space-y-1">
              <div className="text-xs" style={{ color: PT.green }}>
                <span className="font-medium">Correct answer: </span>
                <span className="font-bold">{correctPortuguese ?? correct}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold" style={{ color: PT.green }}>
                  Listen and repeat
                </span>
                {onSpeak && (
                  <button
                    onClick={onSpeak}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold"
                    style={{ backgroundColor: PT.greenBg, color: PT.green, border: `1px solid ${PT.green}33` }}
                    aria-label="Replay pronunciation"
                  >
                    <Volume2 size={11} />
                    Replay
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Streak Badge ─────────────────────────────────────────────────────────────

function StreakBadge({ streak }: { streak: number }) {
  if (streak < 2) return null;
  return (
    <div
      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
      style={{
        backgroundColor: PT.goldBg,
        border: `1px solid ${PT.goldBorder}`,
        color: PT.goldText,
        animation: streak >= 3 ? "pulse 1s ease-in-out infinite" : "none",
      }}
      data-testid="badge-streak"
    >
      <Flame size={13} style={{ color: PT.gold }} />
      🔥 Streak: {streak}
    </div>
  );
}

// ─── Timer Bar ────────────────────────────────────────────────────────────────

function TimerBar({ timeLeft, total }: { timeLeft: number; total: number }) {
  const pct = (timeLeft / total) * 100;
  const color = timeLeft <= 2 ? PT.red : timeLeft <= 4 ? PT.gold : PT.green;
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div
        className="h-2 rounded-full transition-all duration-1000 linear"
        style={{ width: `${pct}%`, backgroundColor: color }}
        data-testid="timer-bar"
      />
    </div>
  );
}

// ─── Result Screen ────────────────────────────────────────────────────────────

function ResultScreen({
  lesson, score, total, onBack, onRetry
}: {
  lesson: Lesson;
  score: number;
  total: number;
  onBack: () => void;
  onRetry?: () => void;
}) {
  const pctScore = Math.round((score / total) * 100);
  const isPerfect = score === total;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 max-w-sm w-full text-center">

        {/* Animated result emoji */}
        <div
          className={isPerfect ? "animate-celebration" : "animate-encouragement"}
          style={{ fontSize: "72px", lineHeight: 1, marginBottom: "16px" }}
        >
          {isPerfect ? "👏" : "😉"}
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-1">
          {isPerfect ? "Excellent! You got them all right 👏" : "Good try — you can do it! 😉"}
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          {isPerfect ? "A perfect round! Keep it up." : "A little more practice and you'll nail it."}
        </p>

        {/* Score */}
        <div className="text-5xl font-extrabold mb-2" style={{ color: lesson.color }} data-testid="text-quiz-score">
          {score}/{total}
        </div>
        <div className="text-sm text-slate-500 mb-5">{pctScore}% correct</div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-8">
          <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${pctScore}%`, backgroundColor: lesson.color }} />
        </div>

        {/* Action buttons — order and label depend on outcome */}
        <div className="space-y-3">
          {isPerfect ? (
            <>
              <button
                onClick={onBack}
                className="w-full py-3 rounded-3xl text-white font-semibold text-sm"
                style={{ backgroundColor: lesson.color }}
                data-testid="button-keep-going"
              >
                Keep going →
              </button>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="w-full py-3 rounded-3xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                  data-testid="button-retry-quiz"
                >
                  <RotateCcw size={14} /> Play Again
                </button>
              )}
            </>
          ) : (
            <>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="w-full py-3 rounded-3xl text-white font-semibold text-sm flex items-center justify-center gap-2"
                  style={{ backgroundColor: lesson.color }}
                  data-testid="button-retry-quiz"
                >
                  <RotateCcw size={15} /> Try again
                </button>
              )}
              <button
                onClick={onBack}
                className="w-full py-3 rounded-3xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
                data-testid="button-back-from-quiz"
              >
                Back to Lesson
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Single / Timed Player ────────────────────────────────────────────────────

function SinglePlayerQuiz({ lesson, questions, timed, onComplete, onBack }: {
  lesson: Lesson;
  questions: Question[];
  timed: boolean;
  onComplete: (score: number, total: number, correct: string[], wrong: string[]) => void;
  onBack: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [timedOut, setTimedOut] = useState(false);
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [wrongWords, setWrongWords] = useState<string[]>([]);
  const { speak, speaking } = useSpeech();
  const { playCorrect, playWrong, playTick } = useSound();

  const q = questions[index];
  const pct = Math.round(((index + 1) / questions.length) * 100);

  // Stable refs so the timer interval (stale closure) can always speak the
  // current question's Portuguese word even after React re-renders.
  const speakRef = useRef(speak);
  useEffect(() => { speakRef.current = speak; }, [speak]);
  const correctWordRef = useRef(q.item.portuguese);
  useEffect(() => { correctWordRef.current = q.item.portuguese; }, [q]);

  // Timer
  useEffect(() => {
    if (!timed || selected !== null || finished) return;
    setTimeLeft(TIMER_SECONDS);
    setTimedOut(false);
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setTimedOut(true);
          setSelected("__timeout__");
          setStreak(0);
          playWrong();
          // Track timed-out question as a wrong answer for proficiency
          setWrongWords((prev) => {
            const w = correctWordRef.current;
            return prev.includes(w) ? prev : [...prev, w];
          });
          // Encouraging phrase on timeout
          setTimeout(() => speakRef.current("Boa tentativa — vamos outra vez."), 300);
          return 0;
        }
        if (t <= 3) playTick();
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [index, timed, selected, finished, playWrong, playTick]);

  // Speak is called directly in choose() so it always uses the current reference
  // and fires from within the user-gesture context (important for mobile browsers).
  // useSpeech already applies a 300 ms internal delay, providing the visual-first
  // buffer the learner needs before audio plays.
  const choose = useCallback((option: string) => {
    if (selected !== null) return;
    setSelected(option);
    const word = q.item.portuguese;
    if (option === q.correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      playCorrect();
      speak("Perfeito!");
      setCorrectWords((prev) => prev.includes(word) ? prev : [...prev, word]);
    } else {
      setStreak(0);
      playWrong();
      speak("Boa tentativa — vamos outra vez.");
      setWrongWords((prev) => prev.includes(word) ? prev : [...prev, word]);
    }
  }, [selected, q, playCorrect, playWrong, speak]);

  const next = () => {
    if (index + 1 >= questions.length) {
      onComplete(Math.min(score, questions.length), questions.length, correctWords, wrongWords);
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setTimedOut(false);
  };

  const handleRetry = () => {
    setIndex(0); setSelected(null); setScore(0); setStreak(0);
    setFinished(false); setTimedOut(false);
    setCorrectWords([]); setWrongWords([]);
  };

  if (finished) {
    return <ResultScreen lesson={lesson} score={score} total={questions.length} onBack={onBack} onRetry={handleRetry} />;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col overflow-hidden">
      <AppHeader
        onBack={onBack}
        shrink
        right={
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-right min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate" data-testid="button-back-quiz">{lesson.title}</p>
              <p className="text-xs text-slate-400">{timed ? "⏱ Timed" : "Single Player"}</p>
            </div>
            <span className="text-sm text-slate-500 font-medium shrink-0">{index + 1} / {questions.length}</span>
          </div>
        }
        bottom={
          <div className="w-full bg-slate-100 h-1.5">
            <div className="h-1.5 transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: lesson.color }} data-testid="progress-bar-quiz" />
          </div>
        }
      />

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto px-4 py-3 max-w-lg mx-auto w-full">
        {/* Score + streak row */}
        <div className="flex items-center justify-between mb-3">
          <StreakBadge streak={streak} />
          <div className="flex items-center gap-2 ml-auto">
            {timed && selected === null && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                <Timer size={13} />
                {timeLeft}s
              </div>
            )}
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: lesson.bgColor, color: lesson.color }} data-testid="text-current-score">
              Score: {score}
            </span>
          </div>
        </div>

        {/* Timer bar */}
        {timed && selected === null && (
          <div className="mb-3">
            <TimerBar timeLeft={timeLeft} total={TIMER_SECONDS} />
          </div>
        )}

        {/* Timed out banner */}
        {timedOut && (
          <div className="mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-semibold text-center">
            ⏰ Time's up! The correct answer was highlighted.
          </div>
        )}

        {/* Question card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 mb-3">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-2">
            {q.direction === "pt-to-en" ? "What does this mean in English?" : "How do you say this in Portuguese?"}
          </p>
          <div className="flex items-start gap-3">
            <p className="text-2xl font-bold text-slate-800 flex-1">
              {q.direction === "pt-to-en" ? q.item.portuguese : q.item.english}
            </p>
            {q.direction === "pt-to-en" && (
              <button
                onClick={() => speak(q.item.portuguese)}
                className={`mt-1 p-2.5 rounded-2xl border-2 transition-all shrink-0 ${speaking ? "bg-blue-50 border-blue-300 text-blue-600" : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"}`}
                data-testid="button-speak-question"
                aria-label="Listen"
              >
                <Volume2 size={18} className={speaking ? "animate-pulse" : ""} />
              </button>
            )}
          </div>
          {q.direction === "pt-to-en" && q.item.pronunciation && (
            <p className="text-sm text-slate-400 italic mt-1">/{q.item.pronunciation}/</p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-2 mb-3">
          {q.options.map((option, i) => (
            <OptionButton
              key={option}
              option={option}
              selected={selected}
              correct={q.correct}
              onChoose={choose}
              index={i}
              onSpeak={() => speak(q.item.portuguese)}
              correctPortuguese={q.item.portuguese}
            />
          ))}
        </div>
      </main>

      {/* Sticky next button — always visible at bottom */}
      {selected !== null && (
        <div className="shrink-0 px-4 pb-5 pt-2 bg-gradient-to-t from-slate-50 to-transparent max-w-lg mx-auto w-full">
          <button
            onClick={next}
            className="w-full py-4 rounded-3xl text-white font-semibold text-sm transition-all active:scale-[0.98] shadow-md"
            style={{ backgroundColor: lesson.color }}
            data-testid="button-next-question"
          >
            {index + 1 < questions.length ? "Next Question →" : "See Results"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Two Player ───────────────────────────────────────────────────────────────

function TwoPlayerQuiz({ lesson, questions, onBack, timed = false }: {
  lesson: Lesson;
  questions: Question[];
  onBack: () => void;
  timed?: boolean;
}) {
  const half = Math.ceil(questions.length / 2);
  const p1Questions = questions.slice(0, half);
  const p2Questions = questions.slice(half);

  const [currentPlayer, setCurrentPlayer] = useState<0 | 1>(0);
  const [scores, setScores] = useState([0, 0]);
  const [streaks, setStreaks] = useState([0, 0]);
  const [indexes, setIndexes] = useState([0, 0]);
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<"setup" | "playing" | "handoff" | "results">("setup");
  const [playerNames, setPlayerNames] = useState(["", ""]);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const { speak, speaking } = useSpeech();
  const { playCorrect, playWrong, playTick } = useSound();
  const speakRef = useRef(speak);
  useEffect(() => { speakRef.current = speak; }, [speak]);

  const playerQuestions = currentPlayer === 0 ? p1Questions : p2Questions;
  const playerIndex = indexes[currentPlayer];
  const totalForPlayer = playerQuestions.length;
  const q = playerQuestions[playerIndex] ?? playerQuestions[0];
  const pct = Math.round(((playerIndex + 1) / totalForPlayer) * 100);

  const choose = useCallback((option: string) => {
    if (selected !== null) return;
    setSelected(option);
    if (option === q.correct) {
      setScores((s) => { const n = [...s]; n[currentPlayer]++; return n; });
      setStreaks((s) => { const n = [...s]; n[currentPlayer]++; return n; });
      playCorrect();
      speak("Perfeito!");
    } else {
      setStreaks((s) => { const n = [...s]; n[currentPlayer] = 0; return n; });
      playWrong();
      speak("Boa tentativa — vamos outra vez.");
    }
  }, [selected, q, currentPlayer, playCorrect, playWrong, speak]);

  // Timed mode countdown
  useEffect(() => {
    if (!timed || selected !== null || phase !== "playing") return;
    setTimeLeft(TIMER_SECONDS);
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setSelected("__timeout__");
          setStreaks((s) => { const n = [...s]; n[currentPlayer] = 0; return n; });
          playWrong();
          setTimeout(() => speakRef.current("Boa tentativa — vamos outra vez."), 300);
          return 0;
        }
        if (t <= 3) playTick();
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [playerIndex, currentPlayer, timed, selected, phase, playWrong, playTick]);

  const next = () => {
    const isLast = playerIndex + 1 >= totalForPlayer;
    if (isLast) {
      setPhase(currentPlayer === 0 ? "handoff" : "results");
    } else {
      setIndexes((idx) => { const n = [...idx]; n[currentPlayer]++; return n; });
      setSelected(null);
    }
  };

  const switchToP2 = () => {
    setCurrentPlayer(1);
    setSelected(null);
    setPhase("playing");
  };

  const playAgain = () => {
    setCurrentPlayer(0); setScores([0, 0]); setStreaks([0, 0]);
    setIndexes([0, 0]); setSelected(null); setPhase("setup");
  };

  const name0 = playerNames[0].trim() || "Player 1";
  const name1 = playerNames[1].trim() || "Player 2";
  const names = [name0, name1];
  const playerColor = PLAYER_COLORS[currentPlayer];

  // ── Name entry setup screen ──
  if (phase === "setup") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 max-w-sm w-full">
          <div className="text-center mb-7">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users size={30} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Who's playing?</h2>
            <p className="text-sm text-slate-400 mt-1">Enter your names to get started</p>
          </div>

          <div className="space-y-4 mb-7">
            {([0, 1] as const).map((i) => (
              <div key={i}>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: PLAYER_COLORS[i] }}>
                  Player {i + 1}
                </label>
                <input
                  type="text"
                  maxLength={20}
                  placeholder={`Player ${i + 1}`}
                  value={playerNames[i]}
                  onChange={(e) => setPlayerNames((n) => { const next = [...n]; next[i] = e.target.value; return next; })}
                  onKeyDown={(e) => { if (e.key === "Enter") setPhase("playing"); }}
                  className="w-full px-4 py-3 rounded-2xl border-2 text-sm font-semibold text-slate-800 outline-none transition-all"
                  style={{ borderColor: PLAYER_COLORS[i] + "66", backgroundColor: PLAYER_BG[i] }}
                  autoComplete="off"
                  data-testid={`input-player-name-${i + 1}`}
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => setPhase("playing")}
            className="w-full py-4 rounded-3xl text-white font-black text-sm tracking-wide shadow-md active:scale-[0.98] transition-all"
            style={{ background: `linear-gradient(135deg, ${PLAYER_COLORS[0]}, ${PLAYER_COLORS[1]})` }}
            data-testid="button-start-game"
          >
            Start Game →
          </button>
        </div>
      </div>
    );
  }

  // ── Results ──
  if (phase === "results") {
    const [s1, s2] = scores;
    let result = "It's a draw!";
    let resultColor = "#64748b";
    if (s1 > s2) { result = `🏆 ${name0} Wins!`; resultColor = PLAYER_COLORS[0]; }
    else if (s2 > s1) { result = `🏆 ${name1} Wins!`; resultColor = PLAYER_COLORS[1]; }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy size={36} className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Game Over!</h2>
          <p className="text-xl font-extrabold mb-8" style={{ color: resultColor }}>{result}</p>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {([0, 1] as const).map((i) => (
              <div key={i} className="rounded-2xl p-5 text-center" style={{ backgroundColor: PLAYER_BG[i] }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2 truncate px-1" style={{ color: PLAYER_COLORS[i] }}>{names[i]}</p>
                <p className="text-4xl font-extrabold" style={{ color: PLAYER_COLORS[i] }}>{scores[i]}</p>
                <p className="text-xs text-slate-500 mt-1">out of {[p1Questions, p2Questions][i].length}</p>
                <p className="text-xs font-medium mt-1" style={{ color: PLAYER_COLORS[i] }}>
                  {Math.round((scores[i] / [p1Questions, p2Questions][i].length) * 100)}%
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <button onClick={playAgain} className="w-full py-3 rounded-3xl text-white font-semibold text-sm flex items-center justify-center gap-2" style={{ backgroundColor: lesson.color }} data-testid="button-play-again">
              <RotateCcw size={14} /> Play Again
            </button>
            <button onClick={onBack} className="w-full py-3 rounded-3xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors" data-testid="button-back-from-twoplayer">
              Back to Lesson
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Handoff screen ──
  if (phase === "handoff") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: PLAYER_BG[0] }}>
            <User size={28} style={{ color: PLAYER_COLORS[0] }} />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: PLAYER_COLORS[0] }}>{name0} finished</p>
          <p className="text-4xl font-extrabold mb-1" style={{ color: PLAYER_COLORS[0] }}>
            {scores[0]} / {p1Questions.length}
          </p>
          <p className="text-sm text-slate-500 mb-8">
            {Math.round((scores[0] / p1Questions.length) * 100)}% correct
            {streaks[0] >= 2 ? ` · Best streak: ${streaks[0]} 🔥` : ""}
          </p>
          <div className="bg-slate-50 rounded-2xl p-4 mb-8 text-sm text-slate-600">
            Pass the device to <strong>{name1}</strong> and press Start when ready.
          </div>
          <button
            onClick={switchToP2}
            className="w-full py-4 rounded-3xl text-white font-bold text-sm"
            style={{ backgroundColor: PLAYER_COLORS[1] }}
            data-testid="button-start-p2"
          >
            {name1} — Let's go!
          </button>
        </div>
      </div>
    );
  }

  // ── Playing ──
  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col overflow-hidden">
      <AppHeader
        onBack={onBack}
        shrink
        right={
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-right min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate" data-testid="button-back-quiz-twoplayer">{lesson.title}</p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: playerColor }} />
                <p className="text-xs font-semibold truncate max-w-[80px]" style={{ color: playerColor }}>{names[currentPlayer]}</p>
              </div>
            </div>
            <span className="text-sm text-slate-500 font-medium shrink-0">{playerIndex + 1} / {totalForPlayer}</span>
          </div>
        }
        bottom={
          <div className="w-full bg-slate-100 h-1.5">
            <div className="h-1.5 transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: playerColor }} data-testid="progress-bar-quiz-twoplayer" />
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto px-4 py-3 max-w-lg mx-auto w-full">
        {/* Scoreboard */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {([0, 1] as const).map((i) => {
            const active = currentPlayer === i;
            return (
              <div
                key={i}
                className={`rounded-2xl px-4 py-3 flex items-center justify-between transition-all duration-300 ${active ? "shadow-md" : "opacity-50"}`}
                style={{ backgroundColor: PLAYER_BG[i] }}
                data-testid={`score-player-${i + 1}`}
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider truncate max-w-[80px]" style={{ color: PLAYER_COLORS[i] }}>
                    {names[i]} {active ? "▶" : ""}
                  </p>
                  {streaks[i] >= 2 && active && (
                    <p className="text-xs text-orange-500 font-semibold">🔥 {streaks[i]}</p>
                  )}
                </div>
                <p className="text-2xl font-extrabold" style={{ color: PLAYER_COLORS[i] }}>{scores[i]}</p>
              </div>
            );
          })}
        </div>

        {/* Streak for current player */}
        {streaks[currentPlayer] >= 2 && (
          <div className="flex items-center mb-3">
            <StreakBadge streak={streaks[currentPlayer]} />
          </div>
        )}

        {/* Timer bar — timed two-player mode */}
        {timed && (
          <div className="mb-3 flex items-center gap-3">
            <span className="text-sm font-extrabold tabular-nums w-6 text-center" style={{ color: timeLeft <= 2 ? PT.red : timeLeft <= 4 ? PT.gold : PT.green }}>
              {timeLeft}s
            </span>
            <div className="flex-1">
              <TimerBar timeLeft={timeLeft} total={TIMER_SECONDS} />
            </div>
          </div>
        )}

        {/* Question card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 mb-3">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-2">
            {q.direction === "pt-to-en" ? "What does this mean in English?" : "How do you say this in Portuguese?"}
          </p>
          <div className="flex items-start gap-3">
            <p className="text-2xl font-bold text-slate-800 flex-1">
              {q.direction === "pt-to-en" ? q.item.portuguese : q.item.english}
            </p>
            {q.direction === "pt-to-en" && (
              <button
                onClick={() => speak(q.item.portuguese)}
                className={`mt-1 p-2.5 rounded-2xl border-2 transition-all shrink-0 ${speaking ? "bg-blue-50 border-blue-300 text-blue-600" : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"}`}
                data-testid="button-speak-question-twoplayer"
              >
                <Volume2 size={18} className={speaking ? "animate-pulse" : ""} />
              </button>
            )}
          </div>
          {q.direction === "pt-to-en" && q.item.pronunciation && (
            <p className="text-sm text-slate-400 italic mt-1">/{q.item.pronunciation}/</p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-2 mb-3">
          {q.options.map((option, i) => (
            <OptionButton
              key={option}
              option={option}
              selected={selected}
              correct={q.correct}
              onChoose={choose}
              index={i}
              onSpeak={() => speak(q.item.portuguese)}
              correctPortuguese={q.item.portuguese}
            />
          ))}
        </div>
      </main>

      {/* Sticky next button */}
      {selected !== null && (
        <div className="shrink-0 px-4 pb-5 pt-2 bg-gradient-to-t from-slate-50 to-transparent max-w-lg mx-auto w-full">
          <button
            onClick={next}
            className="w-full py-4 rounded-3xl text-white font-bold text-sm transition-all active:scale-[0.98] shadow-md"
            style={{ backgroundColor: playerColor }}
            data-testid="button-next-twoplayer"
          >
            {playerIndex + 1 < totalForPlayer ? "Next Question →" : currentPlayer === 0 ? "Pass to Player 2 →" : "See Final Results"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Exported wrapper ─────────────────────────────────────────────────────────

export default function Quiz({ lesson, mode, onComplete, onBack }: Props) {
  const questions = useMemo(() => buildQuestions(lesson), [lesson]);

  if (mode === "two-player" || mode === "two-player-timed") {
    return <TwoPlayerQuiz lesson={lesson} questions={questions} onBack={onBack} timed={mode === "two-player-timed"} />;
  }

  return (
    <SinglePlayerQuiz
      lesson={lesson}
      questions={questions}
      timed={mode === "timed"}
      onComplete={onComplete}
      onBack={onBack}
    />
  );
}
