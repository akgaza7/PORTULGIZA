import { useState, useCallback, useEffect, useRef, useMemo, createContext, useContext } from "react";
import { Volume2, CheckCircle, XCircle } from "lucide-react";
import { PT } from "@/lib/colors";
import { useSpeech } from "@/hooks/useSpeech";
import { useSound } from "@/hooks/useSound";
import { loadOnboarding } from "@/store/onboarding";
import { lessons } from "@/data/lessons";
import { mergeProficiency } from "@/store/progress";
import carImg from "@assets/Car_1775995617306.jpg";

function useCarAnimation() {
  const [carActive, setCarActive] = useState(false);
  const carTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function triggerCar() {
    setCarActive(false);
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
    <div className="fixed bottom-20 left-0 w-full z-50 pointer-events-none overflow-hidden" style={{ height: 80 }}>
      <div className="car-zoom absolute bottom-0 left-0">
        <div style={{ width: 160, height: 74, overflow: "hidden", position: "relative" }}>
          <img src={carImg} alt="Portuguese car"
            style={{ position: "absolute", bottom: 0, left: 0, width: 160, height: "auto", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.25))" }} />
        </div>
      </div>
    </div>
  );
}

// ─── Colour palette ──────────────────────────────────────────────────────────

const HUB_COLORS = {
  mcq:         { bg: "#F0FDF4", border: "#4ADE80", text: "#14532D", icon: "☑️" },
  truefalse:   { bg: "#FFF7ED", border: "#FB923C", text: "#7C2D12", icon: "⚖️" },
  openended:   { bg: "#F0F9FF", border: "#38BDF8", text: "#0C4A6E", icon: "✍️" },
  fillblank:   { bg: "#FDF2F8", border: "#EC4899", text: "#831843", icon: "📝" },
  picture:     { bg: "#FAFAF0", border: "#A3A600", text: "#3D4000", icon: "🖼️" },
  audio:       { bg: "#F0FFF4", border: "#34D399", text: "#064E3B", icon: "🎧" },
  scored:      { bg: "#FFF1F2", border: "#FB7185", text: "#881337", icon: "🏆" },
  ordering:      { bg: "#FFF8F0", border: "#F59E0B", text: "#78350F", icon: "🔢" },
  multiresponse: { bg: "#F0F4FF", border: "#6366F1", text: "#312E81", icon: "☑☑" },
  fillgap:       { bg: "#F0F9FF", border: "#0284C7", text: "#0C4A6E", icon: "🗂️" },
  oddoneout:     { bg: "#FFF7ED", border: "#F97316", text: "#7C2D12", icon: "🚫" },
  matchpairs:    { bg: "#ECFDF5", border: "#10B981", text: "#064E3B", icon: "🔗" },
  categorise:    { bg: "#F5F3FF", border: "#7C3AED", text: "#4C1D95", icon: "🗃️" },
  conjunctions:  { bg: "#F5F3FF", border: "#7C3AED", text: "#5B21B6", icon: "🔗" },
  wordreview:    { bg: "#E0F2FE", border: "#0284C7", text: "#0C4A6E", icon: "📋" },
};

// ─── Navigation context ───────────────────────────────────────────────────────
// Provides a single "go all the way to the Home page" function that
// QuizHeader's logo tap can call from any depth in the quiz tree.
const GoHomeContext = createContext<{ goHome: () => void }>({ goHome: () => {} });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Shared components ───────────────────────────────────────────────────────

function LevelStrip({ level }: { level: "beginner" | "intermediate" }) {
  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 border-b border-slate-100">
      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}>
        ● L1 Principiante
      </span>
      <span className="text-slate-300 text-xs font-bold">›</span>
      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
        style={level === "intermediate"
          ? { backgroundColor: "#DBEAFE", color: "#1D4ED8" }
          : { backgroundColor: "#F1F5F9", color: "#94A3B8" }}>
        {level === "intermediate" ? "● L2 Intermédio" : "🔒 L2 Intermédio"}
      </span>
    </div>
  );
}

function QuizHeader({ title, onBack, progress, total, color }: {
  title: string; onBack: () => void;
  progress?: number; total?: number; color: string;
}) {
  const { goHome } = useContext(GoHomeContext);
  const { level } = loadOnboarding();
  const pct = progress !== undefined && total ? Math.round((progress / total) * 100) : null;
  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
      {/* Logo row — tap to go all the way home */}
      <div className="flex justify-center items-center pt-2.5 pb-1.5">
        <button onClick={goHome} className="flex items-center gap-2 active:opacity-70 transition-opacity" aria-label="Go to home">
          <img src="/portulgiza-icon.svg" alt="PORTULGIZA" className="w-9 h-9 rounded-lg shadow-sm object-cover" />
          <span className="text-sm font-black tracking-tight text-slate-800">PORTULGIZA</span>
        </button>
      </div>
      {/* Nav row — Voltar | quiz title | X/Y */}
      <div className="max-w-lg mx-auto px-4 py-2 flex items-center gap-3">
        <button onClick={onBack} aria-label="Voltar"
          className="shrink-0 px-3.5 py-1.5 rounded-full font-bold text-xs text-white active:opacity-70 transition-opacity"
          style={{ backgroundColor: PT.green }}>
          Voltar
        </button>
        <h1 className="text-sm font-bold flex-1 text-center truncate" style={{ color }}>{title}</h1>
        {progress !== undefined && total && (
          <span className="text-xs text-slate-400 font-semibold shrink-0">{progress}/{total}</span>
        )}
      </div>
      {pct !== null && (
        <div className="w-full bg-slate-100 h-1.5">
          <div className="h-1.5 transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      )}
      <div className="flex h-[3px]">
        <div className="flex-1" style={{ backgroundColor: "#046A38" }} />
        <div className="flex-1" style={{ backgroundColor: "#FFD700" }} />
        <div className="flex-1" style={{ backgroundColor: "#DA291C" }} />
      </div>
      <LevelStrip level={level} />
    </header>
  );
}

function ResultCard({ score, total, onBack, title, color, message }: {
  score: number; total: number; onBack: () => void;
  title: string; color: string; message?: string;
}) {
  const pct = Math.round((score / total) * 100);
  const emoji = pct === 100 ? "🏆" : pct >= 70 ? "🌟" : pct >= 50 ? "😊" : "💪";
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: `linear-gradient(135deg, ${color}18, #fff)` }}>
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 max-w-sm w-full text-center">
        <div className="text-6xl mb-4">{emoji}</div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">{title}</h2>
        <p className="text-sm text-slate-400 mb-6">{message || (pct === 100 ? "Perfect score — outstanding!" : pct >= 70 ? "Great effort!" : "Keep practising — you'll get there!")}</p>
        <div className="text-5xl font-extrabold mb-1" style={{ color }}>{score}/{total}</div>
        <div className="text-sm text-slate-400 mb-6">{pct}% correct</div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-8">
          <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
        <button onClick={onBack} className="w-full py-3.5 rounded-3xl text-white font-bold text-sm"
          style={{ backgroundColor: color }}>
          Back to Quiz Hub
        </button>
      </div>
    </div>
  );
}

function ChoiceBtn({ label, selected, correct, onChoose, disabled }: {
  label: string; selected: boolean; correct: boolean;
  onChoose: () => void; disabled: boolean;
}) {
  let bg = "bg-white border-slate-200 text-slate-700";
  let extra: React.CSSProperties = {};
  if (disabled) {
    if (correct) extra = { backgroundColor: PT.greenBg, borderColor: PT.green, color: PT.green };
    else if (selected) extra = { backgroundColor: PT.redBg, borderColor: PT.red, color: PT.red };
    else bg = "bg-white border-slate-100 text-slate-400 opacity-50";
  }
  return (
    <button
      onClick={onChoose} disabled={disabled}
      className={`w-full text-left px-4 py-4 rounded-3xl border-2 text-sm font-semibold transition-all ${bg}`}
      style={extra}
    >
      <span className="flex items-center justify-between">
        <span className="pr-6">{label}</span>
        {disabled && correct && <CheckCircle size={18} style={{ color: PT.green, flexShrink: 0 }} />}
        {disabled && selected && !correct && <XCircle size={18} style={{ color: PT.red, flexShrink: 0 }} />}
      </span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. TRIVIA QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

const TRIVIA_DATA = [
  { q: "What does 'obrigado' mean?", options: ["You're welcome", "Please", "Thank you", "Sorry"], correct: "Thank you", fact: "Women say 'obrigada', men say 'obrigado' — the ending matches the speaker's gender, not the listener's." },
  { q: "How do you say 'Good morning' in European Portuguese?", options: ["Boa tarde", "Bom dia", "Boa noite", "Olá"], correct: "Bom dia", fact: "Bom dia is used until around noon. After noon, switch to 'Boa tarde'. After dark, say 'Boa noite'." },
  { q: "What is 'train' in European Portuguese?", options: ["Trem", "Comboio", "Metro", "Autocarro"], correct: "Comboio", fact: "In Brazil they say 'trem'. In Portugal the word is 'comboio'." },
  { q: "What does 'saudade' mean?", options: ["Joy", "Anger", "Longing / nostalgia", "Fear"], correct: "Longing / nostalgia", fact: "Saudade is one of the world's most untranslatable words — a deep emotional longing for something or someone absent." },
  { q: "How do you say 'bus' in European Portuguese?", options: ["Ônibus", "Autocarro", "Autobús", "Eléctrico"], correct: "Autocarro", fact: "In Brazil the word is 'ônibus'. In Portugal you take the 'autocarro'." },
  { q: "What does 'Tudo bem?' mean?", options: ["How old are you?", "Where are you from?", "Is everything okay?", "Do you speak English?"], correct: "Is everything okay?", fact: "A very common greeting — literally 'Everything good?' You can reply 'Tudo bem!' or 'Tudo óptimo!'" },
  { q: "How do you say 'I don't understand' in European Portuguese?", options: ["Não entendo", "Não percebo", "Não sei", "Não falo"], correct: "Não percebo", fact: "'Não entendo' is Brazilian Portuguese. In Portugal the natural phrase is 'Não percebo'." },
  { q: "What is the feminine form of 'obrigado'?", options: ["Obrigada", "Obrigados", "Obrigadas", "Obrigade"], correct: "Obrigada", fact: "In Portuguese, 'thank you' agrees with the gender of the speaker. A woman always says 'obrigada'." },
  { q: "How do you say 'please' when asking for something in European Portuguese?", options: ["Obrigado", "Faz favor", "Com licença", "Desculpe"], correct: "Faz favor", fact: "'Faz favor' is the natural way to say please or to get someone's attention in Portugal." },
  { q: "What does 'já' mean in everyday European Portuguese?", options: ["Never", "Now / already", "Later", "Sometimes"], correct: "Now / already", fact: "'Já vou!' means 'I'm coming right now!' — one of the most useful everyday phrases in Portugal." },
];

function TriviaQuiz({ onBack }: { onBack: () => void }) {
  const [qs] = useState(() => shuffle(TRIVIA_DATA).slice(0, 7));
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const { playCorrect, playWrong } = useSound();
  const { speakSlow } = useSpeech();
  const color = HUB_COLORS.trivia.text;
  const correctRef = useRef<string[]>([]);
  const wrongRef = useRef<string[]>([]);

  const choose = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    const word = qs[idx].correct;
    if (opt === word) { setScore(s => s + 1); playCorrect(); correctRef.current.push(word); }
    else { playWrong(); wrongRef.current.push(word); }
  };
  const next = () => {
    if (idx + 1 >= qs.length) { mergeProficiency("quiz-hub", correctRef.current, wrongRef.current); setDone(true); return; }
    setIdx(i => i + 1); setSelected(null);
  };

  if (done) return <ResultCard score={score} total={qs.length} onBack={onBack} title="Trivia Complete!" color={HUB_COLORS.trivia.text} />;

  const q = qs[idx];
  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${HUB_COLORS.trivia.bg}, #fff)` }}>
      <QuizHeader title="🧠 Trivia Quiz" onBack={onBack} progress={idx + 1} total={qs.length} color={color} />
      <main className="flex-1 flex flex-col px-4 py-5 max-w-lg mx-auto w-full gap-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-3">Portugal Facts</p>
          <div className="flex items-start gap-2">
            <p className="text-lg font-bold text-slate-800 flex-1">{q.q}</p>
            <button onClick={() => speakSlow(q.q)} className="shrink-0 p-2 rounded-full active:opacity-60 hover:bg-slate-100" style={{ color: "#64748B" }}><Volume2 size={20} /></button>
          </div>
        </div>
        <div className="space-y-2.5">
          {q.options.map(opt => (
            <ChoiceBtn key={opt} label={opt} selected={selected === opt} correct={opt === q.correct}
              onChoose={() => choose(opt)} disabled={!!selected} />
          ))}
        </div>
        {selected && (
          <div className="rounded-2xl px-4 py-3 text-sm text-slate-700 leading-relaxed"
            style={{ backgroundColor: HUB_COLORS.trivia.bg, border: `1px solid ${HUB_COLORS.trivia.border}` }}>
            <span className="font-bold" style={{ color }}>Did you know? </span>{q.fact}
          </div>
        )}
        {selected && (
          <button onClick={next} className="w-full py-4 rounded-3xl font-bold text-white text-sm"
            style={{ backgroundColor: color }}>
            {idx + 1 < qs.length ? "Next Question →" : "See Results"}
          </button>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. PERSONALITY QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

const PERSONALITY_QS = [
  {
    q: "When you see a new Portuguese word, you…",
    opts: [
      { label: "Read it and picture a scene", type: "V" },
      { label: "Say it aloud to hear how it sounds", type: "A" },
      { label: "Use it in a sentence straight away", type: "S" },
      { label: "Write it in a notebook", type: "W" },
    ],
  },
  {
    q: "Your ideal Portuguese lesson looks like…",
    opts: [
      { label: "Flashcards and visual examples", type: "V" },
      { label: "Listening to native speakers", type: "A" },
      { label: "Conversation with a partner", type: "S" },
      { label: "Written exercises and grammar notes", type: "W" },
    ],
  },
  {
    q: "To remember a phrase you…",
    opts: [
      { label: "Make a mental image", type: "V" },
      { label: "Replay the sound in your head", type: "A" },
      { label: "Practise saying it repeatedly", type: "S" },
      { label: "Write it out several times", type: "W" },
    ],
  },
  {
    q: "If you hear an unfamiliar word you…",
    opts: [
      { label: "Look it up for a picture or diagram", type: "V" },
      { label: "Listen to it a few more times", type: "A" },
      { label: "Ask someone to explain it verbally", type: "S" },
      { label: "Write it down and look it up later", type: "W" },
    ],
  },
  {
    q: "You find languages easiest through…",
    opts: [
      { label: "Movies, signs, and body language", type: "V" },
      { label: "Music, podcasts, and audio", type: "A" },
      { label: "Real conversations and travel", type: "S" },
      { label: "Books, articles, and grammar rules", type: "W" },
    ],
  },
];

const PERSONALITY_RESULTS: Record<string, { title: string; pt: string; emoji: string; desc: string; tip: string }> = {
  V: {
    title: "Visual Learner",
    pt: "Aprendiz Visual",
    emoji: "👁️",
    desc: "You absorb language through images, patterns, and spatial understanding.",
    tip: "Use flashcards with pictures, watch Portuguese films, and draw mind maps of vocabulary.",
  },
  A: {
    title: "Audio Learner",
    pt: "Aprendiz Auditivo",
    emoji: "🎧",
    desc: "You learn best by listening — tone, rhythm, and sound guide your memory.",
    tip: "Listen to Fado music, use the Audio Quiz, and replay words with the TTS buttons.",
  },
  S: {
    title: "Speaking Learner",
    pt: "Aprendiz Oral",
    emoji: "🗣️",
    desc: "You thrive on real conversation and learn by doing, not by studying.",
    tip: "Use the speech recognition features and practise travel phrases out loud every day.",
  },
  W: {
    title: "Writing Learner",
    pt: "Aprendiz Escrito",
    emoji: "✍️",
    desc: "You master language through careful reading and structured writing.",
    tip: "Focus on fill-in-the-blank exercises, keep a vocabulary journal, and review grammar notes.",
  },
};

function PersonalityQuiz({ onBack }: { onBack: () => void }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const { speakSlow } = useSpeech();
  const color = HUB_COLORS.personality.text;

  const choose = (type: string) => {
    const next = [...answers, type];
    if (idx + 1 >= PERSONALITY_QS.length) {
      const counts: Record<string, number> = { V: 0, A: 0, S: 0, W: 0 };
      next.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
      const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      setResult(winner);
    } else {
      setAnswers(next);
      setIdx(i => i + 1);
    }
  };

  if (result) {
    const r = PERSONALITY_RESULTS[result];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
        style={{ background: `linear-gradient(135deg, ${HUB_COLORS.personality.bg}, #fff)` }}>
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 max-w-sm w-full text-center">
          <div className="text-6xl mb-3">{r.emoji}</div>
          <div className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color }}>Your Learning Style</div>
          <h2 className="text-2xl font-black text-slate-800 mb-1">{r.title}</h2>
          <p className="text-base font-bold mb-4" style={{ color }}>{r.pt}</p>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">{r.desc}</p>
          <div className="rounded-2xl p-4 mb-6 text-left text-sm leading-relaxed"
            style={{ backgroundColor: HUB_COLORS.personality.bg, border: `1px solid ${HUB_COLORS.personality.border}` }}>
            <p className="font-bold mb-1" style={{ color }}>Your tip:</p>
            <p className="text-slate-700">{r.tip}</p>
          </div>
          <button onClick={onBack} className="w-full py-3.5 rounded-3xl text-white font-bold text-sm"
            style={{ backgroundColor: color }}>
            Back to Quiz Hub
          </button>
        </div>
      </div>
    );
  }

  const q = PERSONALITY_QS[idx];
  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${HUB_COLORS.personality.bg}, #fff)` }}>
      <QuizHeader title="✨ Personality Quiz" onBack={onBack} progress={idx + 1} total={PERSONALITY_QS.length} color={color} />
      <main className="flex-1 flex flex-col px-4 py-5 max-w-lg mx-auto w-full gap-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-3">What kind of learner are you?</p>
          <div className="flex items-start gap-2">
            <p className="text-lg font-bold text-slate-800 flex-1">{q.q}</p>
            <button onClick={() => speakSlow(q.q)} className="shrink-0 p-2 rounded-full active:opacity-60 hover:bg-slate-100" style={{ color: "#64748B" }}><Volume2 size={20} /></button>
          </div>
        </div>
        <div className="space-y-3">
          {q.opts.map(opt => (
            <button key={opt.type} onClick={() => choose(opt.type)}
              className="w-full text-left px-5 py-4 rounded-3xl border-2 bg-white border-slate-200 text-slate-700 text-sm font-semibold transition-all active:scale-[0.98]">
              {opt.label}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. MULTIPLE-CHOICE QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

const MCQ_DATA = [
  { q: "How do you say 'Good morning' in European Portuguese?", options: ["Boa tarde", "Bom dia", "Boa noite", "Olá"], correct: "Bom dia", explanation: "'Bom dia' = Good morning. 'Boa tarde' = afternoon, 'Boa noite' = evening/night." },
  { q: "What does 'Obrigada' mean?", options: ["Please", "Hello", "Thank you (said by a woman)", "Goodbye"], correct: "Thank you (said by a woman)", explanation: "The -a ending matches the speaker's gender. Women say 'Obrigada', men say 'Obrigado'." },
  { q: "Which phrase means 'Excuse me' in Portugal?", options: ["Por favor", "Com licença", "De nada", "Desculpe"], correct: "Com licença", explanation: "'Com licença' is used to excuse yourself politely. 'Desculpe' means sorry." },
  { q: "What is the European Portuguese word for 'bus'?", options: ["Ônibus", "Trem", "Autocarro", "Metro"], correct: "Autocarro", explanation: "'Autocarro' is used in Portugal. 'Ônibus' is the Brazilian word. 'Trem' means train in Brazil." },
  { q: "How do you ask 'Where is the bathroom?' in Portugal?", options: ["Onde é o banheiro?", "Onde fica a casa de banho?", "Tem banheiro?", "Onde está o WC?"], correct: "Onde fica a casa de banho?", explanation: "In Portugal the bathroom is 'a casa de banho'. 'Banheiro' is the Brazilian term." },
  { q: "What does 'Saudade' mean?", options: ["Happiness", "A deep longing for something loved and lost", "Good luck", "Surprise"], correct: "A deep longing for something loved and lost", explanation: "'Saudade' is a uniquely Portuguese emotion — a nostalgic, bittersweet longing with no English equivalent." },
  { q: "What is 'train' in European Portuguese?", options: ["Trem", "Metro", "Comboio", "Bicicleta"], correct: "Comboio", explanation: "'Comboio' is train in Portugal. 'Trem' is the Brazilian word. 'Metro' = underground/subway." },
  { q: "How do you say 'I don't understand'?", options: ["Não sei", "Não falo", "Não percebo", "Não quero"], correct: "Não percebo", explanation: "'Não percebo' = I don't understand. 'Não sei' = I don't know. 'Não falo' = I don't speak." },
  { q: "Which is the correct European Portuguese greeting for the evening?", options: ["Boa tarde", "Bom dia", "Boa noite", "Até logo"], correct: "Boa noite", explanation: "'Boa noite' = Good evening/night. 'Boa tarde' = afternoon. 'Bom dia' = morning." },
  { q: "'Quanto custa?' means…", options: ["Where is it?", "How much does it cost?", "Do you have it?", "I would like this"], correct: "How much does it cost?", explanation: "'Quanto' = how much. 'Custa' = costs. An essential phrase for shopping!" },
  { q: "What is 'ice cream' in European Portuguese?", options: ["Sorvete", "Gelado", "Geleia", "Iogurte"], correct: "Gelado", explanation: "'Gelado' is the word in Portugal. Brazilians say 'sorvete'. 'Geleia' means jam." },
  { q: "How do you say 'juice' in European Portuguese?", options: ["Suco", "Sumo", "Néctar", "Refresco"], correct: "Sumo", explanation: "'Sumo' is used in Portugal. 'Suco' is Brazilian Portuguese. Both are correct in their own variety." },
  { q: "What does 'Por favor' mean?", options: ["Thank you", "You're welcome", "Please", "Excuse me"], correct: "Please", explanation: "'Por favor' = please. 'Obrigado/a' = thank you. 'De nada' = you're welcome." },
  { q: "How do you say 'I would like a coffee' in Portuguese?", options: ["Quero um café, obrigado", "Eu queria um café, por favor", "Dá-me um café", "Um café, sim"], correct: "Eu queria um café, por favor", explanation: "'Eu queria' (I would like) is more polite than 'Quero' (I want). Good café manners in Portugal!" },
  { q: "What is the European Portuguese word for 'waterfall'?", options: ["Cachoeira", "Lagoa", "Cascata", "Rio"], correct: "Cascata", explanation: "'Cascata' = waterfall in Portugal. 'Cachoeira' is the Brazilian term. 'Lagoa' = lagoon, 'Rio' = river." },
  { q: "Which number is 'quinze'?", options: ["13", "14", "15", "16"], correct: "15", explanation: "Treze (13), catorze (14), quinze (15), dezasseis (16)." },
  { q: "How do you say 'Good afternoon'?", options: ["Bom dia", "Boa tarde", "Boa noite", "Olá"], correct: "Boa tarde", explanation: "'Boa tarde' is used from midday until sunset. After that, switch to 'Boa noite'." },
  { q: "What is 'bread' in Portuguese?", options: ["Pão", "Queijo", "Bolo", "Arroz"], correct: "Pão", explanation: "'Pão' = bread. 'Queijo' = cheese. 'Bolo' = cake. 'Arroz' = rice. Portuguese bread is famous!" },
  { q: "What does 'Falar' mean?", options: ["To eat", "To walk", "To speak", "To learn"], correct: "To speak", explanation: "'Falar' = to speak. 'Comer' = to eat. 'Andar' = to walk. 'Aprender' = to learn." },
  { q: "How do you say 'I am learning Portuguese'?", options: ["Eu gosto de português", "Estou a aprender português", "Eu falo português", "Quero português"], correct: "Estou a aprender português", explanation: "'Estou a aprender' is the European Portuguese present continuous. Brazilians say 'Estou aprendendo'." },
];

function MCQuiz({ onBack }: { onBack: () => void }) {
  const [qs] = useState(() => shuffle(MCQ_DATA).slice(0, 8));
  const [idx, setIdx] = useState(0);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [gotWrong, setGotWrong] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const { playCorrect, playWrong } = useSound();
  const { speak, speakSlow } = useSpeech();
  const { carActive, triggerCar } = useCarAnimation();
  const color = HUB_COLORS.mcq.text;
  const correctRef = useRef<string[]>([]);
  const wrongRef = useRef<string[]>([]);

  const choose = (opt: string) => {
    if (answeredCorrectly || attempts >= 3) return;
    const word = qs[idx].correct;
    if (opt === word) {
      setAnsweredCorrectly(true);
      setScore(s => s + 1);
      playCorrect();
      speak(word);
      triggerCar();
      if (!gotWrong) correctRef.current.push(word);
    } else {
      if (!gotWrong) { wrongRef.current.push(word); setGotWrong(true); }
      playWrong();
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShaking(true);
      if (newAttempts < 3) speak("tente novamente");
    }
  };
  const next = () => {
    if (idx + 1 >= qs.length) { mergeProficiency("quiz-hub", correctRef.current, wrongRef.current); setDone(true); return; }
    setIdx(i => i + 1);
    setAnsweredCorrectly(false);
    setGotWrong(false);
    setShaking(false);
    setAttempts(0);
  };

  if (done) return <ResultCard score={score} total={qs.length} onBack={onBack} title="Multiple Choice Complete!" color={color} />;
  const q = qs[idx];
  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${HUB_COLORS.mcq.bg}, #fff)` }}>
      <PortugueseCarAnimation active={carActive} />
      <QuizHeader title="☑️ Multiple Choice" onBack={onBack} progress={idx + 1} total={qs.length} color={color} />
      <main className="flex-1 flex flex-col px-4 py-5 max-w-lg mx-auto w-full gap-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Choose the correct answer</p>
          <div className="flex items-start gap-2">
            <p className="text-lg font-bold text-slate-800 flex-1">{q.q}</p>
            <button onClick={() => speakSlow(q.q)} className="shrink-0 p-2 rounded-full active:opacity-60 hover:bg-slate-100" style={{ color: "#64748B" }}><Volume2 size={20} /></button>
          </div>
        </div>
        <div className={`space-y-2.5 ${shaking ? "animate-shake" : ""}`} onAnimationEnd={() => setShaking(false)}>
          {q.options.map(opt => (
            <ChoiceBtn key={opt} label={opt} selected={false} correct={opt === q.correct}
              onChoose={() => choose(opt)} disabled={answeredCorrectly || attempts >= 3} />
          ))}
        </div>
        {answeredCorrectly && (
          <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed text-center"
            style={{ backgroundColor: PT.greenBg, border: `1px solid ${PT.green}`, color: PT.green }}>
            <p className="font-bold text-base">Muito bem! ✓</p>
            {(q as any).explanation && <p className="text-slate-600 text-xs mt-1">{(q as any).explanation}</p>}
          </div>
        )}
        {!answeredCorrectly && attempts >= 3 && (
          <div className="rounded-2xl px-4 py-3 text-sm text-center"
            style={{ backgroundColor: PT.redBg, border: `1px solid ${PT.red}`, color: PT.red }}>
            <p className="font-bold">3 tentativas esgotadas</p>
            <p className="text-xs mt-0.5 text-slate-600">A resposta certa era: <strong>{q.correct}</strong></p>
          </div>
        )}
        {(answeredCorrectly || attempts >= 3) && (
          <div className="flex justify-end pt-2">
            <button onClick={next}
              className="w-24 h-24 rounded-full font-bold text-white flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all"
              style={{ backgroundColor: answeredCorrectly ? color : "#94A3B8", boxShadow: `0 8px 24px ${answeredCorrectly ? color : "#94A3B8"}55` }}>
              <span className="text-2xl leading-none">›</span>
              <span className="text-[11px] font-black tracking-wide">{idx + 1 < qs.length ? "Próximo" : "Resultado"}</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. TRUE OR FALSE QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

const TF_DATA = [
  // ── Language ──────────────────────────────────────────────────────────────
  { statement: "In European Portuguese, 'tu' is the standard informal way to say 'you'.", answer: true, explanation: "Correct! 'Tu' is the normal second-person singular in Portugal." },
  { statement: "'Autocarro' means car in European Portuguese.", answer: false, explanation: "False. 'Autocarro' means bus. 'Carro' means car." },
  { statement: "The word 'saudade' has a perfect single-word English translation.", answer: false, explanation: "False. 'Saudade' describes a deep emotional longing — no exact English equivalent exists." },
  { statement: "In Portugal, 'comboio' is the word for train.", answer: true, explanation: "Correct! 'Comboio' = train in European Portuguese. In Brazil they say 'trem'." },
  { statement: "'Obrigado' and 'Obrigada' mean the same thing.", answer: true, explanation: "Both mean 'thank you'. Men say 'Obrigado', women say 'Obrigada'." },
  { statement: "'Gelado' is the European Portuguese word for ice cream.", answer: true, explanation: "Correct! Brazilians say 'sorvete', but in Portugal it's 'gelado'." },
  { statement: "'Sumo' means juice in European Portuguese.", answer: true, explanation: "Correct! 'Suco' is the Brazilian word, but in Portugal it's 'sumo'." },
  { statement: "The verb 'gostar' means 'to hate' in Portuguese.", answer: false, explanation: "False. 'Gostar' means 'to like'. 'Odiar' means to hate." },
  { statement: "In European Portuguese, adjectives must agree in gender with the noun.", answer: true, explanation: "Correct! For example: 'carro vermelho' (red car) but 'casa vermelha' (red house)." },
  { statement: "'Bom dia' is used to greet someone in the afternoon.", answer: false, explanation: "False. 'Bom dia' means Good morning. Use 'Boa tarde' in the afternoon." },
  { statement: "'Com licença' is used to say excuse me or pardon in Portuguese.", answer: true, explanation: "Correct! 'Com licença' is how you politely excuse yourself in Portugal." },
  { statement: "'Quanto custa?' means 'How much does it cost?'", answer: true, explanation: "Correct! A very useful shopping phrase." },
  { statement: "In European Portuguese, object pronouns are placed before the verb in most sentences.", answer: false, explanation: "False — in European Portuguese, pronouns typically go AFTER the verb (enclisis), e.g. 'dá-me' not 'me dá'." },
  { statement: "'Cascata' is the European Portuguese word for waterfall.", answer: true, explanation: "Correct! Brazilians say 'cachoeira', but in Portugal the word is 'cascata'." },
  { statement: "The Portuguese word 'janela' means door.", answer: false, explanation: "False. 'Janela' means window. 'Porta' means door." },
  { statement: "'Pequeno-almoço' is the European Portuguese term for breakfast.", answer: true, explanation: "Correct! In Brazil they say 'café da manhã', but in Portugal it's 'pequeno-almoço'." },
  { statement: "'Falar' means 'to speak' in Portuguese.", answer: true, explanation: "Correct! 'Eu falo português' = I speak Portuguese." },
  { statement: "'Obrigado' is typically said by a woman thanking someone.", answer: false, explanation: "False. Women say 'Obrigada'. Men say 'Obrigado'. The ending matches the speaker's gender." },
  { statement: "The Portuguese word 'livro' means library.", answer: false, explanation: "False. 'Livro' means book. Library is 'biblioteca'." },
  { statement: "'Sempre' means 'never' in Portuguese.", answer: false, explanation: "False. 'Sempre' means 'always'. 'Nunca' means never." },
  { statement: "Portuguese is the official language of Brazil.", answer: true, explanation: "Correct! Brazil was colonised by Portugal, and Portuguese remains the official language." },
  { statement: "'Olá' is a casual greeting meaning hello in Portuguese.", answer: true, explanation: "Correct! 'Olá' is the everyday way to say hello in Portugal." },
  { statement: "In European Portuguese, 'você' is used more often than 'tu' in everyday speech.", answer: false, explanation: "False. In Portugal, 'tu' is the standard informal form. 'Você' is far more common in Brazilian Portuguese." },
  { statement: "The number 'dezassete' means seventeen in Portuguese.", answer: true, explanation: "Correct! Dezasseis = 16, dezassete = 17, dezoito = 18." },
  { statement: "'Até logo' means 'goodbye for now' in Portuguese.", answer: true, explanation: "Correct! 'Até logo' = see you soon / goodbye for now." },

  { statement: "European Portuguese and Brazilian Portuguese sound very similar.", answer: false, explanation: "False. They are quite distinct — European Portuguese has more reduced vowels and a more 'closed' sound overall." },
  { statement: "In European Portuguese, 'comboio' means train.", answer: true, explanation: "Correct! Brazil says 'trem', but in Portugal the word is 'comboio'." },
  { statement: "'Já' can mean 'right now' in European Portuguese.", answer: true, explanation: "Correct! 'Já vou!' = I'm coming right now. It can also mean 'already'." },
  { statement: "'Faz favor' is used to say 'thank you' in Portugal.", answer: false, explanation: "False. 'Faz favor' means 'please' or is used to get someone's attention. 'Obrigado/a' means thank you." },
];

function TrueFalseQuiz({ onBack }: { onBack: () => void }) {
  const [qs] = useState(() => shuffle(TF_DATA).slice(0, 12));
  const [idx, setIdx] = useState(0);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [gotWrong, setGotWrong] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const { playCorrect, playWrong } = useSound();
  const { speak, speakSlow } = useSpeech();
  const { carActive, triggerCar } = useCarAnimation();
  const color = HUB_COLORS.truefalse.text;
  const correctRef = useRef<string[]>([]);
  const wrongRef = useRef<string[]>([]);

  const choose = (val: boolean) => {
    if (answeredCorrectly || attempts >= 3) return;
    const key = qs[idx].statement.slice(0, 50);
    if (val === qs[idx].answer) {
      setAnsweredCorrectly(true);
      setScore(s => s + 1);
      playCorrect();
      triggerCar();
      if (!gotWrong) correctRef.current.push(key);
    } else {
      if (!gotWrong) { wrongRef.current.push(key); setGotWrong(true); }
      playWrong();
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShaking(true);
      if (newAttempts < 3) speak("tente novamente");
    }
  };
  const next = () => {
    if (idx + 1 >= qs.length) { mergeProficiency("quiz-hub", correctRef.current, wrongRef.current); setDone(true); return; }
    setIdx(i => i + 1);
    setAnsweredCorrectly(false);
    setGotWrong(false);
    setShaking(false);
    setAttempts(0);
  };

  if (done) return <ResultCard score={score} total={qs.length} onBack={onBack} title="True or False Complete!" color={color} />;
  const q = qs[idx];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${HUB_COLORS.truefalse.bg}, #fff)` }}>
      <PortugueseCarAnimation active={carActive} />
      <QuizHeader title="⚖️ True or False" onBack={onBack} progress={idx + 1} total={qs.length} color={color} />
      <main className="flex-1 flex flex-col px-4 py-5 max-w-lg mx-auto w-full gap-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">True or false?</p>
          <div className="flex items-start gap-2">
            <p className="text-lg font-bold text-slate-800 leading-snug flex-1">{q.statement}</p>
            <button onClick={() => speakSlow(q.statement)} className="shrink-0 p-2 rounded-full active:opacity-60 hover:bg-slate-100" style={{ color: "#64748B" }}><Volume2 size={20} /></button>
          </div>
        </div>

        <div className={`grid grid-cols-2 gap-3 ${shaking ? "animate-shake" : ""}`} onAnimationEnd={() => setShaking(false)}>
          {[true, false].map(val => {
            const locked = answeredCorrectly || attempts >= 3;
            let style: React.CSSProperties = { border: "2px solid #e2e8f0", color: "#334155" };
            if (locked) {
              if (val === q.answer) style = { border: `2px solid ${PT.green}`, backgroundColor: PT.greenBg, color: PT.green };
              else style = { border: "2px solid #e2e8f0", color: "#94a3b8", opacity: 0.5 };
            }
            return (
              <button key={String(val)} onClick={() => choose(val)} disabled={locked}
                className="py-5 rounded-3xl bg-white font-black text-xl transition-all active:scale-[0.97]"
                style={style}>
                {val ? "✅ True" : "❌ False"}
              </button>
            );
          })}
        </div>

        {answeredCorrectly && (
          <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed text-center"
            style={{ backgroundColor: PT.greenBg, border: `1px solid ${PT.green}`, color: PT.green }}>
            <p className="font-bold text-base">Muito bem! ✓</p>
            <p className="text-slate-600 text-xs mt-1">{q.explanation}</p>
          </div>
        )}
        {!answeredCorrectly && attempts >= 3 && (
          <div className="rounded-2xl px-4 py-3 text-sm text-center"
            style={{ backgroundColor: PT.redBg, border: `1px solid ${PT.red}`, color: PT.red }}>
            <p className="font-bold">3 tentativas esgotadas</p>
            <p className="text-xs mt-0.5 text-slate-600">A resposta certa era: <strong>{q.answer ? "True" : "False"}</strong></p>
            <p className="text-xs text-slate-500 mt-1">{q.explanation}</p>
          </div>
        )}

        {(answeredCorrectly || attempts >= 3) && (
          <div className="flex justify-end pt-2">
            <button onClick={next}
              className="w-24 h-24 rounded-full font-bold text-white flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all"
              style={{ backgroundColor: answeredCorrectly ? color : "#94A3B8", boxShadow: `0 8px 24px ${answeredCorrectly ? color : "#94A3B8"}55` }}>
              <span className="text-2xl leading-none">›</span>
              <span className="text-[11px] font-black tracking-wide">{idx + 1 < qs.length ? "Próximo" : "Resultado"}</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. LETTER-TILE QUIZ (hangman-style fill-the-blanks)
// ═══════════════════════════════════════════════════════════════════════════════

const OPEN_DATA = [
  { prompt: "How do you say 'Good morning' in European Portuguese?", answer: "bom dia" },
  { prompt: "What is the European Portuguese word for 'train'?", answer: "comboio" },
  { prompt: "How do you say 'thank you' (as a woman)?", answer: "obrigada" },
  { prompt: "What is the European Portuguese word for 'bus'?", answer: "autocarro" },
  { prompt: "How do you say 'excuse me' in Portuguese?", answer: "com licença" },
  { prompt: "What is 'ice cream' in European Portuguese?", answer: "gelado" },
  { prompt: "How do you say 'How much does it cost?'", answer: "quanto custa" },
  { prompt: "What is 'juice' in European Portuguese?", answer: "sumo" },
  { prompt: "How do you say 'Good evening'?", answer: "boa noite" },
  { prompt: "What is 'please' in European Portuguese?", answer: "por favor" },
];

interface TileSlot { char: string; isBlank: boolean; bIdx: number }
interface PoolTile { id: string; letter: string; used: boolean }

function makeHangmanTemplate(answer: string): TileSlot[] {
  const words = answer.toUpperCase().split(' ');
  const result: TileSlot[] = [];
  let bIdx = 0;
  words.forEach((word, wi) => {
    if (wi > 0) result.push({ char: ' ', isBlank: false, bIdx: -1 });
    const n = word.length;
    const numBlanks = n <= 3 ? 1 : n <= 6 ? 2 : 3;
    const eligible = Array.from({ length: n - 1 }, (_, i) => i + 1);
    const step = Math.max(1, Math.floor(eligible.length / numBlanks));
    const blankSet = new Set<number>();
    for (let b = 0; b < numBlanks && b < eligible.length; b++) {
      blankSet.add(eligible[Math.min(b * step, eligible.length - 1)]);
    }
    word.split('').forEach((char, ci) => {
      result.push(blankSet.has(ci)
        ? { char, isBlank: true, bIdx: bIdx++ }
        : { char, isBlank: false, bIdx: -1 });
    });
  });
  return result;
}

function OpenEndedQuiz({ onBack }: { onBack: () => void }) {
  const [qs] = useState(() => shuffle(OPEN_DATA).slice(0, 6));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [checked, setChecked] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [blankValues, setBlankValues] = useState<Record<number, string>>({});
  const [pool, setPool] = useState<PoolTile[]>([]);
  const { speak, speakSlow } = useSpeech();
  const { playCorrect, playWrong } = useSound();
  const correctRef = useRef<string[]>([]);
  const wrongRef = useRef<string[]>([]);
  const color = HUB_COLORS.openended.text;

  const template = useMemo(() => makeHangmanTemplate(qs[idx].answer), [qs, idx]);

  useEffect(() => {
    const blanked: PoolTile[] = template
      .filter(t => t.isBlank)
      .map(t => ({ id: `c-${t.bIdx}`, letter: t.char, used: false }));
    const usedSet = new Set(blanked.map(b => b.letter));
    const ptPool = 'ABCDEÉFGHIÍJLMNOPRSTUÚVXZÇÃÕ'.split('').filter(l => !usedSet.has(l));
    const distractors: PoolTile[] = shuffle(ptPool)
      .slice(0, Math.min(3, blanked.length + 1))
      .map((l, i) => ({ id: `d-${i}`, letter: l, used: false }));
    setPool(shuffle([...blanked, ...distractors]));
    setBlankValues({});
    setSelected(null);
    setChecked(false);
  }, [idx, template]);

  const allFilled = template.filter(t => t.isBlank).every(t => blankValues[t.bIdx] !== undefined);

  const handlePoolTap = (id: string) => {
    if (checked) return;
    const item = pool.find(p => p.id === id);
    if (!item || item.used) return;
    setSelected(prev => prev === id ? null : id);
  };

  const handleBlankTap = (bIdx: number) => {
    if (checked) return;
    if (selected) {
      const prev = blankValues[bIdx];
      setBlankValues(v => ({ ...v, [bIdx]: selected }));
      setPool(items => items.map(p => {
        if (p.id === selected) return { ...p, used: true };
        if (p.id === prev) return { ...p, used: false };
        return p;
      }));
      setSelected(null);
    } else if (blankValues[bIdx]) {
      const itemId = blankValues[bIdx];
      setBlankValues(v => { const n = { ...v }; delete n[bIdx]; return n; });
      setPool(items => items.map(p => p.id === itemId ? { ...p, used: false } : p));
    }
  };

  const handleCheck = () => {
    const allCorrect = template.filter(t => t.isBlank).every(t => {
      const placed = pool.find(p => p.id === blankValues[t.bIdx]);
      return placed?.letter === t.char;
    });
    setChecked(true);
    const word = qs[idx].answer;
    if (allCorrect) { setScore(s => s + 1); playCorrect(); correctRef.current.push(word); }
    else { playWrong(); wrongRef.current.push(word); }
    speak(word);
  };

  const next = () => {
    if (idx + 1 >= qs.length) {
      mergeProficiency("quiz-hub", correctRef.current, wrongRef.current);
      setDone(true); return;
    }
    setIdx(i => i + 1);
  };

  if (done) return <ResultCard score={score} total={qs.length} onBack={onBack} title="Letter Quiz Complete!" color={color} />;

  const q = qs[idx];
  const isAllCorrect = checked && template.filter(t => t.isBlank).every(t =>
    pool.find(p => p.id === blankValues[t.bIdx])?.letter === t.char
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${HUB_COLORS.openended.bg}, #fff)` }}>
      <QuizHeader title="✍️ Fill the Letters" onBack={onBack} progress={idx + 1} total={qs.length} color={color} />
      <main className="flex-1 flex flex-col px-4 py-5 max-w-lg mx-auto w-full gap-4">

        {/* Question card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Fill in the missing letters</p>
          <div className="flex items-start gap-2">
            <p className="text-lg font-bold text-slate-800 leading-snug flex-1">{q.prompt}</p>
            <button onClick={() => speakSlow(q.answer)} className="shrink-0 p-2 rounded-full active:opacity-60 hover:bg-slate-100" style={{ color: "#64748B" }}><Volume2 size={20} /></button>
          </div>
        </div>

        {/* Word template */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 text-center mb-4">
            {checked ? (isAllCorrect ? "✓ Perfect!" : "Tap Next to continue") : "Tap a letter below, then tap a blank"}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 mb-1">
            {template.map((t, i) => {
              if (t.char === ' ') return <div key={i} className="w-3" />;
              if (!t.isBlank) {
                return (
                  <div key={i} className="w-10 h-12 rounded-xl flex items-center justify-center font-black text-lg select-none"
                    style={{ backgroundColor: '#F1F5F9', color: '#334155', border: '2px solid #E2E8F0' }}>
                    {t.char}
                  </div>
                );
              }
              const placed = blankValues[t.bIdx] ? pool.find(p => p.id === blankValues[t.bIdx]) : null;
              let style: React.CSSProperties;
              if (checked && placed) {
                style = placed.letter === t.char
                  ? { border: `2.5px solid ${PT.green}`, backgroundColor: PT.greenBg, color: PT.green }
                  : { border: `2.5px solid ${PT.red}`, backgroundColor: PT.redBg, color: PT.red };
              } else if (placed) {
                style = { border: `2.5px solid ${color}`, backgroundColor: `${color}18`, color };
              } else {
                style = { border: '2.5px dashed #94A3B8', backgroundColor: '#F8FAFC', color: '#94A3B8' };
              }
              return (
                <button key={i} onClick={() => handleBlankTap(t.bIdx)}
                  className="w-10 h-12 rounded-xl flex items-center justify-center font-black text-lg transition-all active:scale-90"
                  style={style}>
                  {placed?.letter ?? ''}
                </button>
              );
            })}
          </div>
          {checked && (
            <div className="mt-4 rounded-2xl px-4 py-2.5 text-sm text-center font-bold"
              style={{
                backgroundColor: isAllCorrect ? PT.greenBg : PT.redBg,
                color: isAllCorrect ? PT.green : PT.red,
                border: `1px solid ${isAllCorrect ? PT.green : PT.red}`,
              }}>
              {isAllCorrect ? "Correct! ✓" : <>Not quite ✗ — the answer is: <strong>{q.answer}</strong></>}
            </div>
          )}
        </div>

        {/* Letter pool */}
        {!checked && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 text-center mb-3">Available letters</p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {pool.map(item => (
                <button key={item.id} onClick={() => handlePoolTap(item.id)}
                  disabled={item.used}
                  className="w-11 h-11 rounded-xl font-black text-lg transition-all active:scale-90 select-none"
                  style={{
                    backgroundColor: item.used ? '#F1F5F9' : selected === item.id ? color : '#fff',
                    color: item.used ? '#CBD5E1' : selected === item.id ? '#fff' : '#334155',
                    border: `2px solid ${item.used ? '#E2E8F0' : selected === item.id ? color : '#CBD5E1'}`,
                    transform: selected === item.id ? 'scale(1.12)' : 'scale(1)',
                    opacity: item.used ? 0.35 : 1,
                    boxShadow: selected === item.id ? `0 4px 12px ${color}44` : 'none',
                  }}>
                  {item.letter}
                </button>
              ))}
            </div>
          </div>
        )}

        {!checked ? (
          <button onClick={handleCheck} disabled={!allFilled}
            className="w-full py-4 rounded-3xl font-bold text-white text-sm transition-all disabled:opacity-40"
            style={{ backgroundColor: color }}>
            Check Answer
          </button>
        ) : (
          <button onClick={next}
            className="w-full py-4 rounded-3xl font-bold text-white text-sm"
            style={{ backgroundColor: color }}>
            {idx + 1 < qs.length ? "Next →" : "See Results"}
          </button>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. FILL-IN-THE-BLANK QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

const FITB_DATA = [
  { before: "Bom", blank: "___", after: "!", answer: "dia", sentence: "Bom dia!", english: "Good morning!", options: ["dia", "noite", "tarde", "favor"] },
  { before: "Por", blank: "___", after: ".", answer: "favor", sentence: "Por favor.", english: "Please.", options: ["favor", "acaso", "isso", "fim"] },
  { before: "Com", blank: "___", after: "!", answer: "licença", sentence: "Com licença!", english: "Excuse me!", options: ["licença", "prazer", "muito", "amor"] },
  { before: "De", blank: "___", after: ".", answer: "nada", sentence: "De nada.", english: "You're welcome.", options: ["nada", "novo", "vez", "mais"] },
  { before: "Onde fica a casa de", blank: "___", after: "?", answer: "banho", sentence: "Onde fica a casa de banho?", english: "Where is the bathroom?", options: ["banho", "compras", "jantar", "campo"] },
  { before: "Preciso de", blank: "___", after: ".", answer: "ajuda", sentence: "Preciso de ajuda.", english: "I need help.", options: ["ajuda", "água", "vinho", "dinheiro"] },
  { before: "Fala", blank: "___", after: "?", answer: "inglês", sentence: "Fala inglês?", english: "Do you speak English?", options: ["inglês", "francês", "português", "espanhol"] },
  { before: "Quanto", blank: "___", after: "?", answer: "custa", sentence: "Quanto custa?", english: "How much does it cost?", options: ["custa", "mede", "vale", "pesa"] },
];

function FillBlankQuiz({ onBack }: { onBack: () => void }) {
  const [qs] = useState(() => shuffle(FITB_DATA).slice(0, 7));
  const [idx, setIdx] = useState(0);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [gotWrong, setGotWrong] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const { playCorrect, playWrong } = useSound();
  const { speak, speakSlow } = useSpeech();
  const { carActive, triggerCar } = useCarAnimation();
  const color = HUB_COLORS.fillblank.text;
  const correctRef = useRef<string[]>([]);
  const wrongRef = useRef<string[]>([]);

  const opts = useMemo(() => shuffle(qs[idx].options), [qs, idx]);

  const choose = (opt: string) => {
    if (answeredCorrectly || attempts >= 3) return;
    const word = qs[idx].answer;
    if (opt === word) {
      setAnsweredCorrectly(true);
      setScore(s => s + 1);
      playCorrect();
      speak(qs[idx].sentence);
      triggerCar();
      if (!gotWrong) correctRef.current.push(word);
    } else {
      if (!gotWrong) { wrongRef.current.push(word); setGotWrong(true); }
      playWrong();
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShaking(true);
      if (newAttempts < 3) speak("tente novamente");
    }
  };

  const next = () => {
    if (idx + 1 >= qs.length) { mergeProficiency("quiz-hub", correctRef.current, wrongRef.current); setDone(true); return; }
    setIdx(i => i + 1);
    setAnsweredCorrectly(false);
    setGotWrong(false);
    setShaking(false);
    setAttempts(0);
  };

  if (done) return <ResultCard score={score} total={qs.length} onBack={onBack} title="Fill-in-the-Blank Complete!" color={color} />;

  const q = qs[idx];
  const locked = answeredCorrectly || attempts >= 3;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${HUB_COLORS.fillblank.bg}, #fff)` }}>
      <PortugueseCarAnimation active={carActive} />
      <QuizHeader title="📝 Fill in the Blank" onBack={onBack} progress={idx + 1} total={qs.length} color={color} />
      <main className="flex-1 flex flex-col px-4 py-5 max-w-lg mx-auto w-full gap-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-start gap-2 mb-3">
            <p className="text-xs uppercase tracking-widest text-slate-400 flex-1">Fill in the missing word</p>
            <button onClick={() => speakSlow(`${q.before} ${q.correct} ${q.after}`)} className="shrink-0 p-2 rounded-full active:opacity-60 hover:bg-slate-100" style={{ color: "#64748B" }}><Volume2 size={20} /></button>
          </div>
          <p className="text-sm text-slate-400 italic mb-3">{q.english}</p>
          <p className="text-2xl font-bold text-slate-800">
            {q.before}{" "}
            <span className="inline-block px-3 py-0.5 rounded-xl border-2 min-w-[80px] text-center transition-all duration-300"
              style={{
                borderColor: locked ? (answeredCorrectly ? PT.green : PT.red) : color,
                backgroundColor: locked ? (answeredCorrectly ? PT.greenBg : PT.redBg) : `${color}12`,
                color: locked ? (answeredCorrectly ? PT.green : PT.red) : color,
              }}>
              {locked ? q.answer : "___"}
            </span>
            {" "}{q.after}
          </p>
        </div>

        <div className={`grid grid-cols-2 gap-2.5 ${shaking ? "animate-shake" : ""}`} onAnimationEnd={() => setShaking(false)}>
          {opts.map(opt => {
            let style: React.CSSProperties = { border: "2px solid #e2e8f0", color: "#334155" };
            if (locked) {
              if (opt === q.answer) style = { border: `2px solid ${PT.green}`, backgroundColor: PT.greenBg, color: PT.green };
              else style = { border: "2px solid #e2e8f0", color: "#94a3b8", opacity: 0.35 };
            }
            return (
              <button key={opt} onClick={() => choose(opt)} disabled={locked}
                className="py-4 rounded-3xl bg-white font-bold text-sm transition-all active:scale-[0.97]"
                style={style}>
                {opt}
              </button>
            );
          })}
        </div>

        {answeredCorrectly && (
          <div className="rounded-2xl px-4 py-3 text-sm text-center"
            style={{ backgroundColor: PT.greenBg, border: `1px solid ${PT.green}`, color: PT.green }}>
            <p className="font-bold text-base">Muito bem! ✓</p>
          </div>
        )}
        {!answeredCorrectly && attempts >= 3 && (
          <div className="rounded-2xl px-4 py-3 text-sm text-center"
            style={{ backgroundColor: PT.redBg, border: `1px solid ${PT.red}`, color: PT.red }}>
            <p className="font-bold">3 tentativas esgotadas</p>
            <p className="text-xs mt-0.5 text-slate-600">A resposta certa era: <strong>{q.answer}</strong></p>
          </div>
        )}

        {locked && (
          <div className="flex justify-end pt-2">
            <button onClick={next}
              className="w-24 h-24 rounded-full font-bold text-white flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all"
              style={{ backgroundColor: answeredCorrectly ? color : "#94A3B8", boxShadow: `0 8px 24px ${answeredCorrectly ? color : "#94A3B8"}55` }}>
              <span className="text-2xl leading-none">›</span>
              <span className="text-[11px] font-black tracking-wide">{idx + 1 < qs.length ? "Próximo" : "Resultado"}</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. PICTURE QUIZ (emoji-based)
// ═══════════════════════════════════════════════════════════════════════════════

const PICTURE_DATA = [
  { emoji: "🐟", answer: "Peixe", options: ["Peixe", "Frango", "Carne", "Leite"], english: "Fish" },
  { emoji: "🚌", answer: "Autocarro", options: ["Autocarro", "Comboio", "Avião", "Táxi"], english: "Bus" },
  { emoji: "🏰", answer: "Castelo", options: ["Castelo", "Hotel", "Museu", "Igreja"], english: "Castle" },
  { emoji: "☀️", answer: "Sol", options: ["Sol", "Lua", "Estrela", "Chuva"], english: "Sun" },
  { emoji: "🌊", answer: "Mar", options: ["Mar", "Rio", "Lago", "Oceano"], english: "Sea" },
  { emoji: "🍷", answer: "Vinho", options: ["Vinho", "Cerveja", "Água", "Sumo"], english: "Wine" },
  { emoji: "🐓", answer: "Galo", options: ["Galo", "Pato", "Galinha", "Pomba"], english: "Cockerel" },
  { emoji: "🐑", answer: "Ovelha", options: ["Ovelha", "Vaca", "Cabra", "Porco"], english: "Sheep" },
  { emoji: "🍊", answer: "Laranja", options: ["Laranja", "Limão", "Maçã", "Pêra"], english: "Orange" },
  { emoji: "⛵", answer: "Barco", options: ["Barco", "Avião", "Comboio", "Carro"], english: "Boat" },
];

function PictureQuiz({ onBack }: { onBack: () => void }) {
  const [qs] = useState(() => shuffle(PICTURE_DATA).slice(0, 8));
  const [idx, setIdx] = useState(0);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [gotWrong, setGotWrong] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const { playCorrect, playWrong } = useSound();
  const { speak, speakSlow } = useSpeech();
  const { carActive, triggerCar } = useCarAnimation();
  const color = HUB_COLORS.picture.text;
  const correctRef = useRef<string[]>([]);
  const wrongRef = useRef<string[]>([]);
  const opts = useMemo(() => shuffle(qs[idx].options), [qs, idx]);

  const choose = (opt: string) => {
    if (answeredCorrectly || attempts >= 3) return;
    const word = qs[idx].answer;
    if (opt === word) {
      setAnsweredCorrectly(true);
      setScore(s => s + 1);
      playCorrect();
      speak(word);
      triggerCar();
      if (!gotWrong) correctRef.current.push(word);
    } else {
      if (!gotWrong) { wrongRef.current.push(word); setGotWrong(true); }
      playWrong();
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShaking(true);
      if (newAttempts < 3) speak("tente novamente");
    }
  };
  const next = () => {
    if (idx + 1 >= qs.length) { mergeProficiency("quiz-hub", correctRef.current, wrongRef.current); setDone(true); return; }
    setIdx(i => i + 1);
    setAnsweredCorrectly(false);
    setGotWrong(false);
    setShaking(false);
    setAttempts(0);
  };

  if (done) return <ResultCard score={score} total={qs.length} onBack={onBack} title="Picture Quiz Complete!" color={color} />;
  const q = qs[idx];
  const locked = answeredCorrectly || attempts >= 3;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${HUB_COLORS.picture.bg}, #fff)` }}>
      <PortugueseCarAnimation active={carActive} />
      <QuizHeader title="🖼️ Picture Quiz" onBack={onBack} progress={idx + 1} total={qs.length} color={color} />
      <main className="flex-1 flex flex-col px-4 py-5 max-w-lg mx-auto w-full gap-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center relative">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-4">What is this in Portuguese?</p>
          <div className="text-8xl mb-2 leading-none">{q.emoji}</div>
          <p className="text-sm text-slate-400 italic mt-2">{q.english}</p>
          <button onClick={() => speakSlow(q.answer)} className="absolute top-4 right-4 p-2 rounded-full active:opacity-60 hover:bg-slate-100" style={{ color: "#64748B" }}><Volume2 size={20} /></button>
        </div>
        <div className={`grid grid-cols-2 gap-2.5 ${shaking ? "animate-shake" : ""}`} onAnimationEnd={() => setShaking(false)}>
          {opts.map(opt => {
            let style: React.CSSProperties = { border: "2px solid #e2e8f0", color: "#334155" };
            if (locked) {
              if (opt === q.answer) style = { border: `2px solid ${PT.green}`, backgroundColor: PT.greenBg, color: PT.green };
              else style = { border: "2px solid #e2e8f0", color: "#94a3b8", opacity: 0.35 };
            }
            return (
              <button key={opt} onClick={() => choose(opt)} disabled={locked}
                className="py-4 rounded-3xl bg-white font-bold text-sm transition-all active:scale-[0.97]"
                style={style}>
                {opt}
              </button>
            );
          })}
        </div>
        {answeredCorrectly && (
          <div className="rounded-2xl px-4 py-3 text-sm text-center"
            style={{ backgroundColor: PT.greenBg, border: `1px solid ${PT.green}`, color: PT.green }}>
            <p className="font-bold text-base">Muito bem! ✓</p>
          </div>
        )}
        {!answeredCorrectly && attempts >= 3 && (
          <div className="rounded-2xl px-4 py-3 text-sm text-center"
            style={{ backgroundColor: PT.redBg, border: `1px solid ${PT.red}`, color: PT.red }}>
            <p className="font-bold">3 tentativas esgotadas</p>
            <p className="text-xs mt-0.5 text-slate-600">A resposta certa era: <strong>{q.answer}</strong></p>
          </div>
        )}
        {locked && (
          <div className="flex justify-end pt-2">
            <button onClick={next}
              className="w-24 h-24 rounded-full font-bold text-white flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all"
              style={{ backgroundColor: answeredCorrectly ? color : "#94A3B8", boxShadow: `0 8px 24px ${answeredCorrectly ? color : "#94A3B8"}55` }}>
              <span className="text-2xl leading-none">›</span>
              <span className="text-[11px] font-black tracking-wide">{idx + 1 < qs.length ? "Próximo" : "Resultado"}</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. AUDIO QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

const AUDIO_DATA = [
  { tts: "Bom dia", answer: "Good morning", options: ["Good morning", "Good afternoon", "Good evening", "Hello"] },
  { tts: "Obrigado", answer: "Thank you (man speaking)", options: ["Thank you (man speaking)", "Please", "Excuse me", "Sorry"] },
  { tts: "Onde fica a estação?", answer: "Where is the station?", options: ["Where is the station?", "What time is it?", "How much does it cost?", "Do you have a room?"] },
  { tts: "Preciso de ajuda", answer: "I need help", options: ["I need help", "I am lost", "I want food", "I don't understand"] },
  { tts: "Autocarro", answer: "Bus", options: ["Bus", "Train", "Taxi", "Plane"] },
  { tts: "Quanto custa?", answer: "How much does it cost?", options: ["How much does it cost?", "What is this?", "Where is it?", "Do you have it?"] },
  { tts: "Boa noite", answer: "Good evening / Good night", options: ["Good evening / Good night", "Good morning", "Good afternoon", "See you later"] },
  { tts: "Por favor", answer: "Please", options: ["Please", "Thank you", "You're welcome", "Excuse me"] },
];

function AudioQuiz({ onBack }: { onBack: () => void }) {
  const [qs] = useState(() => shuffle(AUDIO_DATA).slice(0, 7));
  const [idx, setIdx] = useState(0);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [gotWrong, setGotWrong] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [played, setPlayed] = useState(false);
  const { speak, speakSlow, speaking } = useSpeech();
  const { playCorrect, playWrong } = useSound();
  const { carActive, triggerCar } = useCarAnimation();
  const color = HUB_COLORS.audio.text;
  const correctRef = useRef<string[]>([]);
  const wrongRef = useRef<string[]>([]);
  const opts = useMemo(() => shuffle(qs[idx].options), [qs, idx]);

  const playAudio = useCallback(() => {
    speak(qs[idx].tts);
    setPlayed(true);
  }, [speak, qs, idx]);

  const choose = (opt: string) => {
    if (!played || answeredCorrectly || attempts >= 3) return;
    const word = qs[idx].tts;
    if (opt === qs[idx].answer) {
      setAnsweredCorrectly(true);
      setScore(s => s + 1);
      playCorrect();
      triggerCar();
      if (!gotWrong) correctRef.current.push(word);
    } else {
      if (!gotWrong) { wrongRef.current.push(word); setGotWrong(true); }
      playWrong();
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShaking(true);
      if (newAttempts < 3) speak("tente novamente");
    }
  };
  const next = () => {
    if (idx + 1 >= qs.length) { mergeProficiency("quiz-hub", correctRef.current, wrongRef.current); setDone(true); return; }
    setIdx(i => i + 1);
    setAnsweredCorrectly(false);
    setGotWrong(false);
    setShaking(false);
    setPlayed(false);
    setAttempts(0);
  };

  if (done) return <ResultCard score={score} total={qs.length} onBack={onBack} title="Audio Quiz Complete!" color={color} />;
  const q = qs[idx];
  const locked = answeredCorrectly || attempts >= 3;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${HUB_COLORS.audio.bg}, #fff)` }}>
      <PortugueseCarAnimation active={carActive} />
      <QuizHeader title="🎧 Audio Quiz" onBack={onBack} progress={idx + 1} total={qs.length} color={color} />
      <main className="flex-1 flex flex-col px-4 py-5 max-w-lg mx-auto w-full gap-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-5">Listen and choose the correct meaning</p>
          <button onClick={playAudio}
            className="mx-auto w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-md"
            style={{ backgroundColor: speaking ? `${color}22` : color }}>
            <Volume2 size={34} color={speaking ? color : "white"} className={speaking ? "animate-pulse" : ""} />
          </button>
          {!played && <p className="text-xs text-slate-400 mt-4">Tap to listen</p>}
          {played && !locked && <p className="text-xs mt-4 font-medium" style={{ color }}>Now choose the meaning ↓</p>}
        </div>

        <div className={`space-y-2.5 ${shaking ? "animate-shake" : ""}`} onAnimationEnd={() => setShaking(false)}>
          {opts.map(opt => (
            <ChoiceBtn key={opt} label={opt} selected={false} correct={opt === q.answer}
              onChoose={() => { if (played) choose(opt); }} disabled={locked || !played} />
          ))}
        </div>

        {!played && <p className="text-center text-xs text-slate-400">Listen to the audio before choosing</p>}

        {answeredCorrectly && (
          <div className="rounded-2xl px-4 py-3 text-sm text-center"
            style={{ backgroundColor: PT.greenBg, border: `1px solid ${PT.green}`, color: PT.green }}>
            <p className="font-bold text-base">Muito bem! ✓</p>
            <p className="text-xs text-slate-600 mt-0.5">{q.tts}</p>
          </div>
        )}
        {!answeredCorrectly && attempts >= 3 && (
          <div className="rounded-2xl px-4 py-3 text-sm text-center"
            style={{ backgroundColor: PT.redBg, border: `1px solid ${PT.red}`, color: PT.red }}>
            <p className="font-bold">3 tentativas esgotadas</p>
            <p className="text-xs mt-0.5 text-slate-600">A resposta certa era: <strong>{q.answer}</strong></p>
          </div>
        )}

        {locked && (
          <div className="flex justify-end pt-2">
            <button onClick={next}
              className="w-24 h-24 rounded-full font-bold text-white flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all"
              style={{ backgroundColor: answeredCorrectly ? color : "#94A3B8", boxShadow: `0 8px 24px ${answeredCorrectly ? color : "#94A3B8"}55` }}>
              <span className="text-2xl leading-none">›</span>
              <span className="text-[11px] font-black tracking-wide">{idx + 1 < qs.length ? "Próximo" : "Resultado"}</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9. SCORED QUIZ (points per question, mixed format)
// ═══════════════════════════════════════════════════════════════════════════════

interface ScoredQ {
  type: "mcq" | "tf" | "fitb" | "picture";
  points: number;
  data: any;
}

const SCORED_POOL: ScoredQ[] = [
  { type: "mcq", points: 10, data: { q: "What is 'train' in European Portuguese?", options: ["Trem", "Comboio", "Metro", "Autocarro"], correct: "Comboio" } },
  { type: "tf", points: 5, data: { statement: "In European Portuguese, 'autocarro' means bus.", answer: true } },
  { type: "picture", points: 15, data: { emoji: "🐟", answer: "Peixe", options: ["Peixe", "Carne", "Frango", "Ovo"], english: "Fish" } },
  { type: "fitb", points: 10, data: { before: "Boa", blank: "___", after: "!", answer: "tarde", sentence: "Boa tarde!", english: "Good afternoon!", options: ["tarde", "noite", "dia", "manhã"] } },
  { type: "mcq", points: 10, data: { q: "What is 'juice' in European Portuguese?", options: ["Suco", "Sumo", "Bebida", "Água"], correct: "Sumo" } },
  { type: "tf", points: 5, data: { statement: "'Obrigada' is the correct form for a woman to say thank you.", answer: true } },
  { type: "picture", points: 15, data: { emoji: "🚌", answer: "Autocarro", options: ["Autocarro", "Comboio", "Táxi", "Barco"], english: "Bus" } },
  { type: "fitb", points: 10, data: { before: "De", blank: "___", after: ".", answer: "nada", sentence: "De nada.", english: "You're welcome.", options: ["nada", "vez", "novo", "mais"] } },
  { type: "mcq", points: 10, data: { q: "How do you say 'ice cream' in European Portuguese?", options: ["Sorvete", "Gelado", "Doce", "Bolo"], correct: "Gelado" } },
  { type: "tf", points: 5, data: { statement: "'Obrigado' is said by women.", answer: false } },
];

function ScoredChallenge({ onBack }: { onBack: () => void }) {
  const [qs] = useState(() => shuffle(SCORED_POOL).slice(0, 8));
  const [idx, setIdx] = useState(0);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [gotWrong, setGotWrong] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [done, setDone] = useState(false);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  const { playCorrect, playWrong } = useSound();
  const { speak, speakSlow } = useSpeech();
  const { carActive, triggerCar } = useCarAnimation();
  const color = HUB_COLORS.scored.text;
  const maxPoints = qs.reduce((s, q) => s + q.points, 0);
  const correctRef = useRef<string[]>([]);
  const wrongRef = useRef<string[]>([]);

  const handleAnswer = (val: string | boolean) => {
    if (answeredCorrectly || attempts >= 3) return;
    const q = qs[idx];
    let isCorrect = false;
    if (q.type === "tf") isCorrect = val === q.data.answer;
    else isCorrect = val === (q.data.correct || q.data.answer);
    const word = String(q.data.correct || q.data.answer || q.data.sentence || "");
    if (isCorrect) {
      setAnsweredCorrectly(true);
      setTotalScore(s => s + q.points);
      setPointsEarned(q.points);
      playCorrect();
      triggerCar();
      if (!gotWrong) correctRef.current.push(word);
      if (q.type === "picture" || q.type === "fitb") speak(q.data.answer || q.data.sentence);
    } else {
      if (!gotWrong) { wrongRef.current.push(word); setGotWrong(true); }
      playWrong();
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShaking(true);
      if (newAttempts < 3) speak("tente novamente");
    }
  };

  const next = () => {
    if (idx + 1 >= qs.length) { mergeProficiency("quiz-hub", correctRef.current, wrongRef.current); setDone(true); return; }
    setIdx(i => i + 1);
    setAnsweredCorrectly(false);
    setGotWrong(false);
    setShaking(false);
    setPointsEarned(null);
    setAttempts(0);
  };

  if (done) {
    const pct = Math.round((totalScore / maxPoints) * 100);
    const emoji = pct === 100 ? "🏆" : pct >= 70 ? "🌟" : pct >= 50 ? "😊" : "💪";
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
        style={{ background: `linear-gradient(135deg, ${HUB_COLORS.scored.bg}, #fff)` }}>
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 max-w-sm w-full text-center">
          <div className="text-6xl mb-4">{emoji}</div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">Scored Challenge Complete!</h2>
          <p className="text-sm text-slate-400 mb-6">{pct >= 70 ? "Excellent performance!" : "Keep practising to boost your score!"}</p>
          <div className="text-5xl font-extrabold mb-1" style={{ color }}>{totalScore}</div>
          <div className="text-sm text-slate-400 mb-1">out of {maxPoints} points</div>
          <div className="text-xs text-slate-400 mb-6">{pct}% efficiency</div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-8">
            <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
          </div>
          <button onClick={onBack} className="w-full py-3.5 rounded-3xl text-white font-bold text-sm"
            style={{ backgroundColor: color }}>
            Back to Quiz Hub
          </button>
        </div>
      </div>
    );
  }

  const q = qs[idx];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${HUB_COLORS.scored.bg}, #fff)` }}>
      <PortugueseCarAnimation active={carActive} />
      <QuizHeader title="🏆 Scored Challenge" onBack={onBack} progress={idx + 1} total={qs.length} color={color} />
      <main className="flex-1 flex flex-col px-4 py-5 max-w-lg mx-auto w-full gap-4">

        {/* Score + points badge */}
        <div className="flex items-center justify-between">
          <div className="px-4 py-2 rounded-2xl text-sm font-bold"
            style={{ backgroundColor: HUB_COLORS.scored.bg, border: `1px solid ${HUB_COLORS.scored.border}`, color }}>
            Score: {totalScore} pts
          </div>
          <div className="px-4 py-2 rounded-2xl text-sm font-bold bg-white border border-slate-200 text-slate-600">
            Worth: {q.points} pts
          </div>
        </div>

        {/* Question card */}
        {(() => {
          const sLocked = answeredCorrectly || attempts >= 3;
          return (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 text-center relative">
              <button onClick={() => {
                if (q.type === "picture") speakSlow(q.data.answer);
                else if (q.type === "mcq") speakSlow(q.data.q);
                else if (q.type === "tf") speakSlow(q.data.statement);
                else if (q.type === "fitb") speakSlow(`${q.data.before} ${q.data.answer} ${q.data.after}`);
              }} className="absolute top-4 right-4 p-2 rounded-full active:opacity-60 hover:bg-slate-100" style={{ color: "#64748B" }}><Volume2 size={20} /></button>
              {q.type === "picture" && (
                <>
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-4">Name this in Portuguese</p>
                  <div className="text-8xl mb-2 leading-none">{q.data.emoji}</div>
                  <p className="text-sm text-slate-400 italic mt-2">{q.data.english}</p>
                </>
              )}
              {q.type === "mcq" && (
                <>
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Choose the correct answer</p>
                  <p className="text-lg font-bold text-slate-800 text-left">{q.data.q}</p>
                </>
              )}
              {q.type === "tf" && (
                <>
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">True or false?</p>
                  <p className="text-lg font-bold text-slate-800 text-left">{q.data.statement}</p>
                </>
              )}
              {q.type === "fitb" && (
                <>
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">{q.data.english}</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {q.data.before}{" "}
                    <span className="inline-block px-3 py-0.5 rounded-xl border-2 min-w-[80px]"
                      style={{
                        borderColor: sLocked ? (answeredCorrectly ? PT.green : PT.red) : color,
                        backgroundColor: sLocked ? (answeredCorrectly ? PT.greenBg : PT.redBg) : `${color}12`,
                        color: sLocked ? (answeredCorrectly ? PT.green : PT.red) : color,
                      }}>
                      {sLocked ? String(q.data.answer) : "___"}
                    </span>
                    {" "}{q.data.after}
                  </p>
                </>
              )}
            </div>
          );
        })()}

        {/* Points earned feedback (correct only) */}
        {answeredCorrectly && pointsEarned !== null && (
          <div className="rounded-2xl px-4 py-2.5 text-center font-bold text-sm"
            style={{ backgroundColor: PT.greenBg, color: PT.green, border: `1px solid ${PT.green}` }}>
            Muito bem! +{pointsEarned} points! ✓
          </div>
        )}
        {!answeredCorrectly && attempts >= 3 && (
          <div className="rounded-2xl px-4 py-3 text-sm text-center"
            style={{ backgroundColor: PT.redBg, border: `1px solid ${PT.red}`, color: PT.red }}>
            <p className="font-bold">3 tentativas esgotadas</p>
            <p className="text-xs mt-0.5 text-slate-600">A resposta certa era: <strong>{String(q.data.correct || q.data.answer)}</strong></p>
          </div>
        )}

        {/* Answer options — shake on wrong */}
        {(() => {
          const sLocked = answeredCorrectly || attempts >= 3;
          return q.type === "tf" ? (
            <div className={`grid grid-cols-2 gap-3 ${shaking ? "animate-shake" : ""}`} onAnimationEnd={() => setShaking(false)}>
              {[true, false].map(val => {
                let style: React.CSSProperties = { border: "2px solid #e2e8f0", color: "#334155" };
                if (sLocked) {
                  if (val === q.data.answer) style = { border: `2px solid ${PT.green}`, backgroundColor: PT.greenBg, color: PT.green };
                  else style = { border: "2px solid #e2e8f0", color: "#94a3b8", opacity: 0.5 };
                }
                return (
                  <button key={String(val)} onClick={() => handleAnswer(val)} disabled={sLocked}
                    className="py-5 rounded-3xl bg-white font-black text-lg transition-all active:scale-[0.97]"
                    style={style}>
                    {val ? "✅ True" : "❌ False"}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className={`${q.type === "picture" || q.type === "fitb" ? "grid grid-cols-2 gap-2.5" : "space-y-2.5"} ${shaking ? "animate-shake" : ""}`}
              onAnimationEnd={() => setShaking(false)}>
              {(q.data.options as string[]).map((opt: string) => {
                const correctAns = q.data.correct || q.data.answer;
                if (q.type === "picture" || q.type === "fitb") {
                  let style: React.CSSProperties = { border: "2px solid #e2e8f0", color: "#334155" };
                  if (sLocked) {
                    if (opt === correctAns) style = { border: `2px solid ${PT.green}`, backgroundColor: PT.greenBg, color: PT.green };
                    else style = { border: "2px solid #e2e8f0", color: "#94a3b8", opacity: 0.35 };
                  }
                  return (
                    <button key={opt} onClick={() => handleAnswer(opt)} disabled={sLocked}
                      className="py-4 rounded-3xl bg-white font-bold text-sm transition-all active:scale-[0.97]"
                      style={style}>
                      {opt}
                    </button>
                  );
                }
                return (
                  <ChoiceBtn key={opt} label={opt} selected={false} correct={opt === correctAns}
                    onChoose={() => handleAnswer(opt)} disabled={sLocked} />
                );
              })}
            </div>
          );
        })()}

        {(answeredCorrectly || attempts >= 3) && (
          <div className="flex justify-end pt-2">
            <button onClick={next}
              className="w-24 h-24 rounded-full font-bold text-white flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all"
              style={{ backgroundColor: answeredCorrectly ? color : "#94A3B8", boxShadow: `0 8px 24px ${answeredCorrectly ? color : "#94A3B8"}55` }}>
              <span className="text-2xl leading-none">›</span>
              <span className="text-[11px] font-black tracking-wide">{idx + 1 < qs.length ? "Próximo" : "Resultado"}</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 10. ORDERING / SEQUENCE QUIZ
// ═══════════════════════════════════════════════════════════════════════════════

const ORDERING_DATA = [
  {
    instruction: "Tap the numbers in order: 1 → 5",
    items: ["três", "um", "cinco", "dois", "quatro"],
    correct: ["um", "dois", "três", "quatro", "cinco"],
    explanation: "um (1) · dois (2) · três (3) · quatro (4) · cinco (5)",
  },
  {
    instruction: "Tap the numbers in order: 6 → 10",
    items: ["oito", "dez", "seis", "nove", "sete"],
    correct: ["seis", "sete", "oito", "nove", "dez"],
    explanation: "seis (6) · sete (7) · oito (8) · nove (9) · dez (10)",
  },
  {
    instruction: "Put the greetings in order: morning → afternoon → night",
    items: ["Boa noite", "Boa tarde", "Bom dia"],
    correct: ["Bom dia", "Boa tarde", "Boa noite"],
    explanation: "Bom dia = morning · Boa tarde = afternoon · Boa noite = evening/night",
  },
  {
    instruction: "Order the days: Monday → Wednesday → Friday",
    items: ["Quarta-feira", "Segunda-feira", "Sexta-feira"],
    correct: ["Segunda-feira", "Quarta-feira", "Sexta-feira"],
    explanation: "Segunda = Mon · Terça = Tue · Quarta = Wed · Quinta = Thu · Sexta = Fri",
  },
  {
    instruction: "Order the days of the weekend: Friday → Saturday → Sunday",
    items: ["Domingo", "Sábado", "Sexta-feira"],
    correct: ["Sexta-feira", "Sábado", "Domingo"],
    explanation: "Sexta-feira (Fri) · Sábado (Sat) · Domingo (Sun)",
  },
  {
    instruction: "Put these greetings in order: morning → afternoon → evening",
    items: ["Boa noite", "Bom dia", "Boa tarde"],
    correct: ["Bom dia", "Boa tarde", "Boa noite"],
    explanation: "Bom dia (morning) → Boa tarde (afternoon) → Boa noite (evening/night).",
  },
  {
    instruction: "Put these months in calendar order",
    items: ["Março", "Janeiro", "Maio", "Fevereiro", "Abril"],
    correct: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio"],
    explanation: "Janeiro (Jan) · Fevereiro (Feb) · Março (Mar) · Abril (Apr) · Maio (May)",
  },
  {
    instruction: "Order these meals by time of day: earliest first",
    items: ["Jantar", "Almoço", "Pequeno-almoço"],
    correct: ["Pequeno-almoço", "Almoço", "Jantar"],
    explanation: "Pequeno-almoço = breakfast · Almoço = lunch · Jantar = dinner",
  },
  {
    instruction: "Put these numbers in order: smallest → largest",
    items: ["quinze", "onze", "treze", "dezassete", "doze"],
    correct: ["onze", "doze", "treze", "quinze", "dezassete"],
    explanation: "onze (11) · doze (12) · treze (13) · quinze (15) · dezassete (17)",
  },
  {
    instruction: "Order these phrases from informal → formal",
    items: ["Tchau", "Até logo", "Adeus"],
    correct: ["Tchau", "Até logo", "Adeus"],
    explanation: "'Tchau' is casual. 'Até logo' is neutral (see you later). 'Adeus' is the most final and formal farewell.",
  },
  {
    instruction: "Arrange the seasons in Portugal: winter → spring → summer → autumn",
    items: ["Outono", "Verão", "Primavera", "Inverno"],
    correct: ["Inverno", "Primavera", "Verão", "Outono"],
    explanation: "Inverno (Winter) · Primavera (Spring) · Verão (Summer) · Outono (Autumn)",
  },
  {
    instruction: "Put the sentence in the right order: 'I speak Portuguese'",
    items: ["português", "falo", "Eu"],
    correct: ["Eu", "falo", "português"],
    explanation: "Eu (I) + falo (speak) + português. Portuguese follows a Subject-Verb-Object order.",
  },
];

function OrderingQuiz({ onBack }: { onBack: () => void }) {
  const [qs] = useState(() => shuffle(ORDERING_DATA).slice(0, 7));
  const [idx, setIdx] = useState(0);
  const [pool, setPool] = useState<string[]>(() => shuffle([...qs[0].items]));
  const [chosen, setChosen] = useState<string[]>([]);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [gotWrong, setGotWrong] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const { playCorrect, playWrong } = useSound();
  const { speak, speakSlow } = useSpeech();
  const { carActive, triggerCar } = useCarAnimation();
  const color = HUB_COLORS.ordering.text;
  const correctRef = useRef<string[]>([]);
  const wrongRef = useRef<string[]>([]);

  const reset = useCallback((i: number) => {
    setPool(shuffle([...qs[i].items]));
    setChosen([]);
    setAnsweredCorrectly(false);
    setGotWrong(false);
    setShaking(false);
    setAttempts(0);
  }, [qs]);

  const locked = answeredCorrectly || attempts >= 3;

  const pickItem = (item: string, fromIdx: number) => {
    if (locked) return;
    setPool(p => p.filter((_, i) => i !== fromIdx));
    setChosen(c => [...c, item]);
  };

  const removeItem = (item: string, fromIdx: number) => {
    if (locked) return;
    setChosen(c => c.filter((_, i) => i !== fromIdx));
    setPool(p => [...p, item]);
  };

  const checkAnswer = () => {
    const isCorrect = chosen.join("|||") === qs[idx].correct.join("|||");
    if (isCorrect) {
      setAnsweredCorrectly(true);
      setScore(s => s + 1);
      playCorrect();
      triggerCar();
      if (!gotWrong) qs[idx].correct.forEach(w => correctRef.current.push(w));
    } else {
      if (!gotWrong) { qs[idx].correct.forEach(w => wrongRef.current.push(w)); setGotWrong(true); }
      playWrong();
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShaking(true);
      if (newAttempts < 3) speak("tente novamente");
    }
  };

  const next = () => {
    if (idx + 1 >= qs.length) { mergeProficiency("quiz-hub", correctRef.current, wrongRef.current); setDone(true); return; }
    const ni = idx + 1;
    setIdx(ni);
    reset(ni);
  };

  if (done) return <ResultCard score={score} total={qs.length} onBack={onBack} title="Ordering Complete!" color={color} />;

  const q = qs[idx];
  const allPicked = chosen.length === q.items.length;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${HUB_COLORS.ordering.bg}, #fff)` }}>
      <PortugueseCarAnimation active={carActive} />
      <QuizHeader title="🔢 Put in Order" onBack={onBack} progress={idx + 1} total={qs.length} color={color} />
      <main className="flex-1 flex flex-col px-4 py-5 max-w-lg mx-auto w-full gap-4">

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Put in order</p>
          <div className="flex items-start gap-2">
            <p className="text-base font-bold text-slate-800 leading-snug flex-1">{q.instruction}</p>
            <button onClick={() => speakSlow(q.correct.join(", "))} className="shrink-0 p-2 rounded-full active:opacity-60 hover:bg-slate-100" style={{ color: "#64748B" }}><Volume2 size={20} /></button>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-2 px-1">Your sequence</p>
          <div className={`min-h-[52px] bg-white rounded-2xl border-2 border-dashed p-2 flex flex-wrap gap-2 items-center ${shaking ? "animate-shake" : ""}`}
            style={{ borderColor: locked ? (answeredCorrectly ? PT.green : PT.red) : "#cbd5e1" }}
            onAnimationEnd={() => setShaking(false)}>
            {chosen.length === 0 && (
              <p className="text-slate-300 text-sm pl-1">Tap items below to place them here</p>
            )}
            {chosen.map((item, i) => (
              <button key={i} onClick={() => removeItem(item, i)} disabled={locked}
                className="px-3 py-1.5 rounded-xl font-bold text-sm transition-all active:scale-[0.95]"
                style={{ backgroundColor: locked ? (answeredCorrectly ? PT.greenBg : PT.redBg) : "#EFF6FF", color: locked ? (answeredCorrectly ? PT.green : PT.red) : "#2563eb", border: `1.5px solid ${locked ? (answeredCorrectly ? PT.green : PT.red) : "#BFDBFE"}` }}>
                {item}
              </button>
            ))}
          </div>
        </div>

        {!locked && (
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-2 px-1">Available</p>
            <div className="flex flex-wrap gap-2">
              {pool.map((item, i) => (
                <button key={i} onClick={() => pickItem(item, i)}
                  className="px-3 py-1.5 rounded-xl font-bold text-sm bg-white border-2 transition-all active:scale-[0.95]"
                  style={{ borderColor: "#e2e8f0", color: "#475569" }}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {allPicked && !locked && (
          <button onClick={checkAnswer} className="w-full py-4 rounded-3xl font-bold text-white text-sm"
            style={{ backgroundColor: color }}>
            Check Order ✓
          </button>
        )}

        {answeredCorrectly && (
          <div className="rounded-2xl px-4 py-3 text-sm text-center"
            style={{ backgroundColor: PT.greenBg, border: `1px solid ${PT.green}`, color: PT.green }}>
            <p className="font-bold text-base">Muito bem! ✓</p>
            <p className="text-slate-600 text-xs mt-1">{q.explanation}</p>
          </div>
        )}
        {!answeredCorrectly && attempts >= 3 && (
          <div className="rounded-2xl px-4 py-3 text-sm text-center"
            style={{ backgroundColor: PT.redBg, border: `1px solid ${PT.red}`, color: PT.red }}>
            <p className="font-bold">3 tentativas esgotadas</p>
            <p className="text-xs mt-0.5 text-slate-600">A ordem certa era: <strong>{q.correct.join(" → ")}</strong></p>
          </div>
        )}

        {locked && (
          <div className="flex justify-end pt-2">
            <button onClick={next}
              className="w-24 h-24 rounded-full font-bold text-white flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all"
              style={{ backgroundColor: answeredCorrectly ? color : "#94A3B8", boxShadow: `0 8px 24px ${answeredCorrectly ? color : "#94A3B8"}55` }}>
              <span className="text-2xl leading-none">›</span>
              <span className="text-[11px] font-black tracking-wide">{idx + 1 < qs.length ? "Próximo" : "Resultado"}</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 11. FILL THE GAP — Tap a word chip to place it in the sentence slot
// ═══════════════════════════════════════════════════════════════════════════════

// sentence[0] + [SLOT] + sentence[1] rendered inline.
// Options are shuffled each game; auto-checks when placed.
const GAP_DATA: { sentence: [string, string]; blank: string; options: string[]; explanation: string }[] = [
  {
    sentence: ["Ele ", " para o trabalho de autocarro todos os dias."],
    blank: "vai",
    options: ["vai", "vais", "vão", "fui"],
    explanation: "'Vai' is the third-person singular of ir (to go). 'Vais' is second person, 'vão' is plural, 'fui' is past tense.",
  },
  {
    sentence: ["Ela ", " professora de português em Lisboa."],
    blank: "é",
    options: ["é", "está", "ser", "tem"],
    explanation: "'Ser' (é) is used for permanent roles like professions. 'Está' is for temporary states — wrong here.",
  },
  {
    sentence: ["Eu ", " muito cansado depois do trabalho."],
    blank: "estou",
    options: ["estou", "sou", "tenho", "fico"],
    explanation: "Temporary states like tiredness use 'estar' → 'estou'. 'Sou' (ser) is for permanent identity, not how you feel right now.",
  },
  {
    sentence: ["Faz ", ", pode trazer a conta?"],
    blank: "favor",
    options: ["favor", "obrigado", "muito", "bem"],
    explanation: "'Faz favor' is the European Portuguese way to say 'please' when addressing someone. It's more natural than 'por favor' in Portugal.",
  },
  {
    sentence: ["O comboio ", " às dez e meia da manhã."],
    blank: "parte",
    options: ["parte", "vai", "sai", "anda"],
    explanation: "'Partir' (parte) means to depart and is the standard verb used with trains and planes in European Portuguese.",
  },
  {
    sentence: ["A casa de ", " fica no primeiro andar."],
    blank: "banho",
    options: ["banho", "jantar", "dormir", "campo"],
    explanation: "'Casa de banho' is the European Portuguese term for bathroom. In Brazil they say 'banheiro'.",
  },
  {
    sentence: ["O museu ", " às dez da manhã e fecha às dezoito."],
    blank: "abre",
    options: ["abre", "entra", "começa", "inicia"],
    explanation: "'Abrir' (abre) is the correct verb for a museum opening its doors. 'Entra' means to enter — a different meaning.",
  },
  {
    sentence: ["Tenho muita ", "! Vamos almoçar?"],
    blank: "fome",
    options: ["fome", "sede", "calor", "sorte"],
    explanation: "'Fome' means hunger. 'Sede' = thirst, 'calor' = heat, 'sorte' = luck — all follow 'muita' but wrong in context.",
  },
  {
    sentence: ["O comboio ", " às oito horas."],
    blank: "parte",
    options: ["parte", "chega", "fica", "vai"],
    explanation: "'Parte' comes from the verb 'partir' (to depart). 'O comboio parte' = the train departs.",
  },
  {
    sentence: ["Queres ", " um café comigo?"],
    blank: "tomar",
    options: ["tomar", "beber", "comer", "fazer"],
    explanation: "In Portugal you 'tomar um café' (take a coffee), not 'beber'. 'Tomar' is the standard collocation for coffee in EP.",
  },
  {
    sentence: ["O pequeno-almoço ", " às oito na sala de jantar."],
    blank: "é servido",
    options: ["é servido", "serve", "servindo", "está servido"],
    explanation: "'É servido' is the passive voice — breakfast is served. 'Serve' would need a subject. 'Servindo' is a gerund (Brazilian style).",
  },
  {
    sentence: ["Ele ", " português desde criança."],
    blank: "fala",
    options: ["fala", "falar", "falando", "falou"],
    explanation: "'Fala' is the present tense third-person singular. 'Falar' is the infinitive, 'falando' is the gerund, 'falou' is past.",
  },
];

function FillGapQuiz({ onBack }: { onBack: () => void }) {
  const [qs] = useState(() =>
    shuffle(GAP_DATA).slice(0, 8).map(q => ({ ...q, options: shuffle([...q.options]) }))
  );
  const [idx, setIdx] = useState(0);
  const [placed, setPlaced] = useState<string | null>(null);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [gotWrong, setGotWrong] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const { playCorrect, playWrong } = useSound();
  const { speak, speakSlow } = useSpeech();
  const { carActive, triggerCar } = useCarAnimation();
  const color = "#0284C7";
  const bg = "#F0F9FF";
  const correctRef = useRef<string[]>([]);
  const wrongRef = useRef<string[]>([]);

  const q = qs[idx];
  const locked = answeredCorrectly || attempts >= 3;

  useEffect(() => {
    if (placed === null || answeredCorrectly || attempts >= 3) return;
    const t = setTimeout(() => {
      const correct = placed === q.blank;
      if (correct) {
        setAnsweredCorrectly(true);
        setScore(s => s + 1);
        playCorrect();
        triggerCar();
        if (!gotWrong) correctRef.current.push(q.blank);
      } else {
        if (!gotWrong) { wrongRef.current.push(q.blank); setGotWrong(true); }
        playWrong();
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setShaking(true);
        setPlaced(null);
        if (newAttempts < 3) speak("tente novamente");
      }
    }, 350);
    return () => clearTimeout(t);
  }, [placed, answeredCorrectly, q.blank, gotWrong, attempts]);

  const pick = (word: string) => {
    if (locked) return;
    setPlaced(prev => (prev === word ? null : word));
  };

  const next = () => {
    if (idx + 1 >= qs.length) { mergeProficiency("quiz-hub", correctRef.current, wrongRef.current); setDone(true); return; }
    setIdx(i => i + 1);
    setPlaced(null);
    setAnsweredCorrectly(false);
    setGotWrong(false);
    setShaking(false);
    setAttempts(0);
  };

  if (done) return <ResultCard score={score} total={qs.length} onBack={onBack} title="Fill the Gap — Done!" color={color} />;

  const slotStyle: React.CSSProperties = locked
    ? { border: `2px solid ${answeredCorrectly ? PT.green : PT.red}`, backgroundColor: answeredCorrectly ? PT.greenBg : PT.redBg, color: answeredCorrectly ? PT.green : PT.red }
    : placed
    ? { border: `2px solid ${color}`, backgroundColor: "#DBEAFE", color }
    : { border: `2.5px dashed #94A3B8`, backgroundColor: "#F8FAFC", color: "#94A3B8" };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${bg}, #fff)` }}>
      <PortugueseCarAnimation active={carActive} />
      <QuizHeader title="🗂️ Fill the Gap" onBack={onBack} progress={idx + 1} total={qs.length} color={color} />
      <main className="flex-1 flex flex-col px-4 py-5 max-w-lg mx-auto w-full gap-5">

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-start gap-2 mb-4">
            <p className="text-xs uppercase tracking-widest text-slate-400 flex-1">Place the correct word</p>
            <button onClick={() => speakSlow(`${q.sentence[0]} ${q.blank} ${q.sentence[1]}`)} className="shrink-0 p-2 rounded-full active:opacity-60 hover:bg-slate-100" style={{ color: "#64748B" }}><Volume2 size={20} /></button>
          </div>
          <p className="text-lg font-semibold text-slate-800 leading-loose flex flex-wrap items-center gap-1">
            <span>{q.sentence[0]}</span>
            <span
              className="inline-flex items-center justify-center rounded-xl px-3 py-1.5 font-bold text-sm min-w-[90px] cursor-pointer transition-all"
              style={slotStyle}
              onClick={() => { if (!locked && placed) setPlaced(null); }}
            >
              {locked
                ? <>{q.blank} {answeredCorrectly && "✓"}</>
                : placed
                ? <>{placed}</>
                : <span className="text-slate-300 tracking-widest">_ _ _</span>
              }
            </span>
            <span>{q.sentence[1]}</span>
          </p>
        </div>

        {!locked && (
          <div>
            <p className="text-xs text-slate-400 text-center mb-3 uppercase tracking-wider">Word Bank — tap to place</p>
            <div className={`flex flex-wrap gap-2.5 justify-center ${shaking ? "animate-shake" : ""}`} onAnimationEnd={() => setShaking(false)}>
              {q.options.map(opt => {
                const isPlaced = placed === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => pick(opt)}
                    disabled={!!placed && !isPlaced}
                    className="px-4 py-2.5 rounded-2xl font-semibold text-sm transition-all active:scale-95"
                    style={
                      isPlaced
                        ? { backgroundColor: "#DBEAFE", border: `2px solid ${color}`, color, opacity: 0 }
                        : { backgroundColor: "#EFF6FF", border: `2px solid ${color}22`, color }
                    }
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {answeredCorrectly && (
          <div className="rounded-2xl px-4 py-3 text-sm text-center"
            style={{ backgroundColor: PT.greenBg, border: `1px solid ${PT.green}`, color: PT.green }}>
            <p className="font-bold text-base">Muito bem! ✓</p>
            <p className="text-slate-600 text-xs mt-1">{q.explanation}</p>
          </div>
        )}
        {!answeredCorrectly && attempts >= 3 && (
          <div className="rounded-2xl px-4 py-3 text-sm text-center"
            style={{ backgroundColor: PT.redBg, border: `1px solid ${PT.red}`, color: PT.red }}>
            <p className="font-bold">3 tentativas esgotadas</p>
            <p className="text-xs mt-0.5 text-slate-600">A resposta certa era: <strong>{q.blank}</strong></p>
          </div>
        )}

        {locked && (
          <div className="flex justify-end pt-2">
            <button onClick={next}
              className="w-24 h-24 rounded-full font-bold text-white flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all"
              style={{ backgroundColor: answeredCorrectly ? color : "#94A3B8", boxShadow: `0 8px 24px ${answeredCorrectly ? color : "#94A3B8"}55` }}>
              <span className="text-2xl leading-none">›</span>
              <span className="text-[11px] font-black tracking-wide">{idx + 1 < qs.length ? "Próximo" : "Resultado"}</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 12. MULTIPLE RESPONSE QUIZ — Select ALL correct answers
// ═══════════════════════════════════════════════════════════════════════════════

// Each question has 4-5 options; 'correct' lists the exact strings that are right.
// Options are shuffled fresh every game to avoid pattern recognition.
const MR_DATA = [
  {
    q: "Which of these are European Portuguese words for public transport?",
    options: ["autocarro", "comboio", "metro", "trem", "ônibus"],
    correct: ["autocarro", "comboio", "metro"],
    explanation: "In Portugal: autocarro (bus), comboio (train), metro (subway). Trem and ônibus are the Brazilian equivalents.",
  },
  {
    q: "Which of these are ways to say goodbye in Portuguese?",
    options: ["Adeus", "Tchau", "Até logo", "Olá", "Bom dia"],
    correct: ["Adeus", "Tchau", "Até logo"],
    explanation: "Adeus = farewell, Tchau = bye (casual), Até logo = see you soon. Olá and Bom dia are greetings, not farewells.",
  },
  {
    q: "Which of these are traditional Portuguese foods?",
    options: ["Bacalhau", "Pastel de nata", "Sardinhas assadas", "Brigadeiro", "Tacos"],
    correct: ["Bacalhau", "Pastel de nata", "Sardinhas assadas"],
    explanation: "Bacalhau (salted cod), Pastel de nata (custard tart), and grilled sardines are all iconic Portuguese dishes. Brigadeiro is Brazilian; tacos are Mexican.",
  },
  {
    q: "Which of these are correct forms of 'thank you' in Portuguese?",
    options: ["Obrigado", "Obrigada", "Obrigados", "De nada", "Por favor"],
    correct: ["Obrigado", "Obrigada", "Obrigados"],
    explanation: "Obrigado (male speaker), Obrigada (female speaker), Obrigados (group). De nada = you're welcome. Por favor = please.",
  },
  {
    q: "Which of these countries have Portuguese as an official language?",
    options: ["Brasil", "Angola", "Portugal", "Espanha", "França"],
    correct: ["Brasil", "Angola", "Portugal"],
    explanation: "Portuguese is the official language in Brazil, Angola, Portugal, and several other countries. Spain speaks Spanish, France speaks French.",
  },
  {
    q: "Which of these are weekdays (working days) in Portuguese?",
    options: ["Segunda-feira", "Sábado", "Quarta-feira", "Domingo", "Sexta-feira"],
    correct: ["Segunda-feira", "Quarta-feira", "Sexta-feira"],
    explanation: "Segunda-feira (Mon), Quarta-feira (Wed), Sexta-feira (Fri) are weekdays. Sábado (Sat) and Domingo (Sun) are the weekend.",
  },
  {
    q: "Which of these numbers are even in Portuguese?",
    options: ["dois", "três", "quatro", "cinco", "seis"],
    correct: ["dois", "quatro", "seis"],
    explanation: "Dois (2), quatro (4) and seis (6) are even. Três (3) and cinco (5) are odd.",
  },
  {
    q: "Which of these words are colours in Portuguese?",
    options: ["azul", "verde", "rápido", "vermelho", "sempre"],
    correct: ["azul", "verde", "vermelho"],
    explanation: "Azul (blue), verde (green), vermelho (red) are colours. Rápido means fast and sempre means always.",
  },
  {
    q: "Which of these are correct greetings in Portugal?",
    options: ["Bom dia", "Boa tarde", "Boa noite", "Bom noite", "Boa dia"],
    correct: ["Bom dia", "Boa tarde", "Boa noite"],
    explanation: "Bom dia (morning), Boa tarde (afternoon), Boa noite (evening) are all correct. 'Bom noite' and 'Boa dia' have wrong gender agreement — a common mistake.",
  },
  {
    q: "Which of these are seasons (estações) in Portuguese?",
    options: ["Inverno", "Outono", "Azul", "Verão", "Amanhã"],
    correct: ["Inverno", "Outono", "Verão"],
    explanation: "Inverno (winter), Outono (autumn), Verão (summer) are seasons. Azul means blue and Amanhã means tomorrow.",
  },
  {
    q: "Which of these are ways to say goodbye in European Portuguese?",
    options: ["Até logo", "Tchau", "Adeus", "Olá", "Bom dia"],
    correct: ["Até logo", "Tchau", "Adeus"],
    explanation: "'Até logo' (see you soon), 'Tchau' (bye) and 'Adeus' (farewell) are all goodbyes. 'Olá' and 'Bom dia' are greetings.",
  },
  {
    q: "Which of these sentences are in correct European Portuguese?",
    options: ["Estou a comer", "Estou comendo", "Onde fica a casa de banho?", "Onde é o banheiro?", "Não percebo"],
    correct: ["Estou a comer", "Onde fica a casa de banho?", "Não percebo"],
    explanation: "'Estou a comer' (EP present continuous), 'casa de banho' (EP for bathroom), and 'Não percebo' (EP for I don't understand) are all European Portuguese. The others are Brazilian.",
  },
];

function MultiResponseQuiz({ onBack }: { onBack: () => void }) {
  const [qs] = useState(() => shuffle(MR_DATA).slice(0, 8).map(q => ({ ...q, options: shuffle([...q.options]) })));
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [gotWrong, setGotWrong] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const { playCorrect, playWrong } = useSound();
  const { speak, speakSlow } = useSpeech();
  const { carActive, triggerCar } = useCarAnimation();
  const color = HUB_COLORS.multiresponse.text;
  const borderColor = "#6366F1";
  const correctRef = useRef<string[]>([]);
  const wrongRef = useRef<string[]>([]);

  const locked = answeredCorrectly || attempts >= 3;

  const toggle = (opt: string) => {
    if (locked) return;
    setSelected(prev => {
      const next = new Set(prev);
      next.has(opt) ? next.delete(opt) : next.add(opt);
      return next;
    });
  };

  const checkAnswer = () => {
    const q = qs[idx];
    const correctSet = new Set(q.correct);
    const allCorrectPicked = q.correct.every(c => selected.has(c));
    const noWrongPicked = [...selected].every(s => correctSet.has(s));
    const perfect = allCorrectPicked && noWrongPicked;
    if (perfect) {
      setAnsweredCorrectly(true);
      setScore(s => s + 1);
      playCorrect();
      triggerCar();
      if (!gotWrong) q.correct.forEach(w => correctRef.current.push(w));
    } else {
      if (!gotWrong) { q.correct.forEach(w => wrongRef.current.push(w)); setGotWrong(true); }
      playWrong();
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShaking(true);
      if (newAttempts < 3) speak("tente novamente");
    }
  };

  const next = () => {
    if (idx + 1 >= qs.length) { mergeProficiency("quiz-hub", correctRef.current, wrongRef.current); setDone(true); return; }
    setIdx(i => i + 1);
    setSelected(new Set());
    setAnsweredCorrectly(false);
    setGotWrong(false);
    setShaking(false);
    setAttempts(0);
  };

  if (done) return <ResultCard score={score} total={qs.length} onBack={onBack} title="Multi-Select Complete!" color={color} />;

  const q = qs[idx];
  const correctSet = new Set(q.correct);

  const getOptionStyle = (opt: string): React.CSSProperties => {
    if (!locked) {
      return selected.has(opt)
        ? { border: `2px solid ${borderColor}`, backgroundColor: "#EEF2FF", color }
        : { border: "2px solid #e2e8f0", color: "#334155" };
    }
    if (correctSet.has(opt)) return { border: `2px solid ${PT.green}`, backgroundColor: PT.greenBg, color: PT.green };
    return { border: "2px solid #e2e8f0", color: "#94a3b8", opacity: 0.35 };
  };

  const getOptionIcon = (opt: string) => {
    if (!locked) return selected.has(opt) ? "☑" : "☐";
    return correctSet.has(opt) ? "✓" : "☐";
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${HUB_COLORS.multiresponse.bg}, #fff)` }}>
      <PortugueseCarAnimation active={carActive} />
      <QuizHeader title="☑ Multi-Select" onBack={onBack} progress={idx + 1} total={qs.length} color={color} />
      <main className="flex-1 flex flex-col px-4 py-5 max-w-lg mx-auto w-full gap-4">

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Select ALL correct answers</p>
          <div className="flex items-start gap-2">
            <p className="text-lg font-bold text-slate-800 leading-snug flex-1">{q.q}</p>
            <button onClick={() => speakSlow(q.q)} className="shrink-0 p-2 rounded-full active:opacity-60 hover:bg-slate-100" style={{ color: "#64748B" }}><Volume2 size={20} /></button>
          </div>
        </div>

        <div className={`space-y-2.5 ${shaking ? "animate-shake" : ""}`} onAnimationEnd={() => setShaking(false)}>
          {q.options.map(opt => (
            <button key={opt} onClick={() => toggle(opt)} disabled={locked}
              className="w-full text-left py-3.5 px-4 rounded-2xl bg-white font-semibold text-sm transition-all active:scale-[0.98] flex items-center gap-3"
              style={getOptionStyle(opt)}>
              <span className="text-base font-black w-5 shrink-0">{getOptionIcon(opt)}</span>
              <span>{opt}</span>
            </button>
          ))}
        </div>

        {!locked && selected.size > 0 && (
          <button onClick={checkAnswer}
            className="w-full py-4 rounded-3xl font-bold text-white text-sm"
            style={{ backgroundColor: borderColor }}>
            Check My Answers ({selected.size} selected)
          </button>
        )}

        {answeredCorrectly && (
          <div className="rounded-2xl px-4 py-3 text-sm text-center"
            style={{ backgroundColor: PT.greenBg, border: `1px solid ${PT.green}`, color: PT.green }}>
            <p className="font-bold text-base">Muito bem! ✓</p>
            <p className="text-slate-600 text-xs mt-1">{q.explanation}</p>
          </div>
        )}
        {!answeredCorrectly && attempts >= 3 && (
          <div className="rounded-2xl px-4 py-3 text-sm text-center"
            style={{ backgroundColor: PT.redBg, border: `1px solid ${PT.red}`, color: PT.red }}>
            <p className="font-bold">3 tentativas esgotadas</p>
            <p className="text-xs mt-0.5 text-slate-600">As respostas certas eram: <strong>{q.correct.join(", ")}</strong></p>
          </div>
        )}

        {locked && (
          <div className="flex justify-end pt-2">
            <button onClick={next}
              className="w-24 h-24 rounded-full font-bold text-white flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all"
              style={{ backgroundColor: answeredCorrectly ? color : "#94A3B8", boxShadow: `0 8px 24px ${answeredCorrectly ? color : "#94A3B8"}55` }}>
              <span className="text-2xl leading-none">›</span>
              <span className="text-[11px] font-black tracking-wide">{idx + 1 < qs.length ? "Próximo" : "Resultado"}</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 13. ODD ONE OUT — Three belong, one doesn't
// ═══════════════════════════════════════════════════════════════════════════════

const OOO_DATA = [
  { q: "Which one is NOT a form of transport?", options: ["autocarro", "comboio", "metro", "pão"], odd: "pão", explanation: "Pão means bread. Autocarro (bus), comboio (train) and metro (subway) are all public transport in European Portuguese." },
  { q: "Which one is NOT a day of the week?", options: ["Segunda-feira", "Terça-feira", "Outono", "Sexta-feira"], odd: "Outono", explanation: "Outono means autumn — a season, not a day. Segunda, Terça and Sexta-feira are weekdays." },
  { q: "Which one is NOT a colour?", options: ["azul", "verde", "vermelho", "rápido"], odd: "rápido", explanation: "Rápido means fast or quick. Azul (blue), verde (green) and vermelho (red) are all colours." },
  { q: "Which one is NOT a month of the year?", options: ["Janeiro", "Fevereiro", "Outono", "Março"], odd: "Outono", explanation: "Outono means autumn — a season. Janeiro (Jan), Fevereiro (Feb) and Março (Mar) are months." },
  { q: "Which one is NOT a greeting?", options: ["Bom dia", "Boa tarde", "Obrigado", "Boa noite"], odd: "Obrigado", explanation: "Obrigado means 'thank you', not a greeting. Bom dia, Boa tarde and Boa noite are all greetings by time of day." },
  { q: "Which one is NOT a way to say goodbye?", options: ["Até logo", "Adeus", "Tchau", "Tudo bem?"], odd: "Tudo bem?", explanation: "'Tudo bem?' means 'Is everything okay?' — a greeting, not a farewell. The others are all ways to say goodbye." },
  { q: "Which one is NOT a verb?", options: ["comer", "beber", "dormir", "mesa"], odd: "mesa", explanation: "Mesa means table — a noun. Comer (to eat), beber (to drink) and dormir (to sleep) are all verbs." },
  { q: "Which one is NOT a season?", options: ["Inverno", "Verão", "Outono", "Manhã"], odd: "Manhã", explanation: "Manhã means morning — a time of day, not a season. Inverno (winter), Verão (summer) and Outono (autumn) are seasons." },
  { q: "Which one is NOT a personal pronoun?", options: ["eu", "tu", "ele", "livro"], odd: "livro", explanation: "Livro means book — it's a noun. Eu (I), tu (you) and ele (he/it) are personal pronouns." },
  { q: "Which one is NOT European Portuguese?", options: ["autocarro", "comboio", "casa de banho", "banheiro"], odd: "banheiro", explanation: "Banheiro is Brazilian Portuguese for bathroom. In Portugal you say 'casa de banho'. The others are all European Portuguese terms." },
  { q: "Which one is NOT a food?", options: ["bacalhau", "sardinhas", "pastel de nata", "cerveja"], odd: "cerveja", explanation: "Cerveja means beer — a drink. Bacalhau (cod), sardinhas (sardines) and pastel de nata (custard tart) are all foods." },
  { q: "Which word has the WRONG gender article?", options: ["o livro", "a escola", "o carro", "o casa"], odd: "o casa", explanation: "Casa (house) is feminine — it should be 'a casa', not 'o casa'. The others all use the correct article for their gender." },
];

function OddOneOutQuiz({ onBack }: { onBack: () => void }) {
  const [qs] = useState(() => shuffle(OOO_DATA).slice(0, 8).map(q => ({ ...q, opts: shuffle([...q.options]) })));
  const [idx, setIdx] = useState(0);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [gotWrong, setGotWrong] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const { playCorrect, playWrong } = useSound();
  const { speak, speakSlow } = useSpeech();
  const { carActive, triggerCar } = useCarAnimation();
  const color = "#B45309";
  const correctRef = useRef<string[]>([]);
  const wrongRef = useRef<string[]>([]);

  const q = qs[idx];

  const pick = (opt: string) => {
    if (answeredCorrectly || attempts >= 3) return;
    if (opt === q.odd) {
      setAnsweredCorrectly(true);
      setScore(s => s + 1);
      playCorrect();
      triggerCar();
      if (!gotWrong) correctRef.current.push(q.odd);
    } else {
      if (!gotWrong) { wrongRef.current.push(q.odd); setGotWrong(true); }
      playWrong();
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShaking(true);
      if (newAttempts < 3) speak("tente novamente");
    }
  };

  const next = () => {
    if (idx + 1 >= qs.length) { mergeProficiency("quiz-hub", correctRef.current, wrongRef.current); setDone(true); return; }
    setIdx(i => i + 1);
    setAnsweredCorrectly(false);
    setGotWrong(false);
    setShaking(false);
    setAttempts(0);
  };

  if (done) return <ResultCard score={score} total={qs.length} onBack={onBack} title="Odd One Out — Done!" color={color} />;
  const locked = answeredCorrectly || attempts >= 3;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #FFF7ED, #fff)" }}>
      <PortugueseCarAnimation active={carActive} />
      <QuizHeader title="🚫 Odd One Out" onBack={onBack} progress={idx + 1} total={qs.length} color={color} />
      <main className="flex-1 flex flex-col px-4 py-5 max-w-lg mx-auto w-full gap-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Which one doesn't belong?</p>
          <div className="flex items-start gap-2">
            <p className="text-lg font-bold text-slate-800 leading-snug flex-1">{q.q}</p>
            <button onClick={() => speakSlow(q.q)} className="shrink-0 p-2 rounded-full active:opacity-60 hover:bg-slate-100" style={{ color: "#64748B" }}><Volume2 size={20} /></button>
          </div>
        </div>
        <div className={`grid grid-cols-2 gap-2.5 ${shaking ? "animate-shake" : ""}`} onAnimationEnd={() => setShaking(false)}>
          {q.opts.map(opt => {
            let style: React.CSSProperties = { border: "2px solid #E2E8F0", backgroundColor: "#fff", color: "#334155" };
            if (locked) {
              if (opt === q.odd) style = { border: `2px solid ${PT.green}`, backgroundColor: PT.greenBg, color: PT.green };
              else style = { border: "2px solid #E2E8F0", backgroundColor: "#fff", color: "#94A3B8", opacity: 0.35 };
            }
            return (
              <button key={opt} onClick={() => pick(opt)} disabled={locked}
                className="py-4 px-3 rounded-2xl font-semibold text-sm text-center transition-all active:scale-95"
                style={style}>
                {opt}
              </button>
            );
          })}
        </div>
        {answeredCorrectly && (
          <div className="rounded-2xl px-4 py-3 text-sm text-center"
            style={{ backgroundColor: PT.greenBg, border: `1px solid ${PT.green}`, color: PT.green }}>
            <p className="font-bold text-base">Muito bem! ✓</p>
            <p className="text-slate-600 text-xs mt-1">{q.explanation}</p>
          </div>
        )}
        {!answeredCorrectly && attempts >= 3 && (
          <div className="rounded-2xl px-4 py-3 text-sm text-center"
            style={{ backgroundColor: PT.redBg, border: `1px solid ${PT.red}`, color: PT.red }}>
            <p className="font-bold">3 tentativas esgotadas</p>
            <p className="text-xs mt-0.5 text-slate-600">A resposta certa era: <strong>{q.odd}</strong></p>
          </div>
        )}
        {locked && (
          <div className="flex justify-end pt-2">
            <button onClick={next}
              className="w-24 h-24 rounded-full font-bold text-white flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all"
              style={{ backgroundColor: answeredCorrectly ? color : "#94A3B8", boxShadow: `0 8px 24px ${answeredCorrectly ? color : "#94A3B8"}55` }}>
              <span className="text-2xl leading-none">›</span>
              <span className="text-[11px] font-black tracking-wide">{idx + 1 < qs.length ? "Próximo" : "Resultado"}</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 14. MATCH THE PAIRS — Tap a left item then its matching right item
// ═══════════════════════════════════════════════════════════════════════════════

const PAIRS_SETS: { pairs: { pt: string; en: string }[] }[] = [
  { pairs: [{ pt: "bom dia", en: "good morning" }, { pt: "obrigado", en: "thank you" }, { pt: "por favor", en: "please" }, { pt: "até logo", en: "see you soon" }] },
  { pairs: [{ pt: "casa de banho", en: "bathroom" }, { pt: "autocarro", en: "bus" }, { pt: "comboio", en: "train" }, { pt: "pequeno-almoço", en: "breakfast" }] },
  { pairs: [{ pt: "azul", en: "blue" }, { pt: "verde", en: "green" }, { pt: "vermelho", en: "red" }, { pt: "amarelo", en: "yellow" }] },
  { pairs: [{ pt: "comer", en: "to eat" }, { pt: "beber", en: "to drink" }, { pt: "falar", en: "to speak" }, { pt: "dormir", en: "to sleep" }] },
  { pairs: [{ pt: "eu", en: "I" }, { pt: "tu", en: "you" }, { pt: "ele", en: "he / it" }, { pt: "nós", en: "we" }] },
  { pairs: [{ pt: "bacalhau", en: "salted cod" }, { pt: "pastel de nata", en: "custard tart" }, { pt: "sardinhas", en: "sardines" }, { pt: "francesinha", en: "Porto meat sandwich" }] },
  { pairs: [{ pt: "inverno", en: "winter" }, { pt: "verão", en: "summer" }, { pt: "outono", en: "autumn" }, { pt: "primavera", en: "spring" }] },
  { pairs: [{ pt: "segunda-feira", en: "Monday" }, { pt: "quarta-feira", en: "Wednesday" }, { pt: "sexta-feira", en: "Friday" }, { pt: "domingo", en: "Sunday" }] },
];

function MatchPairsQuiz({ onBack }: { onBack: () => void }) {
  const [set] = useState(() => shuffle(PAIRS_SETS)[0]);
  const lefts = useMemo(() => shuffle(set.pairs.map(p => p.pt)), [set]);
  const rights = useMemo(() => shuffle(set.pairs.map(p => p.en)), [set]);
  const pairMap = useMemo(() => new Map(set.pairs.map(p => [p.pt, p.en])), [set]);
  const revMap = useMemo(() => new Map(set.pairs.map(p => [p.en, p.pt])), [set]);

  const [leftPick, setLeftPick] = useState<string | null>(null);
  const [rightPick, setRightPick] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set()); // set of matched PT items
  const [wrongPt, setWrongPt] = useState<string | null>(null);    // wrong left
  const [wrongEn, setWrongEn] = useState<string | null>(null);    // wrong right
  const [errors, setErrors] = useState(0);
  const [done, setDone] = useState(false);
  const { playCorrect, playWrong } = useSound();
  const color = "#10B981";
  const correctRef = useRef<string[]>([]);
  const wrongRef = useRef<string[]>([]);

  const pickLeft = (pt: string) => {
    if (matched.has(pt) || wrongPt) return;
    setLeftPick(prev => prev === pt ? null : pt);
  };

  const { speak, speakSlow } = useSpeech();

  const pickRight = (en: string) => {
    if (!leftPick || wrongPt) return;
    const ptForEn = revMap.get(en)!;
    if (matched.has(ptForEn)) return;
    if (pairMap.get(leftPick) === en) {
      const next = new Set([...matched, leftPick]);
      setMatched(next);
      setLeftPick(null);
      setRightPick(null);
      playCorrect();
      correctRef.current.push(leftPick);
      if (next.size === set.pairs.length) setTimeout(() => { mergeProficiency("quiz-hub", correctRef.current, wrongRef.current); setDone(true); }, 600);
    } else {
      setErrors(e => e + 1);
      setWrongPt(leftPick);
      setWrongEn(en);
      if (!wrongRef.current.includes(leftPick)) wrongRef.current.push(leftPick);
      playWrong();
      speak("tente novamente");
      setTimeout(() => { setWrongPt(null); setWrongEn(null); setLeftPick(null); setRightPick(null); }, 700);
    }
  };

  if (done) return <ResultCard score={Math.max(0, set.pairs.length - errors)} total={set.pairs.length} onBack={onBack} title="All Pairs Matched! 🎉" color={color} />;

  const btnBase = "py-3 px-3 rounded-2xl font-semibold text-sm text-center w-full transition-all active:scale-95 border-2";

  const leftStyle = (pt: string): React.CSSProperties => {
    if (matched.has(pt)) return { borderColor: color, backgroundColor: PT.greenBg, color: PT.green, opacity: 0.6 };
    if (pt === wrongPt) return { borderColor: PT.red, backgroundColor: PT.redBg, color: PT.red };
    if (pt === leftPick) return { borderColor: color, backgroundColor: "#D1FAE5", color };
    return { borderColor: "#E2E8F0", backgroundColor: "#fff", color: "#334155" };
  };

  const rightStyle = (en: string): React.CSSProperties => {
    const ptForEn = revMap.get(en)!;
    if (matched.has(ptForEn)) return { borderColor: color, backgroundColor: PT.greenBg, color: PT.green, opacity: 0.6 };
    if (en === wrongEn) return { borderColor: PT.red, backgroundColor: PT.redBg, color: PT.red };
    if (leftPick && pairMap.get(leftPick) === en) return { borderColor: color, backgroundColor: "#D1FAE5", color };
    return { borderColor: "#E2E8F0", backgroundColor: "#fff", color: "#334155" };
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #ECFDF5, #fff)" }}>
      <QuizHeader title="🔗 Match the Pairs" onBack={onBack} progress={matched.size} total={set.pairs.length} color={color} />
      <main className="flex-1 flex flex-col px-4 py-5 max-w-lg mx-auto w-full gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3 shadow-sm">
          <p className="text-xs text-slate-500 text-center">
            {leftPick ? `"${leftPick}" selected — now tap its meaning →` : "Tap a Portuguese word, then its English meaning"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase text-center mb-1">Português</p>
            {lefts.map(pt => (
              <button key={pt} onClick={() => pickLeft(pt)} className={btnBase} style={leftStyle(pt)}>
                {matched.has(pt) ? "✓ " : ""}{pt}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase text-center mb-1">English</p>
            {rights.map(en => (
              <button key={en} onClick={() => pickRight(en)} className={btnBase} style={rightStyle(en)}>
                {matched.has(revMap.get(en)!) ? "✓ " : ""}{en}
              </button>
            ))}
          </div>
        </div>
        <p className="text-center text-xs text-slate-400">{matched.size} / {set.pairs.length} pairs matched · {errors} {errors === 1 ? "mistake" : "mistakes"}</p>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 15. CATEGORISE — Rapid-sort items into the correct category
// ═══════════════════════════════════════════════════════════════════════════════

const CAT_SETS: { catA: string; catB: string; hint: string; items: { word: string; cat: "A" | "B" }[] }[] = [
  {
    catA: "🍽️ Comida", catB: "🥤 Bebida", hint: "Is it a food or a drink?",
    items: [{ word: "pão", cat: "A" }, { word: "água", cat: "B" }, { word: "bacalhau", cat: "A" }, { word: "vinho", cat: "B" }, { word: "pastel de nata", cat: "A" }, { word: "sumo", cat: "B" }, { word: "sardinhas", cat: "A" }, { word: "cerveja", cat: "B" }],
  },
  {
    catA: "📝 Verbo", catB: "📦 Substantivo", hint: "Is it a verb (action) or a noun (thing)?",
    items: [{ word: "comer", cat: "A" }, { word: "livro", cat: "B" }, { word: "falar", cat: "A" }, { word: "mesa", cat: "B" }, { word: "dormir", cat: "A" }, { word: "carro", cat: "B" }, { word: "beber", cat: "A" }, { word: "escola", cat: "B" }],
  },
  {
    catA: "🇵🇹 European PT", catB: "🇧🇷 Brazilian PT", hint: "Which dialect does each word belong to?",
    items: [{ word: "autocarro", cat: "A" }, { word: "ônibus", cat: "B" }, { word: "casa de banho", cat: "A" }, { word: "banheiro", cat: "B" }, { word: "comboio", cat: "A" }, { word: "trem", cat: "B" }, { word: "pequeno-almoço", cat: "A" }, { word: "café da manhã", cat: "B" }],
  },
  {
    catA: "⚦ Masculino (o)", catB: "⚦ Feminino (a)", hint: "Is the noun masculine (o) or feminine (a)?",
    items: [{ word: "livro", cat: "A" }, { word: "escola", cat: "B" }, { word: "carro", cat: "A" }, { word: "mesa", cat: "B" }, { word: "banco", cat: "A" }, { word: "casa", cat: "B" }, { word: "comboio", cat: "A" }, { word: "cidade", cat: "B" }],
  },
];

function CategoriseQuiz({ onBack }: { onBack: () => void }) {
  const [set] = useState(() => shuffle(CAT_SETS)[0]);
  const [items] = useState(() => shuffle([...set.items]));
  const [idx, setIdx] = useState(0);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [gotWrong, setGotWrong] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const { playCorrect, playWrong } = useSound();
  const { speak, speakSlow } = useSpeech();
  const { carActive, triggerCar } = useCarAnimation();
  const color = "#7C3AED";
  const correctRef = useRef<string[]>([]);
  const wrongRef = useRef<string[]>([]);

  const item = items[idx];

  const pick = (cat: "A" | "B") => {
    if (answeredCorrectly || attempts >= 3) return;
    if (cat === item.cat) {
      setAnsweredCorrectly(true);
      setScore(s => s + 1);
      playCorrect();
      triggerCar();
      if (!gotWrong) correctRef.current.push(item.word);
    } else {
      if (!gotWrong) { wrongRef.current.push(item.word); setGotWrong(true); }
      playWrong();
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShaking(true);
      if (newAttempts < 3) speak("tente novamente");
    }
  };

  const next = () => {
    if (idx + 1 >= items.length) { mergeProficiency("quiz-hub", correctRef.current, wrongRef.current); setDone(true); return; }
    setIdx(i => i + 1);
    setAnsweredCorrectly(false);
    setGotWrong(false);
    setShaking(false);
    setAttempts(0);
  };

  if (done) return <ResultCard score={score} total={items.length} onBack={onBack} title="Categorise — Done!" color={color} />;

  const correct = item.cat;
  const catLabel = (cat: "A" | "B") => cat === "A" ? set.catA : set.catB;
  const locked = answeredCorrectly || attempts >= 3;

  const btnStyle = (cat: "A" | "B"): React.CSSProperties => {
    if (!locked) return { border: `2px solid ${color}22`, backgroundColor: "#F5F3FF", color };
    if (cat === correct) return { border: `2px solid ${PT.green}`, backgroundColor: PT.greenBg, color: PT.green };
    return { border: "2px solid #E2E8F0", backgroundColor: "#fff", color: "#94A3B8", opacity: 0.35 };
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #F5F3FF, #fff)" }}>
      <PortugueseCarAnimation active={carActive} />
      <QuizHeader title="🗃️ Categorise" onBack={onBack} progress={idx + 1} total={items.length} color={color} />
      <main className="flex-1 flex flex-col px-4 py-5 max-w-lg mx-auto w-full gap-5">
        <p className="text-center text-sm text-slate-500">{set.hint}</p>

        <div className="bg-white rounded-3xl shadow-md border border-slate-100 px-6 py-10 flex items-center justify-center gap-3">
          <p className="text-3xl font-black text-slate-800 text-center">{item.word}</p>
          <button onClick={() => speakSlow(item.word)} className="shrink-0 p-2 rounded-full active:opacity-60 hover:bg-slate-100" style={{ color: "#64748B" }}><Volume2 size={20} /></button>
        </div>

        <div className={`grid grid-cols-2 gap-3 ${shaking ? "animate-shake" : ""}`} onAnimationEnd={() => setShaking(false)}>
          {(["A", "B"] as const).map(cat => (
            <button key={cat} onClick={() => pick(cat)} disabled={locked}
              className="py-5 rounded-3xl font-bold text-base text-center transition-all active:scale-95"
              style={btnStyle(cat)}>
              {catLabel(cat)}
              {locked && cat === correct && <span className="block text-xs mt-1">✓ correcto</span>}
            </button>
          ))}
        </div>

        {answeredCorrectly && (
          <div className="rounded-2xl px-4 py-3 text-sm text-center"
            style={{ backgroundColor: PT.greenBg, border: `1px solid ${PT.green}`, color: PT.green }}>
            <p className="font-bold text-base">Muito bem! ✓</p>
          </div>
        )}
        {!answeredCorrectly && attempts >= 3 && (
          <div className="rounded-2xl px-4 py-3 text-sm text-center"
            style={{ backgroundColor: PT.redBg, border: `1px solid ${PT.red}`, color: PT.red }}>
            <p className="font-bold">3 tentativas esgotadas</p>
            <p className="text-xs mt-0.5 text-slate-600">A resposta certa era: <strong>{catLabel(correct)}</strong></p>
          </div>
        )}

        {locked && (
          <div className="flex justify-end pt-2">
            <button onClick={next}
              className="w-24 h-24 rounded-full font-bold text-white flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all"
              style={{ backgroundColor: answeredCorrectly ? color : "#94A3B8", boxShadow: `0 8px 24px ${answeredCorrectly ? color : "#94A3B8"}55` }}>
              <span className="text-2xl leading-none">›</span>
              <span className="text-[11px] font-black tracking-wide">{idx + 1 < items.length ? "Próximo" : "Resultado"}</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 16. QUIZ BUILDER — Create, Customise & Share
// ═══════════════════════════════════════════════════════════════════════════════

interface CustomMCQQuestion {
  type: "mcq";
  q: string;
  options: [string, string, string, string];
  correct: number; // index 0-3
  explanation: string;
}
interface CustomTFQuestion {
  type: "tf";
  q: string;
  correct: boolean;
  explanation: string;
}
type CustomQuestion = CustomMCQQuestion | CustomTFQuestion;
interface CustomQuiz {
  title: string;
  template: "mcq" | "tf" | "mix";
  questions: CustomQuestion[];
}

function encodeQuiz(quiz: CustomQuiz): string {
  try { return btoa(encodeURIComponent(JSON.stringify(quiz))); } catch { return ""; }
}
function decodeQuiz(encoded: string): CustomQuiz | null {
  try { return JSON.parse(decodeURIComponent(atob(encoded))); } catch { return null; }
}

// ─── Custom Quiz Player ───────────────────────────────────────────────────────

function CustomQuizPlayer({ quiz, onDone }: { quiz: CustomQuiz; onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [selectedMCQ, setSelectedMCQ] = useState<number | null>(null);
  const [selectedTF, setSelectedTF] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const { playCorrect, playWrong } = useSound();
  const { speakSlow } = useSpeech();
  const color = "#7C3AED";

  const q = quiz.questions[idx];
  const isRevealed = q.type === "mcq" ? selectedMCQ !== null : selectedTF !== null;

  const chooseMCQ = (i: number) => {
    if (selectedMCQ !== null) return;
    setSelectedMCQ(i);
    const correct = i === (q as CustomMCQQuestion).correct;
    if (correct) { setScore(s => s + 1); playCorrect(); } else playWrong();
  };

  const chooseTF = (val: boolean) => {
    if (selectedTF !== null) return;
    setSelectedTF(val);
    const correct = val === (q as CustomTFQuestion).correct;
    if (correct) { setScore(s => s + 1); playCorrect(); } else playWrong();
  };

  const next = () => {
    if (idx + 1 >= quiz.questions.length) { setDone(true); return; }
    setIdx(i => i + 1);
    setSelectedMCQ(null);
    setSelectedTF(null);
  };

  if (done) return <ResultCard score={score} total={quiz.questions.length} onBack={onDone} title={`${quiz.title} — Complete!`} color={color} />;

  const isMCQ = q.type === "mcq";
  const mcqQ = q as CustomMCQQuestion;
  const tfQ = q as CustomTFQuestion;
  const mcqCorrect = isMCQ && selectedMCQ === mcqQ.correct;
  const tfCorrect = !isMCQ && selectedTF === tfQ.correct;
  const isCorrect = isMCQ ? mcqCorrect : tfCorrect;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #F5F3FF, #fff)" }}>
      <QuizHeader title={quiz.title} onBack={onDone} progress={idx + 1} total={quiz.questions.length} color={color} />
      <main className="flex-1 flex flex-col px-4 py-5 max-w-lg mx-auto w-full gap-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">
            {isMCQ ? "Choose the correct answer" : "True or false?"}
          </p>
          <div className="flex items-start gap-2">
            <p className="text-lg font-bold text-slate-800 leading-snug flex-1">{q.q}</p>
            <button onClick={() => speakSlow(q.q)} className="shrink-0 p-2 rounded-full active:opacity-60 hover:bg-slate-100" style={{ color: "#64748B" }}><Volume2 size={20} /></button>
          </div>
        </div>

        {isMCQ ? (
          <div className="space-y-2.5">
            {mcqQ.options.map((opt, i) => {
              let style: React.CSSProperties = { border: "2px solid #e2e8f0", color: "#334155" };
              if (selectedMCQ !== null) {
                if (i === mcqQ.correct) style = { border: `2px solid ${PT.green}`, backgroundColor: PT.greenBg, color: PT.green };
                else if (i === selectedMCQ) style = { border: `2px solid ${PT.red}`, backgroundColor: PT.redBg, color: PT.red };
                else style = { border: "2px solid #e2e8f0", color: "#94a3b8", opacity: 0.5 };
              }
              return (
                <button key={i} onClick={() => chooseMCQ(i)} disabled={selectedMCQ !== null}
                  className="w-full text-left py-3.5 px-4 rounded-2xl bg-white font-semibold text-sm transition-all active:scale-[0.98]"
                  style={style}>
                  <span className="font-black mr-2 text-slate-400">{["A", "B", "C", "D"][i]}.</span>{opt}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {[true, false].map(val => {
              let style: React.CSSProperties = { border: "2px solid #e2e8f0", color: "#334155" };
              if (selectedTF !== null) {
                if (val === tfQ.correct) style = { border: `2px solid ${PT.green}`, backgroundColor: PT.greenBg, color: PT.green };
                else if (val === selectedTF) style = { border: `2px solid ${PT.red}`, backgroundColor: PT.redBg, color: PT.red };
                else style = { border: "2px solid #e2e8f0", color: "#94a3b8", opacity: 0.5 };
              }
              return (
                <button key={String(val)} onClick={() => chooseTF(val)} disabled={selectedTF !== null}
                  className="py-5 rounded-3xl bg-white font-black text-xl transition-all active:scale-[0.97]"
                  style={style}>
                  {val ? "✅ True" : "❌ False"}
                </button>
              );
            })}
          </div>
        )}

        {isRevealed && (
          <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
            style={{ backgroundColor: isCorrect ? PT.greenBg : PT.redBg, border: `1px solid ${isCorrect ? PT.green : PT.red}`, color: isCorrect ? PT.green : PT.red }}>
            <p className="font-bold mb-0.5">{isCorrect ? "Correct! ✓" : "Not quite ✗"}</p>
            {q.explanation && <p className="text-slate-700">{q.explanation}</p>}
          </div>
        )}

        {isRevealed && (
          <button onClick={next} className="w-full py-4 rounded-3xl font-bold text-white text-sm"
            style={{ backgroundColor: color }}>
            {idx + 1 < quiz.questions.length ? "Next →" : "See Results"}
          </button>
        )}
      </main>
    </div>
  );
}

// ─── Quiz Builder ─────────────────────────────────────────────────────────────

const BLANK_MCQ = (): CustomMCQQuestion => ({ type: "mcq", q: "", options: ["", "", "", ""], correct: 0, explanation: "" });
const BLANK_TF  = (): CustomTFQuestion  => ({ type: "tf",  q: "", correct: true, explanation: "" });

function QuizBuilder({ onBack }: { onBack: () => void }) {
  const { goHome } = useContext(GoHomeContext);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [template, setTemplate] = useState<"mcq" | "tf" | "mix">("mcq");
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<CustomQuestion[]>([BLANK_MCQ()]);
  const [copied, setCopied] = useState(false);
  const [playPreview, setPlayPreview] = useState(false);
  const linkRef = useRef<string>("");

  const color = "#7C3AED";

  const addQuestion = () => {
    if (questions.length >= 10) return;
    const newQ: CustomQuestion = template === "tf" ? BLANK_TF()
      : template === "mcq" ? BLANK_MCQ()
      : questions.length % 2 === 0 ? BLANK_MCQ() : BLANK_TF();
    setQuestions(qs => [...qs, newQ]);
  };

  const removeQuestion = (i: number) => setQuestions(qs => qs.filter((_, idx) => idx !== i));

  const updateQ = (i: number, updates: Partial<CustomQuestion>) =>
    setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, ...updates } as CustomQuestion : q));

  const updateOption = (qi: number, oi: number, val: string) =>
    setQuestions(qs => qs.map((q, idx) => {
      if (idx !== qi || q.type !== "mcq") return q;
      const opts = [...(q as CustomMCQQuestion).options] as [string, string, string, string];
      opts[oi] = val;
      return { ...q, options: opts } as CustomMCQQuestion;
    }));

  const canProceedStep2 = title.trim().length > 0 && questions.length > 0 &&
    questions.every(q => {
      if (q.q.trim() === "") return false;
      if (q.type === "mcq") return (q as CustomMCQQuestion).options.every(o => o.trim() !== "");
      return true;
    });

  const buildLink = () => {
    const quiz: CustomQuiz = { title: title.trim(), template, questions };
    const encoded = encodeQuiz(quiz);
    const base = window.location.origin + window.location.pathname;
    return `${base}?customquiz=${encoded}`;
  };

  const handleCopy = () => {
    const link = buildLink();
    linkRef.current = link;
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };

  if (playPreview) {
    const quiz: CustomQuiz = { title: title.trim(), template, questions };
    return <CustomQuizPlayer quiz={quiz} onDone={() => setPlayPreview(false)} />;
  }

  // ─── Step 1: Choose template ──────────────────────────────────────────────
  if (step === 1) return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #F5F3FF, #fff)" }}>
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="flex justify-center items-center pt-2.5 pb-1.5">
          <button onClick={goHome} className="flex items-center gap-2 active:opacity-70 transition-opacity" aria-label="Go to home">
            <img src="/portulgiza-icon.svg" alt="PORTULGIZA" className="w-9 h-9 rounded-lg shadow-sm object-cover" />
            <span className="text-sm font-black tracking-tight text-slate-800">PORTULGIZA</span>
          </button>
        </div>
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center gap-3">
          <button onClick={onBack} aria-label="Voltar"
            className="shrink-0 px-3.5 py-1.5 rounded-full font-bold text-xs text-white active:opacity-70"
            style={{ backgroundColor: PT.green }}>Voltar</button>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest">Step 1 of 3</p>
            <h1 className="text-sm font-bold text-slate-800">Choose a template</h1>
          </div>
        </div>
        <div className="flex h-1"><div className="h-1 transition-all" style={{ width: "33%", backgroundColor: color }} /></div>
        <LevelStrip level={loadOnboarding().level} />
      </div>
      <main className="max-w-lg mx-auto px-4 py-6 w-full space-y-3">
        <p className="text-sm text-slate-500 mb-2">What type of questions do you want in your quiz?</p>
        {([
          { key: "mcq", icon: "☑️", label: "Multiple Choice", desc: "4-option questions — players pick the right answer. Best for graded knowledge checks." },
          { key: "tf",  icon: "⚖️", label: "True or False",   desc: "Quick statements — players decide fact or fiction. Great for warm-ups and icebreakers." },
          { key: "mix", icon: "🎲", label: "Mix of Both",      desc: "Alternates between MCQ and True/False to keep things varied and interesting." },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTemplate(t.key)}
            className="w-full text-left rounded-3xl p-5 transition-all active:scale-[0.98]"
            style={{ background: template === t.key ? "#F5F3FF" : "#fff", border: `2px solid ${template === t.key ? color : "#e2e8f0"}` }}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{t.icon}</span>
              <div>
                <p className="font-bold text-slate-800">{t.label}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{t.desc}</p>
              </div>
              {template === t.key && <CheckCircle size={18} className="ml-auto shrink-0 mt-0.5" style={{ color }} />}
            </div>
          </button>
        ))}
        <button onClick={() => setStep(2)}
          className="w-full py-4 rounded-3xl font-bold text-white mt-2"
          style={{ backgroundColor: color }}>
          Next: Add Questions →
        </button>
      </main>
    </div>
  );

  // ─── Step 2: Add questions ────────────────────────────────────────────────
  if (step === 2) return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #F5F3FF, #fff)" }}>
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="flex justify-center items-center pt-2.5 pb-1.5">
          <button onClick={goHome} className="flex items-center gap-2 active:opacity-70 transition-opacity" aria-label="Go to home">
            <img src="/portulgiza-icon.svg" alt="PORTULGIZA" className="w-9 h-9 rounded-lg shadow-sm object-cover" />
            <span className="text-sm font-black tracking-tight text-slate-800">PORTULGIZA</span>
          </button>
        </div>
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center gap-3">
          <button onClick={() => setStep(1)} aria-label="Voltar"
            className="shrink-0 px-3.5 py-1.5 rounded-full font-bold text-xs text-white active:opacity-70"
            style={{ backgroundColor: PT.green }}>Voltar</button>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest">Step 2 of 3</p>
            <h1 className="text-sm font-bold text-slate-800">Add your questions</h1>
          </div>
        </div>
        <div className="flex h-1"><div className="h-1 transition-all" style={{ width: "66%", backgroundColor: color }} /></div>
        <LevelStrip level={loadOnboarding().level} />
      </div>
      <main className="max-w-lg mx-auto px-4 py-5 w-full space-y-4 pb-32">

        {/* Quiz title */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Quiz Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Portuguese Basics Quiz"
            className="w-full text-base font-semibold text-slate-800 outline-none placeholder:text-slate-300"
            maxLength={60} />
        </div>

        {/* Questions */}
        {questions.map((q, qi) => {
          const mcq = q as CustomMCQQuestion;
          const tf = q as CustomTFQuestion;
          return (
            <div key={qi} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Q{qi + 1} · {q.type === "mcq" ? "Multiple Choice" : "True / False"}
                </span>
                {questions.length > 1 && (
                  <button onClick={() => removeQuestion(qi)} className="text-xs text-red-400 hover:text-red-600 font-semibold">Remove</button>
                )}
              </div>

              <textarea value={q.q} onChange={e => updateQ(qi, { q: e.target.value })}
                placeholder="Type your question here…"
                className="w-full text-sm font-medium text-slate-800 outline-none resize-none placeholder:text-slate-300 leading-relaxed"
                rows={2} maxLength={200} />

              {q.type === "mcq" ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400">Options — click ● to mark the correct answer</p>
                  {mcq.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <button onClick={() => updateQ(qi, { correct: oi })}
                        className="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors"
                        style={{ borderColor: mcq.correct === oi ? color : "#cbd5e1", backgroundColor: mcq.correct === oi ? color : "transparent" }}>
                        {mcq.correct === oi && <div className="w-2 h-2 rounded-full bg-white" />}
                      </button>
                      <input value={opt} onChange={e => updateOption(qi, oi, e.target.value)}
                        placeholder={`Option ${["A","B","C","D"][oi]}`}
                        className="flex-1 text-sm text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-violet-400"
                        maxLength={100} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2">
                  {[true, false].map(val => (
                    <button key={String(val)} onClick={() => updateQ(qi, { correct: val })}
                      className="flex-1 py-2 rounded-xl font-bold text-sm transition-all"
                      style={{ backgroundColor: tf.correct === val ? color : "#f1f5f9", color: tf.correct === val ? "#fff" : "#64748b", border: `2px solid ${tf.correct === val ? color : "#e2e8f0"}` }}>
                      {val ? "✅ True" : "❌ False"}
                    </button>
                  ))}
                </div>
              )}

              <input value={q.explanation} onChange={e => updateQ(qi, { explanation: e.target.value })}
                placeholder="Explanation (shown after answer — optional)"
                className="w-full text-xs text-slate-500 border border-slate-100 rounded-xl px-3 py-2 outline-none focus:border-violet-300 bg-slate-50"
                maxLength={200} />
            </div>
          );
        })}

        {questions.length < 10 && (
          <button onClick={addQuestion}
            className="w-full py-3 rounded-2xl border-2 border-dashed font-semibold text-sm transition-all"
            style={{ borderColor: color, color }}>
            + Add Question ({questions.length}/10)
          </button>
        )}
      </main>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 max-w-lg mx-auto">
        <button onClick={() => setStep(3)} disabled={!canProceedStep2}
          className="w-full py-4 rounded-3xl font-bold text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: color }}>
          Next: Share Quiz →
        </button>
      </div>
    </div>
  );

  // ─── Step 3: Share ────────────────────────────────────────────────────────
  const shareLink = buildLink();
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #F5F3FF, #fff)" }}>
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="flex justify-center items-center pt-2.5 pb-1.5">
          <button onClick={goHome} className="flex items-center gap-2 active:opacity-70 transition-opacity" aria-label="Go to home">
            <img src="/portulgiza-icon.svg" alt="PORTULGIZA" className="w-9 h-9 rounded-lg shadow-sm object-cover" />
            <span className="text-sm font-black tracking-tight text-slate-800">PORTULGIZA</span>
          </button>
        </div>
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center gap-3">
          <button onClick={() => setStep(2)} aria-label="Voltar"
            className="shrink-0 px-3.5 py-1.5 rounded-full font-bold text-xs text-white active:opacity-70"
            style={{ backgroundColor: PT.green }}>Voltar</button>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest">Step 3 of 3</p>
            <h1 className="text-sm font-bold text-slate-800">Share & Score</h1>
          </div>
        </div>
        <div className="flex h-1"><div className="h-1" style={{ width: "100%", backgroundColor: color }} /></div>
        <LevelStrip level={loadOnboarding().level} />
      </div>
      <main className="max-w-lg mx-auto px-4 py-6 w-full space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center space-y-1">
          <p className="text-2xl">🎉</p>
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <p className="text-sm text-slate-500">{questions.length} question{questions.length !== 1 ? "s" : ""} ·{" "}
            {template === "mcq" ? "Multiple Choice" : template === "tf" ? "True or False" : "Mixed"}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Your shareable link</p>
          <div className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200">
            <p className="text-xs text-slate-500 break-all leading-relaxed font-mono">{shareLink}</p>
          </div>
          <p className="text-xs text-slate-400">Anyone who opens this link will be taken to your quiz and scored automatically.</p>
          <button onClick={handleCopy}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-[0.98]"
            style={{ backgroundColor: copied ? PT.green : color }}>
            {copied ? "✓ Copied to clipboard!" : "📋 Copy Link"}
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Preview your quiz</p>
          <p className="text-xs text-slate-400">Try it yourself before sharing it with others.</p>
          <button onClick={() => setPlayPreview(true)}
            className="w-full py-3.5 rounded-2xl font-bold text-sm border-2 transition-all active:scale-[0.98]"
            style={{ borderColor: color, color }}>
            ▶ Play Preview
          </button>
        </div>

        <button onClick={onBack}
          className="w-full py-3 rounded-2xl text-slate-500 text-sm font-semibold border border-slate-200 hover:bg-slate-50">
          Back to Quiz Hub
        </button>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 16. WORD REVIEW — flashcard then 2-option MCQ
// ═══════════════════════════════════════════════════════════════════════════════

function buildWordPool() {
  const pool: { portuguese: string; english: string; lessonTitle: string; lessonId: string }[] = [];
  for (const lesson of lessons) {
    for (const item of lesson.items) {
      const eng = item.english.split(" / ")[0].split(" (")[0].trim();
      pool.push({ portuguese: item.portuguese, english: eng, lessonTitle: lesson.title, lessonId: lesson.id });
    }
  }
  return pool;
}

function WordReviewQuiz({ onBack }: { onBack: () => void }) {
  const pool = useMemo(() => shuffle(buildWordPool()).slice(0, 20), []);
  const [idx, setIdx]       = useState(0);
  const [phase, setPhase]   = useState<"card" | "choose" | "result">("card");
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore]   = useState(0);
  const [done, setDone]     = useState(false);
  // Track outcomes per lesson for proficiency saving
  const outcomes = useRef<Record<string, { correct: string[]; wrong: string[] }>>({});
  const { playCorrect, playWrong } = useSound();
  const color = "#0284C7";

  const card = pool[idx];

  const options = useMemo(() => {
    const others = pool.filter((_, i) => i !== idx);
    const wrong = shuffle(others)[0]?.english ?? "—";
    return shuffle([card.english, wrong]);
  }, [card, idx, pool]);

  // Auto-play word when card loads
  useEffect(() => {
    setPhase("card");
    setChosen(null);
    const t = setTimeout(() => {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find((v) => v.lang === "pt-PT") ?? voices.find((v) => v.lang.startsWith("pt")) ?? null;
      const u = new SpeechSynthesisUtterance(card.portuguese);
      u.lang = "pt-PT"; u.rate = 0.75; u.pitch = 1.0; u.volume = 1.0;
      if (v) u.voice = v;
      window.speechSynthesis.speak(u);
    }, 400);
    return () => { clearTimeout(t); window.speechSynthesis.cancel(); };
  }, [card]);

  function speakWord() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find((v) => v.lang === "pt-PT") ?? voices.find((v) => v.lang.startsWith("pt")) ?? null;
    const u = new SpeechSynthesisUtterance(card.portuguese);
    u.lang = "pt-PT"; u.rate = 0.75; u.pitch = 1.0; u.volume = 1.0;
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  }

  function recordOutcome(word: string, lessonId: string, correct: boolean) {
    const prev = outcomes.current[lessonId] ?? { correct: [], wrong: [] };
    if (correct) {
      outcomes.current[lessonId] = { ...prev, correct: [...prev.correct, word] };
    } else {
      outcomes.current[lessonId] = { ...prev, wrong: [...prev.wrong, word] };
    }
  }

  function flushProficiency() {
    for (const [lessonId, { correct, wrong }] of Object.entries(outcomes.current)) {
      mergeProficiency(lessonId, correct, wrong);
    }
  }

  function handleChoose(opt: string) {
    if (chosen) return;
    setChosen(opt);
    setPhase("result");
    const correct = opt === card.english;
    recordOutcome(card.portuguese, card.lessonId, correct);
    if (correct) { setScore(s => s + 1); playCorrect(); }
    else playWrong();
  }

  function handleNext() {
    window.speechSynthesis.cancel();
    if (idx + 1 >= pool.length) {
      flushProficiency();
      setDone(true);
      return;
    }
    setIdx(i => i + 1);
  }

  if (done) return <ResultCard score={score} total={pool.length} onBack={onBack} title="Word Review Complete!" color={color} />;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #E0F2FE, #fff)" }}>
      <QuizHeader title="📋 Word Review" onBack={onBack} progress={idx + 1} total={pool.length} color={color} />
      <main className="flex-1 flex flex-col px-4 py-6 max-w-lg mx-auto w-full gap-4">

        {/* Word card */}
        <div className="bg-white rounded-3xl shadow-sm border-2 p-8 text-center" style={{ borderColor: "#BAE6FD" }}>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">{card.lessonTitle}</p>
          <p className="text-4xl font-extrabold mb-4" style={{ color }}>{card.portuguese}</p>
          <button
            onClick={speakWord}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white mx-auto transition-all active:scale-95"
            style={{ backgroundColor: color }}
          >
            <Volume2 size={13} /> Hear it
          </button>
        </div>

        {/* Prompt / MCQ */}
        {phase === "card" && (
          <button
            onClick={() => setPhase("choose")}
            className="w-full py-4 rounded-3xl font-bold text-sm text-white active:scale-95 transition-all"
            style={{ backgroundColor: color }}
          >
            What does it mean? →
          </button>
        )}

        {(phase === "choose" || phase === "result") && (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold px-1 text-center">
              Is it…
            </p>
            {options.map((opt) => (
              <ChoiceBtn
                key={opt}
                label={opt}
                selected={chosen === opt}
                correct={opt === card.english}
                onChoose={() => handleChoose(opt)}
                disabled={!!chosen}
              />
            ))}
          </div>
        )}

        {phase === "result" && (
          <button
            onClick={handleNext}
            className="w-full py-4 rounded-3xl font-bold text-sm text-white active:scale-95 transition-all"
            style={{ backgroundColor: color }}
          >
            {idx + 1 >= pool.length ? "See results →" : "Next word →"}
          </button>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 17. CONJUNCTIONS IN ACTION
// ═══════════════════════════════════════════════════════════════════════════════

// Short phrase pairs — Portuguese front, English back
const CONJ_CARDS = [
  { phrase: "café e chá",           english: "coffee and tea",            conjunction: "e",             type: "Simple" },
  { phrase: "quero, mas não posso", english: "I want to, but I can't",    conjunction: "mas",           type: "Simple" },
  { phrase: "sim ou não",           english: "yes or no",                 conjunction: "ou",            type: "Simple" },
  { phrase: "em casa porque chove", english: "at home because it rains",  conjunction: "porque",        type: "Simple" },
  { phrase: "com fome, então comi", english: "hungry, so I ate",          conjunction: "então",         type: "Simple" },
  { phrase: "caro, porém bom",      english: "expensive, but good",       conjunction: "porém",         type: "Simple" },
  { phrase: "nem sim nem não",      english: "neither yes nor no",        conjunction: "nem",           type: "Simple" },
  { phrase: "penso, logo existo",   english: "I think, therefore I am",   conjunction: "logo",          type: "Simple" },
  { phrase: "para que entendas",    english: "so that you understand",    conjunction: "para que",      type: "Phrase" },
  { phrase: "já que estás aqui",    english: "since you're here",         conjunction: "já que",        type: "Phrase" },
  { phrase: "uma vez que sabes",    english: "given that you know",       conjunction: "uma vez que",   type: "Phrase" },
  { phrase: "mesmo que chova",      english: "even if it rains",          conjunction: "mesmo que",     type: "Phrase" },
  { phrase: "desde que venhas",     english: "as long as you come",       conjunction: "desde que",     type: "Phrase" },
  { phrase: "a não ser que venhas", english: "unless you come",           conjunction: "a não ser que", type: "Phrase" },
  { phrase: "no entanto, é possível", english: "nevertheless, it's possible", conjunction: "no entanto", type: "Phrase" },
  { phrase: "de modo que percebas", english: "so that you understand",    conjunction: "de modo que",   type: "Phrase" },
];

function ConjunctionsQuiz({ onBack }: { onBack: () => void }) {
  const cards = useMemo(() => shuffle(CONJ_CARDS), []);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [gotIt, setGotIt] = useState(0);
  const [done, setDone] = useState(false);
  const { playCorrect, playWrong } = useSound();
  const { speakSlow } = useSpeech();
  const color = "#7C3AED";
  const card = cards[idx];
  const correctRef = useRef<string[]>([]);
  const wrongRef = useRef<string[]>([]);

  useEffect(() => {
    setFlipped(false);
    const t = setTimeout(() => speakSlow(card.phrase), 400);
    return () => { clearTimeout(t); window.speechSynthesis.cancel(); };
  }, [card]);

  function handleFlip() {
    setFlipped(true);
    speakSlow(card.phrase);
  }

  function handleResult(knew: boolean) {
    if (knew) { setGotIt(g => g + 1); playCorrect(); correctRef.current.push(card.conjunction); }
    else { playWrong(); wrongRef.current.push(card.conjunction); }
    if (idx + 1 >= cards.length) { mergeProficiency("quiz-hub", correctRef.current, wrongRef.current); setDone(true); return; }
    setIdx(i => i + 1);
    setFlipped(false);
  }

  if (done) return <ResultCard score={gotIt} total={cards.length} onBack={onBack} title="Conjunctions Complete!" color={color} message="You've practised all 16 conjunction phrases!" />;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #F5F3FF, #fff)" }}>
      <QuizHeader title="🔗 Conjunctions in Action" onBack={onBack} progress={idx + 1} total={cards.length} color={color} />
      <main className="flex-1 flex flex-col items-center px-4 py-6 max-w-lg mx-auto w-full gap-5">

        {/* Type badge */}
        <div className="flex items-center gap-2 self-start">
          <span className="text-xs font-black px-3 py-1 rounded-full" style={{ backgroundColor: "#EDE9FE", color }}>
            {card.type === "Simple" ? "Single word" : "Phrase"}
          </span>
          <span className="text-xs text-slate-400">conjunction</span>
        </div>

        {/* Flip card */}
        <div
          onClick={!flipped ? handleFlip : undefined}
          className="w-full rounded-3xl shadow-md border-2 transition-all duration-300 select-none"
          style={{
            borderColor: flipped ? color : "#C4B5FD",
            backgroundColor: flipped ? "#EDE9FE" : "#fff",
            minHeight: 220,
            cursor: flipped ? "default" : "pointer",
          }}
        >
          {!flipped ? (
            /* FRONT — Portuguese phrase */
            <div className="flex flex-col items-center justify-center p-8 gap-4" style={{ minHeight: 220 }}>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Portuguese</p>
              <p className="text-2xl font-extrabold text-center" style={{ color }}>
                {card.phrase}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); speakSlow(card.phrase); }}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white active:scale-95 transition-all"
                style={{ backgroundColor: color }}
              >
                <Volume2 size={13} /> Hear it
              </button>
              <p className="text-xs text-slate-400 mt-1">Tap card to see English →</p>
            </div>
          ) : (
            /* BACK — English meaning */
            <div className="flex flex-col items-center justify-center p-8 gap-4" style={{ minHeight: 220 }}>
              <p className="text-xs uppercase tracking-widest font-semibold" style={{ color }}>English</p>
              <p className="text-2xl font-extrabold text-center text-slate-800">
                {card.english}
              </p>
              <div className="px-4 py-2 rounded-2xl text-center" style={{ backgroundColor: "#fff", border: `1px solid #C4B5FD` }}>
                <span className="text-sm font-semibold" style={{ color }}>"{card.conjunction}"</span>
                <span className="text-sm text-slate-500"> = {card.english.split(" ")[0] === "I" ? card.english : card.english}</span>
              </div>
              <button
                onClick={() => speakSlow(card.phrase)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border-2 active:scale-95 transition-all"
                style={{ borderColor: color, color, backgroundColor: "#fff" }}
              >
                <Volume2 size={13} /> Hear again
              </button>
            </div>
          )}
        </div>

        {/* After flip — self-assessment buttons */}
        {flipped && (
          <div className="w-full space-y-2.5">
            <p className="text-xs text-center text-slate-400 uppercase tracking-widest">Did you know it?</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleResult(false)}
                className="flex-1 py-4 rounded-3xl font-bold text-sm border-2 active:scale-95 transition-all"
                style={{ borderColor: PT.red, color: PT.red, backgroundColor: "#FFF1F2" }}
              >
                ✗ Not yet
              </button>
              <button
                onClick={() => handleResult(true)}
                className="flex-1 py-4 rounded-3xl font-bold text-sm text-white active:scale-95 transition-all"
                style={{ backgroundColor: PT.green }}
              >
                ✓ Got it
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ HUB — Main entry screen
// ═══════════════════════════════════════════════════════════════════════════════

export type QuizMode =
  | "hub" | "mcq"
  | "truefalse" | "openended" | "fillblank"
  | "picture" | "audio" | "scored" | "ordering"
  | "multiresponse" | "fillgap"
  | "oddoneout" | "matchpairs" | "categorise"
  | "conjunctions" | "wordreview" | "builder";

const HUB_ITEMS: { mode: QuizMode; label: string; subtitle: string; key: keyof typeof HUB_COLORS }[] = [
  { mode: "mcq",         label: "☑️ Multiple Choice",       subtitle: "Classic 4-option questions",      key: "mcq" },
  { mode: "truefalse",   label: "⚖️ True or False",        subtitle: "Decide: fact or fiction?",        key: "truefalse" },
  { mode: "openended",   label: "✍️ Open-Ended",            subtitle: "Type your own answer",            key: "openended" },
  { mode: "fillblank",   label: "📝 Fill in the Blank",     subtitle: "Complete the sentence",           key: "fillblank" },
  { mode: "picture",     label: "🖼️ Picture Quiz",          subtitle: "Name what you see",               key: "picture" },
  { mode: "audio",       label: "🎧 Audio Quiz",            subtitle: "Listen & identify",               key: "audio" },
  { mode: "scored",      label: "🏆 Scored Challenge",      subtitle: "Earn points — mixed format",      key: "scored" },
  { mode: "ordering",      label: "🔢 Put in Order",        subtitle: "Tap items into the correct sequence",       key: "ordering" },
  { mode: "multiresponse", label: "☑ Multi-Select",         subtitle: "Choose ALL the correct answers",             key: "multiresponse" },
  { mode: "fillgap",       label: "🗂️ Fill the Gap",         subtitle: "Tap a word and drop it into the sentence",  key: "fillgap" },
  { mode: "oddoneout",     label: "🚫 Odd One Out",           subtitle: "Find the item that doesn't belong",         key: "oddoneout" },
  { mode: "matchpairs",    label: "🔗 Match the Pairs",       subtitle: "Link Portuguese words to their meanings",   key: "matchpairs" },
  { mode: "categorise",    label: "🗃️ Categorise",            subtitle: "Sort each item into the right group",       key: "categorise" },
  { mode: "conjunctions",  label: "🔗 Conjunctions in Action", subtitle: "Sentences · slow audio · word-by-word repeat", key: "conjunctions" },
  { mode: "wordreview",    label: "📋 Word Review",             subtitle: "See the word · hear it · pick the meaning",    key: "wordreview" },
];

export default function QuizHub({ onBack, initialMode }: { onBack: () => void; initialMode?: QuizMode }) {
  const [mode, setMode] = useState<QuizMode>(initialMode ?? "hub");
  const [sharedQuiz, setSharedQuiz] = useState<CustomQuiz | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get("customquiz");
    if (qParam) {
      const decoded = decodeQuiz(qParam);
      if (decoded) {
        setSharedQuiz(decoded);
        const url = new URL(window.location.href);
        url.searchParams.delete("customquiz");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, []);

  const goHub = () => { setMode("hub"); setSharedQuiz(null); };

  // All quiz sub-pages get the GoHomeContext so their logo tap goes all the way to Home
  const inner = (() => {
    if (sharedQuiz) return <CustomQuizPlayer quiz={sharedQuiz} onDone={goHub} />;
    if (mode === "mcq")           return <MCQuiz onBack={goHub} />;
    if (mode === "truefalse")     return <TrueFalseQuiz onBack={goHub} />;
    if (mode === "openended")     return <OpenEndedQuiz onBack={goHub} />;
    if (mode === "fillblank")     return <FillBlankQuiz onBack={goHub} />;
    if (mode === "picture")       return <PictureQuiz onBack={goHub} />;
    if (mode === "audio")         return <AudioQuiz onBack={goHub} />;
    if (mode === "scored")        return <ScoredChallenge onBack={goHub} />;
    if (mode === "ordering")      return <OrderingQuiz onBack={goHub} />;
    if (mode === "multiresponse") return <MultiResponseQuiz onBack={goHub} />;
    if (mode === "fillgap")       return <FillGapQuiz onBack={goHub} />;
    if (mode === "oddoneout")     return <OddOneOutQuiz onBack={goHub} />;
    if (mode === "matchpairs")    return <MatchPairsQuiz onBack={goHub} />;
    if (mode === "categorise")    return <CategoriseQuiz onBack={goHub} />;
    if (mode === "conjunctions")  return <ConjunctionsQuiz onBack={goHub} />;
    if (mode === "wordreview")    return <WordReviewQuiz onBack={goHub} />;
    if (mode === "builder")       return <QuizBuilder onBack={goHub} />;
    return null;
  })();

  if (inner !== null) {
    return (
      <GoHomeContext.Provider value={{ goHome: onBack }}>
        {inner}
      </GoHomeContext.Provider>
    );
  }

  // ── Hub screen ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(175deg, #f0fdf4 0%, #fefce8 40%, #fff1f2 100%)" }}>
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        {/* Logo row */}
        <div className="flex justify-center items-center pt-2.5 pb-1.5">
          <button onClick={onBack} className="flex items-center gap-2 active:opacity-70 transition-opacity" aria-label="Go to home">
            <img src="/portulgiza-icon.svg" alt="PORTULGIZA" className="w-9 h-9 rounded-lg shadow-sm object-cover" />
            <span className="text-sm font-black tracking-tight text-slate-800">PORTULGIZA</span>
          </button>
        </div>
        {/* Nav row */}
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center gap-3">
          <button onClick={onBack} aria-label="Voltar"
            className="shrink-0 px-3.5 py-1.5 rounded-full font-bold text-xs text-white active:opacity-70 transition-opacity"
            style={{ backgroundColor: PT.green }}>
            Voltar
          </button>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">Quiz Hub</p>
            <p className="text-xs text-slate-400">15 quiz formats + create your own</p>
          </div>
        </div>
        <div className="flex h-[3px]">
          <div className="flex-1" style={{ backgroundColor: "#046A38" }} />
          <div className="flex-1" style={{ backgroundColor: "#FFD700" }} />
          <div className="flex-1" style={{ backgroundColor: "#DA291C" }} />
        </div>
        <LevelStrip level={loadOnboarding().level} />
      </header>

      <main className="max-w-lg mx-auto px-4 py-5">
        {/* Create Your Own — featured at top */}
        <button
          onClick={() => setMode("builder")}
          className="w-full text-left rounded-3xl p-5 mb-4 transition-all active:scale-[0.98] shadow-sm"
          style={{ background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)", border: "2px solid #7C3AED" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800 text-sm mb-0.5">✏️ Create Your Own Quiz</p>
              <p className="text-xs" style={{ color: "#7C3AED" }}>Build, brand & share with a link — auto-scored</p>
            </div>
            <span className="text-xs font-black px-2 py-1 rounded-xl ml-3" style={{ backgroundColor: "#7C3AED", color: "#fff" }}>NEW</span>
          </div>
        </button>

        <div className="space-y-3">
          {HUB_ITEMS.map(item => {
            const c = HUB_COLORS[item.key];
            return (
              <button
                key={item.mode}
                onClick={() => setMode(item.mode)}
                className="w-full text-left rounded-3xl p-5 transition-all active:scale-[0.98] shadow-sm"
                style={{ backgroundColor: c.bg, border: `1.5px solid ${c.border}` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800 text-sm mb-0.5">{item.label}</p>
                    <p className="text-xs" style={{ color: c.text }}>{item.subtitle}</p>
                  </div>
                  <span className="text-slate-300 font-bold text-lg ml-3">›</span>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
