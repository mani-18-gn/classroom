import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { DetectedEvent } from '../types';
import { VerificationModal } from '../components/VerificationModal';
import {
  ShieldAlert, AlertTriangle, AlertCircle
} from 'lucide-react';

export const EventHistoryPage: React.FC = () => {
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
      <div className="pb-4 border-b border-[#294638]">
        <h1 className="text-xl font-bold text-[#F8FAFC] tracking-tight">Academic Safety & Attention Event History</h1>
        <p className="text-xs text-[#A7B8AE] mt-0.5">
          Complete historical timeline of AI detected observations and teacher verification decisions.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#17382B] border border-[#294638] rounded-2xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[#A7B8AE] font-semibold">Event Type:</span>
          {['ALL', 'PROLONGED_EYE_CLOSURE', 'CLASSROOM_DISTURBANCE', 'PHYSICAL_CONFLICT'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterType === type
                  ? 'bg-[#10B981] text-[#0B1713] font-bold shadow-xs'
                  : 'bg-[#10231C] text-[#A7B8AE] hover:text-[#F8FAFC] border border-[#294638]'
              }`}
            >
              {type === 'ALL' ? 'All Types' : type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#A7B8AE] font-semibold">Status:</span>
          {['ALL', 'PENDING', 'VERIFIED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterStatus === st
                  ? 'bg-[#10B981] text-[#0B1713] font-bold shadow-xs'
                  : 'bg-[#10231C] text-[#A7B8AE] hover:text-[#F8FAFC] border border-[#294638]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-5 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs text-[#F8FAFC]">
          <thead className="bg-[#10231C] text-[#A7B8AE] font-mono uppercase text-[10px] border-b border-[#294638]">
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
          <tbody className="divide-y divide-[#294638]">
            {filtered.map((evt) => (
              <tr key={evt.id} className="hover:bg-[#204735]/40 transition">
                <td className="py-3 px-3 font-mono text-[#A7B8AE] whitespace-nowrap">{evt.timestamp}</td>
                <td className="py-3 px-3 font-semibold text-[#F8FAFC] whitespace-nowrap">
                  {evt.student_name_snapshot}
                </td>
                <td className="py-3 px-3 whitespace-nowrap">
                  <span className="flex items-center gap-1.5">
                    {evt.category === 'SAFETY' ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-[#F87171]" />
                    ) : evt.category === 'DISTURBANCE' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-[#FBBF24]" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-[#FBBF24]" />
                    )}
                    <span>{evt.event_type.replace(/_/g, ' ')}</span>
                  </span>
                </td>
                <td className="py-3 px-3 font-mono">{evt.duration_seconds}s</td>
                <td className="py-3 px-3 text-[#FBBF24] italic max-w-xs">
                  {evt.teacher_notes || evt.verification_reason ? (
                    <div>
                      <span>"{evt.teacher_notes || evt.verification_reason}"</span>
                      {evt.verified_by_teacher && (
                        <span className="block text-[10px] text-[#10B981] font-sans not-italic">
                          by {evt.verified_by_teacher}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[#A7B8AE] not-italic font-sans text-[11px]">—</span>
                  )}
                </td>
                <td className="py-3 px-3 whitespace-nowrap">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      evt.verification_status === 'VERIFIED'
                        ? 'bg-[#204735] text-[#6EE7B7] border border-[#10B981]/40'
                        : evt.verification_status === 'REJECTED'
                        ? 'bg-[#10231C] text-[#A7B8AE] border border-[#294638]'
                        : 'bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/30'
                    }`}
                  >
                    {evt.verification_status}
                  </span>
                </td>
                <td className="py-3 px-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => setSelectedEvent(evt)}
                    className="bg-[#204735] hover:bg-[#10231C] text-[#F8FAFC] px-2.5 py-1 rounded-lg text-xs font-medium border border-[#294638] transition"
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
