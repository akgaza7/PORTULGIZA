"use client";

import { useState, type FormEvent } from "react";
import { RevisionActions } from "@/components/revision-actions";

type ReminderPreferencesProps = {
  initialOptedIn: boolean;
  serviceActive: boolean;
  serviceEndsAt: string | null;
};

export function ReminderPreferences({ initialOptedIn, serviceActive, serviceEndsAt }: ReminderPreferencesProps) {
  const [optedIn, setOptedIn] = useState(initialOptedIn);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/subscriber/reminders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optedIn })
    }).catch(() => null);
    const result = response ? await response.json().catch(() => ({})) as { error?: string } : {};

    setMessage(response?.ok ? "Reminder preferences saved." : result.error ?? "Preferences could not be saved.");
    setSaving(false);
  }

  return (
    <section className="card-surface mt-6 p-6 sm:p-8">
      <p className="eyebrow">Daily recall reminders</p>
      <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">Email practice reminder</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/60">
        Choose whether you want one short practice prompt at your account email address. It uses only phrases already in your curriculum and prioritises answers you missed. Delivery will begin after Portulgiza connects its email service.
      </p>
      <p className={`mt-4 rounded-2xl p-4 text-sm font-semibold leading-6 ${serviceActive ? "bg-portugalGreen/10 text-portugalGreen" : "bg-portugalRed/5 text-portugalRed"}`}>
        {serviceActive
          ? serviceEndsAt
            ? `Email reminders are included until the end of your 14-day trial on ${serviceEndsAt}. Subscribe to remain eligible after that date.`
            : "Email reminders are included while your paid subscription remains active."
          : "Your daily reminder service is not active. Subscribe to resume reminders."}
      </p>
      <div className="mt-6 grid items-start gap-4 lg:grid-cols-2">
        <form className="rounded-2xl border border-portugalGreen/15 bg-portugalGreen/5 p-4" onSubmit={savePreferences}>
          <label className="flex items-start gap-3 text-sm leading-6 text-ink/65">
            <input className="mt-1 h-4 w-4 accent-portugalGreen" type="checkbox" checked={optedIn} onChange={(event) => setOptedIn(event.target.checked)} />
            Email me one daily Portuguese recall prompt. Clear this box to opt out.
          </label>
          <button className="mt-4 rounded-full bg-ocean px-5 py-3 font-semibold text-white transition hover:bg-ink disabled:opacity-60" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save preferences"}
          </button>
        </form>
        <RevisionActions />
      </div>
      {message ? <p className="mt-4 rounded-2xl bg-sand p-4 text-sm text-ink/65" role="status">{message}</p> : null}
    </section>
  );
}
