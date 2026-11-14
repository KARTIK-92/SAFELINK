"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield, ShieldCheck, Lock, Phone, Mail, ArrowRight,
  AlertCircle, RefreshCw, Eye, EyeOff, CheckCircle2, PhoneCall
} from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"password" | "otp">("password");

  // Form inputs
  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>("");

  // OTP State
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);

  // Status State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cooldown countdown
  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async () => {
    if (!identifier.trim()) {
      setError("Please enter your registered mobile number or email address.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const isEmail = identifier.includes("@");
      await apiRequest<{ status: string }>("/auth/otp/send", {
        method: "POST",
        body: JSON.stringify({
          destination: identifier.trim(),
          channel: isEmail ? "email" : "phone",
          purpose: "login",
        }),
      });
      setOtpSent(true);
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to dispatch verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Please enter your registered mobile number or email.");
      return;
    }
    if (authMode === "password" && !password) {
      setError("Please enter your password.");
      return;
    }
    if (authMode === "otp" && (!otpCode || otpCode.length !== 6)) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        identifier: identifier.trim(),
        device_info: "SafeLink Web Portal",
      };
      if (authMode === "password") {
        payload.password = password;
      } else {
        payload.otp_code = otpCode;
      }

      const res = await apiRequest<{
        access_token: string;
        refresh_token: string;
        user: { role: string; full_legal_name?: string };
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // Store tokens
      localStorage.setItem("safelink_token", res.access_token);
      localStorage.setItem("safelink_refresh_token", res.refresh_token);
      localStorage.setItem("safelink_user_role", res.user.role);

      // Redirect based on role
      if (res.user.role === "volunteer") {
        router.push("/dashboard/volunteer");
      } else if (res.user.role === "admin") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard/woman");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFD] text-[#090D1A]">
      
      {/* Top Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xl py-4 sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm group-hover:bg-rose-950 transition-colors">
              <Shield className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-slate-950 font-heading">SafeLink</span>
              <span className="ml-2 rounded-md bg-rose-50 border border-rose-200/80 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 uppercase">
                Auth
              </span>
            </div>
          </Link>
          
          <div className="text-xs text-slate-500 font-medium">
            New to SafeLink?{" "}
            <Link href="/register" className="font-bold text-rose-600 hover:text-rose-700 hover:underline">
              Create an Account
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto my-auto w-full max-w-5xl px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/5 overflow-hidden">
          
          {/* Left Column: Mission & Trust (Desktop only) */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 text-white p-10 flex-col justify-between relative overflow-hidden">
            <div className="space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/20 border border-rose-400/30 px-3 py-1 text-xs font-bold text-rose-300">
                <span className="flex h-2 w-2 rounded-full bg-rose-400 animate-ping" />
                Verified Access Portal
              </div>

              <h2 className="text-3xl font-extrabold tracking-tight font-heading leading-tight">
                Secure Entry to Emergency Protection.
              </h2>

              <p className="text-xs text-slate-300 leading-relaxed">
                Log in to manage emergency contacts, update live status, or respond to nearby community alerts as a verified guardian.
              </p>

              <div className="space-y-3 pt-4 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Argon2id Memory-Hard Cryptographic Hashing</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Dual Multi-Factor Verification Support</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>India DPDP Act 2023 Compliant</span>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-800/80 relative z-10">
              <p className="text-[11px] text-slate-400 font-medium">In urgent danger right now?</p>
              <a href="tel:112" className="mt-1.5 inline-flex items-center gap-2 text-xs font-bold text-rose-400 hover:text-rose-300">
                <PhoneCall className="h-3.5 w-3.5" />
                Call 112 National Helpline Immediately
              </a>
            </div>
          </div>

          {/* Right Column: Sign In Form */}
          <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
            
            <div className="mb-6 space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-heading">
                Sign In to SafeLink
              </h1>
              <p className="text-xs text-slate-500">
                Enter your registered mobile number or email address to access your dashboard.
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("password");
                  setError(null);
                }}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                  authMode === "password"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Password Authentication
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("otp");
                  setError(null);
                }}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                  authMode === "otp"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                One-Time Passcode (OTP)
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Registered Mobile Number or Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="+919876543210 or your.name@example.com"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-rose-600 focus:outline-none transition-all"
                  />
                  <Phone className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {authMode === "password" ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">Password</label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-rose-600 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Request 6-Digit Code via SMS / Email"}
                    </button>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>A 6-digit verification code has been dispatched.</span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-700">6-Digit Code</label>
                          {cooldown > 0 ? (
                            <span className="text-xs text-slate-400 font-mono">Resend in {cooldown}s</span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              className="text-xs text-rose-600 font-bold hover:underline"
                            >
                              Resend Code
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="123456"
                          className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-center font-mono tracking-widest text-base font-bold text-slate-900 focus:bg-white focus:border-rose-600 focus:outline-none transition-all"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (authMode === "otp" && !otpSent)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-600/20 hover:from-rose-700 hover:to-rose-600 active:scale-[0.98] transition-all disabled:opacity-50 mt-4 cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 border-t border-slate-100 pt-5 text-center">
              <p className="text-[11px] text-slate-400">
                Protected by Argon2id cryptographic password hashing and automated lockout safeguards.
              </p>
            </div>

          </div>

        </div>
      </main>

    </div>
  );
}
