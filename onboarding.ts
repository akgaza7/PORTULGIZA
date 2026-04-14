import { useState, useCallback } from "react";

export type Level = "beginner" | "intermediate";

export interface OnboardingState {
  completed: boolean;
  level: Level;
  completedAt: string | null;
}

const STORAGE_KEY = "pt-onboarding";

const DEFAULT_STATE: OnboardingState = {
  completed: false,
  level: "beginner",
  completedAt: null,
};

export function loadOnboarding(): OnboardingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveOnboarding(state: OnboardingState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function completeOnboarding(level: Level): OnboardingState {
  const state: OnboardingState = {
    completed: true,
    level,
    completedAt: new Date().toISOString(),
  };
  saveOnboarding(state);
  return state;
}

export function resetOnboarding(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOnboarding() {
  const [onboarding, setOnboarding] = useState<OnboardingState>(loadOnboarding);

  const complete = useCallback((level: Level) => {
    const state = completeOnboarding(level);
    setOnboarding(state);
    return state;
  }, []);

  return { onboarding, complete };
}
