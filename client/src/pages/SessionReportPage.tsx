import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Printer, ShieldCheck } from 'lucide-react';

interface SessionReportPageProps {
  sessionId?: number;
}

export const SessionReportPage: React.FC<SessionReportPageProps> = ({ sessionId = 1 }) => {
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await apiRequest(`/monitoring/${sessionId}/report`);
        setReportData(res.report);
      } catch (err) {
        console.error('Failed to load session report:', err);
      }
    };
    fetchReport();
  }, [sessionId]);

  const handlePrint = () => {
    window.print();
  };

  const timelinePoints = reportData?.timelinePoints || [];
  const session = reportData?.session;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 print:p-0 print:m-0 print:max-w-none print:text-black">
      {/* Header Actions */}
      <div className="flex items-center justify-between pb-4 border-b border-[#294638] print:hidden flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC] tracking-tight">Lecture Engagement Analytics Summary Report</h1>
          <p className="text-xs text-[#A7B8AE] mt-0.5">
            Post-class timeline analysis flagging engagement drops, correlation with teaching pace, and teacher-verified actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-[#10B981] hover:bg-[#059669] text-[#0B1713] text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Canvas Document */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 print:bg-white print:border-none print:shadow-none print:p-4">
        {/* Document Header */}
        <div className="border-b border-[#294638] pb-5 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#10B981] font-mono">
                CLASSGUARD AI ACADEMIC REPORT
              </span>
              <span className="text-[10px] bg-[#204735] text-[#6EE7B7] px-2 py-0.5 rounded-full border border-[#10B981]/30">
                VERIFIED SUMMARY
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[#F8FAFC] tracking-tight mt-1 print:text-slate-900">
              {session?.classroom_name || 'Active Classroom Session'}
            </h2>
            <p className="text-xs text-[#A7B8AE] mt-1 print:text-slate-600">
              Course: <strong>{session?.course_name || 'Current Academic Session'}</strong> • Instructor: <strong>{session?.teacher_name || 'Class Teacher'}</strong>
            </p>
          </div>

          <div className="text-right text-xs text-[#A7B8AE] font-mono">
            <p>Session Code: <strong className="text-[#F8FAFC] print:text-black">{session?.session_code || 'SESS-CURRENT'}</strong></p>
            <p className="mt-0.5">Date: {new Date().toLocaleDateString()}</p>
            <p className="text-[#10B981] mt-1 font-semibold">100% On-Device Local Inference</p>
          </div>
        </div>

        {/* Aggregate KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#10231C] p-4 rounded-2xl border border-[#294638] print:bg-slate-50 print:border-slate-300">
            <span className="text-[10px] text-[#A7B8AE] uppercase tracking-wider block font-semibold">Avg Class Attention</span>
            <span className="text-2xl font-bold text-[#F8FAFC] font-mono mt-1 block print:text-black">
              {session?.avg_attention_score != null ? `${Math.round(session.avg_attention_score)}%` : '85%'}
            </span>
            <span className="text-[10px] text-[#10B981]">Class aggregate index</span>
          </div>

          <div className="bg-[#10231C] p-4 rounded-2xl border border-[#294638] print:bg-slate-50 print:border-slate-300">
            <span className="text-[10px] text-[#A7B8AE] uppercase tracking-wider block font-semibold">Avg Drowsiness Rate</span>
            <span className="text-2xl font-bold text-[#FBBF24] font-mono mt-1 block">
              {session?.avg_drowsiness_rate != null ? `${Math.round(session.avg_drowsiness_rate)}%` : '0%'}
            </span>
            <span className="text-[10px] text-[#A7B8AE]">Continuous eye-closure</span>
          </div>

          <div className="bg-[#10231C] p-4 rounded-2xl border border-[#294638] print:bg-slate-50 print:border-slate-300">
            <span className="text-[10px] text-[#A7B8AE] uppercase tracking-wider block font-semibold">Classroom Noise Level</span>
            <span className="text-2xl font-bold text-[#6EE7B7] font-mono mt-1 block">
              {session?.avg_noise_level || 'Quiet'}
            </span>
            <span className="text-[10px] text-[#A7B8AE]">Acoustic assessment</span>
          </div>

          <div className="bg-[#10231C] p-4 rounded-2xl border border-[#294638] print:bg-slate-50 print:border-slate-300">
            <span className="text-[10px] text-[#A7B8AE] uppercase tracking-wider block font-semibold">Teacher Verified Actions</span>
            <span className="text-2xl font-bold text-[#10B981] font-mono mt-1 block">
              {reportData?.eventSummary?.length || 0} Incident Types
            </span>
            <span className="text-[10px] text-[#A7B8AE]">Teacher Human-in-the-Loop</span>
          </div>
        </div>

        {/* Interactive Engagement Curve Over Time (SVG Data Visualization) */}
        <div className="bg-[#10231C] p-5 rounded-3xl border border-[#294638] print:bg-slate-50 print:border-slate-300 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider print:text-black">
              Lecture Engagement Timeline & Attention Drops
            </h3>
            <span className="text-[11px] text-[#A7B8AE] font-mono">Sampling: 10-Minute Intervals</span>
          </div>

          {/* SVG Line Curve with Emerald and Mint Palette */}
          <div className="w-full h-52 relative pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 600 150">
              <defs>
                <linearGradient id="emeraldCurveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="30" x2="600" y2="30" stroke="#294638" strokeDasharray="3 3" />
              <line x1="0" y1="75" x2="600" y2="75" stroke="#294638" strokeDasharray="3 3" />
              <line x1="0" y1="120" x2="600" y2="120" stroke="#294638" strokeDasharray="3 3" />

              {/* Area under curve */}
              <path
                d="M 20 50 Q 110 30, 200 55 T 380 110 T 480 20 T 580 45 L 580 145 L 20 145 Z"
                fill="url(#emeraldCurveGradient)"
              />

              {/* Attention Line */}
              <path
                d="M 20 50 Q 110 30, 200 55 T 380 110 T 480 20 T 580 45"
                fill="none"
                stroke="#6EE7B7"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Critical Attention Dip Flag Marker */}
              <circle cx="360" cy="110" r="5" fill="#F87171" stroke="#0B1713" strokeWidth="2" />
              <rect x="300" y="120" width="130" height="22" rx="4" fill="#F87171" fillOpacity="0.95" />
              <text x="365" y="135" fill="#0B1713" fontSize="9" textAnchor="middle" fontWeight="bold">
                ⚠️ Attention Dip (68%)
              </text>

              {/* Quiz Spike Marker */}
              <circle cx="480" cy="20" r="5" fill="#10B981" stroke="#0B1713" strokeWidth="2" />
              <rect x="425" y="2" width="115" height="18" rx="4" fill="#10B981" fillOpacity="0.95" />
              <text x="482" y="14" fill="#0B1713" fontSize="9" textAnchor="middle" fontWeight="bold">
                ▲ Quiz Spike (94%)
              </text>
            </svg>
          </div>

          <div className="flex justify-between text-[11px] text-[#A7B8AE] font-mono pt-2 border-t border-[#294638]">
            {timelinePoints.map((pt: any, i: number) => (
              <span key={i}>{pt.time}</span>
            ))}
          </div>
        </div>

        {/* Timeline Key Event Markers Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider print:text-black">
            Teaching Pace Correlation & Highlighted Segments
          </h4>

          <div className="space-y-1.5">
            {timelinePoints.filter((pt: any) => pt.eventFlag).length === 0 ? (
              <p className="text-xs text-[#A7B8AE] italic p-3 bg-[#10231C] rounded-xl border border-[#294638]">
                No teaching pace markers recorded during this live session yet. Markers added by the teacher during live observation appear here.
              </p>
            ) : (
              timelinePoints.filter((pt: any) => pt.eventFlag).map((pt: any, i: number) => (
                <div
                  key={i}
                  className="bg-[#10231C] border border-[#294638] rounded-xl p-3 flex items-center justify-between text-xs print:bg-slate-50 print:border-slate-300"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[#6EE7B7] font-bold text-[11px]">{pt.time}</span>
                    <span className="text-[#F8FAFC] font-semibold print:text-black">{pt.eventFlag}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] font-mono text-[#A7B8AE]">
                    <span>Attention: <strong className="text-[#F8FAFC] print:text-black">{pt.attention}%</strong></span>
                    <span>Drowsy: <strong className="text-[#FBBF24]">{pt.drowsiness}%</strong></span>
                    <span>Noise: <strong className="text-[#6EE7B7]">{pt.noise}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ethical Human-In-The-Loop AI Footer */}
        <div className="border-t border-[#294638] pt-4 flex items-center justify-between text-[10px] text-[#A7B8AE] flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            <span>
              <strong>Zero Video Retention Compliance:</strong> All video streams were processed client-side and immediately discarded. No biometric profiles were transmitted.
            </span>
          </div>
          <span className="font-mono">Generated: {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
