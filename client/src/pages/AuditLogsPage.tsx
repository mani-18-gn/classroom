import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../services/api';
import { AuditLog } from '../types';
import { ShieldCheck, Search, Filter, Clock, UserCheck, Lock } from 'lucide-react';

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
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-tight">System Transparency & Security Audit Logs</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Tamper-evident record of all system events: logins, monitoring session activations, teacher decisions, and data purges.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, teacher name, or resource..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredLogs.length} audit entries
        </span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-3">Timestamp</th>
              <th className="py-3 px-3">Actor / Role</th>
              <th className="py-3 px-3">Action</th>
              <th className="py-3 px-3">Resource</th>
              <th className="py-3 px-3">Details</th>
              <th className="py-3 px-3 font-mono">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {filteredLogs.map((l) => (
              <tr key={l.id} className="hover:bg-slate-800/40 transition">
                <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{l.timestamp}</td>
                <td className="py-3 px-3 text-white font-sans font-semibold">
                  {l.user_name || 'SYSTEM'}{' '}
                  <span className="text-[10px] text-blue-400 font-mono">({l.user_role || 'SYS'})</span>
                </td>
                <td className="py-3 px-3">
                  <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded font-bold text-[10px]">
                    {l.action}
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-400">{l.resource_type} {l.resource_id ? `#${l.resource_id}` : ''}</td>
                <td className="py-3 px-3 text-slate-300 font-sans max-w-xs truncate" title={l.details}>
                  {l.details || '—'}
                </td>
                <td className="py-3 px-3 text-slate-500">{l.ip_address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
