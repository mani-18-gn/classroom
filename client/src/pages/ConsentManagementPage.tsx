import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../services/api';

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
      <div className="pb-4 border-b border-[#294638]">
        <h1 className="text-xl font-bold text-[#F8FAFC] tracking-tight">Student Consent Governance Registry</h1>
        <p className="text-xs text-[#A7B8AE] mt-0.5">
          Auditable ledger of explicit parental & student consent authorizations. Revocation automatically purges biometric mathematical vectors.
        </p>
      </div>

      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">Consent Records</h3>
          <span className="text-xs text-[#6EE7B7] font-mono">Terms Version: v1.4-PrivacyFirst</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#F8FAFC]">
            <thead className="bg-[#10231C] text-[#A7B8AE] font-mono uppercase text-[10px] border-b border-[#294638]">
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
            <tbody className="divide-y divide-[#294638]">
              {consents.map((c) => (
                <tr key={c.id} className="hover:bg-[#204735]/40 transition">
                  <td className="py-3 px-3 font-semibold text-[#F8FAFC]">{c.student_name}</td>
                  <td className="py-3 px-3 font-mono text-[#A7B8AE]">{c.student_id} ({c.roll_number})</td>
                  <td className="py-3 px-3 text-[#A7B8AE]">{c.class_name} - {c.section}</td>
                  <td className="py-3 px-3 text-[#A7B8AE]">{c.granted_by}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        c.status === 'ACTIVE'
                          ? 'bg-[#204735] text-[#10B981] border-[#10B981]/40'
                          : 'bg-[#F87171]/20 text-[#F87171] border-[#F87171]/30'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#A7B8AE] font-mono text-[11px]">{c.granted_at?.slice(0, 10)}</td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleToggleConsent(c.id, c.status)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition ${
                        c.status === 'ACTIVE'
                          ? 'bg-[#F87171]/15 hover:bg-[#F87171] text-[#F87171] hover:text-[#0B1713] border border-[#F87171]/30'
                          : 'bg-[#10B981] hover:bg-[#059669] text-[#0B1713] font-bold shadow-xs'
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
