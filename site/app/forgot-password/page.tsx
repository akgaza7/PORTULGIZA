import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="page-shell py-10 sm:py-16">
      <Link href="/sign-in" className="text-sm font-semibold text-ocean hover:text-ink">
        ← Back
      </Link>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
