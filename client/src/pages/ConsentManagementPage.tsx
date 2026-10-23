import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../services/api';
import { ShieldCheck, ShieldOff, CheckCircle2, FileText, Download, UserCheck } from 'lucide-react';

export const ConsentManagementPage: React.FC = () => {
  const { t } = useLanguage();
  const [consents, setConsents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchConsents = async () => {
    try {
      const res = await apiRequest('/consents');
      setConsents(res.consents || []);
    } catch (err) {
      console.error('Error fetching consents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, []);

  const handleToggleConsent = async (consentId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';
    try {
      await apiRequest(`/consents/${consentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchConsents();
    } catch (err: any) {
      alert(err.message || 'Failed to update consent');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-tight">Student Consent Governance Registry</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Auditable ledger of explicit parental & student consent authorizations. Revocation automatically purges biometric mathematical vectors.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Consent Records</h3>
          <span className="text-xs text-slate-400 font-mono">Terms Version: v1.4-PrivacyFirst</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Student Name</th>
                <th className="py-3 px-3">ID / Roll No</th>
                <th className="py-3 px-3">Class & Sec</th>
                <th className="py-3 px-3">Authorized By</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Granted Date</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {consents.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-semibold text-white">{c.student_name}</td>
                  <td className="py-3 px-3 font-mono">{c.student_id} ({c.roll_number})</td>
                  <td className="py-3 px-3">{c.class_name} - {c.section}</td>
                  <td className="py-3 px-3 text-slate-400">{c.granted_by}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        c.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{c.granted_at?.slice(0, 10)}</td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleToggleConsent(c.id, c.status)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition ${
                        c.status === 'ACTIVE'
                          ? 'bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30'
                          : 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30'
                      }`}
                    >
                      {c.status === 'ACTIVE' ? 'Revoke Consent' : 'Restore Consent'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
