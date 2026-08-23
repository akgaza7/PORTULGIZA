export type ReminderSubscription = {
  subscriptionStatus: "trialing" | "active" | "past_due" | "canceled" | "expired";
  trialEndsAt: string | null;
};

export function canReceiveDailyReminders(subscription: ReminderSubscription, now = new Date()) {
  if (subscription.subscriptionStatus === "active") return true;
  if (subscription.subscriptionStatus !== "trialing" || !subscription.trialEndsAt) return false;
  return Date.parse(subscription.trialEndsAt) > now.getTime();
}
