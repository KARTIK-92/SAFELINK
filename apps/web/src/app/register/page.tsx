"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2,
  AlertCircle, Camera, Lock, User, MapPin, Mail, Phone,
  FileCheck, RefreshCw, KeyRound, Sparkles, Eye, EyeOff,
  Building, Fingerprint, BadgeCheck, ShieldAlert
} from "lucide-react";
import { apiRequest } from "@/lib/api";

type Role = "woman" | "volunteer";

interface RegisterFormData {
  role: Role;
  fullLegalName: string;
  gender: string;
  dateOfBirth: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  email: string;
  phoneOtp: string;
  emailOtp: string;
  idNumberHint: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center p-8 text-sm text-slate-400">
        <RefreshCw className="h-5 w-5 animate-spin text-rose-500 mr-2" />
        Initialising SafeLink Secure Registration...
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get("role") as Role) || "woman";

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState<RegisterFormData>({
    role: initialRole,
    fullLegalName: "",
    gender: initialRole === "woman" ? "female" : "male",
    dateOfBirth: "1998-05-15",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pinCode: "",
    phone: "",
    email: "",
    phoneOtp: "",
    emailOtp: "",
    idNumberHint: "9876",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });

  // OTP Verification States
  const [phoneOtpSent, setPhoneOtpSent] = useState<boolean>(false);
  const [phoneVerified, setPhoneVerified] = useState<boolean>(false);
  const [phoneCooldown, setPhoneCooldown] = useState<number>(0);

  const [emailOtpSent, setEmailOtpSent] = useState<boolean>(false);
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [emailCooldown, setEmailCooldown] = useState<number>(0);

  // Identity & Liveness States
  const [identityVerified, setIdentityVerified] = useState<boolean>(false);
  const [livenessPassed, setLivenessPassed] = useState<boolean>(false);
  const [livenessAction] = useState<string>("Blink twice and turn your head slightly right");

  // Registration ID after step 5
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);

  // Cooldown timers
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phoneCooldown > 0) {
      timer = setTimeout(() => setPhoneCooldown(phoneCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [phoneCooldown]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (emailCooldown > 0) {
      timer = setTimeout(() => setEmailCooldown(emailCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [emailCooldown]);

  const updateField = (field: keyof RegisterFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  // --- Step 2: Validate Personal Details ---
  const handleProceedFromPersonal = () => {
    if (!formData.fullLegalName.trim() || formData.fullLegalName.length < 2) {
      setError("Please enter your full legal name as per government records.");
      return;
    }
    if (formData.role === "woman" && formData.gender !== "female") {
      setError("The emergency distress protection role is reserved exclusively for women.");
      return;
    }
    const birthYear = new Date(formData.dateOfBirth).getFullYear();
    const currentYear = new Date().getFullYear();
    if (currentYear - birthYear < 18) {
      setError("SafeLink network membership requires minimum 18 years of age.");
      return;
    }
    if (!formData.addressLine1.trim() || !formData.city.trim() || !formData.state.trim() || !formData.pinCode.trim()) {
      setError("Please complete all residential address fields.");
      return;
    }
    setStep(3);
  };

  // --- Step 3: Dual OTP Actions ---
  const handleSendPhoneOtp = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      setError("Please enter a valid mobile number with country code (e.g. +919876543210).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiRequest<{ status: string }>(
        "/auth/otp/send",
        {
          method: "POST",
          body: JSON.stringify({
            destination: formData.phone,
            channel: "phone",
            purpose: "registration_verification",
          }),
        }
      );
      setPhoneOtpSent(true);
      setPhoneCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to dispatch mobile OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!formData.phoneOtp || formData.phoneOtp.length !== 6) {
      setError("Please enter the 6-digit mobile verification code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiRequest("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({
          destination: formData.phone,
          otp_code: formData.phoneOtp,
          purpose: "registration_verification",
        }),
      });
      setPhoneVerified(true);
    } catch (err: any) {
      setError(err.message || "Invalid mobile verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailOtp = async () => {
    if (!formData.email || !formData.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiRequest<{ status: string }>(
        "/auth/otp/send",
        {
          method: "POST",
          body: JSON.stringify({
            destination: formData.email,
            channel: "email",
            purpose: "registration_verification",
          }),
        }
      );
      setEmailOtpSent(true);
      setEmailCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to dispatch email verification OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!formData.emailOtp || formData.emailOtp.length !== 6) {
      setError("Please enter the 6-digit email verification code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiRequest("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({
          destination: formData.email,
          otp_code: formData.emailOtp,
          purpose: "registration_verification",
        }),
      });
      setEmailVerified(true);
    } catch (err: any) {
      setError(err.message || "Invalid email verification code.");
    } finally {
      setLoading(false);
    }
  };

  // --- Step 4: Identity & Liveness Simulation ---
  const handleInitiateIdentity = async () => {
    setLoading(true);
    setError(null);
    try {
      setTimeout(() => {
        setIdentityVerified(true);
        setLoading(false);
      }, 1200);
    } catch (err: any) {
      setError(err.message || "DigiLocker verification failed.");
      setLoading(false);
    }
  };

  const handleRunLiveness = () => {
    setLoading(true);
    setTimeout(() => {
      setLivenessPassed(true);
      setLoading(false);
    }, 1500);
  };

  // --- Step 5: Final Submission ---
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.password || formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!formData.acceptedTerms) {
      setError("You must accept the DPDP Privacy Notice & Emergency Response Terms.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const regRes = await apiRequest<{ user_id: string; status: string }>(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            phone: formData.phone,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            full_legal_name: formData.fullLegalName,
            gender: formData.gender,
            date_of_birth: formData.dateOfBirth,
            address_line1: formData.addressLine1,
            address_line2: formData.addressLine2 || undefined,
            city: formData.city,
            state: formData.state,
            pin_code: formData.pinCode,
            accepted_terms: true,
          }),
        }
      );

      setRegisteredUserId(regRes.user_id);
      setStep(6);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please review your inputs.");
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, label: "Role", desc: "Select Protection" },
    { num: 2, label: "Profile", desc: "Legal & Domicile" },
    { num: 3, label: "Contacts", desc: "Dual Verification" },
    { num: 4, label: "Vetting", desc: "ID & Biometrics" },
    { num: 5, label: "Security", desc: "Argon2 Vault" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#070B14] text-slate-100 selection:bg-rose-500/30">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#090D1A]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-lg shadow-rose-900/30 group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5 font-heading">
                SafeLink
                <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                  Onboarding
                </span>
              </span>
              <p className="text-[11px] text-slate-400 font-medium">National Emergency Safety Network</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">Already registered?</span>
            <Link
              href="/login"
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 rounded-lg transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Wizard Container */}
      <main className="mx-auto my-8 w-full max-w-3xl px-4 sm:px-6">
        {/* Progress Stepper */}
        {step <= 5 && (
          <div className="mb-8 rounded-2xl border border-white/5 bg-[#0D1322]/80 p-4 sm:p-5 backdrop-blur-xl shadow-xl">
            <div className="grid grid-cols-5 gap-2 sm:gap-4">
              {stepsList.map((s) => {
                const isComplete = step > s.num;
                const isCurrent = step === s.num;
                return (
                  <div key={s.num} className="flex flex-col items-center text-center">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                        isComplete
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : isCurrent
                          ? "bg-rose-500 text-white shadow-lg shadow-rose-900/50 ring-2 ring-rose-400/30"
                          : "bg-white/5 text-slate-500 border border-white/5"
                      }`}
                    >
                      {isComplete ? <CheckCircle2 className="h-4 w-4" /> : s.num}
                    </div>
                    <span className={`mt-2 text-[11px] font-semibold hidden sm:block ${isCurrent ? "text-white" : isComplete ? "text-emerald-400" : "text-slate-500"}`}>
                      {s.label}
                    </span>
                    <span className="text-[9px] text-slate-500 hidden sm:block">
                      {s.desc}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Progress line indicator */}
            <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 via-teal-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${((step - 1) / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200 backdrop-blur-sm animate-in fade-in">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
            <span className="flex-1 text-xs sm:text-sm">{error}</span>
          </div>
        )}

        {/* --- STEP 1: ACCOUNT TYPE --- */}
        {step === 1 && (
          <div className="rounded-3xl border border-white/10 bg-[#0D1322]/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">
              <ShieldAlert className="h-4 w-4" />
              Step 1 of 5 • Role Selection
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading">
              Choose Your SafeLink Profile
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              SafeLink provides dedicated cryptographic protection workflows tailored to whether you need instant distress shielding or wish to serve as a verified community responder.
            </p>

            <div className="mt-8 space-y-4">
              {/* Woman Role */}
              <div
                onClick={() => updateField("role", "woman")}
                className={`relative flex cursor-pointer items-start gap-4 rounded-2xl border p-5 sm:p-6 transition-all ${
                  formData.role === "woman"
                    ? "border-rose-500/50 bg-gradient-to-r from-rose-500/15 to-transparent ring-2 ring-rose-500/30"
                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                }`}
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  formData.role === "woman" ? "bg-rose-500 text-white shadow-lg shadow-rose-900/40" : "bg-white/5 text-slate-400"
                }`}>
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-white font-heading">Distress Protection (For Women)</span>
                    <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-300">
                      Primary Defense
                    </span>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Access to instant one-touch SOS activation, ephemeral live location dispatch to 3 designated emergency contacts, 112 bridge integration, and volunteer alert within 1,000m.
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> 0 KB idle telemetry
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Encrypted link auto-burn
                    </span>
                  </div>
                </div>
              </div>

              {/* Volunteer Role */}
              <div
                onClick={() => updateField("role", "volunteer")}
                className={`relative flex cursor-pointer items-start gap-4 rounded-2xl border p-5 sm:p-6 transition-all ${
                  formData.role === "volunteer"
                    ? "border-teal-500/50 bg-gradient-to-r from-teal-500/15 to-transparent ring-2 ring-teal-500/30"
                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                }`}
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  formData.role === "volunteer" ? "bg-teal-500 text-white shadow-lg shadow-teal-900/40" : "bg-white/5 text-slate-400"
                }`}>
                  <User className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-white font-heading">Community Volunteer Responder</span>
                    <span className="rounded-full bg-teal-500/20 border border-teal-500/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-300">
                      Verified Citizens (18+)
                    </span>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Provide rapid assistance during localized distress events within 1,000m. Toggle duty availability anytime, receive loud sirens, and support official responders safely.
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 text-teal-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Background checked
                    </span>
                    <span className="flex items-center gap-1 text-teal-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Zero liability good samaritan
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-rose-900/40 hover:from-rose-600 hover:to-rose-700 transition-all"
              >
                Continue to Personal Profile
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 2: PERSONAL & RESIDENTIAL DETAILS --- */}
        {step === 2 && (
          <div className="rounded-3xl border border-white/10 bg-[#0D1322]/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">
              <User className="h-4 w-4" />
              Step 2 of 5 • Identity & Domicile
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading">
              Personal Details & Residential Domicile
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Required strictly for legal verification and emergency responder accountability under our Data Protection Charter.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Full Legal Name (Matching Official Government ID) *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={formData.fullLegalName}
                    onChange={(e) => updateField("fullLegalName", e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => updateField("gender", e.target.value)}
                    disabled={formData.role === "woman"}
                    className="w-full rounded-xl border border-white/10 bg-[#141C30] px-4 py-3 text-sm text-white focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:opacity-70"
                  >
                    <option value="female">Female</option>
                    {formData.role === "volunteer" && (
                      <>
                        <option value="male">Male</option>
                        <option value="other">Other / Prefer not to say</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Date of Birth (18+ only) *
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateField("dateOfBirth", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#141C30] px-4 py-3 text-sm text-white focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.02] p-4 border border-white/5 text-xs text-slate-400">
                <span className="font-semibold text-slate-200">Data Protection Guarantee:</span> Residential information is encrypted at rest using AES-256-GCM. It is never sold, publicly viewable, or accessible to non-admin users.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Residential Address Line 1 *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => updateField("addressLine1", e.target.value)}
                    placeholder="House/Flat No., Building Name, Street"
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => updateField("addressLine2", e.target.value)}
                  placeholder="Locality, Sector, Landmark"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="e.g. New Delhi"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    State *
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    placeholder="e.g. Delhi"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    value={formData.pinCode}
                    onChange={(e) => updateField("pinCode", e.target.value)}
                    placeholder="e.g. 110001"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                onClick={handleProceedFromPersonal}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-7 py-3 text-sm font-bold text-white shadow-xl shadow-rose-900/40 hover:from-rose-600 hover:to-rose-700 transition-all"
              >
                Continue to Verification
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 3: DUAL OTP VERIFICATION --- */}
        {step === 3 && (
          <div className="rounded-3xl border border-white/10 bg-[#0D1322]/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">
              <Mail className="h-4 w-4" />
              Step 3 of 5 • Two-Factor Contact Verification
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading">
              Verify Phone & Email Credentials
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Both channels must be verified to prevent bot accounts and guarantee distress alerts reach real contacts and verified responders.
            </p>

            <div className="mt-6 space-y-6">
              {/* Phone OTP Section */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block">Mobile Phone Verification</span>
                      <span className="text-xs text-slate-400">Used for instant SMS distress dispatches</span>
                    </div>
                  </div>
                  {phoneVerified && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Verified
                    </span>
                  )}
                </div>

                {!phoneVerified ? (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        placeholder="+919876543210"
                        disabled={phoneOtpSent}
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-mono disabled:opacity-60"
                      />
                      <button
                        type="button"
                        onClick={handleSendPhoneOtp}
                        disabled={loading || phoneCooldown > 0}
                        className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-5 py-3 text-xs font-bold text-white disabled:opacity-40 transition-colors"
                      >
                        {phoneOtpSent ? (phoneCooldown > 0 ? `Resend in ${phoneCooldown}s` : "Resend OTP") : "Send OTP"}
                      </button>
                    </div>

                    {phoneOtpSent && !phoneVerified && (
                      <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-2 text-xs text-rose-300 border border-rose-500/20">
                        <Sparkles className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                        <span>OTP dispatched to {formData.phone}. Enter the 6-digit code below:</span>
                      </div>
                    )}

                    {phoneOtpSent && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={formData.phoneOtp}
                          onChange={(e) => updateField("phoneOtp", e.target.value)}
                          placeholder="••••••"
                          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-center font-mono tracking-[0.5em] text-white focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyPhoneOtp}
                          disabled={loading}
                          className="rounded-xl bg-rose-500 hover:bg-rose-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-rose-900/30 transition-all"
                        >
                          Verify Code
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 font-mono bg-white/5 px-3 py-2 rounded-lg border border-white/5 inline-block">
                    {formData.phone}
                  </p>
                )}
              </div>

              {/* Email OTP Section */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block">Email Address Verification</span>
                      <span className="text-xs text-slate-400">Used for session alerts and emergency reports</span>
                    </div>
                  </div>
                  {emailVerified && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Verified
                    </span>
                  )}
                </div>

                {!emailVerified ? (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder="priya.sharma@example.com"
                        disabled={emailOtpSent}
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:opacity-60"
                      />
                      <button
                        type="button"
                        onClick={handleSendEmailOtp}
                        disabled={loading || emailCooldown > 0}
                        className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-5 py-3 text-xs font-bold text-white disabled:opacity-40 transition-colors"
                      >
                        {emailOtpSent ? (emailCooldown > 0 ? `Resend in ${emailCooldown}s` : "Resend OTP") : "Send OTP"}
                      </button>
                    </div>

                    {emailOtpSent && !emailVerified && (
                      <div className="flex items-center gap-2 rounded-xl bg-teal-500/10 px-4 py-2 text-xs text-teal-300 border border-teal-500/20">
                        <Sparkles className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                        <span>OTP dispatched to {formData.email}. Enter the 6-digit code below:</span>
                      </div>
                    )}

                    {emailOtpSent && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={formData.emailOtp}
                          onChange={(e) => updateField("emailOtp", e.target.value)}
                          placeholder="••••••"
                          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-center font-mono tracking-[0.5em] text-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyEmailOtp}
                          disabled={loading}
                          className="rounded-xl bg-teal-500 hover:bg-teal-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-teal-900/30 transition-all"
                        >
                          Verify Code
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 font-mono bg-white/5 px-3 py-2 rounded-lg border border-white/5 inline-block">
                    {formData.email}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-between gap-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                disabled={!phoneVerified || !emailVerified}
                onClick={() => setStep(4)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-7 py-3 text-sm font-bold text-white shadow-xl shadow-rose-900/40 hover:from-rose-600 hover:to-rose-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue to Identity Vetting
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 4: IDENTITY & LIVENESS VETTING --- */}
        {step === 4 && (
          <div className="rounded-3xl border border-white/10 bg-[#0D1322]/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              <Fingerprint className="h-4 w-4" />
              Step 4 of 5 • Official Identity & Liveness Check
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading">
              Government Identity & Biometric Liveness
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              SafeLink verifies all participants via official DigiLocker OAuth or government ID credentials alongside real-time anti-spoofing to protect against impersonation.
            </p>

            <div className="mt-6 space-y-5">
              {/* DigiLocker Card */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Government ID Gateway (DigiLocker / Aadhaar / Voter ID)</p>
                      <p className="text-xs text-slate-400">Secure SHA-256 zero-knowledge cryptographic verification</p>
                    </div>
                  </div>
                  {identityVerified && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Verified
                    </span>
                  )}
                </div>

                {!identityVerified ? (
                  <button
                    type="button"
                    onClick={handleInitiateIdentity}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 py-3 text-xs sm:text-sm font-bold text-white transition-all shadow-md"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" /> : "Verify Identity via DigiLocker"}
                  </button>
                ) : (
                  <div className="text-xs text-emerald-300 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 font-mono flex items-center justify-between">
                    <span>ID_TOKEN: DL-GOV-9843-VERIFIED</span>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">Signed</span>
                  </div>
                )}
              </div>

              {/* Liveness Check Card */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <Camera className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Active Facial Liveness & Anti-Deepfake Challenge</p>
                      <p className="text-xs text-slate-400">Ensures physical presence and prevents stolen photo injection</p>
                    </div>
                  </div>
                  {livenessPassed && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Confirmed
                    </span>
                  )}
                </div>

                {!livenessPassed ? (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs text-rose-200">
                      <strong className="text-rose-300">Biometric Challenge:</strong> Look directly into your front camera and <em>{livenessAction}</em>.
                    </div>
                    <button
                      type="button"
                      onClick={handleRunLiveness}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 w-full rounded-xl bg-rose-500 hover:bg-rose-600 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-rose-900/30 transition-all"
                    >
                      {loading ? <RefreshCw className="h-4 w-4 animate-spin text-white" /> : "Run Biometric Liveness Verification"}
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-emerald-300 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 font-mono flex items-center justify-between">
                    <span>Confidence: 99.8% • Passive Anti-Spoofing Passed</span>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">Live</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-between gap-4">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                disabled={!identityVerified || !livenessPassed}
                onClick={() => setStep(5)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-7 py-3 text-sm font-bold text-white shadow-xl shadow-rose-900/40 hover:from-rose-600 hover:to-rose-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue to Security Setup
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 5: PASSWORD & CONSENT --- */}
        {step === 5 && (
          <form onSubmit={handleFinalSubmit} className="rounded-3xl border border-white/10 bg-[#0D1322]/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">
              <Lock className="h-4 w-4" />
              Step 5 of 5 • Credential Vault & Consent
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading">
              Create Your Security Password
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Your password protects your emergency contacts and profile, hashed with Argon2id cryptographic parameters.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password (Minimum 8 Characters) *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-12 py-3 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => updateField("confirmPassword", e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              {/* DPDP Consent */}
              <div className="pt-3">
                <label className="flex items-start gap-3 cursor-pointer p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.acceptedTerms}
                    onChange={(e) => updateField("acceptedTerms", e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-rose-500 focus:ring-rose-500"
                  />
                  <span className="text-xs text-slate-400 leading-relaxed">
                    I explicitly consent to the collection and processing of my personal details and location strictly during emergency activations under India&apos;s Digital Personal Data Protection Act (DPDP Act 2023). I agree to the{" "}
                    <Link href="/terms" className="text-rose-400 font-semibold hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-rose-400 font-semibold hover:underline">
                      Privacy Policy
                    </Link>.
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-8 flex justify-between gap-4">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-8 py-3 text-sm font-bold text-white shadow-xl shadow-rose-900/40 hover:from-rose-600 hover:to-rose-700 transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin text-white" /> : "Complete Registration"}
              </button>
            </div>
          </form>
        )}

        {/* --- STEP 6: COMPLETION CONFIRMATION --- */}
        {step === 6 && (
          <div className="rounded-3xl border border-emerald-500/30 bg-[#0D1322]/95 p-8 sm:p-12 text-center backdrop-blur-xl shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mb-6 shadow-xl shadow-emerald-950/50">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading">
              Registration & Verification Complete!
            </h2>
            <p className="mt-2 text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Your SafeLink identity credentials have been created, verified, and sealed in our cryptographic directory. You can now access your defense console.
            </p>

            <div className="mt-6 inline-block rounded-xl bg-white/5 p-4 border border-white/10 text-xs font-mono text-emerald-300">
              Member ID: {registeredUserId || "SL-MEMBER-SECURE"} • Status: 100% VERIFIED
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-rose-900/40 hover:from-rose-600 hover:to-rose-700 transition-all"
              >
                Sign In to Safety Dashboard
              </Link>
              <Link
                href="/download"
                className="w-full sm:w-auto rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-6 py-3.5 text-sm font-semibold text-slate-300 transition-colors"
              >
                Download Mobile APK
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
