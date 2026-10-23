import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import {
  User, Mail, Phone, Hash, BookOpen, School, ShieldCheck,
  Calendar, KeyRound, Save, LogOut, CheckCircle2, AlertCircle,
  Lock, Edit3, XCircle, Laptop, Clock, Shield, RefreshCw
} from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [securityData, setSecurityData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Editable fields
  const [phone, setPhone] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [emergencyContact, setEmergencyContact] = useState<string>('');
  const [preferredName, setPreferredName] = useState<string>('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [changingPassword, setChangingPassword] = useState<boolean>(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/students/me/profile');
      if (res.profile) {
        setProfile(res.profile);
        setPhone(res.profile.phone || '');
        setBio(res.profile.bio || '');
        setEmergencyContact(res.profile.emergencyContact || '');
        setPreferredName(res.profile.preferredName || res.profile.fullName || '');
      }
    } catch (err: any) {
      console.error('Failed to fetch profile:', err);
      setMessage({ text: err.message || 'Failed to load profile details.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurity = async () => {
    try {
      const res = await apiRequest('/students/me/security');
      setSecurityData(res);
    } catch (err: any) {
      console.error('Failed to load security info:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchSecurity();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiRequest('/students/me/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          phone,
          bio,
          emergency_contact: emergencyContact,
          preferred_name: preferredName
        })
      });
      setMessage({ text: res.message || 'Profile updated successfully.', type: 'success' });
      fetchProfile();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to save changes.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({ text: 'New password must be at least 8 characters long.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'New password and confirmation do not match.', type: 'error' });
      return;
    }

    setChangingPassword(true);
    try {
      const res = await apiRequest('/students/me/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        })
      });
      setPasswordMessage({ text: res.message || 'Password changed successfully.', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      fetchSecurity();
    } catch (err: any) {
      setPasswordMessage({ text: err.message || 'Password update failed.', type: 'error' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of your session?')) {
      logout();
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin" />
        <p className="text-xs font-mono tracking-widest uppercase text-[#6EE7B7]">
          Loading Verified Profile...
        </p>
      </div>
    );
  }

  const sec = securityData?.accountSecurity;
  const history = securityData?.loginHistory || [];
  const checklist = securityData?.securityChecklist || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#294638]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#F8FAFC]">My Profile & Security</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#204735] text-[#10B981] border border-[#10B981]/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Enrolled
            </span>
          </div>
          <p className="text-xs text-[#A7B8AE] mt-1">
            Manage your personal academic identity, update contact details, and audit account security.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-[#F87171]/15 hover:bg-[#F87171] text-[#F87171] hover:text-[#0B1713] text-xs font-bold rounded-xl border border-[#F87171]/30 transition inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#294638] pb-1">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
            activeTab === 'profile'
              ? 'bg-[#10B981] text-[#0B1713] border-[#10B981]'
              : 'bg-[#17382B] text-[#A7B8AE] border-[#294638] hover:text-[#F8FAFC]'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Personal & Academic Details</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
            activeTab === 'security'
              ? 'bg-[#10B981] text-[#0B1713] border-[#10B981]'
              : 'bg-[#17382B] text-[#A7B8AE] border-[#294638] hover:text-[#F8FAFC]'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Password & Security Audit</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-[#204735] border-[#10B981]/50 text-[#6EE7B7]'
              : 'bg-[#F87171]/20 border-[#F87171]/40 text-[#F87171]'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#10B981]" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#F87171]" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* 1. Profile Details Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-8 animate-fade-in">
          {/* Profile Overview Card (Read-Only Verified Academic Data) */}
          <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#294638]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#A7B8AE]">
            Institutional Records (Verified by University Registry)
          </h2>
          <span className="text-[10px] text-[#A7B8AE] italic">Identifiers are locked to prevent tampering</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="bg-[#10231C] p-3.5 rounded-2xl border border-[#294638] space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#A7B8AE] font-semibold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#10B981]" /> Full Name
            </span>
            <p className="text-sm font-bold text-[#F8FAFC]">{profile?.fullName}</p>
          </div>

          <div className="bg-[#10231C] p-3.5 rounded-2xl border border-[#294638] space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#A7B8AE] font-semibold flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-[#10B981]" /> Student ID / USN
            </span>
            <p className="text-sm font-bold font-mono text-[#F8FAFC]">{profile?.studentId}</p>
          </div>

          <div className="bg-[#10231C] p-3.5 rounded-2xl border border-[#294638] space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#A7B8AE] font-semibold flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-[#6EE7B7]" /> Roll Number
            </span>
            <p className="text-sm font-bold font-mono text-[#F8FAFC]">{profile?.rollNumber}</p>
          </div>

          <div className="bg-[#10231C] p-3.5 rounded-2xl border border-[#294638] space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#A7B8AE] font-semibold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#10B981]" /> Registered Email
            </span>
            <p className="text-xs font-bold text-[#F8FAFC] font-mono truncate">{profile?.email}</p>
          </div>

          <div className="bg-[#10231C] p-3.5 rounded-2xl border border-[#294638] space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#A7B8AE] font-semibold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#6EE7B7]" /> Academic Program & Section
            </span>
            <p className="text-xs font-bold text-[#F8FAFC]">
              {profile?.className} • Section {profile?.section}
            </p>
          </div>

          <div className="bg-[#10231C] p-3.5 rounded-2xl border border-[#294638] space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#A7B8AE] font-semibold flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-[#10B981]" /> Assigned Classroom
            </span>
            <p className="text-xs font-bold text-[#6EE7B7] truncate">{profile?.assignedClassroom}</p>
          </div>

          <div className="bg-[#10231C] p-3.5 rounded-2xl border border-[#294638] space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#A7B8AE] font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#A7B8AE]" /> Enrolled Since
            </span>
            <p className="text-xs font-mono text-[#F8FAFC]">{profile?.createdAt?.slice(0, 10)}</p>
          </div>

          <div className="bg-[#10231C] p-3.5 rounded-2xl border border-[#294638] space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#A7B8AE] font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" /> Account Role
            </span>
            <p className="text-xs font-mono font-bold text-[#10B981]">STUDENT (Read-Only Role)</p>
          </div>

          <div className="bg-[#10231C] p-3.5 rounded-2xl border border-[#294638] space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#A7B8AE] font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" /> Verification Status
            </span>
            <p className="text-xs font-semibold text-[#6EE7B7]">{profile?.verificationStatus}</p>
          </div>
        </div>
      </div>

      {/* Editable Permitted Profile Fields */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="pb-3 border-b border-[#294638]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-[#10B981]" />
            Permitted Profile Customizations
          </h2>
          <p className="text-[11px] text-[#A7B8AE] mt-0.5">
            You can update your personal contact number, preferred display name, emergency contact, and academic bio.
          </p>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#A7B8AE] mb-1">
                Preferred Display Name
              </label>
              <input
                type="text"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                maxLength={60}
                className="w-full bg-[#10231C] border border-[#294638] focus:border-[#10B981] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] outline-none transition"
                placeholder="Preferred name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A7B8AE] mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={20}
                className="w-full bg-[#10231C] border border-[#294638] focus:border-[#10B981] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] outline-none transition"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A7B8AE] mb-1">
              Emergency Contact (Guardian / Parent Phone)
            </label>
            <input
              type="text"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              maxLength={100}
              className="w-full bg-[#10231C] border border-[#294638] focus:border-[#10B981] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] outline-none transition"
              placeholder="e.g. Father: +91 94480 12345"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A7B8AE] mb-1">
              Academic Bio & Project Focus
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full bg-[#10231C] border border-[#294638] focus:border-[#10B981] rounded-xl p-3 text-xs text-[#F8FAFC] outline-none transition resize-none"
              placeholder="Brief note about your specialization or current semester project..."
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-[#0B1713] text-xs font-bold rounded-xl transition inline-flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

      {/* 2. Password & Security Center Tab */}
      {activeTab === 'security' && (
        <div className="space-y-8 animate-fade-in">
          {/* Active Session & Current Network Box */}
          <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#294638]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
                <Laptop className="w-4 h-4 text-[#10B981]" />
                Active Session Telemetry
              </h2>
              <span className="text-[10px] text-[#6EE7B7] font-mono">Role: STUDENT</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#10231C] p-3.5 rounded-2xl border border-[#294638] space-y-1">
                <span className="text-[10px] text-[#A7B8AE] uppercase font-semibold">Account Identity</span>
                <p className="text-sm font-bold text-[#F8FAFC] truncate">{sec?.fullName || user?.fullName}</p>
                <p className="text-[10px] font-mono text-[#6EE7B7] truncate">{sec?.email || user?.email}</p>
              </div>

              <div className="bg-[#10231C] p-3.5 rounded-2xl border border-[#294638] space-y-1">
                <span className="text-[10px] text-[#A7B8AE] uppercase font-semibold">Current IP & Network</span>
                <p className="text-sm font-bold font-mono text-[#F8FAFC]">{sec?.currentIp || '127.0.0.1'}</p>
                <p className="text-[10px] text-[#10B981]">Encrypted TLS 1.3 / Localhost</p>
              </div>
            </div>

            <div className="bg-[#10231C] p-4 rounded-2xl border border-[#294638] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#204735] flex items-center justify-center text-[#10B981]">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#F8FAFC]">Active Web Browser Session</p>
                  <p className="text-[11px] text-[#A7B8AE] max-w-sm truncate">{sec?.currentUserAgent || navigator.userAgent}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-[#F87171]/15 hover:bg-[#F87171] text-[#F87171] hover:text-[#0B1713] text-xs font-bold rounded-xl border border-[#F87171]/40 transition inline-flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out Session
              </button>
            </div>
          </div>

          {/* Password Change Form */}
          <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="pb-3 border-b border-[#294638]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#10B981]" />
                Security & Password Update
              </h2>
              <p className="text-[11px] text-[#A7B8AE] mt-0.5">
                Passwords must contain at least 8 characters. Password hashes are never transmitted to or stored on client devices.
              </p>
            </div>

            {passwordMessage && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  passwordMessage.type === 'success'
                    ? 'bg-[#204735] border-[#10B981]/50 text-[#6EE7B7]'
                    : 'bg-[#F87171]/20 border-[#F87171]/40 text-[#F87171]'
                }`}
              >
                {passwordMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#10B981]" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#F87171]" />
                )}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-[#A7B8AE] mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-[#10231C] border border-[#294638] focus:border-[#10B981] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] outline-none transition"
                  placeholder="••••••••••••"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A7B8AE] mb-1">
                    New Password (min 8 chars)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#10231C] border border-[#294638] focus:border-[#10B981] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] outline-none transition"
                    placeholder="••••••••••••"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A7B8AE] mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#10231C] border border-[#294638] focus:border-[#10B981] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] outline-none transition"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-[#0B1713] text-xs font-bold rounded-xl transition inline-flex items-center gap-2"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  {changingPassword ? 'Updating...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Security Checklist Widget */}
          <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4 text-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              Account Security Posture
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {checklist.map((item: any, idx: number) => (
                <div key={idx} className="bg-[#10231C] p-3 rounded-xl border border-[#294638] space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#F8FAFC]">{item.item}</span>
                    <span className="text-[10px] font-mono font-bold text-[#10B981]">{item.status}</span>
                  </div>
                  <p className="text-[10px] text-[#A7B8AE]">{item.details}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Login History Audit Trail */}
          <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#294638]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#10B981]" />
                Recent Login History Audit
              </h2>
              <span className="text-xs text-[#A7B8AE] font-mono">{history.length} Sessions Logged</span>
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-[#A7B8AE] py-4 text-center">No recent login events recorded.</p>
            ) : (
              <div className="space-y-2">
                {history.map((log: any) => (
                  <div
                    key={log.id}
                    className="bg-[#10231C] border border-[#294638] p-3 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          log.status === 'SUCCESS' ? 'bg-[#10B981]' : 'bg-[#F87171]'
                        }`}
                      />
                      <div>
                        <span className="font-semibold text-[#F8FAFC]">
                          {log.status === 'SUCCESS' ? 'Successful Login' : 'Failed Authentication Attempt'}
                        </span>
                        <span className="text-[11px] text-[#A7B8AE] block truncate max-w-md">
                          {log.user_agent}
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono text-[11px] text-[#A7B8AE]">
                      <p>IP: {log.ip_address}</p>
                      <p>{log.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
