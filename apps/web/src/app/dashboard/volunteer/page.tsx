"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, AlertCircle, CheckCircle2, User, Phone, Mail,
  LogOut, Smartphone, RefreshCw, ShieldAlert, HeartHandshake,
  Activity, Bell, MapPin, Radio, Compass, Award, ExternalLink
} from "lucide-react";
import { apiRequest } from "@/lib/api";

interface VolunteerProfileData {
  id: string;
  user_id: string;
  vehicle_type: string;
  skills: string[];
  is_available: boolean;
  total_incidents_responded: number;
}

interface UserProfile {
  id: string;
  phone: string;
  email: string;
  role: string;
  status: string;
  profile?: {
    full_legal_name: string;
    city: string;
    state: string;
  };
}

export default function VolunteerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [volProfile, setVolProfile] = useState<VolunteerProfileData | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [toggleLoading, setToggleLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadVolunteerData();
  }, []);

  const loadVolunteerData = async () => {
    setLoading(true);
    setError(null);
    try {
      const userData = await apiRequest<UserProfile>("/users/me");
      if (userData.role !== "volunteer") {
        router.push(`/dashboard/${userData.role}`);
        return;
      }
      setUser(userData);

      const profileData = await apiRequest<VolunteerProfileData>("/volunteer/me");
      setVolProfile(profileData);
      setIsAvailable(profileData.is_available);
    } catch (err: any) {
      setError(err.message || "Failed to load volunteer dashboard.");
      if (err.message?.includes("401") || err.message?.includes("credentials")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    setToggleLoading(true);
    setError(null);
    const nextState = !isAvailable;
    try {
      await apiRequest("/volunteer/availability", {
        method: "POST",
        body: JSON.stringify({ is_available: nextState, reason: "Web dashboard manual toggle" }),
      });
      setIsAvailable(nextState);
      setSuccessMsg(
        nextState
          ? "Status updated to AVAILABLE. You will receive real-time push alerts when someone within 1 km calls for help."
          : "Status updated to STANDBY. Real-time telemetry broadcast disabled."
      );
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to update availability state.");
    } finally {
      setToggleLoading(false);
    }
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("safelink_refresh_token");
    if (refreshToken) {
      try {
        await apiRequest("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch (_) {}
    }
    localStorage.clear();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="flex items-center gap-3 text-surface-600 text-sm font-medium">
          <RefreshCw className="h-4 w-4 animate-spin text-surface-900" />
          Loading Responder Command Portal...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col text-surface-900 antialiased selection:bg-surface-200">
      {/* Top Header */}
      <header className="border-b border-surface-200 bg-white sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-950 text-white">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="text-base font-semibold tracking-tight text-surface-950">SafeLink</span>
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-surface-100 px-2.5 py-0.5 text-xs font-medium text-surface-700">
              Volunteer Responder Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-surface-500 hidden sm:inline">
              Responder: <strong className="text-surface-900 font-semibold">{user?.profile?.full_legal_name || user?.email}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-700 hover:bg-surface-100 active:scale-[0.98] transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="mx-auto my-8 w-full max-w-6xl px-6 flex-1 space-y-6">
        {/* Alerts Banner */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/60 p-4 text-xs text-rose-900">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-900">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Live Availability Switch Card */}
        <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-2.5 w-2.5 rounded-full ${
                  isAvailable ? "bg-emerald-500 ring-4 ring-emerald-50" : "bg-surface-400"
                }`}
              />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-surface-500">Dispatch Status</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                  isAvailable
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-surface-100 border-surface-200 text-surface-600"
                }`}
              >
                {isAvailable ? "ON-DUTY &bull; AVAILABLE" : "STANDBY &bull; OFFLINE"}
              </span>
            </div>
            <p className="text-lg font-semibold tracking-tight text-surface-950 pt-1">
              {isAvailable ? "Active Emergency Dispatch Radar (1 km Radius)" : "Standby Mode — Location Tracking Ceased"}
            </p>
            <p className="text-xs text-surface-500 max-w-2xl leading-relaxed">
              {isAvailable
                ? "Your status is active. When a woman in distress triggers an SOS within 1 km of your coordinate, your phone receives high-priority dispatch telemetry with live turn-by-turn guidance."
                : "You are currently inactive. Under India's DPDP Act, SafeLink never polls or stores your coordinates while you are in standby."}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleToggleAvailability}
              disabled={toggleLoading}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold shadow-xs transition active:scale-[0.98] ${
                isAvailable
                  ? "bg-surface-100 border border-surface-300 text-surface-800 hover:bg-surface-200"
                  : "bg-surface-950 text-white hover:bg-surface-800"
              }`}
            >
              {toggleLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : isAvailable ? (
                <>
                  <Radio className="h-4 w-4 text-emerald-600" />
                  Go Off-Duty (Standby)
                </>
              ) : (
                <>
                  <Radio className="h-4 w-4 text-surface-400" />
                  Go On-Duty (Active)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Responder Stats & Profile Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-surface-200 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">Service Record</span>
              <Award className="h-4 w-4 text-surface-400" />
            </div>
            <div>
              <span className="text-3xl font-semibold tracking-tight text-surface-950">
                {volProfile?.total_incidents_responded || 0}
              </span>
              <p className="text-xs text-surface-500 mt-1">Verified Incidents Responded</p>
            </div>
            <p className="text-[11px] text-surface-400 leading-relaxed border-t border-surface-100 pt-3">
              Emergency responses are verified via cryptographic dispatch logs and audit tokens.
            </p>
          </div>

          <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-surface-200 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">Transit Mode</span>
              <Compass className="h-4 w-4 text-surface-400" />
            </div>
            <div>
              <span className="text-base font-semibold tracking-tight text-surface-950 capitalize">
                {volProfile?.vehicle_type || "Foot Patrol"}
              </span>
              <p className="text-xs text-surface-500 mt-1">Primary Response Mobility</p>
            </div>
            <div className="border-t border-surface-100 pt-3 flex flex-wrap gap-1.5">
              {volProfile?.skills?.map((skill) => (
                <span
                  key={skill}
                  className="rounded bg-surface-100 px-2 py-0.5 text-[10px] font-medium text-surface-600 uppercase"
                >
                  {skill}
                </span>
              )) || <span className="text-xs text-surface-400">First-aid certified</span>}
            </div>
          </div>

          <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-surface-200 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">Android Responder App</span>
              <Smartphone className="h-4 w-4 text-surface-400" />
            </div>
            <div>
              <p className="text-xs text-surface-600 leading-relaxed">
                Install the dedicated Volunteer Responder APK for turn-by-turn navigation and zero-lock-screen alert bypass.
              </p>
            </div>
            <div className="pt-1">
              <Link
                href="/download"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-950 hover:underline"
              >
                Download APK Sideload Package &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Responder Protocols & Code of Conduct */}
        <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-surface-200 pb-3">
            <h3 className="text-sm font-semibold tracking-tight text-surface-950">Volunteer Responder Code of Conduct</h3>
            <p className="text-xs text-surface-500 mt-0.5">Strict adherence required for active certified status</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-surface-600">
            <div className="space-y-1">
              <p className="font-semibold text-surface-900">1. Presence Over Heroism</p>
              <p className="leading-relaxed text-surface-500">
                Your role is rapid de-escalation, deterrence through visibility, and witness verification. Never endanger yourself unnecessarily.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-surface-900">2. Police Coordination</p>
              <p className="leading-relaxed text-surface-500">
                SafeLink automatically coordinates with Emergency 112. Direct victims toward well-lit public areas or police patrol units.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-surface-900">3. Privacy & DPDP Zero-PII</p>
              <p className="leading-relaxed text-surface-500">
                Never capture photos or videos of the distressed individual. Tracking telemetry expires immediately upon emergency resolution.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
