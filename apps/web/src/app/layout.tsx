import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#09090B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "SafeLink — Rapid Women's Safety & Nearby Volunteer Assistance",
  description:
    "Help should never be too far away. Connect with trusted family contacts and verified community responders nearby when every second counts.",
  keywords: [
    "women safety",
    "emergency response",
    "volunteer dispatch",
    "sos alert",
    "ephemeral tracking",
    "dpdp compliant",
  ],
  authors: [{ name: "SafeLink Project" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-white font-sans antialiased text-surface-900 selection:bg-surface-950 selection:text-white flex flex-col">
        {children}
      </body>
    </html>
  );
}
