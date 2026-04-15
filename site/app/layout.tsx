import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portuguese Path",
  description: "A beginner-friendly European Portuguese learning app."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
