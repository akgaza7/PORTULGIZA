import { lessons } from "@/lib/lesson-data";
import type { AppProgress, SubscriptionStatus } from "@/lib/storage";

export type LearningAccess = {
  isPaidSubscriber: boolean;
  isTrialActive: boolean;
  startPassed: boolean;
  canAccessStart: boolean;
  canAccessSmooth: boolean;
  canAccessSturdy: boolean;
};

export function getLearningAccess(
  progress: AppProgress,
  subscriptionStatus: SubscriptionStatus,
  trialEndsAt: string | null,
  now = new Date()
): LearningAccess {
  const isPaidSubscriber = subscriptionStatus === "active";
  const isTrialActive = subscriptionStatus === "trialing"
    && Boolean(trialEndsAt)
    && Date.parse(trialEndsAt ?? "") > now.getTime();
  const startPassed = lessons.every((lesson) => progress.completedLessons[lesson.slug]?.completed === true);
  const canAccessStart = isPaidSubscriber || isTrialActive;
  const canAccessHigherLevels = isPaidSubscriber && startPassed;

  return {
    isPaidSubscriber,
    isTrialActive,
    startPassed,
    canAccessStart,
    canAccessSmooth: canAccessHigherLevels,
    canAccessSturdy: canAccessHigherLevels
  };
}
