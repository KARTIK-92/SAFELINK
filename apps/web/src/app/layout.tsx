import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SafeLink — Rapid Women's Safety & Nearby Volunteer Assistance",
  description: "Help should never be too far away. Connect with trusted family contacts and verified community responders nearby when every second counts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased text-foreground flex flex-col">
        {children}
      </body>
    </html>
  );
}
