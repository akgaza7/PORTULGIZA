import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HeaderActions } from "@/components/header-actions";
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
                sizes="(max-width: 640px) 179px, 224px"
                className="h-auto w-[11.18rem] sm:w-[13.98rem]"
              />
            </Link>

            <p className="order-3 w-full px-2 text-center font-display text-lg font-bold leading-tight text-ink sm:text-xl lg:order-none lg:w-auto lg:flex-1 lg:px-5">
              European Portuguese Language for daily use
            </p>

            <HeaderActions />
          </nav>
          <div className="mt-4">
            <p className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              A little learning everyday
            </p>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <PageFooterNavigation />
      </body>
    </html>
  );
}
