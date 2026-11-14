import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Terms of Service</h1>
          <p className="mt-2 text-xs text-muted">Effective Date: November 10, 2026</p>
        </div>

        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">1. Nature of Service (No Guarantee of Arrival)</h2>
            <p className="rounded-xl bg-amber-50 p-4 border border-amber-200 text-amber-900 font-medium">
              IMPORTANT: SafeLink volunteers are an auxiliary community layer. SafeLink does not and cannot guarantee that community volunteers will arrive within seconds or at all. The platform is not a substitute for the Police (112), Ambulance (108), or National Emergency Services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">2. User Eligibility</h2>
            <p>
              Users must be at least 18 years old to register. Registration for the emergency distress protection role is strictly reserved for eligible female members. Registration as a community volunteer responder is open to all qualified adults who complete mandatory KYC vetting.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">3. False Alarms and Abuse Prevention</h2>
            <p>
              Malicious or intentional repeated triggering of false emergency alerts constitutes a violation of these terms. SafeLink reserves the right to suspend accounts, revoke volunteer access, and cooperate with law enforcement authorities for intentional misuse of emergency systems.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">4. Volunteer Code of Conduct</h2>
            <p>
              Volunteers must adhere to the SafeLink Safety Guidelines at all times: prioritize personal and victim safety, never engage in vigilantism or armed confrontation, and notify 112 immediately.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
