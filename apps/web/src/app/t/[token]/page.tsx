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
  ExternalLink,
  ShieldCheck
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
          "Cache-Control": "no-cache",
        },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData({
          active: false,
          message: "Unable to locate this emergency alert. It may have expired or been resolved.",
          active_responders_count: 0,
        });
      }
    } catch {
      setData((prev) => prev || {
        active: false,
        message: "Connection failed. Please verify your mobile connection.",
        active_responders_count: 0,
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
      <div className="min-h-screen bg-surface-950 text-surface-100 flex flex-col items-center justify-center p-6 antialiased">
        <div className="flex items-center gap-3 text-xs font-mono tracking-wider text-surface-400">
          <RefreshCw className="h-4 w-4 animate-spin text-rose-500" />
          ESTABLISHING ENCRYPTED TELEMETRY STREAM...
        </div>
      </div>
    );
  }

  // INACTIVE / RESOLVED STATE
  if (!data || !data.active) {
    return (
      <div className="min-h-screen bg-surface-50 text-surface-900 flex items-center justify-center p-6 antialiased">
        <div className="max-w-md w-full bg-white border border-surface-200 rounded-2xl p-8 text-center shadow-xs space-y-6">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h1 className="text-lg font-semibold tracking-tight text-surface-950">Emergency Incident Concluded</h1>
            <p className="text-xs text-surface-500 leading-relaxed">
              {data?.message || "This emergency broadcast has concluded or was marked safe by the individual. Live telemetry streaming has been deactivated."}
            </p>
          </div>

          <div className="bg-surface-50 border border-surface-200 rounded-xl p-4 text-left text-xs text-surface-600 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-surface-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>DPDP Ephemeral Privacy Enforcement</span>
            </div>
            <p className="text-surface-500 leading-relaxed">
              Under India&apos;s DPDP Act 2023, live GPS telemetry and token access are permanently revoked upon incident resolution to protect victim confidentiality.
            </p>
          </div>

          <div className="pt-2 border-t border-surface-100">
            <p className="text-[11px] text-surface-500 mb-3">If you still suspect immediate imminent danger:</p>
            <a
              href="tel:112"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs shadow-xs active:scale-[0.98] transition"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Dial National Emergency 112
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
    <div className="min-h-screen bg-surface-950 text-surface-100 flex flex-col antialiased selection:bg-rose-900">
      {/* Top Critical Alert Bar */}
      <div className="border-b border-rose-900/60 bg-rose-950/80 backdrop-blur px-6 py-3 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-rose-300">
                Live Distress Broadcast Active
              </span>
              <span className="rounded bg-rose-900/60 border border-rose-700/50 px-1.5 py-0.2 text-[10px] font-mono text-rose-200">
                TOKEN AUTHENTICATED
              </span>
            </div>
            <p className="text-xs text-rose-200/70 hidden sm:block">
              {data.woman_name_initial || "SafeLink Member"} &bull; Real-time GPS stream
            </p>
          </div>
        </div>
        <a
          href="tel:112"
          className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 active:scale-[0.98] transition shadow-xs"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Call 112</span>
        </a>
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Live Map Card */}
        <div className="lg:col-span-2 flex flex-col bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 bg-surface-900/90 border-b border-surface-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="font-semibold text-xs text-surface-200">Continuous GPS Stream</span>
              <span className="text-[11px] font-mono text-surface-400 bg-surface-800 px-2 py-0.5 rounded border border-surface-700">
                &plusmn;{accuracy}m accuracy
              </span>
            </div>

            <button
              onClick={fetchTracking}
              disabled={isRefreshing}
              className="text-[11px] font-mono text-surface-400 hover:text-white flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin text-surface-200" : ""}`} />
              <span className="hidden sm:inline">
                {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </button>
          </div>

          {/* Map View */}
          <div className="relative flex-1 min-h-[380px] bg-surface-950 flex items-center justify-center overflow-hidden">
            <iframe
              title="Emergency Live Location"
              src={mapUrl}
              className="w-full h-full min-h-[400px] border-0 filter invert contrast-125 brightness-90"
              loading="eager"
            />
            {/* Coordinate Pill Overlay */}
            <div className="absolute top-4 left-4 bg-surface-950/90 backdrop-blur border border-surface-800 rounded-lg px-3 py-2 text-xs shadow-lg flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <div>
                <div className="font-mono font-medium text-surface-200 text-xs">
                  {lat.toFixed(5)}, {lon.toFixed(5)}
                </div>
                <div className="text-surface-500 text-[10px] font-mono">Mobile GPS Fix Recorded</div>
              </div>
            </div>
          </div>

          {/* Navigation Action Footer */}
          <div className="p-4 bg-surface-900 border-t border-surface-800 flex flex-wrap gap-3 items-center justify-between">
            <div className="text-xs text-surface-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-surface-500" />
              <span>Telemetry refreshes automatically every 4 seconds</span>
            </div>
            <a
              href={gmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 bg-surface-100 hover:bg-white text-surface-950 rounded-lg active:scale-[0.98] transition"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Turn-by-Turn Navigation</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>
        </div>

        {/* Status & Responders Side Panel */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Person in Distress Info Card */}
            <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5 shadow-xs">
              <h2 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-surface-400 mb-3">
                Member Under Protection
              </h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-950/80 border border-rose-800/80 text-rose-400 font-bold text-sm rounded-lg flex items-center justify-center">
                  {data.woman_name_initial?.[0] || "S"}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-surface-100">
                    {data.woman_name_initial || "SafeLink Member"}
                  </h3>
                  <span className="inline-block px-2 py-0.5 mt-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-mono rounded">
                    DISTRESS ACTIVE
                  </span>
                </div>
              </div>
            </div>

            {/* Nearby Responders Coordination Card */}
            <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-surface-800 pb-2">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-surface-400">
                  Volunteer Responder Network
                </span>
                <Users className="w-3.5 h-3.5 text-surface-400" />
              </div>

              <div className="bg-surface-950 border border-surface-800/80 rounded-xl p-4">
                <div className="text-3xl font-semibold tracking-tight text-white font-mono">
                  {data.active_responders_count}
                </div>
                <div className="text-xs text-surface-400 mt-1">
                  {data.active_responders_count === 1
                    ? "Verified community volunteer responding"
                    : `${data.active_responders_count} community responders in 1 km radius`}
                </div>
              </div>

              <div className="text-xs text-surface-400 space-y-1.5 leading-relaxed">
                <p>
                  &bull; Verified volunteers nearby receive zero-lock-screen alert telemetry.
                </p>
                <p>
                  &bull; Up to 3 verified responders can accept navigation to provide physical presence.
                </p>
              </div>
            </div>

            {/* Safety Protocol Note */}
            <div className="bg-surface-900 border border-surface-800 rounded-2xl p-4 text-surface-300 text-xs flex gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-surface-400">
                Volunteers provide rapid community deterrence. In cases of violent crime or immediate danger, always alert Emergency 112 directly.
              </p>
            </div>
          </div>

          {/* Emergency 112 Direct Button */}
          <div className="pt-2">
            <a
              href="tel:112"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs tracking-wide active:scale-[0.98] transition shadow-lg shadow-rose-950"
            >
              <PhoneCall className="w-4 h-4" />
              CALL POLICE / 112 ON BEHALF OF VICTIM
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
