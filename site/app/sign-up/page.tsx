import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function SignUpPage() {
  return (
    <main className="page-shell py-10 sm:py-16">
      <Link href="/" className="text-sm font-semibold text-ocean hover:text-ink">← Back</Link>
      <section className="mx-auto mt-8 max-w-3xl rounded-[2rem] border border-portugalGreen/20 bg-portugalGreen/5 p-6 sm:p-8">
        <p className="eyebrow">Included with your subscription</p>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">
          This is what&apos;s included with your learning subscription
        </h2>
        <p className="mt-3 leading-7 text-ink/65">
          A daily prompt based on your learning objectives and what you need to work on.
        </p>
        <p className="mt-2 leading-7 text-ink/65">
          We&apos;ll send your daily prompts to your email address.
        </p>
      </section>
      <div className="mt-8"><AuthForm mode="sign-up" configured={isSupabaseConfigured()} /></div>
    </main>
  );
}
