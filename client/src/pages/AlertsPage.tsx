import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../services/api';
import { DetectedEvent } from '../types';
import { VerificationModal } from '../components/VerificationModal';
import {
  AlertTriangle, ShieldAlert, AlertCircle, Eye, CheckCircle2,
  XCircle, Filter, Search, Clock
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { t } = useLanguage();

  const [events, setEvents] = useState<DetectedEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEvent, setSelectedEvent] = useState<DetectedEvent | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchEvents = async () => {
    try {
      const res = await apiRequest<{ events: DetectedEvent[] }>('/events?limit=50');
      setEvents(res.events || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSubmitDecision = async (
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

  const filteredEvents = events.filter((e) => {
    if (selectedCategory !== 'ALL' && e.category !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && e.verification_status !== selectedStatus) return false;
    if (searchQuery && !e.student_name_snapshot.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-tight">Classroom AI Safety & Attention Alerts</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Review, verify, or dismiss AI-generated observation alerts. All disciplinary decisions require human teacher verification.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex items-center justify-between flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          {['ALL', 'ATTENTION', 'DISTURBANCE', 'SAFETY'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Status:</span>
          {['ALL', 'PENDING', 'VERIFIED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                selectedStatus === st
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
            No events match the selected filter criteria.
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className={`bg-slate-900 border rounded-2xl p-4 shadow-md flex items-center justify-between flex-wrap gap-4 transition ${
                evt.category === 'SAFETY'
                  ? 'border-rose-500/40 hover:border-rose-500/60'
                  : evt.category === 'DISTURBANCE'
                  ? 'border-orange-500/40 hover:border-orange-500/60'
                  : 'border-amber-500/40 hover:border-amber-500/60'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div
                  className={`p-2.5 rounded-xl border ${
                    evt.category === 'SAFETY'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : evt.category === 'DISTURBANCE'
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {evt.category === 'SAFETY' ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : evt.category === 'DISTURBANCE' ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      {evt.student_name_snapshot}
                    </h3>
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-full border border-slate-700">
                      {evt.event_type.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 italic max-w-2xl">"{evt.ai_observation}"</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-2">
                    <span>Duration: <strong className="text-slate-300">{evt.duration_seconds}s</strong></span>
                    <span>Confidence: <strong className="text-slate-300">{Math.round(evt.confidence_score * 100)}%</strong></span>
                    <span>Time: <strong className="text-slate-300">{evt.timestamp}</strong></span>
                  </div>

                  {/* 3 Snapshot Thumbnails Preview */}
                  {(evt as any).snapshots && (evt as any).snapshots.length > 0 && (
                    <div className="flex items-center gap-2 mt-2.5">
                      <span className="text-[10px] text-emerald-400 font-medium font-mono">📸 Evidence Frames:</span>
                      <div className="flex gap-1.5">
                        {(evt as any).snapshots.slice(0, 3).map((snap: any, sIdx: number) => {
                          const imgUrl = typeof snap === 'string' ? snap : (snap.image_data_url || (snap as any).imageDataUrl || '');
                          return (
                            <img
                              key={sIdx}
                              src={imgUrl}
                              alt={`Evidence Frame ${sIdx + 1}`}
                              onClick={() => setSelectedEvent(evt)}
                              className="w-14 h-9 object-cover rounded-md border border-slate-700 hover:border-blue-400 cursor-pointer transition shadow-sm"
                              title={`Click to review Frame ${sIdx + 1}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Teacher Verification Reason Display */}
                  {(evt.teacher_notes || evt.verification_reason) && (
                    <div className="mt-2.5 p-2.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs">
                      <span className="text-emerald-400 font-semibold text-[11px] block">
                        ✓ Teacher Verification Reason ({evt.verified_by_teacher || 'Class Teacher'}):
                      </span>
                      <p className="text-slate-200 text-xs italic mt-0.5 font-medium">
                        "{evt.teacher_notes || evt.verification_reason}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status and Review Button */}
              <div className="flex items-center space-x-3">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    evt.verification_status === 'VERIFIED'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : evt.verification_status === 'REJECTED'
                      ? 'bg-slate-800 text-slate-400 border-slate-700'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {evt.verification_status}
                </span>

                <button
                  onClick={() => setSelectedEvent(evt)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-md flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> Review Snapshots
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedEvent && (
        <VerificationModal
          event={selectedEvent}
          snapshots={(selectedEvent as any)?.snapshots || []}
          onClose={() => setSelectedEvent(null)}
          onSubmitDecision={handleSubmitDecision}
        />
      )}
    </div>
  );
};
