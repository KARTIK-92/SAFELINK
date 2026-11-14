"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, AlertCircle, CheckCircle2, UserPlus, Trash2,
  Edit2, Phone, Mail, Lock, Smartphone, LogOut,
  Download, QrCode, ShieldAlert, Sparkles, RefreshCw, X, Radio,
  BellRing, Shield, MapPin, Send, HelpCircle, HeartHandshake
} from "lucide-react";
import { apiRequest } from "@/lib/api";

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  preferred_channels: string[];
  priority_order: number;
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

export default function WomenDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState<boolean>(false);
  const [testAlertSent, setTestAlertSent] = useState<boolean>(false);

  // New Contact Form
  const [contactName, setContactName] = useState("");
  const [contactRelationship, setContactRelationship] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [preferredChannels, setPreferredChannels] = useState<string[]>(["sms", "whatsapp"]);

  // Deletion Form
  const [deletePassword, setDeletePassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const userData = await apiRequest<UserProfile>("/users/me");
      if (userData.role !== "woman") {
        router.push(`/dashboard/${userData.role}`);
        return;
      }
      setUser(userData);

      const contactsData = await apiRequest<EmergencyContact[]>("/contacts");
      setContacts(contactsData);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data. Please log in again.");
      if (err.message?.includes("401") || err.message?.includes("credentials")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactRelationship.trim() || !contactPhone.trim()) {
      setError("Please fill in contact name, relationship, and phone.");
      return;
    }
    if (preferredChannels.length === 0) {
      setError("Please select at least one notification channel.");
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await apiRequest("/contacts", {
        method: "POST",
        body: JSON.stringify({
          name: contactName.trim(),
          relationship: contactRelationship.trim(),
          phone: contactPhone.trim(),
          email: contactEmail.trim() || undefined,
          preferred_channels: preferredChannels,
        }),
      });

      setShowAddModal(false);
      setContactName("");
      setContactRelationship("");
      setContactPhone("");
      setContactEmail("");
      setSuccessMsg("Emergency contact added successfully! Onboarding notice dispatched.");
      await loadDashboardData();
    } catch (err: any) {
      setError(err.message || "Failed to add emergency contact.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm("Are you sure you want to remove this emergency contact?")) return;
    try {
      await apiRequest(`/contacts/${contactId}`, { method: "DELETE" });
      setSuccessMsg("Emergency contact removed successfully.");
      await loadDashboardData();
    } catch (err: any) {
      setError(err.message || "Failed to delete contact.");
    }
  };

  const handleTestAlert = () => {
    setTestAlertSent(true);
    setTimeout(() => {
      setTestAlertSent(false);
    }, 4000);
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmDelete || !deletePassword) {
      setError("Please provide password and check the confirmation box.");
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      await apiRequest("/users/me", {
        method: "DELETE",
        body: JSON.stringify({
          password: deletePassword,
          confirmation: true,
          reason: "User requested permanent deletion from dashboard under DPDP Act.",
        }),
      });
      localStorage.clear();
      alert("Your account has been deactivated and scheduled for deletion.");
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Account deletion failed. Verify password.");
      setActionLoading(false);
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

  const toggleChannel = (channel: string) => {
    if (preferredChannels.includes(channel)) {
      setPreferredChannels(preferredChannels.filter((c) => c !== channel));
    } else {
      setPreferredChannels([...preferredChannels, channel]);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070B14]">
        <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
          <RefreshCw className="h-5 w-5 animate-spin text-rose-500" />
          Loading SafeLink Distress Defense Console...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col selection:bg-rose-500/30">
      {/* Top Navbar */}
      <header className="border-b border-white/5 bg-[#090D1A]/90 sticky top-0 z-40 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-lg shadow-rose-900/30 group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white font-heading">SafeLink</span>
              <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-bold text-rose-300 border border-rose-500/30">
                Women&apos;s Safety Console
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-white">
                {user?.profile?.full_legal_name || "Verified Member"}
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

      {/* Main Dashboard Content */}
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

        {/* Protection Status Hero Card */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0D1322] via-[#111A2E] to-[#0D1322] p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
                  Distress Defense Active & Armed
                </h2>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                  {user?.status?.toUpperCase()}
                </span>
                <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[11px] font-mono text-slate-400">
                  0 KB Idle Telemetry
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Your emergency network is configured. One tap on your paired mobile app instantly streams your live GPS location to your 3 registered family members and alerts verified volunteers within 1,000 meters.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleTestAlert}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-bold text-slate-200 transition-all shadow-md"
              >
                <Radio className={`h-4 w-4 ${testAlertSent ? "text-emerald-400 animate-pulse" : "text-rose-400"}`} />
                {testAlertSent ? "Signal Dispatched (Simulated)" : "Test SOS Link"}
              </button>

              <Link
                href="/download"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-xl shadow-rose-900/40 hover:from-rose-600 hover:to-rose-700 transition-all"
              >
                <Smartphone className="h-4 w-4" />
                Download Android APK
              </Link>
            </div>
          </div>
        </div>

        {/* Emergency Contacts Management Section */}
        <div className="rounded-3xl border border-white/10 bg-[#0D1322]/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-5 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-rose-400" />
                <h3 className="text-lg font-bold text-white font-heading">Designated Emergency Contacts</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Up to three trusted contacts dispatched with encrypted real-time tracking links whenever distress is triggered.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-mono">
                {contacts.length} / 3 Contacts Registered
              </span>
              <button
                type="button"
                onClick={() => {
                  if (contacts.length >= 3) {
                    setError("Maximum limit of 3 emergency contacts reached.");
                    return;
                  }
                  setShowAddModal(true);
                  setError(null);
                }}
                disabled={contacts.length >= 3}
                className="flex items-center gap-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-rose-900/30 transition-all"
              >
                <UserPlus className="h-4 w-4" />
                Add Contact
              </button>
            </div>
          </div>

          {contacts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
              <ShieldAlert className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-base font-bold text-white font-heading">No Emergency Contacts Registered</p>
              <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
                Add up to 3 trusted family members or friends. During an emergency, they will instantly receive live location coordinates via SMS, WhatsApp, and Email.
              </p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="mt-5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-2.5 text-xs font-bold text-white shadow-xl shadow-rose-900/30 hover:from-rose-600 hover:to-rose-700 transition-all"
              >
                Add Primary Emergency Contact
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {contacts.map((contact, idx) => (
                <div
                  key={contact.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex flex-col justify-between hover:bg-white/[0.04] transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        Priority {idx + 1}
                      </span>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title="Remove contact"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <h4 className="text-base font-bold text-white">{contact.name}</h4>
                    <p className="text-xs font-medium text-slate-400">{contact.relationship}</p>

                    <div className="mt-4 space-y-2 text-xs text-slate-300">
                      <div className="flex items-center gap-2 font-mono">
                        <Phone className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                        <span>{contact.phone}</span>
                      </div>
                      {contact.email && (
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/5 flex flex-wrap gap-1.5">
                    {contact.preferred_channels.map((ch) => (
                      <span
                        key={ch}
                        className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security & Data Protection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Security */}
          <div className="rounded-3xl border border-white/10 bg-[#0D1322]/90 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Lock className="h-4 w-4 text-rose-400" />
              <h3 className="text-base font-bold text-white font-heading">Cryptographic Vault & Security</h3>
            </div>
            
            <div className="text-xs space-y-3">
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-slate-400">Registered Phone:</span>
                <span className="font-mono text-white font-bold">{user?.phone}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-slate-400">Registered Email:</span>
                <span className="text-white font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-slate-400">Credential Hashing:</span>
                <span className="text-emerald-400 font-mono font-bold">Argon2id (m=65536, t=3, p=4)</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-slate-400">Telemetry Tracking:</span>
                <span className="text-emerald-400 font-medium">Zero-Storage (Burns on termination)</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/forgot-password"
                className="inline-block rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors"
              >
                Change Master Password
              </Link>
            </div>
          </div>

          {/* Account Deletion */}
          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/[0.03] p-6 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-rose-500/20 pb-3">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              <h3 className="text-base font-bold text-rose-300 font-heading">Account Erasure (DPDP Act 2023)</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Under India&apos;s Digital Personal Data Protection Act, you possess the statutory Right to Erasure. Permanent deletion purges your profile, contact registry, and biometric tokens immediately.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteAccountModal(true)}
              className="rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2 text-xs font-bold text-rose-300 transition-colors"
            >
              Request Permanent Account Erasure
            </button>
          </div>
        </div>
      </main>

      {/* --- ADD CONTACT MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0D1322] p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-rose-400" />
                <h3 className="text-lg font-bold text-white font-heading">Add Emergency Contact</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Anjali Sharma"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">Relationship *</label>
                <input
                  type="text"
                  value={contactRelationship}
                  onChange={(e) => setContactRelationship(e.target.value)}
                  placeholder="e.g. Mother, Sister, Spouse, Friend"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">Mobile Phone (with country code) *</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">Email Address (Optional)</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="anjali@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-300 mb-2">Notification Channels *</label>
                <div className="flex gap-4">
                  {["sms", "whatsapp", "email"].map((ch) => (
                    <label key={ch} className="flex items-center gap-2 cursor-pointer uppercase font-bold text-slate-300">
                      <input
                        type="checkbox"
                        checked={preferredChannels.includes(ch)}
                        onChange={() => toggleChannel(ch)}
                        className="rounded border-white/20 bg-white/10 text-rose-500 focus:ring-rose-500"
                      />
                      <span>{ch}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-semibold text-slate-300 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-5 py-2.5 font-bold text-white shadow-xl shadow-rose-900/30 hover:from-rose-600 hover:to-rose-700 disabled:opacity-50"
                >
                  {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Save & Notify Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE ACCOUNT MODAL --- */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-[#0D1322] p-6 sm:p-7 shadow-2xl">
            <h3 className="text-lg font-bold text-rose-400 mb-2 font-heading">Confirm Permanent Erasure</h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Please enter your password to confirm permanent deletion of your SafeLink account. All personal data, emergency contacts, and logs will be eradicated immediately.
            </p>

            <form onSubmit={handleDeleteAccount} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">Master Password *</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-rose-500/30 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={confirmDelete}
                  onChange={(e) => setConfirmDelete(e.target.checked)}
                  className="mt-0.5 rounded border-rose-500/30 bg-white/10 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-rose-300 font-medium">
                  I understand that my emergency protection will terminate immediately and this cannot be undone.
                </span>
              </label>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowDeleteAccountModal(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-semibold text-slate-300 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !confirmDelete || !deletePassword}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2.5 font-bold text-white shadow-xl shadow-rose-950 disabled:opacity-50"
                >
                  {actionLoading ? "Deleting..." : "Permanently Delete Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
