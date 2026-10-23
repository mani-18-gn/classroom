import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../services/api';
import { Classroom, DetectedEvent } from '../types';
import { VerificationModal } from '../components/VerificationModal';
import {
  Users, CheckCircle2, Play,
  School, Radio, Eye, BarChart3
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
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-[#294638]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#F8FAFC] tracking-tight">Class Teacher Dashboard</h1>
            <span className="text-xs bg-[#204735] text-[#6EE7B7] font-mono px-2.5 py-0.5 rounded-full border border-[#294638]">
              {user?.fullName || 'Class Teacher'}
            </span>
          </div>
          <p className="text-xs text-[#A7B8AE] mt-0.5">
            Active monitoring overview, classroom safety observations, and human verification controls
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToMonitoring(1)}
            className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-[#0B1713] text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Open Live Camera Feed</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-[#17382B] border border-[#294638] rounded-2xl p-3.5 shadow-sm">
          <span className="text-[10px] text-[#A7B8AE] font-medium uppercase tracking-wider block">Students Enrolled</span>
          <span className="text-xl font-bold text-[#F8FAFC] font-mono mt-1 block">{totalRegistered}</span>
          <span className="text-[10px] text-[#6EE7B7] mt-1 block">Consented Biometrics</span>
        </div>

        <div className="bg-[#17382B] border border-[#294638] rounded-2xl p-3.5 shadow-sm">
          <span className="text-[10px] text-[#A7B8AE] font-medium uppercase tracking-wider block">Currently Detected</span>
          <span className="text-xl font-bold text-[#10B981] font-mono mt-1 block">24</span>
          <span className="text-[10px] text-[#A7B8AE] mt-1 block">Active In Room 402</span>
        </div>

        <div className="bg-[#17382B] border border-[#294638] rounded-2xl p-3.5 shadow-sm">
          <span className="text-[10px] text-[#A7B8AE] font-medium uppercase tracking-wider block">Active Monitoring</span>
          <span className="text-xl font-bold text-[#6EE7B7] font-mono mt-1 block">1 Class</span>
          <span className="text-[10px] text-[#10B981] mt-1 block">Streaming Local</span>
        </div>

        <div className="bg-[#17382B] border border-[#294638] rounded-2xl p-3.5 shadow-sm">
          <span className="text-[10px] text-[#A7B8AE] font-medium uppercase tracking-wider block">Pending Reviews</span>
          <span className="text-xl font-bold text-[#FBBF24] font-mono mt-1 block">{pendingCount}</span>
          <span className="text-[10px] text-[#FBBF24]/80 mt-1 block">Teacher Action Needed</span>
        </div>

        <div className="bg-[#17382B] border border-[#294638] rounded-2xl p-3.5 shadow-sm">
          <span className="text-[10px] text-[#A7B8AE] font-medium uppercase tracking-wider block">Verified Events</span>
          <span className="text-xl font-bold text-[#10B981] font-mono mt-1 block">{verifiedCount}</span>
          <span className="text-[10px] text-[#A7B8AE] mt-1 block">Confirmed by Teacher</span>
        </div>

        <div className="bg-[#17382B] border border-[#294638] rounded-2xl p-3.5 shadow-sm">
          <span className="text-[10px] text-[#A7B8AE] font-medium uppercase tracking-wider block">Rejected (False Pos.)</span>
          <span className="text-xl font-bold text-[#A7B8AE] font-mono mt-1 block">{rejectedCount}</span>
          <span className="text-[10px] text-[#A7B8AE]/70 mt-1 block">Dismissed as Normal</span>
        </div>
      </div>

      {/* Classrooms List Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#F8FAFC] tracking-tight">Assigned Classrooms</h2>
            <span className="text-xs text-[#A7B8AE]">Semester 8 & 6 Courses</span>
          </div>

          <div className="space-y-3">
            {classrooms.map((cls) => (
              <div
                key={cls.id}
                className="bg-[#17382B] border border-[#294638] rounded-2xl p-4 shadow-sm hover:border-[#10B981]/50 transition flex items-center justify-between flex-wrap gap-4"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 bg-[#204735] text-[#10B981] rounded-xl border border-[#294638]">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#F8FAFC] tracking-tight">{cls.name}</h3>
                      <span className="text-[10px] bg-[#10231C] text-[#6EE7B7] font-mono px-2 py-0.5 rounded-full border border-[#294638]">
                        {cls.classroom_code}
                      </span>
                    </div>
                    <p className="text-xs text-[#A7B8AE] mt-0.5">
                      {cls.class_name || '8th Semester CSE'} • {cls.camera_source}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-[#A7B8AE] mt-2 font-mono">
                      <span>Enrolled: <strong className="text-[#F8FAFC]">{cls.enrolled_count || 32}</strong></span>
                      <span>Status: <strong className={cls.status === 'MONITORING' ? 'text-[#10B981]' : 'text-[#A7B8AE]'}>{cls.status}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onNavigateToReports(1)}
                    className="bg-[#204735] hover:bg-[#10231C] text-[#F8FAFC] text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#294638] transition flex items-center gap-1"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-[#10B981]" /> Reports
                  </button>

                  <button
                    onClick={() => onNavigateToMonitoring(cls.id)}
                    className="bg-[#10B981] hover:bg-[#059669] text-[#0B1713] text-xs font-bold px-3.5 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Monitor Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Recent Observations Queue */}
        <div className="lg:col-span-4 bg-[#17382B] border border-[#294638] rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#294638]">
            <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">Latest Safety Observations</h3>
            <span className="text-[10px] text-[#6EE7B7]">Awaiting Teacher</span>
          </div>

          <div className="mt-3 space-y-2.5">
            {recentEvents.slice(0, 5).map((evt) => (
              <div key={evt.id} className="bg-[#10231C] border border-[#294638] rounded-xl p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#F8FAFC] text-[11px]">{evt.student_name_snapshot}</span>
                  <span className="text-[10px] text-[#A7B8AE] font-mono">{evt.timestamp}</span>
                </div>
                <p className="text-[11px] text-[#A7B8AE] mt-1 italic line-clamp-1">"{evt.ai_observation}"</p>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="text-[#A7B8AE] font-mono">Conf: {Math.round(evt.confidence_score * 100)}%</span>
                  <span
                    className={`font-semibold px-1.5 py-0.5 rounded ${
                      evt.verification_status === 'VERIFIED'
                        ? 'bg-[#10B981]/20 text-[#6EE7B7] border border-[#10B981]/30'
                        : evt.verification_status === 'REJECTED'
                        ? 'bg-[#204735] text-[#A7B8AE]'
                        : 'bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/30'
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
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-[#294638] flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#204735] text-[#10B981] rounded-xl border border-[#294638]">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC] tracking-tight flex items-center gap-2">
                Class Teacher Verified Sleeping Records
                <span className="text-[10px] bg-[#204735] text-[#6EE7B7] font-mono px-2 py-0.5 rounded-full border border-[#294638]">
                  {verifiedSleepingEvents.length} Verified
                </span>
              </h3>
              <p className="text-[11px] text-[#A7B8AE]">
                Official sleeping incidents verified by teachers with recorded justification reason
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {verifiedSleepingEvents.length === 0 ? (
            <div className="py-8 text-center text-[#A7B8AE] text-xs">
              <CheckCircle2 className="w-8 h-8 text-[#10B981]/50 mx-auto mb-2" />
              <p className="font-semibold text-[#F8FAFC]">No verified sleeping records</p>
              <p className="text-[11px] text-[#A7B8AE]">When you verify a student sleeping observation with a reason, it will be officially recorded here.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-[#F8FAFC]">
              <thead className="bg-[#10231C] text-[#A7B8AE] font-mono uppercase text-[10px] border-b border-[#294638]">
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
              <tbody className="divide-y divide-[#294638] font-sans">
                {verifiedSleepingEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-[#204735]/40 transition">
                    <td className="py-3 px-3 font-bold text-[#F8FAFC] whitespace-nowrap">
                      {evt.student_name_snapshot}
                    </td>
                    <td className="py-3 px-3 font-mono text-[#A7B8AE] whitespace-nowrap">{evt.timestamp}</td>
                    <td className="py-3 px-3 font-mono text-[#F8FAFC]">{evt.duration_seconds}s</td>
                    <td className="py-3 px-3 text-[#FBBF24] italic max-w-sm">
                      "{evt.teacher_notes || evt.verification_reason || 'Verified sleeping during lecture'}"
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#10B981] whitespace-nowrap">
                      {evt.verified_by_teacher || 'Class Teacher'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[10px] font-bold bg-[#204735] text-[#6EE7B7] px-2 py-0.5 rounded-full border border-[#10B981]/40">
                        VERIFIED
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedEvent(evt)}
                        className="bg-[#204735] hover:bg-[#10231C] text-[#F8FAFC] px-2.5 py-1 rounded-lg text-xs font-semibold border border-[#294638] transition"
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
