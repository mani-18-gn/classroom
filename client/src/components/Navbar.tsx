import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  ShieldCheck, GraduationCap, School, KeyRound, LogOut,
  Menu, Lock, Sparkles, CheckCircle2
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab?: (tab: string) => void;
  onOpenPortalSelection?: () => void;
  onToggleMobileSidebar?: () => void;
  isStandalone?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onOpenPortalSelection,
  onToggleMobileSidebar,
  isStandalone = false,
}) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const getPageInfo = () => {
    switch (currentTab) {
      case 'monitoring':
        return {
          title: 'Live Camera Monitoring',
          subtitle: 'Real-time on-device attention & safety telemetry',
          badge: 'EDGE ACTIVE'
        };
      case 'alerts':
        return {
          title: 'Safety & Attention Alerts',
          subtitle: 'Teacher verification cockpit for flagged events',
          badge: 'IN-THE-LOOP'
        };
      case 'dashboard':
        if (user?.role === 'STUDENT') {
          return {
            title: 'Student Academic Portal',
            subtitle: 'Personal attendance, engagement & DPDP consent records',
            badge: 'VERIFIED'
          };
        }
        if (user?.role === 'ADMIN') {
          return {
            title: 'Super Admin Governance',
            subtitle: 'Institutional oversight, compliance & security controls',
            badge: 'AUDIT READY'
          };
        }
        return {
          title: 'Teacher Overview Dashboard',
          subtitle: 'Classroom performance, pace analysis & engagement metrics',
          badge: 'FACULTY'
        };
      case 'classrooms':
        return {
          title: 'Classroom Management',
          subtitle: 'Configure lecture halls, camera assignments & live tracking',
          badge: 'INFRA'
        };
      case 'reports':
        return {
          title: 'Session & Pace Reports',
          subtitle: 'Comprehensive post-lecture safety & attention summaries',
          badge: 'ANALYTICS'
        };
      case 'history':
        return {
          title: 'Observation History',
          subtitle: 'Timestamped timeline of verified classroom events',
          badge: 'LOGS'
        };
      case 'registration':
        return {
          title: 'Student Enrollment',
          subtitle: 'Register biometric profiles with explicit digital consent',
          badge: 'ONBOARDING'
        };
      case 'consents':
        return {
          title: 'Consent Registry',
          subtitle: 'DPDP Act compliance registry & parental authorizations',
          badge: 'DPDP ACT'
        };
      case 'audit':
        return {
          title: 'Security Audit Logs',
          subtitle: 'Tamper-evident logs of teacher verifications & logins',
          badge: 'SECURITY'
        };
      case 'config':
        return {
          title: 'AI Sensitivity Calibration',
          subtitle: 'Eye aspect ratio (EAR) and distraction threshold controls',
          badge: 'VISION AI'
        };
      case 'privacy':
        return {
          title: 'Privacy Center & Retention',
          subtitle: 'Automated data purging policies & student data exports',
          badge: 'PRIVACY'
        };
      case 'about':
        return {
          title: 'System Guide & Ethics',
          subtitle: 'Educational philosophy, ethical AI framework & guidelines',
          badge: 'STANDARDS'
        };
      default:
        return {
          title: 'ClassGuard AI Cockpit',
          subtitle: 'Intelligent classroom safety & attention monitoring',
          badge: 'ACTIVE'
        };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <header className="bg-[#10231C]/90 backdrop-blur-md border-b border-[#294638] sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Toggle & Page Info */}
          <div className="flex items-center space-x-3">
            {!isStandalone && onToggleMobileSidebar && (
              <button
                onClick={onToggleMobileSidebar}
                className="p-2 rounded-xl text-[#A7B8AE] hover:text-[#F8FAFC] hover:bg-[#17382B] lg:hidden transition border border-[#294638]"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {isStandalone ? (
              /* Standalone Brand View (Auth / Gateway pages) */
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-[#17382B] border border-[#294638] flex items-center justify-center text-[#10B981] shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-base text-[#F8FAFC] tracking-tight">{t.appName}</span>
                  <p className="text-[11px] text-[#A7B8AE] hidden sm:block">
                    Smart Classroom Safety & Privacy-First Attention Monitoring
                  </p>
                </div>
              </div>
            ) : (
              /* Standard Dashboard View Title */
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-bold text-base sm:text-lg text-[#F8FAFC] tracking-tight leading-none">
                    {pageInfo.title}
                  </h1>
                  <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#204735] text-[#6EE7B7] border border-[#294638] tracking-wider uppercase">
                    {pageInfo.badge}
                  </span>
                </div>
                <p className="text-xs text-[#A7B8AE] hidden md:block mt-0.5">
                  {pageInfo.subtitle}
                </p>
              </div>
            )}
          </div>

          {/* Right Tools: Privacy Pill, Language & Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Edge AI Privacy Badge */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#17382B] border border-[#294638] text-[11px] text-[#A7B8AE]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[#6EE7B7] font-medium">Edge AI:</span>
              <span>Local Processing</span>
            </div>

            {/* Language Selector */}
            <div className="flex items-center bg-[#10231C] rounded-xl p-0.5 border border-[#294638]">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 text-xs font-semibold rounded-lg transition ${
                  language === 'en'
                    ? 'bg-[#10B981] text-[#0B1713] font-bold shadow-xs'
                    : 'text-[#A7B8AE] hover:text-[#F8FAFC]'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('kn')}
                className={`px-2 py-1 text-xs font-semibold rounded-lg transition ${
                  language === 'kn'
                    ? 'bg-[#10B981] text-[#0B1713] font-bold shadow-xs'
                    : 'text-[#A7B8AE] hover:text-[#F8FAFC]'
                }`}
                title="Kannada Translation"
              >
                ಕನ್ನಡ
              </button>
            </div>

            {/* User Profile / Logout */}
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="hidden sm:block text-right pl-1">
                  <p className="text-xs font-semibold text-[#F8FAFC] leading-none">{user.fullName}</p>
                  <p className="text-[10px] text-[#6EE7B7] font-mono mt-0.5 uppercase">
                    {user.role}
                  </p>
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 text-[#A7B8AE] hover:text-[#F87171] hover:bg-[#F87171]/15 rounded-xl border border-transparent hover:border-[#F87171]/30 transition"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenPortalSelection}
                className="bg-[#10B981] hover:bg-[#059669] text-[#0B1713] text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-sm"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
