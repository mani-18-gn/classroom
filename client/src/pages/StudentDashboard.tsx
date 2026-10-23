import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import {
  GraduationCap, ShieldCheck, ShieldAlert, Clock, CheckCircle2,
  XCircle, Bell, ArrowRight, ArrowUpRight, School, FileText,
  User, Lock, Sparkles, RefreshCw, AlertCircle
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigate?: (tab: string, filter?: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest('/students/me/dashboard');
      setData(res);
    } catch (err: any) {
      console.error('Failed to load student dashboard:', err);
      setError(err.message || 'Unable to load dashboard data from backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  const handleNav = (tab: string, filter?: string) => {
    if (onNavigate) {
      onNavigate(tab, filter);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin" />
        <p className="text-xs font-mono uppercase tracking-widest text-[#6EE7B7]">
          Loading Authenticated Student Cockpit...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-[#17382B] border border-[#F87171]/40 rounded-3xl p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-[#F87171] mx-auto" />
          <h2 className="text-lg font-bold text-[#F8FAFC]">Failed to Load Student Portal</h2>
          <p className="text-xs text-[#A7B8AE] max-w-md mx-auto">{error || 'Session could not be initialized.'}</p>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-[#204735] hover:bg-[#10B981] hover:text-[#0B1713] text-xs font-bold rounded-xl border border-[#294638] transition inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const s = data.student;
  const classroom = data.classroom;
  const stats = data.statistics;
  const privacy = data.privacyConsent;
  const recent = data.recentActivity || [];
  const notifs = data.recentNotifications || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* 1. Welcome & Profile Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#17382B] via-[#10231C] to-[#0B1713] border border-[#294638] p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#204735] text-[#6EE7B7] border border-[#10B981]/30">
                Student Portal
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[#A7B8AE]">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                Verified Active Session
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
              Welcome back, {s.preferredName || s.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-[#A7B8AE] max-w-xl">
              Transparent, privacy-first classroom observation portal. View your registered academic status, verified records, digital consent, and submit review appeals.
            </p>
          </div>

          {/* Academic Profile Snippet Card */}
          <div className="bg-[#10231C]/90 backdrop-blur-xs p-4 rounded-2xl border border-[#294638] min-w-[260px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#A7B8AE] uppercase tracking-wider font-semibold">Student Identity</span>
              <span className="text-[10px] font-mono font-bold text-[#6EE7B7] bg-[#204735] px-2 py-0.5 rounded border border-[#294638]">
                {s.rollNumber ? `Roll #${s.rollNumber}` : 'Enrolled'}
              </span>
            </div>
            <p className="text-sm font-bold text-[#F8FAFC] truncate">{s.fullName}</p>
            <div className="text-[11px] text-[#A7B8AE] space-y-0.5 font-mono">
              <p>USN: <span className="text-[#F8FAFC] font-semibold">{s.studentId}</span></p>
              <p>Class: <span className="text-[#F8FAFC]">{s.className}</span> ({s.section})</p>
              <p className="truncate">Room: <span className="text-[#6EE7B7]">{classroom.classroom_code} - {classroom.classroom_name}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Statistical Metric Highlights (Clickable Filter Shortcuts) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#A7B8AE]">
            Academic Activity Statistics (Actual Database Records)
          </h2>
          <span className="text-[11px] text-[#A7B8AE]">Click cards to filter records</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total AI Observations */}
          <div
            onClick={() => handleNav('student-activity-records', 'ALL')}
            className="group bg-[#17382B] hover:bg-[#204735] border border-[#294638] hover:border-[#10B981] p-5 rounded-2xl cursor-pointer transition shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A7B8AE] group-hover:text-[#F8FAFC] transition">
                Total AI Observations
              </span>
              <Sparkles className="w-4 h-4 text-[#FBBF24]" />
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-[#F8FAFC] font-mono">
                {stats.totalDetectedObservations}
              </span>
              <p className="text-[11px] text-[#A7B8AE] mt-1 flex items-center gap-1">
                <span>Preliminary edge alerts</span>
                <ArrowRight className="w-3 h-3 text-[#10B981] group-hover:translate-x-1 transition" />
              </p>
            </div>
          </div>

          {/* Card 2: Teacher Reviewed */}
          <div
            onClick={() => handleNav('student-activity-records', 'VERIFIED')}
            className="group bg-[#17382B] hover:bg-[#204735] border border-[#294638] hover:border-[#10B981] p-5 rounded-2xl cursor-pointer transition shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A7B8AE] group-hover:text-[#F8FAFC] transition">
                Teacher-Reviewed
              </span>
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-[#10B981] font-mono">
                {stats.teacherReviewedCount}
              </span>
              <p className="text-[11px] text-[#6EE7B7] mt-1 flex items-center gap-1">
                <span>Human confirmed conclusion</span>
                <ArrowRight className="w-3 h-3 text-[#10B981] group-hover:translate-x-1 transition" />
              </p>
            </div>
          </div>

          {/* Card 3: Dismissed / False Positives */}
          <div
            onClick={() => handleNav('student-activity-records', 'DISMISSED')}
            className="group bg-[#17382B] hover:bg-[#204735] border border-[#294638] hover:border-[#10B981] p-5 rounded-2xl cursor-pointer transition shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A7B8AE] group-hover:text-[#F8FAFC] transition">
                Dismissed Observations
              </span>
              <XCircle className="w-4 h-4 text-[#A7B8AE]" />
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-[#F8FAFC] font-mono">
                {stats.dismissedCount}
              </span>
              <p className="text-[11px] text-[#A7B8AE] mt-1 flex items-center gap-1">
                <span>Normal active classroom behavior</span>
                <ArrowRight className="w-3 h-3 text-[#10B981] group-hover:translate-x-1 transition" />
              </p>
            </div>
          </div>

          {/* Card 4: Pending Review */}
          <div
            onClick={() => handleNav('student-activity-records', 'PENDING')}
            className="group bg-[#17382B] hover:bg-[#204735] border border-[#294638] hover:border-[#10B981] p-5 rounded-2xl cursor-pointer transition shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A7B8AE] group-hover:text-[#F8FAFC] transition">
                Pending Teacher Review
              </span>
              <Clock className="w-4 h-4 text-[#6EE7B7]" />
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-[#6EE7B7] font-mono">
                {stats.pendingReviewCount}
              </span>
              <p className="text-[11px] text-[#A7B8AE] mt-1 flex items-center gap-1">
                <span>Awaiting human verification</span>
                <ArrowRight className="w-3 h-3 text-[#10B981] group-hover:translate-x-1 transition" />
              </p>
            </div>
          </div>
        </div>

        {/* Ethical AI Disclaimer Banner */}
        <div className="p-3 bg-[#10231C] border border-[#294638] rounded-2xl flex items-start gap-2.5 text-xs text-[#A7B8AE]">
          <ShieldCheck className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
          <span>
            <strong className="text-[#F8FAFC]">Ethical AI Guardrail:</strong> An AI-generated computer vision observation is purely unverified telemetry. It is strictly never used as proof of academic misconduct without explicit human teacher review and verification.
          </span>
        </div>
      </div>

      {/* 3. Quick Actions Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#A7B8AE]">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => handleNav('student-profile')}
            className="p-4 bg-[#17382B] hover:bg-[#204735] border border-[#294638] hover:border-[#10B981] rounded-2xl text-left transition group space-y-1.5"
          >
            <div className="w-8 h-8 rounded-xl bg-[#10231C] border border-[#294638] flex items-center justify-center text-[#10B981] group-hover:scale-105 transition">
              <User className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-[#F8FAFC]">My Profile</p>
            <p className="text-[11px] text-[#A7B8AE]">Update contacts & password</p>
          </button>

          <button
            onClick={() => handleNav('student-privacy-consent')}
            className="p-4 bg-[#17382B] hover:bg-[#204735] border border-[#294638] hover:border-[#10B981] rounded-2xl text-left transition group space-y-1.5"
          >
            <div className="w-8 h-8 rounded-xl bg-[#10231C] border border-[#294638] flex items-center justify-center text-[#6EE7B7] group-hover:scale-105 transition">
              <Lock className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-[#F8FAFC]">Privacy & Consent</p>
            <p className="text-[11px] text-[#A7B8AE]">Manage DPDP consents</p>
          </button>

          <button
            onClick={() => handleNav('student-activity-records')}
            className="p-4 bg-[#17382B] hover:bg-[#204735] border border-[#294638] hover:border-[#10B981] rounded-2xl text-left transition group space-y-1.5"
          >
            <div className="w-8 h-8 rounded-xl bg-[#10231C] border border-[#294638] flex items-center justify-center text-[#FBBF24] group-hover:scale-105 transition">
              <FileText className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-[#F8FAFC]">Activity Records</p>
            <p className="text-[11px] text-[#A7B8AE]">Filtered event logs</p>
          </button>

          <button
            onClick={() => handleNav('student-request-review')}
            className="p-4 bg-[#17382B] hover:bg-[#204735] border border-[#294638] hover:border-[#10B981] rounded-2xl text-left transition group space-y-1.5"
          >
            <div className="w-8 h-8 rounded-xl bg-[#10231C] border border-[#294638] flex items-center justify-center text-[#10B981] group-hover:scale-105 transition">
              <GraduationCap className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-[#F8FAFC]">Request a Review</p>
            <p className="text-[11px] text-[#A7B8AE]">Appeal an observation</p>
          </button>
        </div>
      </div>

      {/* 4. Split Section: Recent Activity Records vs Notifications & Consent Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): Recent Authorized Activity Records */}
        <div className="lg:col-span-2 bg-[#17382B] border border-[#294638] rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#294638]">
            <div>
              <h2 className="text-sm font-bold text-[#F8FAFC]">Recent Authorized Activity Records</h2>
              <p className="text-[11px] text-[#A7B8AE]">Showing latest verified and pending event observations</p>
            </div>
            <button
              onClick={() => handleNav('student-activity-records')}
              className="text-xs font-semibold text-[#10B981] hover:text-[#6EE7B7] flex items-center gap-1 transition"
            >
              <span>View All Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recent.length === 0 ? (
              <div className="text-center py-8 bg-[#10231C] rounded-2xl border border-[#294638]">
                <CheckCircle2 className="w-8 h-8 text-[#10B981]/50 mx-auto mb-2" />
                <p className="text-xs font-semibold text-[#F8FAFC]">No Recorded Events</p>
                <p className="text-[11px] text-[#A7B8AE] mt-0.5">Your record is clean. No monitoring incidents logged.</p>
              </div>
            ) : (
              recent.map((rec: any) => (
                <div
                  key={rec.id}
                  className="bg-[#10231C] border border-[#294638] hover:border-[#10B981]/50 p-4 rounded-2xl transition space-y-2"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#F8FAFC]">
                        {rec.event_type.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          rec.verification_status === 'VERIFIED'
                            ? 'bg-[#204735] text-[#10B981] border-[#10B981]/40'
                            : rec.verification_status === 'REJECTED'
                            ? 'bg-[#10231C] text-[#A7B8AE] border-[#294638]'
                            : 'bg-[#FBBF24]/10 text-[#FBBF24] border-[#FBBF24]/30'
                        }`}
                      >
                        {rec.verification_status === 'VERIFIED'
                          ? '✓ Teacher Verified'
                          : rec.verification_status === 'REJECTED'
                          ? 'Dismissed'
                          : 'Pending Review'}
                      </span>
                      {rec.appeal_status && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#204735] text-[#6EE7B7] border border-[#10B981]/20">
                          Appeal: {rec.appeal_status}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#A7B8AE] font-mono">{rec.timestamp}</span>
                  </div>

                  <p className="text-xs text-[#A7B8AE] italic leading-relaxed">
                    "{rec.ai_observation}"
                  </p>

                  {rec.teacher_notes && (
                    <div className="bg-[#204735]/70 p-2.5 rounded-xl border border-[#294638] text-[11px]">
                      <span className="text-[#6EE7B7] font-semibold">Teacher Decision Note: </span>
                      <span className="text-[#F8FAFC]">"{rec.teacher_notes}"</span>
                      <span className="text-[#A7B8AE] block mt-0.5 text-[10px]">
                        Reviewed by {rec.verified_by_teacher} on {rec.verified_at}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Privacy Status & Recent Notifications */}
        <div className="space-y-6">
          {/* Privacy & Consent Status Box */}
          <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#294638]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#10B981]" />
                Privacy & Consent Status
              </h3>
              <button
                onClick={() => handleNav('student-privacy-consent')}
                className="text-[11px] text-[#10B981] hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="bg-[#10231C] p-3.5 rounded-2xl border border-[#294638] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#A7B8AE]">Monitoring Consent</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    privacy.consentStatus === 'CONSENTED'
                      ? 'bg-[#204735] text-[#10B981] border-[#10B981]/40'
                      : 'bg-[#F87171]/20 text-[#F87171] border-[#F87171]/40'
                  }`}
                >
                  {privacy.consentStatus === 'CONSENTED' ? 'ACTIVE CONSENT' : 'CONSENT WITHDRAWN'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#A7B8AE]">Biometric Profile</span>
                <span className="text-[#F8FAFC] font-mono font-semibold">
                  {privacy.biometricStatus === 'ACTIVE' ? 'AES-256 Vector' : 'Purged'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#A7B8AE]">Processing Model</span>
                <span className="text-[#6EE7B7] font-semibold">100% In-Browser</span>
              </div>
            </div>

            <p className="text-[11px] text-[#A7B8AE] leading-tight">
              Compliant with the Digital Personal Data Protection (DPDP) Act 2023. Video streams never leave this machine.
            </p>
          </div>

          {/* Recent Notifications Widget */}
          <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#294638]">
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-[#10B981]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
                  Recent Notifications
                </h3>
              </div>
              <button
                onClick={() => handleNav('student-notifications')}
                className="text-[11px] text-[#10B981] hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-2">
              {notifs.length === 0 ? (
                <p className="text-xs text-[#A7B8AE] py-3 text-center">No notifications right now.</p>
              ) : (
                notifs.map((n: any) => (
                  <div
                    key={n.id}
                    onClick={() => handleNav(n.link_tab || 'student-notifications')}
                    className="p-2.5 bg-[#10231C] border border-[#294638] hover:border-[#10B981]/40 rounded-xl cursor-pointer transition text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#F8FAFC]">{n.title}</span>
                      <span className="text-[9px] text-[#A7B8AE] font-mono">{n.created_at?.slice(0, 10)}</span>
                    </div>
                    <p className="text-[11px] text-[#A7B8AE] line-clamp-2">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
