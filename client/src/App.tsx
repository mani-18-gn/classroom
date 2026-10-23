import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Role } from './types';

// Auth Portals
import { PortalSelectionPage } from './pages/PortalSelectionPage';
import { StudentAuthPage } from './pages/StudentAuthPage';
import { TeacherAuthPage } from './pages/TeacherAuthPage';
import { AdminAuthPage } from './pages/AdminAuthPage';

// Portal Content Pages
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentRegistrationPage } from './pages/StudentRegistrationPage';
import { ClassroomManagementPage } from './pages/ClassroomManagementPage';
import { AlertsPage } from './pages/AlertsPage';
import { EventHistoryPage } from './pages/EventHistoryPage';
import { PrivacyCenterPage } from './pages/PrivacyCenterPage';
import { ConsentManagementPage } from './pages/ConsentManagementPage';
import { AIConfigPage } from './pages/AIConfigPage';
import { SessionReportPage } from './pages/SessionReportPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { HelpAboutPage } from './pages/HelpAboutPage';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  // Navigation tab state
  const [currentTab, setCurrentTab] = useState<string>('monitoring');
  const [selectedSessionId, setSelectedSessionId] = useState<number>(1);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Portal selection & auth screens state
  const [authView, setAuthView] = useState<'PORTAL_GATEWAY' | 'STUDENT_AUTH' | 'TEACHER_AUTH' | 'ADMIN_AUTH' | null>(null);

  // Triggered when user clicks "Portals" or needs to switch
  const handleOpenPortalSelection = () => {
    setAuthView('PORTAL_GATEWAY');
  };

  const handleSelectRoleFromGateway = (role: Role) => {
    if (role === 'STUDENT') setAuthView('STUDENT_AUTH');
    else if (role === 'TEACHER') setAuthView('TEACHER_AUTH');
    else if (role === 'ADMIN') setAuthView('ADMIN_AUTH');
  };

  const handleAuthSuccess = (targetRole?: Role) => {
    setAuthView(null);
    const effectiveRole = targetRole || user?.role;
    if (effectiveRole === 'STUDENT') {
      setCurrentTab('dashboard');
    } else if (effectiveRole === 'ADMIN') {
      setCurrentTab('dashboard');
    } else {
      setCurrentTab('monitoring');
    }
  };

  // 0. Session initialization loader
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1713] flex flex-col items-center justify-center space-y-4 text-[#A7B8AE] font-sans">
        <div className="w-12 h-12 border-4 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin shadow-lg" />
        <p className="text-xs font-mono tracking-widest uppercase text-[#6EE7B7]">
          Initializing ClassGuard AI Secure Session...
        </p>
      </div>
    );
  }

  // If Auth modal/screen is active OR user is not signed in
  const activeView = authView || (!user ? 'PORTAL_GATEWAY' : null);

  if (activeView === 'PORTAL_GATEWAY') {
    return (
      <div className="min-h-screen bg-[#0B1713] text-[#F8FAFC] flex flex-col font-sans">
        <Navbar
          currentTab={currentTab}
          onOpenPortalSelection={handleOpenPortalSelection}
          isStandalone={true}
        />
        <PortalSelectionPage
          onSelectRole={handleSelectRoleFromGateway}
          onBackToDashboard={user ? () => setAuthView(null) : undefined}
        />
      </div>
    );
  }

  if (activeView === 'STUDENT_AUTH') {
    return (
      <div className="min-h-screen bg-[#0B1713] text-[#F8FAFC] flex flex-col font-sans">
        <Navbar
          currentTab={currentTab}
          onOpenPortalSelection={handleOpenPortalSelection}
          isStandalone={true}
        />
        <StudentAuthPage
          onBackToPortalSelection={() => setAuthView('PORTAL_GATEWAY')}
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  if (activeView === 'TEACHER_AUTH') {
    return (
      <div className="min-h-screen bg-[#0B1713] text-[#F8FAFC] flex flex-col font-sans">
        <Navbar
          currentTab={currentTab}
          onOpenPortalSelection={handleOpenPortalSelection}
          isStandalone={true}
        />
        <TeacherAuthPage
          onBackToPortalSelection={() => setAuthView('PORTAL_GATEWAY')}
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  if (activeView === 'ADMIN_AUTH') {
    return (
      <div className="min-h-screen bg-[#0B1713] text-[#F8FAFC] flex flex-col font-sans">
        <Navbar
          currentTab={currentTab}
          onOpenPortalSelection={handleOpenPortalSelection}
          isStandalone={true}
        />
        <AdminAuthPage
          onBackToPortalSelection={() => setAuthView('PORTAL_GATEWAY')}
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  // Render role-specific content based on active user role
  const renderContent = () => {
    // 1. STUDENT INTERFACE
    if (user?.role === 'STUDENT') {
      switch (currentTab) {
        case 'dashboard':
          return <StudentDashboard />;
        case 'history':
          return <EventHistoryPage />;
        case 'privacy':
          return <PrivacyCenterPage />;
        case 'about':
          return <HelpAboutPage />;
        default:
          return <StudentDashboard />;
      }
    }

    // 2. SUPER ADMIN INTERFACE
    if (user?.role === 'ADMIN') {
      switch (currentTab) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'classrooms':
          return <ClassroomManagementPage onStartMonitoring={() => {}} />;
        case 'consents':
          return <ConsentManagementPage />;
        case 'audit':
          return <AuditLogsPage />;
        case 'config':
          return <AIConfigPage />;
        case 'privacy':
          return <PrivacyCenterPage />;
        case 'registration':
          return <StudentRegistrationPage />;
        default:
          return <AdminDashboard />;
      }
    }

    // 3. CLASS TEACHER INTERFACE (Default)
    switch (currentTab) {
      case 'monitoring':
        return (
          <LiveMonitoringPage
            onOpenReport={(sessId) => {
              setSelectedSessionId(sessId);
              setCurrentTab('reports');
            }}
          />
        );
      case 'alerts':
        return <AlertsPage />;
      case 'dashboard':
        return (
          <TeacherDashboard
            onNavigateToMonitoring={() => setCurrentTab('monitoring')}
            onNavigateToReports={(sessId) => {
              setSelectedSessionId(sessId);
              setCurrentTab('reports');
            }}
          />
        );
      case 'classrooms':
        return (
          <ClassroomManagementPage
            onStartMonitoring={() => setCurrentTab('monitoring')}
          />
        );
      case 'registration':
        return <StudentRegistrationPage />;
      case 'reports':
        return <SessionReportPage sessionId={selectedSessionId} />;
      case 'history':
        return <EventHistoryPage />;
      case 'about':
        return <HelpAboutPage />;
      default:
        return <LiveMonitoringPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1713] text-[#F8FAFC] flex font-sans selection:bg-[#10B981] selection:text-[#0B1713]">
      {/* Dark Forest Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpenMobile={isMobileSidebarOpen}
        setIsOpenMobile={setIsMobileSidebarOpen}
        onOpenPortalSelection={handleOpenPortalSelection}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 min-h-screen">
        {/* Top Navigation */}
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onOpenPortalSelection={handleOpenPortalSelection}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          isStandalone={false}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 pb-16">
          {renderContent()}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-[#294638] bg-[#10231C]/60 py-6 text-center text-xs text-[#A7B8AE] print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© 2026 ClassGuard AI — Smart Classroom Safety & Attention Monitoring System</p>
            <div className="flex items-center gap-4 text-[11px] text-[#A7B8AE]">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                100% On-Device Local Inference
              </span>
              <span>🔒 Zero Cloud Video</span>
              <span>⚖️ Human Teacher In The Loop</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
