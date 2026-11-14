"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  PhoneCall,
  Navigation,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Radio,
  Lock
} from "lucide-react";

interface TrackingData {
  active: boolean;
  incident_id?: string;
  woman_name_initial?: string;
  last_latitude?: number;
  last_longitude?: number;
  accuracy_meters?: number;
  updated_at?: string;
  message?: string;
  active_responders_count: number;
}

export default function EphemeralTrackingPage() {
  const params = useParams();
  const token = params?.token as string;

  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const rawApi = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
  const apiBase = rawApi.endsWith("/api/v1") ? rawApi : `${rawApi}/api/v1`;

  const fetchTracking = useCallback(async () => {
    if (!token) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(`${apiBase}/tracking/${token}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache"
        }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData({
          active: false,
          message: "This emergency tracking link has concluded or was marked safe by the member.",
          active_responders_count: 0
        });
      }
    } catch {
      setData((prev) => prev || {
        active: false,
        message: "Connection failed. Please check network connectivity.",
        active_responders_count: 0
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setLastRefreshed(new Date());
    }
  }, [apiBase, token]);

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 4000);
    return () => clearInterval(interval);
  }, [fetchTracking]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="h-12 w-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-500 flex items-center justify-center animate-pulse mb-4">
          <Radio className="h-6 w-6 animate-spin" />
        </div>
        <h2 className="text-xl font-bold font-heading text-white">Connecting to SafeLink Emergency Feed...</h2>
        <p className="text-slate-400 text-xs mt-1.5 font-mono">Establishing end-to-end encrypted telemetry channel</p>
      </div>
    );
  }

  // INACTIVE / TERMINATED STATE
  if (!data || !data.active) {
    return (
      <div className="min-h-screen bg-[#070B14] text-slate-100 flex items-center justify-center p-4 selection:bg-rose-500/30">
        <div className="max-w-md w-full bg-[#0D1322]/90 border border-white/10 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-950/50">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white font-heading mb-2">Emergency Alert Inactive</h1>
          <p className="text-slate-300 text-xs sm:text-sm mb-6 leading-relaxed">
            {data?.message || "This distress event has concluded or was marked resolved by the member. Ephemeral live tracking has ceased."}
          </p>

          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-left text-xs text-slate-400 mb-6 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>DPDP Cryptographic Auto-Purge</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              In accordance with DPDP Act 2023, temporary GPS coordinates and session access tokens are instantly purged upon incident closure. No idle tracking remains.
            </p>
          </div>

          <div className="pt-2 border-t border-white/5 space-y-3">
            <p className="text-xs text-slate-400">If you still suspect immediate physical danger:</p>
            <a
              href="tel:112"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold rounded-xl transition shadow-xl shadow-rose-900/40 text-sm font-heading"
            >
              <PhoneCall className="w-4 h-4" />
              Dial National Emergency 112
            </a>
            <Link
              href="/"
              className="inline-block text-xs text-slate-400 hover:text-white pt-2 transition-colors"
            >
              Return to SafeLink Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE SOS TRACKING
  const lat = data.last_latitude ?? 0;
  const lon = data.last_longitude ?? 0;
  const accuracy = Math.round(data.accuracy_meters ?? 10);
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.005}%2C${lat - 0.005}%2C${lon + 0.005}%2C${lat + 0.005}&layer=mapnik&marker=${lat}%2C${lon}`;
  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col selection:bg-rose-500/30">
      {/* Top Critical Alert Bar */}
      <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-rose-600 text-white px-4 py-3 shadow-2xl flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white animate-pulse">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-sm sm:text-base tracking-wide uppercase font-heading flex items-center gap-2">
              <span>Emergency Active • Live GPS Feed</span>
              <span className="flex h-2 w-2 rounded-full bg-white animate-ping" />
            </h1>
            <p className="text-[11px] text-rose-100 hidden sm:block">
              {data.woman_name_initial || "SafeLink Member"} triggered SOS protection. Real-time satellite coordinates streaming.
            </p>
          </div>
        </div>

        <a
          href="tel:112"
          className="bg-white text-rose-700 hover:bg-rose-50 font-black px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-xl transition-all font-heading"
        >
          <PhoneCall className="w-4 h-4 text-rose-600" />
          <span>DIAL 112</span>
        </a>
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Live Map Card */}
        <div className="lg:col-span-2 flex flex-col bg-[#0D1322]/90 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="p-4 sm:p-5 bg-[#090D1A] border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="font-bold text-sm text-white font-heading">Continuous Satellite Telemetry</span>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                ±{accuracy}m precision
              </span>
            </div>

            <button
              onClick={fetchTracking}
              disabled={isRefreshing}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-rose-400" : ""}`} />
              <span className="hidden sm:inline font-mono text-[11px]">
                Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </button>
          </div>

          {/* Map View */}
          <div className="relative flex-1 min-h-[380px] sm:min-h-[440px] bg-[#070B14] flex items-center justify-center overflow-hidden">
            <iframe
              title="Emergency Live Location Map"
              src={mapUrl}
              className="w-full h-full min-h-[420px] border-0 filter contrast-125 brightness-95"
              loading="eager"
            />
            {/* Visual Center Pin Overlay */}
            <div className="absolute top-4 left-4 bg-[#090D1A]/90 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 text-xs shadow-xl flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="font-mono font-bold text-white">
                  {lat.toFixed(5)}° N, {lon.toFixed(5)}° E
                </div>
                <div className="text-slate-400 text-[10px]">Live GPS Fix Streamed via Device</div>
              </div>
            </div>
          </div>

          {/* Navigation Action Footer */}
          <div className="p-4 sm:p-5 bg-[#090D1A] border-t border-white/5 flex flex-wrap gap-3 items-center justify-between">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Location telemetry automatically polls every 4 seconds</span>
            </div>
            <a
              href={gmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl transition shadow-lg shadow-teal-900/40"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-75" />
            </a>
          </div>
        </div>

        {/* Status & Responders Side Panel */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Person in Distress Info Card */}
            <div className="bg-[#0D1322]/90 border border-white/10 rounded-3xl p-5 shadow-xl backdrop-blur-xl">
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                Protected Member Details
              </h2>
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-rose-500/15 border border-rose-500/30 text-rose-300 font-extrabold text-xl rounded-2xl flex items-center justify-center">
                  {data.woman_name_initial?.[0] || "M"}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white font-heading">
                    {data.woman_name_initial || "SafeLink Member"}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 mt-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />
                    Distress Active
                  </span>
                </div>
              </div>
            </div>

            {/* Nearby Responders Coordination Card */}
            <div className="bg-[#0D1322]/90 border border-white/10 rounded-3xl p-5 shadow-xl backdrop-blur-xl">
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                <span>Verified Volunteer Coordination</span>
                <Users className="w-4 h-4 text-teal-400" />
              </h2>

              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-3">
                <div className="text-3xl font-black text-white font-heading">
                  {data.active_responders_count}
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  {data.active_responders_count === 1
                    ? "1 verified volunteer accepted & en route"
                    : `${data.active_responders_count} verified volunteers dispatched within 1,000m`}
                </div>
              </div>

              <div className="text-xs text-slate-400 space-y-1.5 leading-relaxed">
                <p>• Verified community members within 1 km receive high-priority alerts.</p>
                <p>• Up to 3 responders can accept and navigate to provide immediate presence.</p>
              </div>
            </div>

            {/* Official Helpline Advisory */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-4 text-amber-200 text-xs flex gap-3 backdrop-blur-xl">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Volunteers provide auxiliary community presence. For critical danger or physical threat, dial police immediately at 112.
              </p>
            </div>
          </div>

          {/* Call 112 Button */}
          <div className="pt-2">
            <a
              href="tel:112"
              className="w-full inline-flex items-center justify-center gap-2.5 py-4 px-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-extrabold rounded-2xl transition shadow-xl shadow-rose-950 text-sm tracking-wide font-heading"
            >
              <PhoneCall className="w-5 h-5" />
              CALL POLICE / HELPLINE 112
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
