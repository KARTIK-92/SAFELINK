import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#090D1A",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "SafeLink — Rapid Women's Safety & Nearby Volunteer Assistance",
  description: "Help should never be too far away. Connect with trusted family contacts and verified community responders nearby when every second counts.",
  keywords: ["women safety", "emergency response", "rapid assistance", "community responders", "live location tracking"],
  authors: [{ name: "SafeLink Foundation" }],
  openGraph: {
    title: "SafeLink — Help Should Never Be Too Far Away",
    description: "Rapid women's safety platform combining instant family alert dispatch with PostGIS-powered nearby verified volunteer assistance.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground flex flex-col selection:bg-rose-100 selection:text-rose-900">
        {children}
      </body>
    </html>
  );
}
