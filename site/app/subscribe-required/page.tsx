import Link from "next/link";

export default function SubscribeRequiredPage() {
  return <main className="page-shell py-10 sm:py-16">
    <section className="card-surface mx-auto max-w-xl p-8 text-center sm:p-12">
      <p className="eyebrow">START trial complete</p>
      <h1 className="mt-3 text-4xl font-bold text-ink">Carry on your learning</h1>
      <p className="mt-4 text-lg leading-8 text-ink/70">Your 14-day START trial has ended. Subscribe for £4.99 per month to continue with Portulgiza.</p>
      <Link href="/account" className="mt-7 inline-flex rounded-full bg-portugalYellow px-7 py-4 font-bold text-ink">Subscribe for £4.99 monthly</Link>
    </section>
  </main>;
}
