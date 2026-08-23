import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageFooterNavigation } from "@/components/page-footer-navigation";
import { PortugueseVoiceLayer } from "@/components/portuguese-voice-layer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portulgiza | European Portuguese for beginners",
  description: "Build real-world European Portuguese confidence through short, practical daily lessons."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <PortugueseVoiceLayer />
        <header className="mx-auto w-full max-w-[90rem] px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
          <nav
            aria-label="Main navigation"
            className="flex w-full flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-[#F8E7D4] bg-[#F8E7D4] p-2 shadow-soft backdrop-blur-xl"
          >
            <Link href="/" aria-label="Portulgiza home" className="shrink-0 rounded-xl px-2 py-1 transition hover:opacity-90">
              <Image
                src="/portulgiza-logo-v2.png"
                alt="Portulgiza — European Portuguese Language Learning App"
                width={1946}
                height={808}
                priority
                sizes="(max-width: 640px) 152px, 190px"
                className="h-auto w-[9.5rem] sm:w-[11.875rem]"
              />
            </Link>

            <p className="order-3 w-full px-2 text-center font-display text-lg font-bold leading-tight text-ink sm:text-xl lg:order-none lg:w-auto lg:flex-1 lg:px-5">
              European Portuguese Language for daily use
            </p>

            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              <Link
                href="/dashboard"
                className="rounded-full border border-portugalGreen/25 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-portugalGreen transition hover:border-portugalGreen hover:bg-portugalGreen/5 sm:px-5 sm:text-sm"
              >
                Dashboard
              </Link>
              <Link
                href="/#learn"
                className="rounded-full border border-portugalBlue/25 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-portugalBlue transition hover:border-portugalBlue hover:bg-portugalBlue/5 sm:px-5 sm:text-sm"
              >
                Learn
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex flex-col items-center rounded-full border border-portugalGold/60 bg-portugalGold/35 px-4 py-2 text-xs font-bold uppercase leading-tight tracking-[0.1em] text-black transition hover:bg-portugalGold/55 sm:px-5 sm:text-sm"
              >
                <span>Subscribe £4.99</span>
                <span className="mt-0.5 text-[0.6rem] tracking-[0.14em] text-black/65 sm:text-[0.65rem]">Monthly</span>
              </Link>
            </div>
          </nav>
          <p className="mt-4 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            A little every day
          </p>
        </header>
        <div className="flex-1">{children}</div>
        <PageFooterNavigation />
      </body>
    </html>
  );
}
