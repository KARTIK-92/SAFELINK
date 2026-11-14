import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-white py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navyDark text-white">
              <ShieldCheck className="h-5 w-5 text-brand-tealLight" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">SafeLink</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 flex-1 space-y-8">
        <div className="border-b border-border pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Privacy Policy & Data Governance</h1>
          <p className="mt-2 text-xs text-muted">
            Last Updated: November 10, 2026 • Compliant with India&apos;s Digital Personal Data Protection Act (DPDP Act 2023)
          </p>
        </div>

        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">1. Privacy by Architecture (Zero 24/7 Tracking)</h2>
            <p>
              SafeLink does not engage in round-the-clock continuous tracking of women. Geolocation coordinates are gathered strictly when a distress incident is initiated by the user through the hold-to-activate emergency button. Coordinate collection ceases immediately upon cancellation or resolution.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">2. Purpose Limitation</h2>
            <p>
              Personal details (legal name, phone number, residential address, KYC verification reference) are processed solely for personal identity authentication, emergency contact dispatch, and proximity-based volunteer responder dispatch. Your data is never sold, shared with advertising brokers, or monetized.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">3. Live Location Sharing & Ephemeral Access</h2>
            <p>
              Live tracking links shared with registered family members utilize high-entropy, 256-bit cryptographically secure tokens. These tokens are stored as SHA-256 hashes on our servers and are immediately invalidated upon cancellation. No tracking link remains accessible after an incident ends.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">4. Data Retention & Auto-Purge Policy</h2>
            <p>
              Detailed GPS breadcrumbs recorded during active emergencies are automatically purged from our production databases 48 hours after incident resolution. Minimal non-identifying audit records are maintained strictly for regulatory and forensic obligations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">5. Right to Erasure (Account Deletion)</h2>
            <p>
              Under the DPDP Act 2023, you retain the unfettered right to request permanent erasure of your personal data. Deleting your account from the dashboard permanently purges all profile records, emergency contact relationships, stored photographs, and device tokens.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">6. Data Protection Officer (DPO) Contact</h2>
            <p>
              For grievances, inquiries, or statutory rights requests, please contact our Data Protection Officer at:{" "}
              <a href="mailto:dpo@safelink.local" className="text-brand-teal font-medium hover:underline">
                dpo@safelink.local
              </a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
