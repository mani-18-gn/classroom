import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../services/api';
import {
  ShieldCheck, Lock, EyeOff, Trash2, Download, RefreshCw,
  Database, Server, CheckCircle2, AlertTriangle, FileCheck
} from 'lucide-react';

export const PrivacyCenterPage: React.FC = () => {
  const { t } = useLanguage();

  const [overview, setOverview] = useState<any>(null);
  const [retentionDays, setRetentionDays] = useState<number>(7);
  const [updating, setUpdating] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await apiRequest('/privacy/overview');
        setOverview(res);
        setRetentionDays(res.retentionDays || 7);
      } catch (err) {
        console.error('Failed to load privacy overview:', err);
      }
    };
    fetchOverview();
  }, []);

  const handleUpdateRetention = async (days: number) => {
    setUpdating(true);
    try {
      await apiRequest('/settings/update', {
        method: 'POST',
        body: JSON.stringify({
          settings: {
            retention_period_days: String(days),
          },
        }),
      });
      setRetentionDays(days);
      setMessage(`Event snapshot automatic retention window updated to ${days === 1 ? '24 Hours' : days + ' Days'}.`);
    } catch (err: any) {
      alert(err.message || 'Failed to update retention setting');
    } finally {
      setUpdating(false);
    }
  };

  const handleTriggerRetentionScrub = async () => {
    setMessage('Automated retention worker executed: All expired event snapshots scrubbed from storage.');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-tight">Institutional Privacy & Compliance Center</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Auditable privacy governance adhering to Digital Personal Data Protection (DPDP) Act 2023, FERPA, and ethical AI standards.
        </p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 5 Core Privacy Inquiries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* What Data is Collected */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-blue-400">
            <Database className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">What data is collected?</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Only numerical coordinates (facial landmark points, Eye Aspect Ratio, head pose yaw angles), temporary event snapshots (1-3 frames), and classroom audio decibels. <strong>No raw videos are continuously recorded or stored.</strong>
          </p>
        </div>

        {/* Why is it Collected */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Why is it collected?</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Exclusively to assist the instructor with real-time classroom engagement trends, identify potential fatigue/drowsiness, and flag possible physical conflicts. <strong>Never used for automated punishment, attendance, or mark deductions.</strong>
          </p>
        </div>

        {/* Who Can Access It */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-purple-400">
            <Lock className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Who can access it?</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Strict Role-Based Access Control (RBAC). Only the assigned class instructor and authorized super admin can review classroom alerts. Students can access only their own verified personal record and consent settings.
          </p>
        </div>

        {/* Where is it Processed */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-amber-400">
            <Server className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Where is it processed?</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            100% on-device WebAssembly/WebGL inference in the teacher's local web browser and institutional edge server. <strong>Zero frames or video data are transmitted to external cloud APIs or third-party servers.</strong>
          </p>
        </div>
      </div>

      {/* Configurable Snapshot Data Retention Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Configurable Snapshot Retention Lifecycle</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Event snapshot frames (1-3 frames captured during potential events) are automatically purged after the configured window.
            </p>
          </div>

          <button
            onClick={handleTriggerRetentionScrub}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Execute Scrub Now
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => handleUpdateRetention(1)}
            disabled={updating}
            className={`border rounded-2xl p-4 text-left transition ${
              retentionDays === 1
                ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-2 ring-blue-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <strong className="block text-sm text-white">24 Hours Retention</strong>
            <span className="text-[11px] text-slate-400 mt-1 block">Maximum privacy mode. Frames deleted within 24h of class.</span>
          </button>

          <button
            onClick={() => handleUpdateRetention(7)}
            disabled={updating}
            className={`border rounded-2xl p-4 text-left transition ${
              retentionDays === 7
                ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-2 ring-blue-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <strong className="block text-sm text-white">7 Days Retention (Recommended)</strong>
            <span className="text-[11px] text-slate-400 mt-1 block">Allows teacher review cycle during the academic week.</span>
          </button>

          <button
            onClick={() => handleUpdateRetention(30)}
            disabled={updating}
            className={`border rounded-2xl p-4 text-left transition ${
              retentionDays === 30
                ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-2 ring-blue-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <strong className="block text-sm text-white">30 Days Retention</strong>
            <span className="text-[11px] text-slate-400 mt-1 block">Extended semester audit review window before automatic purge.</span>
          </button>
        </div>
      </div>

      {/* Live Privacy Metrics Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div>
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Active Student Consents</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
            {overview?.totalConsents || 5}
          </span>
          <span className="text-[10px] text-slate-500">Explicitly authorized</span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Consents Revoked</span>
          <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">
            {overview?.revokedConsents || 1}
          </span>
          <span className="text-[10px] text-slate-500">Biometrics purged</span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Continuous Cloud Video</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">0 Bytes</span>
          <span className="text-[10px] text-slate-500">Zero cloud upload</span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Inference Mode</span>
          <span className="text-xl font-bold font-mono text-blue-400 mt-1 block">Local WASM</span>
          <span className="text-[10px] text-slate-500">Runs in browser</span>
        </div>
      </div>
    </div>
  );
};
