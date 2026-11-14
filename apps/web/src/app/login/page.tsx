"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, Lock, ArrowRight, AlertCircle, RefreshCw, KeyRound, Mail, Smartphone
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

  // Status State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!identifier.trim()) {
      setError("Please enter your registered mobile number or email address.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const isEmail = identifier.includes("@");
      await apiRequest<{ status: string }>(
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
      setError("Please enter your account password.");
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
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-neutral-950 hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </header>

      {/* Login Box */}
      <main className="mx-auto my-auto w-full max-w-md px-6 py-12">
        <div className="rounded-2xl border border-neutral-200 bg-white p-7 sm:p-9 shadow-sm space-y-6">
          <div className="space-y-1.5 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
              Sign In to SafeLink
            </h1>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Access your emergency protection status or responder dashboard.
            </p>
          </div>

          {/* Segmented Control */}
          <div className="flex rounded-lg border border-neutral-200 bg-neutral-100 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setAuthMode("password");
                setError(null);
              }}
              className={`flex-1 rounded-md py-1.5 transition-all ${
                authMode === "password"
                  ? "bg-white text-neutral-950 shadow-sm font-semibold"
                  : "text-neutral-600 hover:text-neutral-950"
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
              className={`flex-1 rounded-md py-1.5 transition-all ${
                authMode === "otp"
                  ? "bg-white text-neutral-950 shadow-sm font-semibold"
                  : "text-neutral-600 hover:text-neutral-950"
              }`}
            >
              One-Time Passcode (OTP)
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Registered Phone or Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="+919876543210 or yourname@example.com"
                className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none transition-colors"
              />
            </div>

            {authMode === "password" ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-neutral-700">Password</label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
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
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none transition-colors"
                  />
                  <Lock className="absolute right-3.5 top-3 h-3.5 w-3.5 text-neutral-400" />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin mx-auto" /> : "Dispatch Verification Code"}
                  </button>
                ) : (
                  <>
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span>6-digit verification code sent to your contact.</span>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        Enter 6-Digit Passcode
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-center font-mono tracking-widest text-sm focus:border-neutral-950 focus:outline-none transition-colors"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (authMode === "otp" && !otpSent)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 py-3 text-xs font-semibold text-white shadow-sm hover:bg-neutral-800 transition-all active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="border-t border-neutral-100 pt-4 text-center">
            <p className="text-[11px] text-neutral-400 leading-relaxed font-mono">
              Protected by Argon2id cryptographic hashing • DPDP Compliant
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
