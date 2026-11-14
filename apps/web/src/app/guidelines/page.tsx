import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, AlertTriangle, PhoneCall, Eye, HeartHandshake, Shield } from "lucide-react";

export default function GuidelinesPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-3">
            <Shield className="h-3.5 w-3.5" />
            Community Responder Field Manual
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-heading">
            Volunteer Safety Guidelines
          </h1>
          <p className="mt-2 text-xs text-slate-400 font-mono">
            Standard Operating Procedures for Local Civilian Responders
          </p>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 flex items-start gap-4">
            <AlertTriangle className="h-7 w-7 text-rose-400 shrink-0 mt-1" />
            <div>
              <h2 className="text-base font-bold text-white font-heading">Core Rule: Never Confront Armed or Violent Individuals</h2>
              <p className="mt-1.5 text-xs sm:text-sm text-rose-200/90 leading-relaxed">
                Your role is to offer rapid human presence, de-escalation, bystander observation, and first aid. If you observe active physical violence or weapons, do NOT physically intervene alone. Keep a safe perimeter, illuminate the area if possible, and guide approaching 112 police officers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-white/10 bg-[#0D1322]/80 p-6 backdrop-blur-xl space-y-3">
              <div className="flex items-center gap-2.5 text-teal-400 font-bold font-heading">
                <PhoneCall className="h-5 w-5" />
                <h3>Coordinate with Official Police (112)</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Always dial 112 as soon as you accept an incident if you suspect an escalating emergency. Share the victim&apos;s real-time coordinates with the police control room.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0D1322]/80 p-6 backdrop-blur-xl space-y-3">
              <div className="flex items-center gap-2.5 text-teal-400 font-bold font-heading">
                <Eye className="h-5 w-5" />
                <h3>Bystander Observation Protocol</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Perpetrators frequently disengage when visible witnesses arrive. Maintaining illuminated presence, speaking in a firm, audible voice, and gathering nearby citizens creates rapid deterrence without physical conflict.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0D1322]/80 p-6 backdrop-blur-xl space-y-3">
              <div className="flex items-center gap-2.5 text-teal-400 font-bold font-heading">
                <HeartHandshake className="h-5 w-5" />
                <h3>Victim Comfort & De-escalation</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Offer immediate safety reassurance. Keep a respectful physical distance unless first aid or medical support is explicitly requested. Stay with the member until family or police arrive.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0D1322]/80 p-6 backdrop-blur-xl space-y-3">
              <div className="flex items-center gap-2.5 text-teal-400 font-bold font-heading">
                <ShieldCheck className="h-5 w-5" />
                <h3>Statutory Samaritan Shield</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                You are legally protected from civil or criminal liability under Supreme Court Good Samaritan Guidelines. You cannot be detained at police stations or compelled to disclose private details.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
