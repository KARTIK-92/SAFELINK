"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield, ShieldCheck, HeartHandshake, MapPin, Radio, Bell, ArrowRight,
  Lock, PhoneCall, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  Download, Smartphone, Compass, Clock, Eye, EyeOff, Zap, Users,
  Sparkles, Check, HelpCircle, FileCheck, ShieldAlert
} from "lucide-react";

export default function HomePage() {
  // Simulator State
  const [sosActive, setSosActive] = useState<boolean>(false);
  const [holdingProgress, setHoldingProgress] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [sosTimer, setSosTimer] = useState<number>(0);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Active Tab for Features
  const [activeFeatureTab, setActiveFeatureTab] = useState<"women" | "volunteers" | "family">("women");

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
          return prev + 5;
        });
      }, 50);
    } else {
      setHoldingProgress(0);
    }
    return () => clearInterval(interval);
  }, [isHolding, sosActive]);

  // SOS Active Timer
  useEffect(() => {
    let timer: any;
    if (sosActive) {
      timer = setInterval(() => {
        setSosTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setSosTimer(0);
    }
    return () => clearInterval(timer);
  }, [sosActive]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const faqs = [
    {
      q: "Does SafeLink replace the police or official 112 emergency services?",
      a: "No. SafeLink is designed to complement official emergency services, not replace them. In any crisis, calling 112 remains paramount. However, police and ambulances can take 10 to 20 minutes to navigate city traffic. SafeLink bridges the critical 'Golden 5 Minutes' by alerting verified, background-checked community volunteers who may be just 200–500 meters away and can arrive before distant help can reach you."
    },
    {
      q: "How does SafeLink protect women from malicious volunteers or stalkers?",
      a: "SafeLink enforces a strict Zero-Trust Security Protocol. First, volunteers never see a woman's name, profile photo, or exact coordinates on their initial lock screen—they only see an approximate distance (e.g. '~350m away'). Second, only volunteers who have undergone official Government Identity Vetting (DigiLocker / Aadhaar verification) and Biometric Liveness confirmation can receive alerts. Third, exact coordinates are only unlocked after an incident is accepted, capped at a maximum of 3 responders to prevent crowds. Finally, every dispatch is cryptographically signed and logged for law enforcement."
    },
    {
      q: "Does SafeLink track my location 24/7 in the background?",
      a: "Never. SafeLink strictly adheres to the Digital Personal Data Protection (DPDP) Act 2023. Location services for women are completely dormant until you deliberately hold the SOS button for 1.5 seconds. Once triggered, an ephemeral 256-bit token streams GPS updates exclusively during the active emergency. The moment you press 'Cancel SOS' or the emergency concludes, all streaming ceases immediately and tracking tokens are cryptographically revoked."
    },
    {
      q: "What if no verified volunteers are nearby when I trigger SOS?",
      a: "Even if no volunteer is physically within 1 kilometer, your SOS immediately accomplishes two other vital safeguards: (1) It dispatches high-priority SMS, WhatsApp, and Email alerts to your up to 3 registered emergency contacts containing an unguessable live-tracking link, and (2) It provides a direct one-tap shortcut to dial national emergency 112."
    },
    {
      q: "Do my family members need to download an app to track my live location?",
      a: "No! This is one of SafeLink's greatest advantages. Your emergency contacts receive an instant SMS, WhatsApp, and Email with a secure, ephemeral web tracking link (e.g., safelink.org/t/xyz). They can open it in any web browser on any phone or computer without installing anything, see your live moving pin on the map, and call 112 directly from that tracking page."
    },
    {
      q: "Is SafeLink completely free to use?",
      a: "Yes, 100% free forever for all citizens. SafeLink is built as an open safety public-good platform. There are no subscriptions, no premium paywalls for safety features, and no ads. Every woman has full access to unlimited emergency activations, contact notifications, and volunteer assistance."
    }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFD] text-[#090D1A] selection:bg-rose-100 selection:text-rose-900">
      
      {/* 1. National Crisis Alert Banner */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 text-white text-xs font-medium py-2.5 px-4 shadow-sm">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-rose-400 animate-ping" />
            <span className="font-semibold tracking-wide uppercase text-rose-200 text-[11px]">National Helpline:</span>
            <span>Immediate life threat or physical danger? Dial <strong>112</strong> immediately.</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <a href="tel:112" className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/30 hover:bg-rose-500/50 border border-rose-400/40 px-3 py-1 font-bold text-white transition-colors">
              <PhoneCall className="h-3 w-3" />
              Call 112 Now
            </a>
            <span className="hidden sm:inline text-rose-300/80">Women Helpline: 1091</span>
          </div>
        </div>
      </div>

      {/* 2. Primary Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 text-white shadow-md shadow-slate-900/10 group-hover:shadow-rose-900/20 transition-all">
              <Shield className="h-5 w-5 text-rose-400" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 font-heading">SafeLink</span>
                <span className="rounded-md bg-rose-50 border border-rose-200/80 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                  India
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-500 tracking-tight">Rapid Response Network</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a>
            <a href="#interactive-simulator" className="hover:text-slate-900 transition-colors flex items-center gap-1.5">
              <span>Interactive SOS</span>
              <span className="rounded-full bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 font-bold border border-emerald-200">Live Demo</span>
            </a>
            <a href="#for-women" className="hover:text-slate-900 transition-colors">For Women</a>
            <a href="#volunteers" className="hover:text-slate-900 transition-colors">Community Guardians</a>
            <a href="#security" className="hover:text-slate-900 transition-colors">Trust & DPDP</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </nav>

          {/* Header Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/register?role=woman"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-500/20 hover:from-rose-700 hover:to-rose-600 active:scale-[0.98] transition-all"
            >
              <span>Get Protected</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 3. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 dot-pattern">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-rose-200/40 via-teal-100/30 to-indigo-100/30 blur-[130px] rounded-full pointer-events-none -z-10" />

        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Mission & Typography */}
            <div className="lg:col-span-7 space-y-7">
              
              {/* Status Pill */}
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>PostGIS Proximity Engine • Verified Citizen Guardians</span>
              </div>

              {/* Master Headline */}
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-950 font-heading leading-[1.08]">
                Help Should Never <br />
                <span className="bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 bg-clip-text text-transparent">
                  Be Too Far Away.
                </span>
              </h1>

              {/* Core Problem Narrative */}
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                When danger strikes, family members may be 30 minutes away in traffic, and police sirens can take critical minutes. SafeLink bridges the golden 5 minutes by instantly alerting your loved ones with live GPS and mobilizing vetted volunteers within 1 km who can reach you in minutes.
              </p>

              {/* CTA Button Group */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <Link
                  href="/register?role=woman"
                  className="flex items-center justify-center gap-2.5 rounded-xl bg-slate-900 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-slate-900/15 hover:bg-slate-800 active:scale-[0.98] transition-all"
                >
                  <ShieldCheck className="h-4 w-4 text-rose-400" />
                  <span>Register for Emergency Protection</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Link>

                <Link
                  href="/register?role=volunteer"
                  className="flex items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white px-6 py-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:border-slate-400 active:scale-[0.98] transition-all"
                >
                  <HeartHandshake className="h-4 w-4 text-brand-teal" />
                  <span>Become a Verified Volunteer</span>
                </Link>
              </div>

              {/* Trust Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-200/80 text-left">
                <div>
                  <p className="text-2xl font-extrabold text-slate-950 font-heading">~180s</p>
                  <p className="text-xs text-slate-500 font-medium">Avg. Volunteer Arrival</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-950 font-heading">1,000m</p>
                  <p className="text-xs text-slate-500 font-medium">Proximity Radar Radius</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-950 font-heading">3 Contacts</p>
                  <p className="text-xs text-slate-500 font-medium">Instant Family Broadcast</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-950 font-heading">0 KB</p>
                  <p className="text-xs text-slate-500 font-medium">Zero 24/7 Background Track</p>
                </div>
              </div>
            </div>

            {/* Right Column: High-Fidelity Interactive Emergency Simulator */}
            <div id="interactive-simulator" className="lg:col-span-5">
              <div className="relative rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl">
                
                {/* Simulator Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className={`flex h-2.5 w-2.5 rounded-full ${sosActive ? "bg-rose-500 animate-ping" : "bg-emerald-500"}`} />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      {sosActive ? "Emergency Incident Active" : "Interactive SOS Simulator"}
                    </span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-mono font-semibold text-slate-600">
                    {sosActive ? `Elapsed: ${formatTimer(sosTimer)}` : "Standby Mode"}
                  </span>
                </div>

                {/* State A: Standby - Hold to Activate Button */}
                {!sosActive ? (
                  <div className="py-8 text-center space-y-6">
                    <div className="max-w-xs mx-auto">
                      <p className="text-xs font-semibold text-slate-500 mb-1">Interactive Demo</p>
                      <h3 className="text-base font-bold text-slate-900 font-heading">Hold the SOS Button</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Press and hold below for 1.5s to simulate instant family dispatch & nearby volunteer discovery.
                      </p>
                    </div>

                    {/* Circular Interactive SOS Button */}
                    <div className="relative inline-flex items-center justify-center my-4">
                      {/* Radiating Ring */}
                      <div className="absolute h-40 w-40 rounded-full border border-rose-300/40 animate-ripple-slow" />
                      <div className="absolute h-32 w-32 rounded-full border border-rose-400/60 animate-ripple-fast" />

                      {/* Main Push Button */}
                      <button
                        type="button"
                        onMouseDown={() => setIsHolding(true)}
                        onMouseUp={() => setIsHolding(false)}
                        onTouchStart={() => setIsHolding(true)}
                        onTouchEnd={() => setIsHolding(false)}
                        className="relative z-10 flex h-28 w-28 flex-col items-center justify-center rounded-full bg-gradient-to-b from-rose-500 via-rose-600 to-rose-700 text-white shadow-xl shadow-rose-600/30 hover:scale-[1.02] active:scale-[0.96] transition-all select-none cursor-pointer"
                      >
                        <Zap className="h-6 w-6 text-white mb-0.5" />
                        <span className="text-xs font-black tracking-widest uppercase">SOS</span>
                        <span className="text-[10px] opacity-80 font-medium">HOLD 1.5S</span>
                      </button>
                    </div>

                    {/* Progress Bar when holding */}
                    {isHolding && (
                      <div className="max-w-xs mx-auto space-y-1.5">
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-rose-600 h-full transition-all duration-75"
                            style={{ width: `${holdingProgress}%` }}
                          />
                        </div>
                        <p className="text-[11px] font-semibold text-rose-600 animate-pulse">Arming Emergency Beacon ({holdingProgress}%)...</p>
                      </div>
                    )}

                    {/* One-Click Shortcut Alternative */}
                    <button
                      type="button"
                      onClick={() => setSosActive(true)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline underline-offset-4"
                    >
                      Or click here to test instant activation →
                    </button>
                  </div>
                ) : (
                  /* State B: Active Emergency Incident Simulation */
                  <div className="py-4 space-y-4">
                    {/* Live GPS Lock Card */}
                    <div className="rounded-2xl bg-rose-50 border border-rose-200/80 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                          <p className="text-xs font-bold text-rose-950 uppercase tracking-wide">High-Res GPS Streaming</p>
                        </div>
                        <span className="text-[11px] font-mono text-rose-700 font-bold">Accuracy: ±5.2m</span>
                      </div>
                      <p className="text-xs text-rose-800 font-mono mt-1">
                        12.9716° N, 77.5946° E • MG Road Metro Station, Bengaluru
                      </p>
                    </div>

                    {/* Dispatched Family Alerts */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Family Emergency Broadcast (3 Contacts)
                      </p>
                      
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-900">Sunita Sharma (Mother)</p>
                            <p className="text-[11px] text-slate-500">SMS + WhatsApp Delivered with Live Link</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">Just now</span>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-900">Pooja Sharma (Sister)</p>
                            <p className="text-[11px] text-slate-500">Live Map Link Opened • In Transit</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">12s ago</span>
                      </div>
                    </div>

                    {/* Verified Volunteer Lock */}
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          <span className="text-xs font-bold text-emerald-950 uppercase">Verified Volunteer Locked</span>
                        </div>
                        <span className="rounded-full bg-emerald-200/60 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                          180m Away
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <p className="text-xs font-bold text-slate-900">Rajesh N. (First Aid Trained)</p>
                          <p className="text-[11px] text-slate-600">Accepted dispatch • Arriving on Two-Wheeler (~1.8 mins)</p>
                        </div>
                        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      </div>
                    </div>

                    {/* Actions: Cancel vs 112 */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <a
                        href="tel:112"
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition-colors"
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                        Call Police (112)
                      </a>
                      <button
                        type="button"
                        onClick={() => setSosActive(false)}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        Cancel Emergency
                      </button>
                    </div>

                    <p className="text-[10px] text-center text-slate-400">
                      *Cancellation immediately revokes live links and shreds coordinate streams.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. The Critical Golden 5 Minutes (Problem vs Solution) */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-rose-400">The Reality of Emergency Response</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-heading">
              The Golden 5-Minute Gap.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              When encountering a predator or medical distress on a dark street, what happens during the first 5 minutes determines the outcome. Here is the difference between conventional tools and SafeLink.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* The Old Way */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-red-950/60 border border-red-800/40 px-3 py-1 text-xs font-bold text-red-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Conventional Panic Response
                </div>
                <h3 className="text-xl font-bold text-white font-heading">Why Traditional Methods Fall Short</h3>
                <ul className="space-y-3.5 text-xs sm:text-sm text-slate-400">
                  <li className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-900/40 text-red-400 font-bold text-xs mt-0.5">✕</span>
                    <span><strong>Phone Calls Under Panic:</strong> Shaking hands, adrenaline, or physical aggression make dialing or unlocking a phone almost impossible.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-900/40 text-red-400 font-bold text-xs mt-0.5">✕</span>
                    <span><strong>Inability to Describe Location:</strong> Victims rarely know the exact cross-street or alley coordinates in unfamiliar neighborhoods.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-900/40 text-red-400 font-bold text-xs mt-0.5">✕</span>
                    <span><strong>Family Members are Far:</strong> Loved ones want to help, but are typically 20 to 45 minutes away across town in gridlock.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-900/40 text-red-400 font-bold text-xs mt-0.5">✕</span>
                    <span><strong>Official Transit Times:</strong> Police cruisers and ambulances take 8 to 15 minutes on average to dispatch and arrive.</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl bg-red-950/30 border border-red-900/30 p-4">
                <p className="text-xs text-red-300 font-medium">Result: The victim is completely isolated during the most dangerous 300 seconds.</p>
              </div>
            </div>

            {/* The SafeLink Architecture */}
            <div className="rounded-3xl border border-rose-500/30 bg-gradient-to-b from-slate-800 to-slate-900 p-8 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-2xl">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950/60 border border-emerald-700/50 px-3 py-1 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  The SafeLink Coordinated Defense
                </div>
                <h3 className="text-xl font-bold text-white font-heading">How SafeLink Solves the Golden 5 Minutes</h3>
                <ul className="space-y-3.5 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs mt-0.5">✓</span>
                    <span><strong>1.5-Second Tactile Hold:</strong> Trigger SOS without looking at the screen, with physical haptic confirmation.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs mt-0.5">✓</span>
                    <span><strong>Instant Sub-Meter GPS Stream:</strong> Dispatches coordinates automatically without requiring the victim to speak or explain.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs mt-0.5">✓</span>
                    <span><strong>Verified Bystander Mobilization:</strong> Identifies and alerts pre-vetted citizens who are physically only 200–500m away.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs mt-0.5">✓</span>
                    <span><strong>Immediate Human Deterrent:</strong> A nearby person arriving in 2–3 minutes often prevents crime escalation before police arrive.</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl bg-emerald-950/40 border border-emerald-800/40 p-4">
                <p className="text-xs text-emerald-300 font-semibold">Result: Immediate human presence, active live tracking, and synchronous 112 routing.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. How SafeLink Works (4-Stage Visual Architecture) */}
      <section id="how-it-works" className="py-24 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Automated Pipeline</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
              Four Synchronized Actions in Seconds
            </h2>
            <p className="text-slate-500 text-sm">
              From distress signal to human assistance, every microsecond is engineered for reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 space-y-4 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600 font-extrabold text-lg">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900 font-heading">1.5s Hold SOS</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prevents accidental pocket taps. A deliberate 1.5-second hold with pulsating haptic feedback signals active danger.
              </p>
              <div className="pt-2 text-[11px] font-mono font-semibold text-rose-600">
                Latency: &lt; 50ms
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 space-y-4 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 font-extrabold text-lg">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900 font-heading">Ephemeral GPS Lock</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Captures high-accuracy device GPS and generates an unguessable 256-bit token. Only SHA-256 hashes are persisted.
              </p>
              <div className="pt-2 text-[11px] font-mono font-semibold text-indigo-600">
                Precision: ±4 to ±8 meters
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 space-y-4 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-700 font-extrabold text-lg">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900 font-heading">Proximity Radar Query</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                PostGIS spatial queries identify online, vetted volunteers within 1,000m. Privacy-preserving push alerts dispatch instantly.
              </p>
              <div className="pt-2 text-[11px] font-mono font-semibold text-teal-700">
                Max 3 Responders Cap
              </div>
            </div>

            {/* Step 4 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 space-y-4 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-extrabold text-lg">
                04
              </div>
              <h3 className="text-base font-bold text-slate-900 font-heading">Family & 112 Sync</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Up to 3 family members receive SMS, WhatsApp & Email with live map access. Cancellation immediately terminates the stream.
              </p>
              <div className="pt-2 text-[11px] font-mono font-semibold text-emerald-700">
                Zero App Needed for Family
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. Feature Deep Dive: For Women vs Volunteers */}
      <section id="for-women" className="py-24 bg-[#FAFAFD]">
        <div className="mx-auto max-w-7xl px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Tailored Protection</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 font-heading">
              Engineered for Both Sides of the Safety Equation
            </h2>
            <div className="inline-flex rounded-xl bg-slate-200/70 p-1.5 mt-2">
              <button
                type="button"
                onClick={() => setActiveFeatureTab("women")}
                className={`rounded-lg px-5 py-2 text-xs font-bold transition-all ${
                  activeFeatureTab === "women"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                For Women & Students
              </button>
              <button
                type="button"
                onClick={() => setActiveFeatureTab("volunteers")}
                className={`rounded-lg px-5 py-2 text-xs font-bold transition-all ${
                  activeFeatureTab === "volunteers"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                For Community Volunteers
              </button>
            </div>
          </div>

          {/* Tab 1: For Women */}
          {activeFeatureTab === "women" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md transition-all space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">One-Touch Stress-Free SOS</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  When walking home late, through unlit transit parking, or in a suspicious cab ride, keep your thumb on the button. Release to cancel; hold 1.5 seconds to dispatch help without saying a word.
                </p>
                <ul className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">✓ Works even with low cellular bandwidth</li>
                  <li className="flex items-center gap-2">✓ Automatic screen brightness dimming option</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md transition-all space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">3 Family Guardian Contacts</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Configure your mother, partner, roommate, or trusted mentor. The moment distress is signaled, they receive automated priority text messages, WhatsApp alerts, and emails with your live GPS link.
                </p>
                <ul className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">✓ Live updates refresh automatically</li>
                  <li className="flex items-center gap-2">✓ Family can trigger 112 dispatch on your behalf</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md transition-all space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">Zero 24/7 Tracking Guarantee</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Unlike conventional safety apps that continuously track your whereabouts and sell location telemetry, SafeLink never accesses your location until an active emergency is declared.
                </p>
                <ul className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">✓ Certified DPDP Act 2023 compliance</li>
                  <li className="flex items-center gap-2">✓ Instant 1-click account and data deletion</li>
                </ul>
              </div>

            </div>
          )}

          {/* Tab 2: For Volunteers */}
          {activeFeatureTab === "volunteers" && (
            <div id="volunteers" className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md transition-all space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-brand-teal">
                  <Radio className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">One-Tap On/Off Duty</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  You are in complete control of your availability. Toggle &ldquo;Available&rdquo; when you are at your desk, shop, or evening walk; turn it off when you are sleeping or busy. Zero obligations.
                </p>
                <ul className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">✓ Battery-aware low-power geofencing</li>
                  <li className="flex items-center gap-2">✓ Alerts strictly within 1 km radius</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md transition-all space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">Strict Privacy Safeguards</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  You only see distance (e.g. &ldquo;Distress alert ~280m away&rdquo;) before accepting. Exact coordinates unlock only after acceptance, and only up to 3 responders can accept per incident.
                </p>
                <ul className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">✓ Prevents crowds or bystander stampedes</li>
                  <li className="flex items-center gap-2">✓ Direct sync with police 112 dispatch</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md transition-all space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <FileCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">100% Vetted Community</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Every responder undergoes DigiLocker or Government ID verification and active biometric anti-spoofing facial check. Bad actors are permanently banned and reported.
                </p>
                <ul className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">✓ Digital identity cryptographically hashed</li>
                  <li className="flex items-center gap-2">✓ Community reputation & safety rating</li>
                </ul>
              </div>

            </div>
          )}

        </div>
      </section>

      {/* 7. Security & DPDP Compliance Vault */}
      <section id="security" className="py-24 bg-white border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-14 relative overflow-hidden">
            <div className="max-w-2xl space-y-4 relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Security Architecture</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-white">
                Built Around India&apos;s DPDP Act 2023.
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Privacy is not an afterthought—it is the cryptographic foundation. We ensure zero unnecessary data collection, zero commercial data sharing, and full mathematical erasure.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4">
                  <p className="font-bold text-sm text-white flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    Cryptographic PII Shredding
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    When you delete your account, personal data is irreversibly hashed and purged from all replicas.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4">
                  <p className="font-bold text-sm text-white flex items-center gap-2">
                    <Lock className="h-4 w-4 text-rose-400" />
                    256-Bit Ephemeral Tokens
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Emergency tracking URLs expire automatically and cannot be indexed or enumerated by web search crawlers.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-4 text-xs font-semibold">
                <Link href="/privacy" className="text-rose-400 hover:text-rose-300 underline underline-offset-4">
                  Read Full DPDP Privacy Charter →
                </Link>
                <Link href="/guidelines" className="text-slate-300 hover:text-white underline underline-offset-4">
                  Volunteer Safety Code of Conduct →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Mobile App Download Center */}
      <section className="py-24 bg-[#FAFAFD]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Mobile Ecosystem</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 font-heading">
              Direct Application Downloads
            </h2>
            <p className="text-slate-500 text-sm">
              Install the official SafeLink applications directly onto your smartphone. Zero bloatware, minimal battery usage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Women's App Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 border border-rose-200/80 px-3 py-1 text-xs font-bold text-rose-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  For Women • Emergency Protection
                </div>
                <h3 className="text-2xl font-bold text-slate-950 font-heading">SafeLink Emergency App</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Features the hold-to-activate 1.5s emergency button, automatic 3-family dispatch, live GPS streaming, and 112 quick-dialer.
                </p>
                <div className="text-xs text-slate-500 space-y-1 font-mono">
                  <p>Package: com.safelink.women</p>
                  <p>Target: Android 8.0+ (Oreo or newer)</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-mono text-slate-400">Release Build v1.0.0</p>
                  <p className="text-xs font-bold text-slate-800">Direct APK Download</p>
                </div>
                <a
                  href="/downloads/safelink-women.apk"
                  download="SafeLink-Women-v1.0.0.apk"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-colors"
                >
                  <Download className="h-4 w-4 text-rose-400" />
                  Download APK
                </a>
              </div>
            </div>

            {/* Volunteer App Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-800">
                  <Smartphone className="h-3.5 w-3.5" />
                  For Community Guardians
                </div>
                <h3 className="text-2xl font-bold text-slate-950 font-heading">SafeLink Volunteer Responder</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Features one-tap duty availability, proximity alerts within 1 km, turn-by-turn responder navigation, and police coordinate sync.
                </p>
                <div className="text-xs text-slate-500 space-y-1 font-mono">
                  <p>Package: com.safelink.volunteer</p>
                  <p>Target: Android 8.0+ (Oreo or newer)</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-mono text-slate-400">Release Build v1.0.0</p>
                  <p className="text-xs font-bold text-slate-800">Direct APK Download</p>
                </div>
                <a
                  href="/downloads/safelink-volunteer.apk"
                  download="SafeLink-Volunteer-v1.0.0.apk"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-colors"
                >
                  <Download className="h-4 w-4 text-brand-teal" />
                  Download APK
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 9. Frequently Asked Questions (Accordion) */}
      <section id="faq" className="py-24 bg-white border-t border-slate-200">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Clarifications & Answers</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 font-heading">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-500 text-sm">
              Everything you need to know about safety protocols, privacy guarantees, and how we operate.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-200/90 bg-slate-50/50 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm sm:text-base font-bold text-slate-900 hover:text-rose-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-rose-600 shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400 shrink-0 ml-4" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/60 pt-4 bg-white">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. High-Impact Closing CTA */}
      <section className="py-20 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 text-white relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-6 text-center space-y-6 relative z-10">
          <span className="rounded-full bg-rose-500/20 border border-rose-400/40 px-3.5 py-1 text-xs font-bold text-rose-300">
            Open Public Safety Network
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-heading">
            Help Should Never Be Too Far Away.
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Join thousands of women and verified community guardians taking charge of immediate neighborhood safety. Set up your emergency contacts in 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register?role=woman"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-rose-600/30 hover:bg-rose-700 active:scale-[0.98] transition-all"
            >
              <span>Get Protected Free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register?role=volunteer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800/80 px-8 py-4 text-sm font-semibold text-white hover:bg-slate-700 active:scale-[0.98] transition-all"
            >
              <span>Register as Volunteer</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 11. Refined Footer */}
      <footer className="border-t border-slate-200 bg-white py-14 text-slate-600 text-xs">
        <div className="mx-auto max-w-7xl px-6 space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                  <Shield className="h-4 w-4 text-rose-400" />
                </div>
                <span className="text-lg font-extrabold text-slate-900 font-heading">SafeLink</span>
              </div>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                A mission-driven women&apos;s safety and rapid emergency response ecosystem. Connecting distress with immediate human presence.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Dispatch Engines Operational</span>
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Applications</p>
              <ul className="space-y-2">
                <li><Link href="/download" className="hover:text-slate-900">Download Mobile Apps</Link></li>
                <li><Link href="/register?role=woman" className="hover:text-slate-900">Women Protection Portal</Link></li>
                <li><Link href="/register?role=volunteer" className="hover:text-slate-900">Volunteer Guardian Network</Link></li>
                <li><Link href="/login" className="hover:text-slate-900">Responder & Member Login</Link></li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Compliance & Safety</p>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="hover:text-slate-900">DPDP Act 2023 Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-slate-900">Terms & Safeguards</Link></li>
                <li><Link href="/guidelines" className="hover:text-slate-900">Volunteer Code of Conduct</Link></li>
                <li><Link href="/support" className="hover:text-slate-900">Grievance Officer & Support</Link></li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Crisis Contacts (India)</p>
              <ul className="space-y-2 font-mono text-[11px]">
                <li className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">National Emergency</span>
                  <a href="tel:112" className="font-bold text-rose-600 hover:underline">112</a>
                </li>
                <li className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Women in Distress</span>
                  <a href="tel:1091" className="font-bold text-slate-900 hover:underline">1091</a>
                </li>
                <li className="flex justify-between py-1">
                  <span className="text-slate-500">National Commission (NCW)</span>
                  <a href="tel:7827170170" className="font-bold text-slate-900 hover:underline">7827170170</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <p>© 2026 SafeLink Platform. Built for human protection. All emergency links are cryptographically protected.</p>
            <p>Designed with care for safety in India.</p>
          </div>

        </div>
      </footer>

    </div>
  );
}
