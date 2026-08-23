"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }
  return <button type="button" onClick={signOut} className="rounded-full border border-ocean/15 bg-white px-4 py-2 text-sm font-semibold text-ocean hover:border-ocean/35">Sign out</button>;
}
