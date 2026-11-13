"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
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
  ExternalLink
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
          message: "Unable to locate this emergency alert. It may have expired or been removed.",
          active_responders_count: 0
        });
      }
    } catch {
      // Offline or network error fallback
      setData((prev) => prev || {
        active: false,
        message: "Connection failed. Please check your network.",
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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-semibold">Connecting to SafeLink Emergency Feed...</h2>
        <p className="text-slate-400 text-sm mt-1">Establishing secure, encrypted connection</p>
      </div>
    );
  }

  // INACTIVE / CANCELLED STATE
  if (!data || !data.active) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl">
          <div className="w-16 h-16 bg-slate-800 border border-slate-700 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Emergency Alert Inactive</h1>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            {data?.message || "This emergency tracking link has ended or was marked safe by the user. Live tracking is no longer active."}
          </p>

          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-left text-xs text-slate-400 mb-6 space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <ShieldAlert className="w-4 h-4 text-teal-400" />
              <span>SafeLink Privacy Enforcement</span>
            </div>
            <p>
              When an alert concludes, live GPS streaming and tracking links are permanently revoked to protect member privacy.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <p className="text-xs text-slate-400 mb-3">If you still believe someone is in immediate danger:</p>
            <a
              href="tel:112"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition shadow-lg shadow-red-900/30 text-sm"
            >
              <PhoneCall className="w-4 h-4" />
              Call National Emergency 112
            </a>
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Critical Alert Bar */}
      <div className="bg-red-600 text-white px-4 py-3 shadow-lg flex items-center justify-between sticky top-0 z-50 animate-pulse">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 shrink-0" />
          <div>
            <h1 className="font-bold text-sm sm:text-base tracking-wide uppercase">
              Emergency Active — Live Tracking
            </h1>
            <p className="text-xs text-red-100 opacity-90 hidden sm:block">
              {data.woman_name_initial || "SafeLink Member"} triggered rapid assistance
            </p>
          </div>
        </div>
        <a
          href="tel:112"
          className="bg-white text-red-700 font-bold px-3 py-1.5 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 shadow hover:bg-red-50 transition"
        >
          <PhoneCall className="w-4 h-4" />
          <span>CALL 112</span>
        </a>
      </div>

      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Live Map Card */}
        <div className="lg:col-span-2 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="font-semibold text-sm text-slate-200">Continuous GPS Stream</span>
              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                ±{accuracy}m accuracy
              </span>
            </div>

            <button
              onClick={fetchTracking}
              disabled={isRefreshing}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-teal-400" : ""}`} />
              <span className="hidden sm:inline">Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </button>
          </div>

          {/* Map View */}
          <div className="relative flex-1 min-h-[360px] bg-slate-950 flex items-center justify-center overflow-hidden">
            <iframe
              title="Emergency Live Location"
              src={mapUrl}
              className="w-full h-full min-h-[380px] border-0 filter contrast-125"
              loading="eager"
            />
            {/* Visual Center Pin Overlay */}
            <div className="absolute top-4 left-4 bg-slate-950/85 backdrop-blur border border-slate-800 rounded-xl p-3 text-xs shadow-lg flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500 shrink-0" />
              <div>
                <div className="font-medium text-slate-200">
                  {lat.toFixed(5)}, {lon.toFixed(5)}
                </div>
                <div className="text-slate-400 text-[10px]">Fix recorded via Mobile GPS</div>
              </div>
            </div>
          </div>

          {/* Navigation Action Footer */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap gap-3 items-center justify-between">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Location auto-refreshes every 4 seconds</span>
            </div>
            <a
              href={gmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Navigate in Google Maps</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-75" />
            </a>
          </div>
        </div>

        {/* Status & Responders Side Panel */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Person in Distress Info Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Member Under Protection
              </h2>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-950/80 border border-red-800/80 text-red-400 font-bold text-lg rounded-xl flex items-center justify-center">
                  {data.woman_name_initial?.[0] || "S"}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {data.woman_name_initial || "SafeLink Member"}
                  </h3>
                  <span className="inline-block px-2 py-0.5 mt-1 bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-medium rounded-md">
                    Emergency Alert Active
                  </span>
                </div>
              </div>
            </div>

            {/* Nearby Responders Coordination Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                <span>Verified Volunteer Network</span>
                <Users className="w-4 h-4 text-teal-400" />
              </h2>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-3">
                <div className="text-2xl font-black text-white">
                  {data.active_responders_count}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {data.active_responders_count === 1
                    ? "Verified volunteer accepted & coordinating"
                    : `${data.active_responders_count} verified volunteers coordinated nearby`}
                </div>
              </div>

              <div className="text-xs text-slate-400 space-y-1.5 leading-relaxed">
                <p>
                  • Nearby verified volunteers within 1 km receive privacy-preserving alerts.
                </p>
                <p>
                  • Up to 3 verified responders can accept and navigate to provide quick support.
                </p>
              </div>
            </div>

            {/* Safety Helpline Reminder */}
            <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-4 text-amber-200 text-xs flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Volunteers are an auxiliary layer of human presence. For armed or critical emergencies, always contact official police (112) immediately.
              </p>
            </div>
          </div>

          {/* Big Call Button */}
          <div className="pt-2">
            <a
              href="tel:112"
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition shadow-lg shadow-red-950 text-sm tracking-wide"
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
