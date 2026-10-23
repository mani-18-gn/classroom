import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../services/api';
import { Classroom, MonitoringSession, DetectedEvent } from '../types';
import { VerificationModal } from '../components/VerificationModal';
import {
  Users, AlertCircle, CheckCircle2, XCircle, Clock, Play,
  School, Activity, ShieldCheck, ChevronRight, BarChart3, Radio, Eye
} from 'lucide-react';

interface TeacherDashboardProps {
  onNavigateToMonitoring: (classroomId: number) => void;
  onNavigateToReports: (sessionId: number) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onNavigateToMonitoring,
  onNavigateToReports,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [recentEvents, setRecentEvents] = useState<DetectedEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<DetectedEvent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [clsRes, evtRes] = await Promise.all([
          apiRequest<{ classrooms: Classroom[] }>('/classrooms'),
          apiRequest<{ events: DetectedEvent[] }>('/events?limit=50'),
        ]);
        setClassrooms(clsRes.classrooms || []);
        setRecentEvents(evtRes.events || []);
      } catch (err) {
        console.error('Failed to load teacher dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const totalRegistered = classrooms.reduce((acc, c) => acc + (c.enrolled_count || 0), 0) || 68;
  const pendingCount = recentEvents.filter((e) => e.verification_status === 'PENDING').length;
  const verifiedCount = recentEvents.filter((e) => e.verification_status === 'VERIFIED').length;
  const rejectedCount = recentEvents.filter((e) => e.verification_status === 'REJECTED').length;
  const verifiedSleepingEvents = recentEvents.filter(
    (e) => e.event_type === 'PROLONGED_EYE_CLOSURE' && e.verification_status === 'VERIFIED'
  );

  const handleSubmitDecision = async (
    eventId: number,
    decision: 'VERIFIED' | 'FALSE_POSITIVE' | 'NEEDS_REVIEW',
    notes: string
  ) => {
    try {
      await apiRequest(`/events/${eventId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ decision, notes }),
      });
      const evtRes = await apiRequest<{ events: DetectedEvent[] }>('/events?limit=50');
      setRecentEvents(evtRes.events || []);
    } catch (err) {
      console.error('Error verifying event:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Class Teacher Dashboard</h1>
            <span className="text-xs bg-blue-500/20 text-blue-300 font-mono px-2 py-0.5 rounded-full border border-blue-500/30">
              {user?.fullName || 'Class Teacher'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Active monitoring overview, classroom safety observations, and human verification controls
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToMonitoring(1)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Open Live Camera Feed</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Students Enrolled</span>
          <span className="text-xl font-bold text-white font-mono mt-1 block">{totalRegistered}</span>
          <span className="text-[10px] text-blue-400 mt-1 block">Consented Biometrics</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Currently Detected</span>
          <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">24</span>
          <span className="text-[10px] text-slate-400 mt-1 block">Active In Room 402</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Active Monitoring</span>
          <span className="text-xl font-bold text-blue-400 font-mono mt-1 block">1 Class</span>
          <span className="text-[10px] text-emerald-400 mt-1 block">Streaming Local</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Pending Reviews</span>
          <span className="text-xl font-bold text-amber-400 font-mono mt-1 block">{pendingCount}</span>
          <span className="text-[10px] text-amber-400/80 mt-1 block">Teacher Action Needed</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Verified Events</span>
          <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">{verifiedCount}</span>
          <span className="text-[10px] text-slate-400 mt-1 block">Confirmed by Teacher</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Rejected (False Pos.)</span>
          <span className="text-xl font-bold text-slate-300 font-mono mt-1 block">{rejectedCount}</span>
          <span className="text-[10px] text-slate-500 mt-1 block">Dismissed as Normal</span>
        </div>
      </div>

      {/* Classrooms List Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-tight">Assigned Classrooms</h2>
            <span className="text-xs text-slate-400">Semester 8 & 6 Courses</span>
          </div>

          <div className="space-y-3">
            {classrooms.map((cls) => (
              <div
                key={cls.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md hover:border-slate-700 transition flex items-center justify-between flex-wrap gap-4"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white tracking-tight">{cls.name}</h3>
                      <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-full border border-slate-700">
                        {cls.classroom_code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {cls.class_name || '8th Semester CSE'} • {cls.camera_source}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2 font-mono">
                      <span>Enrolled: <strong className="text-slate-200">{cls.enrolled_count || 32}</strong></span>
                      <span>Status: <strong className={cls.status === 'MONITORING' ? 'text-emerald-400' : 'text-slate-400'}>{cls.status}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onNavigateToReports(1)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700 transition flex items-center gap-1"
                  >
                    <BarChart3 className="w-3.5 h-3.5" /> Reports
                  </button>

                  <button
                    onClick={() => onNavigateToMonitoring(cls.id)}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition shadow-md flex items-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Monitor Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Recent Observations Queue */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Latest Safety Observations</h3>
            <span className="text-[10px] text-blue-400">Awaiting Teacher</span>
          </div>

          <div className="mt-3 space-y-2.5">
            {recentEvents.slice(0, 5).map((evt) => (
              <div key={evt.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-[11px]">{evt.student_name_snapshot}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{evt.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-1">"{evt.ai_observation}"</p>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-mono">Conf: {Math.round(evt.confidence_score * 100)}%</span>
                  <span
                    className={`font-semibold px-1.5 py-0.2 rounded ${
                      evt.verification_status === 'VERIFIED'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : evt.verification_status === 'REJECTED'
                        ? 'bg-slate-700 text-slate-400'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {evt.verification_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Class Teacher Verified Sleeping Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Class Teacher Verified Sleeping Records
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {verifiedSleepingEvents.length} Verified
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Official sleeping incidents verified by teachers with recorded justification reason
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {verifiedSleepingEvents.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
              <p className="font-semibold text-slate-400">No verified sleeping records</p>
              <p className="text-[11px]">When you verify a student sleeping observation with a reason, it will be officially recorded here.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Teacher Verification Reason</th>
                  <th className="py-2.5 px-3">Verified By</th>
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
                      "{evt.teacher_notes || evt.verification_reason || 'Verified sleeping during lecture'}"
                    </td>
                    <td className="py-3 px-3 font-semibold text-emerald-400 whitespace-nowrap">
                      {evt.verified_by_teacher || 'Class Teacher'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        VERIFIED
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

      {selectedEvent && (
        <VerificationModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onSubmitDecision={handleSubmitDecision}
        />
      )}
    </div>
  );
};
