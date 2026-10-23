import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  ShieldCheck, GraduationCap, School, KeyRound, LogOut,
  CheckCircle2, ArrowLeftRight
} from 'lucide-react';
import { Role } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenPortalSelection: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenPortalSelection,
}) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const getPortalBadge = () => {
    if (user?.role === 'STUDENT') {
      return (
        <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
          <GraduationCap className="w-3 h-3" /> Student Portal
        </span>
      );
    }
    if (user?.role === 'ADMIN') {
      return (
        <span className="text-[10px] uppercase font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
          <KeyRound className="w-3 h-3" /> Super Admin Portal
        </span>
      );
    }
    return (
      <span className="text-[10px] uppercase font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
        <School className="w-3 h-3" /> Teacher Portal
      </span>
    );
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab(user?.role === 'STUDENT' ? 'dashboard' : 'monitoring')}>
            <div className={`p-2 rounded-xl border flex items-center justify-center ${
              user?.role === 'STUDENT'
                ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400'
                : user?.role === 'ADMIN'
                ? 'bg-purple-600/20 border-purple-500/30 text-purple-400'
                : 'bg-blue-600/20 border-blue-500/30 text-blue-400'
            }`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">{t.appName}</span>
                {getPortalBadge()}
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {user?.role === 'STUDENT'
                  ? 'Student Privacy, Consent & Academic Safety Records'
                  : user?.role === 'ADMIN'
                  ? 'Institutional Governance & Audit Trails'
                  : 'Teacher Safety & Attention Cockpit'}
              </p>
            </div>
          </div>

          {/* Right Tools: Portal Gateway Switcher & Language */}
          <div className="flex items-center space-x-3">
            {/* Switch Portal Button */}
            <button
              onClick={onOpenPortalSelection}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700 transition shadow-sm"
              title="Select Student, Teacher, or Admin Portals"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
              <span>Portals</span>
            </button>

            {/* Language Selector */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 text-xs font-semibold rounded ${
                  language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('kn')}
                className={`px-2 py-1 text-xs font-semibold rounded ${
                  language === 'kn' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Kannada Translation"
              >
                ಕನ್ನಡ
              </button>
            </div>

            {/* User Profile / Logout */}
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-semibold text-slate-200">{user.fullName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {user.role}
                  </p>
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenPortalSelection}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
              >
                Login / Register
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Role-Tailored Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/60 no-scrollbar text-xs">
          {/* 1. STUDENT INTERFACE TABS */}
          {user?.role === 'STUDENT' && (
            <>
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  currentTab === 'dashboard'
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                🎓 My Profile & Consent Status
              </button>
              <button
                onClick={() => setCurrentTab('history')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  currentTab === 'history'
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                📜 My Verified Event Records
              </button>
              <button
                onClick={() => setCurrentTab('privacy')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  currentTab === 'privacy'
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                🔒 Privacy Center & Data Export
              </button>
              <button
                onClick={() => setCurrentTab('about')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  currentTab === 'about'
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                ℹ️ Student Privacy Rights & DPDP Act
              </button>
            </>
          )}

          {/* 2. CLASS TEACHER INTERFACE TABS */}
          {user?.role === 'TEACHER' && (
            <>
              <button
                onClick={() => setCurrentTab('monitoring')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  currentTab === 'monitoring'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                📹 Live Camera Monitoring Feed
              </button>
              <button
                onClick={() => setCurrentTab('alerts')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  currentTab === 'alerts'
                    ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                🔔 AI Safety & Attention Alerts
              </button>
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  currentTab === 'dashboard'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                📊 Teacher Overview Dashboard
              </button>
              <button
                onClick={() => setCurrentTab('classrooms')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  currentTab === 'classrooms'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                🏫 Assigned Classrooms
              </button>
              <button
                onClick={() => setCurrentTab('reports')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  currentTab === 'reports'
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                📑 Lecture Pace & Session Reports
              </button>
              <button
                onClick={() => setCurrentTab('history')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  currentTab === 'history'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                📜 Observation History
              </button>
              <button
                onClick={() => setCurrentTab('registration')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  currentTab === 'registration'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                ✍️ Student Enrollment
              </button>
              <button
                onClick={() => setCurrentTab('about')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  currentTab === 'about'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                ℹ️ System Guide & Ethics
              </button>
            </>
          )}

          {/* 3. SUPER ADMIN INTERFACE TABS */}
          {user?.role === 'ADMIN' && (
            <>
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  currentTab === 'dashboard'
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                🛡️ Super Admin Governance
              </button>
              <button
                onClick={() => setCurrentTab('classrooms')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  currentTab === 'classrooms'
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                🏫 Classroom Infrastructure
              </button>
              <button
                onClick={() => setCurrentTab('consents')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  currentTab === 'consents'
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                📝 Consent Registry
              </button>
              <button
                onClick={() => setCurrentTab('audit')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  currentTab === 'audit'
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                🔍 Security Audit Logs
              </button>
              <button
                onClick={() => setCurrentTab('config')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  currentTab === 'config'
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                ⚙️ AI Vision Sensitivity Calibration
              </button>
              <button
                onClick={() => setCurrentTab('privacy')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  currentTab === 'privacy'
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                🔒 Data Retention Policy (24h/7d/30d)
              </button>
              <button
                onClick={() => setCurrentTab('registration')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  currentTab === 'registration'
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                ✍️ Authorize Student
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
