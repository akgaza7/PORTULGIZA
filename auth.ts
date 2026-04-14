const STORAGE_KEY = "portulgiza_user";
const SESSION_KEY = "portulgiza_session";

export interface User {
  name: string;
  /** Short display name chosen by the learner, e.g. "Akilla" */
  preferredName?: string;
  email: string;
  password: string;
  phone?: string;
  level?: string;
  trialStartDate: number;
  trialEndDate: number;
  subscribed: boolean;
  subscribedDate?: number;
}

/** Convert any string to Title Case — "akilla gaziza" → "Akilla Gaziza" */
export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** The name shown in greetings: preferred name if set, otherwise first word of full name */
export function displayName(user: User): string {
  if (user.preferredName?.trim()) return toTitleCase(user.preferredName.trim());
  const first = user.name.trim().split(/\s+/)[0] ?? user.name.trim();
  return toTitleCase(first);
}

/** Persist just the preferred name without touching the rest of the account */
export function updatePreferredName(preferredName: string): void {
  const user = loadUser();
  if (!user) return;
  saveUser({ ...user, preferredName: toTitleCase(preferredName.trim()) });
}

/** Read from localStorage first, fall back to sessionStorage (session-only login). */
export function loadUser(): User | null {
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) return JSON.parse(local) as User;
    const session = sessionStorage.getItem(SESSION_KEY);
    if (session) return JSON.parse(session) as User;
    return null;
  } catch {
    return null;
  }
}

/** Persist account data to localStorage (always — for account creation). */
export function saveUser(user: User): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

/** Sign the user out of both storages. */
export function logoutUser(): void {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

export function createAccount(data: {
  name: string;
  preferredName?: string;
  email: string;
  password: string;
  phone?: string;
}): { success: boolean; error?: string } {
  if (!data.name.trim())
    return { success: false, error: "Please enter your name." };
  if (!data.email.includes("@"))
    return { success: false, error: "Please enter a valid email address." };
  if (data.password.length < 8)
    return { success: false, error: "Use at least 8 characters for your password." };

  const existing = loadUser();
  if (existing && existing.email.toLowerCase() === data.email.toLowerCase().trim()) {
    return {
      success: false,
      error: "An account with that email already exists. Try signing in instead.",
    };
  }

  try {
    const now = Date.now();
    const TRIAL_MS = 5 * 24 * 60 * 60 * 1000;
    const user: User = {
      name: data.name.trim(),
      preferredName: data.preferredName?.trim() ? toTitleCase(data.preferredName.trim()) : undefined,
      email: data.email.toLowerCase().trim(),
      password: data.password,
      phone: data.phone?.trim() || undefined,
      trialStartDate: now,
      trialEndDate: now + TRIAL_MS,
      subscribed: false,
    };
    saveUser(user);
    return { success: true };
  } catch {
    return {
      success: false,
      error: "We couldn't save your account right now. Please try again.",
    };
  }
}

export function loginUser(
  email: string,
  password: string,
  keepSignedIn = true
): { success: boolean; error?: string } {
  let user: User | null;

  try {
    const local = localStorage.getItem(STORAGE_KEY);
    user = local ? (JSON.parse(local) as User) : null;
  } catch {
    return {
      success: false,
      error: "We're having trouble accessing your account right now. Please try again.",
    };
  }

  if (!user) {
    return {
      success: false,
      error: "No account found for this email. Start a 5 day free trial to create one.",
    };
  }

  if (user.email !== email.toLowerCase().trim() || user.password !== password) {
    return {
      success: false,
      error: "We couldn't sign you in with those details. Please check your email and password and try again.",
    };
  }

  // Route the authenticated user to the right storage based on "keep me signed in"
  if (keepSignedIn) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    sessionStorage.removeItem(SESSION_KEY);
  } else {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    localStorage.removeItem(STORAGE_KEY);
  }

  return { success: true };
}

const TRIAL_DAYS = 5;

export function trialDaysLeft(user: User): number {
  const endDate = user.trialEndDate ?? user.trialStartDate + TRIAL_DAYS * 24 * 60 * 60 * 1000;
  const msLeft = endDate - Date.now();
  return Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
}

export function isTrialActive(user: User): boolean {
  return trialDaysLeft(user) > 0;
}

function isAkilla(user: User): boolean {
  const names = [user.preferredName ?? "", user.name].join(" ").toLowerCase();
  return names.includes("akilla");
}

export function hasFullAccess(user: User): boolean {
  return isAkilla(user) || user.subscribed || isTrialActive(user);
}

export function activateSubscription(user: User): User {
  const updated: User = { ...user, subscribed: true, subscribedDate: Date.now() };
  saveUser(updated);
  return updated;
}
