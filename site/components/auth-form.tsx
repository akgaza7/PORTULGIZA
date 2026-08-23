"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
  configured: boolean;
};

export function AuthForm({ mode, configured }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reminderChoice, setReminderChoice] = useState<"yes" | "no" | "">("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isSignUp = mode === "sign-up";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) return;
    if (isSignUp && !reminderChoice) {
      setMessage("Choose whether you want to receive daily learning prompts before subscribing.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    const supabase = createClient();

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            reminder_channel: "email",
            daily_reminder_opt_in: reminderChoice === "yes",
            reminder_consent_at: reminderChoice === "yes" ? new Date().toISOString() : null
          }
        }
      });
      setMessage(error?.message ?? "Check your email to confirm your account and start your 14-day trial.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      setSubmitting(false);
      return;
    }

    router.push("/account");
    router.refresh();
  }

  return (
    <div className="card-surface mx-auto max-w-lg p-6 sm:p-8">
      <p className="eyebrow">Subscriber access</p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">
        {isSignUp ? "Start your 14-day free trial" : "Welcome back"}
      </h1>
      {isSignUp ? (
        <p className="mt-3 inline-flex rounded-full bg-sun/35 px-4 py-2 text-sm font-bold text-ink">
          No card required
        </p>
      ) : null}
      <p className="mt-3 text-sm leading-6 text-ink/60">
        {isSignUp
          ? "Create an account to protect your progress, then choose whether you want daily learning prompts by email."
          : "Sign in to continue your lessons and see your subscriber progress."}
      </p>

      {!configured ? (
        <div className="mt-6 rounded-3xl border border-sun/40 bg-sun/20 p-5 text-sm leading-6 text-ink/70">
          Subscriber accounts are built but not connected yet. Add the Supabase project URL and publishable key to
          <code className="mx-1 rounded bg-white px-1.5 py-0.5">.env.local</code> to activate this form.
        </div>
      ) : (
        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-ink">
            Email address
            <input
              className="mt-2 w-full rounded-2xl border border-ocean/15 bg-white px-4 py-3 font-normal outline-none transition focus:border-ocean focus:ring-4 focus:ring-sky/20"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Password
            <input
              className="mt-2 w-full rounded-2xl border border-ocean/15 bg-white px-4 py-3 font-normal outline-none transition focus:border-ocean focus:ring-4 focus:ring-sky/20"
              type="password"
              minLength={8}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {isSignUp ? (
            <fieldset className="space-y-3" aria-required="true">
              <legend className="text-sm font-semibold text-ink">
                Choose your daily learning prompt preference
              </legend>
              <label className="relative flex cursor-pointer items-start gap-3 rounded-2xl border border-portugalGreen/20 bg-portugalGreen/5 p-4 text-sm leading-6 text-ink/70 transition hover:border-portugalGreen/50">
                <input
                  className="peer absolute h-px w-px opacity-0"
                  type="radio"
                  name="daily-reminder-choice"
                  value="yes"
                  checked={reminderChoice === "yes"}
                  onChange={() => setReminderChoice("yes")}
                />
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-portugalGreen bg-white font-sans text-xs font-bold text-white peer-focus-visible:ring-4 peer-focus-visible:ring-sky/30 peer-checked:bg-portugalGreen">
                  {reminderChoice === "yes" ? "✓" : ""}
                </span>
                <span>
                  <strong className="block text-ink">Yes, send me daily learning prompts</strong>
                  Email me prompts based on my learning objectives and what I need to work on.
                </span>
              </label>
              <label className="relative flex cursor-pointer items-start gap-3 rounded-2xl border border-ocean/15 bg-white p-4 text-sm leading-6 text-ink/70 transition hover:border-ocean/40">
                <input
                  className="peer absolute h-px w-px opacity-0"
                  type="radio"
                  name="daily-reminder-choice"
                  value="no"
                  checked={reminderChoice === "no"}
                  onChange={() => setReminderChoice("no")}
                />
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-ocean/35 bg-white font-sans text-xs font-bold text-white peer-focus-visible:ring-4 peer-focus-visible:ring-sky/30 peer-checked:border-ocean peer-checked:bg-ocean">
                  {reminderChoice === "no" ? "✓" : ""}
                </span>
                <span>
                  <strong className="block text-ink">Opt out of daily learning prompts</strong>
                  Do not send daily learning prompts to my email address.
                </span>
              </label>
            </fieldset>
          ) : null}
          <button
            className="w-full rounded-full bg-ocean px-5 py-3.5 font-semibold text-white transition hover:bg-ink disabled:cursor-wait disabled:opacity-60"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Please wait…" : isSignUp ? "Submit & Subscribe" : "Sign in"}
          </button>
          {message ? <p className="rounded-2xl bg-sand p-4 text-sm leading-6 text-ink/70">{message}</p> : null}
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink/55">
        {isSignUp ? "Already subscribed?" : "New to Portulgiza?"}{" "}
        <Link className="font-semibold text-ocean hover:text-ink" href={isSignUp ? "/sign-in" : "/sign-up"}>
          {isSignUp ? "Sign in" : "Start a free trial"}
        </Link>
      </p>
    </div>
  );
}
