import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Mail, Phone, MapPin, HelpCircle, Shield, LifeBuoy } from "lucide-react";

export default function SupportPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-3">
            <LifeBuoy className="h-3.5 w-3.5" />
            Direct Support & Redressal
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-heading">
            Support & Grievance Redressal
          </h1>
          <p className="mt-2 text-xs text-slate-400 font-mono">
            Platform Assistance, Emergency Response Queries & DPDP Data Requests
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300">
          <div className="rounded-3xl border border-white/10 bg-[#0D1322]/80 p-6 backdrop-blur-xl space-y-4">
            <h2 className="text-base font-bold text-white font-heading flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-rose-400" />
              General Help & App Technical Support
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Assistance with mobile app APK installation, emergency contact configuration, phone/email OTP verification, or volunteer account onboarding.
            </p>
            <div className="space-y-3 text-xs pt-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-rose-400 border border-white/10">
                  <Mail className="h-4 w-4" />
                </div>
                <span className="font-mono text-white">support@safelink.local</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-rose-400 border border-white/10">
                  <Phone className="h-4 w-4" />
                </div>
                <span className="font-mono text-white">1800-SAFELINK (Toll-Free Helpline)</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0D1322]/80 p-6 backdrop-blur-xl space-y-4">
            <h2 className="text-base font-bold text-white font-heading flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Data Protection Officer (DPO)
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Designated Grievance Officer in compliance with Section 10 of India&apos;s Digital Personal Data Protection Act (DPDP Act 2023).
            </p>
            <div className="space-y-3 text-xs pt-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-emerald-400 border border-white/10">
                  <Mail className="h-4 w-4" />
                </div>
                <span className="font-mono text-white">dpo@safelink.local</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-emerald-400 border border-white/10">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="text-slate-300">SafeLink Redressal Office, Bengaluru, Karnataka, India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contacts Reminder Banner */}
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white font-heading">In An Active Emergency?</h3>
            <p className="text-xs text-rose-200 mt-1">
              Do not email support. Connect immediately with national emergency dispatchers.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="tel:112"
              className="rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-950 transition-colors"
            >
              Dial 112 (Police)
            </a>
            <a
              href="tel:1091"
              className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-5 py-2.5 text-xs font-bold text-white transition-colors"
            >
              Dial 1091 (Women Helpline)
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
