"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, ArrowLeft, ArrowRight, Lock,
  AlertCircle, CheckCircle2, RefreshCw, Sparkles
} from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
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
      if (res.demo_otp) setDemoOtp(res.demo_otp);
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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-white py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navyDark text-white shadow-sm">
              <ShieldCheck className="h-5 w-5 text-brand-tealLight" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">SafeLink</span>
          </Link>
          <Link href="/login" className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Return to Login
          </Link>
        </div>
      </header>

      <main className="mx-auto my-auto w-full max-w-md px-6 py-12">
        <div className="rounded-2xl border border-border bg-white p-8 shadow-card">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Reset Password</h1>
            <p className="mt-1.5 text-xs text-muted">
              Verify your registered contact to establish a new password.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Password Reset Successful!</h2>
              <p className="text-xs text-muted">
                All previous sessions have been securely terminated. You can now log in with your updated credentials.
              </p>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-lg bg-brand-teal py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
              >
                Sign In Now
              </Link>
            </div>
          ) : !otpSent ? (
            <form onSubmit={handleSendResetOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Mobile Number or Email
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="+919876543210 or name@example.com"
                  className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-teal py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 transition-colors disabled:opacity-50"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Dispatch Verification Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirmReset} className="space-y-4">
              {demoOtp && (
                <div className="flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-1.5 text-xs text-brand-teal border border-teal-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>[DEMO RESET CODE]: <strong>{demoOtp}</strong></span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">6-Digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full rounded-lg border border-border px-3.5 py-2.5 text-center font-mono tracking-widest text-sm focus:border-brand-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password (Min. 8 chars)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm focus:border-brand-teal focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-teal py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 transition-colors disabled:opacity-50"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
