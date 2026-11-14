"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, AlertCircle, CheckCircle2, UserPlus, Trash2,
  Edit2, Phone, Mail, Lock, Smartphone, LogOut,
  Download, QrCode, ShieldAlert, Sparkles, RefreshCw, X, Radio
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
      setSuccessMsg("Contact removed.");
      await loadDashboardData();
    } catch (err: any) {
      setError(err.message || "Failed to delete contact.");
    }
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
          reason: "User requested permanent deletion from dashboard.",
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted text-sm font-medium">
          <RefreshCw className="h-5 w-5 animate-spin text-brand-teal" />
          Loading SafeLink Protection Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-border bg-white sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navyDark text-white">
              <ShieldCheck className="h-5 w-5 text-brand-tealLight" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">SafeLink</span>
            <span className="hidden sm:inline rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-brand-teal border border-teal-200 ml-2">
              Women&apos;s Portal
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-xs text-muted hidden sm:inline">
              Welcome, <strong>{user?.profile?.full_legal_name || user?.email}</strong>
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

      {/* Main Dashboard Content */}
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

        {/* Protection Status Card */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-green-500" />
              <h2 className="text-lg font-bold text-foreground">Distress Protection Ready</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                {user?.status?.toUpperCase()}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-muted max-w-xl leading-relaxed">
              In an emergency, one tap on the mobile app instantly broadcasts encrypted live tracking links to your registered emergency contacts and dispatches verified community volunteers within 1 km.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/download"
              className="flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 shadow-sm transition-colors"
            >
              <Smartphone className="h-4 w-4" />
              Get Women&apos;s Mobile App
            </Link>
          </div>
        </div>

        {/* Emergency Contacts Management Section */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-foreground">Registered Emergency Contacts</h3>
              <p className="text-xs text-muted mt-0.5">
                Up to three trusted contacts notified with secure live-tracking links during SOS.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
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
                className="flex items-center gap-1.5 rounded-lg bg-brand-teal px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Add Contact
              </button>
            </div>
          </div>

          {contacts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
              <ShieldAlert className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No Emergency Contacts Registered</p>
              <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                Add up to 3 family members or friends. During an emergency, they receive immediate location updates via SMS, WhatsApp, and Email.
              </p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="mt-4 rounded-lg bg-brand-teal px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-800"
              >
                Add Primary Contact
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {contacts.map((contact, idx) => (
                <div
                  key={contact.id}
                  className="rounded-xl border border-border bg-slate-50/50 p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="rounded bg-teal-100 text-brand-teal px-2 py-0.5 text-[10px] font-bold uppercase">
                        Priority {idx + 1}
                      </span>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors"
                        title="Remove contact"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">{contact.name}</h4>
                    <p className="text-xs font-medium text-slate-600">{contact.relationship}</p>
                    <div className="mt-3 space-y-1 text-xs text-muted">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{contact.phone}</span>
                      </div>
                      {contact.email && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap gap-1.5">
                    {contact.preferred_channels.map((ch) => (
                      <span
                        key={ch}
                        className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase"
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

        {/* Account Settings & Deletion Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Account Settings */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
            <h3 className="text-base font-bold text-foreground border-b border-border pb-3">Account Security</h3>
            <div className="text-xs space-y-3 text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-muted">Registered Phone:</span>
                <span className="font-mono font-medium">{user?.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-muted">Registered Email:</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-muted">Password Security:</span>
                <span className="font-medium">Argon2id Encrypted</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <Link
                href="/forgot-password"
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Change Password
              </Link>
            </div>
          </div>

          {/* Account Deletion */}
          <div className="rounded-2xl border border-red-200 bg-red-50/30 p-6 shadow-card space-y-4">
            <h3 className="text-base font-bold text-red-900 border-b border-red-200 pb-3">Account Deletion (DPDP Act)</h3>
            <p className="text-xs text-red-800 leading-relaxed">
              Permanent erasure removes all personal details, registered emergency contacts, stored identity records, and active tracking tokens under India&apos;s DPDP Act.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteAccountModal(true)}
              className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 shadow-sm"
            >
              Initiate Permanent Deletion
            </button>
          </div>
        </div>
      </main>

      {/* --- ADD CONTACT MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-base font-bold text-foreground">Add Emergency Contact</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Geeta Verma"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Relationship *</label>
                <input
                  type="text"
                  value={contactRelationship}
                  onChange={(e) => setContactRelationship(e.target.value)}
                  placeholder="e.g. Mother, Sister, Friend, Spouse"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Phone (with country code) *</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm font-mono focus:border-brand-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="geeta@example.com"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Notification Channels *</label>
                <div className="flex gap-4">
                  {["sms", "whatsapp", "email"].map((ch) => (
                    <label key={ch} className="flex items-center gap-1.5 cursor-pointer uppercase font-semibold">
                      <input
                        type="checkbox"
                        checked={preferredChannels.includes(ch)}
                        onChange={() => toggleChannel(ch)}
                        className="rounded border-border text-brand-teal focus:ring-brand-teal"
                      />
                      <span>{ch}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-border px-4 py-2 font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-teal px-5 py-2 font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-red-900 mb-2">Confirm Account Deletion</h3>
            <p className="text-xs text-red-800 mb-4">
              Please enter your password to confirm permanent erasure of your SafeLink account. This action cannot be reversed.
            </p>

            <form onSubmit={handleDeleteAccount} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                />
              </div>

              <label className="flex items-start gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={confirmDelete}
                  onChange={(e) => setConfirmDelete(e.target.checked)}
                  className="mt-0.5 rounded border-red-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-red-900 font-medium">
                  I understand that my emergency protection will cease immediately and all personal data will be purged.
                </span>
              </label>

              <div className="pt-4 flex justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowDeleteAccountModal(false)}
                  className="rounded-lg border border-border px-4 py-2 font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !confirmDelete || !deletePassword}
                  className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
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
