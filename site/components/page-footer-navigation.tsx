"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function PageFooterNavigation() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isTrialRegistrationPage = pathname === "/sign-up" || pathname.startsWith("/sign-up/");
  const showDashboard = !isTrialRegistrationPage && (
    pathname === "/dashboard" || pathname === "/account" || pathname.startsWith("/lesson/")
  );

  const backToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-ocean/10 bg-white/55 px-4 py-6 backdrop-blur-sm sm:px-6">
      <nav
        aria-label="Page navigation"
        className="mx-auto flex w-full max-w-[90rem] flex-wrap items-center justify-center gap-3"
      >
        <button
          type="button"
          onClick={backToTop}
          className="rounded-full border border-ocean/20 bg-white px-5 py-3 text-sm font-semibold text-ocean transition hover:border-ocean hover:bg-sky/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean"
        >
          ↑ Page up
        </button>

        {!isHomePage ? (
          <Link
            href="/"
            className="rounded-full border border-ocean/20 bg-white px-5 py-3 text-sm font-semibold text-ocean transition hover:border-ocean hover:bg-sky/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean"
          >
            Home
          </Link>
        ) : null}

        {showDashboard ? (
          <Link
            href="/dashboard"
            className="rounded-full bg-portugalGreen px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portugalGreen"
          >
            My Dashboard
          </Link>
        ) : null}
      </nav>
    </footer>
  );
}
