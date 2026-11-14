"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, AlertCircle, CheckCircle2, UserPlus, Trash2,
  Phone, Mail, Smartphone, LogOut, ShieldAlert, RefreshCw, X,
  ExternalLink, Key, Clock, MapPin, HeartHandshake, Download
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
      const newContact = await apiRequest<EmergencyContact>("/contacts", {
        method: "POST",
        body: JSON.stringify({
          name: contactName.trim(),
          relationship: contactRelationship.trim(),
          phone: contactPhone.trim(),
          email: contactEmail.trim() || null,
          preferred_channels: preferredChannels,
          priority_order: contacts.length + 1,
        }),
      });

      setContacts([...contacts, newContact]);
      setShowAddModal(false);
      setContactName("");
      setContactRelationship("");
      setContactPhone("");
      setContactEmail("");
      setPreferredChannels(["sms", "whatsapp"]);
      setSuccessMsg(`Emergency contact ${newContact.name} saved successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to save emergency contact.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!window.confirm("Remove this trusted contact from your emergency broadcast list?")) {
      return;
    }
    setError(null);
    try {
      await apiRequest(`/contacts/${contactId}`, {
        method: "DELETE",
      });
      setContacts(contacts.filter((c) => c.id !== contactId));
      setSuccessMsg("Contact removed from emergency broadcast registry.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete emergency contact.");
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmDelete || !deletePassword) {
      setError("Please check the confirmation box and enter your password.");
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      await apiRequest("/users/me/delete", {
        method: "POST",
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
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="flex items-center gap-3 text-surface-600 text-sm font-medium">
          <RefreshCw className="h-4 w-4 animate-spin text-surface-900" />
          Loading SafeLink Command Portal...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col text-surface-900 antialiased selection:bg-surface-200">
      {/* Top Navbar */}
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
              Women&apos;s Safety Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-surface-500 hidden sm:inline">
              Signed in as <strong className="text-surface-900 font-semibold">{user?.profile?.full_legal_name || user?.email}</strong>
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

      {/* Main Dashboard Content */}
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

        {/* Protection Status Banner */}
        <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-surface-500">Protection Status</h2>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                ACTIVE &bull; READY
              </span>
            </div>
            <p className="text-lg font-semibold tracking-tight text-surface-950 pt-1">
              Rapid SOS Dispatch & Encrypted Radar Active
            </p>
            <p className="text-xs text-surface-500 max-w-2xl leading-relaxed">
              When triggered from your mobile device, SafeLink instantly dispatches verified community volunteers within 1 km, dials Emergency 112, and sends tamper-proof live tracking links to your registered emergency contacts.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/download"
              className="inline-flex items-center gap-2 rounded-lg bg-surface-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-surface-800 active:scale-[0.98] transition shadow-xs"
            >
              <Smartphone className="h-4 w-4" />
              Download Mobile App
            </Link>
          </div>
        </div>

        {/* Emergency Contacts Management Section */}
        <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-surface-200 pb-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold tracking-tight text-surface-950">Emergency Contact Broadcast Registry</h3>
                <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[11px] font-medium text-surface-600">
                  {contacts.length} of 3 Registered
                </span>
              </div>
              <p className="text-xs text-surface-500 mt-1">
                These contacts receive an automated SMS, WhatsApp, and live-tracking link the second an SOS is initiated.
              </p>
            </div>
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-surface-950 px-3.5 py-2 text-xs font-semibold text-white hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition shadow-xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add Contact
            </button>
          </div>

          {contacts.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-surface-300 rounded-xl bg-surface-50/50">
              <ShieldAlert className="h-8 w-8 text-surface-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-surface-900">No Emergency Contacts Registered</p>
              <p className="text-xs text-surface-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Add up to 3 trusted family members or friends. During an emergency, they will receive real-time location telemetry with zero lock-screen delays.
              </p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-surface-950 px-4 py-2 text-xs font-semibold text-white hover:bg-surface-800 active:scale-[0.98] transition"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add Primary Contact
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {contacts.map((contact, idx) => (
                <div
                  key={contact.id}
                  className="rounded-xl border border-surface-200 bg-surface-50/40 p-5 flex flex-col justify-between hover:border-surface-300 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-white border border-surface-200 text-surface-700 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
                        Priority #{idx + 1}
                      </span>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="text-surface-400 hover:text-rose-600 transition p-1"
                        title="Remove contact"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-surface-950">{contact.name}</h4>
                      <p className="text-xs text-surface-500">{contact.relationship}</p>
                    </div>

                    <div className="space-y-1.5 text-xs text-surface-600">
                      <div className="flex items-center gap-2 font-mono">
                        <Phone className="h-3.5 w-3.5 text-surface-400 shrink-0" />
                        <span>{contact.phone}</span>
                      </div>
                      {contact.email && (
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="h-3.5 w-3.5 text-surface-400 shrink-0" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-surface-200/80 flex flex-wrap gap-1.5">
                    {contact.preferred_channels.map((ch) => (
                      <span
                        key={ch}
                        className="rounded bg-white border border-surface-200 px-2 py-0.5 text-[10px] font-mono font-medium text-surface-600 uppercase"
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

        {/* Security & DPDP Compliance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Security */}
          <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-xs space-y-4">
            <div className="border-b border-surface-200 pb-3">
              <h3 className="text-sm font-semibold tracking-tight text-surface-950">Account Security & Credentials</h3>
              <p className="text-xs text-surface-500 mt-0.5">Argon2id hashing & ephemeral session control</p>
            </div>

            <div className="text-xs space-y-2.5 text-surface-700 divide-y divide-surface-100">
              <div className="flex justify-between py-1.5">
                <span className="text-surface-500">Registered Phone:</span>
                <span className="font-mono font-medium text-surface-900">{user?.phone}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-surface-500">Registered Email:</span>
                <span className="font-medium text-surface-900">{user?.email}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-surface-500">Cryptographic Standard:</span>
                <span className="font-mono text-[11px] text-surface-700">Argon2id (RFC 9106)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-surface-500">Account Role:</span>
                <span className="font-medium capitalize text-surface-900">{user?.role}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-semibold text-surface-700 hover:bg-surface-50 active:scale-[0.98] transition"
              >
                <Key className="h-3 w-3" />
                Change Password
              </Link>
            </div>
          </div>

          {/* Account Deletion / DPDP Act */}
          <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-xs space-y-4">
            <div className="border-b border-surface-200 pb-3">
              <h3 className="text-sm font-semibold tracking-tight text-rose-950">DPDP Act &bull; Permanent Data Erasure</h3>
              <p className="text-xs text-surface-500 mt-0.5">Exercise your right to be forgotten under Indian law</p>
            </div>
            <p className="text-xs text-surface-600 leading-relaxed">
              In strict accordance with the Digital Personal Data Protection (DPDP) Act 2023, you can permanently erase all personal identifiers, telemetry logs, and emergency contact mappings at any time.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 hover:text-rose-800 active:scale-[0.98] transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Request Permanent Erasure
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* --- ADD CONTACT MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-surface-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-surface-200 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-surface-950">Add Trusted Emergency Contact</h3>
                <p className="text-xs text-surface-500">Will receive immediate SMS & live telemetry during distress</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-surface-400 hover:text-surface-600 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-surface-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Ananya Sharma"
                  className="w-full rounded-lg border border-surface-300 px-3 py-2 text-xs focus:border-surface-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-surface-700 mb-1">Relationship *</label>
                <input
                  type="text"
                  required
                  value={contactRelationship}
                  onChange={(e) => setContactRelationship(e.target.value)}
                  placeholder="e.g. Mother, Sister, Spouse, Colleague"
                  className="w-full rounded-lg border border-surface-300 px-3 py-2 text-xs focus:border-surface-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-surface-700 mb-1">Mobile Phone (with country code) *</label>
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full rounded-lg border border-surface-300 px-3 py-2 text-xs font-mono focus:border-surface-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-surface-700 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@example.com"
                  className="w-full rounded-lg border border-surface-300 px-3 py-2 text-xs focus:border-surface-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-surface-700 mb-2">Notification Channels *</label>
                <div className="flex gap-4">
                  {["sms", "whatsapp", "email"].map((ch) => (
                    <label key={ch} className="inline-flex items-center gap-1.5 cursor-pointer uppercase font-mono text-[11px] text-surface-700">
                      <input
                        type="checkbox"
                        checked={preferredChannels.includes(ch)}
                        onChange={() => toggleChannel(ch)}
                        className="rounded border-surface-300 text-surface-900 focus:ring-0"
                      />
                      <span>{ch}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-surface-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-surface-200 px-4 py-2 font-medium text-surface-600 hover:bg-surface-50 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-surface-950 px-4 py-2 font-semibold text-white hover:bg-surface-800 disabled:opacity-50 text-xs shadow-xs"
                >
                  {actionLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Save & Verify Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE ACCOUNT MODAL --- */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-semibold text-rose-950 mb-1">Confirm Permanent Account Erasure</h3>
            <p className="text-xs text-rose-800/80 mb-4 leading-relaxed">
              Please enter your password to confirm irrevocable purging of your account, telemetry records, and emergency contact mappings under DPDP Act 2023.
            </p>

            <form onSubmit={handleDeleteAccount} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-surface-700 mb-1">Confirm Account Password *</label>
                <input
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-surface-300 px-3 py-2 text-xs focus:border-rose-500 focus:outline-hidden"
                />
              </div>

              <label className="flex items-start gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={confirmDelete}
                  onChange={(e) => setConfirmDelete(e.target.checked)}
                  className="mt-0.5 rounded border-rose-300 text-rose-600 focus:ring-0"
                />
                <span className="text-surface-700 text-xs leading-relaxed">
                  I understand that emergency SOS protection and volunteer dispatch will cease immediately.
                </span>
              </label>

              <div className="pt-4 flex justify-end gap-2 border-t border-surface-200">
                <button
                  type="button"
                  onClick={() => setShowDeleteAccountModal(false)}
                  className="rounded-lg border border-surface-200 px-4 py-2 font-medium text-surface-600 hover:bg-surface-50 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !confirmDelete || !deletePassword}
                  className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700 disabled:opacity-50 text-xs shadow-xs"
                >
                  {actionLoading ? "Processing..." : "Permanently Delete Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
