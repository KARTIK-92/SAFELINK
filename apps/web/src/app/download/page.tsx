"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield, ShieldCheck, Smartphone, Download, CheckCircle2,
  HelpCircle, ArrowRight, Zap, Radio, PhoneCall
} from "lucide-react";

export default function DownloadPage() {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownloadClick = (appName: string) => {
    setDownloadSuccess(`Downloading ${appName}. Once the APK downloads, tap it from your notifications to install.`);
    setTimeout(() => setDownloadSuccess(null), 8000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFD] text-[#090D1A]">
      
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xl py-4 sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <Shield className="h-5 w-5 text-rose-400" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-950 font-heading">SafeLink</span>
          </Link>
          <div className="flex items-center gap-4 text-xs font-bold">
            <Link href="/login" className="text-slate-600 hover:text-slate-900 transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="text-rose-600 hover:text-rose-700 hover:underline">
              Register Account
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-14 flex-1 space-y-12">
        
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 border border-rose-200/80 px-3.5 py-1 text-xs font-bold text-rose-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Official Release Builds • Android APK Packages
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 font-heading">
            Download Mobile Apps
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Install the official SafeLink applications directly on your phone. Minimal battery footprint in standby; instant sub-second emergency dispatch when triggered.
          </p>
        </div>

        {/* Download Success Banner */}
        {downloadSuccess && (
          <div className="mx-auto max-w-2xl flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-900 shadow-sm animate-fade-in">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Two App Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Women's App */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700">
                <Zap className="h-3.5 w-3.5" />
                For Women & Students • Distress Protection
              </div>
              <h2 className="text-2xl font-bold text-slate-950 font-heading">SafeLink Women App</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Streamlined, one-handed emergency interface. No 24/7 background location tracking—GPS collection activates strictly during an active distress signal.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>1.5-second hold-to-activate emergency SOS with tactile haptics</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>Encrypted real-time GPS broadcast to 3 family contacts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>Proximity mobilization of vetted nearby community volunteers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>Direct 1-tap 112 national emergency dialer shortcut</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[11px] text-slate-400 font-mono">v1.0.0 (Release Build) • Android 8.0+</p>
                <p className="text-xs font-bold text-slate-800">APK Package (Direct)</p>
              </div>
              <a
                href="/downloads/safelink-women.apk"
                download="SafeLink-Women-v1.0.0.apk"
                onClick={() => handleDownloadClick("SafeLink Women App")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-5 py-3 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:from-rose-700 hover:to-rose-600 active:scale-[0.98] transition-all text-center"
              >
                <Download className="h-4 w-4" />
                Download APK
              </a>
            </div>
          </div>

          {/* Volunteer App */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-800">
                <Radio className="h-3.5 w-3.5" />
                For Verified Community Guardians
              </div>
              <h2 className="text-2xl font-bold text-slate-950 font-heading">SafeLink Volunteer Responder</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Receive high-priority distress alerts within a 1 km radius. Strict privacy ensures exact victim coordinates are only accessible upon authorized acceptance.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>One-tap Available / Off-Duty status switch</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Lock-screen privacy: zero PII shown until dispatch accepted</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Battery-efficient low-power geofencing & background alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Integrated OpenStreetMap live route guidance to victim</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[11px] text-slate-400 font-mono">v1.0.0 (Release Build) • Android 8.0+</p>
                <p className="text-xs font-bold text-slate-800">APK Package (Direct)</p>
              </div>
              <a
                href="/downloads/safelink-volunteer.apk"
                download="SafeLink-Volunteer-v1.0.0.apk"
                onClick={() => handleDownloadClick("SafeLink Volunteer Responder")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-slate-800 active:scale-[0.98] transition-all text-center"
              >
                <Download className="h-4 w-4 text-brand-teal" />
                Download APK
              </a>
            </div>
          </div>

        </div>

        {/* 4-Step Sideloading Guide */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-950 font-heading">
                How to Install the APK on Your Android Device
              </h3>
              <p className="text-xs text-slate-500">
                Standard sideloading instructions for any Android smartphone (Samsung, Xiaomi, OnePlus, Vivo, etc.).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 space-y-2">
              <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-800">Step 1</span>
              <p className="font-bold text-sm text-slate-900 pt-1">Download APK</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tap either &ldquo;Download APK&rdquo; button above directly in Chrome or your phone browser.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 space-y-2">
              <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-800">Step 2</span>
              <p className="font-bold text-sm text-slate-900 pt-1">Open Download</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pull down your notification shade and tap the completed download file, or open your Files app.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 space-y-2">
              <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-800">Step 3</span>
              <p className="font-bold text-sm text-slate-900 pt-1">Allow Install</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                If prompted, toggle &ldquo;Allow installation from this source&rdquo; in Android security settings.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 space-y-2">
              <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-800">Step 4</span>
              <p className="font-bold text-sm text-slate-900 pt-1">Open & Sign In</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tap &ldquo;Install&rdquo;. Open SafeLink and sign in with your verified credentials.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 SafeLink Platform. Built for safety.</p>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-900">Terms</Link>
            <a href="tel:112" className="text-rose-600 font-bold hover:underline">Police 112</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
