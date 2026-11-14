import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock, FileText, CheckCircle2, ShieldAlert } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#070B14] text-slate-100 selection:bg-rose-500/30">
      <header className="border-b border-white/5 bg-[#090D1A]/90 sticky top-0 z-40 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-lg shadow-rose-900/30 group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-lg font-black tracking-tight text-white font-heading">SafeLink</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 flex-1 space-y-8">
        <div className="border-b border-white/5 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
            <ShieldCheck className="h-3.5 w-3.5" />
            DPDP Act 2023 Compliant Charter
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-heading">
            Privacy Policy & Data Governance
          </h1>
          <p className="mt-2 text-xs text-slate-400 font-mono">
            Governed by India&apos;s Digital Personal Data Protection Act (DPDP Act 2023) • Strict Purpose Limitation
          </p>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section className="rounded-2xl border border-white/10 bg-[#0D1322]/80 p-6 backdrop-blur-xl">
            <h2 className="text-base font-bold text-white font-heading mb-2 flex items-center gap-2">
              <span className="text-rose-400">1.</span> Privacy by Architecture (Zero 24/7 Tracking)
            </h2>
            <p className="text-slate-400">
              SafeLink does not engage in round-the-clock continuous tracking of users. Geolocation coordinates are gathered strictly when a distress incident is initiated by the user through the hold-to-activate emergency button. Coordinate collection ceases immediately upon cancellation or resolution.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0D1322]/80 p-6 backdrop-blur-xl">
            <h2 className="text-base font-bold text-white font-heading mb-2 flex items-center gap-2">
              <span className="text-rose-400">2.</span> Strict Purpose Limitation
            </h2>
            <p className="text-slate-400">
              Personal details (legal name, phone number, residential address, KYC verification reference) are processed solely for personal identity authentication, emergency contact dispatch, and proximity-based volunteer responder dispatch. Your data is never sold, shared with advertising brokers, or monetized.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0D1322]/80 p-6 backdrop-blur-xl">
            <h2 className="text-base font-bold text-white font-heading mb-2 flex items-center gap-2">
              <span className="text-rose-400">3.</span> Live Location Sharing & Ephemeral Cryptographic Access
            </h2>
            <p className="text-slate-400">
              Live tracking links shared with registered family members utilize high-entropy, 256-bit cryptographically secure tokens. These tokens are stored as SHA-256 hashes on our servers and are immediately invalidated upon cancellation. No tracking link remains accessible after an incident ends.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0D1322]/80 p-6 backdrop-blur-xl">
            <h2 className="text-base font-bold text-white font-heading mb-2 flex items-center gap-2">
              <span className="text-rose-400">4.</span> 48-Hour Auto-Purge Policy
            </h2>
            <p className="text-slate-400">
              Detailed GPS breadcrumbs recorded during active emergencies are automatically purged from our production databases 48 hours after incident resolution. Minimal non-identifying audit records are maintained strictly for regulatory and forensic obligations.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0D1322]/80 p-6 backdrop-blur-xl">
            <h2 className="text-base font-bold text-white font-heading mb-2 flex items-center gap-2">
              <span className="text-rose-400">5.</span> Statutory Right to Erasure
            </h2>
            <p className="text-slate-400">
              Under the DPDP Act 2023, you retain the unfettered right to request permanent erasure of your personal data. Deleting your account from the dashboard permanently purges all profile records, emergency contact relationships, stored photographs, and device tokens.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0D1322]/80 p-6 backdrop-blur-xl">
            <h2 className="text-base font-bold text-white font-heading mb-2 flex items-center gap-2">
              <span className="text-rose-400">6.</span> Data Protection Officer (DPO) Contact
            </h2>
            <p className="text-slate-400">
              For grievances, inquiries, or statutory rights requests, please contact our Data Protection Officer at:{" "}
              <a href="mailto:dpo@safelink.local" className="text-rose-400 font-semibold hover:underline">
                dpo@safelink.local
              </a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
