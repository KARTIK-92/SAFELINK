"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, AlertCircle, CheckCircle2, User, Phone, Mail,
  LogOut, Smartphone, RefreshCw, ShieldAlert, HeartHandshake,
  Activity, Bell, MapPin
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
          ? "Status updated to AVAILABLE. You will receive alerts when someone nearby requires help."
          : "Status updated to OFFLINE. Location tracking has ceased."
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted text-sm font-medium">
          <RefreshCw className="h-5 w-5 animate-spin text-brand-teal" />
          Loading Volunteer Responder Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="border-b border-border bg-white sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navyDark text-white">
              <ShieldCheck className="h-5 w-5 text-brand-tealLight" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">SafeLink</span>
            <span className="hidden sm:inline rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200 ml-2">
              Volunteer Responder
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-xs text-muted hidden sm:inline">
              Responder: <strong>{user?.profile?.full_legal_name || user?.email}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="mx-auto my-8 w-full max-w-6xl px-6 flex-1 space-y-8">
        {/* Alerts Banner */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 p-4 text-xs text-green-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Live Availability Switch Card */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`flex h-3 w-3 rounded-full ${
                  isAvailable ? "bg-green-500 animate-pulse" : "bg-slate-400"
                }`}
              />
              <h2 className="text-lg font-bold text-foreground">
                STATUS: {isAvailable ? "AVAILABLE TO RESPOND" : "OFFLINE / UNAVAILABLE"}
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted max-w-xl leading-relaxed">
              {isAvailable
                ? "Your status is active. When a woman triggers an SOS within approximately 1 kilometre of your position, you will receive an emergency dispatch alert."
                : "You are currently offline. SafeLink never tracks your coordinates while you are marked unavailable."}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleToggleAvailability}
              disabled={toggleLoading}
              className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-sm transition-all ${
                isAvailable
                  ? "bg-slate-800 hover:bg-slate-900"
                  : "bg-brand-teal hover:bg-teal-800"
              }`}
            >
              {toggleLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : isAvailable ? (
                "Go Offline"
              ) : (
                "Go Available"
              )}
            </button>
          </div>
        </div>

        {/* Stats & Guidelines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Volunteer Vetting Card */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
            <h3 className="text-base font-bold text-foreground border-b border-border pb-3">Vetting & Credentials</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-muted">Account Status:</span>
                <span className="rounded bg-teal-100 text-brand-teal px-2 py-0.5 font-bold uppercase text-[10px]">
                  {user?.status}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-muted">Registered Phone:</span>
                <span className="font-mono">{user?.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-muted">Total Responses:</span>
                <span className="font-bold text-foreground">{volProfile?.total_incidents_responded || 0} Incidents</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/download"
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-slate-100 hover:bg-slate-200 py-2.5 text-xs font-semibold text-slate-800 transition-colors"
              >
                <Smartphone className="h-4 w-4" />
                Get Volunteer Responder App
              </Link>
            </div>
          </div>

          {/* Critical Safety Guidelines */}
          <div className="md:col-span-2 rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              <h3 className="text-base font-bold text-foreground">Volunteer Safety Guidelines</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700 leading-relaxed">
              <div className="rounded-xl bg-amber-50/50 border border-amber-200/60 p-4">
                <p className="font-bold text-amber-900 mb-1">1. Auxiliary Support, Not Police</p>
                <p className="text-slate-600">
                  Volunteers provide community presence, first aid, and human support. Never assume you are a replacement for police or medical services.
                </p>
              </div>

              <div className="rounded-xl bg-amber-50/50 border border-amber-200/60 p-4">
                <p className="font-bold text-amber-900 mb-1">2. Never Confront Danger Alone</p>
                <p className="text-slate-600">
                  Do not confront armed or violent attackers. Observe from a safe distance, call 112, and coordinate with approaching authorities.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="font-bold text-slate-900 mb-1">3. Privacy & Need-To-Know Access</p>
                <p className="text-slate-600">
                  Distressed individuals&apos; exact coordinates are provided strictly after you accept an active incident and are immediately revoked upon incident cancellation.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="font-bold text-slate-900 mb-1">4. Emergency Number 112</p>
                <p className="text-slate-600">
                  Whenever life safety is endangered, notify official emergency services immediately via 112.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
