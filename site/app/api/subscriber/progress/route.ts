import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function unauthorised() {
  return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
}

export async function GET() {
  if (!isSupabaseConfigured()) return unauthorised();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorised();

  const [progressResult, subscriberResult] = await Promise.all([
    supabase.from("learning_progress").select("progress,mastery_score,updated_at").eq("user_id", user.id).maybeSingle(),
    supabase.from("subscribers").select("subscription_status").eq("user_id", user.id).maybeSingle()
  ]);

  if (progressResult.error || subscriberResult.error) {
    return NextResponse.json({ error: "Progress could not be loaded." }, { status: 500 });
  }

  return NextResponse.json({
    ...(progressResult.data ?? { progress: null, mastery_score: 0, updated_at: null }),
    subscription_status: subscriberResult.data?.subscription_status ?? null
  });
}

export async function PUT(request: NextRequest) {
  if (!isSupabaseConfigured()) return unauthorised();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorised();

  const body = await request.json().catch(() => null) as { progress?: unknown; masteryScore?: unknown } | null;
  if (!body || typeof body.progress !== "object" || body.progress === null) {
    return NextResponse.json({ error: "Invalid progress data." }, { status: 400 });
  }
  if (JSON.stringify(body.progress).length > 100_000) {
    return NextResponse.json({ error: "Progress data is too large." }, { status: 413 });
  }

  const masteryScore = Math.max(0, Math.min(100, Math.round(Number(body.masteryScore) || 0)));
  const { error } = await supabase.from("learning_progress").upsert({
    user_id: user.id,
    progress: body.progress,
    mastery_score: masteryScore,
    updated_at: new Date().toISOString()
  }, { onConflict: "user_id" });
  if (error) return NextResponse.json({ error: "Progress could not be saved." }, { status: 500 });
  return NextResponse.json({ saved: true });
}
