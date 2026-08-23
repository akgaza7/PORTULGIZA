import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage billing." }, { status: 401 });

  const { data } = await supabase.from("subscribers").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  const customerId = (data as { stripe_customer_id: string | null } | null)?.stripe_customer_id;
  if (!customerId) return NextResponse.json({ error: "No Stripe billing profile exists yet." }, { status: 404 });

  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${request.nextUrl.origin}/account`
  });
  return NextResponse.json({ url: session.url });
}
