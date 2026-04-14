export interface WordEvent {
  ts: string;
  word: string;
  lessonId: string;
  result: "correct" | "wrong";
}

const LOG_KEY = "pt-progress-log";
const MAX_EVENTS = 2000;

export function loadLog(): WordEvent[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WordEvent[];
  } catch {
    return [];
  }
}

export function appendLog(events: WordEvent[]): void {
  if (events.length === 0) return;
  const existing = loadLog();
  const combined = [...existing, ...events];
  const trimmed = combined.slice(-MAX_EVENTS);
  localStorage.setItem(LOG_KEY, JSON.stringify(trimmed));
}
