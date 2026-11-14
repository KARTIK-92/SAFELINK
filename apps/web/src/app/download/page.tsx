"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, Smartphone, Download, CheckCircle2,
  HelpCircle, ArrowRight, ArrowLeft, Shield, Users
} from "lucide-react";

export default function DownloadPage() {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownloadClick = (appName: string) => {
    setDownloadSuccess(`Downloading ${appName}. Once completed, tap the file in your downloads folder to install.`);
    setTimeout(() => setDownloadSuccess(null), 8000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      {/* Navigation Header */}
      <header className="border-b border-neutral-200 bg-white py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-950 text-white shadow-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-base font-bold tracking-tight text-neutral-950">SafeLink</span>
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/login" className="text-neutral-600 hover:text-neutral-950">
              Sign In
            </Link>
            <Link href="/register" className="text-neutral-950 underline underline-offset-4">
              Create Account
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-14 flex-1 space-y-12">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Official Release Builds • Android APK Direct Download
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            Download SafeLink Mobile Applications
          </h1>
          <p className="text-neutral-600 text-sm leading-relaxed">
            Directly install the official SafeLink applications onto your Android smartphone.
            Built with Flutter & Dart for rapid, zero-latency emergency activation.
          </p>
        </div>

        {/* Recommended Instant Option: PWA */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                Recommended • Zero Sideloading Warning
              </div>
              <h2 className="text-base font-bold text-neutral-950">Install Directly via Mobile Browser (PWA)</h2>
              <p className="text-xs text-neutral-600 max-w-2xl leading-relaxed">
                SafeLink runs as a Progressive Web App on all modern smartphones. On Android (Chrome) or iOS (Safari), tap <strong>Menu (⋮) &rarr; &quot;Add to Home screen&quot;</strong> or <strong>&quot;Install app&quot;</strong> for instant, full-screen offline-ready access.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 transition active:scale-[0.98]"
            >
              Open Web App
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {downloadSuccess && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 shadow-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Women's App */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-7 sm:p-8 flex flex-col justify-between space-y-6 shadow-sm">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-800">
                <Shield className="h-3.5 w-3.5 text-rose-600" />
                For Women • Distress Protection
              </div>
              <h2 className="text-xl font-bold tracking-tight text-neutral-950">SafeLink Women SOS App</h2>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Streamlined, one-touch emergency response interface. No 24/7 background tracking — location collection activates strictly when distress is signaled.
              </p>
              <ul className="space-y-2 text-xs text-neutral-700 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>1.5-second hold-to-activate emergency SOS with haptic pulse</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Real-time GPS broadcast to 3 registered emergency contacts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Proximity dispatch to verified nearby community volunteers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Direct 112 national emergency services dialer</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[11px] text-neutral-500 font-mono">v1.0.0 • Android 8.0+</p>
                <p className="text-xs font-semibold text-neutral-900">Release Build (Direct)</p>
              </div>
              <a
                href="/downloads/safelink-women.apk"
                download="SafeLink-Women-v1.0.0.apk"
                onClick={() => handleDownloadClick("SafeLink Women SOS")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800 transition-all shadow-sm active:scale-[0.98]"
              >
                <Download className="h-3.5 w-3.5" />
                Download APK
              </a>
            </div>
          </div>

          {/* Volunteer App */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-7 sm:p-8 flex flex-col justify-between space-y-6 shadow-sm">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-800">
                <Users className="h-3.5 w-3.5 text-neutral-600" />
                For Verified Community Volunteers
              </div>
              <h2 className="text-xl font-bold tracking-tight text-neutral-950">SafeLink Volunteer Responder</h2>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Receive high-priority distress alerts within a 1 km radius. Exact coordinates are protected by encryption and only revealed upon accepted dispatch.
              </p>
              <ul className="space-y-2 text-xs text-neutral-700 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>One-tap Available / Off-Duty status switch</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Lock-screen privacy: zero PII shown until dispatch accepted</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Battery-efficient low-power geofencing & background alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Integrated OpenStreetMap live route guidance to victim</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[11px] text-neutral-500 font-mono">v1.0.0 • Android 8.0+</p>
                <p className="text-xs font-semibold text-neutral-900">Release Build (Direct)</p>
              </div>
              <a
                href="/downloads/safelink-volunteer.apk"
                download="SafeLink-Volunteer-v1.0.0.apk"
                onClick={() => handleDownloadClick("SafeLink Volunteer Responder")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800 transition-all shadow-sm active:scale-[0.98]"
              >
                <Download className="h-3.5 w-3.5" />
                Download APK
              </a>
            </div>
          </div>
        </div>

        {/* Installation Instructions */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-7 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="h-5 w-5 text-neutral-700" />
            <h3 className="text-base font-bold text-neutral-950">How to Install SafeLink APK on Your Android Device</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-neutral-600">
            <div className="rounded-xl bg-neutral-50 p-4 border border-neutral-100 space-y-1.5">
              <span className="font-mono text-[10px] font-bold text-neutral-500 uppercase">Step 01</span>
              <p className="font-semibold text-neutral-900">Download APK</p>
              <p className="leading-relaxed">Tap either &ldquo;Download APK&rdquo; button above on your smartphone browser.</p>
            </div>
            <div className="rounded-xl bg-neutral-50 p-4 border border-neutral-100 space-y-1.5">
              <span className="font-mono text-[10px] font-bold text-neutral-500 uppercase">Step 02</span>
              <p className="font-semibold text-neutral-900">Open File</p>
              <p className="leading-relaxed">Pull down your notification shade or open your phone&apos;s Files / Downloads app.</p>
            </div>
            <div className="rounded-xl bg-neutral-50 p-4 border border-neutral-100 space-y-1.5">
              <span className="font-mono text-[10px] font-bold text-neutral-500 uppercase">Step 03</span>
              <p className="font-semibold text-neutral-900">Enable Sources</p>
              <p className="leading-relaxed">If prompted by Android security, toggle &ldquo;Allow installation from this source&rdquo;.</p>
            </div>
            <div className="rounded-xl bg-neutral-50 p-4 border border-neutral-100 space-y-1.5">
              <span className="font-mono text-[10px] font-bold text-neutral-500 uppercase">Step 04</span>
              <p className="font-semibold text-neutral-900">Log In</p>
              <p className="leading-relaxed">Tap &ldquo;Install&rdquo;. Open the app and sign in with your verified SafeLink account.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
