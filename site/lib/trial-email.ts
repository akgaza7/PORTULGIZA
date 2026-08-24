import { isSupabaseConfigured } from "@/lib/supabase/config";

export function isTrialEmailConfigured() {
  return Boolean(
    isSupabaseConfigured() &&
    process.env.SUPABASE_SECRET_KEY &&
    process.env.RESEND_API_KEY &&
    process.env.PORTULGIZA_EMAIL_FROM
  );
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character] ?? character);
}

export async function sendPortulgizaEmail(input: { to: string; subject: string; heading: string; paragraphs: string[]; actionLabel?: string; actionUrl?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PORTULGIZA_EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Trial email delivery is not configured.");
  const action = input.actionLabel && input.actionUrl
    ? `<p style="margin:28px 0"><a href="${escapeHtml(input.actionUrl)}" style="background:#08783f;color:#fff;padding:14px 24px;border-radius:999px;text-decoration:none;font-weight:700">${escapeHtml(input.actionLabel)}</a></p>`
    : "";
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#10231a"><h1>${escapeHtml(input.heading)}</h1>${input.paragraphs.map((p) => `<p style="font-size:17px;line-height:1.6">${escapeHtml(p)}</p>`).join("")}${action}<p style="font-size:13px;color:#66736d">Portulgiza · European Portuguese Language Learning</p></div>`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, html })
  });
  if (!response.ok) throw new Error(`Email delivery failed (${response.status}).`);
}
