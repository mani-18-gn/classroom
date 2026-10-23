import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import {
  ShieldCheck, KeyRound, Clock, Laptop, Lock, CheckCircle2,
  AlertCircle, AlertTriangle, LogOut, RefreshCw, Smartphone
} from 'lucide-react';

interface StudentSecurityCenterPageProps {
  onNavigateToPrivacyRequest?: () => void;
}

export const StudentSecurityCenterPage: React.FC<StudentSecurityCenterPageProps> = ({
  onNavigateToPrivacyRequest
}) => {
  const { user, logout } = useAuth();
  const [securityData, setSecurityData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Password state
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [updatingPassword, setUpdatingPassword] = useState<boolean>(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchSecurity = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/students/me/security');
      setSecurityData(res);
    } catch (err: any) {
      console.error('Failed to load security info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurity();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({ text: 'New password must be at least 8 characters long.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'New password and confirmation do not match.', type: 'error' });
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await apiRequest('/students/me/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });
      setPasswordMessage({ text: res.message || 'Password updated successfully.', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      fetchSecurity();
    } catch (err: any) {
      setPasswordMessage({ text: err.message || 'Password update failed.', type: 'error' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin" />
        <p className="text-xs font-mono tracking-widest uppercase text-[#6EE7B7]">
          Auditing Account Security...
        </p>
      </div>
    );
  }

  const sec = securityData?.accountSecurity;
  const history = securityData?.loginHistory || [];
  const checklist = securityData?.securityChecklist || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#294638]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Security Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#204735] text-[#10B981] border border-[#10B981]/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> High Security State
            </span>
          </div>
          <p className="text-xs text-[#A7B8AE] mt-1">
            Audit authenticated login sessions, verify cryptographic controls, and manage credentials.
          </p>
        </div>

        <button
          onClick={fetchSecurity}
          className="p-2 bg-[#17382B] hover:bg-[#204735] text-[#A7B8AE] hover:text-[#F8FAFC] rounded-xl border border-[#294638] transition inline-flex items-center gap-1.5 text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Audit
        </button>
      </div>

      {/* Account Verification & Security Standards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#294638]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
              Account Verification & Session Profile
            </h2>
            <span className="text-[10px] text-[#6EE7B7] font-mono">Role: STUDENT</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#10231C] p-3.5 rounded-2xl border border-[#294638] space-y-1">
              <span className="text-[10px] text-[#A7B8AE] uppercase font-semibold">Account Identity</span>
              <p className="text-sm font-bold text-[#F8FAFC] truncate">{sec?.fullName}</p>
              <p className="text-[10px] font-mono text-[#6EE7B7] truncate">{sec?.email}</p>
            </div>

            <div className="bg-[#10231C] p-3.5 rounded-2xl border border-[#294638] space-y-1">
              <span className="text-[10px] text-[#A7B8AE] uppercase font-semibold">Current IP & Network</span>
              <p className="text-sm font-bold font-mono text-[#F8FAFC]">{sec?.currentIp}</p>
              <p className="text-[10px] text-[#10B981]">Encrypted TLS 1.3 Connection</p>
            </div>
          </div>

          {/* Active Session Info */}
          <div className="bg-[#10231C] p-4 rounded-2xl border border-[#294638] flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#204735] flex items-center justify-center text-[#10B981]">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#F8FAFC]">Active Web Browser Session</p>
                <p className="text-[11px] text-[#A7B8AE] max-w-sm truncate">{sec?.currentUserAgent}</p>
              </div>
            </div>

            <button
              onClick={() => {
                if (window.confirm('Terminate this session and log out securely?')) {
                  logout();
                }
              }}
              className="px-3 py-1.5 bg-[#F87171]/15 hover:bg-[#F87171] text-[#F87171] hover:text-[#0B1713] text-xs font-bold rounded-xl border border-[#F87171]/40 transition inline-flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out Session
            </button>
          </div>
        </div>

        {/* Security Checklist Widget */}
        <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4 text-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            Security Checklist
          </h2>

          <div className="space-y-2.5">
            {checklist.map((item: any, idx: number) => (
              <div key={idx} className="bg-[#10231C] p-3 rounded-xl border border-[#294638] space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#F8FAFC]">{item.item}</span>
                  <span className="text-[10px] font-mono font-bold text-[#10B981]">{item.status}</span>
                </div>
                <p className="text-[10px] text-[#A7B8AE]">{item.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Password Management Card */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="pb-3 border-b border-[#294638]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#10B981]" />
            Secure Password Modification
          </h2>
          <p className="text-[11px] text-[#A7B8AE] mt-0.5">
            Passwords must contain at least 8 characters. Password hashes are never transmitted to or stored on client devices.
          </p>
        </div>

        {passwordMessage && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              passwordMessage.type === 'success'
                ? 'bg-[#204735] border-[#10B981]/50 text-[#6EE7B7]'
                : 'bg-[#F87171]/20 border-[#F87171]/40 text-[#F87171]'
            }`}
          >
            {passwordMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#10B981]" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#F87171]" />
            )}
            <span>{passwordMessage.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-semibold text-[#A7B8AE] mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-[#10231C] border border-[#294638] focus:border-[#10B981] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] outline-none transition"
              placeholder="••••••••••••"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#A7B8AE] mb-1">
                New Password (min 8 chars)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#10231C] border border-[#294638] focus:border-[#10B981] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] outline-none transition"
                placeholder="••••••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A7B8AE] mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#10231C] border border-[#294638] focus:border-[#10B981] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] outline-none transition"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={updatingPassword}
              className="px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-[#0B1713] text-xs font-bold rounded-xl transition inline-flex items-center gap-2"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {updatingPassword ? 'Changing Password...' : 'Save New Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Login History Audit Trail */}
      <div className="bg-[#17382B] border border-[#294638] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#294638]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#10B981]" />
            Recent Login History
          </h2>
          <span className="text-xs text-[#A7B8AE] font-mono">{history.length} Events Logged</span>
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-[#A7B8AE] py-4 text-center">No recent login events recorded.</p>
        ) : (
          <div className="space-y-2">
            {history.map((log: any) => (
              <div
                key={log.id}
                className="bg-[#10231C] border border-[#294638] p-3 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      log.status === 'SUCCESS' ? 'bg-[#10B981]' : 'bg-[#F87171]'
                    }`}
                  />
                  <div>
                    <span className="font-semibold text-[#F8FAFC]">
                      {log.status === 'SUCCESS' ? 'Successful Login' : 'Failed Authentication Attempt'}
                    </span>
                    <span className="text-[11px] text-[#A7B8AE] block truncate max-w-md">
                      {log.user_agent}
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono text-[11px] text-[#A7B8AE]">
                  <p>IP: {log.ip_address}</p>
                  <p>{log.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account Deactivation Action Banner */}
      <div className="bg-[#10231C] border border-[#F87171]/40 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#F87171]" />
            Request Account Deactivation
          </h3>
          <p className="text-xs text-[#A7B8AE] max-w-xl">
            Students who are graduating, transferring, or requesting account archival can file a formal statutory deactivation request.
          </p>
        </div>

        <button
          onClick={() => {
            if (onNavigateToPrivacyRequest) {
              onNavigateToPrivacyRequest();
            }
          }}
          className="px-4 py-2 bg-[#F87171]/20 hover:bg-[#F87171] text-[#F87171] hover:text-[#0B1713] text-xs font-bold rounded-xl border border-[#F87171]/40 transition self-start sm:self-auto"
        >
          Submit Deactivation Request
        </button>
      </div>
    </div>
  );
};
