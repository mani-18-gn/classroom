import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import {
  Lock, ShieldCheck, ShieldAlert, Clock, CheckCircle2,
  XCircle, FileText, AlertTriangle, ArrowRight, RefreshCw, Eye
} from 'lucide-react';

export const StudentPrivacyConsentPage: React.FC = () => {
  const [privacyData, setPrivacyData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState<boolean>(false);

  const fetchPrivacyData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/students/me/privacy');
      setPrivacyData(res);
    } catch (err: any) {
      console.error('Failed to load privacy & consent data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrivacyData();
  }, []);

  const handleToggleConsent = async (action: 'GRANT' | 'WITHDRAW') => {
    const confirmPrompt =
      action === 'WITHDRAW'
        ? 'Are you sure you want to withdraw biometric consent? Your facial landmark representations will be permanently purged immediately, and you will no longer be detected in classroom metrics.'
        : 'Grant explicit biometric consent for on-device attention and classroom safety monitoring under DPDP Act 2023?';

    if (!window.confirm(confirmPrompt)) return;

    setUpdating(true);
    setMessage(null);
    try {
      const res = await apiRequest('/students/me/privacy/consent', {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      setMessage(res.message);
      fetchPrivacyData();
    } catch (err: any) {
      alert(err.message || 'Failed to update consent.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin" />
        <p className="text-xs font-mono tracking-widest uppercase text-[#6EE7B7]">
          Loading Privacy & Consent Center...
        </p>
      </div>
    );
  }

  const isConsented = privacyData?.consentStatus === 'CONSENTED';
  const history = privacyData?.consentHistory || [];
  const purposes = privacyData?.processingPurposes || [];
  const categories = privacyData?.dataCategories || [];
  const authorized = privacyData?.authorizedAccess || [];
  const retention = privacyData?.retentionPolicy || {};

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#294638]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Privacy & Consent Center</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                isConsented
                  ? 'bg-[#204735] text-[#10B981] border-[#10B981]/40'
                  : 'bg-[#F87171]/20 text-[#F87171] border-[#F87171]/40'
              }`}
            >
              {isConsented ? 'CONSENT ACTIVE' : 'CONSENT WITHDRAWN'}
            </span>
          </div>
          <p className="text-xs text-[#A7B8AE] mt-1">
            Compliant with Digital Personal Data Protection (DPDP) Act 2023, FERPA, and institutional privacy charters.
          </p>
        </div>

        <button
          onClick={() => setShowPolicyModal(true)}
          className="px-4 py-2 bg-[#17382B] hover:bg-[#204735] text-xs font-bold text-[#6EE7B7] rounded-xl border border-[#294638] transition inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <FileText className="w-3.5 h-3.5" /> Read Full Privacy Charter
        </button>
      </div>

      {message && (
        <div className="p-3.5 bg-[#204735] border border-[#10B981]/50 rounded-2xl text-xs text-[#6EE7B7] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#10B981]" />
          <span>{message}</span>
        </div>
      )}

      {/* Current Consent Status & Action Panel */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#294638]">
          <div className="space-y-1">
            <span className="text-[10px] text-[#A7B8AE] uppercase tracking-wider font-semibold">
              Current Consent State
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-extrabold ${isConsented ? 'text-[#10B981]' : 'text-[#F87171]'}`}>
                {isConsented ? 'Active Digital Consent' : 'Biometric Consent Revoked'}
              </span>
              <span className="text-xs font-mono text-[#A7B8AE]">
                ({privacyData?.biometricProfile?.status || 'UNKNOWN'})
              </span>
            </div>
            <p className="text-xs text-[#A7B8AE]">
              {isConsented
                ? 'Your mathematical facial landmark tensor is enrolled for in-browser classroom identity matching.'
                : 'All biometric templates and facial descriptors are permanently purged from persistent storage.'}
            </p>
          </div>

          <div>
            {isConsented ? (
              <button
                disabled={updating}
                onClick={() => handleToggleConsent('WITHDRAW')}
                className="px-5 py-2.5 bg-[#F87171]/20 hover:bg-[#F87171] text-[#F87171] hover:text-[#0B1713] text-xs font-bold rounded-xl border border-[#F87171]/40 transition inline-flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                {updating ? 'Processing...' : 'Withdraw Biometric Consent'}
              </button>
            ) : (
              <button
                disabled={updating}
                onClick={() => handleToggleConsent('GRANT')}
                className="px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] text-[#0B1713] text-xs font-bold rounded-xl transition inline-flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {updating ? 'Processing...' : 'Grant Biometric Consent'}
              </button>
            )}
          </div>
        </div>

        {/* Edge Processing Guarantee Card */}
        <div className="bg-[#10231C] p-4 rounded-2xl border border-[#294638] space-y-2 text-xs">
          <span className="text-[#6EE7B7] font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            Local Edge Processing Guarantee
          </span>
          <p className="text-[#A7B8AE] leading-relaxed">
            {privacyData?.processingLocation || '100% Client-Side In-Browser MediaPipe Inference. No continuous video is transmitted or hosted on cloud servers.'}
          </p>
        </div>
      </div>

      {/* Processing Purposes & Categories of Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Purposes */}
        <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
            Processing Purposes
          </h2>
          <div className="space-y-3">
            {purposes.map((p: any, idx: number) => (
              <div key={idx} className="bg-[#10231C] p-3.5 rounded-2xl border border-[#294638] space-y-1">
                <p className="text-xs font-bold text-[#F8FAFC]">{p.purpose}</p>
                <p className="text-[11px] text-[#A7B8AE] leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Categories of Data Collected */}
        <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
            Personal Data Categories Collected
          </h2>
          <div className="space-y-3">
            {categories.map((c: any, idx: number) => (
              <div key={idx} className="bg-[#10231C] p-3.5 rounded-2xl border border-[#294638] space-y-1">
                <p className="text-xs font-bold text-[#6EE7B7]">{c.category}</p>
                <p className="text-[11px] text-[#A7B8AE] leading-relaxed">{c.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Authorized Access & Retention Periods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-3 text-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
            Who Is Authorized to Access This Data?
          </h2>
          <ul className="space-y-2">
            {authorized.map((a: string, idx: number) => (
              <li key={idx} className="flex items-center gap-2 text-[#A7B8AE] bg-[#10231C] p-3 rounded-xl border border-[#294638]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />
                <span className="text-[#F8FAFC]">{a}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-3 text-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
            Applicable Retention Periods
          </h2>
          <div className="space-y-2.5">
            <div className="bg-[#10231C] p-3 rounded-xl border border-[#294638]">
              <span className="text-[10px] uppercase text-[#A7B8AE] block">Evidence Snapshots</span>
              <p className="text-xs font-semibold text-[#F8FAFC]">{retention.evidenceSnapshots}</p>
            </div>
            <div className="bg-[#10231C] p-3 rounded-xl border border-[#294638]">
              <span className="text-[10px] uppercase text-[#A7B8AE] block">Session Telemetry</span>
              <p className="text-xs font-semibold text-[#F8FAFC]">{retention.sessionTelemetry}</p>
            </div>
            <div className="bg-[#10231C] p-3 rounded-xl border border-[#294638]">
              <span className="text-[10px] uppercase text-[#A7B8AE] block">Biometric Vectors</span>
              <p className="text-xs font-semibold text-[#10B981]">{retention.biometricVectors}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Consent History Timeline */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#294638]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#10B981]" />
            Consent History & Cryptographic Audit Trail
          </h2>
          <span className="text-xs text-[#A7B8AE] font-mono">{history.length} Logged Entries</span>
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-[#A7B8AE] py-6 text-center">No past consent changes recorded.</p>
        ) : (
          <div className="space-y-2.5">
            {history.map((h: any) => (
              <div
                key={h.id}
                className="bg-[#10231C] border border-[#294638] p-3.5 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        h.status === 'ACTIVE'
                          ? 'bg-[#204735] text-[#10B981] border border-[#10B981]/40'
                          : 'bg-[#F87171]/20 text-[#F87171] border border-[#F87171]/40'
                      }`}
                    >
                      {h.status}
                    </span>
                    <span className="text-[#F8FAFC] font-semibold">{h.consent_type?.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-[11px] text-[#A7B8AE]">
                    Granted by {h.granted_by} • Terms: <span className="font-mono text-[#6EE7B7]">{h.terms_version}</span>
                  </p>
                </div>

                <div className="text-right text-[10px] font-mono text-[#A7B8AE]">
                  <p>IP: {h.ip_address || '127.0.0.1'}</p>
                  <p>Granted: {h.granted_at}</p>
                  {h.revoked_at && <p className="text-[#F87171]">Revoked: {h.revoked_at}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#17382B] border border-[#294638] rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#294638]">
              <h3 className="text-sm font-bold text-[#F8FAFC]">
                Institutional Student Biometric & Privacy Charter (DPDP Act 2023)
              </h3>
              <button
                onClick={() => setShowPolicyModal(false)}
                className="p-1.5 text-[#A7B8AE] hover:text-[#F8FAFC] rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#A7B8AE] leading-relaxed">
              <p>
                ClassGuard AI functions strictly under the mandate of student safety and pedagogical pace assistance. In accordance with Section 6 of the Digital Personal Data Protection Act (DPDP) 2023:
              </p>
              <h4 className="font-bold text-[#F8FAFC]">1. Local Edge Processing Only</h4>
              <p>
                Zero video streams are sent to remote servers or third-party cloud infrastructure. MediaPipe facial landmark inference occurs purely within the browser on client memory.
              </p>
              <h4 className="font-bold text-[#F8FAFC]">2. The Right to Withdraw Consent</h4>
              <p>
                Students hold the unequivocal right to withdraw biometric processing at any moment. Upon revocation, all mathematical facial descriptors are permanently scrubbed from database records.
              </p>
              <h4 className="font-bold text-[#F8FAFC]">3. Human-in-the-Loop Safeguard</h4>
              <p>
                Preliminary computer vision telemetry does not constitute proof of disciplinary misconduct. Observations only become actionable upon explicit teacher confirmation.
              </p>
            </div>

            <div className="text-right pt-3 border-t border-[#294638]">
              <button
                onClick={() => setShowPolicyModal(false)}
                className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-[#0B1713] text-xs font-bold rounded-xl transition"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
