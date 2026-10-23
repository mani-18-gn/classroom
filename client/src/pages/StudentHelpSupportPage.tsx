import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import {
  HelpCircle, Search, MessageSquare, ChevronDown, ChevronUp,
  ShieldCheck, Send, CheckCircle2, AlertCircle, FileText,
  Phone, Mail, RefreshCw, KeyRound
} from 'lucide-react';

export const StudentHelpSupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [ticketMessage, setTicketMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // FAQ Search & open question state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Support form
  const [subject, setSubject] = useState<string>('');
  const [category, setCategory] = useState<string>('AI_OBSERVATION');
  const [message, setMessage] = useState<string>('');

  const faqs = [
    {
      q: 'What is ClassGuard AI and why is it used in my classroom?',
      a: 'ClassGuard AI is an intelligent classroom safety and pace-assistance system designed to support educators. It uses client-side computer vision (MediaPipe Face Mesh) to identify prolonged eye closure (drowsiness) and distraction, helping teachers adjust lecture pace and maintain student engagement.'
    },
    {
      q: 'Does ClassGuard AI upload my video to the cloud?',
      a: 'No. Zero video bytes are transmitted to remote servers. All facial landmark detection (468 facial mesh coordinates) runs strictly on-device in the local browser. The server only stores summarized mathematical event telemetry and teacher-verified notes.'
    },
    {
      q: 'Can an AI observation automatically result in disciplinary action?',
      a: 'Strictly NO. Under ethical AI principles, an unverified camera observation is never proof of misconduct. A certified human teacher must review the observation and record an official verification reason before any record is finalized.'
    },
    {
      q: 'What if I was looking down taking lecture notes and got flagged for sleeping?',
      a: 'You can immediately submit a review request via the "Request a Review" tab. Select the observation and choose "Normal Classroom Activity (Taking Lecture Notes)". Your teacher will review the evidence snapshot and dismiss the alert.'
    },
    {
      q: 'How do I withdraw my biometric consent?',
      a: 'Navigate to "Privacy & Consent" and click "Withdraw Biometric Consent". Your mathematical facial landmark templates will be permanently purged immediately, and you will no longer be identified in monitoring sessions.'
    },
    {
      q: 'What information is exported when I click "Download My Data"?',
      a: 'Under the Digital Personal Data Protection (DPDP) Act 2023, you receive a full JSON archive containing your academic profile, full consent history, activity records, review decisions, appeals, and notifications. System secrets and other students\' data are excluded.'
    }
  ];

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/students/me/support-tickets');
      setTickets(res.tickets || []);
    } catch (err: any) {
      console.error('Failed to load support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketMessage(null);

    if (message.trim().length < 10) {
      setTicketMessage({ text: 'Please provide a message of at least 10 characters.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/students/me/support-tickets', {
        method: 'POST',
        body: JSON.stringify({
          subject: subject.trim(),
          category,
          message: message.trim()
        })
      });
      setTicketMessage({ text: res.message || 'Support ticket created successfully.', type: 'success' });
      setSubject('');
      setMessage('');
      fetchTickets();
    } catch (err: any) {
      setTicketMessage({ text: err.message || 'Failed to submit ticket.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#294638]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Help & Support Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#204735] text-[#10B981] border border-[#10B981]/30">
              Student Assistance
            </span>
          </div>
          <p className="text-xs text-[#A7B8AE] mt-1">
            Frequently asked questions, AI ethics guide, institutional policies, and support ticket desk.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          className="p-2 bg-[#17382B] hover:bg-[#204735] text-[#A7B8AE] hover:text-[#F8FAFC] rounded-xl border border-[#294638] transition inline-flex items-center gap-1.5 text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Tickets
        </button>
      </div>

      {/* FAQs Section with Search */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#294638]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#10B981]" />
            Frequently Asked Questions
          </h2>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-[#A7B8AE] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions..."
              className="w-full bg-[#10231C] border border-[#294638] focus:border-[#10B981] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#F8FAFC] outline-none"
            />
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-[#10231C] border border-[#294638] rounded-2xl overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs font-bold text-[#F8FAFC] hover:text-[#10B981] transition"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#A7B8AE] flex-shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-[#A7B8AE] leading-relaxed border-t border-[#294638]/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI vs Human Review Guide Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            AI Observation vs Teacher Review
          </h2>
          <div className="space-y-3 text-xs text-[#A7B8AE] leading-relaxed">
            <div className="p-3 bg-[#10231C] rounded-xl border border-[#294638] space-y-1">
              <span className="font-bold text-[#FBBF24]">AI-Generated Observation:</span>
              <p className="text-[11px]">
                Calculated in real-time from webcam landmarks (e.g. Eye Aspect Ratio &lt; 0.18 for &gt; 3.0s). It is merely an automated observation note.
              </p>
            </div>

            <div className="p-3 bg-[#10231C] rounded-xl border border-[#294638] space-y-1">
              <span className="font-bold text-[#10B981]">Teacher Review Decision:</span>
              <p className="text-[11px]">
                Your instructor inspects the classroom context. Only if the teacher confirms that you were actually asleep or disrupted lecture does the record become verified.
              </p>
            </div>
          </div>
        </div>

        {/* Institutional Contact Support Card */}
        <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#10B981]" />
            Official Support Contacts
          </h2>
          <div className="bg-[#10231C] p-4 rounded-2xl border border-[#294638] space-y-2 text-xs">
            <p className="font-bold text-[#F8FAFC]">Institutional CSE/ISE Academic Helpdesk</p>
            <p className="text-[11px] text-[#A7B8AE]">Room 402 — Advanced Computing Lab Block</p>
            <div className="pt-2 border-t border-[#294638] space-y-1 text-[11px] font-mono">
              <p>Email: <span className="text-[#10B981]">classguard.support@institution.edu</span></p>
              <p>Support Hours: <span className="text-[#F8FAFC]">Mon - Fri, 09:00 AM - 05:00 PM IST</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Support Ticket Submission Form */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="pb-3 border-b border-[#294638]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#10B981]" />
            Open a Support Ticket
          </h2>
          <p className="text-[11px] text-[#A7B8AE] mt-0.5">
            Submit a query to the institutional technical support desk.
          </p>
        </div>

        {ticketMessage && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              ticketMessage.type === 'success'
                ? 'bg-[#204735] border-[#10B981]/50 text-[#6EE7B7]'
                : 'bg-[#F87171]/20 border-[#F87171]/40 text-[#F87171]'
            }`}
          >
            {ticketMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#10B981]" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#F87171]" />
            )}
            <span>{ticketMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmitTicket} className="space-y-4 max-w-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#A7B8AE] mb-1">
                Subject
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of issue"
                className="w-full bg-[#10231C] border border-[#294638] focus:border-[#10B981] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A7B8AE] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#10231C] border border-[#294638] focus:border-[#10B981] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] outline-none"
              >
                <option value="AI_OBSERVATION">AI Vision Observation Concern</option>
                <option value="PRIVACY_CONSENT">Privacy or Consent Question</option>
                <option value="ACCOUNT_SECURITY">Account Security / Login Issue</option>
                <option value="TECHNICAL_ISSUE">Portal Technical Bug</option>
                <option value="GENERAL">General Academic Inquiries</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A7B8AE] mb-1">
              Detailed Description
            </label>
            <textarea
              required
              minLength={10}
              maxLength={1000}
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide relevant details, dates, or error messages..."
              className="w-full bg-[#10231C] border border-[#294638] focus:border-[#10B981] rounded-xl p-3 text-xs text-[#F8FAFC] outline-none resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-[#0B1713] text-xs font-bold rounded-xl transition inline-flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Submitting...' : 'Submit Support Ticket'}
            </button>
          </div>
        </form>
      </div>

      {/* Submitted Support Tickets History */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
          My Submitted Support Tickets
        </h2>

        {tickets.length === 0 ? (
          <p className="text-xs text-[#A7B8AE] py-4 text-center">No active support tickets.</p>
        ) : (
          <div className="space-y-2.5">
            {tickets.map((t) => (
              <div key={t.id} className="p-3.5 bg-[#10231C] border border-[#294638] rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#6EE7B7] bg-[#204735] px-2 py-0.5 rounded">
                      {t.ticket_code}
                    </span>
                    <span className="font-bold text-[#F8FAFC]">{t.subject}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      t.status === 'RESOLVED'
                        ? 'bg-[#204735] text-[#10B981]'
                        : 'bg-[#FBBF24]/20 text-[#FBBF24]'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
                <p className="text-[#A7B8AE]">{t.message}</p>
                {t.admin_response && (
                  <div className="p-2 bg-[#204735] rounded-lg border border-[#10B981]/30 text-[11px] text-[#6EE7B7]">
                    <strong>Staff Response: </strong>"{t.admin_response}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
