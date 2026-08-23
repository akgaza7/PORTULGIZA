import type { AppProgress, LearningAnswer } from "@/lib/storage";
import { lessons } from "@/lib/lesson-data";

export type DailyReminderCandidate = {
  lessonSlug: string;
  portuguese: string;
  source: "needs-practice" | "learned-review";
};

function latestIncorrectAnswer(progress: AppProgress) {
  const latestByPrompt = new Map<string, LearningAnswer>();

  for (const answer of progress.answerHistory ?? []) {
    latestByPrompt.set(`${answer.lessonSlug}:${answer.prompt}`, answer);
  }

  return Array.from(latestByPrompt.values())
    .filter((answer) => !answer.correct)
    .sort((first, second) => Date.parse(second.attemptedAt) - Date.parse(first.attemptedAt))
    .map((answer) => {
      const lesson = lessons.find((item) => item.slug === answer.lessonSlug);
      const phrase = lesson?.phrases.find((item) =>
        item.portuguese === answer.correctAnswer ||
        item.english === answer.correctAnswer ||
        answer.prompt.includes(item.portuguese)
      );
      return phrase ? { lessonSlug: answer.lessonSlug, portuguese: phrase.portuguese } : null;
    })
    .find((answer) => answer !== null);
}

export function chooseDailyReminder(progress: AppProgress, day = new Date()): DailyReminderCandidate | null {
  const incorrect = latestIncorrectAnswer(progress);
  if (incorrect) {
    return {
      lessonSlug: incorrect.lessonSlug,
      portuguese: incorrect.portuguese,
      source: "needs-practice"
    };
  }

  const learnedPhrases = lessons
    .filter((lesson) => progress.completedLessons[lesson.slug] || progress.practiceByLesson[lesson.slug])
    .flatMap((lesson) =>
      lesson.phrases.map((phrase) => ({ lessonSlug: lesson.slug, portuguese: phrase.portuguese }))
    );
  if (!learnedPhrases.length) return null;

  const dayNumber = Math.floor(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()) / 86_400_000);
  const selected = learnedPhrases[Math.abs(dayNumber) % learnedPhrases.length];
  return { ...selected, source: "learned-review" };
}

export function buildPortugueseReminderMessage(candidate: DailyReminderCandidate) {
  return `🇵🇹 Consegue lembrar-se?\n\n${candidate.portuguese}\n\nPratique no Portulgiza.`;
}
