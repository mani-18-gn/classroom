import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../services/api';
import { AuditLog } from '../types';
import { Search } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await apiRequest<{ logs: AuditLog[] }>('/audit?limit=100');
      setLogs(res.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      (log.user_name && log.user_name.toLowerCase().includes(term)) ||
      (log.details && log.details.toLowerCase().includes(term))
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-[#294638]">
        <h1 className="text-xl font-bold text-[#F8FAFC] tracking-tight">System Transparency & Security Audit Logs</h1>
        <p className="text-xs text-[#A7B8AE] mt-0.5">
          Tamper-evident record of all system events: logins, monitoring session activations, teacher decisions, and data purges.
        </p>
      </div>

      <div className="bg-[#17382B] border border-[#294638] rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#A7B8AE] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, teacher name, or resource..."
            className="w-full bg-[#10231C] border border-[#294638] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#10B981]"
          />
        </div>

        <span className="text-xs text-[#6EE7B7] font-mono">
          Showing {filteredLogs.length} audit entries
        </span>
      </div>

      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-5 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs text-[#F8FAFC]">
          <thead className="bg-[#10231C] text-[#A7B8AE] font-mono uppercase text-[10px] border-b border-[#294638]">
            <tr>
              <th className="py-3 px-3">Timestamp</th>
              <th className="py-3 px-3">Actor / Role</th>
              <th className="py-3 px-3">Action</th>
              <th className="py-3 px-3">Resource</th>
              <th className="py-3 px-3">Details</th>
              <th className="py-3 px-3 font-mono">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#294638] font-mono text-[11px]">
            {filteredLogs.map((l) => (
              <tr key={l.id} className="hover:bg-[#204735]/40 transition">
                <td className="py-3 px-3 text-[#A7B8AE] whitespace-nowrap">{l.timestamp}</td>
                <td className="py-3 px-3 text-[#F8FAFC] font-sans font-semibold">
                  {l.user_name || 'SYSTEM'}{' '}
                  <span className="text-[10px] text-[#10B981] font-mono">({l.user_role || 'SYS'})</span>
                </td>
                <td className="py-3 px-3">
                  <span className="bg-[#204735] text-[#6EE7B7] border border-[#294638] px-2 py-0.5 rounded font-bold text-[10px]">
                    {l.action}
                  </span>
                </td>
                <td className="py-3 px-3 text-[#A7B8AE]">{l.resource_type} {l.resource_id ? `#${l.resource_id}` : ''}</td>
                <td className="py-3 px-3 text-[#F8FAFC] font-sans max-w-xs truncate" title={l.details}>
                  {l.details || '—'}
                </td>
                <td className="py-3 px-3 text-[#A7B8AE]">{l.ip_address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
