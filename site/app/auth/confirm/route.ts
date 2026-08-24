import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const code = request.nextUrl.searchParams.get("code");
  const requestedNext = request.nextUrl.searchParams.get("next") ?? "/lesson/greetings";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/lesson/greetings";
  if (!isSupabaseConfigured() || (!code && (!tokenHash || !type))) {
    return NextResponse.redirect(new URL("/sign-in?error=invalid_link", request.url));
  }
  const supabase = await createClient();
  const { data, error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: type! });
  if (error || !data.user) {
    return NextResponse.redirect(new URL("/sign-in?error=expired_link", request.url));
  }

  const admin = createAdminClient();
  const { data: subscriber } = await admin.from("subscribers")
    .select("trial_activated_at,subscription_status,trial_ends_at")
    .eq("user_id", data.user.id).maybeSingle();
  const expired = subscriber?.subscription_status === "expired" ||
    (subscriber?.trial_ends_at && new Date(subscriber.trial_ends_at).getTime() <= Date.now());
  if (expired && subscriber?.subscription_status !== "active") {
    return NextResponse.redirect(new URL("/subscribe-required", request.url));
  }
  if (!subscriber?.trial_activated_at && subscriber?.subscription_status !== "active") {
    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
    await admin.from("subscribers").update({
      trial_activated_at: startedAt.toISOString(),
      trial_started_at: startedAt.toISOString(),
      trial_ends_at: endsAt.toISOString(),
      subscription_status: "trialing",
      updated_at: startedAt.toISOString()
    }).eq("user_id", data.user.id);
  }
  return NextResponse.redirect(new URL(next, request.url));
}
