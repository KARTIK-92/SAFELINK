"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield, ArrowLeft, ArrowRight, Lock,
  AlertCircle, CheckCircle2, RefreshCw, Phone
} from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [destination, setDestination] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) {
      setError("Please enter your registered mobile number or email.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isEmail = destination.includes("@");
      await apiRequest<{ status: string }>("/auth/password/reset-request", {
        method: "POST",
        body: JSON.stringify({
          destination: destination.trim(),
          channel: isEmail ? "email" : "phone",
        }),
      });
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || "Unable to send password reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError("Please enter the 6-digit reset code.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiRequest("/auth/password/reset-confirm", {
        method: "POST",
        body: JSON.stringify({
          destination: destination.trim(),
          otp_code: otpCode,
          new_password: newPassword,
        }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please check your code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFD] text-[#090D1A]">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xl py-4 sticky top-0 z-40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <Shield className="h-5 w-5 text-rose-400" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-950 font-heading">SafeLink</span>
          </Link>
          <Link href="/login" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      </header>

      <main className="mx-auto my-auto w-full max-w-md px-6 py-12">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-9 shadow-xl shadow-slate-900/5">
          <div className="text-center mb-6 space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 font-heading">
              Reset Password
            </h1>
            <p className="text-xs text-slate-500">
              Verify your registered contact to establish a new password.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-950 font-heading">Password Reset Successful!</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                All existing active sessions have been securely terminated. You can now log in with your updated password.
              </p>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-md hover:bg-slate-800 transition-colors"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : !otpSent ? (
            <form onSubmit={handleSendResetOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Registered Mobile Number or Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="+919876543210 or your.name@example.com"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-rose-600 focus:outline-none transition-all"
                  />
                  <Phone className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-md hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Dispatch Verification Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirmReset} className="space-y-4">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Verification code dispatched to your registered contact.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">6-Digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-center font-mono tracking-widest text-base font-bold text-slate-900 focus:bg-white focus:border-rose-600 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">New Password (Min. 8 characters)</label>
                <div className="relative">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-rose-600 focus:outline-none transition-all"
                  />
                  <Lock className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-rose-600 focus:outline-none transition-all"
                  />
                  <Lock className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-600/20 hover:from-rose-700 hover:to-rose-600 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Update Password & Secure Sessions"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
