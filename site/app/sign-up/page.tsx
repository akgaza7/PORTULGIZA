import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { isAuth0Configured } from "@/lib/auth0-config";

export default function SignUpPage() {
  return (
    <main className="page-shell py-10 sm:py-16">
      <Link href="/" className="text-sm font-semibold text-ocean hover:text-ink">← Back</Link>
      <div className="mt-8">
        <AuthForm mode="sign-up" configured={isAuth0Configured()} />
      </div>
    </main>
  );
}
