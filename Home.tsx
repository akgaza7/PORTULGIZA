import { useState, useEffect, useRef } from "react";
import logoImg from "@assets/PORTULGIZA ICON.png";
import carImg from "@assets/Car_1775995617306.jpg";
import { Link } from "wouter";
import { lessons, lessons1, lessons2 } from "@/data/lessons";
import { useProgress } from "@/store/progress";
import { useDailyChallenge } from "@/store/daily";
import { loadOnboarding } from "@/store/onboarding";
import { Star, Flame, CheckCircle, Zap, BarChart2 } from "lucide-react";
import TranslationWord from "@/components/TranslationWord";
import AppHeader from "@/components/AppHeader";
import DailyQuiz from "@/components/DailyQuiz";
import UpgradeScreen from "@/components/UpgradeScreen";
import QuizHub, { type QuizMode } from "@/pages/QuizHub";
import SkillsProgress from "@/pages/SkillsProgress";
import { PT } from "@/lib/colors";
import { useAuth } from "@/store/authContext";
import { hasFullAccess, trialDaysLeft, isTrialActive, displayName, updatePreferredName } from "@/store/auth";


export default function Home() {
  const { progress, refresh: refreshProgress } = useProgress();
  const { daily, complete } = useDailyChallenge();
  const [showDailyQuiz, setShowDailyQuiz] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [quizMode, setQuizMode] = useState<QuizMode | null>(null);
  const [showSkills, setShowSkills] = useState(false);
  const [showEditName, setShowEditName] = useState(false);
  const carActive = useAutoCarAnimation();
  const [editNameValue, setEditNameValue] = useState("");
  const ptTitles: Record<string, string> = {
    greetings: "Saudações",
    numbers: "Números",
    food: "Comida e Bebida",
    travel: "Viagem",
    "pronouns-prepositions": "Pronomes Tónicos",
    "essential-verbs": "Verbos",
    "everyday-nouns": "Nomes",
    "adjectives": "Adjetivos",
    "intermediate-numbers": "Números Avançados",
    "possessive-pronouns": "Pronomes Possessivos",
    "conjunctions": "Conjunções",
  };
  const { level } = loadOnboarding();
  const { user, refresh } = useAuth();

  const totalCards = lessons.reduce((sum, l) => sum + l.items.length, 0);
  const studiedCards = Object.values(progress).reduce(
    (sum, p) => sum + (p.masteredWords?.length || p.completedCards || 0), 0
  );
  const overallPercent = totalCards > 0 ? Math.min(100, Math.round((studiedCards / totalCards) * 100)) : 0;

  const fullAccess = user ? hasFullAccess(user) : false;
  const daysLeft = user ? trialDaysLeft(user) : 0;
  const trialOn = user ? isTrialActive(user) : false;

  // Level 2 unlocks when at least 3 of the 4 Level 1 lessons have been started
  // (Akilla always gets full access for testing)
  const isAkillaUser = user
    ? [user.preferredName ?? "", user.name].join(" ").toLowerCase().includes("akilla")
    : false;
  const level1StartedCount = lessons1.filter((l) => {
    const p = progress[l.id];
    return (p?.masteredWords?.length ?? 0) > 0 || (p?.completedCards ?? 0) > 0;
  }).length;
  const level2Unlocked = isAkillaUser || level1StartedCount >= 3;

  if (showUpgrade) {
    return (
      <UpgradeScreen
        isExpired={!trialOn}
        onSubscribed={() => { refresh(); setShowUpgrade(false); }}
        onDismiss={() => setShowUpgrade(false)}
      />
    );
  }

  if (showDailyQuiz) {
    return (
      <DailyQuiz
        questionKeys={daily.questionKeys}
        currentStreak={daily.streak}
        onComplete={() => { complete(); refreshProgress(); }}
        onBack={() => setShowDailyQuiz(false)}
      />
    );
  }

  if (quizMode !== null) {
    return <QuizHub onBack={() => setQuizMode(null)} initialMode={quizMode} />;
  }

  if (showSkills) {
    return <SkillsProgress onBack={() => setShowSkills(false)} />;
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(175deg, #f0fdf4 0%, #fefce8 40%, #fff1f2 100%)" }}>
      <HomeCarAnimation active={carActive} />
      <AppHeader
        right={
          user ? (
            <div className="flex-1 min-w-0 pl-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700 truncate">{displayName(user)}</span>
                <span className="text-xs font-black shrink-0 ml-2" style={{ color: overallPercent > 0 ? PT.green : "#94a3b8" }}>
                  {overallPercent}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${overallPercent}%`, background: `linear-gradient(90deg, ${PT.green}, #10B981)` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                {overallPercent === 0 ? "Start a lesson to track progress" : `${studiedCards} of ${totalCards} words mastered`}
              </p>
            </div>
          ) : undefined
        }
      />

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">
{/* 🔹 BRAND HEADER */}
<div className="flex flex-col items-center mb-2">
  <img
    src={logoImg}
    alt="Portulgiza Logo"
    className="w-20 h-20 mb-2"
  />
  <h1 className="text-2xl font-black text-center" style={{ color: "#065F46" }}>
    PORTULGIZA
  </h1>
  <p className="text-xs text-slate-500 text-center">
    Learn Portuguese the smart way 🇵🇹
  </p>
</div>

{/* 🔹 HERO CARD */}
<div
  className="rounded-3xl p-5 text-white shadow-md"
  style={{
    background: "linear-gradient(135deg, #065F46, #16a34a)"
  }}
>
  <h2 className="text-lg font-black mb-1">
    Learn Portuguese 🇵🇹
  </h2>
  <p className="text-xs opacity-90">
    Speak with confidence. Practice daily. Build your streak.
  </p>

  <button
    onClick={() => setShowDailyQuiz(true)}
    className="mt-3 bg-white text-green-700 px-4 py-2 rounded-xl text-xs font-bold"
  >
    Start Today →
  </button>
</div>

        {/* ── Level badge + streak row ───────────────────────────── */}
        <div className="pt-1 flex items-center gap-3 flex-wrap">
          {level === "beginner" ? (
            <span className="inline-flex items-center gap-3 font-black text-base tracking-wide">
              <span style={{ color: "#FBBF24" }}>BEGIN</span>
              <span style={{ color: "#10B981" }}>PRINCIPIANTE</span>
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full font-bold text-base bg-blue-100 text-blue-700">
              Intermediate
            </span>
          )}
          {daily.streak > 0 && (
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: PT.goldBg, border: `1px solid ${PT.goldBorder}`, color: PT.goldText }}
            >
              <Flame size={12} style={{ color: PT.gold }} />
              {daily.streak}d streak
            </div>
          )}
        </div>

        {/* ── Welcome greeting with edit-name pencil ────────────── */}
        {user && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm leading-relaxed text-slate-600">
              <span className="font-bold" style={{ color: PT.green }}>Olá, {displayName(user)}</span>
              {" "}— welcome back, ready for next learning levels? Let's go…
            </p>
            <button
              onClick={() => { setEditNameValue(displayName(user)); setShowEditName(true); }}
              className="shrink-0 text-base leading-none text-slate-300 hover:text-slate-500 transition-colors"
              title="Edit your preferred name"
              aria-label="Edit preferred name"
            >
              ✎
            </button>
          </div>
        )}

        {/* ── My Skills button ──────────────────────────────── */}
        <button
          onClick={() => setShowSkills(true)}
          className="w-full flex items-center justify-between rounded-3xl px-5 py-4 bg-white shadow-sm transition-all active:scale-[0.98]"
          style={{ border: `1.5px solid #BFDBFE` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "#EFF6FF" }}
            >
              <BarChart2 size={18} style={{ color: PT.blue }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-black" style={{ color: PT.blue }}>My Skills</p>
              <p className="text-xs text-slate-400">Track your word mastery &amp; progress</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full text-white" style={{ backgroundColor: PT.blue }}>
            View →
          </span>
        </button>

        {/* 1. Daily Challenge */}
        {fullAccess && (
          <DailyChallengeCard
            completed={daily.completed}
            streak={daily.streak}
            onStart={() => setShowDailyQuiz(true)}
          />
        )}

        {/* 1b. QUIZZES section */}
        <div>
          <h2 className="text-2xl font-black text-center tracking-widest mb-3" style={{ color: PT.green }}>
            QUIZZES
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {([
              { mode: "mcq",           label: "MULTIPLE CHOICE" },
              { mode: "truefalse",     label: "TRUE OR FALSE" },
              { mode: "openended",     label: "OPEN-ENDED" },
              { mode: "fillblank",     label: "FILL IN THE BLANK" },
              { mode: "picture",       label: "PICTURE" },
              { mode: "audio",         label: "AUDIO" },
              { mode: "scored",        label: "SCORED CHALLENGE" },
              { mode: "ordering",      label: "PUT IN ORDER" },
              { mode: "multiresponse", label: "MULTI-SELECT" },
              { mode: "fillgap",       label: "FILL THE GAP" },
              { mode: "oddoneout",     label: "ODD ONE OUT" },
              { mode: "matchpairs",    label: "MATCH THE PAIRS" },
              { mode: "categorise",    label: "CATEGORISE" },
            ] as { mode: QuizMode; label: string }[]).map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => setQuizMode(mode)}
                className="rounded-2xl px-3 py-3.5 text-center font-black text-xs tracking-wide transition-all active:scale-[0.96] shadow-sm"
                style={{ backgroundColor: PT.green, color: "#FFCC29" }}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setQuizMode("builder")}
              className="col-span-2 rounded-2xl px-3 py-3.5 text-center font-black text-xs tracking-wide transition-all active:scale-[0.96] shadow-sm"
              style={{ backgroundColor: PT.green, color: "#FFCC29" }}
            >
              CREATE YOUR OWN QUIZ
            </button>
          </div>
        </div>

        {/* 2. Personalised tip */}
        <div
          className="rounded-3xl px-5 py-4 bg-white"
          style={{ border: "1.5px solid #F2C94C" }}
        >
          <p className="text-sm leading-relaxed text-slate-900">
            {level === "beginner"
              ? "Hearing words is just as important as reading them. Tap a greeting word to hear it and read it. Let's go…"
              : "Challenge yourself with Timed quiz mode to sharpen your recall under pressure. The streak system keeps you consistent!"}
          </p>

          {/* Interactive word teasers */}
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid #FDE68A" }}>
            <div className="flex flex-wrap gap-x-7 gap-y-2.5 justify-center">
              {level === "beginner" ? (
                <>
                  <WordToken english="Hello" portuguese="Olá" />
                  <WordToken english="Thank you" portuguese="Obrigado" />
                  <WordToken english="Yes" portuguese="Sim" />
                  <WordToken english="No" portuguese="Não" />
                  <WordToken english="Please" portuguese="Por favor" />
                </>
              ) : (
                <>
                  <WordToken english="Where is…?" portuguese="Onde fica…?" />
                  <WordToken english="I would like" portuguese="Eu queria" />
                  <WordToken english="How much?" portuguese="Quanto custa?" />
                  <WordToken english="Excuse me" portuguese="Com licença" />
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3. Lesson categories — Level 1 */}
        <div>
          <h2 className="text-xs uppercase tracking-wider mb-3 px-1 flex items-center gap-3">
            <span className="font-black" style={{ color: PT.blue }}>Level 1</span>
            <span style={{ color: "#FBBF24", fontWeight: 400 }}>Beginner</span>
            <span style={{ color: PT.green, fontWeight: 700 }}>Principiante</span>
          </h2>
          <div className="space-y-3">
            {lessons1.map((lesson, lessonIdx) => {
              const p = progress[lesson.id];
              const total = lesson.items.length;
              const masteredCount = p?.masteredWords?.length ?? 0;
              const practiceCount = p?.practiceWords?.length ?? 0;
              const pct = total > 0 ? Math.round((masteredCount / total) * 100) : 0;
              const hasQuiz = p?.quizScore !== null && p?.quizScore !== undefined;
              const isUntouched = masteredCount === 0 && !hasQuiz;
              const locked = lessonIdx > 0 && !fullAccess;
              const showStartHere = level === "beginner" && lessonIdx === 0 && isUntouched;
              const showChallenge = level === "intermediate" && pct >= 50 && !hasQuiz;

              const card = (
                <div
                  className={`bg-white rounded-3xl p-4 shadow-sm border border-slate-100 transition-all ${locked ? "opacity-70" : "hover:shadow-md hover:border-slate-200 active:scale-[0.98] cursor-pointer"}`}
                  data-testid={`card-lesson-${lesson.id}`}
                >
                  {/* Level 1 badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="text-xs font-black px-2 py-0.5 rounded-full tracking-wide"
                      style={{ backgroundColor: "#eff6ff", color: PT.blue, border: "1px solid #bfdbfe" }}
                    >
                      LVL 1
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex-1 min-w-0 mr-2">
                          <h3 className="font-bold leading-snug">
                            <span style={{ color: "#D97706" }}>{lesson.title}</span>
                            {ptTitles[lesson.id] && (
                              <span style={{ color: PT.green }}> {ptTitles[lesson.id]}</span>
                            )}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {locked && (
                            <button
                              onClick={(e) => { e.preventDefault(); setShowUpgrade(true); }}
                              className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                              style={{ backgroundColor: PT.goldBg, color: PT.goldText, border: `1px solid ${PT.goldBorder}` }}
                            >
                              <Zap size={10} /> Unlock
                            </button>
                          )}
                          {!locked && showStartHere && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                              Start here
                            </span>
                          )}
                          {!locked && showChallenge && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              Try quiz ⚡
                            </span>
                          )}
                          {!locked && hasQuiz && (
                            <span
                              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{ color: PT.goldText, backgroundColor: PT.goldBg }}
                            >
                              <Star size={11} fill={PT.gold} style={{ color: PT.gold }} />
                              {Math.min(p?.quizScore ?? 0, p?.quizTotal ?? 0)}/{p?.quizTotal}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-2 leading-snug">{lesson.description}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: locked ? "#94a3b8" : lesson.color }} />
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">{pct}%</span>
                      </div>
                      {(masteredCount > 0 || practiceCount > 0) && (
                        <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                          <span style={{ color: "#16a34a", fontWeight: 600 }}>{masteredCount} mastered</span>
                          {practiceCount > 0 && (
                            <span> · <span style={{ color: "#dc2626", fontWeight: 600 }}>{practiceCount} to practise</span></span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );

              return locked ? (
                <div key={lesson.id}>{card}</div>
              ) : (
                <Link key={lesson.id} href={`/lesson/${lesson.id}`}>
                  {card}
                </Link>
              );
            })}
          </div>
        </div>

        {/* 4. Lesson categories — Level 2 */}
        <div>
          <h2 className="text-xs uppercase tracking-wider mb-3 px-1 flex items-center gap-3">
            <span className="font-black" style={{ color: "#e11d48" }}>Level 2</span>
            <span style={{ color: "#FBBF24", fontWeight: 400 }}>Intermediate</span>
            <span style={{ color: PT.green, fontWeight: 700 }}>Intermédio</span>
            {!level2Unlocked && (
              <span className="ml-auto text-xs font-semibold text-slate-400">🔒 locked</span>
            )}
          </h2>

          {/* Gate — shown when not enough Level 1 progress */}
          {!level2Unlocked && (
            <div
              className="rounded-3xl px-5 py-5 bg-white border border-slate-100 shadow-sm text-center"
              data-testid="level2-gate"
            >
              <p className="text-2xl mb-2">🔒</p>
              <p className="text-sm font-bold text-slate-700 mb-1">Level 2 is locked</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Start at least <span className="font-semibold text-slate-700">3 of the 4 Level 1 lessons</span> to unlock intermediate content.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((level1StartedCount / lessons1.length) * 100)}%`, backgroundColor: "#e11d48" }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-500 shrink-0">
                  {level1StartedCount}/{lessons1.length}
                </span>
              </div>
            </div>
          )}

          {/* Level 2 lesson cards */}
          {level2Unlocked && (
            <div className="space-y-3">
              {lessons2.map((lesson, lessonIdx) => {
                const p = progress[lesson.id];
                const total = lesson.items.length;
                const masteredCount = p?.masteredWords?.length ?? 0;
                const practiceCount = p?.practiceWords?.length ?? 0;
                const pct = total > 0 ? Math.round((masteredCount / total) * 100) : 0;
                const hasQuiz = p?.quizScore !== null && p?.quizScore !== undefined;
                const showChallenge = pct >= 50 && !hasQuiz;
                const locked = !fullAccess;

                const card = (
                  <div
                    className={`bg-white rounded-3xl p-4 shadow-sm border border-slate-100 transition-all ${locked ? "opacity-70" : "hover:shadow-md hover:border-slate-200 active:scale-[0.98] cursor-pointer"}`}
                    data-testid={`card-lesson-${lesson.id}`}
                  >
                    {/* Level 2 accent strip */}
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="text-xs font-black px-2 py-0.5 rounded-full tracking-wide"
                        style={{ backgroundColor: "#fff1f2", color: "#e11d48", border: "1px solid #fecdd3" }}
                      >
                        LVL 2
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex-1 min-w-0 mr-2">
                            <h3 className="font-bold leading-snug">
                              <span style={{ color: "#D97706" }}>{lesson.title}</span>
                              {ptTitles[lesson.id] && (
                                <span style={{ color: PT.green }}> · {ptTitles[lesson.id]}</span>
                              )}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {locked && (
                              <button
                                onClick={(e) => { e.preventDefault(); setShowUpgrade(true); }}
                                className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                                style={{ backgroundColor: PT.goldBg, color: PT.goldText, border: `1px solid ${PT.goldBorder}` }}
                              >
                                <Zap size={10} /> Unlock
                              </button>
                            )}
                            {!locked && showChallenge && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                Try quiz ⚡
                              </span>
                            )}
                            {!locked && hasQuiz && (
                              <span
                                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
                                style={{ color: PT.goldText, backgroundColor: PT.goldBg }}
                              >
                                <Star size={11} fill={PT.gold} style={{ color: PT.gold }} />
                                {Math.min(p?.quizScore ?? 0, p?.quizTotal ?? 0)}/{p?.quizTotal}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mb-2 leading-snug">{lesson.description}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: locked ? "#94a3b8" : lesson.color }} />
                          </div>
                          <span className="text-xs text-slate-400 shrink-0">{pct}%</span>
                        </div>
                        {(masteredCount > 0 || practiceCount > 0) && (
                          <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                            <span style={{ color: "#16a34a", fontWeight: 600 }}>{masteredCount} mastered</span>
                            {practiceCount > 0 && (
                              <span> · <span style={{ color: "#dc2626", fontWeight: 600 }}>{practiceCount} to practise</span></span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );

                return locked ? (
                  <div key={lesson.id}>{card}</div>
                ) : (
                  <Link key={lesson.id} href={`/lesson/${lesson.id}`}>
                    {card}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Upgrade / trial banners — always at the bottom ─── */}
        {user && !fullAccess && (
          <div
            className="rounded-3xl px-5 py-4 flex items-center justify-between gap-3"
            style={{ background: `linear-gradient(135deg, #fdecea, #fff5f5)`, border: `1.5px solid ${PT.redBorder}` }}
          >
            <div>
              <p className="text-sm font-bold" style={{ color: PT.red }}>Your free trial has ended</p>
              <p className="text-xs text-slate-500 mt-0.5">Unlock full access to continue learning</p>
            </div>
            <button
              onClick={() => setShowUpgrade(true)}
              className="shrink-0 px-4 py-2 rounded-2xl text-white text-xs font-bold transition-all active:scale-[0.97]"
              style={{ backgroundColor: PT.red }}
              data-testid="button-upgrade-banner"
            >
              Upgrade
            </button>
          </div>
        )}
        {user && trialOn && daysLeft <= 3 && (
          <div
            className="rounded-3xl px-5 py-4 flex items-center justify-between gap-3"
            style={{ backgroundColor: PT.goldBg, border: `1.5px solid ${PT.goldBorder}` }}
          >
            <div>
              <p className="text-sm font-bold" style={{ color: PT.goldText }}>
                {daysLeft === 1 ? "Last day of your free trial!" : `${daysLeft} days left in your free trial`}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Subscribe to keep all access at £4.99/mo</p>
            </div>
            <button
              onClick={() => setShowUpgrade(true)}
              className="shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition-all active:scale-[0.97]"
              style={{ backgroundColor: PT.gold, color: "#1a1000" }}
            >
              Upgrade
            </button>
          </div>
        )}

      </main>

      {/* ── Edit preferred name modal ── */}
      {showEditName && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowEditName(false); }}
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 w-full max-w-sm">
            <h2 className="text-base font-bold text-slate-800 mb-1">Edit preferred name</h2>
            <p className="text-xs text-slate-400 mb-4">This is how we'll greet you in the app.</p>
            <input
              type="text"
              value={editNameValue}
              onChange={(e) => setEditNameValue(e.target.value)}
              placeholder="What would you like to be called?"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:border-blue-400 transition-colors"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && editNameValue.trim()) {
                  updatePreferredName(editNameValue); refresh(); setShowEditName(false);
                }
              }}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowEditName(false)}
                className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editNameValue.trim()) {
                    updatePreferredName(editNameValue); refresh(); setShowEditName(false);
                  }
                }}
                className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold transition-all active:scale-[0.98]"
                style={{ backgroundColor: PT.green }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Word Token ───────────────────────────────────────────────────────────────

function WordToken({ english, portuguese }: { english: string; portuguese: string }) {
  return (
    <span className="text-base" style={{ color: "#FBBF24" }}>
      <TranslationWord english={english} portuguese={portuguese} />
    </span>
  );
}

// ─── Home Car Animation (fires every 7 s automatically) ──────────────────────

function useAutoCarAnimation() {
  const [carActive, setCarActive] = useState(false);
  const clearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function fire() {
      setCarActive(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setCarActive(true);
          if (clearRef.current) clearTimeout(clearRef.current);
          clearRef.current = setTimeout(() => setCarActive(false), 4400);
        });
      });
    }

    const initial = setTimeout(fire, 2500);
    const interval = setInterval(fire, 7000);

    return () => {
      clearTimeout(initial);
      clearInterval(interval);
      if (clearRef.current) clearTimeout(clearRef.current);
    };
  }, []);

  return carActive;
}

function HomeCarAnimation({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div
      className="fixed bottom-20 left-0 w-full z-50 pointer-events-none overflow-hidden"
      style={{ height: 80 }}
    >
      <div className="car-zoom absolute bottom-0 left-0">
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
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Daily Challenge Card ─────────────────────────────────────────────────────

function DailyChallengeCard({
  completed,
  streak,
  onStart,
}: {
  completed: boolean;
  streak: number;
  onStart: () => void;
}) {
  return (
    <div
      className="rounded-3xl p-5 border-2 shadow-sm transition-all bg-white"
      style={
        completed
          ? { borderColor: PT.greenBorder }
          : { borderColor: "#e2e8f0", cursor: "pointer" }
      }
      onClick={!completed ? onStart : undefined}
      data-testid="card-daily-challenge"
    >
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
          style={{ backgroundColor: completed ? PT.greenBg : PT.blueBg }}
        >
          {completed ? "✅" : "🔥"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-black text-base uppercase tracking-wide" style={{ color: PT.blue }}>
              Daily Challenge
            </p>
            {streak > 0 && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ color: PT.goldText, backgroundColor: PT.goldBg, border: `1px solid ${PT.goldBorder}` }}
              >
                Day {streak}
              </span>
            )}
          </div>

          {completed ? (
            <>
              <p className="text-sm font-semibold flex items-center gap-1" style={{ color: PT.green }}>
                <CheckCircle size={14} style={{ color: PT.green }} />
                Completed Today ✅
              </p>
              <p className="text-xs mt-1" style={{ color: PT.green }}>
                Come back tomorrow to continue your streak 🌟
              </p>
            </>
          ) : (
            <>
              <p className="text-sm" style={{ color: "#111827" }}>
                5 questions from all lessons
              </p>
              {streak > 0 ? (
                <p className="text-xs font-semibold mt-0.5" style={{ color: "#111827" }}>
                  Keep your {streak}-day streak going!
                </p>
              ) : (
                <p className="text-xs mt-0.5" style={{ color: "#111827" }}>
                  Complete daily to build a streak
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {streak > 0 && (
        <div className="mt-4 pt-3" style={{ borderTop: "1px solid #e2e8f0" }}>
          <div className="flex items-center gap-1.5 flex-wrap">
            {Array.from({ length: Math.min(streak, 14) }).map((_, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                style={{ backgroundColor: completed || i < streak - 1 ? PT.gold : PT.goldBorder }}
                title={`Day ${i + 1}`}
              >
                {i < streak - (completed ? 0 : 1) ? "🔥" : streak > 0 && completed ? "🔥" : ""}
              </div>
            ))}
            {streak > 14 && (
              <span className="text-xs font-bold" style={{ color: PT.goldText }}>+{streak - 14} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
