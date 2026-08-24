import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { ConnectedStudentProgressDashboard } from "@/components/student-progress-dashboard";
import { ReminderPreferences } from "@/components/reminder-preferences";
import { SubscriptionActions } from "@/components/subscription-actions";
import { canReceiveDailyReminders } from "@/lib/reminder-eligibility";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Subscriber = {
  trial_ends_at: string;
  subscription_status: "trialing" | "active" | "past_due" | "canceled" | "expired";
  current_period_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  daily_reminder_opt_in: boolean;
};

const subscriptionLabels: Record<Subscriber["subscription_status"], string> = {
  trialing: "Trial active",
  active: "Active",
  past_due: "Payment overdue",
  canceled: "Cancelled",
  expired: "Trial expired"
};

function formatSubscriptionStatus(status: Subscriber["subscription_status"] | undefined, fallback: string) {
  return status ? subscriptionLabels[status] : fallback;
}

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export default async function AccountPage() {
  if (!isSupabaseConfigured()) {
    redirect("/sign-in");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const [subscriberResult, learningResult] = await Promise.all([
    supabase.from("subscribers").select("trial_ends_at,subscription_status,current_period_ends_at,stripe_customer_id,stripe_subscription_id,daily_reminder_opt_in").eq("user_id", user.id).maybeSingle(),
    supabase.from("learning_progress").select("mastery_score,updated_at").eq("user_id", user.id).maybeSingle()
  ]);
  const subscriber = subscriberResult.data as Subscriber | null;
  const learning = learningResult.data as { mastery_score: number; updated_at: string } | null;
  const reminderServiceActive = subscriber
    ? canReceiveDailyReminders({
        subscriptionStatus: subscriber.subscription_status,
        trialEndsAt: subscriber.trial_ends_at
      })
    : false;

  return (
    <main className="page-shell py-8 sm:py-12">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="text-sm font-semibold text-ocean hover:text-ink">← Back</Link>
        <SignOutButton />
      </div>
      <div className="mt-6"><ConnectedStudentProgressDashboard /></div>
      <section className="hero-panel mt-6 rounded-[2.25rem] p-7 sm:p-10">
        <p className="eyebrow">Subscriber account</p>
        <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Your Portulgiza journey</h1><p className="mt-3 text-ink/60">{user.email}</p></div>
          <span className="w-fit rounded-full bg-ocean px-4 py-2 text-sm font-semibold text-white">{formatSubscriptionStatus(subscriber?.subscription_status, "Setting up")}</span>
        </div>
      </section>
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="card-surface p-6"><p className="eyebrow">Free trial</p><p className="mt-3 font-display text-2xl font-bold">Ends {formatDate(subscriber?.trial_ends_at ?? null)}</p><p className="mt-2 text-sm leading-6 text-ink/55">Your trial starts when you verify your email and activate START.</p></article>
        <article className="card-surface p-6"><p className="eyebrow">Mastery score</p><p className="mt-3 font-display text-4xl font-bold">{learning?.mastery_score ?? 0}<span className="text-xl text-ink/45">/100</span></p><p className="mt-2 text-sm leading-6 text-ink/55">Synced from your lesson activity.</p></article>
        <article className="card-surface p-6"><p className="eyebrow">Billing</p><p className="mt-3 font-display text-2xl font-bold">{formatSubscriptionStatus(subscriber?.subscription_status, "Not connected")}</p><p className="mt-2 text-sm leading-6 text-ink/55">{subscriber?.current_period_ends_at ? `Current period ends ${formatDate(subscriber.current_period_ends_at)}` : "£4.99 monthly after your free trial. Cancel through Stripe at any time."}</p><SubscriptionActions hasBillingProfile={Boolean(subscriber?.stripe_customer_id)} hasSubscription={Boolean(subscriber?.stripe_subscription_id)} /></article>
      </section>
      <ReminderPreferences
        initialOptedIn={subscriber?.daily_reminder_opt_in ?? false}
        serviceActive={reminderServiceActive}
        serviceEndsAt={subscriber?.subscription_status === "trialing" ? formatDate(subscriber.trial_ends_at) : null}
      />
    </main>
  );
}
