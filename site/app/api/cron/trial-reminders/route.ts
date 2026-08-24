import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPortulgizaEmail } from "@/lib/trial-email";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const admin = createAdminClient();
  const now = new Date();
  await admin.from("subscribers").update({ subscription_status: "expired", updated_at: now.toISOString() })
    .eq("subscription_status", "trialing").lte("trial_ends_at", now.toISOString());

  const windowEnd = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const { data: subscribers, error } = await admin.from("subscribers")
    .select("user_id,email,full_name,trial_ends_at,trial_reminder_2d_sent_at,trial_reminder_1d_sent_at")
    .eq("subscription_status", "trialing")
    .not("trial_activated_at", "is", null)
    .gt("trial_ends_at", now.toISOString())
    .lte("trial_ends_at", windowEnd.toISOString());
  if (error) return NextResponse.json({ error: "Reminder records could not be loaded." }, { status: 500 });

  let sent = 0;
  for (const subscriber of subscribers ?? []) {
    const millisecondsLeft = new Date(subscriber.trial_ends_at).getTime() - now.getTime();
    const daysLeft = Math.max(1, Math.ceil(millisecondsLeft / (24 * 60 * 60 * 1000)));
    const field = daysLeft === 1 ? "trial_reminder_1d_sent_at" : "trial_reminder_2d_sent_at";
    if (subscriber[field]) continue;
    try {
      await sendPortulgizaEmail({
        to: subscriber.email,
        subject: `Your START trial will end in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`,
        heading: `Your START trial will end in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`,
        paragraphs: [`Hello ${subscriber.full_name || "Learner"},`, "Keep learning today, or subscribe for £4.99 per month to continue after START ends."],
        actionLabel: "Continue learning",
        actionUrl: `${(process.env.NEXT_PUBLIC_SITE_URL ?? "https://portulgiza.co.uk").replace(/\/$/, "")}/sign-in`
      });
      await admin.from("subscribers").update({ [field]: now.toISOString(), updated_at: now.toISOString() }).eq("user_id", subscriber.user_id);
      sent += 1;
    } catch {
      // Leave the timestamp empty so the next scheduled run can retry.
    }
  }
  return NextResponse.json({ checked: subscribers?.length ?? 0, sent });
}
