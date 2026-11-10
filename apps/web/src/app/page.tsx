import React from "react";
import Link from "next/link";
import { ShieldCheck, HeartHandshake, MapPin, Radio, Bell, ArrowRight, Lock } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Header / Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-navyDark text-white shadow-sm">
              <ShieldCheck className="h-5 w-5 text-brand-tealLight" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">SafeLink</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
            <Link href="#for-women" className="hover:text-foreground transition-colors">For Women</Link>
            <Link href="#volunteers" className="hover:text-foreground transition-colors">Become a Volunteer</Link>
            <Link href="#safety" className="hover:text-foreground transition-colors">Trust & Safety</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-brand-teal px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1 text-xs font-semibold text-brand-teal">
                <Radio className="h-3.5 w-3.5 animate-pulse text-brand-teal" />
                Rapid Geolocation & Nearby Community Network
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground leading-[1.12]">
                Help Should Never Be Too Far Away.
              </h1>

              <p className="text-lg text-muted max-w-2xl leading-relaxed">
                One tap can alert your loved ones and connect you with verified people nearby. Because getting help should be easier when every second matters.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/register?role=woman"
                  className="flex items-center justify-center gap-2 rounded-lg bg-brand-teal px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-teal-800 transition-colors"
                >
                  Get Protected
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/register?role=volunteer"
                  className="flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-6 py-3.5 text-base font-medium text-foreground hover:bg-slate-50 transition-colors"
                >
                  Become a Volunteer
                </Link>
              </div>

              <div className="flex items-center gap-6 pt-4 text-xs text-muted border-t border-border">
                <div className="flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-slate-400" />
                  <span>256-Bit Ephemeral Tracking</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-slate-400" />
                  <span>Government ID & Liveness Vetted</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Bell className="h-4 w-4 text-slate-400" />
                  <span>SMS, WhatsApp & Push Alerts</span>
                </div>
              </div>
            </div>

            {/* Custom Architecture Illustration (No generic stock photo) */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-border bg-white p-6 shadow-card">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 rounded-full bg-emergency-red animate-ping" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-emergency-red">
                      Emergency Simulation
                    </span>
                  </div>
                  <span className="text-xs text-muted font-mono">Radius: 1,000m</span>
                </div>

                <div className="my-6 space-y-4">
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emergency-redLight text-emergency-red font-bold text-xs">
                      SOS
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Distress Signal Activated</p>
                      <p className="text-xs text-muted">GPS Accuracy: ±8m • Live coordinate stream started</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-brand-teal">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Family Contacts Dispatched</p>
                      <p className="text-xs text-muted">Up to 3 emergency contacts sent secure live-tracking link</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-teal-50/50 p-4 border border-teal-100 flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-teal text-white">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-teal">Verified Responder Accepted</p>
                      <p className="text-xs text-slate-600">Arriving in ~2 mins (180m away) • Police 112 alerted</p>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-center text-muted italic">
                  *Volunteers provide community presence and assistance, augmenting official police & medical response.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 border-t border-border bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How SafeLink Works
            </h2>
            <p className="mt-3 text-muted">
              Three synchronized actions trigger the moment distress is signaled.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-xl border border-border p-6 bg-background/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emergency-redLight text-emergency-red font-bold text-lg mb-4">
                1
              </div>
              <h3 className="text-lg font-bold text-foreground">One-Tap Activation</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Hold the emergency button for 1.5 seconds on the mobile app. The system immediately captures your current high-accuracy GPS fix.
              </p>
            </div>

            <div className="rounded-xl border border-border p-6 bg-background/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-brand-teal font-bold text-lg mb-4">
                2
              </div>
              <h3 className="text-lg font-bold text-foreground">Nearby Community Response</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                PostGIS spatial queries identify vetted volunteers within 1 km. Nearby responders receive notifications and can accept to assist.
              </p>
            </div>

            <div className="rounded-xl border border-border p-6 bg-background/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-brand-navy font-bold text-lg mb-4">
                3
              </div>
              <h3 className="text-lg font-bold text-foreground">Connected Family Support</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Up to three pre-registered family members immediately receive SMS, WhatsApp, and email alerts containing an ephemeral live-tracking link.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-navyDark text-white">
              <ShieldCheck className="h-4 w-4 text-brand-tealLight" />
            </div>
            <span className="font-bold text-foreground">SafeLink</span>
            <span className="text-xs text-muted ml-2">© 2026 SafeLink Platform. Built for safety.</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-muted">
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
            <Link href="/guidelines" className="hover:text-foreground">Volunteer Guidelines</Link>
            <Link href="/support" className="hover:text-foreground">Support & Grievance</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
