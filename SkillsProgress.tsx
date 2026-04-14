import { useMemo, useState } from "react";
import {
  Flame, Star, BookOpen, ChevronLeft, Target, TrendingUp,
  AlertCircle, Lightbulb, Trophy, ArrowRight, ChevronDown, ChevronUp,
  CheckCircle2, ClipboardList, BarChart2,
} from "lucide-react";
import ProgressChart from "@/pages/ProgressChart";
import { lessons } from "@/data/lessons";
import { useProgress } from "@/store/progress";
import { useDailyChallenge } from "@/store/daily";
import { useAuth } from "@/store/authContext";
import { displayName } from "@/store/auth";
import { PT } from "@/lib/colors";

interface Props { onBack: () => void }

// ── Lesson analysis per lesson ────────────────────────────────────────────────
interface LessonStat {
  id: string;
  title: string;
  color: string;
  total: number;
  mastered: number;
  practice: number;
  pct: number;
  quizScore: number | null;
  quizTotal: number | null;
  quizPct: number | null;
  started: boolean;
  level: "strong" | "building" | "needs-work" | "untouched";
}

function gradeLesson(mastered: number, practice: number, total: number, started: boolean): LessonStat["level"] {
  if (!started) return "untouched";
  const pct = total > 0 ? (mastered / total) * 100 : 0;
  if (pct >= 70) return "strong";
  if (pct >= 30 || mastered > 0) return "building";
  return "needs-work";
}

// ── Insight generator ─────────────────────────────────────────────────────────
interface Insight {
  type: "strength" | "weakness" | "suggestion" | "streak" | "quiz" | "milestone";
  headline: string;
  detail: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
}

function buildInsights(
  stats: LessonStat[],
  streak: number,
  totalMastered: number,
  totalPractice: number,
  totalWords: number,
): Insight[] {
  const insights: Insight[] = [];

  // Streak
  if (streak >= 7) {
    insights.push({
      type: "streak",
      headline: `${streak}-day streak — incredible consistency!`,
      detail: "Daily practice is the single biggest predictor of fluency. You're building a powerful habit.",
      icon: "🔥", color: "#C2410C", bg: "#FFF7ED", border: "#FED7AA",
    });
  } else if (streak >= 3) {
    insights.push({
      type: "streak",
      headline: `${streak}-day streak — keep it going!`,
      detail: "You're forming a great routine. Aim for 7 days in a row to lock in long-term recall.",
      icon: "🔥", color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA",
    });
  } else if (streak === 0) {
    insights.push({
      type: "suggestion",
      headline: "Start your daily streak today",
      detail: "Even 5 minutes a day builds retention far faster than long occasional sessions.",
      icon: "📅", color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB",
    });
  }

  // Milestone: words mastered
  if (totalMastered >= 50) {
    insights.push({
      type: "milestone",
      headline: `${totalMastered} words mastered — fantastic!`,
      detail: "Research shows 500–1,000 words covers ~90% of everyday Portuguese conversation. You're building a real foundation.",
      icon: "🏆", color: "#92400E", bg: "#FEFCE8", border: "#FDE68A",
    });
  } else if (totalMastered >= 20) {
    insights.push({
      type: "milestone",
      headline: `${totalMastered} words under your belt`,
      detail: `${totalWords - totalMastered} words left across all lessons. You're making great progress.`,
      icon: "⭐", color: "#B45309", bg: "#FEFCE8", border: "#FDE68A",
    });
  }

  // Strong lessons — what they're good at
  const strongLessons = stats.filter(s => s.level === "strong");
  if (strongLessons.length > 0) {
    const names = strongLessons.slice(0, 2).map(s => s.title).join(" and ");
    insights.push({
      type: "strength",
      headline: `You're strong in ${names}`,
      detail: strongLessons.length === 1
        ? `${strongLessons[0].pct}% of words mastered — excellent retention. Move to a higher lesson to keep challenging yourself.`
        : `${strongLessons.map(s => `${s.title} (${s.pct}%)`).join(", ")}. Solid foundations that will accelerate your fluency.`,
      icon: "💪", color: "#065F46", bg: "#ECFDF5", border: "#A7F3D0",
    });
  }

  // Needs-work lessons — weaknesses
  const weakLessons = stats.filter(s => s.level === "needs-work");
  if (weakLessons.length > 0) {
    const top = weakLessons[0];
    insights.push({
      type: "weakness",
      headline: `${top.title} needs more attention`,
      detail: top.practice > 0
        ? `You have ${top.practice} word${top.practice > 1 ? "s" : ""} to practise here. Short, focused review sessions will make a big difference.`
        : `Only ${top.pct}% mastered so far. Try the Word Review quiz specifically for this topic.`,
      icon: "⚠️", color: "#991B1B", bg: "#FFF1F2", border: "#FECDD3",
    });
  }

  // Lessons with high practice-word ratio
  const practiceHeavy = stats.filter(s => s.practice > 0 && s.practice >= s.mastered && s.started);
  if (practiceHeavy.length > 0) {
    const top = practiceHeavy[0];
    insights.push({
      type: "weakness",
      headline: `${top.title}: practise words outnumber mastered`,
      detail: `You've flagged ${top.practice} word${top.practice > 1 ? "s" : ""} for review but only mastered ${top.mastered}. Try spacing your reviews — do a few each day rather than all at once.`,
      icon: "🔄", color: "#7C2D12", bg: "#FFF7ED", border: "#FED7AA",
    });
  }

  // Poor quiz performance
  const badQuiz = stats.filter(
    s => s.quizPct !== null && s.quizPct < 60 && s.quizTotal !== null && s.quizTotal >= 3
  );
  if (badQuiz.length > 0) {
    const top = badQuiz[0];
    insights.push({
      type: "quiz",
      headline: `Quiz score in ${top.title} can improve`,
      detail: `You scored ${top.quizScore}/${top.quizTotal} (${top.quizPct}%). Try the flashcards for that lesson first, then re-take the quiz.`,
      icon: "📝", color: "#1E40AF", bg: "#EFF6FF", border: "#BFDBFE",
    });
  }

  // Great quiz performance
  const goodQuiz = stats.filter(
    s => s.quizPct !== null && s.quizPct >= 80 && s.quizTotal !== null && s.quizTotal >= 3
  );
  if (goodQuiz.length > 0) {
    const top = goodQuiz[0];
    insights.push({
      type: "strength",
      headline: `Excellent quiz result in ${top.title}`,
      detail: `${top.quizScore}/${top.quizTotal} — you really know this material. Now try using these words in the Conjunctions quiz to practise them in sentences.`,
      icon: "🎯", color: "#065F46", bg: "#ECFDF5", border: "#A7F3D0",
    });
  }

  // Untouched lessons suggestion
  const untouched = stats.filter(s => s.level === "untouched");
  const started = stats.filter(s => s.started);
  if (untouched.length > 0 && started.length > 0) {
    const next = untouched[0];
    insights.push({
      type: "suggestion",
      headline: `Try "${next.title}" next`,
      detail: `You haven't started this lesson yet. Breadth across topics helps words stick — new vocabulary reinforces what you already know.`,
      icon: "➡️", color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE",
    });
  }

  // Overall ratio insight
  if (totalPractice > totalMastered && totalMastered > 0) {
    insights.push({
      type: "suggestion",
      headline: "Revisit before adding new words",
      detail: `You have more words to practise (${totalPractice}) than mastered (${totalMastered}). Focus on the Word Review quiz to convert practice words into mastered ones.`,
      icon: "🔁", color: "#6D28D9", bg: "#F5F3FF", border: "#DDD6FE",
    });
  }

  // Building lessons — encouragement
  const buildingLessons = stats.filter(s => s.level === "building");
  if (buildingLessons.length > 0 && strongLessons.length === 0) {
    const top = buildingLessons.sort((a, b) => b.pct - a.pct)[0];
    insights.push({
      type: "suggestion",
      headline: `${top.title} is almost there — push to 70%!`,
      detail: `You're at ${top.pct}% mastery. Just ${Math.ceil((0.7 * top.total) - top.mastered)} more words to reach "strong" level. You've got this.`,
      icon: "📈", color: "#0369A1", bg: "#E0F2FE", border: "#BAE6FD",
    });
  }

  return insights;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SkillsProgress({ onBack }: Props) {
  const { progress } = useProgress();
  const { daily } = useDailyChallenge();
  const { user } = useAuth();
  const [masteredExpanded, setMasteredExpanded] = useState(false);
  const [practiceExpanded, setPracticeExpanded] = useState(false);
  const [showChart, setShowChart] = useState(false);

  if (showChart) return <ProgressChart onBack={() => setShowChart(false)} />;

  const totalWords = useMemo(() => lessons.reduce((s, l) => s + l.items.length, 0), []);

  const lessonStats = useMemo<LessonStat[]>(() => {
    return lessons.map((lesson) => {
      const p = progress[lesson.id];
      const mastered = p?.masteredWords?.length ?? 0;
      const practice = p?.practiceWords?.length ?? 0;
      const total = lesson.items.length;
      const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
      const quizScore = p?.quizScore ?? null;
      const quizTotal = p?.quizTotal ?? null;
      const quizPct = quizScore !== null && quizTotal ? Math.round((quizScore / quizTotal) * 100) : null;
      const started = mastered > 0 || (p?.completedCards ?? 0) > 0;
      return {
        id: lesson.id, title: lesson.title, color: lesson.color, total,
        mastered, practice, pct, quizScore, quizTotal, quizPct, started,
        level: gradeLesson(mastered, practice, total, started),
      };
    });
  }, [progress]);

  const quizHubMastered = progress["quiz-hub"]?.masteredWords?.length ?? 0;
  const quizHubPractice = progress["quiz-hub"]?.practiceWords?.length ?? 0;

  const totalMastered = useMemo(() => lessonStats.reduce((s, l) => s + l.mastered, 0) + quizHubMastered, [lessonStats, quizHubMastered]);
  const totalPractice = useMemo(() => lessonStats.reduce((s, l) => s + l.practice, 0) + quizHubPractice, [lessonStats, quizHubPractice]);
  const lessonsStarted = useMemo(() => lessonStats.filter(l => l.started).length, [lessonStats]);
  const overallPct = totalWords > 0 ? Math.min(100, Math.round((totalMastered / totalWords) * 100)) : 0;

  // Accuracy = mastered / (mastered + practice) across all attempted words (including quiz hub)
  const totalAttempted = totalMastered + totalPractice;
  const accuracyPct = totalAttempted > 0 ? Math.round((totalMastered / totalAttempted) * 100) : 0;

  const insights = useMemo(
    () => buildInsights(lessonStats, daily.streak, totalMastered, totalPractice, totalWords),
    [lessonStats, daily.streak, totalMastered, totalPractice, totalWords]
  );

  // Flat word lists
  const allPracticeWords = useMemo(() => {
    const seen = new Set<string>();
    const result: { portuguese: string; english: string; lessonTitle: string }[] = [];
    // Lesson words first
    for (const lesson of lessons) {
      for (const word of progress[lesson.id]?.practiceWords ?? []) {
        if (seen.has(word)) continue;
        seen.add(word);
        const item = lesson.items.find(it => it.portuguese === word);
        if (item) result.push({ portuguese: word, english: item.english, lessonTitle: lesson.title });
        else result.push({ portuguese: word, english: "", lessonTitle: lesson.title });
      }
    }
    // Quiz Hub words (phrases not in lessons)
    for (const word of progress["quiz-hub"]?.practiceWords ?? []) {
      if (seen.has(word)) continue;
      seen.add(word);
      // Try to find English from lessons
      let english = "";
      for (const lesson of lessons) {
        const item = lesson.items.find(it => it.portuguese === word);
        if (item) { english = item.english; break; }
      }
      result.push({ portuguese: word, english, lessonTitle: "Quiz Hub" });
    }
    return result;
  }, [progress]);

  const allMasteredWords = useMemo(() => {
    const seen = new Set<string>();
    const result: { portuguese: string; english: string; lessonTitle: string }[] = [];
    for (const lesson of lessons) {
      for (const word of progress[lesson.id]?.masteredWords ?? []) {
        if (seen.has(word)) continue;
        seen.add(word);
        const item = lesson.items.find(it => it.portuguese === word);
        if (item) result.push({ portuguese: word, english: item.english, lessonTitle: lesson.title });
      }
    }
    // Quiz Hub mastered
    for (const word of progress["quiz-hub"]?.masteredWords ?? []) {
      if (seen.has(word)) continue;
      seen.add(word);
      let english = "";
      for (const lesson of lessons) {
        const item = lesson.items.find(it => it.portuguese === word);
        if (item) { english = item.english; break; }
      }
      result.push({ portuguese: word, english, lessonTitle: "Quiz Hub" });
    }
    return result;
  }, [progress]);

  const name = user ? displayName(user) : "";
  const hasAnyActivity = totalMastered > 0 || allPracticeWords.length > 0;

  const MASTERED_PREVIEW = 8;
  const PRACTICE_PREVIEW = 8;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(175deg, #f0fdf4 0%, #fefce8 40%, #fff1f2 100%)" }}>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 transition-colors active:scale-95" aria-label="Go back">
            <ChevronLeft size={20} className="text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="font-black text-base tracking-wide leading-tight" style={{ color: PT.green }}>
              {name ? `${name}'s Skills` : "My Skills"}
            </h1>
            <p className="text-[10px] text-slate-400 leading-none">Personalised insights &amp; progress</p>
          </div>
          <button
            onClick={() => setShowChart(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold active:opacity-70"
            style={{ background: "#E8D5F0", color: "#5B21B6" }}
          >
            <BarChart2 size={14} />
            Chart
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-5 pb-12">

        {/* ── Stat pills ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2.5">
          <StatPill icon={<Flame size={16} style={{ color: "#F97316" }} />} value={daily.streak} label="Day streak" bg="#FFF7ED" border="#FED7AA" />
          <StatPill icon={<Star size={16} style={{ color: PT.gold }} />} value={totalMastered} label="Words mastered" bg="#FEFCE8" border="#FDE68A" />
          <StatPill icon={<BookOpen size={16} style={{ color: PT.blue }} />} value={lessonsStarted} label="Lessons started" bg="#EFF6FF" border="#BFDBFE" />
          <StatPillPct icon={<CheckCircle2 size={16} style={{ color: PT.green }} />} value={accuracyPct} label="Accuracy" bg="#ECFDF5" border="#A7F3D0" />
        </div>

        {/* ── To-Do / Review List ──────────────────────────────── */}
        {allPracticeWords.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <div className="flex items-center gap-2">
                <ClipboardList size={14} style={{ color: PT.red }} />
                <h2 className="text-xs font-black uppercase tracking-wider" style={{ color: PT.red }}>
                  Review To-Do List
                </h2>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: PT.red }}>
                {allPracticeWords.length} item{allPracticeWords.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="bg-white rounded-3xl p-4 shadow-sm border-2 space-y-1.5"
              style={{ borderColor: "#FECDD3" }}>
              <p className="text-[10px] text-slate-400 font-medium pb-1.5 border-b border-slate-100 mb-2">
                You got these wrong on first attempt — revisit them to improve your accuracy
              </p>
              {(practiceExpanded ? allPracticeWords : allPracticeWords.slice(0, PRACTICE_PREVIEW)).map((w, i) => (
                <TodoRow key={w.portuguese} num={i + 1} portuguese={w.portuguese} english={w.english} source={w.lessonTitle} />
              ))}
              {allPracticeWords.length > PRACTICE_PREVIEW && (
                <button
                  onClick={() => setPracticeExpanded(e => !e)}
                  className="w-full pt-2 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                  style={{ color: PT.red }}
                >
                  {practiceExpanded
                    ? <><ChevronUp size={12} /> Show less</>
                    : <><ChevronDown size={12} /> Show {allPracticeWords.length - PRACTICE_PREVIEW} more to review</>}
                </button>
              )}
            </div>
          </section>
        )}

        {/* ── Overall progress + accuracy bars ─────────────────── */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp size={15} style={{ color: PT.green }} />
                <p className="text-sm font-bold text-slate-800">Overall Progress</p>
              </div>
              <span className="text-sm font-black" style={{ color: PT.green }}>{overallPct}%</span>
            </div>
            <div className="h-3 rounded-full bg-slate-100 overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${overallPct}%`, background: `linear-gradient(90deg, ${PT.green}, #10B981)` }} />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              {totalMastered} of {totalWords} words mastered
              {totalPractice > 0 ? ` · ${totalPractice} to practise` : ""}
            </p>
          </div>

          {/* Accuracy stacked bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} style={{ color: PT.green }} />
                <p className="text-sm font-bold text-slate-800">Answer Accuracy</p>
              </div>
              <span className="text-sm font-black" style={{ color: totalAttempted === 0 ? "#CBD5E1" : accuracyPct >= 70 ? PT.green : accuracyPct >= 40 ? "#D97706" : PT.red }}>
                {totalAttempted === 0 ? "—" : `${accuracyPct}%`}
              </span>
            </div>
            {totalAttempted > 0 ? (
              <div className="h-3 rounded-full bg-rose-100 overflow-hidden" style={{ border: "1px solid #FECDD3" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${accuracyPct}%`, background: `linear-gradient(90deg, ${PT.green}, #34D399)` }} />
              </div>
            ) : (
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
                <div className="h-full w-0 rounded-full" />
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1.5">
              {totalAttempted === 0
                ? "Complete a lesson to see your accuracy"
                : `${totalMastered} correct · ${totalPractice} need practice out of ${totalAttempted} attempted`}
            </p>
          </div>
        </div>

        {/* ── Per-lesson accuracy chart (always visible) ───────── */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Target size={15} style={{ color: PT.green }} />
            <p className="text-sm font-bold text-slate-800">Skills Accuracy</p>
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">per lesson</span>
          </div>
          <div className="space-y-3">
            {lessonStats.map((stat) => {
              const attempted = stat.mastered + stat.practice;
              const accPct = attempted > 0 ? Math.round((stat.mastered / attempted) * 100) : null;
              const barColor = accPct === null ? "#E2E8F0" : accPct >= 70 ? PT.green : accPct >= 40 ? "#FBBF24" : PT.red;
              return (
                <div key={stat.id}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-slate-700 truncate max-w-[60%]">{stat.title}</p>
                    <div className="flex items-center gap-1.5 text-[10px] shrink-0">
                      {accPct !== null ? (
                        <>
                          <span className="font-black" style={{ color: barColor }}>{accPct}%</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-400">{stat.mastered}✓ {stat.practice > 0 ? `${stat.practice}✗` : ""}</span>
                        </>
                      ) : (
                        <span className="text-slate-300 font-medium">not started</span>
                      )}
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: accPct === null ? "#F1F5F9" : "#FEE2E2", border: "1px solid #e2e8f0" }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: accPct !== null ? `${accPct}%` : "0%", backgroundColor: barColor }} />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
            {([["#046A38", "Strong (≥70%)"], ["#FBBF24", "Building (40–69%)"], [PT.red, "Needs work (<40%)"]] as [string,string][]).map(([c, l]) => (
              <div key={l} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c }} />
                <span className="text-[9px] text-slate-400 font-medium">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Insights ─────────────────────────────────────────── */}
        {hasAnyActivity && insights.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <Lightbulb size={14} style={{ color: "#CA8A04" }} />
              <h2 className="text-xs font-black uppercase tracking-wider text-amber-600">Insights &amp; Suggestions</h2>
            </div>
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <InsightCard key={i} insight={insight} />
              ))}
            </div>
          </section>
        )}

        {/* ── Lesson breakdown ─────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <BookOpen size={14} style={{ color: PT.green }} />
            <h2 className="text-xs font-black uppercase tracking-wider" style={{ color: PT.green }}>Lessons Breakdown</h2>
          </div>
          <div className="space-y-2.5">
            {lessonStats.map((stat) => (
              <LessonCard key={stat.id} stat={stat} />
            ))}
            {(quizHubMastered > 0 || quizHubPractice > 0) && (
              <div className="bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-slate-100">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-bold text-sm leading-snug" style={{ color: "#6D28D9" }}>🎯 Quiz Hub</p>
                    <p className="text-xs text-slate-400">Practice quizzes</p>
                  </div>
                  {(() => {
                    const total = quizHubMastered + quizHubPractice;
                    const pct = total > 0 ? Math.round((quizHubMastered / total) * 100) : 0;
                    const color = pct >= 70 ? "#046A38" : pct >= 40 ? "#FBBF24" : "#DA291C";
                    return (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 mt-0.5"
                        style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}44` }}>
                        {pct}% accurate
                      </span>
                    );
                  })()}
                </div>
                {(() => {
                  const total = quizHubMastered + quizHubPractice;
                  const pct = total > 0 ? Math.round((quizHubMastered / total) * 100) : 0;
                  const barColor = pct >= 70 ? "#046A38" : pct >= 40 ? "#FBBF24" : "#DA291C";
                  return (
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-2" style={{ border: "1px solid #e2e8f0" }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: barColor }} />
                    </div>
                  );
                })()}
                <div className="flex items-center gap-3 text-xs">
                  {quizHubMastered > 0 && (
                    <span className="flex items-center gap-1 font-semibold" style={{ color: PT.green }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: PT.green }} />
                      {quizHubMastered} correct
                    </span>
                  )}
                  {quizHubPractice > 0 && (
                    <span className="flex items-center gap-1 font-semibold" style={{ color: PT.red }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: PT.red }} />
                      {quizHubPractice} to practise
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>


        {/* ── Mastered words ───────────────────────────────────── */}
        {allMasteredWords.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <Target size={14} style={{ color: PT.green }} />
              <h2 className="text-xs font-black uppercase tracking-wider" style={{ color: PT.green }}>
                Mastered Words ({allMasteredWords.length})
              </h2>
            </div>
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-green-100 space-y-2">
              {(masteredExpanded ? allMasteredWords : allMasteredWords.slice(0, MASTERED_PREVIEW)).map((w) => (
                <WordRow key={w.portuguese} portuguese={w.portuguese} english={w.english} lessonTitle={w.lessonTitle} variant="mastered" />
              ))}
              {allMasteredWords.length > MASTERED_PREVIEW && (
                <button
                  onClick={() => setMasteredExpanded(e => !e)}
                  className="w-full pt-2 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                  style={{ color: PT.green }}
                >
                  {masteredExpanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show {allMasteredWords.length - MASTERED_PREVIEW} more</>}
                </button>
              )}
            </div>
          </section>
        )}

        {/* ── Empty state ──────────────────────────────────────── */}
        {!hasAnyActivity && (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100">
            <p className="text-3xl mb-3">📚</p>
            <p className="font-bold text-slate-700 mb-1">No activity yet</p>
            <p className="text-sm text-slate-400 mb-4">Complete a lesson or Word Review quiz to start tracking your skills.</p>
            <button onClick={onBack} className="text-xs font-bold px-5 py-2.5 rounded-2xl text-white transition-all active:scale-95" style={{ backgroundColor: PT.green }}>
              Start Learning →
            </button>
          </div>
        )}

      </main>
    </div>
  );
}

// ── Insight card ──────────────────────────────────────────────────────────────

function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div
      className="rounded-2xl px-4 py-3.5 flex items-start gap-3"
      style={{ backgroundColor: insight.bg, border: `1.5px solid ${insight.border}` }}
    >
      <span className="text-xl shrink-0 mt-0.5">{insight.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black leading-snug" style={{ color: insight.color }}>{insight.headline}</p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{insight.detail}</p>
      </div>
    </div>
  );
}

// ── Lesson card ───────────────────────────────────────────────────────────────

const LEVEL_META: Record<LessonStat["level"], { label: string; color: string; bg: string; border: string; barColor: string }> = {
  strong:      { label: "Strong",      color: "#065F46", bg: "#ECFDF5", border: "#A7F3D0", barColor: PT.green },
  building:    { label: "Building",    color: "#92400E", bg: "#FEFCE8", border: "#FDE68A", barColor: "#FBBF24" },
  "needs-work":{ label: "Needs Work",  color: "#991B1B", bg: "#FFF1F2", border: "#FECDD3", barColor: PT.red },
  untouched:   { label: "Not Started", color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", barColor: "#CBD5E1" },
};

function LessonCard({ stat }: { stat: LessonStat }) {
  const meta = LEVEL_META[stat.level];
  return (
    <div className="bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm leading-snug" style={{ color: stat.color }}>{stat.title}</p>
          <p className="text-xs text-slate-400">{stat.total} words</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          {stat.quizScore !== null && stat.quizTotal && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0" }}>
              Quiz {stat.quizScore}/{stat.quizTotal}
            </span>
          )}
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded-full"
            style={{ backgroundColor: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
          >
            {meta.label}
          </span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-2" style={{ border: "1px solid #e2e8f0" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${stat.pct}%`, backgroundColor: meta.barColor }} />
      </div>
      <div className="flex items-center gap-3 text-xs">
        {stat.mastered > 0 && (
          <span className="flex items-center gap-1 font-semibold" style={{ color: PT.green }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: PT.green }} />
            {stat.mastered} mastered
          </span>
        )}
        {stat.practice > 0 && (
          <span className="flex items-center gap-1 font-semibold" style={{ color: PT.red }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: PT.red }} />
            {stat.practice} to practise
          </span>
        )}
        {!stat.started && (
          <span className="text-slate-300 flex items-center gap-1">
            <ArrowRight size={10} /> Ready to start
          </span>
        )}
        {stat.started && stat.mastered === 0 && stat.practice === 0 && (
          <span className="text-slate-300">Started — no quiz data yet</span>
        )}
      </div>
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────

function StatPill({ icon, value, label, bg, border }: { icon: React.ReactNode; value: number; label: string; bg: string; border: string }) {
  return (
    <div className="rounded-2xl px-3 py-3.5 text-center" style={{ backgroundColor: bg, border: `1.5px solid ${border}` }}>
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-xl font-black text-slate-800 leading-none">{value}</p>
      <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

function StatPillPct({ icon, value, label, bg, border }: { icon: React.ReactNode; value: number; label: string; bg: string; border: string }) {
  return (
    <div className="rounded-2xl px-3 py-3.5 text-center" style={{ backgroundColor: bg, border: `1.5px solid ${border}` }}>
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-xl font-black text-slate-800 leading-none">{value > 0 ? `${value}%` : "—"}</p>
      <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

// ── Word row ──────────────────────────────────────────────────────────────────

function WordRow({ portuguese, english, lessonTitle, variant }: { portuguese: string; english: string; lessonTitle: string; variant: "mastered" | "practice" }) {
  const dot = variant === "mastered" ? PT.green : PT.red;
  return (
    <div className="flex items-center gap-3 py-0.5">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dot }} />
      <div className="flex-1 min-w-0 flex items-baseline gap-2">
        <span className="font-bold text-sm text-slate-800">{portuguese}</span>
        <span className="text-xs text-slate-400 truncate">{english}</span>
      </div>
      <span className="text-[10px] text-slate-300 shrink-0 hidden sm:block">{lessonTitle}</span>
    </div>
  );
}

// ── To-Do row ─────────────────────────────────────────────────────────────────

function TodoRow({ num, portuguese, english, source }: { num: number; portuguese: string; english: string; source: string }) {
  const isQuizHub = source === "Quiz Hub";
  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-slate-50 last:border-0">
      <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black text-white"
        style={{ backgroundColor: PT.red }}>
        {num}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-bold text-sm text-slate-800">{portuguese}</span>
          {english && <span className="text-xs text-slate-400">{english}</span>}
        </div>
      </div>
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
        style={{
          backgroundColor: isQuizHub ? "#F5F3FF" : "#FFF7ED",
          color: isQuizHub ? "#7C3AED" : "#C2410C",
          border: `1px solid ${isQuizHub ? "#DDD6FE" : "#FED7AA"}`,
        }}>
        {source}
      </span>
    </div>
  );
}
