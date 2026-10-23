import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import {
  Download, FileJson, ShieldCheck, Eye, EyeOff, CheckCircle2,
  AlertCircle, Lock, Server, FileText
} from 'lucide-react';

export const StudentDownloadDataPage: React.FC = () => {
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);

  useEffect(() => {
    const fetchPreview = async () => {
      setLoading(true);
      try {
        const res = await apiRequest('/students/me/export-data');
        setPreviewData(res);
      } catch (err: any) {
        console.error('Failed to load data preview:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, []);

  const handleDownload = () => {
    if (!previewData) return;
    setDownloading(true);

    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(previewData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `classguard-export-${previewData.studentProfile?.studentId || 'student'}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin" />
        <p className="text-xs font-mono tracking-widest uppercase text-[#6EE7B7]">
          Assembling Personal Data Package...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#294638]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Download My Data (JSON Export)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#204735] text-[#10B981] border border-[#10B981]/30">
              Statutory Data Portability
            </span>
          </div>
          <p className="text-xs text-[#A7B8AE] mt-1">
            Export a complete, transparent, machine-readable JSON archive of all personal records and activity logs associated with your account.
          </p>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading || !previewData}
          className="px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-[#0B1713] text-xs font-bold rounded-xl transition inline-flex items-center gap-2 self-start sm:self-auto shadow-md"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Preparing Download...' : 'Download My Data (JSON)'}
        </button>
      </div>

      {/* Export Overview & Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            What Is Included in Your Export Archive?
          </h2>
          <p className="text-xs text-[#A7B8AE] leading-relaxed">
            In compliance with Section 11 of the Digital Personal Data Protection Act 2023, your export archive contains:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#10231C] rounded-xl border border-[#294638] space-y-1">
              <span className="font-bold text-[#6EE7B7] block">✓ Academic Profile Record</span>
              <p className="text-[11px] text-[#A7B8AE]">Full name, student ID, roll number, section, contact information, and assigned classroom.</p>
            </div>

            <div className="p-3 bg-[#10231C] rounded-xl border border-[#294638] space-y-1">
              <span className="font-bold text-[#6EE7B7] block">✓ Digital Consent History</span>
              <p className="text-[11px] text-[#A7B8AE]">Chronological record of consent grants, terms versions, timestamps, and IP addresses.</p>
            </div>

            <div className="p-3 bg-[#10231C] rounded-xl border border-[#294638] space-y-1">
              <span className="font-bold text-[#6EE7B7] block">✓ Activity Records & Teacher Notes</span>
              <p className="text-[11px] text-[#A7B8AE]">All preliminary vision detections, confidence scores, and official teacher verification decisions.</p>
            </div>

            <div className="p-3 bg-[#10231C] rounded-xl border border-[#294638] space-y-1">
              <span className="font-bold text-[#6EE7B7] block">✓ Appeals & Statutory Requests</span>
              <p className="text-[11px] text-[#A7B8AE]">Submitted review appeals and formal privacy rights requests with administrative responses.</p>
            </div>
          </div>
        </div>

        {/* Security Exclusions Notice */}
        <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#F87171]" />
            Security Exclusions
          </h2>
          <div className="text-xs text-[#A7B8AE] space-y-2">
            <p>To protect system security and peer privacy, the export strictly excludes:</p>
            <ul className="space-y-1.5 text-[11px] list-disc list-inside text-[#F8FAFC]">
              <li>Passwords and cryptographic hashes</li>
              <li>Authentication session tokens (JWT)</li>
              <li>Records belonging to other students</li>
              <li>Internal server configuration secrets</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Live Export Preview */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#294638]">
          <div className="flex items-center gap-2">
            <FileJson className="w-4 h-4 text-[#10B981]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
              Live Archive Preview
            </h2>
          </div>
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="text-xs font-semibold text-[#6EE7B7] hover:underline flex items-center gap-1"
          >
            {showRawJson ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showRawJson ? 'Hide Raw JSON' : 'Inspect Raw JSON'}</span>
          </button>
        </div>

        {showRawJson ? (
          <pre className="p-4 bg-[#0B1713] rounded-2xl border border-[#294638] text-[11px] font-mono text-[#6EE7B7] overflow-x-auto max-h-96">
            {JSON.stringify(previewData, null, 2)}
          </pre>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-[#10231C] p-3.5 rounded-2xl border border-[#294638] space-y-1">
              <span className="text-[10px] uppercase text-[#A7B8AE] block">Exported Subject</span>
              <p className="font-bold text-[#F8FAFC] truncate">{previewData?.studentProfile?.fullName}</p>
              <p className="text-[10px] font-mono text-[#6EE7B7]">ID: {previewData?.studentProfile?.studentId}</p>
            </div>

            <div className="bg-[#10231C] p-3.5 rounded-2xl border border-[#294638] space-y-1">
              <span className="text-[10px] uppercase text-[#A7B8AE] block">Activity Records</span>
              <p className="font-bold text-[#F8FAFC]">{previewData?.activityRecords?.length || 0} Events</p>
              <p className="text-[10px] text-[#A7B8AE]">Included in archive</p>
            </div>

            <div className="bg-[#10231C] p-3.5 rounded-2xl border border-[#294638] space-y-1">
              <span className="text-[10px] uppercase text-[#A7B8AE] block">Consent Entries</span>
              <p className="font-bold text-[#F8FAFC]">{previewData?.consentHistory?.length || 0} Records</p>
              <p className="text-[10px] text-[#10B981]">Cryptographically logged</p>
            </div>

            <div className="bg-[#10231C] p-3.5 rounded-2xl border border-[#294638] space-y-1">
              <span className="text-[10px] uppercase text-[#A7B8AE] block">Export Timestamp</span>
              <p className="font-mono text-[11px] text-[#F8FAFC] truncate">{previewData?.exportDate?.slice(0, 16)}</p>
              <p className="text-[10px] text-[#6EE7B7]">Certified export</p>
            </div>
          </div>
        )}

        <div className="pt-2 text-right">
          <button
            onClick={handleDownload}
            className="px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] text-[#0B1713] text-xs font-bold rounded-xl transition inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Download Certified JSON Archive
          </button>
        </div>
      </div>
    </div>
  );
};
