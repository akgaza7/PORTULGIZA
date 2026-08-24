import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTrialEmailConfigured, sendPortulgizaEmail } from "@/lib/trial-email";

type RequestBody = { name?: unknown; email?: unknown; intent?: unknown };

function normaliseEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function POST(request: NextRequest) {
  if (!isTrialEmailConfigured()) {
    return NextResponse.json({ message: "START email registration is not configured yet." }, { status: 503 });
  }
  const body = await request.json().catch(() => null) as RequestBody | null;
  const email = normaliseEmail(body?.email);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 100) : "";
  const intent = body?.intent === "login" ? "login" : "start";
  if (!email || !email.includes("@") || (intent === "start" && name.length < 2)) {
    return NextResponse.json({ message: "Enter your name and a valid email address." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: subscriber } = await admin
    .from("subscribers")
    .select("user_id,full_name,subscription_status,trial_activated_at,trial_ends_at")
    .eq("email", email)
    .maybeSingle();
  const trialExpired = subscriber?.subscription_status === "expired" ||
    (subscriber?.trial_ends_at && new Date(subscriber.trial_ends_at).getTime() <= Date.now());
  if (trialExpired && subscriber?.subscription_status !== "active") {
    return NextResponse.json({
      code: "trial_expired",
      message: "Your 14-day START trial has ended. Subscribe for £4.99 per month to carry on learning."
    }, { status: 409 });
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin).replace(/\/$/, "");
  const next = subscriber?.subscription_status === "active" ? "/dashboard" : "/lesson/greetings";
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { data: { full_name: name || subscriber?.full_name || "Learner" } }
  });
  const tokenHash = data.properties?.hashed_token;
  if (error || !tokenHash) {
    return NextResponse.json({ message: "We could not prepare your secure email link." }, { status: 500 });
  }
  const actionUrl = `${siteUrl}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=magiclink&next=${encodeURIComponent(next)}`;
  try {
    await sendPortulgizaEmail({
      to: email,
      subject: intent === "start" ? "Begin with START EU Language Learning" : "Your secure Portulgiza login link",
      heading: intent === "start" ? "Begin with START EU Language Learning" : "Continue your Portulgiza learning",
      paragraphs: intent === "start"
        ? [`Hello ${name || subscriber?.full_name || "Learner"},`, "Click the secure link below to verify your email and activate your 14-day START trial. Your trial begins only when you click it."]
        : ["Click the secure link below to return to your lessons. This link confirms your email address."],
      actionLabel: intent === "start" ? "Activate START" : "Open my lessons",
      actionUrl
    });
  } catch {
    return NextResponse.json({ message: "We could not send your email. Please try again." }, { status: 502 });
  }
  return NextResponse.json({ message: "Check your email and click the secure link to activate START." });
}
