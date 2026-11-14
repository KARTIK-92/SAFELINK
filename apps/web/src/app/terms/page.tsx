import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, AlertTriangle } from "lucide-react";

export default function TermsPage() {
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
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-heading">
            Terms of Service
          </h1>
          <p className="mt-2 text-xs text-slate-400 font-mono">
            Operational Safety & Legal Framework • SafeLink Emergency Network
          </p>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-5 text-amber-200">
            <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              CRITICAL NOTICE: Auxiliary Community Presence
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              SafeLink volunteers provide a localized community presence layer to bridge the initial critical minutes. SafeLink does not and cannot guarantee that volunteers will arrive at any guaranteed time. SafeLink is not a replacement for official police (112), medical ambulances (108), or fire rescue.
            </p>
          </div>

          <section className="rounded-2xl border border-white/10 bg-[#0D1322]/80 p-6 backdrop-blur-xl">
            <h2 className="text-base font-bold text-white font-heading mb-2 flex items-center gap-2">
              <span className="text-rose-400">1.</span> User Eligibility & Identity Verification
            </h2>
            <p className="text-slate-400">
              Users must be at least 18 years old to register. Registration for the emergency distress protection role is strictly reserved for eligible female members. Registration as a community volunteer responder is open to all qualified adults who complete mandatory KYC vetting.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0D1322]/80 p-6 backdrop-blur-xl">
            <h2 className="text-base font-bold text-white font-heading mb-2 flex items-center gap-2">
              <span className="text-rose-400">2.</span> False Alarms & Prohibited Misuse
            </h2>
            <p className="text-slate-400">
              Malicious or intentional repeated triggering of false emergency alerts constitutes a severe violation of community trust and legal terms. SafeLink reserves the right to suspend accounts, revoke volunteer access, and cooperate with law enforcement authorities for intentional misuse of emergency systems.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0D1322]/80 p-6 backdrop-blur-xl">
            <h2 className="text-base font-bold text-white font-heading mb-2 flex items-center gap-2">
              <span className="text-rose-400">3.</span> Volunteer Code of Conduct
            </h2>
            <p className="text-slate-400">
              Volunteers must adhere to the SafeLink Safety Guidelines at all times: prioritize personal and victim safety, never engage in vigilantism or armed confrontation, and notify 112 immediately upon recognizing imminent physical peril.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0D1322]/80 p-6 backdrop-blur-xl">
            <h2 className="text-base font-bold text-white font-heading mb-2 flex items-center gap-2">
              <span className="text-rose-400">4.</span> Good Samaritan Protections
            </h2>
            <p className="text-slate-400">
              Community volunteers acting in good faith to assist a distressed person operate under the protections of Section 134A of the Motor Vehicles Act and Supreme Court Good Samaritan Guidelines, shielding responders from harassment, civil liability, or criminal prosecution.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
