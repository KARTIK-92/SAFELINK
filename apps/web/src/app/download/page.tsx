"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, Smartphone, Download, CheckCircle2,
  AlertTriangle, Info, HelpCircle, ArrowRight
} from "lucide-react";

export default function DownloadPage() {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownloadClick = (appName: string) => {
    setDownloadSuccess(`Downloading ${appName}. Once finished, tap the APK in your downloads folder to install.`);
    setTimeout(() => setDownloadSuccess(null), 8000);
  };

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

      <main className="mx-auto max-w-5xl px-6 py-12 flex-1 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-semibold text-brand-teal">
            <ShieldCheck className="h-3.5 w-3.5" />
            Official Release Builds • Android APK Direct Download
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Download SafeLink Mobile Applications
          </h1>
          <p className="text-muted text-sm leading-relaxed">
            Directly install the official SafeLink applications onto your smartphone. Zero tracking in standby; instant emergency activation when needed.
          </p>
        </div>

        {downloadSuccess && (
          <div className="mx-auto max-w-2xl flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4 text-xs text-brand-teal shadow-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Women's App */}
          <div className="rounded-2xl border border-border bg-white p-8 shadow-card flex flex-col justify-between space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-brand-teal mb-4">
                <ShieldCheck className="h-4 w-4" />
                For Women • Rapid Distress Protection
              </div>
              <h2 className="text-xl font-bold text-foreground">SafeLink Women App</h2>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Streamlined, one-touch emergency response interface. No 24/7 background tracking — location collection activates strictly when distress is signaled.
              </p>
              <ul className="mt-4 space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-teal shrink-0" />
                  <span>1.5-second hold-to-activate emergency SOS with haptic pulse</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-teal shrink-0" />
                  <span>Real-time GPS broadcast to 3 registered emergency contacts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-teal shrink-0" />
                  <span>Proximity dispatch to verified nearby community volunteers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-teal shrink-0" />
                  <span>Quick 112 national emergency services dialer</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[11px] text-muted font-mono">v1.0.0 • Android 8.0+</p>
                <p className="text-xs font-semibold text-slate-800">APK Package (Direct)</p>
              </div>
              <a
                href="/downloads/safelink-women.apk"
                download="SafeLink-Women-v1.0.0.apk"
                onClick={() => handleDownloadClick("SafeLink Women App")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-teal px-5 py-2.5 text-xs font-semibold text-white hover:bg-teal-800 shadow-sm transition-colors text-center"
              >
                <Download className="h-4 w-4" />
                Download APK
              </a>
            </div>
          </div>

          {/* Volunteer App */}
          <div className="rounded-2xl border border-border bg-white p-8 shadow-card flex flex-col justify-between space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-brand-navy mb-4">
                <Smartphone className="h-4 w-4" />
                For Verified Community Volunteers
              </div>
              <h2 className="text-xl font-bold text-foreground">SafeLink Volunteer Responder</h2>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Receive high-priority distress alerts within a 1 km radius. Exact coordinates are protected by encryption and only revealed upon accepted dispatch.
              </p>
              <ul className="mt-4 space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-navy shrink-0" />
                  <span>One-tap Available / Off-Duty status switch</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-navy shrink-0" />
                  <span>Lock-screen privacy: zero PII shown until dispatch accepted</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-navy shrink-0" />
                  <span>Battery-efficient low-power geofencing & background alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-navy shrink-0" />
                  <span>Integrated OpenStreetMap live route guidance to victim</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[11px] text-muted font-mono">v1.0.0 • Android 8.0+</p>
                <p className="text-xs font-semibold text-slate-800">APK Package (Direct)</p>
              </div>
              <a
                href="/downloads/safelink-volunteer.apk"
                download="SafeLink-Volunteer-v1.0.0.apk"
                onClick={() => handleDownloadClick("SafeLink Volunteer Responder")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-navy px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 shadow-sm transition-colors text-center"
              >
                <Download className="h-4 w-4" />
                Download APK
              </a>
            </div>
          </div>
        </div>

        {/* Installation Instructions */}
        <div className="rounded-2xl border border-border bg-slate-50/70 p-8">
          <div className="flex items-center gap-2.5 mb-4">
            <HelpCircle className="h-5 w-5 text-brand-navy" />
            <h3 className="text-base font-bold text-foreground">How to Install SafeLink APK on Your Android Device</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-slate-700">
            <div className="rounded-xl bg-white p-4 border border-slate-200">
              <span className="inline-block rounded-full bg-slate-100 text-brand-navy font-bold px-2 py-0.5 text-xs mb-2">Step 1</span>
              <p className="font-semibold text-slate-900 mb-1">Download APK</p>
              <p className="text-muted leading-relaxed">Tap either &ldquo;Download APK&rdquo; button above on your smartphone browser.</p>
            </div>
            <div className="rounded-xl bg-white p-4 border border-slate-200">
              <span className="inline-block rounded-full bg-slate-100 text-brand-navy font-bold px-2 py-0.5 text-xs mb-2">Step 2</span>
              <p className="font-semibold text-slate-900 mb-1">Open Downloaded File</p>
              <p className="text-muted leading-relaxed">Pull down your notification shade or open your phone&apos;s Files / Downloads app.</p>
            </div>
            <div className="rounded-xl bg-white p-4 border border-slate-200">
              <span className="inline-block rounded-full bg-slate-100 text-brand-navy font-bold px-2 py-0.5 text-xs mb-2">Step 3</span>
              <p className="font-semibold text-slate-900 mb-1">Enable Unknown Sources</p>
              <p className="text-muted leading-relaxed">If prompted by Android security, toggle &ldquo;Allow installation from this source&rdquo;.</p>
            </div>
            <div className="rounded-xl bg-white p-4 border border-slate-200">
              <span className="inline-block rounded-full bg-slate-100 text-brand-navy font-bold px-2 py-0.5 text-xs mb-2">Step 4</span>
              <p className="font-semibold text-slate-900 mb-1">Complete Installation</p>
              <p className="text-muted leading-relaxed">Tap &ldquo;Install&rdquo;. Open the application and sign in with your verified SafeLink account.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
