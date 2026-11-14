"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, AlertCircle, CheckCircle2, User, Phone, Mail,
  LogOut, Smartphone, RefreshCw, ShieldAlert, HeartHandshake,
  Activity, Bell, MapPin, Radio, Compass, Shield, Award,
  Sparkles, X
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
          ? "Status updated to AVAILABLE. You will receive emergency alerts when someone nearby requires help."
          : "Status updated to OFFLINE. Proximity scanning has ceased."
      );
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
      <div className="flex min-h-screen items-center justify-center bg-[#070B14]">
        <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
          <RefreshCw className="h-5 w-5 animate-spin text-teal-400" />
          Loading SafeLink Volunteer Responder Command...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col selection:bg-teal-500/30">
      {/* Top Header */}
      <header className="border-b border-white/5 bg-[#090D1A]/90 sticky top-0 z-40 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-lg shadow-teal-900/30 group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white font-heading">SafeLink</span>
              <span className="rounded-full bg-teal-500/15 px-2.5 py-0.5 text-[11px] font-bold text-teal-300 border border-teal-500/30">
                Community Responder
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-white">
                {user?.profile?.full_legal_name || "Verified Responder"}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{user?.phone}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="mx-auto my-8 w-full max-w-6xl px-4 sm:px-6 flex-1 space-y-8">
        {/* Alerts Banner */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs sm:text-sm text-rose-200">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs sm:text-sm text-emerald-200">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            <span className="flex-1">{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Live Availability Switch Hero Card */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0D1322] via-[#111A2E] to-[#0D1322] p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className={`absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
            isAvailable ? "bg-emerald-500/15" : "bg-slate-500/10"
          }`} />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <span
                  className={`flex h-3.5 w-3.5 rounded-full ${
                    isAvailable ? "bg-emerald-400 animate-pulse shadow-lg shadow-emerald-500/50" : "bg-slate-600"
                  }`}
                />
                <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
                  STATUS: {isAvailable ? "AVAILABLE TO RESPOND" : "STANDBY / OFFLINE"}
                </h2>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                  isAvailable
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-white/5 text-slate-400 border border-white/10"
                }`}>
                  {isAvailable ? "Radar Scanning (1,000m)" : "No Telemetry Broadcasted"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {isAvailable
                  ? "Your proximity radar is active. If a woman triggers an emergency SOS within 1 kilometre, you will immediately receive high-priority audible alerts and turn-by-turn routing."
                  : "You are currently offline. SafeLink guarantees 100% telemetry privacy: no location data is tracked or logged while you are marked unavailable."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleAvailability}
                disabled={toggleLoading}
                className={`flex items-center gap-2.5 rounded-xl px-7 py-3.5 text-sm font-bold text-white shadow-xl transition-all ${
                  isAvailable
                    ? "bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200"
                    : "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-teal-900/40"
                }`}
              >
                {toggleLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : isAvailable ? (
                  <>
                    <Activity className="h-4 w-4 text-emerald-400" />
                    Set Status to Offline
                  </>
                ) : (
                  <>
                    <Radio className="h-4 w-4 text-white animate-pulse" />
                    Go Available on Radar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats & Guidelines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Volunteer Vetting Card */}
          <div className="rounded-3xl border border-white/10 bg-[#0D1322]/90 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Award className="h-4 w-4 text-teal-400" />
              <h3 className="text-base font-bold text-white font-heading">Credentials & Activity</h3>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-slate-400">Account Vetting:</span>
                <span className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2.5 py-0.5 font-bold uppercase text-[10px]">
                  {user?.status?.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-slate-400">Government ID:</span>
                <span className="font-mono text-white font-medium">DigiLocker Verified</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-slate-400">Registered Phone:</span>
                <span className="font-mono text-white">{user?.phone}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-slate-400">Total Responses:</span>
                <span className="font-bold text-white font-mono">{volProfile?.total_incidents_responded || 0} Incidents</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-slate-400">Dispatch Perimeter:</span>
                <span className="text-teal-400 font-mono font-bold">1,000 meters</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/download"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 py-3 text-xs font-bold text-white transition-all shadow-md"
              >
                <Smartphone className="h-4 w-4 text-teal-400" />
                Download Volunteer APK
              </Link>
            </div>
          </div>

          {/* Critical Safety Guidelines */}
          <div className="md:col-span-2 rounded-3xl border border-white/10 bg-[#0D1322]/90 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
              <h3 className="text-base font-bold text-white font-heading">
                Volunteer Operational Protocol & Samaritan Shield
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4">
                <p className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  1. Auxiliary Presence, Not Law Enforcement
                </p>
                <p className="text-slate-400">
                  Volunteers provide urgent human deterrence, first aid, and witness presence. You are not armed police and must never attempt dangerous combat or weapons interception.
                </p>
              </div>

              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4">
                <p className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <Compass className="h-4 w-4 shrink-0" />
                  2. Maintain Distance & Call 112
                </p>
                <p className="text-slate-400">
                  If violent confrontation is occurring, observe from a safe perimeter, maintain visual tracking of escape routes, and guide arriving police via 112 emergency dispatch.
                </p>
              </div>

              <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                <p className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <HeartHandshake className="h-4 w-4 text-teal-400 shrink-0" />
                  3. Good Samaritan Legal Protection
                </p>
                <p className="text-slate-400">
                  Under the Supreme Court Good Samaritan Guidelines and Section 134A of the MV Act, verified volunteers acting in good faith have zero civil or criminal liability.
                </p>
              </div>

              <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                <p className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                  4. Automatic Cryptographic Deletion
                </p>
                <p className="text-slate-400">
                  Victim coordinates are decrypted only on your device during an active incident. The moment the emergency is cancelled or resolved, all GPS data burns automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
