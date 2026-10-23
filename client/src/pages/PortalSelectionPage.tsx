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
        <div className="bg-[#17382B] border border-[#294638] rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              user.role === 'STUDENT' ? 'bg-[#204735] text-[#10B981] border-[#294638]' :
              user.role === 'ADMIN' ? 'bg-[#204735] text-[#FBBF24] border-[#294638]' :
              'bg-[#204735] text-[#6EE7B7] border-[#294638]'
            }`}>
              {user.role === 'STUDENT' ? <GraduationCap className="w-5 h-5" /> :
               user.role === 'ADMIN' ? <KeyRound className="w-5 h-5" /> :
               <School className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#F8FAFC]">Active Session: {user.fullName}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#10231C] text-[#6EE7B7] border border-[#294638] font-bold">
                  {user.role} PORTAL
                </span>
              </div>
              <p className="text-xs text-[#A7B8AE]">
                You are currently signed in. Select another portal below to switch accounts, or return to your active workspace.
              </p>
            </div>
          </div>

          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow flex items-center gap-1.5"
            >
              <span>← Return to My Workspace</span>
            </button>
          )}
        </div>
      )}

      {/* Title & System Vision */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#204735] border border-[#294638] text-[#6EE7B7] px-3.5 py-1.5 rounded-full text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          <span>Multi-Role Access Control & Dedicated Portals</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
          Select Your Access Portal
        </h1>

        <p className="text-sm text-[#A7B8AE] leading-relaxed">
          ClassGuard AI separates student privacy, teacher instruction, and institutional administration into <strong>three distinct role-tailored interfaces</strong>.
        </p>
      </div>

      {/* 3 Distinct Portal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* PORTAL 1: STUDENT */}
        <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-[#10B981]/60 transition group relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-[#10231C] text-[#10B981] border border-[#294638] rounded-2xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold bg-[#204735] text-[#6EE7B7] px-2.5 py-0.5 rounded-full font-mono uppercase border border-[#294638]">
                Student Access
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#F8FAFC] tracking-tight">1. Student Portal</h2>
              <p className="text-xs text-[#A7B8AE] mt-1 leading-relaxed">
                Dedicated interface for students to manage consent, inspect stored data, and request biometric erasure.
              </p>
            </div>

            {/* Feature checklist */}
            <div className="space-y-2 border-t border-[#294638] pt-3 text-xs text-[#A7B8AE]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />
                <span className="text-[#F8FAFC]/90">Consent status & instant withdrawal</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />
                <span className="text-[#F8FAFC]/90">GDPR / DPDP data package export</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />
                <span className="text-[#F8FAFC]/90">View only verified personal safety records</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#A7B8AE]/60 flex-shrink-0" />
                <span className="text-[#A7B8AE] italic">No access to other students' data</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => onSelectRole('STUDENT')}
              className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-1.5"
            >
              <span>Enter Student Login / Register</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PORTAL 2: CLASS TEACHER */}
        <div className="bg-[#17382B] border border-[#10B981]/50 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-[#10B981] ring-1 ring-[#10B981]/30 transition group relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-[#10231C] text-[#6EE7B7] border border-[#294638] rounded-2xl flex items-center justify-center">
                <School className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold bg-[#204735] text-[#6EE7B7] px-2.5 py-0.5 rounded-full font-mono uppercase border border-[#294638]">
                Teacher Access
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#F8FAFC] tracking-tight">2. Class Teacher Portal</h2>
              <p className="text-xs text-[#A7B8AE] mt-1 leading-relaxed">
                Instructional safety and engagement cockpit with live local MediaPipe inference, audio meter, and human verification.
              </p>
            </div>

            {/* Feature checklist */}
            <div className="space-y-2 border-t border-[#294638] pt-3 text-xs text-[#A7B8AE]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6EE7B7] flex-shrink-0" />
                <span className="text-[#F8FAFC]/90">Live camera feed with EAR & yaw HUD</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6EE7B7] flex-shrink-0" />
                <span className="text-[#F8FAFC]/90">Real-time alerts (Attention, Disturbance, Safety)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6EE7B7] flex-shrink-0" />
                <span className="text-[#F8FAFC]/90">1–3 snapshot teacher verification modal</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6EE7B7] flex-shrink-0" />
                <span className="text-[#F8FAFC]/90">Seating heatmap & lecture pace markers</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => onSelectRole('TEACHER')}
              className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-1.5"
            >
              <span>Enter Teacher Login / Register</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PORTAL 3: SUPER ADMIN */}
        <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-[#6EE7B7]/60 transition group relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-[#10231C] text-[#FBBF24] border border-[#294638] rounded-2xl flex items-center justify-center">
                <KeyRound className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold bg-[#204735] text-[#FBBF24] px-2.5 py-0.5 rounded-full font-mono uppercase border border-[#294638]">
                Admin Authority
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#F8FAFC] tracking-tight">3. Super Admin Portal</h2>
              <p className="text-xs text-[#A7B8AE] mt-1 leading-relaxed">
                Institutional oversight, classrooms setup, security audit logs, and 24h / 7d / 30d data retention configuration.
              </p>
            </div>

            {/* Feature checklist */}
            <div className="space-y-2 border-t border-[#294638] pt-3 text-xs text-[#A7B8AE]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#FBBF24] flex-shrink-0" />
                <span className="text-[#F8FAFC]/90">Configure 24h / 7d / 30d snapshot retention</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#FBBF24] flex-shrink-0" />
                <span className="text-[#F8FAFC]/90">Tamper-evident system audit log registry</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#FBBF24] flex-shrink-0" />
                <span className="text-[#F8FAFC]/90">Create classes & manage teacher accounts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#FBBF24] flex-shrink-0" />
                <span className="text-[#F8FAFC]/90">Calibrate AI vision & noise sensitivity sliders</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => onSelectRole('ADMIN')}
              className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-1.5"
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
