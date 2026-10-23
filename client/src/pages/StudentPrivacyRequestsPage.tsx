import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import {
  FileText, Send, CheckCircle2, AlertCircle, Clock,
  ShieldCheck, RefreshCw, HelpCircle, MessageSquare
} from 'lucide-react';

export const StudentPrivacyRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form inputs
  const [category, setCategory] = useState<string>('ACCESS_PERSONAL_DATA');
  const [explanation, setExplanation] = useState<string>('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/students/me/privacy-requests');
      setRequests(res.requests || []);
    } catch (err: any) {
      console.error('Failed to load privacy requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (explanation.trim().length < 10) {
      setMessage({ text: 'Please provide a detailed explanation of at least 10 characters.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/students/me/privacy-requests', {
        method: 'POST',
        body: JSON.stringify({
          category,
          explanation: explanation.trim()
        })
      });

      setMessage({ text: res.message || 'Privacy request submitted successfully.', type: 'success' });
      setExplanation('');
      fetchRequests();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to submit request.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin" />
        <p className="text-xs font-mono tracking-widest uppercase text-[#6EE7B7]">
          Loading Privacy Rights Desk...
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
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Privacy Rights & Request Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#204735] text-[#10B981] border border-[#10B981]/30">
              DPDP Act 2023 Rights
            </span>
          </div>
          <p className="text-xs text-[#A7B8AE] mt-1">
            Submit formal statutory requests to access, rectify, erase personal records, or file privacy complaints.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          className="p-2 bg-[#17382B] hover:bg-[#204735] text-[#A7B8AE] hover:text-[#F8FAFC] rounded-xl border border-[#294638] transition inline-flex items-center gap-1.5 text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Requests
        </button>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-[#204735] border-[#10B981]/50 text-[#6EE7B7]'
              : 'bg-[#F87171]/20 border-[#F87171]/40 text-[#F87171]'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#10B981]" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#F87171]" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* New Privacy Request Form */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-5">
        <div className="pb-3 border-b border-[#294638]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#10B981]" />
            Submit a Formal Privacy Request
          </h2>
          <p className="text-[11px] text-[#A7B8AE] mt-0.5">
            Your request will be assigned an official reference code and reviewed by the Data Protection Officer.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#A7B8AE] mb-1">
              Select Statutory Request Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#10231C] border border-[#294638] focus:border-[#10B981] rounded-xl px-3 py-2.5 text-xs text-[#F8FAFC] outline-none transition"
            >
              <option value="ACCESS_PERSONAL_DATA">1. Access Personal Information (Right of Summary Data Access)</option>
              <option value="CORRECT_INACCURATE_INFO">2. Correct Inaccurate Profile Information (Right to Rectification)</option>
              <option value="REQUEST_ERASURE">3. Request Erasure of Personal Records (Right to Erasure)</option>
              <option value="WITHDRAW_CONSENT">4. Withdraw Biometric Consent (Right to Withdraw Consent)</option>
              <option value="PRIVACY_COMPLAINT">5. Submit a Privacy Complaint / Grievance Redressal</option>
              <option value="DEACTIVATE_ACCOUNT">6. Request Account Deactivation & Archival</option>
              <option value="PRIVACY_QUESTION">7. Inquire about Data Processing or Retention Policies</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A7B8AE] mb-1">
              Student-Provided Explanation & Particulars
            </label>
            <textarea
              required
              minLength={10}
              maxLength={1000}
              rows={4}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Describe your request in detail. For corrections, specify current vs updated values. For complaints, provide relevant session dates..."
              className="w-full bg-[#10231C] border border-[#294638] focus:border-[#10B981] rounded-xl p-3 text-xs text-[#F8FAFC] outline-none transition resize-none"
            />
          </div>

          <div className="p-3 bg-[#10231C] rounded-xl border border-[#294638] text-[11px] text-[#A7B8AE]">
            <p>
              <strong className="text-[#F8FAFC]">Notice on Erasure:</strong> Academic semester grade audits and mandatory university accreditation records are legally retained in compliance with university retention bylaws. Erasure requests apply strictly to optional biometric tokens and historical snapshot telemetry.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-[#0B1713] text-xs font-bold rounded-xl transition inline-flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Submitting Request...' : 'Submit Statutory Request'}
            </button>
          </div>
        </form>
      </div>

      {/* Requests History List */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#294638]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#10B981]" />
            Your Submitted Requests & Administrative Responses
          </h2>
          <span className="text-xs text-[#A7B8AE] font-mono">{requests.length} Requests Tracked</span>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-8 bg-[#10231C] rounded-2xl border border-[#294638] space-y-1">
            <CheckCircle2 className="w-8 h-8 text-[#10B981]/50 mx-auto" />
            <p className="text-xs font-semibold text-[#F8FAFC]">No Privacy Requests Submitted</p>
            <p className="text-[11px] text-[#A7B8AE]">You have not filed any formal data privacy inquiries.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-[#10231C] border border-[#294638] rounded-2xl p-4 transition space-y-2.5"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#6EE7B7] bg-[#204735] px-2 py-0.5 rounded border border-[#294638]">
                      {req.request_code}
                    </span>
                    <span className="text-xs font-bold text-[#F8FAFC]">
                      {req.category?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        req.status === 'RESOLVED'
                          ? 'bg-[#204735] text-[#10B981] border-[#10B981]/40'
                          : req.status === 'REJECTED'
                          ? 'bg-[#F87171]/20 text-[#F87171] border-[#F87171]/40'
                          : req.status === 'ADDITIONAL_INFO_REQUIRED'
                          ? 'bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/40'
                          : 'bg-[#10231C] text-[#6EE7B7] border-[#10B981]/30'
                      }`}
                    >
                      {req.status}
                    </span>
                    <span className="text-xs font-mono text-[#A7B8AE]">{req.created_at?.slice(0, 10)}</span>
                  </div>
                </div>

                <p className="text-xs text-[#A7B8AE] bg-[#0B1713] p-2.5 rounded-xl border border-[#294638]">
                  "{req.explanation}"
                </p>

                {req.admin_response ? (
                  <div className="bg-[#204735] p-3 rounded-xl border border-[#10B981]/40 text-xs space-y-1">
                    <span className="text-[#6EE7B7] font-bold text-[11px] block">
                      Data Protection Officer Response:
                    </span>
                    <p className="text-[#F8FAFC] italic">"{req.admin_response}"</p>
                    {req.completed_at && (
                      <span className="text-[10px] text-[#A7B8AE] block mt-1">
                        Completed at {req.completed_at} by {req.reviewed_by || 'Data Officer'}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-[#A7B8AE] italic">
                    Request is currently under review by the university Data Protection Officer.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
