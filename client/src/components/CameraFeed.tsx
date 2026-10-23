import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { faceLandmarkerService, FaceMetrics } from '../services/faceLandmarks';
import { ClassroomAudioMeter, AudioNoiseData } from '../services/audioService';
import { NoiseMeter } from './NoiseMeter';
import {
  Camera, Eye, EyeOff, Play, Pause, Square, AlertTriangle,
  UserCheck, ShieldCheck, RefreshCw, Sparkles, Volume2, Coffee, CheckCircle2,
  Users, UserX, Activity, Compass, Flame, ArrowUpRight, Zap
} from 'lucide-react';

interface CameraFeedProps {
  sessionId?: number;
  classroomName?: string;
  authorizedStudents?: any[];
  onEventDetected: (eventData: any) => void;
  onMetricsUpdate?: (metrics: { attentionScore: number; drowsinessRate: number; noiseLevel: 'QUIET' | 'MODERATE' | 'LOUD'; visibleStudents: number }) => void;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
  sessionId = 1,
  classroomName = 'Room 402 — Advanced Computing Lab',
  authorizedStudents = [],
  onEventDetected,
  onMetricsUpdate,
}) => {
  const { t } = useLanguage();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const snapshotCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // States
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [monitoringStatus, setMonitoringStatus] = useState<'IDLE' | 'MONITORING' | 'PAUSED'>('MONITORING');
  const [showLandmarks, setShowLandmarks] = useState<boolean>(true);
  const [visibleCount, setVisibleCount] = useState<number>(1);
  const [potentialEventsCount, setPotentialEventsCount] = useState<number>(0);
  const [audioMeter] = useState(() => new ClassroomAudioMeter());
  const [noiseData, setNoiseData] = useState<AudioNoiseData>({
    decibels: 46,
    volumePercent: 22,
    status: 'QUIET',
    isLoud: false,
  });

  // Multi-Student Real-time Observation States
  const [activeMetrics, setActiveMetrics] = useState<FaceMetrics[]>([]);
  const lastUiUpdateRef = useRef<number>(0);

  // Telemetry aggregates across ALL students
  const [liveEAR, setLiveEAR] = useState<number>(0.28);
  const [eyeClosureTimer, setEyeClosureTimer] = useState<number>(0);
  const [smartNudge, setSmartNudge] = useState<string | null>(null);

  // Per-student cooldown tracker — keyed by student ID or track ID to avoid alert spam per student
  const lastAlertByStudentRef = useRef<Map<string, number>>(new Map());

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastTestSnapshot, setLastTestSnapshot] = useState<string | null>(null);
  const [last3Snapshots, setLast3Snapshots] = useState<string[] | null>(null);
  const [sleepingStudentLabel, setSleepingStudentLabel] = useState<string | null>(null);

  // Synchronize authorized student descriptors with high-precision rotation-invariant alignment
  useEffect(() => {
    if (authorizedStudents && authorizedStudents.length > 0) {
      faceLandmarkerService.ensureStudentDescriptors(authorizedStudents).catch(console.error);
    }
  }, [authorizedStudents]);




  // Grab single video frame with optional annotation overlay (timestamp + face highlight box)
  const grabAnnotatedFrame = useCallback((
    frameLabel: string,
    boundingBox?: { x: number; y: number; width: number; height: number }
  ): string | null => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Mirror the video (front camera is mirrored)
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Draw red bounding box around sleeping student
    if (boundingBox) {
      const bx = (1 - boundingBox.x - boundingBox.width) * canvas.width; // mirror-correct
      const by = boundingBox.y * canvas.height;
      const bw = boundingBox.width * canvas.width;
      const bh = boundingBox.height * canvas.height;

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.strokeRect(bx - 8, by - 8, bw + 16, bh + 16);

      // Label above box
      ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.fillRect(bx - 8, by - 34, Math.min(bw + 16, canvas.width - bx + 8), 26);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillText('🚨 SLEEPING DETECTED', bx - 4, by - 14);
    }

    // Timestamp watermark bottom-left
    const now = new Date();
    const ts = now.toLocaleTimeString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
               '.' + String(now.getMilliseconds()).padStart(3, '0');
    const watermark = `📸 ClassGuard AI  •  ${frameLabel}  •  ${ts}`;
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    const textWidth = ctx.measureText(watermark).width + 20;
    ctx.fillRect(0, canvas.height - 26, textWidth, 26);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px Inter, monospace';
    ctx.fillText(watermark, 10, canvas.height - 9);

    return canvas.toDataURL('image/jpeg', 0.88);
  }, []);

  // Grab plain frame (no annotation) for backward compat
  const grabVideoFrame = useCallback((): string | null => {
    return grabAnnotatedFrame('Evidence Frame');
  }, [grabAnnotatedFrame]);

  // Take 3 DISTINCT annotated screenshots at t=0, t+600ms, t+1200ms
  // Each frame has a unique timestamp overlay + red bounding box on sleeping student
  const capture3AutomaticScreenshots = useCallback(async (
    boundingBox?: { x: number; y: number; width: number; height: number }
  ): Promise<string[]> => {
    const snapshots: string[] = [];

    // Frame 1: t=0 (the moment sleeping is confirmed)
    const f1 = grabAnnotatedFrame('Frame 1 — t=0s (Confirmed)', boundingBox);
    if (f1) snapshots.push(f1);

    // Frame 2: t+600ms (showing continued closed eyes)
    await new Promise((r) => setTimeout(r, 600));
    const f2 = grabAnnotatedFrame('Frame 2 — t=0.6s (Sustained)', boundingBox);
    if (f2) snapshots.push(f2);

    // Frame 3: t+1200ms (additional evidence)
    await new Promise((r) => setTimeout(r, 600));
    const f3 = grabAnnotatedFrame('Frame 3 — t=1.2s (Evidence)', boundingBox);
    if (f3) snapshots.push(f3);

    // Ensure we always return 3 frames
    while (snapshots.length < 3 && snapshots.length > 0) {
      snapshots.push(snapshots[snapshots.length - 1]);
    }
    return snapshots;
  }, [grabAnnotatedFrame]);

  // Synchronous fallback capture
  const captureSnapshots = useCallback((count: number = 3): string[] => {
    const snapshots: string[] = [];
    const frame = grabVideoFrame();
    if (frame) {
      for (let i = 0; i < count; i++) {
        snapshots.push(frame);
      }
    }
    return snapshots;
  }, [grabVideoFrame]);

  // Play audio chime for alerts
  const playAlertChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      // AudioCtx disabled or user gesture required
    }
  };

  // Start Camera Stream & MediaPipe Landmarker
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera device API is not supported in this browser. Please use Chrome/Edge or toggle Simulation Feed.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.warn('Video play error:', e));
        };
        setIsStreaming(true);
      }

      await faceLandmarkerService.initialize();
      await audioMeter.start((noise) => {
        setNoiseData(noise);
      });
    } catch (err: any) {
      console.warn('Camera access error or denied:', err);
      let errMsg = 'Could not access laptop webcam. ';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg += 'Camera permission was blocked. Click the lock/camera icon in your browser address bar and select "Allow".';
      } else if (err.name === 'NotFoundError') {
        errMsg += 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        errMsg += 'Camera is in use by another application (Zoom, Teams, etc.).';
      } else {
        errMsg += err.message || 'Please check browser camera permissions.';
      }
      setCameraError(errMsg);
    }
  };

  // Manual Test Snapshot Frame
  const handleManualSnapshotTest = () => {
    const snaps = captureSnapshots(1);
    if (snaps.length > 0) {
      setLastTestSnapshot(snaps[0]);
      setTimeout(() => setLastTestSnapshot(null), 4000);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    audioMeter.stop();
    setIsStreaming(false);
  };

  // Main Detection Loop
  useEffect(() => {
    let animId: number;

    const runDetection = () => {
      if (
        monitoringStatus === 'MONITORING' &&
        videoRef.current &&
        canvasRef.current
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;

          const now = performance.now();
          let metrics: FaceMetrics[] = [];

          if (video.readyState >= 2) {
            metrics = faceLandmarkerService.processVideoFrame(video, now, authorizedStudents);
          }

          // Throttle React state update to ~5 FPS to keep UI snappy while canvas runs at 60 FPS
          if (now - lastUiUpdateRef.current > 200) {
            lastUiUpdateRef.current = now;
            setActiveMetrics(metrics);
            setVisibleCount(metrics.length);

            if (metrics.length > 0) {
              const avgEar = metrics.reduce((sum, m) => sum + m.ear, 0) / metrics.length;
              setLiveEAR(parseFloat(avgEar.toFixed(3)));
              const maxClosedSec = Math.max(...metrics.map(m => m.closedDurationSec));
              setEyeClosureTimer(maxClosedSec);
            } else {
              setLiveEAR(0.28);
              setEyeClosureTimer(0);
            }
          }

          if (metrics.length > 0) {
            // === INDEPENDENT BEHAVIOR MONITORING FOR EVERY STUDENT ===
            for (const face of metrics) {
              const studentKey = face.matchedStudent
                ? `std_${face.matchedStudent.id}`
                : `track_${face.trackId}`;

              // 1. Prolonged Eye Closure / Sleeping (EAR < 0.225 for >= 3.8s)
              if (face.closedDurationSec >= 3.8 || face.attentionStatus === 'SLEEPING') {
                const alertKey = `sleep_${studentKey}`;
                const lastAlert = lastAlertByStudentRef.current.get(alertKey) || 0;
                const cooldownElapsed = now - lastAlert > 8500;

                if (cooldownElapsed) {
                  lastAlertByStudentRef.current.set(alertKey, now);
                  playAlertChime();

                  const studentName = face.deskLabel;
                  const studentId = face.matchedStudent ? face.matchedStudent.id : null;
                  setSleepingStudentLabel(studentName);

                  (async () => {
                    try {
                      const snaps = await capture3AutomaticScreenshots(face.boundingBox);
                      setLast3Snapshots(snaps);
                      setTimeout(() => {
                        setLast3Snapshots(null);
                        setSleepingStudentLabel(null);
                      }, 9000);

                      onEventDetected({
                        session_id: sessionId,
                        student_id: studentId,
                        student_name_snapshot: studentName,
                        event_type: 'PROLONGED_EYE_CLOSURE',
                        category: 'ATTENTION',
                        confidence_score: face.matchedStudent ? face.matchedStudent.confidence : 0.95,
                        duration_seconds: parseFloat(face.closedDurationSec.toFixed(1)),
                        ai_observation: `Student ${studentName} detected sleeping with eyes continuously closed for ${face.closedDurationSec.toFixed(1)} seconds (EAR: ${face.ear.toFixed(3)}, Track #${face.trackId}). 3 evidence screenshots captured.`,
                        camera_id: 'CAM-01 (Classroom Main)',
                        snapshots: snaps,
                        is_simulated: 0,
                      });

                      setPotentialEventsCount((prev) => prev + 1);
                    } catch (snapErr) {
                      console.error(`Error capturing screenshots for ${studentName}:`, snapErr);
                    }
                  })();
                }
              }

              // 2. Prolonged Distraction / Looking Away (Yaw > 28° for >= 6.0s)
              if (face.disturbanceDurationSec >= 6.0) {
                const alertKey = `distract_${studentKey}`;
                const lastAlert = lastAlertByStudentRef.current.get(alertKey) || 0;
                const cooldownElapsed = now - lastAlert > 12000;

                if (cooldownElapsed) {
                  lastAlertByStudentRef.current.set(alertKey, now);
                  const studentName = face.deskLabel;
                  const studentId = face.matchedStudent ? face.matchedStudent.id : null;
                  const snaps = captureSnapshots(1);

                  onEventDetected({
                    session_id: sessionId,
                    student_id: studentId,
                    student_name_snapshot: studentName,
                    event_type: 'PROLONGED_DISTRACTION',
                    category: 'ENGAGEMENT',
                    confidence_score: 0.91,
                    duration_seconds: parseFloat(face.disturbanceDurationSec.toFixed(1)),
                    ai_observation: `Student ${studentName} turned away from lecture board for ${face.disturbanceDurationSec.toFixed(1)} seconds (Yaw: ${face.yawDegrees}°).`,
                    camera_id: 'CAM-01 (Classroom Main)',
                    snapshots: snaps,
                    is_simulated: 0,
                  });

                  setPotentialEventsCount((prev) => prev + 1);
                }
              }
            }

            // Draw visual overlay (with mirror-correction so text is NEVER flipped backwards)
            faceLandmarkerService.drawOverlay(
              ctx,
              canvas.width,
              canvas.height,
              metrics,
              showLandmarks,
              true
            );
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
      }

      animId = requestAnimationFrame(runDetection);
    };

    if (isStreaming) {
      animId = requestAnimationFrame(runDetection);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [
    isStreaming,
    monitoringStatus,
    showLandmarks,
    authorizedStudents,
    sessionId,
    capture3AutomaticScreenshots,
    captureSnapshots,
    onEventDetected,
  ]);

  // Start stream on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Periodic Telemetry Metric Sync across ALL detected students
  useEffect(() => {
    if (monitoringStatus !== 'MONITORING') return;

    const interval = setInterval(() => {
      const totalStudents = activeMetrics.length || (isStreaming ? 1 : 0);
      const drowsyStudents = activeMetrics.filter(m => m.closedDurationSec >= 1.5 || m.attentionStatus === 'SLEEPING').length;
      const avgAttention = activeMetrics.length > 0
        ? Math.round(activeMetrics.reduce((sum, m) => sum + m.attentionScore, 0) / activeMetrics.length)
        : Math.round(92 - (eyeClosureTimer > 2 ? 20 : 0) - (noiseData.status === 'LOUD' ? 15 : 0));
      const drowsinessRate = totalStudents > 0
        ? Math.round((drowsyStudents / totalStudents) * 100)
        : (eyeClosureTimer > 3 ? 30 : 5);

      if (onMetricsUpdate) {
        onMetricsUpdate({
          attentionScore: Math.max(50, Math.min(98, avgAttention)),
          drowsinessRate,
          noiseLevel: noiseData.status,
          visibleStudents: totalStudents,
        });
      }

      // Check smart break nudge
      if (drowsinessRate > 20) {
        setSmartNudge('Drowsiness detected among multiple students. Consider asking an interactive question or initiating a short stretch!');
      } else {
        setSmartNudge(null);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [monitoringStatus, activeMetrics, eyeClosureTimer, noiseData.status, onMetricsUpdate, isStreaming]);

  return (
    <div className="space-y-4">
      {/* Video Feed Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* HUD Top Status Bar */}
        <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-slate-950/90 to-transparent p-4 z-20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span
              className={`w-3 h-3 rounded-full ${
                monitoringStatus === 'MONITORING'
                  ? 'bg-emerald-500 animate-pulse'
                  : monitoringStatus === 'PAUSED'
                  ? 'bg-amber-500'
                  : 'bg-slate-500'
              }`}
            />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {monitoringStatus === 'MONITORING'
                ? t.camera.monitoringActive
                : monitoringStatus === 'PAUSED'
                ? t.camera.monitoringPaused
                : t.camera.monitoringIdle}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-300 font-medium hidden sm:inline">{classroomName}</span>
          </div>

          <div className="flex items-center space-x-2.5 text-xs">
            <div className="bg-slate-800/90 backdrop-blur-md px-3 py-1 rounded-full border border-blue-500/40 text-slate-200 font-mono flex items-center gap-1.5 shadow">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Students in Frame: <strong className="text-blue-400">{visibleCount}</strong></span>
            </div>
            <div className="bg-slate-800/90 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/40 text-slate-200 font-mono shadow">
              Alerts: <strong className="text-amber-400">{potentialEventsCount}</strong>
            </div>
            <div className="hidden md:flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] font-semibold">
              <ShieldCheck className="w-3 h-3" /> Zero Cloud Video
            </div>
          </div>
        </div>

        {/* Camera Error or Diagnostic Banner */}
        {cameraError && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 p-3 px-5 flex items-center justify-between text-xs text-amber-200 backdrop-blur-sm flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span><strong>Webcam Notice:</strong> {cameraError}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={startCamera}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] shadow transition"
              >
                Retry Camera
              </button>
              <button
                onClick={() => setCameraError(null)}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Video & Canvas Overlay Element */}
        <div className="relative w-full aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
          {/* Note: Canvas is NOT -scale-x-100 so all overlay text is right-side-up and perfectly legible */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
          <canvas ref={snapshotCanvasRef} className="hidden" />

          {/* Fallback Screen if Camera Off */}
          {!isStreaming && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-slate-400 p-6 text-center z-10">
              <Camera className="w-12 h-12 text-slate-600 mb-2 animate-bounce" />
              <p className="text-sm font-semibold text-slate-300">Classroom Camera Feed Inactive</p>
              <p className="text-xs text-slate-500 mt-1">Please allow camera permissions or connect the classroom webcam device.</p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={startCamera}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-lg flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Connect Camera</span>
                </button>
              </div>
            </div>
          )}

          {/* Drowsiness Realtime Live Counter Pill across detected students */}
          {eyeClosureTimer > 0 && (
            <div className="absolute bottom-16 left-4 z-20 bg-slate-950/85 border border-amber-500/40 px-3.5 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-amber-400 animate-spin" />
              <div className="text-xs">
                <span className="text-slate-400 font-mono">Eyes Closed: </span>
                <span className={`font-bold font-mono ${eyeClosureTimer >= 3.8 ? 'text-rose-400' : 'text-amber-300'}`}>
                  {eyeClosureTimer.toFixed(1)}s / 3.8s
                </span>
              </div>
            </div>
          )}

          {/* Floating Automatic 3-Screenshot Evidence Banner */}
          {last3Snapshots && last3Snapshots.length > 0 && (
            <div className="absolute top-16 right-4 z-30 bg-slate-900/95 border border-rose-500/70 p-3 rounded-2xl shadow-2xl space-y-2 animate-fade-in backdrop-blur-md max-w-xs">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-rose-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> 🚨 SLEEPING ALERT — 3 Frames
                </span>
                <button
                  onClick={() => { setLast3Snapshots(null); setSleepingStudentLabel(null); }}
                  className="text-slate-400 hover:text-white text-xs px-1"
                >
                  ✕
                </button>
              </div>
              {sleepingStudentLabel && (
                <p className="text-[11px] font-bold text-amber-300">👤 {sleepingStudentLabel}</p>
              )}
              <p className="text-[10px] text-slate-400">Auto-captured & sent to teacher dashboard.</p>
              <div className="flex gap-1.5 pt-1">
                {last3Snapshots.map((snap, idx) => (
                  <div key={idx} className="flex-1 text-center">
                    <img
                      src={snap}
                      alt={`Evidence Frame ${idx + 1}`}
                      className="w-full h-14 object-cover rounded-lg border border-rose-700/60 shadow-md"
                    />
                    <span className="text-[9px] text-rose-300 font-mono block mt-0.5">F{idx + 1} +{idx * 0.6}s</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Floating Snapshot Preview Toast */}
          {lastTestSnapshot && !last3Snapshots && (
            <div className="absolute top-16 right-4 z-30 bg-slate-900 border border-emerald-500/50 p-2.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in">
              <img src={lastTestSnapshot} alt="Test Snapshot" className="w-16 h-12 object-cover rounded-lg border border-slate-700" />
              <div className="text-xs pr-2">
                <span className="text-emerald-400 font-bold block flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Snapshot Captured!
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Smart AI Actionable Break Nudge */}
        {smartNudge && (
          <div className="bg-amber-500/15 border-t border-amber-500/30 p-3 px-5 flex items-center justify-between text-xs text-amber-300 backdrop-blur-sm animate-pulse">
            <div className="flex items-center gap-2.5">
              <Coffee className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span><strong>Smart AI Teaching Nudge:</strong> {smartNudge}</span>
            </div>
            <button
              onClick={() => setSmartNudge(null)}
              className="text-[11px] bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded text-amber-200 transition"
            >
              Acknowledge
            </button>
          </div>
        )}

        {/* Camera Control Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            {monitoringStatus !== 'MONITORING' ? (
              <button
                onClick={() => setMonitoringStatus('MONITORING')}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{t.camera.startMonitoring}</span>
              </button>
            ) : (
              <button
                onClick={() => setMonitoringStatus('PAUSED')}
                className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>{t.camera.pauseMonitoring}</span>
              </button>
            )}

            <button
              onClick={() => setMonitoringStatus('IDLE')}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-3.5 py-2 rounded-xl transition border border-slate-700"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>{t.camera.stopMonitoring}</span>
            </button>

            <button
              onClick={() => setShowLandmarks(!showLandmarks)}
              className={`flex items-center space-x-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition ${
                showLandmarks
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t.camera.landmarksToggle}</span>
            </button>

            <button
              onClick={handleManualSnapshotTest}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition"
              title="Test capturing a snapshot frame from the camera right now"
            >
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              <span>📸 Test Snapshot</span>
            </button>
          </div>

          {/* Live Telemetry Mini Reading */}
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>Avg EAR: <strong className="text-slate-200">{liveEAR.toFixed(3)}</strong></span>
            <span>Noise: <strong className="text-slate-200">{noiseData.decibels} dB</strong></span>
          </div>
        </div>
      </div>

      {/* Active Multi-Student Real-Time Observation Deck */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Active Multi-Student Live Observation Deck
                <span className="text-[11px] bg-blue-500/20 text-blue-300 font-mono px-2 py-0.5 rounded-full border border-blue-500/30">
                  {activeMetrics.length} Students Observed Simultaneously
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Individual computer-vision tracking for every student: Attentiveness, EAR eye closure, Head-Pose (Yaw), and Drowsiness
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
              ● {activeMetrics.filter(m => m.attentionStatus === 'ATTENTIVE').length} Attentive
            </span>
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
              ● {activeMetrics.filter(m => m.attentionStatus === 'EYES_CLOSING').length} Eyes Closing
            </span>
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold">
              ● {activeMetrics.filter(m => m.attentionStatus === 'SLEEPING').length} Sleeping
            </span>
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/30 font-semibold">
              ● {activeMetrics.filter(m => m.attentionStatus === 'DISTRACTED').length} Distracted
            </span>
          </div>
        </div>

        {/* Student Observation Cards Grid */}
        {activeMetrics.length === 0 ? (
          <div className="py-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800/80">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-300">No Students Currently Detected in Camera Frame</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
              Position the classroom webcam towards seated students to detect attentiveness, eye aspect ratio (EAR), and head orientation in real-time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {activeMetrics.map((student) => {
              const isSleeping = student.attentionStatus === 'SLEEPING';
              const isClosing = student.attentionStatus === 'EYES_CLOSING';
              const isDistracted = student.attentionStatus === 'DISTRACTED';
              const isMotion = student.attentionStatus === 'HIGH_MOTION';

              let borderTheme = 'border-emerald-500/40 bg-emerald-950/20';
              let statusText = 'Attentive';
              let statusColor = 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';

              if (isSleeping) {
                borderTheme = 'border-rose-500/70 bg-rose-950/30 animate-pulse';
                statusText = `SLEEPING (${student.closedDurationSec}s)`;
                statusColor = 'text-rose-300 bg-rose-500/30 border-rose-500/50';
              } else if (isClosing) {
                borderTheme = 'border-amber-500/60 bg-amber-950/25';
                statusText = `Closing (${student.closedDurationSec}s)`;
                statusColor = 'text-amber-300 bg-amber-500/25 border-amber-500/40';
              } else if (isDistracted) {
                borderTheme = 'border-orange-500/50 bg-orange-950/20';
                statusText = `Turned Away (${student.disturbanceDurationSec}s)`;
                statusColor = 'text-orange-300 bg-orange-500/25 border-orange-500/40';
              } else if (isMotion) {
                borderTheme = 'border-purple-500/50 bg-purple-950/20';
                statusText = 'High Motion';
                statusColor = 'text-purple-300 bg-purple-500/25 border-purple-500/40';
              }

              return (
                <div
                  key={student.trackId}
                  className={`border rounded-2xl p-3.5 transition-all shadow-md flex flex-col justify-between space-y-3 ${borderTheme}`}
                >
                  {/* Header: Student Identity & Status */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white overflow-hidden flex-shrink-0">
                          {student.matchedStudent?.photo_data_url ? (
                            <img
                              src={student.matchedStudent.photo_data_url}
                              alt={student.deskLabel}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{student.matchedStudent ? student.matchedStudent.full_name.charAt(0) : `#${student.trackId}`}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white truncate max-w-[130px]" title={student.deskLabel}>
                            {student.deskLabel}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Track #{student.trackId} • Desk #{student.faceIndex + 1}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${statusColor}`}>
                        {statusText}
                      </span>
                    </div>
                  </div>

                  {/* Real-time Telemetry Bars */}
                  <div className="space-y-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {/* Focus Score Bar */}
                    <div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Focus Score</span>
                        <strong className={`font-mono ${student.attentionScore >= 80 ? 'text-emerald-400' : student.attentionScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {student.attentionScore}%
                        </strong>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            student.attentionScore >= 80 ? 'bg-emerald-500' : student.attentionScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${student.attentionScore}%` }}
                        />
                      </div>
                    </div>

                    {/* EAR (Eye Aspect Ratio) */}
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400 flex items-center gap-1">
                        {student.eyesClosed ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3 text-emerald-400" />}
                        EAR:
                      </span>
                      <span className={student.eyesClosed ? 'text-amber-300 font-bold' : 'text-slate-200'}>
                        {student.ear.toFixed(3)} {student.eyesClosed ? `(${student.closedDurationSec}s)` : '(Open)'}
                      </span>
                    </div>

                    {/* Yaw / Head Pose */}
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Compass className="w-3 h-3 text-blue-400" /> Yaw:
                      </span>
                      <span className={student.isTurnedAway ? 'text-orange-300 font-bold' : 'text-slate-200'}>
                        {student.yawDegrees > 0 ? '+' : ''}{student.yawDegrees}° {student.isTurnedAway ? '(Away)' : '(Board)'}
                      </span>
                    </div>
                  </div>

                  {/* Status Observation Note */}
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>{isSleeping ? '🚨 Sleeping detected' : isClosing ? '⚠️ Eyes heavy' : isDistracted ? '⚠️ Looking at neighbor' : '✅ Focused on lecture'}</span>
                    {student.matchedStudent && (
                      <span className="text-emerald-400 flex items-center gap-0.5 text-[9px] font-semibold">
                        <ShieldCheck className="w-2.5 h-2.5" /> Verified
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Audio Meter */}
      <NoiseMeter noiseData={noiseData} />
    </div>
  );
};
