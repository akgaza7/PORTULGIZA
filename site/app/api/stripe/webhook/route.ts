import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

type SubscriberStatus = "trialing" | "active" | "past_due" | "canceled" | "expired";

function mapStatus(status: Stripe.Subscription.Status): SubscriberStatus {
  if (status === "trialing") return "trialing";
  if (status === "active") return "active";
  if (status === "past_due") return "past_due";
  if (status === "canceled") return "canceled";
  return "expired";
}

function periodEnd(subscription: Stripe.Subscription) {
  const seconds = subscription.items.data.reduce((latest, item) => Math.max(latest, item.current_period_end), 0);
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

async function syncSubscription(subscription: Stripe.Subscription, fallbackUserId?: string | null) {
  const admin = createAdminClient();
  const userId = subscription.metadata.supabase_user_id || fallbackUserId;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const changes = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    subscription_status: mapStatus(subscription.status),
    current_period_ends_at: periodEnd(subscription),
    updated_at: new Date().toISOString()
  };

  if (userId) return admin.from("subscribers").update(changes).eq("user_id", userId);
  return admin.from("subscribers").update(changes).eq("stripe_subscription_id", subscription.id);
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !process.env.SUPABASE_SECRET_KEY) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }
  if (!signature) return NextResponse.json({ error: "Missing webhook signature." }, { status: 400 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.subscription) {
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
      await syncSubscription(await stripe.subscriptions.retrieve(subscriptionId), session.client_reference_id);
    }
  } else if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    await syncSubscription(event.data.object);
  } else if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object;
    const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
    if (customerId) await createAdminClient().from("subscribers").update({ subscription_status: "past_due", updated_at: new Date().toISOString() }).eq("stripe_customer_id", customerId);
  }

  return NextResponse.json({ received: true });
}
