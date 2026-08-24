import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function getTrialAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { state: "signed_out" as const, user: null };
  const { data: subscriber } = await supabase.from("subscribers")
    .select("subscription_status,trial_activated_at,trial_ends_at")
    .eq("user_id", user.id).maybeSingle();
  if (subscriber?.subscription_status === "active") return { state: "active" as const, user };
  const trialIsActive = subscriber?.subscription_status === "trialing" &&
    Boolean(subscriber.trial_activated_at) &&
    Boolean(subscriber.trial_ends_at) &&
    new Date(subscriber.trial_ends_at).getTime() > Date.now();
  if (trialIsActive) return { state: "trial" as const, user };
  if (subscriber?.subscription_status === "trialing") {
    const admin = createAdminClient();
    await admin.from("subscribers").update({ subscription_status: "expired", updated_at: new Date().toISOString() }).eq("user_id", user.id);
  }
  return { state: "expired" as const, user };
}
