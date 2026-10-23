import React, { useState, useEffect } from 'react';
import { DetectedEvent, EventSnapshot } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../services/api';
import { X, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Camera, Clock, User, Calendar, Loader2 } from 'lucide-react';

interface VerificationModalProps {
  event: DetectedEvent | null;
  snapshots?: EventSnapshot[];
  onClose: () => void;
  onSubmitDecision: (eventId: number, decision: 'VERIFIED' | 'FALSE_POSITIVE' | 'NEEDS_REVIEW', notes: string) => Promise<void>;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  event,
  snapshots = [],
  onClose,
  onSubmitDecision,
}) => {
  const { t } = useLanguage();
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedSnapshotIndex, setSelectedSnapshotIndex] = useState<number>(0);
  const [eventSnapshots, setEventSnapshots] = useState<EventSnapshot[]>(snapshots);
  const [loadingSnapshots, setLoadingSnapshots] = useState<boolean>(false);

  useEffect(() => {
    if (snapshots && snapshots.length > 0) {
      setEventSnapshots(snapshots);
      return;
    }
    if ((event as any)?.snapshots && (event as any).snapshots.length > 0) {
      setEventSnapshots((event as any).snapshots);
      return;
    }
    if (event && event.id) {
      setLoadingSnapshots(true);
      apiRequest<{ event: any; snapshots: EventSnapshot[] }>(`/events/${event.id}`)
        .then((res) => {
          if (res && res.snapshots && res.snapshots.length > 0) {
            setEventSnapshots(res.snapshots);
          }
        })
        .catch((err) => console.warn('Could not fetch event snapshots:', err))
        .finally(() => setLoadingSnapshots(false));
    }
  }, [event, snapshots]);

  if (!event) return null;

  const isSleepingEvent = event?.event_type === 'PROLONGED_EYE_CLOSURE' || event?.category === 'ATTENTION';

  const handleDecision = async (decision: 'VERIFIED' | 'FALSE_POSITIVE' | 'NEEDS_REVIEW') => {
    let finalNotes = notes.trim();
    if (decision === 'VERIFIED' && !finalNotes) {
      finalNotes = isSleepingEvent
        ? 'Class teacher verified student was sleeping during lecture'
        : 'Class teacher verified observation';
    } else if (decision === 'FALSE_POSITIVE' && !finalNotes) {
      finalNotes = 'Class teacher dismissed observation as normal attentive behavior / false positive';
    }
    setSubmitting(true);
    try {
      await onSubmitDecision(event.id, decision, finalNotes);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const displaySnapshots = eventSnapshots;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Teacher Verification Review
                </h3>
                <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-full border border-slate-700">
                  EVENT #{event.id}
                </span>
              </div>
              <p className="text-xs text-slate-400">Classroom Safety & Attention Observation Record</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Observation Card */}
        <div className="mt-4 bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-slate-300">AI Observation Note:</span>
            <span className="font-mono text-blue-400">Confidence: {Math.round(event.confidence_score * 100)}%</span>
          </div>
          <p className="text-xs font-medium text-slate-200 leading-relaxed italic">
            "{event.ai_observation}"
          </p>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-700/60 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Student</span>
              <strong className="text-white">{event.student_name_snapshot}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Duration</span>
              <strong className="text-white">{event.duration_seconds} sec</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Camera Source</span>
              <strong className="text-white">{event.camera_id}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Current Status</span>
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                {event.verification_status}
              </span>
            </div>
          </div>
        </div>

        {/* Snapshot Gallery Carousel */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="font-semibold text-slate-300">Event Frame Snapshots (1-3 Captured Frames):</span>
            <span className="text-[11px] text-slate-500 italic">Auto-purged after retention period</span>
          </div>

          <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 flex flex-col items-center">
            {loadingSnapshots ? (
              <div className="w-full h-56 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                <span className="text-xs">Loading captured evidence frames...</span>
              </div>
            ) : displaySnapshots.length === 0 ? (
              <div className="w-full h-56 flex flex-col items-center justify-center text-slate-500 gap-2">
                <Camera className="w-8 h-8 opacity-40 text-slate-400" />
                <span className="text-xs font-medium text-slate-400">No snapshot frames captured for this event.</span>
              </div>
            ) : (
              <>
                <div className="relative w-full h-56 flex items-center justify-center rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                  <img
                    src={displaySnapshots[selectedSnapshotIndex]?.image_data_url || (displaySnapshots[selectedSnapshotIndex] as any)}
                    alt="Event Snapshot"
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm border border-slate-700 text-slate-200 text-[10px] font-mono px-2 py-0.5 rounded-md">
                    📸 Frame {selectedSnapshotIndex + 1} of {displaySnapshots.length}
                  </div>
                </div>

                {/* Thumbnail selector */}
                <div className="flex space-x-2.5 mt-3">
                  {displaySnapshots.map((snap, idx) => {
                    const imgUrl = typeof snap === 'string' ? snap : (snap.image_data_url || (snap as any).imageDataUrl || '');
                    return (
                      <button
                        key={(snap as any).id || idx}
                        onClick={() => setSelectedSnapshotIndex(idx)}
                        className={`group relative w-20 h-14 rounded-lg overflow-hidden border-2 transition ${
                          selectedSnapshotIndex === idx
                            ? 'border-blue-500 ring-2 ring-blue-500/30 scale-105'
                            : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={imgUrl} alt={`Frame ${idx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0.5 right-1 bg-black/80 text-[9px] font-mono text-slate-300 px-1 rounded">
                          Frame {idx + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Reason Presets for Teacher Verification */}
        {isSleepingEvent && (
          <div className="mt-3.5">
            <label className="block text-[11px] font-bold text-amber-300 mb-1.5 flex items-center gap-1.5">
              <span>💤 Quick Sleeping Verification Reasons (Click to select):</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Student was sleeping with head rested on desk',
                'Continuous eye closure exceeding 5s during lecture',
                'Student visibly asleep and unresponsive to teacher',
                'Fatigued after exam / slumped asleep on notebook',
              ].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setNotes(preset)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition text-left ${
                    notes === preset
                      ? 'bg-amber-500/25 text-amber-200 border-amber-500/60 font-semibold ring-1 ring-amber-500/40'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Teacher Notes Input */}
        <div className="mt-3.5">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span>
              Teacher Verification Reason <strong className="text-emerald-400 font-normal">(Recorded in Student, Teacher & Admin)</strong>:
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Official audit reason</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              isSleepingEvent
                ? "Enter or select reason verifying student was sleeping (e.g., student was sleeping with head down on desk)..."
                : "E.g., Student was checking class notebook notes; or student appeared fatigued..."
            }
            rows={2}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Official Multi-Portal Record Guarantee Banner */}
        <div className="mt-3.5 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-[11px] text-emerald-300">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
          <span>
            <strong>Official Record Guarantee:</strong> When you click <strong>[Confirm & Verify Observation]</strong>, this verified record will be officially recorded in the <strong>Student Portal</strong>, <strong>Class Teacher Dashboard</strong>, and <strong>Super Admin Governance Portal</strong> with your verification reason.
          </span>
        </div>

        {/* Decision Action Buttons */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl transition"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2">
            <button
              disabled={submitting}
              onClick={() => handleDecision('FALSE_POSITIVE')}
              className="flex items-center space-x-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold px-3.5 py-2 rounded-xl transition disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>Mark False Positive</span>
            </button>

            <button
              disabled={submitting}
              onClick={() => handleDecision('NEEDS_REVIEW')}
              className="flex items-center space-x-1.5 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 text-xs font-bold px-3.5 py-2 rounded-xl transition disabled:opacity-50"
            >
              <Clock className="w-4 h-4" />
              <span>Needs Further Review</span>
            </button>

            <button
              disabled={submitting}
              onClick={() => handleDecision('VERIFIED')}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Verify Observation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
