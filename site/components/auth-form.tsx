"use client";

import type { FormEvent } from "react";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
  configured: boolean;
};

export function AuthForm({ mode, configured }: AuthFormProps) {
  const isSignUp = mode === "sign-up";
  const authHref = isSignUp
    ? "/auth/login?screen_hint=signup&returnTo=/account"
    : "/auth/login?returnTo=/dashboard";

  function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get("email");
    form.reset();
    const loginHint = typeof email === "string" && email.trim()
      ? `&login_hint=${encodeURIComponent(email.trim())}`
      : "";
    window.location.assign(`${authHref}${loginHint}`);
  }

  if (!isSignUp) {
    return (
      <section className="card-surface mx-auto max-w-lg p-8 sm:p-10">
        <h1 className="text-center text-4xl font-bold tracking-tight text-ink">Lessons for subscribers</h1>
        <form className="mt-8 space-y-5" onSubmit={handleSignIn}>
          <label className="block text-left font-semibold text-ink">
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-2 w-full rounded-2xl border border-ocean/20 bg-white px-4 py-3.5 font-normal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/15"
            />
          </label>
          <label className="block text-left font-semibold text-ink">
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              className="mt-2 w-full rounded-2xl border border-ocean/20 bg-white px-4 py-3.5 font-normal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/15"
            />
          </label>
          <a
            href="/forgot-password"
            className="inline-flex font-semibold text-ocean underline decoration-ocean/35 underline-offset-4 transition hover:text-ink"
          >
            Forgot password?
          </a>
          {configured ? (
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-ocean px-5 py-3.5 font-semibold text-white transition hover:bg-ink"
            >
              Sign in
            </button>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-full bg-ocean/45 px-5 py-3.5 font-semibold text-white"
            >
              Sign in
            </span>
          )}
        </form>
      </section>
    );
  }

  return (
    <section className="card-surface mx-auto max-w-lg p-8 text-center sm:p-10">
      <h1 className="text-4xl font-bold tracking-tight text-ink">
        START is free for 14 days
      </h1>
      <p className="mx-auto mt-4 max-w-md leading-7 text-ink/65">
        Add your email address and mobile number. No card required. We’ll send a verification code to your email.
      </p>
      {configured ? (
        <a
          href={authHref}
          className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-ocean px-5 py-3.5 font-semibold text-white transition hover:bg-ink"
        >
          Start free trial
        </a>
      ) : (
        <span
          aria-disabled="true"
          className="mt-7 inline-flex w-full cursor-not-allowed items-center justify-center rounded-full bg-ocean/45 px-5 py-3.5 font-semibold text-white"
        >
          Start free trial
        </span>
      )}
    </section>
  );
}
