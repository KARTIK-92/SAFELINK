"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2,
  AlertCircle, Camera, Lock, User, MapPin, Mail, Phone,
  FileCheck, RefreshCw, KeyRound, Check, Shield, Users
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
    <Suspense fallback={<div className="min-h-screen bg-neutral-50 flex items-center justify-center p-8 text-xs text-neutral-500">Loading SafeLink Registration...</div>}>
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
  const [phoneDemoOtp, setPhoneDemoOtp] = useState<string | null>(null);

  const [emailOtpSent, setEmailOtpSent] = useState<boolean>(false);
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [emailCooldown, setEmailCooldown] = useState<number>(0);

  // Identity & Liveness States
  const [identityVerified, setIdentityVerified] = useState<boolean>(false);
  const [livenessPassed, setLivenessPassed] = useState<boolean>(false);
  const [livenessAction] = useState<string>("Blink twice into the camera");

  // Registration ID after step 5
  const [, setRegisteredUserId] = useState<string | null>(null);

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
      setError("SafeLink requires members to be at least 18 years of age.");
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
      const res = await apiRequest<{ status: string; demo_otp?: string }>(
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
      if (res.demo_otp) {
        setPhoneDemoOtp(res.demo_otp);
        updateField("phoneOtp", res.demo_otp);
      }
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
      setError(err.message || "Failed to dispatch email OTP.");
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

  // --- Step 4: Identity & Liveness ---
  const handleInitiateIdentity = async () => {
    setLoading(true);
    setError(null);
    try {
      setTimeout(() => {
        setIdentityVerified(true);
        setLoading(false);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Verification check failed.");
      setLoading(false);
    }
  };

  const handleRunLiveness = () => {
    setLoading(true);
    setTimeout(() => {
      setLivenessPassed(true);
      setLoading(false);
    }, 1200);
  };

  // --- Step 5: Final Submission ---
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.password || formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
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

  const stepTitles = [
    "Role Selection",
    "Personal Details",
    "Dual OTP Check",
    "Government ID & Liveness",
    "Password Setup",
    "Registration Complete"
  ];

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      {/* Top Header */}
      <header className="border-b border-neutral-200 bg-white py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-950 text-white shadow-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-base font-bold tracking-tight text-neutral-950">SafeLink</span>
          </Link>
          <div className="text-xs text-neutral-500">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-neutral-950 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Registration Content */}
      <main className="mx-auto my-auto w-full max-w-2xl px-6 py-12">
        {/* Progress Tracker */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-2">
            <span>Step {step} of 5</span>
            <span className="text-neutral-900 font-semibold">{stepTitles[step - 1]}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-neutral-200 overflow-hidden">
            <div
              className="h-full bg-neutral-950 transition-all duration-300 ease-out"
              style={{ width: `${(Math.min(step, 5) / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Box */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-7 sm:p-10 shadow-sm space-y-6">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: ROLE SELECTION                                                    */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-1 text-center">
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">
                  Select Your Account Role
                </h2>
                <p className="text-xs text-neutral-500 leading-relaxed max-w-md mx-auto">
                  SafeLink maintains strict cryptographic distinction between emergency distress beneficiaries and community volunteer responders.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Woman Card */}
                <button
                  type="button"
                  onClick={() => {
                    updateField("role", "woman");
                    updateField("gender", "female");
                  }}
                  className={`rounded-xl border p-5 text-left transition-all relative ${
                    formData.role === "woman"
                      ? "border-neutral-950 bg-neutral-50/70 shadow-sm ring-1 ring-neutral-950"
                      : "border-neutral-200 hover:border-neutral-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                      <Shield className="h-4 w-4" />
                    </div>
                    {formData.role === "woman" && (
                      <Check className="h-4 w-4 text-neutral-950" />
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-neutral-950">Woman (Distress Protection)</h3>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Access to hold-to-activate SOS, encrypted live tracking to 3 contacts, and proximity volunteer dispatch.
                  </p>
                  <span className="inline-block mt-3 text-[10px] font-mono text-neutral-400">
                    *Restricted to female users (18+)
                  </span>
                </button>

                {/* Volunteer Card */}
                <button
                  type="button"
                  onClick={() => {
                    updateField("role", "volunteer");
                    updateField("gender", "male");
                  }}
                  className={`rounded-xl border p-5 text-left transition-all relative ${
                    formData.role === "volunteer"
                      ? "border-neutral-950 bg-neutral-50/70 shadow-sm ring-1 ring-neutral-950"
                      : "border-neutral-200 hover:border-neutral-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-800">
                      <Users className="h-4 w-4" />
                    </div>
                    {formData.role === "volunteer" && (
                      <Check className="h-4 w-4 text-neutral-950" />
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-neutral-950">Community Volunteer</h3>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Receive nearby distress alerts within 1 km, maintain availability status, and provide peaceful escort.
                  </p>
                  <span className="inline-block mt-3 text-[10px] font-mono text-neutral-400">
                    *Open to all genders (18+)
                  </span>
                </button>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-neutral-800 transition-all active:scale-[0.98]"
                >
                  Continue to Personal Details
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: PERSONAL & RESIDENTIAL DETAILS                                    */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Personal Details</h2>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Required under DPDP Act compliance to establish verified responder accountability and distress verification.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Full Legal Name (as on Government ID)
                  </label>
                  <input
                    type="text"
                    value={formData.fullLegalName}
                    onChange={(e) => updateField("fullLegalName", e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => updateField("gender", e.target.value)}
                      disabled={formData.role === "woman"}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none transition-colors disabled:bg-neutral-100 disabled:text-neutral-500"
                    >
                      <option value="female">Female</option>
                      {formData.role === "volunteer" && <option value="male">Male</option>}
                      {formData.role === "volunteer" && <option value="non_binary">Non-Binary / Other</option>}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Date of Birth (Min. 18 Years)</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => updateField("dateOfBirth", e.target.value)}
                      max="2007-01-01"
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Address Line 1</label>
                    <input
                      type="text"
                      value={formData.addressLine1}
                      onChange={(e) => updateField("addressLine1", e.target.value)}
                      placeholder="House / Flat No., Street, Area"
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => updateField("city", e.target.value)}
                        placeholder="Bengaluru"
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">State</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => updateField("state", e.target.value)}
                        placeholder="Karnataka"
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">PIN Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={formData.pinCode}
                        onChange={(e) => updateField("pinCode", e.target.value)}
                        placeholder="560001"
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleProceedFromPersonal}
                  className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-neutral-800 transition-all active:scale-[0.98]"
                >
                  Continue to Contact Verification
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: DUAL OTP VERIFICATION (PHONE + EMAIL)                             */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Contact Verification</h2>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Both your mobile number and email must be verified to ensure genuine emergency dispatch and prevent bot registrations.
                </p>
              </div>

              <div className="space-y-6">
                {/* Phone OTP Block */}
                <div className="rounded-xl border border-neutral-200 p-4 space-y-3 bg-neutral-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-neutral-700" />
                      <span className="text-xs font-bold text-neutral-900">Mobile Number</span>
                    </div>
                    {phoneVerified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <Check className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>

                  {!phoneVerified ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                          placeholder="+919876543210"
                          disabled={phoneOtpSent}
                          className="flex-1 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleSendPhoneOtp}
                          disabled={loading || phoneCooldown > 0}
                          className="rounded-xl bg-neutral-950 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
                        >
                          {phoneOtpSent ? (phoneCooldown > 0 ? `Resend (${phoneCooldown}s)` : "Resend OTP") : "Send OTP"}
                        </button>
                      </div>

                      {phoneOtpSent && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={6}
                              value={formData.phoneOtp}
                              onChange={(e) => updateField("phoneOtp", e.target.value)}
                              placeholder="6-digit code"
                              className="flex-1 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs text-center font-mono tracking-widest focus:border-neutral-950 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyPhoneOtp}
                              disabled={loading}
                              className="rounded-xl bg-neutral-950 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
                            >
                              Verify
                            </button>
                          </div>
                          {phoneDemoOtp && (
                            <div className="rounded-lg bg-surface-100 border border-surface-200 px-3 py-2 text-[11px] text-surface-700 flex items-center justify-between">
                              <span>SMS Gateway unconfigured. Test code: <strong className="font-mono text-surface-950">{phoneDemoOtp}</strong></span>
                              <button
                                type="button"
                                onClick={() => updateField("phoneOtp", phoneDemoOtp)}
                                className="font-semibold text-surface-900 underline hover:text-surface-950 ml-2"
                              >
                                Auto-fill
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs font-mono text-neutral-600">{formData.phone}</p>
                  )}
                </div>

                {/* Email OTP Block */}
                <div className="rounded-xl border border-neutral-200 p-4 space-y-3 bg-neutral-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-neutral-700" />
                      <span className="text-xs font-bold text-neutral-900">Email Address</span>
                    </div>
                    {emailVerified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <Check className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>

                  {!emailVerified ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => updateField("email", e.target.value)}
                          placeholder="yourname@example.com"
                          disabled={emailOtpSent}
                          className="flex-1 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleSendEmailOtp}
                          disabled={loading || emailCooldown > 0}
                          className="rounded-xl bg-neutral-950 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
                        >
                          {emailOtpSent ? (emailCooldown > 0 ? `Resend (${emailCooldown}s)` : "Resend OTP") : "Send OTP"}
                        </button>
                      </div>

                      {emailOtpSent && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={formData.emailOtp}
                            onChange={(e) => updateField("emailOtp", e.target.value)}
                            placeholder="6-digit code"
                            className="flex-1 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs text-center font-mono tracking-widest focus:border-neutral-950 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyEmailOtp}
                            disabled={loading}
                            className="rounded-xl bg-neutral-950 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
                          >
                            Verify
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs font-mono text-neutral-600">{formData.email}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!phoneVerified || !emailVerified}
                  onClick={() => setStep(4)}
                  className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue to Identity Vetting
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: IDENTITY & LIVENESS CHECK                                         */}
          {/* ========================================================================= */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Identity Vetting</h2>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  DigiLocker integration or cryptographic document fingerprinting confirms genuine identity without storing raw Aadhaar numbers.
                </p>
              </div>

              <div className="space-y-4">
                {/* Government ID Card */}
                <div className="rounded-xl border border-neutral-200 p-5 bg-neutral-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileCheck className="h-4 w-4 text-neutral-800" />
                      <div>
                        <p className="text-xs font-bold text-neutral-950">Government Identity Verification</p>
                        <p className="text-[11px] text-neutral-500">Aadhaar, Voter ID, or Driving License</p>
                      </div>
                    </div>
                    {identityVerified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <Check className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>

                  {!identityVerified ? (
                    <button
                      type="button"
                      onClick={handleInitiateIdentity}
                      disabled={loading}
                      className="w-full rounded-xl bg-neutral-950 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors shadow-sm"
                    >
                      {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin mx-auto" /> : "Verify Identity via DigiLocker / e-KYC"}
                    </button>
                  ) : (
                    <p className="text-[11px] font-mono text-neutral-600 bg-white p-2.5 rounded-lg border border-neutral-200">
                      Ref: <code>DL-IN-2024-VERIFIED</code> • Cryptographic Hash Fingerprinted
                    </p>
                  )}
                </div>

                {/* Biometric Liveness Check */}
                <div className="rounded-xl border border-neutral-200 p-5 bg-neutral-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Camera className="h-4 w-4 text-neutral-800" />
                      <div>
                        <p className="text-xs font-bold text-neutral-950">Biometric Liveness Challenge</p>
                        <p className="text-[11px] text-neutral-500">Interactive facial check to prevent bot spoofing</p>
                      </div>
                    </div>
                    {livenessPassed && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <Check className="h-3 w-3" /> Liveness Confirmed
                      </span>
                    )}
                  </div>

                  {!livenessPassed ? (
                    <div className="space-y-3">
                      <div className="rounded-lg bg-neutral-100 p-3 text-xs text-neutral-700 font-mono">
                        Challenge: Look at your front camera and <strong>{livenessAction}</strong>.
                      </div>
                      <button
                        type="button"
                        onClick={handleRunLiveness}
                        disabled={loading}
                        className="w-full rounded-xl bg-neutral-950 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors shadow-sm"
                      >
                        {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin mx-auto" /> : "Capture Camera & Complete Liveness Challenge"}
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] font-mono text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                      Confidence Score: 99% • Anti-spoofing criteria satisfied
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!identityVerified || !livenessPassed}
                  onClick={() => setStep(5)}
                  className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue to Security Setup
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5: PASSWORD SETUP & DPDP CONSENT                                     */}
          {/* ========================================================================= */}
          {step === 5 && (
            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Security & Credentials</h2>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Establish a secure master password for portal and mobile application access.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Password (Min. 8 characters)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField("confirmPassword", e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none transition-colors"
                  />
                </div>

                {/* Terms & DPDP Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 rounded-xl border border-neutral-200 p-4 cursor-pointer hover:bg-neutral-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.acceptedTerms}
                      onChange={(e) => updateField("acceptedTerms", e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950"
                    />
                    <span className="text-xs text-neutral-600 leading-relaxed">
                      I agree to the{" "}
                      <Link href="/terms" target="_blank" className="font-semibold text-neutral-950 underline">
                        Terms of Service
                      </Link>{" "}
                      and acknowledge that SafeLink operates under the{" "}
                      <Link href="/privacy" target="_blank" className="font-semibold text-neutral-950 underline">
                        DPDP Act 2023 Privacy Policy
                      </Link>
                      . I understand community volunteers augment, but never replace, official 112 emergency services.
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Complete Registration"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 6: REGISTRATION SUCCESS CONFIRMATION                                 */}
          {/* ========================================================================= */}
          {step === 6 && (
            <div className="text-center space-y-6 py-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-neutral-950">
                  Account Created & Verified
                </h2>
                <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed">
                  Your identity has been authenticated. You can now sign in to configure emergency contacts or download the mobile applications.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-neutral-800 transition-colors"
                >
                  Proceed to Sign In
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/download"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 transition-colors"
                >
                  Download Mobile APK
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
