"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Smartphone, Apple, ArrowRight, Download, QrCode } from "lucide-react";

export default function DownloadPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-white py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navyDark text-white">
              <ShieldCheck className="h-5 w-5 text-brand-tealLight" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">SafeLink</span>
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/login" className="text-muted hover:text-foreground">
              Sign In
            </Link>
            <Link href="/register" className="text-brand-teal hover:underline">
              Create Account
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16 flex-1 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Download SafeLink Mobile Apps
          </h1>
          <p className="text-muted text-sm leading-relaxed">
            Engineered for rapid emergency activation and low-latency volunteer dispatch. Available for Android and iOS devices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Women's App */}
          <div className="rounded-2xl border border-border bg-white p-8 shadow-card flex flex-col justify-between space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-brand-teal mb-4">
                <ShieldCheck className="h-4 w-4" />
                For Women • Distress Protection
              </div>
              <h2 className="text-xl font-bold text-foreground">SafeLink Emergency App</h2>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Minimal, one-handed emergency button. No 24/7 background tracking — location collection activates strictly when emergency distress is signaled.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">✓ 1.5-second hold-to-activate emergency button with haptics</li>
                <li className="flex items-center gap-2">✓ Automatic 112 emergency calling shortcut</li>
                <li className="flex items-center gap-2">✓ Encrypted live location broadcast to 3 family contacts</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted font-mono">Version 1.0.0 (Release Build)</p>
                <p className="text-xs font-semibold text-slate-800">Android APK & iOS TestFlight</p>
              </div>
              <button
                type="button"
                onClick={() => alert("SafeLink Women APK package ready in repository under apps/mobile_women.")}
                className="flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2.5 text-xs font-semibold text-white hover:bg-teal-800 shadow-sm transition-colors"
              >
                <Download className="h-4 w-4" />
                Download App
              </button>
            </div>
          </div>

          {/* Volunteer App */}
          <div className="rounded-2xl border border-border bg-white p-8 shadow-card flex flex-col justify-between space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-brand-navy mb-4">
                <Smartphone className="h-4 w-4" />
                For Verified Volunteers
              </div>
              <h2 className="text-xl font-bold text-foreground">SafeLink Volunteer Responder</h2>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Receive nearby distress alerts within 1 km. Strict privacy safeguards ensure exact victim coordinates are only accessible upon authorized acceptance.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">✓ One-tap Available / Unavailable duty toggle</li>
                <li className="flex items-center gap-2">✓ Zero lock-screen PII: privacy-preserving distance alerts</li>
                <li className="flex items-center gap-2">✓ Battery-aware background proximity engine</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted font-mono">Version 1.0.0 (Release Build)</p>
                <p className="text-xs font-semibold text-slate-800">Android APK & iOS TestFlight</p>
              </div>
              <button
                type="button"
                onClick={() => alert("SafeLink Volunteer APK package ready in repository under apps/mobile_volunteer.")}
                className="flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 shadow-sm transition-colors"
              >
                <Download className="h-4 w-4" />
                Download App
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
