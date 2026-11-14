"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield, ShieldCheck, HeartHandshake, MapPin, Radio, Bell, ArrowRight,
  Lock, PhoneCall, AlertTriangle, CheckCircle2, ChevronDown,
  Download, Smartphone, Compass, Clock, Eye, EyeOff, Zap, Users,
  HelpCircle, FileCheck, ShieldAlert, Check
} from "lucide-react";

export default function HomePage() {
  // Interactive Simulator State
  const [activeTab, setActiveTab] = useState<"woman" | "volunteer" | "family">("woman");
  const [holdingProgress, setHoldingProgress] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [sosActive, setSosActive] = useState<boolean>(false);
  const [volunteerAccepted, setVolunteerAccepted] = useState<boolean>(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Handle Hold-to-Activate Simulation
  useEffect(() => {
    let interval: any;
    if (isHolding && !sosActive) {
      interval = setInterval(() => {
        setHoldingProgress((prev) => {
          if (prev >= 100) {
            setSosActive(true);
            setIsHolding(false);
            return 0;
          }
          return prev + 6;
        });
      }, 50);
    } else {
      setHoldingProgress(0);
    }
    return () => clearInterval(interval);
  }, [isHolding, sosActive]);

  const faqs = [
    {
      q: "Does SafeLink replace police or official 112 emergency services?",
      a: "No. SafeLink is designed to complement official emergency services, never replace them. In any life-threatening crisis, calling 112 is always the priority. However, police and ambulances can take 10 to 20 minutes to reach you through city traffic. SafeLink mobilizes background-checked, verified community volunteers within 1 km who can arrive in 2 to 4 minutes to provide immediate human presence and deterrence while official help is on the way."
    },
    {
      q: "How does SafeLink protect women from stalkers or malicious volunteers?",
      a: "SafeLink enforces a strict Zero-Trust privacy model. First, volunteers never see a woman's name, profile photo, or coordinates on their initial lock screen—they only see an approximate distance (e.g. '~280m away'). Second, only users who complete Government ID Vetting (DigiLocker / Aadhaar verification) and Biometric Facial Liveness checks are eligible to respond. Third, dispatches are capped at a maximum of 3 responders to prevent crowd convergence. Finally, every incident is cryptographically signed and logged for law enforcement."
    },
    {
      q: "Does SafeLink track my GPS location 24/7 in the background?",
      a: "Never. Under India's Digital Personal Data Protection (DPDP) Act 2023, continuous background tracking of women is strictly forbidden. Location capture activates strictly and exclusively when you hold the SOS button for 1.5 seconds. The moment you tap 'Cancel Emergency' or the incident concludes, all location streaming halts and access tokens are cryptographically revoked."
    },
    {
      q: "What happens if no verified volunteers are nearby when I trigger SOS?",
      a: "Your safety is never left to chance. Even if no volunteer is nearby, your emergency activation immediately does two vital things: (1) Dispatches instant SMS, WhatsApp, and email alerts containing an unguessable live-tracking link to your up to 3 registered emergency contacts, and (2) Provides an immediate one-tap shortcut to connect directly with national emergency helpline 112."
    },
    {
      q: "Do my family members need to install an app to track my live location?",
      a: "No. Your emergency contacts receive a secure, 256-bit encrypted web link that opens directly in any smartphone or desktop browser. They can view your live coordinates, accuracy radius, and response status in real time with zero installation required."
    }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Top Banner: Emergency Helpline Indicator */}
      <div className="border-b border-neutral-100 bg-neutral-900 px-4 py-2 text-center text-xs font-medium text-neutral-300">
        <span className="text-neutral-400">National Emergency Services:</span>{" "}
        <a href="tel:112" className="font-semibold text-white underline underline-offset-2 hover:text-rose-400 ml-1">
          Call 112 Directly
        </a>
        <span className="mx-2 text-neutral-600">•</span>
        <span>Women in Distress Helpline: <strong>1091</strong></span>
      </div>

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white shadow-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-neutral-950">SafeLink</span>
              <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-wider text-neutral-400 -mt-0.5">
                Rapid Safety Protocol
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-neutral-600">
            <a href="#how-it-works" className="hover:text-neutral-950 transition-colors">How It Works</a>
            <a href="#protection" className="hover:text-neutral-950 transition-colors">For Women</a>
            <a href="#volunteers" className="hover:text-neutral-950 transition-colors">Volunteers</a>
            <a href="#security" className="hover:text-neutral-950 transition-colors">Security & DPDP</a>
            <a href="#downloads" className="hover:text-neutral-950 transition-colors">Download APKs</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-neutral-600 hover:text-neutral-950 px-3 py-1.5 rounded-md hover:bg-neutral-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register?role=woman"
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-950 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-neutral-800 transition-all active:scale-[0.98]"
            >
              Get Protected
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ========================================================================= */}
        {/* 1. HERO SECTION                                                           */}
        {/* ========================================================================= */}
        <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-3xl space-y-6">
              {/* Status Chip */}
              <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-medium text-neutral-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Verified Community Emergency Network • DPDP Act Compliant</span>
              </div>

              {/* Master Headline */}
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl text-neutral-950 leading-[1.08]">
                Help should never be too far away.
              </h1>

              {/* Editorial Subtitle */}
              <p className="text-base sm:text-lg text-neutral-600 leading-relaxed font-normal max-w-2xl">
                When official emergency assistance is minutes away, a verified person nearby can arrive in seconds.
                SafeLink pairs instant encrypted family tracking with 1 km PostGIS community volunteer dispatch.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/register?role=woman"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 transition-all active:scale-[0.98]"
                >
                  Register for Protection
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/register?role=volunteer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 transition-all active:scale-[0.98]"
                >
                  <HeartHandshake className="h-4 w-4 text-neutral-500" />
                  Join as Volunteer Responder
                </Link>

                <Link
                  href="/download"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download APKs (v1.0.0)
                </Link>
              </div>

              {/* Key Trust Signals */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-neutral-100 text-xs text-neutral-500">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-neutral-400 shrink-0" />
                  <span>Zero 24/7 background tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-neutral-400 shrink-0" />
                  <span>Government ID & Liveness vetted</span>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-neutral-400 shrink-0" />
                  <span>Instant 112 police integration</span>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* INTERACTIVE EMERGENCY PROTOCOL SIMULATOR                                  */}
            {/* Handcrafted component allowing user to experience all 3 perspectives     */}
            {/* ========================================================================= */}
            <div className="mt-14 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Live System Demonstration
                  </p>
                  <h3 className="text-sm font-semibold text-neutral-950 mt-0.5">
                    Experience the 3 Synchronized Perspectives
                  </h3>
                </div>

                {/* Perspective Switcher */}
                <div className="flex rounded-lg border border-neutral-200 bg-white p-1 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setActiveTab("woman")}
                    className={`rounded-md px-3 py-1.5 transition-all ${
                      activeTab === "woman"
                        ? "bg-neutral-950 text-white shadow-sm font-semibold"
                        : "text-neutral-600 hover:text-neutral-950"
                    }`}
                  >
                    1. Distressed Woman
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("volunteer")}
                    className={`rounded-md px-3 py-1.5 transition-all ${
                      activeTab === "volunteer"
                        ? "bg-neutral-950 text-white shadow-sm font-semibold"
                        : "text-neutral-600 hover:text-neutral-950"
                    }`}
                  >
                    2. Nearby Volunteer
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("family")}
                    className={`rounded-md px-3 py-1.5 transition-all ${
                      activeTab === "family"
                        ? "bg-neutral-950 text-white shadow-sm font-semibold"
                        : "text-neutral-600 hover:text-neutral-950"
                    }`}
                  >
                    3. Family Tracking Link
                  </button>
                </div>
              </div>

              {/* SIMULATOR VIEWPORT */}
              <div className="mt-6 bg-white rounded-xl border border-neutral-200 p-6 sm:p-8">
                {/* --- TAB 1: WOMAN'S DISTRESS VIEW --- */}
                {activeTab === "woman" && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    <div className="md:col-span-7 space-y-4">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[11px] font-semibold text-rose-800">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                        One-Handed Mobile Activation
                      </div>
                      <h4 className="text-xl font-bold tracking-tight text-neutral-950">
                        {sosActive ? "Emergency Active — Dispatch in Progress" : "Hold Button for 1.5 Seconds to Test SOS"}
                      </h4>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        {sosActive
                          ? "Your high-precision GPS coordinates are now streaming to registered family members and vetted responders within 1,000 meters. Emergency helpline 112 is armed."
                          : "To prevent accidental triggers in bags or pockets, SafeLink requires a deliberate 1.5-second hold with haptic confirmation before triggering the incident."}
                      </p>

                      <div className="space-y-2 pt-2 text-xs">
                        <div className="flex items-center gap-2 text-neutral-700">
                          <CheckCircle2 className={`h-4 w-4 ${sosActive ? "text-emerald-600" : "text-neutral-300"}`} />
                          <span>GPS Accuracy: ±6 meters (Hardware High-Res Fix)</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-700">
                          <CheckCircle2 className={`h-4 w-4 ${sosActive ? "text-emerald-600" : "text-neutral-300"}`} />
                          <span>3 Emergency Contacts Dispatched via SMS, WhatsApp & Email</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-700">
                          <CheckCircle2 className={`h-4 w-4 ${sosActive ? "text-emerald-600" : "text-neutral-300"}`} />
                          <span>PostGIS Radius Scan: 14 Volunteers Notified within 1 km</span>
                        </div>
                      </div>

                      {sosActive && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSosActive(false);
                              setVolunteerAccepted(false);
                            }}
                            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shadow-sm"
                          >
                            Cancel Emergency (Revokes All Links)
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-xl bg-neutral-50 border border-neutral-100">
                      {!sosActive ? (
                        <div className="text-center space-y-4">
                          <button
                            type="button"
                            onMouseDown={() => setIsHolding(true)}
                            onMouseUp={() => setIsHolding(false)}
                            onMouseLeave={() => setIsHolding(false)}
                            onTouchStart={() => setIsHolding(true)}
                            onTouchEnd={() => setIsHolding(false)}
                            className="relative flex h-32 w-32 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-600/20 active:scale-95 transition-all select-none mx-auto"
                          >
                            {/* Radial progress ring */}
                            <svg className="absolute inset-0 h-full w-full -rotate-90">
                              <circle
                                cx="64"
                                cy="64"
                                r="60"
                                stroke="#fecdd3"
                                strokeWidth="4"
                                fill="transparent"
                              />
                              <circle
                                cx="64"
                                cy="64"
                                r="60"
                                stroke="#ffffff"
                                strokeWidth="6"
                                fill="transparent"
                                strokeDasharray={377}
                                strokeDashoffset={377 - (377 * holdingProgress) / 100}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="font-extrabold text-xl tracking-wider uppercase">
                              {isHolding ? `${Math.round(holdingProgress)}%` : "SOS"}
                            </span>
                          </button>
                          <p className="text-[11px] text-neutral-500 font-mono">
                            Press & hold button to simulate trigger
                          </p>
                        </div>
                      ) : (
                        <div className="w-full space-y-3 text-center">
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mx-auto animate-pulse">
                            <Radio className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-neutral-900">SOS Signal Broadcasting</p>
                            <p className="text-xs text-neutral-500 font-mono mt-0.5">Token: 256-Bit Ephemeral SHA</p>
                          </div>
                          <a
                            href="tel:112"
                            className="inline-flex items-center justify-center gap-2 w-full rounded-lg bg-neutral-950 py-2.5 text-xs font-bold text-white hover:bg-neutral-800"
                          >
                            <PhoneCall className="h-3.5 w-3.5 text-rose-400" />
                            Direct Call 112
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* --- TAB 2: NEARBY VOLUNTEER RESPONDER VIEW --- */}
                {activeTab === "volunteer" && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    <div className="md:col-span-7 space-y-4">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        Privacy-Preserving Distance Alert
                      </div>
                      <h4 className="text-xl font-bold tracking-tight text-neutral-950">
                        {volunteerAccepted
                          ? "Dispatch Accepted — Turn-by-Turn Route Unlocked"
                          : "Zero PII Lock-Screen Proximity Ping"}
                      </h4>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        {volunteerAccepted
                          ? "Authorized responders see the safest route to victim's coordinates. Maximum 3 responders per incident to prevent crowding. Always accompany with police presence."
                          : "Volunteers see only approximate distance (e.g. '~210m away') and incident status. The victim's exact coordinates and name are completely concealed until a volunteer explicitly accepts dispatch."}
                      </p>

                      <div className="space-y-2 pt-2 text-xs">
                        <div className="flex items-center gap-2 text-neutral-700">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Proximity Match: 210 meters away (approx. 2 min walking distance)</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-700">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Victim Identity Protection: Name and photo concealed on lock screen</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-700">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Atomic Responder Cap: Locked at 3 responders maximum</span>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-5 p-5 rounded-xl border border-neutral-200 bg-neutral-50 space-y-4">
                      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                        <span className="text-[11px] font-mono font-semibold uppercase text-neutral-500">
                          Volunteer Push Notification
                        </span>
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-600 font-bold text-xs">
                            !
                          </span>
                          <span className="text-xs font-bold text-neutral-900">DISTRESS ALERT NEAR YOU</span>
                        </div>
                        <p className="text-xs text-neutral-600">
                          A person needs assistance approximately <strong>210 meters</strong> from your location near MG Road.
                        </p>
                      </div>

                      {!volunteerAccepted ? (
                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setVolunteerAccepted(true)}
                            className="flex-1 rounded-lg bg-neutral-950 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800 shadow-sm transition-all"
                          >
                            Accept & View Route
                          </button>
                          <button
                            type="button"
                            onClick={() => setVolunteerAccepted(false)}
                            className="px-3 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs space-y-2">
                          <div className="flex items-center justify-between font-semibold text-emerald-800">
                            <span>Dispatch Confirmed</span>
                            <span>ETA: 1 min 45 sec</span>
                          </div>
                          <p className="text-[11px] text-emerald-700 leading-relaxed">
                            Turn-by-turn guidance open. Remember: act as a peaceful deterrent and stay in communication with emergency services.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* --- TAB 3: FAMILY LIVE MAP TRACKING VIEW --- */}
                {activeTab === "family" && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    <div className="md:col-span-7 space-y-4">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-800">
                        <MapPin className="h-3.5 w-3.5 text-neutral-600" />
                        Ephemeral Web Tracking Portal
                      </div>
                      <h4 className="text-xl font-bold tracking-tight text-neutral-950">
                        Instant Live-Tracking Without App Installation
                      </h4>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        Emergency contacts receive an SMS and WhatsApp message with a secure link:
                        <code className="block mt-1 font-mono text-[11px] bg-neutral-100 p-1.5 rounded text-neutral-800">
                          https://safelink.vercel.app/t/sec-48192a7f...
                        </code>
                        Opening this link renders real-time coordinates, battery level, accuracy radius, and direct contact buttons.
                      </p>

                      <div className="space-y-2 pt-2 text-xs">
                        <div className="flex items-center gap-2 text-neutral-700">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>No installation or account needed for family members</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-700">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Automated 5-second polling keeps coordinates fresh</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-700">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Auto-revocation: Link expires permanently when incident ends</span>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-5 p-5 rounded-xl border border-neutral-200 bg-neutral-50 space-y-3">
                      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                          <span className="text-xs font-bold text-neutral-900">INCIDENT TRACKING</span>
                        </div>
                        <span className="text-[11px] font-mono text-neutral-500">Live • 4s ago</span>
                      </div>

                      <div className="rounded-lg bg-white p-3 border border-neutral-200 space-y-1.5">
                        <p className="text-xs font-semibold text-neutral-800">Coordinates:</p>
                        <p className="text-[11px] font-mono text-neutral-600">12.9716° N, 77.5946° E (±5m accuracy)</p>
                        <p className="text-xs font-semibold text-neutral-800 pt-1">Active Responders:</p>
                        <p className="text-xs text-emerald-700 font-medium">1 verified volunteer en route (180m away)</p>
                      </div>

                      <a
                        href="tel:112"
                        className="inline-flex items-center justify-center gap-2 w-full rounded-lg bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 shadow-sm"
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                        Call Police 112 on Behalf of Victim
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. THE 5-MINUTE GAP (PROBLEM & ARCHITECTURE)                              */}
        {/* ========================================================================= */}
        <section id="how-it-works" className="py-20 border-t border-neutral-200 bg-neutral-50/50">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl space-y-3 mb-14">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">
                The Core Problem
              </span>
              <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                The Critical 5-Minute Window.
              </h2>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Official emergency assistance takes time to navigate city traffic. Family members may be kilometers away.
                SafeLink connects the woman in distress with verified responders standing just hundreds of meters away.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Conventional Reality */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Conventional Reality</span>
                  <Clock className="h-5 w-5 text-neutral-400" />
                </div>
                <h3 className="text-xl font-bold text-neutral-950">Official Response Delay</h3>
                <ul className="space-y-4 text-xs text-neutral-600">
                  <li className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 font-bold text-xs mt-0.5">✕</span>
                    <span><strong>10–20 Minute Arrival Time:</strong> Police units and ambulances must navigate traffic and dispatch queues.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 font-bold text-xs mt-0.5">✕</span>
                    <span><strong>Calling Takes Time:</strong> In a dangerous situation, typing phone numbers or speaking aloud can escalate danger.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 font-bold text-xs mt-0.5">✕</span>
                    <span><strong>Inaccurate Landmark Descriptions:</strong> Explaining exact street intersections under panic leads to lost time.</span>
                  </li>
                </ul>
              </div>

              {/* The SafeLink Protocol */}
              <div className="rounded-2xl border border-neutral-900 bg-neutral-950 text-white p-8 space-y-6 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">The SafeLink Solution</span>
                  <Zap className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Verified Proximity Assistance</h3>
                <ul className="space-y-4 text-xs text-neutral-300">
                  <li className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-emerald-400 font-bold text-xs mt-0.5">✓</span>
                    <span><strong>2–4 Minute Human Arrival:</strong> Verified volunteers within 1,000 meters can reach the scene before distant assistance arrives.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-emerald-400 font-bold text-xs mt-0.5">✓</span>
                    <span><strong>One Silent 1.5-Second Hold:</strong> No talking or dialing needed. GPS fix, family alert, and volunteer search trigger simultaneously.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-emerald-400 font-bold text-xs mt-0.5">✓</span>
                    <span><strong>Live Ephemeral Map Link:</strong> Direct GPS updates with ±6m accuracy stream to family without installing an app.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. THREE CORE PILLARS OF THE PROTOCOL                                     */}
        {/* ========================================================================= */}
        <section id="protection" className="py-20 border-t border-neutral-200 bg-white">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">
                Engineered for Integrity
              </span>
              <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                Built Around Three Non-Negotiables
              </h2>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Emergency tools must be impossible to abuse, zero-trust by architecture, and strictly compliant with Indian data privacy law.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-2xl border border-neutral-200 bg-white p-7 space-y-4 hover:border-neutral-300 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 font-bold font-mono text-sm">
                  01
                </div>
                <h3 className="text-lg font-bold text-neutral-950">Zero 24/7 Background Tracking</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  We believe location privacy is sacred. Women on SafeLink are never tracked continuously. The GPS hardware engine remains completely dormant until an active emergency is intentionally triggered.
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-7 space-y-4 hover:border-neutral-300 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 font-bold font-mono text-sm">
                  02
                </div>
                <h3 className="text-lg font-bold text-neutral-950">Lock-Screen Privacy Shield</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Nearby volunteers never see a victim&apos;s name, photo, or coordinates on initial notification. They only see an approximate distance (e.g. ~250m) and can unlock the map only after verified acceptance.
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-7 space-y-4 hover:border-neutral-300 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 font-bold font-mono text-sm">
                  03
                </div>
                <h3 className="text-lg font-bold text-neutral-950">Instant Ephemeral Revocation</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  When you tap &ldquo;Cancel Emergency&rdquo;, all tracking tokens are cryptographically shredded. Active links sent to family and responders immediately deny all further location access.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. VOLUNTEER GUARDIAN NETWORK (FOR VOLUNTEERS)                           */}
        {/* ========================================================================= */}
        <section id="volunteers" className="py-20 border-t border-neutral-200 bg-neutral-50/50">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">
                  Civic Responsibility
                </span>
                <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl leading-tight">
                  Be the Neighbor Who Arrives in Time.
                </h2>
                <p className="text-neutral-600 text-sm leading-relaxed">
                  Anyone aged 18 or above of any gender can register as a verified volunteer responder.
                  SafeLink is designed for community safety: shopkeepers, evening walkers, students, and neighbors willing to offer presence and assistance.
                </p>

                <div className="space-y-3 text-xs text-neutral-700">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>One-Tap Availability:</strong> Toggle between Available and Off-Duty whenever you are busy or sleeping.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Strict Code of Conduct:</strong> Volunteers are peaceful civilian escorts and visual deterrents, never vigilantes. Always call 112.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>100% Free Mobile App:</strong> Zero subscription fees or ads for community responders.</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/register?role=volunteer"
                    className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors"
                  >
                    Register as a Volunteer
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="rounded-2xl border border-neutral-200 bg-white p-8 space-y-6 shadow-sm">
                  <h3 className="text-base font-bold text-neutral-950">Volunteer Vetting Checklist</h3>
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                      <span className="font-medium text-neutral-800">1. Age Requirement (18+)</span>
                      <span className="text-emerald-700 font-semibold font-mono">Mandatory</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                      <span className="font-medium text-neutral-800">2. Dual OTP Phone & Email Check</span>
                      <span className="text-emerald-700 font-semibold font-mono">Mandatory</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                      <span className="font-medium text-neutral-800">3. Government ID Verification (Aadhaar / DL)</span>
                      <span className="text-emerald-700 font-semibold font-mono">DigiLocker / e-KYC</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                      <span className="font-medium text-neutral-800">4. Live Facial Biometric Anti-Spoofing</span>
                      <span className="text-emerald-700 font-semibold font-mono">Passed</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-500 italic">
                    *Verification guarantees that every active responder on SafeLink has an accountable, authenticated identity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. SECURITY & DPDP ACT COMPLIANCE                                         */}
        {/* ========================================================================= */}
        <section id="security" className="py-20 border-t border-neutral-200 bg-white">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl space-y-3 mb-14">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">
                Legal & Cryptographic Standards
              </span>
              <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                Engineered for India&apos;s DPDP Act 2023.
              </h2>
              <p className="text-neutral-600 text-sm leading-relaxed">
                SafeLink complies with all provisions of the Digital Personal Data Protection Act.
                Your data is stored in India, strictly minimized, and completely under your control.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="rounded-xl border border-neutral-200 p-5 space-y-2.5">
                <Lock className="h-5 w-5 text-neutral-700" />
                <h4 className="text-sm font-bold text-neutral-950">Argon2id Hashing</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Passwords and OTP hashes are secured using memory-hard Argon2id cryptography.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 p-5 space-y-2.5">
                <FileCheck className="h-5 w-5 text-neutral-700" />
                <h4 className="text-sm font-bold text-neutral-950">Right to Portability</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Export your full account history and audit trail anytime via <code>GET /users/me/export</code>.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 p-5 space-y-2.5">
                <ShieldAlert className="h-5 w-5 text-neutral-700" />
                <h4 className="text-sm font-bold text-neutral-950">Right to Erasure</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  One-tap cryptographic PII shredding removes all identifying records from our database.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 p-5 space-y-2.5">
                <ShieldCheck className="h-5 w-5 text-neutral-700" />
                <h4 className="text-sm font-bold text-neutral-950">Strict ASGI Security</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  HSTS, Content Security Policy, and X-Content-Type-Options headers enforced on every response.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. DIRECT APK DOWNLOAD STRIP                                              */}
        {/* ========================================================================= */}
        <section id="downloads" className="py-20 border-t border-neutral-200 bg-neutral-950 text-white">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl space-y-3 mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
                Native Release Builds
              </span>
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Download the SafeLink Mobile Apps.
              </h2>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Install our official Android APK packages directly from this website. No third-party app store accounts required.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Women APK */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-rose-950 border border-rose-800 px-3 py-1 text-xs font-semibold text-rose-300">
                    <Shield className="h-3.5 w-3.5 text-rose-400" />
                    For Women • Distress Protection
                  </div>
                  <h3 className="text-lg font-bold text-white">SafeLink Women SOS App</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Minimal, battery-efficient, single-screen emergency activation. Zero tracking in standby. Includes 1.5s haptic button and 112 speed-dial.
                  </p>
                  <p className="text-[11px] font-mono text-neutral-500">Version 1.0.0 • Android 8.0+ • APK Release</p>
                </div>

                <div>
                  <a
                    href="/downloads/safelink-women.apk"
                    download="SafeLink-Women-v1.0.0.apk"
                    className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-white py-3 text-xs font-bold text-neutral-950 hover:bg-neutral-100 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download Women SOS APK (Direct)
                  </a>
                </div>
              </div>

              {/* Volunteer APK */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-neutral-800 border border-neutral-700 px-3 py-1 text-xs font-semibold text-neutral-300">
                    <Users className="h-3.5 w-3.5 text-emerald-400" />
                    For Verified Community Responders
                  </div>
                  <h3 className="text-lg font-bold text-white">SafeLink Volunteer Responder App</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Receive 1 km proximity distress pings with zero lock-screen PII. Includes on-duty toggle and turn-by-turn routing upon acceptance.
                  </p>
                  <p className="text-[11px] font-mono text-neutral-500">Version 1.0.0 • Android 8.0+ • APK Release</p>
                </div>

                <div>
                  <a
                    href="/downloads/safelink-volunteer.apk"
                    download="SafeLink-Volunteer-v1.0.0.apk"
                    className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-neutral-800 py-3 text-xs font-bold text-white hover:bg-neutral-700 transition-colors border border-neutral-700"
                  >
                    <Download className="h-4 w-4" />
                    Download Volunteer Responder APK
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. FREQUENTLY ASKED QUESTIONS                                             */}
        {/* ========================================================================= */}
        <section className="py-20 border-t border-neutral-200 bg-white">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center max-w-xl mx-auto space-y-3 mb-14">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">
                Clarity & Transparency
              </span>
              <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                Frequently Answered Questions
              </h2>
            </div>

            <div className="divide-y divide-neutral-200 border-y border-neutral-200">
              {faqs.map((faq, idx) => (
                <div key={idx} className="py-5">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="flex w-full items-center justify-between text-left text-sm font-semibold text-neutral-950 focus:outline-none"
                  >
                    <span className="pr-4">{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                        openFaq === idx ? "rotate-180 text-neutral-900" : ""
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="mt-3 text-xs leading-relaxed text-neutral-600 pr-8">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* 8. FOOTER & CRISIS CONTACT DIRECTORY                                      */}
      {/* ========================================================================= */}
      <footer className="border-t border-neutral-200 bg-neutral-50 py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-neutral-200">
            {/* Brand column */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-950 text-white">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="font-bold text-neutral-950 text-sm">SafeLink</span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                A rapid emergency response & nearby community assistance platform. Designed for safety in India.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Dispatch Systems Live</span>
              </div>
            </div>

            {/* Platform links */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-3">Applications</p>
              <ul className="space-y-2 text-xs text-neutral-600">
                <li><Link href="/download" className="hover:text-neutral-950">Download Mobile APKs</Link></li>
                <li><Link href="/register?role=woman" className="hover:text-neutral-950">Women Protection Portal</Link></li>
                <li><Link href="/register?role=volunteer" className="hover:text-neutral-950">Volunteer Responder Network</Link></li>
                <li><Link href="/login" className="hover:text-neutral-950">Member Sign In</Link></li>
              </ul>
            </div>

            {/* Legal & Compliance */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-3">Governance</p>
              <ul className="space-y-2 text-xs text-neutral-600">
                <li><Link href="/privacy" className="hover:text-neutral-950">DPDP Act 2023 Compliance</Link></li>
                <li><Link href="/terms" className="hover:text-neutral-950">Terms of Service</Link></li>
                <li><Link href="/guidelines" className="hover:text-neutral-950">Volunteer Code of Conduct</Link></li>
                <li><Link href="/support" className="hover:text-neutral-950">Grievance Officer</Link></li>
              </ul>
            </div>

            {/* Emergency Hotline Directory */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-3">Emergency Lines (India)</p>
              <ul className="space-y-2 text-xs font-mono">
                <li className="flex justify-between py-1 border-b border-neutral-200/60">
                  <span className="text-neutral-500">All Emergencies</span>
                  <a href="tel:112" className="font-bold text-rose-600 hover:underline">112</a>
                </li>
                <li className="flex justify-between py-1 border-b border-neutral-200/60">
                  <span className="text-neutral-500">Women Helpline</span>
                  <a href="tel:1091" className="font-bold text-neutral-950 hover:underline">1091</a>
                </li>
                <li className="flex justify-between py-1">
                  <span className="text-neutral-500">NCW Helpline</span>
                  <a href="tel:7827170170" className="font-bold text-neutral-950 hover:underline">7827170170</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
            <p>© 2026 SafeLink Platform. Licensed under Apache 2.0. Built for human protection.</p>
            <p>Volunteers augment, not replace, official 112 emergency services.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
