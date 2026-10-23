import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  GraduationCap, School, ShieldAlert, ArrowRight, Sparkles,
  CheckCircle2, Lock, EyeOff, ShieldCheck, KeyRound
} from 'lucide-react';
import { Role } from '../types';

interface PortalSelectionPageProps {
  onSelectRole: (role: Role) => void;
  onBackToDashboard?: () => void;
}

export const PortalSelectionPage: React.FC<PortalSelectionPageProps> = ({
  onSelectRole,
  onBackToDashboard,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Active Session Indicator (if user is logged in) */}
      {user && (
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              user.role === 'STUDENT' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
              user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
              'bg-blue-500/20 text-blue-400 border-blue-500/30'
            }`}>
              {user.role === 'STUDENT' ? <GraduationCap className="w-5 h-5" /> :
               user.role === 'ADMIN' ? <KeyRound className="w-5 h-5" /> :
               <School className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Active Session: {user.fullName}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                  {user.role} PORTAL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                You are currently signed in. Select another portal below to switch accounts, or return to your active workspace.
              </p>
            </div>
          </div>

          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow flex items-center gap-1.5"
            >
              <span>← Return to My Workspace</span>
            </button>
          )}
        </div>
      )}

      {/* Title & System Vision */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 px-3.5 py-1.5 rounded-full text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Multi-Role Access Control & Dedicated Portals</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Select Your Access Portal
        </h1>

        <p className="text-sm text-slate-400 leading-relaxed">
          ClassGuard AI separates student privacy, teacher instruction, and institutional administration into <strong>three distinct role-tailored interfaces</strong>.
        </p>
      </div>

      {/* 3 Distinct Portal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* PORTAL 1: STUDENT */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-emerald-500/60 transition group relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono uppercase">
                Student Access
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">1. Student Portal</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Dedicated interface for students to manage consent, inspect stored data, and request biometric erasure.
              </p>
            </div>

            {/* Feature checklist */}
            <div className="space-y-2 border-t border-slate-800/80 pt-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Consent status & instant withdrawal</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>GDPR / DPDP data package export</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>View only verified personal safety records</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span className="text-slate-400 italic">No access to other students' data</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => onSelectRole('STUDENT')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-1.5"
            >
              <span>Enter Student Login / Register</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PORTAL 2: CLASS TEACHER */}
        <div className="bg-slate-900 border border-blue-500/40 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-blue-500/70 transition group relative overflow-hidden ring-2 ring-blue-500/20">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-2xl flex items-center justify-center">
                <School className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-mono uppercase">
                Teacher Access
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">2. Class Teacher Portal</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Instructional safety and engagement cockpit with live local MediaPipe inference, audio meter, and human verification.
              </p>
            </div>

            {/* Feature checklist */}
            <div className="space-y-2 border-t border-slate-800/80 pt-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span>Live camera feed with EAR & yaw HUD</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span>Real-time alerts (Attention, Disturbance, Safety)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span>1–3 snapshot teacher verification modal</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span>Seating heatmap & lecture pace markers</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => onSelectRole('TEACHER')}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-1.5"
            >
              <span>Enter Teacher Login / Register</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PORTAL 3: SUPER ADMIN */}
        <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-purple-500/60 transition group relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-2xl flex items-center justify-center">
                <KeyRound className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono uppercase">
                Admin Authority
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">3. Super Admin Portal</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Institutional oversight, classrooms setup, security audit logs, and 24h / 7d / 30d data retention configuration.
              </p>
            </div>

            {/* Feature checklist */}
            <div className="space-y-2 border-t border-slate-800/80 pt-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <span>Configure 24h / 7d / 30d snapshot retention</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <span>Tamper-evident system audit log registry</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <span>Create classes & manage teacher accounts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <span>Calibrate AI vision & noise sensitivity sliders</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => onSelectRole('ADMIN')}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-1.5"
            >
              <span>Enter Admin Login / Register</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
