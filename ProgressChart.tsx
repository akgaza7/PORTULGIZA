import { useMemo } from "react";
import { ChevronLeft, BookOpen } from "lucide-react";
import { loadLog, type WordEvent } from "@/store/progressLog";
import { loadProgress } from "@/store/progress";
import { PT } from "@/lib/colors";

interface Props { onBack: () => void }

const PASTEL_COLS = [
  { bg: "#FFD6D6", header: "#FFB3B3", text: "#7A0000" },
  { bg: "#FFE5CC", header: "#FFCFA0", text: "#7A3600" },
  { bg: "#FFFACC", header: "#FFF3A0", text: "#5A4A00" },
  { bg: "#D6FFD6", header: "#A8F0A8", text: "#005A00" },
  { bg: "#CCF5F0", header: "#9AE8E0", text: "#004A44" },
  { bg: "#CCE5FF", header: "#9AC8FF", text: "#003878" },
  { bg: "#E5CCFF", header: "#CCA8FF", text: "#3A007A" },
  { bg: "#FFD6F0", header: "#FFB3E0", text: "#7A0050" },
  { bg: "#FFE5E5", header: "#FFBDBD", text: "#7A1515" },
  { bg: "#FFF0CC", header: "#FFE0A0", text: "#5A3A00" },
  { bg: "#E5FFE5", header: "#C0F5C0", text: "#00520A" },
  { bg: "#D6F5FF", header: "#A8E8FF", text: "#003C5A" },
  { bg: "#E8D6FF", header: "#D0A8FF", text: "#3A0070" },
  { bg: "#FFD6E8", header: "#FFB3D0", text: "#7A0038" },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function groupByDate(events: WordEvent[]): Map<string, WordEvent[]> {
  const map = new Map<string, WordEvent[]>();
  for (const ev of events) {
    const key = ev.ts.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  return map;
}

export default function ProgressChart({ onBack }: Props) {
  const { words, dateRows, colPalette, totalCorrect, totalWrong, lessonLabels } = useMemo(() => {
    const log = loadLog();
    const progress = loadProgress();

    if (log.length === 0) {
      return { words: [], dateRows: [], colPalette: [], totalCorrect: 0, totalWrong: 0, lessonLabels: {} };
    }

    const allWords = Array.from(new Set(log.map((e) => e.word)));
    const wordLastSeen = new Map<string, string>();
    for (const ev of log) {
      const prev = wordLastSeen.get(ev.word);
      if (!prev || ev.ts > prev) wordLastSeen.set(ev.word, ev.ts);
    }
    const sortedWords = allWords
      .sort((a, b) => (wordLastSeen.get(b) ?? "").localeCompare(wordLastSeen.get(a) ?? ""))
      .slice(0, 30);

    const lessonLabels: Record<string, string> = {};
    for (const ev of log) {
      if (!lessonLabels[ev.word]) lessonLabels[ev.word] = ev.lessonId;
    }

    const byDate = groupByDate(log);
    const sortedDates = Array.from(byDate.keys()).sort().reverse();

    const dateRows = sortedDates.map((date) => {
      const eventsOnDay = byDate.get(date)!;
      const cells: Record<string, { correct: number; wrong: number }> = {};
      for (const ev of eventsOnDay) {
        if (!sortedWords.includes(ev.word)) continue;
        if (!cells[ev.word]) cells[ev.word] = { correct: 0, wrong: 0 };
        if (ev.result === "correct") cells[ev.word].correct++;
        else cells[ev.word].wrong++;
      }
      return { date, cells };
    });

    const colPalette = sortedWords.map((_, i) => PASTEL_COLS[i % PASTEL_COLS.length]);

    let totalCorrect = 0;
    let totalWrong = 0;
    for (const ev of log) {
      if (ev.result === "correct") totalCorrect++;
      else totalWrong++;
    }

    return { words: sortedWords, dateRows, colPalette, totalCorrect, totalWrong, lessonLabels };
  }, []);

  const totalsPerWord = useMemo(() => {
    const log = loadLog();
    return words.map((w) => ({
      correct: log.filter((e) => e.word === w && e.result === "correct").length,
      wrong: log.filter((e) => e.word === w && e.result === "wrong").length,
    }));
  }, [words]);

  const isEmpty = words.length === 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f8fafc" }}>
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white shadow-sm">
        <button onClick={onBack} className="p-2 rounded-full active:bg-slate-100">
          <ChevronLeft size={22} style={{ color: PT.green }} />
        </button>
        <h1 className="text-lg font-black text-slate-800 tracking-tight flex-1">Learning Progress Tracker</h1>
      </div>

      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#e8f5e9" }}>
            <BookOpen size={32} style={{ color: PT.green }} />
          </div>
          <p className="text-slate-700 font-bold text-lg">No data yet</p>
          <p className="text-slate-500 text-sm max-w-xs">Complete some lessons or quizzes and your progress will appear here as a colourful chart!</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-3 flex gap-3">
            <div className="flex-1 rounded-2xl p-3 text-center" style={{ background: "#d1fae5" }}>
              <p className="text-2xl font-black" style={{ color: PT.green }}>{totalCorrect}</p>
              <p className="text-xs font-semibold text-green-700 mt-0.5">✓ Correct</p>
            </div>
            <div className="flex-1 rounded-2xl p-3 text-center" style={{ background: "#fee2e2" }}>
              <p className="text-2xl font-black" style={{ color: "#DC2626" }}>{totalWrong}</p>
              <p className="text-xs font-semibold text-red-600 mt-0.5">✗ Needs Work</p>
            </div>
            <div className="flex-1 rounded-2xl p-3 text-center" style={{ background: "#eff6ff" }}>
              <p className="text-2xl font-black" style={{ color: "#1D4ED8" }}>{words.length}</p>
              <p className="text-xs font-semibold text-blue-600 mt-0.5">Words Seen</p>
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-auto flex-1 px-2 pb-6">
            <table className="border-separate border-spacing-0" style={{ minWidth: `${90 + words.length * 58}px` }}>
              <thead>
                <tr>
                  <th
                    className="sticky left-0 z-10 text-left text-xs font-bold text-slate-600 px-2 py-1 border border-slate-200 rounded-tl-lg"
                    style={{ background: "#E8D5F0", minWidth: 90, width: 90 }}
                  >
                    Date
                  </th>
                  {words.map((word, i) => (
                    <th
                      key={word}
                      className="border border-slate-200 p-0 align-bottom"
                      style={{ background: colPalette[i].header, width: 58, minWidth: 58 }}
                    >
                      <div
                        style={{
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)",
                          fontSize: 11,
                          fontWeight: 800,
                          color: colPalette[i].text,
                          padding: "8px 6px",
                          maxHeight: 110,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={word}
                      >
                        {word}
                      </div>
                    </th>
                  ))}
                </tr>

                <tr>
                  <td
                    className="sticky left-0 z-10 text-xs font-black text-slate-700 px-2 py-1 border border-slate-200"
                    style={{ background: "#D8C5E8" }}
                  >
                    Totals
                  </td>
                  {words.map((_, i) => (
                    <td
                      key={i}
                      className="border border-slate-200 text-center py-1"
                      style={{ background: colPalette[i].header }}
                    >
                      <div className="text-xs font-black" style={{ color: "#166534" }}>{totalsPerWord[i].correct}</div>
                      {totalsPerWord[i].wrong > 0 && (
                        <div className="text-xs font-bold" style={{ color: "#991B1B" }}>{totalsPerWord[i].wrong}</div>
                      )}
                    </td>
                  ))}
                </tr>
              </thead>

              <tbody>
                {dateRows.map(({ date, cells }) => (
                  <tr key={date}>
                    <td
                      className="sticky left-0 z-10 text-xs font-semibold text-slate-600 px-2 py-1 border border-slate-100 whitespace-nowrap"
                      style={{ background: "#F3E8FC", minWidth: 90 }}
                    >
                      {formatDate(date + "T00:00:00")}
                    </td>
                    {words.map((word, i) => {
                      const cell = cells[word];
                      if (!cell) {
                        return (
                          <td
                            key={word}
                            className="border border-slate-100"
                            style={{ background: colPalette[i].bg, height: 28 }}
                          />
                        );
                      }
                      const hasCorrect = cell.correct > 0;
                      const hasWrong = cell.wrong > 0;
                      return (
                        <td
                          key={word}
                          className="border border-slate-100 text-center align-middle"
                          style={{
                            background: hasCorrect && !hasWrong
                              ? "#BBFDD0"
                              : hasWrong && !hasCorrect
                              ? "#FFD5D5"
                              : hasCorrect && hasWrong
                              ? "#FFF3CD"
                              : colPalette[i].bg,
                            height: 28,
                            padding: "2px 4px",
                          }}
                        >
                          {hasCorrect && (
                            <span className="text-xs font-bold" style={{ color: "#166534" }}>
                              {cell.correct > 1 ? `✓${cell.correct}` : "✓"}
                            </span>
                          )}
                          {hasWrong && (
                            <span className="text-xs font-bold ml-0.5" style={{ color: "#991B1B" }}>
                              {cell.wrong > 1 ? `✗${cell.wrong}` : "✗"}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 pb-4 flex gap-4 text-xs text-slate-500 justify-center">
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded" style={{ background: "#BBFDD0" }} /> Correct</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded" style={{ background: "#FFD5D5" }} /> Needs work</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded" style={{ background: "#FFF3CD" }} /> Both</span>
          </div>
        </div>
      )}
    </div>
  );
}
