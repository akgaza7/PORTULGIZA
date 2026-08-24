import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function SignUpPage() {
  return (
    <main className="page-shell py-10 sm:py-16">
      <Link href="/" className="text-sm font-semibold text-ocean hover:text-ink">← Back</Link>
      <div className="mt-8">
        <AuthForm mode="sign-up" />
      </div>
    </main>
  );
}
