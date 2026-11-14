"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, ArrowLeft, ArrowRight, Lock,
  AlertCircle, CheckCircle2, RefreshCw
} from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [destination, setDestination] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
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
      const res = await apiRequest<{ status: string; demo_otp?: string }>(
        "/auth/password/reset-request",
        {
          method: "POST",
          body: JSON.stringify({
            destination: destination.trim(),
            channel: isEmail ? "email" : "phone",
          }),
        }
      );
      setOtpSent(true);
      if (res.demo_otp) {
        setDemoOtp(res.demo_otp);
        setOtpCode(res.demo_otp);
      }
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
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-950 text-white shadow-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-base font-bold tracking-tight text-neutral-950">SafeLink</span>
          </Link>
          <Link href="/login" className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-950">
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to Login
          </Link>
        </div>
      </header>

      <main className="mx-auto my-auto w-full max-w-md px-6 py-12">
        <div className="rounded-2xl border border-neutral-200 bg-white p-7 sm:p-9 shadow-sm space-y-6">
          <div className="space-y-1.5 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">Reset Password</h1>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Verify your registered contact to establish a new password.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-4 py-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-neutral-950">Password Updated Successfully</h2>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  All previous sessions have been securely terminated. You can now log in with your updated password.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-xl bg-neutral-950 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors"
              >
                Sign In Now
              </Link>
            </div>
          ) : !otpSent ? (
            <form onSubmit={handleSendResetOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Registered Mobile Number or Email
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="+919876543210 or yourname@example.com"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 py-3 text-xs font-semibold text-white shadow-sm hover:bg-neutral-800 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Dispatch Verification Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirmReset} className="space-y-4">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs text-emerald-800 border border-emerald-200">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>A 6-digit password reset code has been sent.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">6-Digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-center font-mono tracking-widest text-sm focus:border-neutral-950 focus:outline-none transition-colors"
                />
                {demoOtp && (
                  <div className="mt-2 rounded-lg bg-surface-100 border border-surface-200 px-3 py-2 text-[11px] text-surface-700 flex items-center justify-between">
                    <span>Test Code: <strong className="font-mono text-surface-950">{demoOtp}</strong> (dispatched to SMS)</span>
                    <button
                      type="button"
                      onClick={() => setOtpCode(demoOtp)}
                      className="font-semibold text-surface-900 underline hover:text-surface-950 ml-2"
                    >
                      Auto-fill
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">New Password (Min. 8 characters)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 py-3 text-xs font-semibold text-white shadow-sm hover:bg-neutral-800 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
