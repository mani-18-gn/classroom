import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  ShieldCheck, HelpCircle, Sparkles, Scale, BookOpen,
  Award, CheckCircle2, Lock, EyeOff, UserCheck
} from 'lucide-react';

export const HelpAboutPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-tight">ClassGuard AI — Ethics, Architecture & Operational Guide</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Privacy-first teaching improvement system designed for academic integrity and human agency.
        </p>
      </div>

      {/* Operational Guide for Verification & Workflow */}
      <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-500/30 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Standard Operating Protocol: Human-in-the-Loop Sleeping Verification
          </h2>
        </div>

        <ol className="space-y-3 text-xs text-slate-300">
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
              1
            </span>
            <div>
              <strong className="text-white">Start the Live Monitoring session with real camera stream:</strong>
              <p className="text-slate-400 mt-0.5">
                Notice the privacy guarantee banner: zero continuous raw video footage leaves the device, and all face landmark inference runs locally in the browser via WebAssembly/WebGL.
              </p>
            </div>
          </li>

          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
              2
            </span>
            <div>
              <strong className="text-white">Continuous Eye-Closure Detection (Drowsiness):</strong>
              <p className="text-slate-400 mt-0.5">
                When a student experiences prolonged eye-closure passing the temporal threshold (&gt;8s), evidence snapshots are captured and a pending teacher alert appears labeled: <em>"Possible prolonged eye closure detected — Teacher verification required."</em>
              </p>
            </div>
          </li>

          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
              3
            </span>
            <div>
              <strong className="text-white">Classroom Noise & Acoustic Analysis:</strong>
              <p className="text-slate-400 mt-0.5">
                Ambient classroom acoustics are tracked via Web Audio API, distinguishing between productive lecture delivery, interactive discussions, and disruptive noise levels.
              </p>
            </div>
          </li>

          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
              4
            </span>
            <div>
              <strong className="text-white">Mandatory Teacher Verification with Reason:</strong>
              <p className="text-slate-400 mt-0.5">
                The class teacher clicks <strong>[Review & Verify]</strong> to inspect captured frames and must provide a verified reason (e.g. <em>"Student was sleeping with head rested on desk"</em>). Only after teacher verification is the official record registered across Student, Teacher, and Admin dashboards.
              </p>
            </div>
          </li>

          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
              5
            </span>
            <div>
              <strong className="text-white">Institution-Wide Governance & Student Fairness:</strong>
              <blockquote className="mt-1 border-l-2 border-blue-400 pl-3 text-blue-200 italic font-medium">
                "ClassGuard AI strictly enforces human-in-the-loop oversight. Unverified automated AI detections are never held against students; every sleeping record requires teacher confirmation and explicit justification."
              </blockquote>
            </div>
          </li>
        </ol>
      </div>

      {/* Legal & Compliance Alignment */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">Legal & Regulatory Compliance Framework</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5">
            <strong className="text-emerald-400 block font-mono">DPDP Act 2023 (India)</strong>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Provides verifiable consent withdrawal, purpose limitation, automatic data minimization, and immediate biometric erasure upon consent revocation.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5">
            <strong className="text-blue-400 block font-mono">FERPA & GDPR Principles</strong>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Protects educational records from third-party leakage. No continuous footage is stored, preventing biometric surveillance misuse.
            </p>
          </div>
        </div>
      </div>

      {/* Biometric Consent & Student Privacy Notice */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-2 text-xs text-slate-400">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Biometric Consent & Student Privacy Notice</h4>
        <p className="text-[11px] leading-relaxed">
          Students are enrolled into the classroom database strictly with explicit consent. Facial landmark templates are processed locally to assist the class teacher with engagement and drowsiness detection, with full student rights to inspect and withdraw consent anytime.
        </p>
      </div>
    </div>
  );
};
