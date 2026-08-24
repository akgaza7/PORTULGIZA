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

  function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name");
    const email = formData.get("email");
    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedEmail = typeof email === "string" ? email.trim() : "";

    if (trimmedName) {
      window.sessionStorage.setItem("portulgiza-sign-up-name", trimmedName);
    }

    const loginHint = trimmedEmail
      ? `&login_hint=${encodeURIComponent(trimmedEmail)}`
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
    <section className="card-surface mx-auto max-w-lg p-8 sm:p-10">
      <h1 className="text-center text-4xl font-bold tracking-tight text-portugalGreen">
        14 Day Free START Learning EU Portuguese
      </h1>
      <p className="mx-auto mt-4 max-w-md text-center text-lg font-bold leading-7 text-portugalGreen">
        Add your details and you’re ready.
      </p>
      <form className="mt-8 space-y-5" onSubmit={handleSignUp}>
        <label className="block text-left font-semibold text-ink">
          Name
          <input
            name="name"
            type="text"
            autoComplete="name"
            required
            className="mt-2 w-full rounded-2xl border border-portugalGreen/25 bg-white px-4 py-3.5 font-normal outline-none transition focus:border-portugalGreen focus:ring-2 focus:ring-portugalGreen/15"
          />
        </label>
        <label className="block text-left font-semibold text-ink">
          Email address
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-2 w-full rounded-2xl border border-portugalGreen/25 bg-white px-4 py-3.5 font-normal outline-none transition focus:border-portugalGreen focus:ring-2 focus:ring-portugalGreen/15"
          />
        </label>
        {configured ? (
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-portugalGreen px-5 py-3.5 font-semibold text-white transition hover:brightness-95"
          >
            Start free trial
          </button>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-full bg-portugalGreen/45 px-5 py-3.5 font-semibold text-white"
          >
            Start free trial
          </span>
        )}
      </form>
    </section>
  );
}
