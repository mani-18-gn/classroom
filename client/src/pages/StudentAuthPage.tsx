import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest, setAuthToken } from '../services/api';
import { faceLandmarkerService } from '../services/faceLandmarks';
import {
  GraduationCap, Lock, Mail, User, ShieldCheck, CheckCircle2,
  AlertCircle, ArrowRight, ArrowLeft, Camera, Upload, RefreshCw, Trash2, Video, VideoOff
} from 'lucide-react';
import { Role } from '../types';

interface StudentAuthPageProps {
  onBackToPortalSelection: () => void;
  onSuccess: (role?: Role) => void;
}

export const StudentAuthPage: React.FC<StudentAuthPageProps> = ({
  onBackToPortalSelection,
  onSuccess,
}) => {
  const { refreshUser } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login form state - clean, no demo defaults
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [className, setClassName] = useState('8th Semester CSE');
  const [section, setSection] = useState('A');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [consentGranted, setConsentGranted] = useState(false);

  // Photo Capture states
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser. Please upload a photo file.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.warn('Play error:', e));
        };
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      let msg = 'Could not access webcam. ';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg += 'Camera permission was denied. Please allow camera access in browser settings.';
      } else {
        msg += 'Please upload a photo from your computer below.';
      }
      setCameraError(msg);
      setCameraActive(false);
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(dataUrl);
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCapturedPhoto(event.target.result as string);
        stopCamera();
        setCameraError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword }),
      });
      if (res.user.role !== 'STUDENT') {
        throw new Error('This account does not have Student privileges. Please use the Teacher or Admin Portal.');
      }
      setAuthToken(res.token);
      await refreshUser();
      onSuccess('STUDENT');
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!consentGranted) {
      setErrorMessage('Explicit student consent is required to register into the system.');
      return;
    }

    setLoading(true);
    try {
      // Extract facial landmark descriptor from captured photo if present
      let faceDescriptor = null;
      if (capturedPhoto) {
        try {
          const img = new Image();
          img.src = capturedPhoto;
          await new Promise((res, rej) => {
            img.onload = () => res(true);
            img.onerror = rej;
          });
          faceDescriptor = await faceLandmarkerService.extractDescriptorFromImage(img);
        } catch (e) {
          console.warn('Could not extract facial descriptor from photo:', e);
        }
      }

      const res = await apiRequest('/auth/student/register', {
        method: 'POST',
        body: JSON.stringify({
          username,
          email,
          password,
          fullName,
          studentId,
          rollNumber,
          className,
          section,
          phone,
          consentGranted,
          photo_data_url: capturedPhoto,
          face_descriptor: faceDescriptor,
        }),
      });

      setAuthToken(res.token);
      await refreshUser();
      onSuccess('STUDENT');
    } catch (err: any) {
      setErrorMessage(err.message || 'Student registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Back Button */}
        <button
          onClick={onBackToPortalSelection}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Portal Selection
        </button>

        {/* Portal Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Student Privacy Portal</h2>
          <p className="text-xs text-slate-400">
            {mode === 'LOGIN' ? 'Sign in to inspect your consent and verified records' : 'Register your student profile with consent'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setMode('LOGIN')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              mode === 'LOGIN' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Student Login
          </button>
          <button
            onClick={() => setMode('REGISTER')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              mode === 'REGISTER' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Student Register
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Mode: LOGIN */}
        {mode === 'LOGIN' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Student Email / ID / Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Enter email, student ID, or username"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-1.5"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In as Student'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Mode: REGISTER */
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs max-h-[520px] overflow-y-auto pr-1">
            {/* Student Facial Photo Enrollment Section */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-3">
              <div>
                <label className="block font-bold text-slate-200 text-xs">Student Facial Photo</label>
                <p className="text-[11px] text-slate-400">Capture with your webcam or upload a photo to enable classroom AI recognition.</p>
              </div>

              {cameraError && (
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-200">
                  {cameraError}
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-28 h-28 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center overflow-hidden relative shadow-inner flex-shrink-0">
                  {capturedPhoto ? (
                    <img src={capturedPhoto} alt="Student Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        playsInline
                        autoPlay
                        muted
                        className={`w-full h-full object-cover transform -scale-x-100 ${cameraActive ? 'block' : 'hidden'}`}
                      />
                      {!cameraActive && (
                        <div className="flex flex-col items-center justify-center text-slate-500 text-[10px] text-center p-1">
                          <Camera className="w-6 h-6 mb-1 opacity-40" />
                          <span>No Photo</span>
                        </div>
                      )}
                    </>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                <div className="space-y-2 flex-1">
                  {!cameraActive && !capturedPhoto && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-1 shadow"
                      >
                        <Video className="w-3.5 h-3.5" /> Start Webcam
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-2.5 py-1.5 rounded-lg text-[11px] border border-slate-700 flex items-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload File
                      </button>
                    </div>
                  )}

                  {cameraActive && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={captureFrame}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1 shadow animate-pulse"
                      >
                        <Camera className="w-3.5 h-3.5" /> Snap Photo
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-400 font-medium px-2 py-1.5 rounded-lg text-[11px]"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {capturedPhoto && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Photo Attached
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setCapturedPhoto(null); startCamera(); }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] flex items-center gap-1 border border-slate-700"
                        >
                          <RefreshCw className="w-3 h-3" /> Retake
                        </button>
                        <button
                          type="button"
                          onClick={() => { setCapturedPhoto(null); stopCamera(); }}
                          className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-2 py-1 rounded text-[10px] flex items-center gap-1 border border-rose-500/30"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Student ID (USN) *</label>
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter student ID or USN"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Roll Number *</label>
                <input
                  type="text"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="Enter roll number"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Class *</label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="8th Semester CSE"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Section *</label>
                <input
                  type="text"
                  required
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="A"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Consent check */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={consentGranted}
                  onChange={(e) => setConsentGranted(e.target.checked)}
                  className="accent-emerald-500 mt-0.5"
                />
                <span className="text-[11px] text-slate-300 leading-tight">
                  I give explicit consent to enroll my facial landmark template for classroom safety assistance. I understand I can withdraw consent anytime.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !consentGranted}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-1.5"
            >
              <span>{loading ? 'Creating Student Account...' : 'Complete Student Registration'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

