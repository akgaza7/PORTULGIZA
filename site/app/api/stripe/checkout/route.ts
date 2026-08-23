import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

type BillingRecord = {
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
};

export async function POST(request: NextRequest) {
  if (!isStripeConfigured() || !process.env.SUPABASE_SECRET_KEY) {
    return NextResponse.json({ error: "Test billing is not fully configured yet." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Sign in before subscribing." }, { status: 401 });

  const { data } = await supabase.from("subscribers")
    .select("stripe_customer_id,stripe_subscription_id,subscription_status")
    .eq("user_id", user.id).maybeSingle();
  const billing = data as BillingRecord | null;

  if (billing?.stripe_subscription_id && ["active", "past_due"].includes(billing.subscription_status)) {
    return NextResponse.json({ error: "This account already has a subscription." }, { status: 409 });
  }

  const stripe = getStripe();
  let customerId = billing?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.user_metadata?.display_name,
      metadata: { supabase_user_id: user.id, app: "portulgiza" }
    });
    customerId = customer.id;
    const { error } = await createAdminClient().from("subscribers")
      .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    if (error) return NextResponse.json({ error: "The billing profile could not be saved." }, { status: 500 });
  }

  const origin = request.nextUrl.origin;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: process.env.STRIPE_MONTHLY_PRICE_ID!, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${origin}/account?checkout=success`,
    cancel_url: `${origin}/account?checkout=cancelled`,
    metadata: { supabase_user_id: user.id, app: "portulgiza" },
    subscription_data: { metadata: { supabase_user_id: user.id, app: "portulgiza" } }
  });

  return NextResponse.json({ url: session.url });
}
