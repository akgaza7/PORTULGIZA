"use client";

import { useState } from "react";

type SubscriptionActionsProps = {
  hasBillingProfile: boolean;
  hasSubscription: boolean;
};

export function SubscriptionActions({ hasBillingProfile, hasSubscription }: SubscriptionActionsProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function openBilling(path: "checkout" | "portal") {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/stripe/${path}`, { method: "POST" });
      const body = await response.json() as { url?: string; error?: string };
      if (!response.ok || !body.url) throw new Error(body.error ?? "Billing could not be opened.");
      window.location.assign(body.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Billing could not be opened.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-5">
      {hasSubscription || hasBillingProfile ? (
        <button type="button" disabled={loading} onClick={() => openBilling("portal")} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ocean disabled:opacity-60">
          {loading ? "Opening Stripe…" : "Manage subscription"}
        </button>
      ) : (
        <button type="button" disabled={loading} onClick={() => openBilling("checkout")} className="rounded-full bg-ocean px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink disabled:opacity-60">
          {loading ? "Opening Stripe…" : "Subscribe for £4.99/month"}
        </button>
      )}
      {message ? <p className="mt-3 text-sm leading-5 text-clay">{message}</p> : null}
    </div>
  );
}
