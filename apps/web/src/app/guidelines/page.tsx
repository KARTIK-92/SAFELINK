import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, AlertTriangle, PhoneCall, Eye, HeartHandshake } from "lucide-react";

export default function GuidelinesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-white py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navyDark text-white">
              <ShieldCheck className="h-5 w-5 text-brand-tealLight" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">SafeLink</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 flex-1 space-y-8">
        <div className="border-b border-border pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Volunteer Responder Safety Guidelines</h1>
          <p className="mt-2 text-xs text-muted">Core operational principles for verified community volunteers.</p>
        </div>

        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-red-900">Rule #1: Never Confront Armed or Violent Individuals</h2>
              <p className="mt-1 text-xs text-red-800 leading-relaxed">
                Your role is to offer rapid human presence, de-escalation, bystander observation, and first aid. If you observe physical violence or weapons, do NOT physically intervene alone. Keep a safe distance, act as a vigilant observer, and coordinate directly with 112 emergency police.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-brand-teal font-bold">
                <PhoneCall className="h-5 w-5" />
                <h3>Coordinate with Official Police</h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Always dial 112 as soon as you accept an incident if you suspect an escalating emergency. Share the location coordinates with the police control room.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-brand-teal font-bold">
                <Eye className="h-5 w-5" />
                <h3>Bystander Observation</h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Perpetrators frequently disengage when visible witnesses arrive. Maintaining illuminated presence, speaking in a firm, calm voice, and alerting other pedestrians is the safest protocol.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-brand-teal font-bold">
                <HeartHandshake className="h-5 w-5" />
                <h3>First Aid & Human Support</h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Provide emotional reassurance and first aid if trained. Stay with the distressed person until family members or police arrive.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-brand-teal font-bold">
                <ShieldCheck className="h-5 w-5" />
                <h3>Confidentiality & Respect</h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Respect the victim&apos;s privacy. Never record videos for social media, publish victim details, or ask intrusive questions.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
