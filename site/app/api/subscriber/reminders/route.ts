import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Subscriber accounts are not configured." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await request.json().catch(() => null) as {
    optedIn?: unknown;
  } | null;
  const optedIn = body?.optedIn === true;

  try {
    const { error } = await createAdminClient().from("subscribers").update({
      reminder_channel: "email",
      daily_reminder_opt_in: optedIn,
      reminder_consent_at: optedIn ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }).eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: "Reminder preferences could not be saved because secure server access is not configured." }, { status: 503 });
  }
}
