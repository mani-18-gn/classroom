import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  ShieldCheck, GraduationCap, School, KeyRound, LogOut,
  Video, Bell, LayoutDashboard, Building2, FileSpreadsheet,
  History, UserPlus, Info, ClipboardCheck, FileSearch,
  Sliders, Lock, Shield, X, Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onOpenPortalSelection?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpenMobile,
  setIsOpenMobile,
  onOpenPortalSelection
}) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  // Navigation items based on active role
  const getNavItems = (): { section: string; items: NavItem[] }[] => {
    if (user?.role === 'STUDENT') {
      return [
        {
          section: 'Student Overview',
          items: [
            { id: 'dashboard', label: 'My Profile & Consent', icon: GraduationCap },
            { id: 'history', label: 'Verified Records', icon: History },
          ]
        },
        {
          section: 'Compliance & Ethics',
          items: [
            { id: 'privacy', label: 'Privacy Center & Export', icon: Lock },
            { id: 'about', label: 'DPDP Privacy Rights', icon: Info },
          ]
        }
      ];
    }

    if (user?.role === 'ADMIN') {
      return [
        {
          section: 'Governance',
          items: [
            { id: 'dashboard', label: 'Governance Overview', icon: ShieldCheck },
            { id: 'classrooms', label: 'Classroom Infrastructure', icon: Building2 },
            { id: 'registration', label: 'Authorize Student', icon: UserPlus },
          ]
        },
        {
          section: 'Security & Consent',
          items: [
            { id: 'consents', label: 'Consent Registry', icon: ClipboardCheck },
            { id: 'audit', label: 'Security Audit Logs', icon: FileSearch },
            { id: 'config', label: 'Vision Sensitivity', icon: Sliders },
            { id: 'privacy', label: 'Retention Policy (24h/7d)', icon: Lock },
          ]
        }
      ];
    }

    // Default: TEACHER
    return [
      {
        section: 'Classroom Cockpit',
        items: [
          { id: 'monitoring', label: 'Live Monitoring Feed', icon: Video, badge: 'Live' },
          { id: 'alerts', label: 'Attention Alerts', icon: Bell },
          { id: 'dashboard', label: 'Teacher Dashboard', icon: LayoutDashboard },
          { id: 'classrooms', label: 'Assigned Classrooms', icon: School },
        ]
      },
      {
        section: 'Analytics & Management',
        items: [
          { id: 'reports', label: 'Pace & Session Reports', icon: FileSpreadsheet },
          { id: 'history', label: 'Observation History', icon: History },
          { id: 'registration', label: 'Student Enrollment', icon: UserPlus },
          { id: 'about', label: 'Guide & Ethics', icon: Info },
        ]
      }
    ];
  };

  const navGroups = getNavItems();

  const handleTabClick = (tabId: string) => {
    setCurrentTab(tabId);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpenMobile(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#10231C] border-r border-[#294638] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar navigation"
      >
        {/* Brand / Logo Header */}
        <div className="p-5 border-b border-[#294638] flex items-center justify-between">
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => handleTabClick(user?.role === 'STUDENT' ? 'dashboard' : 'monitoring')}
          >
            <div className="w-10 h-10 rounded-xl bg-[#17382B] border border-[#294638] flex items-center justify-center text-[#10B981] shadow-sm group-hover:border-[#10B981] transition">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-base text-[#F8FAFC] tracking-tight">{t.appName}</span>
              <p className="text-[11px] text-[#A7B8AE] font-medium">Smart Classroom Safety</p>
            </div>
          </div>

          <button
            onClick={() => setIsOpenMobile(false)}
            className="p-1.5 rounded-lg text-[#A7B8AE] hover:text-[#F8FAFC] hover:bg-[#17382B] lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Role Indicator Banner */}
        <div className="px-4 pt-4 pb-2">
          <div className="p-2.5 rounded-xl bg-[#17382B] border border-[#294638] flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-xs font-semibold text-[#F8FAFC]">
              {user?.role === 'STUDENT'
                ? 'Student Portal'
                : user?.role === 'ADMIN'
                ? 'Super Admin Portal'
                : 'Teacher Cockpit'}
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6 no-scrollbar">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-semibold text-[#A7B8AE] uppercase tracking-wider mb-2">
                {group.section}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition group relative ${
                      isActive
                        ? 'bg-[#17382B] text-[#F8FAFC] shadow-sm border border-[#294638]'
                        : 'text-[#A7B8AE] hover:text-[#F8FAFC] hover:bg-[#17382B]/60'
                    }`}
                  >
                    {/* Mint Active Indicator Bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#6EE7B7] rounded-r-full shadow-xs" />
                    )}

                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition ${
                          isActive
                            ? 'text-[#10B981]'
                            : 'text-[#A7B8AE] group-hover:text-[#6EE7B7]'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#10B981]/20 text-[#6EE7B7] border border-[#10B981]/30">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer / System Status & User Bar */}
        <div className="p-3 border-t border-[#294638] bg-[#0B1713]/50 space-y-3">
          {/* Privacy & Edge Inference Card */}
          <div className="p-2.5 rounded-xl bg-[#17382B]/60 border border-[#294638] text-[11px]">
            <div className="flex items-center gap-2 text-[#6EE7B7] font-semibold mb-1">
              <Shield className="w-3.5 h-3.5 text-[#10B981]" />
              <span>100% On-Device AI</span>
            </div>
            <p className="text-[#A7B8AE] text-[10px] leading-tight">
              Zero cloud video transmission. DPDP Act biometric compliance.
            </p>
          </div>

          {/* User Profile Bar */}
          {user ? (
            <div className="p-2 rounded-xl bg-[#17382B] border border-[#294638] flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#204735] border border-[#294638] flex items-center justify-center text-xs font-bold text-[#6EE7B7]">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#F8FAFC] truncate">{user.fullName}</p>
                  <p className="text-[10px] text-[#A7B8AE] font-mono uppercase">{user.role}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-[#A7B8AE] hover:text-[#F87171] hover:bg-[#F87171]/15 transition"
                title="Sign Out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenPortalSelection}
              className="w-full py-2 px-3 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#0B1713] text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <KeyRound className="w-4 h-4" />
              <span>Login to Portal</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
