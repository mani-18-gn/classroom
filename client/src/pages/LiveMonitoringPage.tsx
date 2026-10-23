import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PrivacyBanner } from '../components/PrivacyBanner';
import { CameraFeed } from '../components/CameraFeed';
import { RealtimeAlerts } from '../components/RealtimeAlerts';
import { SeatingHeatmap } from '../components/SeatingHeatmap';
import { VerificationModal } from '../components/VerificationModal';
import { apiRequest } from '../services/api';
import { DetectedEvent } from '../types';
import {
  Activity, Users, AlertCircle, BookmarkPlus,
  Flame, FileText
} from 'lucide-react';

interface LiveMonitoringPageProps {
  onOpenReport?: (sessionId: number) => void;
}

export const LiveMonitoringPage: React.FC<LiveMonitoringPageProps> = ({ onOpenReport }) => {
  const { t } = useLanguage();

  const [activeSessionId, setActiveSessionId] = useState<number>(1);
  const [events, setEvents] = useState<DetectedEvent[]>([]);
  const [authorizedStudents, setAuthorizedStudents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<DetectedEvent | null>(null);

  // Live Aggregate Telemetry (Updated dynamically by real camera inference)
  const [metrics, setMetrics] = useState({
    attentionScore: 0,
    drowsinessRate: 0,
    noiseLevel: 'QUIET' as 'QUIET' | 'MODERATE' | 'LOUD',
    visibleStudents: 0,
  });

  // Timeline Markers added by teacher
  const [markers, setMarkers] = useState<any[]>([]);
  const [markerInput, setMarkerInput] = useState('');

  // Fetch initial data & authorized consented students
  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentRes = await apiRequest<{ authorizedStudents: any[] }>('/students/authorized-match-list');
        setAuthorizedStudents(studentRes.authorizedStudents || []);

        const eventsRes = await apiRequest<{ events: DetectedEvent[] }>('/events?limit=25');
        setEvents(eventsRes.events || []);

        // Load real markers from active session
        try {
          const sessionRes = await apiRequest<any>(`/monitoring/${activeSessionId}`);
          if (sessionRes?.markers) {
            setMarkers(sessionRes.markers.map((m: any) => ({
              id: m.id,
              title: m.title,
              time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            })));
          }
        } catch (mErr) {}
      } catch (err) {
        console.warn('API fetch warning:', err);
      }
    };
    fetchData();
  }, [activeSessionId]);

  // Handle Event Detected from CameraFeed
  const handleEventDetected = async (eventData: any) => {
    try {
      const res = await apiRequest<{ message: string; eventId: number }>('/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      });

      const generatedSnapshots = (eventData.snapshots || []).map((snap: string, idx: number) => ({
        id: idx + 1,
        event_id: res.eventId || Date.now(),
        snapshot_index: idx + 1,
        image_data_url: snap,
        captured_at: new Date().toISOString()
      }));

      const newEvent: DetectedEvent & { snapshots?: any[] } = {
        id: res.eventId || Date.now(),
        session_id: activeSessionId,
        student_id: eventData.student_id,
        student_name_snapshot: eventData.student_name_snapshot,
        event_type: eventData.event_type,
        category: eventData.category,
        confidence_score: eventData.confidence_score,
        duration_seconds: eventData.duration_seconds,
        verification_status: 'PENDING',
        ai_observation: eventData.ai_observation,
        camera_id: eventData.camera_id,
        timestamp: new Date().toLocaleTimeString(),
        is_simulated: eventData.is_simulated,
        snapshot_count: generatedSnapshots.length,
        snapshots: generatedSnapshots
      };

      setEvents((prev) => [newEvent as any, ...prev]);
    } catch (err) {
      console.error('Failed to post detected event:', err);
    }
  };

  // Submit Teacher Decision
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
    } catch (err) {
      console.error('Error verifying event:', err);
    }
  };

  // Quick Verification from card: opens review modal for confirmation with reason
  const handleQuickVerify = async (eventId: number, decision: 'VERIFIED' | 'FALSE_POSITIVE') => {
    const targetEvt = events.find((e) => e.id === eventId);
    if (decision === 'VERIFIED' && targetEvt) {
      setSelectedEvent(targetEvt);
      return;
    }
    await handleSubmitDecision(
      eventId,
      decision,
      decision === 'VERIFIED'
        ? 'Class teacher verified student was sleeping during lecture'
        : 'Class teacher marked as false positive / normal attentive behavior'
    );
  };

  // Add Lecture Pace Timestamp Marker
  const handleAddMarker = async () => {
    if (!markerInput.trim()) return;
    try {
      await apiRequest(`/monitoring/${activeSessionId}/timeline-marker`, {
        method: 'POST',
        body: JSON.stringify({
          marker_type: 'TEACHER_NOTE',
          title: markerInput,
        }),
      });

      setMarkers((prev) => [
        ...prev,
        { id: Date.now(), title: markerInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
      setMarkerInput('');
    } catch (e) {
      // offline fallback
      setMarkers((prev) => [
        ...prev,
        { id: Date.now(), title: markerInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
      setMarkerInput('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Privacy Guarantee Banner */}
      <PrivacyBanner />

      {/* Aggregate Metric Cards Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attention Score */}
        <div className="bg-[#17382B] border border-[#294638] rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] text-[#A7B8AE] font-medium">{t.metrics.attentionScore}</p>
            <p className="text-2xl font-bold font-mono text-[#F8FAFC] mt-0.5">{metrics.attentionScore}%</p>
            <span className="text-[10px] text-[#6EE7B7] font-medium">▲ +4% above semester avg</span>
          </div>
          <div className="p-3 bg-[#204735] text-[#10B981] rounded-2xl border border-[#294638]">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Drowsiness Rate */}
        <div className="bg-[#17382B] border border-[#294638] rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] text-[#A7B8AE] font-medium">{t.metrics.drowsinessRate}</p>
            <p className="text-2xl font-bold font-mono text-[#F8FAFC] mt-0.5">{metrics.drowsinessRate}%</p>
            <span className="text-[10px] text-[#6EE7B7] font-medium">Nominal (&lt;10%)</span>
          </div>
          <div className="p-3 bg-[#204735] text-[#FBBF24] rounded-2xl border border-[#294638]">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Noise Level */}
        <div className="bg-[#17382B] border border-[#294638] rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] text-[#A7B8AE] font-medium">{t.metrics.noiseLevel}</p>
            <p className="text-2xl font-bold font-mono text-[#F8FAFC] mt-0.5">{metrics.noiseLevel}</p>
            <span className="text-[10px] text-[#A7B8AE] font-medium">Ambient Laptop Mic</span>
          </div>
          <div className="p-3 bg-[#204735] text-[#6EE7B7] rounded-2xl border border-[#294638]">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        {/* Students Detected In Frame */}
        <div className="bg-[#17382B] border border-[#294638] rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] text-[#A7B8AE] font-medium">{t.metrics.studentsDetected}</p>
            <p className="text-2xl font-bold font-mono text-[#F8FAFC] mt-0.5">{metrics.visibleStudents} / 32</p>
            <span className="text-[10px] text-[#A7B8AE] font-medium">Room 402 AI Lab</span>
          </div>
          <div className="p-3 bg-[#204735] text-[#10B981] rounded-2xl border border-[#294638]">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Live Camera Stream & Real-Time Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Camera & Seating Heatmap */}
        <div className="lg:col-span-7 space-y-6">
          <CameraFeed
            sessionId={activeSessionId}
            authorizedStudents={authorizedStudents}
            onEventDetected={handleEventDetected}
            onMetricsUpdate={(newM) => setMetrics((m) => ({ ...m, ...newM }))}
          />

          {/* Spatial Classroom Seating Heatmap */}
          <SeatingHeatmap />

          {/* Lecture Pace Timestamp Markers (Topic Tracker) */}
          <div className="bg-[#17382B] border border-[#294638] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-4 h-4 text-[#10B981]" />
                <h4 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
                  Lecture Pace & Topic Markers (Pace Correlation)
                </h4>
              </div>
              <button
                onClick={() => onOpenReport && onOpenReport(activeSessionId)}
                className="text-xs text-[#6EE7B7] hover:text-[#10B981] flex items-center gap-1 font-medium transition"
              >
                <FileText className="w-3.5 h-3.5" /> View Session Summary Report
              </button>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={markerInput}
                onChange={(e) => setMarkerInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMarker()}
                placeholder="E.g. Started new topic, Gave live example, Interactive quiz..."
                className="flex-1 bg-[#10231C] border border-[#294638] rounded-xl px-3 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#10B981]"
              />
              <button
                onClick={handleAddMarker}
                className="bg-[#10B981] hover:bg-[#059669] text-[#0B1713] text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-xs"
              >
                Mark Timestamp
              </button>
            </div>

            {/* List of recent markers */}
            <div className="flex flex-wrap gap-2">
              {markers.map((m) => (
                <div
                  key={m.id}
                  className="bg-[#10231C] border border-[#294638] px-2.5 py-1 rounded-lg text-[11px] text-[#F8FAFC] flex items-center gap-1.5"
                >
                  <span className="text-[#6EE7B7] font-mono text-[10px]">{m.time}</span>
                  <span>{m.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Alerts Stream */}
        <div className="lg:col-span-5 h-[840px] sticky top-20">
          <RealtimeAlerts
            events={events}
            onReviewEvent={(evt) => setSelectedEvent(evt)}
            onQuickVerify={handleQuickVerify}
          />
        </div>
      </div>

      {/* Verification Modal */}
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
