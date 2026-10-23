import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { DetectedEvent } from '../types';
import { AlertCircle, AlertTriangle, ShieldAlert, CheckCircle, XCircle, Clock, Eye, Camera } from 'lucide-react';

interface RealtimeAlertsProps {
  events: DetectedEvent[];
  onReviewEvent: (event: DetectedEvent) => void;
  onQuickVerify: (eventId: number, decision: 'VERIFIED' | 'FALSE_POSITIVE') => void;
}

export const RealtimeAlerts: React.FC<RealtimeAlertsProps> = ({
  events,
  onReviewEvent,
  onQuickVerify,
}) => {
  const { t } = useLanguage();

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'SAFETY':
        return {
          border: 'border-[#F87171]/50 bg-[#204735]/70',
          badge: 'bg-[#F87171]/20 text-[#F87171] border-[#F87171]/40',
          icon: <ShieldAlert className="w-4 h-4 text-[#F87171]" />,
          title: '🔴 Possible Physical Conflict',
        };
      case 'DISTURBANCE':
        return {
          border: 'border-[#FBBF24]/50 bg-[#204735]/70',
          badge: 'bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/40',
          icon: <AlertCircle className="w-4 h-4 text-[#FBBF24]" />,
          title: '🟠 Possible Classroom Disturbance',
        };
      default:
        return {
          border: 'border-[#FBBF24]/40 bg-[#204735]/60',
          badge: 'bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/30',
          icon: <AlertTriangle className="w-4 h-4 text-[#FBBF24]" />,
          title: '🟡 Possible Prolonged Eye Closure (Suspected)',
        };
    }
  };

  return (
    <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-[#294638]">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-[#204735] border border-[#294638] text-[#FBBF24] rounded-xl">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F8FAFC] tracking-tight">Real-Time Teacher Alerts</h3>
            <p className="text-[11px] text-[#A7B8AE]">Live AI Observations • Teacher Verification Required</p>
          </div>
        </div>

        <span className="text-xs bg-[#10231C] text-[#6EE7B7] font-mono px-2.5 py-1 rounded-full border border-[#294638]">
          {events.length} Alert{events.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Safety Notice Reminder */}
      <div className="mt-3 p-2.5 bg-[#204735] border border-[#294638] rounded-xl text-[11px] text-[#A7B8AE] leading-tight">
        ⚖️ <strong className="text-[#6EE7B7]">AI Safety Rule:</strong> All alerts are preliminary observations. A human teacher must review before any confirmation.
      </div>

      {/* Alerts Stream List */}
      <div className="mt-3 space-y-3 overflow-y-auto max-h-[580px] pr-1 no-scrollbar">
        {events.length === 0 ? (
          <div className="text-center py-12 text-[#A7B8AE] text-xs">
            <CheckCircle className="w-8 h-8 text-[#10B981]/50 mx-auto mb-2" />
            <p className="font-semibold text-[#F8FAFC]">No active alerts</p>
            <p className="text-[11px] text-[#A7B8AE]">Classroom engagement and safety within normal parameters.</p>
          </div>
        ) : (
          events.map((evt) => {
            const style = getCategoryStyles(evt.category);
            const isPending = evt.verification_status === 'PENDING';

            return (
              <div
                key={evt.id}
                className={`border rounded-2xl p-3.5 transition-all shadow-sm relative overflow-hidden ${style.border}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {style.icon}
                    <h4 className="text-xs font-bold text-[#F8FAFC] tracking-tight">{style.title}</h4>
                  </div>
                </div>

                <div className="mt-2 text-xs space-y-1">
                  <p className="text-[#F8FAFC]">
                    <span className="text-[#A7B8AE] font-medium">Student: </span>
                    <strong className="text-[#6EE7B7]">{evt.student_name_snapshot}</strong>
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-[#A7B8AE] font-mono">
                    <span>Duration: <strong className="text-[#F8FAFC]">{evt.duration_seconds}s</strong></span>
                    <span>Confidence: <strong className="text-[#F8FAFC]">{Math.round(evt.confidence_score * 100)}%</strong></span>
                    <span>Camera: <strong className="text-[#F8FAFC]">{evt.camera_id}</strong></span>
                  </div>

                  <p className="text-[11px] text-[#A7B8AE] italic mt-1 line-clamp-2">
                    "{evt.ai_observation}"
                  </p>
                </div>

                {/* Automatic Evidence Screenshots Preview (3 Frames) */}
                {(evt as any).snapshots && (evt as any).snapshots.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-[#294638]">
                    <div className="flex items-center justify-between text-[10px] text-[#A7B8AE] mb-1.5 font-medium">
                      <span className="flex items-center gap-1 text-[#6EE7B7] font-semibold">
                        <Camera className="w-3 h-3 text-[#10B981]" />
                        3 Auto Evidence Frames:
                      </span>
                      <span className="text-[#A7B8AE] font-mono text-[9px]">Click frame to inspect</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(evt as any).snapshots.slice(0, 3).map((snap: any, sIdx: number) => {
                        const imgUrl = typeof snap === 'string' ? snap : (snap.image_data_url || snap.imageDataUrl || '');
                        return (
                          <div
                            key={sIdx}
                            onClick={() => onReviewEvent(evt)}
                            className="group relative cursor-pointer aspect-video bg-[#10231C] rounded-lg overflow-hidden border border-[#294638] hover:border-[#10B981] transition shadow-inner"
                            title={`Inspect Frame ${sIdx + 1}`}
                          >
                            <img
                              src={imgUrl}
                              alt={`Evidence Frame ${sIdx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-[#6EE7B7] text-[8px] font-mono px-1 rounded">
                              #{sIdx + 1}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Verification Status or Actions */}
                <div className="mt-3 pt-2.5 border-t border-[#294638] flex items-center justify-between">
                  <div>
                    {evt.verification_status === 'VERIFIED' && (
                      <span className="text-[11px] font-semibold text-[#10B981] flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Verified by Teacher
                      </span>
                    )}
                    {evt.verification_status === 'REJECTED' && (
                      <span className="text-[11px] font-semibold text-[#A7B8AE] flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> False Positive
                      </span>
                    )}
                    {evt.verification_status === 'PENDING' && (
                      <span className="text-[11px] font-semibold text-[#FBBF24] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Needs Verification
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onReviewEvent(evt)}
                      className="bg-[#204735] hover:bg-[#10231C] text-[#F8FAFC] text-xs font-medium px-2.5 py-1 rounded-lg border border-[#294638] transition flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3 text-[#10B981]" /> Review
                    </button>

                    {isPending && (
                      <>
                        <button
                          onClick={() => onQuickVerify(evt.id, 'VERIFIED')}
                          className="bg-[#10B981] hover:bg-[#059669] text-[#0B1713] text-xs font-bold px-2.5 py-1 rounded-lg transition shadow-xs"
                          title="Verify as true observation"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => onQuickVerify(evt.id, 'FALSE_POSITIVE')}
                          className="bg-[#10231C] hover:bg-[#F87171]/20 text-[#A7B8AE] hover:text-[#F87171] text-xs px-2 py-1 rounded-lg border border-[#294638] transition"
                          title="Mark false positive"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
