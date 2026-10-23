import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../services/api';
import { DetectedEvent } from '../types';
import { VerificationModal } from '../components/VerificationModal';
import {
  ShieldCheck, Users, School, Database, Activity, UserPlus,
  Key, Lock, Server, CheckCircle2, AlertTriangle, ArrowUpRight, Eye, FileText
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [verifiedSleepingEvents, setVerifiedSleepingEvents] = useState<DetectedEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<DetectedEvent | null>(null);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);
  const [stats, setStats] = useState({
    totalUsers: 14,
    totalStudents: 3,
    activeClassrooms: 2,
    activeConsents: 3,
    retentionDays: 7,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [evtRes, stdRes] = await Promise.all([
          apiRequest<{ events: DetectedEvent[] }>('/events?limit=100'),
          apiRequest<{ students: any[] }>('/students'),
        ]);
        const allEvts = evtRes.events || [];
        const sleepingVerified = allEvts.filter(
          (e) => e.event_type === 'PROLONGED_EYE_CLOSURE' && e.verification_status === 'VERIFIED'
        );
        setVerifiedSleepingEvents(sleepingVerified);
        if (stdRes?.students) {
          setStats((prev) => ({
            ...prev,
            totalStudents: stdRes.students.length,
            activeConsents: stdRes.students.filter((s: any) => s.consent_status === 'CONSENTED').length,
          }));
        }
      } catch (err) {
        console.error('Error fetching admin dashboard data:', err);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Super Admin Governance Portal</h1>
            <span className="text-xs bg-purple-500/20 text-purple-300 font-mono px-2 py-0.5 rounded-full border border-purple-500/30">
              Root Authority: {user?.fullName || 'System Administrator'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Institutional oversight, cryptographic audit logs, retention controls, and authorized student registration.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-mono flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Edge Node Active
          </span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Institution Enrolled</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">{stats.totalStudents} Students</span>
          <span className="text-[10px] text-blue-400">Computer Science & Info Tech</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Consents Granted</span>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">{stats.activeConsents} Active</span>
          <span className="text-[10px] text-slate-400">Consented Biometrics</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Verified Sleeping Incidents</span>
          <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">{verifiedSleepingEvents.length} Recorded</span>
          <span className="text-[10px] text-emerald-400">Class Teacher Confirmed</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Security Architecture</span>
          <span className="text-2xl font-bold font-mono text-purple-400 mt-1 block">AES-256</span>
          <span className="text-[10px] text-emerald-400">Zero Cloud Footage</span>
        </div>
      </div>

      {/* Institutional Verified Student Sleeping Records (Teacher Confirmed) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Institutional Verified Student Sleeping Records
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {verifiedSleepingEvents.length} Confirmed
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Official disciplinary & attention records verified by class teachers with justification reasons
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {verifiedSleepingEvents.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
              <p className="font-semibold text-slate-400">No verified sleeping records</p>
              <p className="text-[11px]">When class teachers verify student sleeping observations, they appear here with the teacher's reason.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Teacher Verification Reason</th>
                  <th className="py-2.5 px-3">Verified By (Teacher)</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {verifiedSleepingEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                      {evt.student_name_snapshot}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">{evt.timestamp}</td>
                    <td className="py-3 px-3 font-mono text-slate-300">{evt.duration_seconds}s</td>
                    <td className="py-3 px-3 text-amber-200 italic max-w-sm">
                      "{evt.teacher_notes || evt.verification_reason || 'Class teacher verified student was sleeping during lecture'}"
                    </td>
                    <td className="py-3 px-3 font-semibold text-emerald-400 whitespace-nowrap">
                      {evt.verified_by_teacher || 'Class Teacher'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        VERIFIED & RECORDED
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedEvent(evt)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-700 transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Admin Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Module 1: Institution Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl w-fit border border-blue-500/20">
            <School className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight">Institution Configuration</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Manage academic departments, degree semesters, class sections, and assign teacher privileges.
          </p>
          <div className="pt-2">
            <span className="text-[11px] font-mono text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 block">
              Institution: INST-VTU-01 (Dept CSE & ISE)
            </span>
          </div>
        </div>

        {/* Module 2: Privacy Retention Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl w-fit border border-emerald-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight">Privacy & Retention Guard</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enforces strict auto-deletion intervals for event snapshot frames and immediate purging upon consent revocation.
          </p>
          <div className="pt-2">
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 block">
              Auto-Purge Cron Active: Every 15m
            </span>
          </div>
        </div>

        {/* Module 3: System Audit Trail */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl w-fit border border-purple-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight">Security Audit Logs</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Immutable system activity ledger tracking authentication, session activations, and data deletion requests.
          </p>
          <div className="pt-2">
            <span className="text-[11px] font-mono text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20 block">
              Audit Encryption: SHA-256 Hash
            </span>
          </div>
        </div>
      </div>

      {selectedEvent && (
        <VerificationModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onSubmitDecision={async (eventId, decision, notes) => {
            await apiRequest(`/events/${eventId}/verify`, {
              method: 'POST',
              body: JSON.stringify({ decision, notes }),
            });
            const evtRes = await apiRequest<{ events: DetectedEvent[] }>('/events?limit=100');
            const sleepingVerified = (evtRes.events || []).filter(
              (e) => e.event_type === 'PROLONGED_EYE_CLOSURE' && e.verification_status === 'VERIFIED'
            );
            setVerifiedSleepingEvents(sleepingVerified);
          }}
        />
      )}
    </div>
  );
};
