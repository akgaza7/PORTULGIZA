"use client";

import { FormEvent, useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      setStatus(response.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <section className="card-surface mx-auto max-w-lg p-8 text-center sm:p-10" aria-live="polite">
        <h1 className="text-4xl font-bold tracking-tight text-ink">Check your email</h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-ink/65">
          If an account uses that email address, Auth0 will send a single-use link for choosing a new password.
        </p>
      </section>
    );
  }

  return (
    <section className="card-surface mx-auto max-w-lg p-8 sm:p-10">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-ink">Forgot password?</h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-ink/65">
          Enter your subscriber email address. We will send you a secure, single-use link to choose a new password.
        </p>
      </div>

      <form className="mt-7" onSubmit={handleSubmit}>
        <label htmlFor="forgot-password-email" className="block text-left font-semibold text-ink">
          Email address
        </label>
        <input
          id="forgot-password-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-ocean/20 bg-white px-4 py-3.5 text-ink outline-none transition focus:border-ocean focus:ring-4 focus:ring-ocean/10"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-ocean px-5 py-3.5 font-semibold text-white transition hover:bg-ink disabled:cursor-wait disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Email reset link"}
        </button>
        {status === "error" ? (
          <p className="mt-4 text-center text-sm font-semibold text-portugalRed" role="alert">
            The reset email could not be requested. Please try again shortly.
          </p>
        ) : null}
      </form>
    </section>
  );
}
