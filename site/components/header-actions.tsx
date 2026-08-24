"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function HeaderActions() {
  const pathname = usePathname();
  const showDashboard = pathname === "/dashboard" || pathname === "/account" || pathname.startsWith("/lesson/");

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
      {showDashboard ? (
        <Link
          href="/dashboard"
          className="rounded-full border border-portugalGreen/25 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-portugalGreen transition hover:border-portugalGreen hover:bg-portugalGreen/5 sm:px-5 sm:text-sm"
        >
          Dashboard
        </Link>
      ) : null}
      <Link
        href="/sign-up"
        className="inline-flex flex-col items-center rounded-full border border-portugalGold/60 bg-portugalGold/35 px-4 py-2 text-xs font-bold uppercase leading-tight tracking-[0.1em] text-black transition hover:bg-portugalGold/55 sm:px-5 sm:text-sm"
      >
        <span>Subscribe £4.99</span>
        <span className="mt-0.5 text-[0.6rem] tracking-[0.14em] text-black/65 sm:text-[0.65rem]">Monthly</span>
      </Link>
    </div>
  );
}
