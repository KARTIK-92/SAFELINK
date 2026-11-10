"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, Lock, Phone, Mail, KeyRound,
  ArrowRight, AlertCircle, RefreshCw, Sparkles
} from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"password" | "otp">("password");

  // Form inputs
  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");

  // OTP State
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  // Status State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!identifier.trim()) {
      setError("Please enter your registered phone number or email address.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const isEmail = identifier.includes("@");
      const res = await apiRequest<{ status: string; demo_otp?: string }>(
        "/auth/otp/send",
        {
          method: "POST",
          body: JSON.stringify({
            destination: identifier.trim(),
            channel: isEmail ? "email" : "phone",
            purpose: "login",
          }),
        }
      );
      setOtpSent(true);
      setCooldown(60);
      if (res.demo_otp) setDemoOtp(res.demo_otp);
    } catch (err: any) {
      setError(err.message || "Failed to dispatch login OTP.");
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
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Header */}
      <header className="border-b border-border bg-white py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navyDark text-white shadow-sm">
              <ShieldCheck className="h-5 w-5 text-brand-tealLight" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">SafeLink</span>
          </Link>
          <div className="text-xs text-muted">
            New to SafeLink?{" "}
            <Link href="/register" className="font-semibold text-brand-teal hover:underline">
              Register Account
            </Link>
          </div>
        </div>
      </header>

      {/* Login Box */}
      <main className="mx-auto my-auto w-full max-w-md px-6 py-12">
        <div className="rounded-2xl border border-border bg-white p-8 shadow-card">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Sign In to SafeLink</h1>
            <p className="mt-1.5 text-xs text-muted">
              Secure access to emergency protection and responder dashboard.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode("password");
                setError(null);
              }}
              className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
                authMode === "password"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("otp");
                setError(null);
              }}
              className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
                authMode === "otp"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              One-Time Passcode (OTP)
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Mobile Number or Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="+919876543210 or name@example.com"
                className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
              />
            </div>

            {authMode === "password" ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Password</label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-brand-teal hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
                  />
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="w-full rounded-lg bg-brand-navy py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin mx-auto" /> : "Request Login Code"}
                  </button>
                ) : (
                  <>
                    {demoOtp && (
                      <div className="flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-1.5 text-xs text-brand-teal border border-teal-200">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>[DEMO CODE]: <strong>{demoOtp}</strong></span>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Enter 6-Digit Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        className="w-full rounded-lg border border-border px-3.5 py-2.5 text-center font-mono tracking-widest text-sm focus:border-brand-teal focus:outline-none"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (authMode === "otp" && !otpSent)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-teal py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 transition-colors disabled:opacity-50 mt-4"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-border pt-4 text-center">
            <p className="text-xs text-muted">
              Protected by Argon2id cryptographic hashing & automated lockout protocols.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
