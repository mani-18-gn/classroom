import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../services/api';
import { DetectedEvent } from '../types';
import { VerificationModal } from '../components/VerificationModal';
import {
  History, Filter, Search, Eye, CheckCircle2, XCircle, Clock,
  Calendar, Download, ShieldAlert, AlertTriangle, AlertCircle
} from 'lucide-react';

export const EventHistoryPage: React.FC = () => {
  const { t } = useLanguage();
  const [events, setEvents] = useState<DetectedEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<DetectedEvent | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await apiRequest<{ events: DetectedEvent[] }>('/events?limit=100');
        setEvents(res.events || []);
      } catch (err) {
        console.error('Error fetching event history:', err);
      }
    };
    fetchEvents();
  }, []);

  const handleDecision = async (
    eventId: number,
    decision: 'VERIFIED' | 'FALSE_POSITIVE' | 'NEEDS_REVIEW',
    notes: string
  ) => {
    await apiRequest(`/events/${eventId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ decision, notes }),
    });

    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              verification_status:
                decision === 'VERIFIED'
                  ? 'VERIFIED'
                  : decision === 'FALSE_POSITIVE'
                  ? 'REJECTED'
                  : 'NEEDS_REVIEW',
            }
          : e
      )
    );
  };

  const filtered = events.filter((e) => {
    if (filterType !== 'ALL' && e.event_type !== filterType) return false;
    if (filterStatus !== 'ALL' && e.verification_status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-tight">Academic Safety & Attention Event History</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Complete historical timeline of AI detected observations and teacher verification decisions.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex items-center justify-between flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-semibold">Event Type:</span>
          {['ALL', 'PROLONGED_EYE_CLOSURE', 'CLASSROOM_DISTURBANCE', 'PHYSICAL_CONFLICT'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {type === 'ALL' ? 'All Types' : type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Status:</span>
          {['ALL', 'PENDING', 'VERIFIED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterStatus === st
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-3">Time</th>
              <th className="py-3 px-3">Student Name</th>
              <th className="py-3 px-3">Event Type</th>
              <th className="py-3 px-3">Duration</th>
              <th className="py-3 px-3">Teacher Verification Reason</th>
              <th className="py-3 px-3">Teacher Verdict</th>
              <th className="py-3 px-3 text-right">Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((evt) => (
              <tr key={evt.id} className="hover:bg-slate-800/40 transition">
                <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">{evt.timestamp}</td>
                <td className="py-3 px-3 font-semibold text-white whitespace-nowrap">
                  {evt.student_name_snapshot}
                </td>
                <td className="py-3 px-3 whitespace-nowrap">
                  <span className="flex items-center gap-1.5">
                    {evt.category === 'SAFETY' ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    ) : evt.category === 'DISTURBANCE' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>{evt.event_type.replace(/_/g, ' ')}</span>
                  </span>
                </td>
                <td className="py-3 px-3 font-mono">{evt.duration_seconds}s</td>
                <td className="py-3 px-3 text-amber-200 italic max-w-xs">
                  {evt.teacher_notes || evt.verification_reason ? (
                    <div>
                      <span>"{evt.teacher_notes || evt.verification_reason}"</span>
                      {evt.verified_by_teacher && (
                        <span className="block text-[10px] text-emerald-400 font-sans not-italic">
                          by {evt.verified_by_teacher}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-500 not-italic font-sans text-[11px]">—</span>
                  )}
                </td>
                <td className="py-3 px-3 whitespace-nowrap">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      evt.verification_status === 'VERIFIED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : evt.verification_status === 'REJECTED'
                        ? 'bg-slate-800 text-slate-400 border-slate-700'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {evt.verification_status}
                  </span>
                </td>
                <td className="py-3 px-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => setSelectedEvent(evt)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-700 transition"
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedEvent && (
        <VerificationModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onSubmitDecision={handleDecision}
        />
      )}
    </div>
  );
};
