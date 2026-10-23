import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../services/api';
import {
  ShieldCheck, ShieldOff, Download, Trash2, CheckCircle2,
  Lock, Eye
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchStudentProfile = async () => {
    try {
      // Fetch logged in student ID or student #1 by default
      const targetId = user?.studentId || user?.roleDetails?.id || 1;
      const res = await apiRequest(`/students/${targetId}`);
      setStudentData(res);
    } catch (err) {
      console.error('Failed to fetch student data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentProfile();
  }, [user]);

  const handleWithdrawConsent = async () => {
    if (!studentData?.student?.id) return;
    const confirmWithdraw = window.confirm(
      'Are you sure you want to withdraw consent? Your mathematical biometric facial profile will be permanently purged immediately, and you will no longer be identified in classroom attention metrics.'
    );
    if (!confirmWithdraw) return;

    try {
      const res = await apiRequest(`/students/${studentData.student.id}/withdraw-consent`, {
        method: 'POST',
      });
      setActionMessage(res.message);
      fetchStudentProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to withdraw consent');
    }
  };

  const handleExportData = () => {
    if (!studentData?.student?.id) return;
    window.open(`/api/privacy/export-my-data/${studentData.student.id}`, '_blank');
  };

  const handleDeleteDataRequest = async () => {
    if (!studentData?.student?.id) return;
    const confirmDelete = window.confirm(
      'CRITICAL: Request permanent data erasure? All personal records, enrollment links, and biometric tokens will be permanently scrubbed.'
    );
    if (!confirmDelete) return;

    try {
      const res = await apiRequest(`/students/${studentData.student.id}/data`, {
        method: 'DELETE',
      });
      setActionMessage(res.message);
      fetchStudentProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to delete data');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[#A7B8AE] text-sm font-mono">Loading student profile & consent records...</div>;
  }

  const s = studentData?.student;
  const stats = studentData?.statistics;
  const events: any[] = studentData?.recentEvents || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-[#294638]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#F8FAFC] tracking-tight">Student Privacy & Consent Portal</h1>
            <span className="text-xs bg-[#204735] text-[#6EE7B7] font-mono px-2.5 py-0.5 rounded-full border border-[#294638]">
              Student Role: {s?.full_name || user?.fullName || 'Enrolled Student'}
            </span>
          </div>
          <p className="text-xs text-[#A7B8AE] mt-0.5">
            Transparent view of what information is stored, active consent status, and privacy rights under DPDP Act 2023 / FERPA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 bg-[#204735] hover:bg-[#10231C] text-[#F8FAFC] text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#294638] transition"
          >
            <Download className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Download My Data (JSON)</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-[#204735] border border-[#10B981]/40 rounded-2xl text-xs text-[#6EE7B7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#10B981]" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-[#A7B8AE] hover:text-[#F8FAFC] text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Student Profile & Consent Status Card */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="space-y-3">
            <div>
              <span className="text-[10px] text-[#A7B8AE] uppercase tracking-wider font-semibold block">Student Name</span>
              <h2 className="text-lg font-bold text-[#F8FAFC]">{s?.full_name || user?.fullName}</h2>
              <p className="text-xs text-[#A7B8AE] font-mono">ID: {s?.student_id || 'N/A'} • Roll: {s?.roll_number || 'N/A'}</p>
            </div>
            <div>
              <span className="text-[10px] text-[#A7B8AE] uppercase tracking-wider font-semibold block">Academic Course</span>
              <p className="text-xs text-[#F8FAFC]">{s?.class_name || 'Classroom'} • Sec {s?.section || 'A'}</p>
            </div>
            <div>
              <span className="text-[10px] text-[#A7B8AE] uppercase tracking-wider font-semibold block">Email</span>
              <p className="text-xs text-[#F8FAFC] font-mono">{s?.email || user?.email || 'N/A'}</p>
            </div>
          </div>

          {/* Consent Status Badge */}
          <div className="bg-[#10231C] p-4 rounded-2xl border border-[#294638] space-y-2">
            <span className="text-[10px] text-[#A7B8AE] uppercase tracking-wider font-semibold block">Biometric Consent Status</span>
            <div className="flex items-center gap-2">
              {s?.consent_status === 'CONSENTED' ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#10B981] bg-[#204735] px-2.5 py-1 rounded-lg border border-[#10B981]/40">
                  <ShieldCheck className="w-4 h-4" /> CONSENT ACTIVE
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#F87171] bg-[#F87171]/20 px-2.5 py-1 rounded-lg border border-[#F87171]/40">
                  <ShieldOff className="w-4 h-4" /> CONSENT WITHDRAWN
                </div>
              )}
            </div>
            <p className="text-[11px] text-[#A7B8AE] leading-tight">
              Biometric mathematical hash token is {s?.consent_status === 'CONSENTED' ? 'ACTIVE for authorized identity matching.' : 'PERMANENTLY PURGED.'}
            </p>

            <div className="pt-2">
              {s?.consent_status === 'CONSENTED' ? (
                <button
                  onClick={handleWithdrawConsent}
                  className="w-full bg-[#F87171]/15 hover:bg-[#F87171] text-[#F87171] hover:text-[#0B1713] border border-[#F87171]/40 text-xs font-bold py-1.5 rounded-xl transition"
                >
                  Withdraw Biometric Consent
                </button>
              ) : (
                <p className="text-[10px] text-[#A7B8AE] italic">No biometric profile active</p>
              )}
            </div>
          </div>

          {/* What Data is Stored Section */}
          <div className="bg-[#10231C] p-4 rounded-2xl border border-[#294638] space-y-2 text-xs">
            <span className="text-[10px] text-[#A7B8AE] uppercase tracking-wider font-semibold block">What Info is Stored?</span>
            <ul className="space-y-1.5 text-[#F8FAFC] text-[11px]">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Name, Roll Number, Section</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#6EE7B7]" />
                <span>Encrypted landmark hash (No raw photos stored)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Teacher-verified safety notes</span>
              </li>
            </ul>

            <div className="pt-2 border-t border-[#294638]">
              <button
                onClick={handleDeleteDataRequest}
                className="text-[11px] text-[#F87171] hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Permanent Data Erasure Request
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Observations vs Verified Confirmations Stats */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider mb-2">
          Academic Activity Record (Explicit Distinction)
        </h3>
        <p className="text-xs text-[#A7B8AE] mb-4">
          In compliance with ethical AI principles, preliminary AI observations are never treated as confirmed student misconduct.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-[#10231C] p-3 rounded-2xl border border-[#294638]">
            <span className="text-[10px] text-[#A7B8AE] uppercase block font-semibold">AI Detected Observations</span>
            <span className="text-xl font-bold text-[#FBBF24] font-mono mt-0.5 block">
              {stats?.totalDetectedObservations || 0}
            </span>
            <span className="text-[10px] text-[#A7B8AE]">Unverified preliminary</span>
          </div>

          <div className="bg-[#10231C] p-3 rounded-2xl border border-[#294638]">
            <span className="text-[10px] text-[#A7B8AE] uppercase block font-semibold">Teacher Verified</span>
            <span className="text-xl font-bold text-[#10B981] font-mono mt-0.5 block">
              {stats?.teacherVerifiedEvents || 0}
            </span>
            <span className="text-[10px] text-[#6EE7B7]">Confirmed by human</span>
          </div>

          <div className="bg-[#10231C] p-3 rounded-2xl border border-[#294638]">
            <span className="text-[10px] text-[#A7B8AE] uppercase block font-semibold">False Positives Dismissed</span>
            <span className="text-xl font-bold text-[#F8FAFC] font-mono mt-0.5 block">
              {stats?.falsePositiveEvents || 0}
            </span>
            <span className="text-[10px] text-[#A7B8AE]">Normal class activity</span>
          </div>

          <div className="bg-[#10231C] p-3 rounded-2xl border border-[#294638]">
            <span className="text-[10px] text-[#A7B8AE] uppercase block font-semibold">Pending Review</span>
            <span className="text-xl font-bold text-[#6EE7B7] font-mono mt-0.5 block">
              {stats?.pendingReviewEvents || 0}
            </span>
            <span className="text-[10px] text-[#A7B8AE]">Awaiting teacher</span>
          </div>
        </div>
      </div>

      {/* 1. Dedicated Official Verified Sleeping Records Section */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-[#294638] flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#204735] text-[#10B981] rounded-xl border border-[#294638]">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC] tracking-tight flex items-center gap-2">
                Official Verified Sleeping Records
                <span className="text-[10px] bg-[#204735] text-[#6EE7B7] font-mono px-2 py-0.5 rounded-full border border-[#10B981]/40">
                  {studentData?.verifiedSleepingRecords?.length || 0} Recorded
                </span>
              </h3>
              <p className="text-[11px] text-[#A7B8AE]">
                Incidents officially verified by your class teacher with recorded reason
              </p>
            </div>
          </div>
        </div>

        {/* Protection Policy Note */}
        <div className="p-3 bg-[#204735] border border-[#294638] rounded-xl text-[11px] text-[#6EE7B7] flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
          <span>
            <strong>Fairness Guarantee:</strong> Preliminary camera vision alerts are never recorded on your student profile. An incident is only recorded once your class teacher verifies that you were sleeping and records the official justification reason.
          </span>
        </div>

        {/* List of Verified Sleeping Records */}
        <div className="space-y-2.5 pt-1">
          {(!studentData?.verifiedSleepingRecords || studentData.verifiedSleepingRecords.length === 0) ? (
            <div className="bg-[#10231C] border border-[#294638] rounded-2xl p-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-[#10B981]/60 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-[#F8FAFC]">Clean Record — No Verified Sleeping Incidents</p>
              <p className="text-[11px] text-[#A7B8AE] mt-0.5 max-w-md mx-auto">
                No sleeping records have been verified by your class teacher for this student profile.
              </p>
            </div>
          ) : (
            studentData.verifiedSleepingRecords.map((rec: any) => (
              <div
                key={rec.id}
                className="bg-[#10231C] border border-[#294638] rounded-2xl p-4 space-y-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#F8FAFC]">🚨 Sleeping Observation</span>
                    <span className="text-[10px] font-bold bg-[#204735] text-[#6EE7B7] px-2.5 py-0.5 rounded-full border border-[#10B981]/40">
                      ✓ Verified by Class Teacher
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[#A7B8AE]">{rec.timestamp}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-[#0B1713] p-2.5 rounded-xl border border-[#294638]">
                  <div>
                    <span className="text-[10px] text-[#A7B8AE] block uppercase">Duration</span>
                    <strong className="text-[#F8FAFC]">{rec.duration_seconds} seconds</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#A7B8AE] block uppercase">Verified By</span>
                    <strong className="text-[#10B981]">{rec.verified_by_teacher || 'Class Teacher'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#A7B8AE] block uppercase">Class / Session</span>
                    <span className="text-[#6EE7B7] font-mono">{rec.session_code || 'Live Session'}</span>
                  </div>
                </div>

                {/* Reason callout */}
                <div className="bg-[#204735] border border-[#10B981]/40 rounded-xl p-3 text-xs">
                  <div className="flex items-center gap-1.5 text-[#10B981] font-semibold text-[11px] mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Official Class Teacher Verification Reason:</span>
                  </div>
                  <p className="text-[#F8FAFC] text-xs italic font-medium">
                    "{rec.teacher_notes || rec.verification_reason || 'Class teacher verified student was sleeping during lecture'}"
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. All Recorded Events History Table */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider mb-3">
          All Student Activity Records
        </h3>

        <div className="space-y-2">
          {events.length === 0 ? (
            <p className="text-xs text-[#A7B8AE] py-4 text-center">No recorded events for this profile.</p>
          ) : (
            events.map((evt) => (
              <div
                key={evt.id}
                className="bg-[#10231C] border border-[#294638] rounded-2xl p-3.5 flex items-center justify-between text-xs flex-wrap gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-[#F8FAFC]">{evt.event_type.replace(/_/g, ' ')}</strong>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        evt.verification_status === 'VERIFIED'
                          ? 'bg-[#204735] text-[#6EE7B7] border border-[#10B981]/40'
                          : evt.verification_status === 'REJECTED'
                          ? 'bg-[#17382B] text-[#A7B8AE]'
                          : 'bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/30'
                      }`}
                    >
                      {evt.verification_status}
                    </span>
                  </div>
                  <p className="text-[#A7B8AE] text-[11px] mt-0.5 italic">{evt.ai_observation}</p>
                  {(evt.teacher_notes || evt.verification_reason) && (
                    <p className="text-[11px] text-[#6EE7B7] mt-1 font-medium bg-[#204735] px-2 py-0.5 rounded border border-[#10B981]/30 inline-block">
                      Teacher Reason: "{evt.teacher_notes || evt.verification_reason}" • Verified by {evt.verified_by_teacher || 'Class Teacher'}
                    </p>
                  )}
                </div>

                <div className="text-right text-[11px] text-[#A7B8AE] font-mono">
                  <span>{evt.timestamp}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
