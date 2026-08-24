"use client";

import { useState, type FormEvent } from "react";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthForm({ mode }: AuthFormProps) {
  const isSignUp = mode === "sign-up";
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "expired" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submitEmailLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name");
    const email = formData.get("email");
    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedEmail = typeof email === "string" ? email.trim() : "";
    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/trial/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail, intent: isSignUp ? "start" : "login" })
      });
      const body = await response.json() as { message?: string; code?: string };
      if (!response.ok) {
        setStatus(body.code === "trial_expired" ? "expired" : "error");
        setMessage(body.message ?? "We could not send the email. Please try again.");
        return;
      }
      form.reset();
      setStatus("sent");
      setMessage(body.message ?? "Check your email for your secure START link.");
    } catch {
      setStatus("error");
      setMessage("We could not send the email. Please try again.");
    }
  }

  if (!isSignUp) {
    return (
      <section className="card-surface mx-auto max-w-lg p-8 sm:p-10">
        <h1 className="text-center text-4xl font-bold tracking-tight text-ink">Lessons for subscribers</h1>
        <form className="mt-8 space-y-5" onSubmit={submitEmailLink}>
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
          <p className="text-sm leading-6 text-ink/65">We will email you a secure link. No password is needed.</p>
          {message ? <p role="status" className={`rounded-2xl p-4 text-sm font-semibold ${status === "expired" ? "bg-portugalYellow/35 text-ink" : status === "error" ? "bg-portugalRed/10 text-portugalRed" : "bg-portugalGreen/10 text-portugalGreen"}`}>{message}</p> : null}
          <button
            type="submit"
            disabled={status === "sending"}
            className="inline-flex w-full items-center justify-center rounded-full bg-ocean px-5 py-3.5 font-semibold text-white transition hover:bg-ink disabled:cursor-wait disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Email my login link"}
          </button>
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
        Add your name and email address. We will send a verification link that activates START.
      </p>
      <form className="mt-8 space-y-5" onSubmit={submitEmailLink}>
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
        {message ? <p role="status" className={`rounded-2xl p-4 text-sm font-semibold ${status === "expired" ? "bg-portugalYellow/35 text-ink" : status === "error" ? "bg-portugalRed/10 text-portugalRed" : "bg-portugalGreen/10 text-portugalGreen"}`}>{message}</p> : null}
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
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex w-full items-center justify-center rounded-full bg-portugalGreen px-5 py-3.5 font-semibold text-white transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Start free trial"}
        </button>
      </form>
    </section>
  );
}
