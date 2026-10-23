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
          border: 'border-rose-500/50 bg-rose-950/20',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
          title: '🔴 Possible Physical Conflict',
        };
      case 'DISTURBANCE':
        return {
          border: 'border-orange-500/50 bg-orange-950/20',
          badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          icon: <AlertCircle className="w-4 h-4 text-orange-400" />,
          title: '🟠 Possible Classroom Disturbance',
        };
      default:
        return {
          border: 'border-amber-500/50 bg-amber-950/20',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          title: '🟡 Possible Prolonged Eye Closure',
        };
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Real-Time Teacher Alerts</h3>
            <p className="text-[11px] text-slate-400">Live AI Observations • Teacher Verification Required</p>
          </div>
        </div>

        <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2.5 py-1 rounded-full border border-slate-700">
          {events.length} Alert{events.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Safety Notice Reminder */}
      <div className="mt-3 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[11px] text-blue-300 leading-tight">
        ⚖️ <strong>AI Safety Rule:</strong> All alerts are preliminary observations. A human teacher must review before any confirmation.
      </div>

      {/* Alerts Stream List */}
      <div className="mt-3 space-y-3 overflow-y-auto max-h-[580px] pr-1">
        {events.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            <CheckCircle className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
            <p className="font-semibold text-slate-400">No active alerts</p>
            <p className="text-[11px]">Classroom engagement and safety within normal parameters.</p>
          </div>
        ) : (
          events.map((evt) => {
            const style = getCategoryStyles(evt.category);
            const isPending = evt.verification_status === 'PENDING';

            return (
              <div
                key={evt.id}
                className={`border rounded-2xl p-3.5 transition-all shadow-md relative overflow-hidden ${style.border}`}
              >

                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {style.icon}
                    <h4 className="text-xs font-bold text-white tracking-tight">{style.title}</h4>
                  </div>
                </div>

                <div className="mt-2 text-xs space-y-1">
                  <p className="text-slate-200">
                    <span className="text-slate-400 font-medium">Student: </span>
                    <strong className="text-white">{evt.student_name_snapshot}</strong>
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span>Duration: <strong className="text-slate-200">{evt.duration_seconds}s</strong></span>
                    <span>Confidence: <strong className="text-slate-200">{Math.round(evt.confidence_score * 100)}%</strong></span>
                    <span>Camera: <strong className="text-slate-200">{evt.camera_id}</strong></span>
                  </div>

                  <p className="text-[11px] text-slate-400 italic mt-1 line-clamp-2">
                    "{evt.ai_observation}"
                  </p>
                </div>

                {/* Automatic Evidence Screenshots Preview (3 Frames) */}
                {(evt as any).snapshots && (evt as any).snapshots.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5 font-medium">
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <Camera className="w-3 h-3 text-emerald-400" />
                        3 Auto Evidence Frames:
                      </span>
                      <span className="text-slate-500 font-mono text-[9px]">Click frame to inspect</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(evt as any).snapshots.slice(0, 3).map((snap: any, sIdx: number) => {
                        const imgUrl = typeof snap === 'string' ? snap : (snap.image_data_url || snap.imageDataUrl || '');
                        return (
                          <div
                            key={sIdx}
                            onClick={() => onReviewEvent(evt)}
                            className="group relative cursor-pointer aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-700/80 hover:border-emerald-500 transition shadow-inner"
                            title={`Inspect Frame ${sIdx + 1}`}
                          >
                            <img
                              src={imgUrl}
                              alt={`Evidence Frame ${sIdx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <span className="absolute bottom-0.5 right-0.5 bg-black/75 text-emerald-300 text-[8px] font-mono px-1 rounded">
                              #{sIdx + 1}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Verification Status or Actions */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    {evt.verification_status === 'VERIFIED' && (
                      <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Verified by Teacher
                      </span>
                    )}
                    {evt.verification_status === 'REJECTED' && (
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> False Positive
                      </span>
                    )}
                    {evt.verification_status === 'PENDING' && (
                      <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Needs Verification
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onReviewEvent(evt)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-700 transition flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> Review
                    </button>

                    {isPending && (
                      <>
                        <button
                          onClick={() => onQuickVerify(evt.id, 'VERIFIED')}
                          className="bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs font-semibold px-2 py-1 rounded-lg border border-emerald-500/40 transition"
                          title="Verify as true observation"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => onQuickVerify(evt.id, 'FALSE_POSITIVE')}
                          className="bg-slate-800 hover:bg-rose-500/30 text-slate-400 hover:text-rose-300 text-xs px-2 py-1 rounded-lg border border-slate-700 transition"
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
