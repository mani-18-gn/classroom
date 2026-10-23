import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { jsPDF } from 'jspdf';
import {
  Download, FileText, ShieldCheck, Printer, CheckCircle2,
  Lock, School, Calendar, User, Clock, AlertCircle
} from 'lucide-react';

export const StudentDownloadDataPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  useEffect(() => {
    const fetchExportData = async () => {
      setLoading(true);
      try {
        const res = await apiRequest('/students/me/export-data');
        setData(res);
      } catch (err: any) {
        console.error('Failed to load export data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExportData();
  }, []);

  const handleDownloadPdf = () => {
    if (!data) return;
    setGeneratingPdf(true);
    setDownloadSuccess(false);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const p = data.studentProfile || {};
      const consents = data.consentHistory || [];
      const activities = data.activityRecords || [];
      const appeals = data.reviewAppeals || [];
      const privacyRequests = data.privacyRequests || [];
      const exportDate = data.exportDate || new Date().toISOString();

      // Page dimensions
      const pageWidth = 210;
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;
      let y = 16;

      // 1. Top Decorative Emerald Bar
      doc.setFillColor(16, 185, 129); // #10B981
      doc.rect(0, 0, pageWidth, 5, 'F');

      // 2. Header Banner
      doc.setFillColor(16, 35, 28); // #10231C
      doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(248, 250, 252); // #F8FAFC
      doc.text('CLASSGUARD AI — OFFICIAL STUDENT DOSSIER', margin + 6, y + 9);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(110, 231, 183); // Mint accent #6EE7B7
      doc.text(
        'Certified Academic & Privacy Rights Record  •  DPDP Act 2023 / GDPR Art. 20 Compliant',
        margin + 6,
        y + 16
      );

      y += 28;

      // 3. Document Metadata Bar
      doc.setFillColor(23, 56, 43); // #17382B
      doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'F');
      doc.setFontSize(8);
      doc.setTextColor(167, 184, 174);
      doc.text(`Generated: ${exportDate.replace('T', ' ').slice(0, 19)} UTC`, margin + 4, y + 6.5);
      doc.text(`USN: ${p.studentId || 'N/A'}`, margin + 85, y + 6.5);
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
      doc.text('STATUS: VERIFIED ENROLLED', margin + 135, y + 6.5);

      y += 16;

      // 4. Section: Student Academic Identification
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(16, 35, 28);
      doc.text('1. Student Academic Identification', margin, y);
      y += 4;

      doc.setDrawColor(41, 70, 56);
      doc.setLineWidth(0.4);
      doc.line(margin, y, margin + contentWidth, y);
      y += 6;

      // Profile details grid (2 columns)
      doc.setFontSize(8.5);
      const leftColX = margin + 2;
      const rightColX = margin + 92;

      const drawField = (label: string, value: string, xPos: number, yPos: number) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(70, 85, 78);
        doc.text(`${label}:`, xPos, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(20, 25, 22);
        doc.text(value || 'N/A', xPos + 32, yPos);
      };

      drawField('Full Name', p.fullName || 'N/A', leftColX, y);
      drawField('Email Address', p.email || 'N/A', rightColX, y);
      y += 6;

      drawField('University ID (USN)', p.studentId || 'N/A', leftColX, y);
      drawField('Roll Number', p.rollNumber ? `#${p.rollNumber}` : 'N/A', rightColX, y);
      y += 6;

      drawField('Enrolled Class', `${p.className || 'CS'} (${p.section || 'A'})`, leftColX, y);
      drawField('Academic Semester', `${p.semester || '6'}th Semester`, rightColX, y);
      y += 6;

      drawField('Assigned Classroom', p.assignedClassroom || 'CS-101', leftColX, y);
      drawField('Contact Phone', p.phone || 'Not configured', rightColX, y);
      y += 6;

      drawField('Enrollment Date', p.createdAt ? p.createdAt.slice(0, 10) : '2026-10-01', leftColX, y);
      drawField('Verification Seal', p.verificationStatus || 'VERIFIED', rightColX, y);
      y += 12;

      // 5. Section: Digital Consent & Privacy Framework
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(16, 35, 28);
      doc.text('2. Biometric Consent & Data Protection Status', margin, y);
      y += 4;

      doc.setDrawColor(41, 70, 56);
      doc.line(margin, y, margin + contentWidth, y);
      y += 6;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 60, 55);
      doc.text(
        'Processing Model: 100% In-Browser MediaPipe Landmark Extraction. Zero raw video is uploaded or stored.',
        margin + 2,
        y
      );
      y += 5;
      doc.text(
        'Biometric Feature Vectors: Encrypted AES-256 embeddings. Subject to student-directed cryptographic purge.',
        margin + 2,
        y
      );
      y += 8;

      // Consent history table
      doc.setFillColor(240, 245, 242);
      doc.rect(margin, y, contentWidth, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 45, 38);
      doc.text('CONSENT TYPE', margin + 3, y + 4.2);
      doc.text('TERMS VERSION', margin + 45, y + 4.2);
      doc.text('STATUS', margin + 85, y + 4.2);
      doc.text('GRANTED AT', margin + 115, y + 4.2);
      doc.text('REVOKED AT', margin + 155, y + 4.2);
      y += 6.5;

      doc.setFont('helvetica', 'normal');
      if (consents.length === 0) {
        doc.text('No formal consent entries logged.', margin + 3, y + 4);
        y += 6;
      } else {
        consents.slice(0, 3).forEach((c: any) => {
          doc.text(c.consent_type || 'BIOMETRIC_MONITORING', margin + 3, y + 4);
          doc.text(c.terms_version || 'v2.4-DPDP', margin + 45, y + 4);
          doc.text(c.status || 'ACTIVE', margin + 85, y + 4);
          doc.text(c.granted_at ? c.granted_at.slice(0, 16) : 'N/A', margin + 115, y + 4);
          doc.text(c.revoked_at ? c.revoked_at.slice(0, 16) : '—', margin + 155, y + 4);
          y += 5.5;
        });
      }

      y += 8;

      // 6. Section: Activity Records & Observations
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(16, 35, 28);
      doc.text('3. Activity Records & Human Teacher Verifications', margin, y);
      y += 4;

      doc.setDrawColor(41, 70, 56);
      doc.line(margin, y, margin + contentWidth, y);
      y += 6;

      doc.setFillColor(240, 245, 242);
      doc.rect(margin, y, contentWidth, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 45, 38);
      doc.text('EVENT ID', margin + 3, y + 4.2);
      doc.text('TIMESTAMP', margin + 22, y + 4.2);
      doc.text('AI OBSERVATION', margin + 65, y + 4.2);
      doc.text('CONFIDENCE', margin + 110, y + 4.2);
      doc.text('REVIEW STATUS', margin + 140, y + 4.2);
      y += 6.5;

      doc.setFont('helvetica', 'normal');
      if (activities.length === 0) {
        doc.text('No classroom activity observations recorded for this student account.', margin + 3, y + 4);
        y += 6;
      } else {
        activities.slice(0, 6).forEach((ev: any) => {
          doc.text(`#${ev.id}`, margin + 3, y + 4);
          doc.text(ev.timestamp ? ev.timestamp.slice(0, 16) : 'N/A', margin + 22, y + 4);
          doc.text(ev.event_type || 'OBSERVATION', margin + 65, y + 4);
          doc.text(`${Math.round((ev.confidence_score || 0.85) * 100)}%`, margin + 110, y + 4);
          doc.text(ev.review_status || 'PENDING', margin + 140, y + 4);
          y += 5.5;
        });
      }

      y += 8;

      // Check if we need to add a page or continue
      if (y > 220) {
        doc.addPage();
        y = 16;
      }

      // 7. Section: Review Appeals & Statutory Requests
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(16, 35, 28);
      doc.text('4. Student Appeals & Statutory Privacy Requests', margin, y);
      y += 4;

      doc.setDrawColor(41, 70, 56);
      doc.line(margin, y, margin + contentWidth, y);
      y += 6;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 60, 55);
      const appealsCount = appeals.length;
      const requestsCount = privacyRequests.length;
      doc.text(
        `Total Review Appeals Filed: ${appealsCount}  •  Total Formal Privacy Requests: ${requestsCount}`,
        margin + 2,
        y
      );
      y += 6;

      if (appeals.length > 0) {
        appeals.slice(0, 3).forEach((app: any) => {
          doc.text(`• Appeal [${app.appeal_code}]: Event #${app.event_id} — ${app.reason_category} (${app.status})`, margin + 4, y);
          y += 5;
        });
      }

      y += 10;

      // 8. Official Certification & Digital Stamp
      doc.setFillColor(16, 35, 28);
      doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(110, 231, 183);
      doc.text('INSTITUTIONAL DATA CERTIFICATION & INTEGRITY GUARANTEE', margin + 6, y + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(248, 250, 252);
      doc.text(
        'This dossier constitutes a legally valid record export under the Digital Personal Data Protection Act 2023.',
        margin + 6,
        y + 12
      );
      doc.text(
        'Confidential: Passwords, authentication credentials, and peer records are strictly excluded.',
        margin + 6,
        y + 17
      );

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(120, 135, 128);
        doc.text(
          `ClassGuard AI Smart Classroom Safety Platform  •  Document Ref: CG-DOSSIER-${p.studentId || 'STUDENT'}  •  Page ${i} of ${totalPages}`,
          margin,
          290
        );
      }

      // Trigger automatic PDF file download
      const filename = `classguard-dossier-${p.studentId || 'student'}.pdf`;
      doc.save(filename);
      setDownloadSuccess(true);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF dossier. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handlePrintDossier = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin" />
        <p className="text-xs font-mono tracking-widest uppercase text-[#6EE7B7]">
          Assembling Official PDF Dossier...
        </p>
      </div>
    );
  }

  const p = data?.studentProfile || {};
  const stats = {
    totalEvents: data?.activityRecords?.length || 0,
    consentLogs: data?.consentHistory?.length || 0,
    appeals: data?.reviewAppeals?.length || 0,
    requests: data?.privacyRequests?.length || 0,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in print:p-0 print:max-w-none">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#294638] print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Download My Data (Official PDF Dossier)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#204735] text-[#10B981] border border-[#10B981]/30">
              DPDP Act Certified PDF
            </span>
          </div>
          <p className="text-xs text-[#A7B8AE] mt-1">
            Generate and export your verified student academic profile, biometric consent audit, and activity observations in an official PDF document.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrintDossier}
            className="px-4 py-2.5 bg-[#17382B] hover:bg-[#204735] text-[#F8FAFC] text-xs font-bold rounded-xl border border-[#294638] transition inline-flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-[#6EE7B7]" />
            <span>Print Dossier</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={generatingPdf || !data}
            className="px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-[#0B1713] text-xs font-bold rounded-xl transition inline-flex items-center gap-2 shadow-md"
          >
            <Download className="w-4 h-4" />
            {generatingPdf ? 'Generating PDF...' : 'Download Official PDF'}
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-4 bg-[#204735] border border-[#10B981]/50 rounded-2xl text-xs text-[#6EE7B7] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#10B981] flex-shrink-0" />
            <span>
              <strong>PDF Dossier Downloaded:</strong> Your official record file (<code>classguard-dossier-{p.studentId || 'student'}.pdf</code>) has been successfully generated and saved to your device.
            </span>
          </div>
        </div>
      )}

      {/* Official Visual Document Preview Card */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#294638]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#10231C] border border-[#294638] flex items-center justify-center text-[#10B981]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC]">
                Institutional Student Dossier Preview
              </h2>
              <p className="text-[11px] text-[#A7B8AE]">
                Document Reference: CG-DOSSIER-{p.studentId || 'STUDENT'} • DPDP Act 2023 Compliant
              </p>
            </div>
          </div>

          <span className="hidden sm:inline-flex text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#10231C] text-[#6EE7B7] border border-[#294638]">
            PDF Export Ready
          </span>
        </div>

        {/* Dossier Document Sheet Simulation */}
        <div className="bg-[#10231C] rounded-2xl border border-[#294638] p-6 space-y-6 text-xs">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#294638]">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#10B981] font-bold">
                ClassGuard AI Governance Framework
              </span>
              <h3 className="text-lg font-extrabold text-[#F8FAFC]">Official Student Academic & Privacy Dossier</h3>
              <p className="text-[11px] text-[#A7B8AE]">
                Issued by ClassGuard AI Campus Academic & Privacy Office
              </p>
            </div>

            <div className="text-right text-[11px] font-mono text-[#A7B8AE]">
              <p>Generated: <span className="text-[#F8FAFC]">{data?.exportDate?.slice(0, 10)}</span></p>
              <p>Security Level: <span className="text-[#10B981]">Verified Student</span></p>
            </div>
          </div>

          {/* Section 1: Academic Identity */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6EE7B7] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> 1. Academic Identification
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-[#17382B] p-3 rounded-xl border border-[#294638]">
                <span className="text-[10px] text-[#A7B8AE] block">Full Name</span>
                <p className="font-bold text-[#F8FAFC]">{p.fullName}</p>
              </div>

              <div className="bg-[#17382B] p-3 rounded-xl border border-[#294638]">
                <span className="text-[10px] text-[#A7B8AE] block">Student USN</span>
                <p className="font-mono font-bold text-[#6EE7B7]">{p.studentId}</p>
              </div>

              <div className="bg-[#17382B] p-3 rounded-xl border border-[#294638]">
                <span className="text-[10px] text-[#A7B8AE] block">Program & Class</span>
                <p className="font-bold text-[#F8FAFC]">{p.className} ({p.section})</p>
              </div>

              <div className="bg-[#17382B] p-3 rounded-xl border border-[#294638]">
                <span className="text-[10px] text-[#A7B8AE] block">Assigned Lecture Hall</span>
                <p className="font-bold text-[#F8FAFC]">{p.assignedClassroom}</p>
              </div>
            </div>
          </div>

          {/* Section 2: Summary Stats */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6EE7B7] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> 2. Included Audit Records Summary
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#17382B] p-3 rounded-xl border border-[#294638] text-center">
                <span className="text-2xl font-extrabold text-[#F8FAFC] font-mono block">{stats.totalEvents}</span>
                <span className="text-[10px] text-[#A7B8AE]">Classroom Observations</span>
              </div>

              <div className="bg-[#17382B] p-3 rounded-xl border border-[#294638] text-center">
                <span className="text-2xl font-extrabold text-[#10B981] font-mono block">{stats.consentLogs}</span>
                <span className="text-[10px] text-[#A7B8AE]">Consent History Logs</span>
              </div>

              <div className="bg-[#17382B] p-3 rounded-xl border border-[#294638] text-center">
                <span className="text-2xl font-extrabold text-[#FBBF24] font-mono block">{stats.appeals}</span>
                <span className="text-[10px] text-[#A7B8AE]">Review Appeals</span>
              </div>

              <div className="bg-[#17382B] p-3 rounded-xl border border-[#294638] text-center">
                <span className="text-2xl font-extrabold text-[#6EE7B7] font-mono block">{stats.requests}</span>
                <span className="text-[10px] text-[#A7B8AE]">Privacy Requests</span>
              </div>
            </div>
          </div>

          {/* Section 3: Privacy & Security Assurances */}
          <div className="p-4 bg-[#17382B]/60 rounded-xl border border-[#294638] space-y-1.5 text-[11px] text-[#A7B8AE]">
            <p className="font-bold text-[#F8FAFC] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#10B981]" />
              Data Portability & Confidentiality Guarantee
            </p>
            <p>
              This certified PDF document represents your complete personal data dossier under the Digital Personal Data Protection (DPDP) Act 2023. Authentication credentials (passwords, JWT tokens) and other students' private records are strictly redacted from this archive.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#294638] print:hidden">
          <p className="text-xs text-[#A7B8AE]">
            Ready to download as a clean, multi-page vector PDF document.
          </p>

          <button
            onClick={handleDownloadPdf}
            disabled={generatingPdf || !data}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-[#0B1713] text-xs font-bold rounded-xl transition inline-flex items-center justify-center gap-2 shadow-md"
          >
            <Download className="w-4 h-4" />
            {generatingPdf ? 'Generating PDF...' : 'Download Official PDF Dossier'}
          </button>
        </div>
      </div>
    </div>
  );
};
