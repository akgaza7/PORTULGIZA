import Stripe from "stripe";

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_MONTHLY_PRICE_ID);
}
export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Stripe is not configured.");
  return new Stripe(secretKey, { typescript: true });
}
