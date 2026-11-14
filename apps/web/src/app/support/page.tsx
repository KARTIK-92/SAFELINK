import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Mail, Phone, MapPin, HelpCircle } from "lucide-react";

export default function SupportPage() {
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
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Support & Grievance Redressal</h1>
          <p className="mt-2 text-xs text-muted">Contact the SafeLink engineering and data governance team.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-700">
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-foreground">General Support & Feedback</h2>
            <p className="text-xs text-muted">
              Have questions regarding mobile app configuration, volunteer registration, or emergency contact setup?
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand-teal" />
                <span>support@safelink.local</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand-teal" />
                <span>1800-SAFELINK (Helpline)</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-foreground">Data Protection Officer (DPO)</h2>
            <p className="text-xs text-muted">
              Appointed under Section 10 of India&apos;s Digital Personal Data Protection Act (DPDP Act 2023).
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand-navy" />
                <span>dpo@safelink.local</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-navy" />
                <span>SafeLink Operations Center, Bengaluru, Karnataka, India</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
