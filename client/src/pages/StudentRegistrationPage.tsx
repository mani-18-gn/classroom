import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../services/api';
import { faceLandmarkerService } from '../services/faceLandmarks';
import {
  UserPlus, Camera, RefreshCw, Trash2, CheckCircle2, ShieldCheck,
  AlertCircle, Upload, Video, VideoOff
} from 'lucide-react';

export const StudentRegistrationPage: React.FC = () => {
  const { t } = useLanguage();

  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState('');
  const [className, setClassName] = useState('8th Semester CSE');
  const [section, setSection] = useState('A');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consentGranted, setConsentGranted] = useState(false);

  // Photo Capture states
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Start Enrollment Webcam
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser. Please use Chrome, Edge, or upload a photo file.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
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
      let msg = 'Could not access laptop webcam. ';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg += 'Camera permission was denied. Please click the camera/lock icon in your browser address bar and choose "Allow", or check Windows Settings > Privacy > Camera.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg += 'No camera device found on this laptop. Please upload a photo file below.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg += 'Webcam is currently in use by another application (Zoom, Teams, etc.). Please close the other app or upload a photo below.';
      } else {
        msg += err.message || 'Please check permissions or upload a photo.';
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

  // Upload Photo from Laptop Filesystem
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

  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const handleDeletePhoto = () => {
    setCapturedPhoto(null);
    stopCamera();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!consentGranted) {
      setErrorMessage('Explicit student consent is strictly required by institutional policy before enrollment.');
      return;
    }

    if (!studentId || !fullName || !rollNumber) {
      setErrorMessage('Please fill out all mandatory fields.');
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

      const payload = {
        student_id: studentId,
        full_name: fullName,
        class_name: className,
        section,
        roll_number: rollNumber,
        email,
        phone,
        consent_granted: consentGranted,
        is_demo: 0,
        photo_data_url: capturedPhoto,
        face_descriptor: faceDescriptor,
      };

      await apiRequest('/students/enroll', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSuccessMessage(`Student ${fullName} (${studentId}) successfully registered with photo in database.`);
      // Reset form
      setStudentId('');
      setFullName('');
      setRollNumber('');
      setEmail('');
      setPhone('');
      setConsentGranted(false);
      setCapturedPhoto(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-tight">Student Enrollment & Biometric Consent</h1>
        <p className="text-xs text-slate-400 mt-1">
          Authorized enrollment with explicit consent, encrypted landmark representations, and zero raw image exposure.
        </p>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {cameraError && (
        <div className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-xs text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <VideoOff className="w-4 h-4" />
            <span>Laptop Camera Notice</span>
          </div>
          <p className="leading-relaxed text-[11px] text-amber-100">{cameraError}</p>
          <div className="pt-1 flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Photo from Laptop
            </button>
          </div>
        </div>
      )}

      {/* Data Usage & Privacy Guarantee Notice */}
      <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-4 shadow-lg flex items-start gap-3 text-xs text-slate-300">
        <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-white">Ethical Biometric Protection Standard</p>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Raw enrollment photos are immediately processed on-device into a salted 128-d hash token and encrypted with AES-256-GCM. Raw photos are NEVER stored permanently or exposed via public APIs.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Student ID / USN <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="E.g. CSE-2024-042 or USN-101"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="E.g. Siddharth Verma"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Class / Degree <span className="text-rose-400">*</span>
            </label>
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="8th Semester CSE">8th Semester CSE</option>
              <option value="6th Semester ISE">6th Semester ISE</option>
              <option value="4th Semester AIML">4th Semester AIML</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Section <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="A"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Roll Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="1MS21CS099"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@institution.edu"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98450 12345"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Photo Enrollment / WebCam Capture & File Upload Section */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs font-bold text-slate-200">Facial Enrollment Photo Capture</span>
              <p className="text-[11px] text-slate-400">Take a photo using your laptop camera OR upload a photo file from your laptop.</p>
            </div>
            <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
              Encrypted Local Hash
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* Photo Box Container (Always maintains video element mounted) */}
            <div className="w-56 h-44 bg-slate-900 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center overflow-hidden relative shadow-inner">
              {capturedPhoto ? (
                <img src={capturedPhoto} alt="Captured Student" className="w-full h-full object-cover" />
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
                    <div className="flex flex-col items-center justify-center text-slate-500 text-xs p-4 text-center">
                      <Camera className="w-10 h-10 mb-1.5 opacity-40" />
                      <span>No Photo Captured</span>
                    </div>
                  )}
                </>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 flex-1">
              {!cameraActive && !capturedPhoto && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md"
                  >
                    <Video className="w-4 h-4" /> Start Laptop Webcam
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4 text-blue-400" /> Upload from Laptop
                  </button>
                </div>
              )}

              {/* Live WebCam Active Controls */}
              {cameraActive && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={captureFrame}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-lg animate-pulse"
                  >
                    <Camera className="w-4 h-4" /> Snap & Take Photo Now
                  </button>

                  <button
                    type="button"
                    onClick={stopCamera}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium px-3 py-2.5 rounded-xl transition border border-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Photo Captured Controls */}
              {capturedPhoto && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Photo Successfully Captured
                  </span>
                  <div className="w-full flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-700 transition flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Retake
                    </button>
                    <button
                      type="button"
                      onClick={handleDeletePhoto}
                      className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium px-3 py-1.5 rounded-xl border border-rose-500/30 transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
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

              <p className="text-[11px] text-slate-400 leading-relaxed">
                You can capture live via webcam or upload any JPG/PNG file from your computer. The photo is securely processed locally to extract mathematical feature hashes without exposing raw photos.
              </p>
            </div>
          </div>
        </div>


        {/* Mandatory Explicit Consent Agreement */}
        <div className="bg-blue-950/40 border border-blue-500/40 rounded-2xl p-4 space-y-2">
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              id="consent"
              required
              checked={consentGranted}
              onChange={(e) => setConsentGranted(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded bg-slate-950 border-slate-700 mt-0.5"
            />
            <label htmlFor="consent" className="text-xs text-slate-200 leading-relaxed font-medium">
              I confirm that the student (or legal guardian) has provided explicit written consent to process facial landmark coordinates exclusively for classroom safety & engagement assistance. I acknowledge consent can be withdrawn at any time, which immediately purges the biometric representation.
            </label>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading || !consentGranted}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition shadow-lg flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Processing Enrollment...' : 'Enroll Student with Verified Consent'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
