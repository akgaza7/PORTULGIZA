import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type RequestBody = { name?: unknown; email?: unknown; intent?: unknown };

function normaliseEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SECRET_KEY) {
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
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: intent === "start",
      emailRedirectTo: `${siteUrl}/auth/confirm?next=${encodeURIComponent(next)}`,
      data: { full_name: name || subscriber?.full_name || "Learner" }
    }
  });
  if (error) {
    return NextResponse.json({ message: "We could not send your email. Please try again." }, { status: 502 });
  }
  return NextResponse.json({ message: "Check your email and click the secure link to activate START." });
}
