import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, setAuthToken } from '../services/api';
import {
  School, Lock, Mail, User, ShieldCheck, CheckCircle2,
  AlertCircle, ArrowRight, ArrowLeft, Sparkles, BookOpen
} from 'lucide-react';

import { Role } from '../types';

interface TeacherAuthPageProps {
  onBackToPortalSelection: () => void;
  onSuccess: (role?: Role) => void;
}

export const TeacherAuthPage: React.FC<TeacherAuthPageProps> = ({
  onBackToPortalSelection,
  onSuccess,
}) => {
  const { refreshUser } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword }),
      });
      if (res.user.role !== 'TEACHER' && res.user.role !== 'ADMIN') {
        throw new Error('This account does not have Class Teacher privileges. Please use the Student Portal.');
      }
      setAuthToken(res.token);
      await refreshUser();
      onSuccess('TEACHER');
    } catch (err: any) {
      setErrorMessage(err.message || 'Teacher login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    try {
      const res = await apiRequest('/auth/teacher/register', {
        method: 'POST',
        body: JSON.stringify({
          username,
          email,
          password,
          fullName,
          employeeId,
          department,
          phone,
        }),
      });

      setAuthToken(res.token);
      await refreshUser();
      onSuccess('TEACHER');
    } catch (err: any) {
      setErrorMessage(err.message || 'Teacher registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#17382B] border border-[#294638] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#10B981]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Back Button */}
        <button
          onClick={onBackToPortalSelection}
          className="text-xs text-[#A7B8AE] hover:text-[#F8FAFC] flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Portal Selection
        </button>

        {/* Portal Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-[#10231C] text-[#6EE7B7] border border-[#294638] rounded-2xl mx-auto flex items-center justify-center shadow-inner">
            <School className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#F8FAFC] tracking-tight">Class Teacher Portal</h2>
          <p className="text-xs text-[#A7B8AE]">
            {mode === 'LOGIN' ? 'Sign in to access live classroom camera & verification tools' : 'Register your instructor account'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-[#10231C] p-1 rounded-xl border border-[#294638] text-xs font-semibold">
          <button
            onClick={() => setMode('LOGIN')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              mode === 'LOGIN' ? 'bg-[#10B981] text-white shadow' : 'text-[#A7B8AE] hover:text-[#F8FAFC]'
            }`}
          >
            Teacher Login
          </button>
          <button
            onClick={() => setMode('REGISTER')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              mode === 'REGISTER' ? 'bg-[#10B981] text-white shadow' : 'text-[#A7B8AE] hover:text-[#F8FAFC]'
            }`}
          >
            Teacher Register
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-[#F87171]/15 border border-[#F87171]/40 rounded-xl text-xs text-[#F87171] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Mode: LOGIN */}
        {mode === 'LOGIN' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#A7B8AE] mb-1">
                Teacher Email / Employee ID / Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A7B8AE]/60 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="teacher@classguard.edu or teacher_prof"
                  className="w-full bg-[#10231C] border border-[#294638] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F8FAFC] placeholder-[#A7B8AE]/50 focus:outline-none focus:border-[#10B981]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A7B8AE] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A7B8AE]/60 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Teacher@123"
                  className="w-full bg-[#10231C] border border-[#294638] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F8FAFC] placeholder-[#A7B8AE]/50 focus:outline-none focus:border-[#10B981]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-1.5"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In as Teacher'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Mode: REGISTER */
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs max-h-[460px] overflow-y-auto pr-1">
            <div>
              <label className="block font-semibold text-[#A7B8AE] mb-1">Full Name & Title <span className="text-[#F87171]">*</span></label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name (e.g. Dr. John Doe)"
                className="w-full bg-[#10231C] border border-[#294638] rounded-xl px-3 py-1.5 text-[#F8FAFC] placeholder-[#A7B8AE]/50 focus:outline-none focus:border-[#10B981]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#A7B8AE] mb-1">Faculty Employee ID <span className="text-[#F87171]">*</span></label>
              <input
                type="text"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="EMP-101"
                className="w-full bg-[#10231C] border border-[#294638] rounded-xl px-3 py-1.5 text-[#F8FAFC] placeholder-[#A7B8AE]/50 focus:outline-none focus:border-[#10B981]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#A7B8AE] mb-1">Academic Department <span className="text-[#F87171]">*</span></label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-[#10231C] border border-[#294638] rounded-xl px-3 py-1.5 text-[#F8FAFC] focus:outline-none focus:border-[#10B981]"
              >
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="Information Science & Engineering">Information Science & Engineering</option>
                <option value="Artificial Intelligence & Machine Learning">Artificial Intelligence & Machine Learning</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#A7B8AE] mb-1">Official Faculty Email <span className="text-[#F87171]">*</span></label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@institution.edu"
                className="w-full bg-[#10231C] border border-[#294638] rounded-xl px-3 py-1.5 text-[#F8FAFC] placeholder-[#A7B8AE]/50 focus:outline-none focus:border-[#10B981]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-[#A7B8AE] mb-1">Username <span className="text-[#F87171]">*</span></label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="teacher_username"
                  className="w-full bg-[#10231C] border border-[#294638] rounded-xl px-3 py-1.5 text-[#F8FAFC] placeholder-[#A7B8AE]/50 focus:outline-none focus:border-[#10B981]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#A7B8AE] mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98450 12345"
                  className="w-full bg-[#10231C] border border-[#294638] rounded-xl px-3 py-1.5 text-[#F8FAFC] placeholder-[#A7B8AE]/50 focus:outline-none focus:border-[#10B981]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#A7B8AE] mb-1">Password <span className="text-[#F87171]">*</span></label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full bg-[#10231C] border border-[#294638] rounded-xl px-3 py-1.5 text-[#F8FAFC] placeholder-[#A7B8AE]/50 focus:outline-none focus:border-[#10B981]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-1.5"
            >
              <span>{loading ? 'Creating Faculty Account...' : 'Complete Teacher Registration'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
