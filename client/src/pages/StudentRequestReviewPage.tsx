import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import {
  GraduationCap, AlertCircle, CheckCircle2, Clock, Send,
  FileQuestion, ShieldCheck, RefreshCw, XCircle, ChevronRight
} from 'lucide-react';

interface StudentRequestReviewPageProps {
  initialEventId?: number;
}

export const StudentRequestReviewPage: React.FC<StudentRequestReviewPageProps> = ({
  initialEventId
}) => {
  const [appeals, setAppeals] = useState<any[]>([]);
  const [eligibleEvents, setEligibleEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form inputs
  const [selectedEventId, setSelectedEventId] = useState<number | string>(initialEventId || '');
  const [reasonCategory, setReasonCategory] = useState<string>('INCORRECT_DETECTION');
  const [explanation, setExplanation] = useState<string>('');

  const fetchAppealsAndEvents = async () => {
    setLoading(true);
    try {
      const [appealsRes, eventsRes] = await Promise.all([
        apiRequest('/students/me/review-appeals'),
        apiRequest('/students/me/activity-records?limit=30')
      ]);
      setAppeals(appealsRes.appeals || []);
      setEligibleEvents(eventsRes.records || []);

      if (initialEventId) {
        setSelectedEventId(initialEventId);
      } else if (eventsRes.records?.length > 0 && !selectedEventId) {
        setSelectedEventId(eventsRes.records[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load appeals data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppealsAndEvents();
  }, [initialEventId]);

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedEventId) {
      setMessage({ text: 'Please select an eligible observation to appeal.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/students/me/review-appeals', {
        method: 'POST',
        body: JSON.stringify({
          event_id: Number(selectedEventId),
          reason_category: reasonCategory,
          explanation: explanation.trim()
        })
      });

      setMessage({ text: res.message || 'Review request submitted successfully.', type: 'success' });
      setExplanation('');
      fetchAppealsAndEvents();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to submit review request.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin" />
        <p className="text-xs font-mono tracking-widest uppercase text-[#6EE7B7]">
          Loading Student Appeal Desk...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#294638]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Request a Review / Student Appeal</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#204735] text-[#10B981] border border-[#10B981]/30">
              Procedural Fairness
            </span>
          </div>
          <p className="text-xs text-[#A7B8AE] mt-1">
            Contest or request human verification of unverified AI vision detections associated with your account.
          </p>
        </div>

        <button
          onClick={fetchAppealsAndEvents}
          className="p-2 bg-[#17382B] hover:bg-[#204735] text-[#A7B8AE] hover:text-[#F8FAFC] rounded-xl border border-[#294638] transition inline-flex items-center gap-1.5 text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
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

      {/* Appeal Submission Form */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-5">
        <div className="pb-3 border-b border-[#294638]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#10B981]" />
            Submit New Observation Appeal
          </h2>
          <p className="text-[11px] text-[#A7B8AE] mt-0.5">
            Select an unverified observation, specify the reason, and provide context for your class teacher.
          </p>
        </div>

        <form onSubmit={handleSubmitAppeal} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Select Observation */}
            <div>
              <label className="block text-xs font-semibold text-[#A7B8AE] mb-1">
                Select Eligible Activity Observation
              </label>
              {eligibleEvents.length === 0 ? (
                <div className="p-2.5 bg-[#10231C] border border-[#294638] rounded-xl text-xs text-[#A7B8AE]">
                  No recorded activity observations available to appeal.
                </div>
              ) : (
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full bg-[#10231C] border border-[#294638] focus:border-[#10B981] rounded-xl px-3 py-2.5 text-xs text-[#F8FAFC] outline-none transition"
                >
                  <option value="">-- Choose Observation Record --</option>
                  {eligibleEvents.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      #{evt.id} • {evt.event_type.replace(/_/g, ' ')} ({evt.timestamp?.slice(0, 16)}) — {evt.verification_status}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Appeal Reason Category */}
            <div>
              <label className="block text-xs font-semibold text-[#A7B8AE] mb-1">
                Reason for Appeal / Contest
              </label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full bg-[#10231C] border border-[#294638] focus:border-[#10B981] rounded-xl px-3 py-2.5 text-xs text-[#F8FAFC] outline-none transition"
              >
                <option value="INCORRECT_DETECTION">Incorrect Detection (False Positive / Looking at Notes)</option>
                <option value="WRONG_STUDENT">Wrong Student Association (Neighboring Seat Confusion)</option>
                <option value="NORMAL_ACTIVITY">Normal Classroom Activity (Taking Lecture Notes)</option>
                <option value="INCORRECT_TIMESTAMP">Incorrect Timestamp or Camera Sync Error</option>
                <option value="OTHER">Other Specific Academic Circumstance</option>
              </select>
            </div>
          </div>

          {/* Written Explanation */}
          <div>
            <label className="block text-xs font-semibold text-[#A7B8AE] mb-1">
              Detailed Written Explanation (Optional but Recommended)
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Explain the classroom context (e.g. 'I was looking down writing notes in my notebook during the algorithm walkthrough, not sleeping.')..."
              className="w-full bg-[#10231C] border border-[#294638] focus:border-[#10B981] rounded-xl p-3 text-xs text-[#F8FAFC] outline-none transition resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-[#A7B8AE]">
              Your class teacher will receive an alert to review the evidence frame.
            </span>
            <button
              type="submit"
              disabled={submitting || eligibleEvents.length === 0}
              className="px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-[#0B1713] text-xs font-bold rounded-xl transition inline-flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Submitting Appeal...' : 'Submit Review Request'}
            </button>
          </div>
        </form>
      </div>

      {/* Submitted Appeals Tracker */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#294638]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
            <FileQuestion className="w-4 h-4 text-[#10B981]" />
            Submitted Appeals & Decision History
          </h2>
          <span className="text-xs text-[#A7B8AE] font-mono">{appeals.length} Appeals Filed</span>
        </div>

        {appeals.length === 0 ? (
          <div className="text-center py-8 bg-[#10231C] rounded-2xl border border-[#294638] space-y-1">
            <CheckCircle2 className="w-8 h-8 text-[#10B981]/50 mx-auto" />
            <p className="text-xs font-semibold text-[#F8FAFC]">No Past Appeals</p>
            <p className="text-[11px] text-[#A7B8AE]">You have not submitted any observation review requests.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appeals.map((app) => (
              <div
                key={app.id}
                className="bg-[#10231C] border border-[#294638] rounded-2xl p-4 transition space-y-2.5"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#6EE7B7] bg-[#204735] px-2 py-0.5 rounded border border-[#294638]">
                      {app.appeal_code}
                    </span>
                    <span className="text-xs font-bold text-[#F8FAFC]">
                      Observation #{app.event_id} ({app.event_type?.replace(/_/g, ' ') || 'Event'})
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#A7B8AE] bg-[#17382B] px-2 py-0.5 rounded">
                      Reason: {app.reason_category?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        app.status === 'RESOLVED'
                          ? 'bg-[#204735] text-[#10B981] border-[#10B981]/40'
                          : app.status === 'REJECTED'
                          ? 'bg-[#F87171]/20 text-[#F87171] border-[#F87171]/40'
                          : 'bg-[#FBBF24]/10 text-[#FBBF24] border-[#FBBF24]/40'
                      }`}
                    >
                      {app.status === 'RESOLVED'
                        ? '✓ RESOLVED'
                        : app.status === 'REJECTED'
                        ? 'REJECTED'
                        : 'UNDER REVIEW'}
                    </span>
                    <span className="text-xs font-mono text-[#A7B8AE]">{app.created_at?.slice(0, 10)}</span>
                  </div>
                </div>

                {app.explanation && (
                  <p className="text-xs text-[#A7B8AE] italic bg-[#0B1713] p-2.5 rounded-xl border border-[#294638]">
                    Student Explanation: "{app.explanation}"
                  </p>
                )}

                {/* Faculty Decision */}
                {app.teacher_notes && (
                  <div className="bg-[#204735] p-3 rounded-xl border border-[#10B981]/40 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#6EE7B7] font-bold text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                        Faculty Review Decision: {app.teacher_decision || 'Reviewed'}
                      </span>
                      <span className="text-[10px] text-[#A7B8AE]">
                        Reviewed by {app.reviewed_by || 'Class Teacher'} on {app.reviewed_at?.slice(0, 16)}
                      </span>
                    </div>
                    <p className="text-[#F8FAFC] italic">"{app.teacher_notes}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
