import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export interface FaceMetrics {
  trackId: number;
  faceIndex: number;
  deskLabel: string;
  ear: number;
  eyesClosed: boolean;
  closedDurationSec: number;
  yawDegrees: number;
  isTurnedAway: boolean;
  disturbanceDurationSec: number;
  motionVelocity: number;
  isHighMotion: boolean;
  attentionStatus: 'ATTENTIVE' | 'EYES_CLOSING' | 'SLEEPING' | 'DISTRACTED' | 'HIGH_MOTION';
  attentionScore: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  matchedStudent?: {
    id: number;
    student_id: string;
    full_name: string;
    roll_number: string;
    photo_data_url?: string | null;
    confidence: number;
  } | null;
}

interface TrackedFaceState {
  trackId: number;
  centroid: { x: number; y: number };
  boundingBox: { x: number; y: number; width: number; height: number };
  lastSeenTime: number;
  eyesClosedStartTime: number | null;
  lastEyesClosedTime: number;
  turnedAwayStartTime: number | null;
  prevCentroid: { x: number; y: number } | null;
  prevTimestamp: number;
  motionVelocity: number;
  matchedStudent?: any | null;
}

export class FaceLandmarkerService {
  private landmarker: FaceLandmarker | null = null;
  private isModelLoading: boolean = false;
  private modelLoadFailed: boolean = false;

  // Spatial multi-student persistent tracking state
  private nextTrackId: number = 1;
  private trackedFaces: Map<number, TrackedFaceState> = new Map();
  private studentDescriptorCache: Map<string, number[]> = new Map();
  private lastVideoTimestamp: number = 0;

  public async initialize(): Promise<boolean> {
    if (this.landmarker) return true;
    if (this.isModelLoading) return false;

    this.isModelLoading = true;
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      // Support up to 24 students simultaneously with optimized sensitivity thresholds
      this.landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 24,
        minFaceDetectionConfidence: 0.30,
        minFacePresenceConfidence: 0.30,
        minTrackingConfidence: 0.30,
        outputFaceBlendshapes: true,
      });

      this.isModelLoading = false;
      return true;
    } catch (err) {
      console.warn('MediaPipe GPU/WASM initialization failed. Falling back to CPU delegate:', err);
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        this.landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numFaces: 24,
          minFaceDetectionConfidence: 0.30,
          minFacePresenceConfidence: 0.30,
          minTrackingConfidence: 0.30,
        });
        this.isModelLoading = false;
        return true;
      } catch (cpuErr) {
        console.error('All MediaPipe initializations failed:', cpuErr);
        this.modelLoadFailed = true;
        this.isModelLoading = false;
        return false;
      }
    }
  }

  // Calculate Eye Aspect Ratio (EAR)
  // Distance formula
  private distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  public calculateEAR(landmarks: any[]): number {
    // Left eye landmarks: 33 (outer), 160 (top 1), 158 (top 2), 133 (inner), 153 (bottom 2), 144 (bottom 1)
    const p1 = landmarks[33];
    const p2 = landmarks[160];
    const p3 = landmarks[158];
    const p4 = landmarks[133];
    const p5 = landmarks[153];
    const p6 = landmarks[144];

    if (!p1 || !p2 || !p3 || !p4 || !p5 || !p6) return 0.28;

    const vertical1 = this.distance(p2, p6);
    const vertical2 = this.distance(p3, p5);
    const horizontal = this.distance(p1, p4);

    if (horizontal === 0) return 0.28;
    const leftEar = (vertical1 + vertical2) / (2.0 * horizontal);

    // Right eye landmarks: 362 (outer), 385 (top 1), 387 (top 2), 263 (inner), 373 (bottom 2), 380 (bottom 1)
    const r1 = landmarks[362];
    const r2 = landmarks[385];
    const r3 = landmarks[387];
    const r4 = landmarks[263];
    const r5 = landmarks[373];
    const r6 = landmarks[380];

    if (!r1 || !r2 || !r3 || !r4 || !r5 || !r6) return leftEar;

    const rVertical1 = this.distance(r2, r6);
    const rVertical2 = this.distance(r3, r5);
    const rHorizontal = this.distance(r1, r4);

    const rightEar = rHorizontal === 0 ? leftEar : (rVertical1 + rVertical2) / (2.0 * rHorizontal);

    return (leftEar + rightEar) / 2.0;
  }

  // Calculate Head Pose (Yaw angle degrees away from camera)
  public calculateYaw(landmarks: any[]): number {
    const nose = landmarks[1] || landmarks[4];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];

    if (!nose || !leftCheek || !rightCheek) return 0;

    const distToLeft = Math.abs(nose.x - leftCheek.x);
    const distToRight = Math.abs(nose.x - rightCheek.x);
    const totalDist = distToLeft + distToRight;

    if (totalDist === 0) return 0;
    // Ratio of asymmetry
    const asymmetry = (distToLeft - distToRight) / totalDist;
    return Math.round(asymmetry * 65); // -65 to +65 degrees
  }

  // Extract rotation-invariant aligned normalized geometric facial descriptor vector
  public extractNormalizedVector(landmarks: any[]): number[] {
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const nose = landmarks[1] || landmarks[4];
    if (!leftEye || !rightEye || !nose) return [];

    const dx = rightEye.x - leftEye.x;
    const dy = rightEye.y - leftEye.y;
    const iod = Math.sqrt(dx * dx + dy * dy);
    if (iod < 0.001) return [];

    // Origin: Nose tip (landmark 1) to match enrolled student descriptor coordinates
    const originX = nose.x;
    const originY = nose.y;

    // Head roll rotation angle to align eyes horizontally
    const angle = Math.atan2(dy, dx);
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);

    const keyIndices = [
      1, 2, 4, 10, 17, 33, 61, 70, 98, 107, 133, 145, 152, 159, 168, 172,
      234, 263, 291, 300, 327, 336, 362, 374, 378, 386, 454
    ];

    const vector: number[] = [];
    for (const idx of keyIndices) {
      const pt = landmarks[idx];
      if (!pt) {
        vector.push(0, 0);
      } else {
        const transX = pt.x - originX;
        const transY = pt.y - originY;
        const rotX = (transX * cos - transY * sin) / iod;
        const rotY = (transX * sin + transY * cos) / iod;
        vector.push(parseFloat(rotX.toFixed(4)), parseFloat(rotY.toFixed(4)));
      }
    }
    return vector;
  }

  // Calculate Euclidean distance between two aligned normalized facial vectors
  public calculateVectorDistance(v1: number[], v2: number[]): number {
    if (!v1 || !v2 || v1.length === 0 || v2.length === 0) return 999;
    const len = Math.min(v1.length, v2.length);
    let sumSq = 0;
    for (let i = 0; i < len; i++) {
      const diff = v1[i] - v2[i];
      sumSq += diff * diff;
    }
    return Math.sqrt(sumSq / len);
  }

  // Extract descriptor from a static photo element or canvas
  public async extractDescriptorFromImage(imageSource: HTMLImageElement | HTMLCanvasElement): Promise<number[] | null> {
    if (!this.landmarker) {
      await this.initialize();
    }
    if (!this.landmarker) return null;

    try {
      const canvas = document.createElement('canvas');
      const width = ('naturalWidth' in imageSource ? imageSource.naturalWidth : imageSource.width) || 640;
      const height = ('naturalHeight' in imageSource ? imageSource.naturalHeight : imageSource.height) || 480;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(imageSource, 0, 0, width, height);

      const safeTs = Math.max(performance.now(), this.lastVideoTimestamp + 1);
      this.lastVideoTimestamp = safeTs;
      const results = this.landmarker.detectForVideo(canvas, safeTs);
      if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
        return this.extractNormalizedVector(results.faceLandmarks[0]);
      }
      return null;
    } catch (e) {
      console.warn('Error extracting descriptor from image:', e);
      return null;
    }
  }

  // Automatically ensures all authorized students with photos have accurate aligned descriptors
  public async ensureStudentDescriptors(authorizedStudents: any[]): Promise<any[]> {
    if (!authorizedStudents || authorizedStudents.length === 0) return [];
    for (const student of authorizedStudents) {
      if (student.photo_data_url) {
        const cacheKey = `student_${student.id || student.student_id}`;
        if (this.studentDescriptorCache.has(cacheKey)) {
          student.face_descriptor = this.studentDescriptorCache.get(cacheKey);
        } else {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = student.photo_data_url;
            await new Promise((res) => {
              img.onload = () => res(true);
              img.onerror = () => res(false);
            });
            const desc = await this.extractDescriptorFromImage(img);
            if (desc) {
              student.face_descriptor = desc;
              this.studentDescriptorCache.set(cacheKey, desc);
            }
          } catch (e) {
            console.warn('Descriptor extraction error for:', student.full_name, e);
          }
        }
      }
    }
    return authorizedStudents;
  }

  // Process live video frame for multiple students
  public processVideoFrame(
    video: HTMLVideoElement,
    timestamp: number,
    authorizedStudents: any[] = []
  ): FaceMetrics[] {
    if (!this.landmarker) return [];

    try {
      const safeTs = Math.max(timestamp, this.lastVideoTimestamp + 1);
      this.lastVideoTimestamp = safeTs;
      const results = this.landmarker.detectForVideo(video, safeTs);

      // Clean up tracks not seen for > 1500ms
      for (const [id, track] of this.trackedFaces.entries()) {
        if (safeTs - track.lastSeenTime > 1500) {
          this.trackedFaces.delete(id);
        }
      }

      if (!results || !results.faceLandmarks || results.faceLandmarks.length === 0) {
        return [];
      }

      // 1. Extract detection geometries for all detected faces in this frame
      const currentDetections: Array<{
        landmarks: any[];
        centroid: { x: number; y: number };
        boundingBox: { x: number; y: number; width: number; height: number };
        ear: number;
        yawDegrees: number;
        vector: number[];
      }> = [];

      for (let i = 0; i < results.faceLandmarks.length; i++) {
        const landmarks = results.faceLandmarks[i];
        let minX = 1, minY = 1, maxX = 0, maxY = 0;
        for (const p of landmarks) {
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
        }

        const width = Math.max(0.04, maxX - minX);
        const height = Math.max(0.04, maxY - minY);
        const centroid = { x: minX + width / 2, y: minY + height / 2 };

        currentDetections.push({
          landmarks,
          centroid,
          boundingBox: { x: minX, y: minY, width, height },
          ear: this.calculateEAR(landmarks),
          yawDegrees: this.calculateYaw(landmarks),
          vector: this.extractNormalizedVector(landmarks),
        });
      }

      // 2. Spatial bipartite matching: associate each detection with existing active tracks
      const matchedDetectionIndices = new Set<number>();
      const matchedTrackIds = new Set<number>();

      // Pair detections to closest existing track within distance threshold (0.22 normalized screen distance)
      const pairs: Array<{ detIdx: number; trackId: number; dist: number }> = [];
      for (let d = 0; d < currentDetections.length; d++) {
        for (const [tId, track] of this.trackedFaces.entries()) {
          const dist = this.distance(currentDetections[d].centroid, track.centroid);
          if (dist < 0.22) {
            pairs.push({ detIdx: d, trackId: tId, dist });
          }
        }
      }

      pairs.sort((a, b) => a.dist - b.dist);
      for (const pair of pairs) {
        if (!matchedDetectionIndices.has(pair.detIdx) && !matchedTrackIds.has(pair.trackId)) {
          matchedDetectionIndices.add(pair.detIdx);
          matchedTrackIds.add(pair.trackId);

          const det = currentDetections[pair.detIdx];
          const track = this.trackedFaces.get(pair.trackId)!;
          track.centroid = det.centroid;
          track.boundingBox = det.boundingBox;
          track.lastSeenTime = safeTs;
        }
      }

      // 3. Create new tracks for unmatched detections (new students appearing in frame)
      for (let d = 0; d < currentDetections.length; d++) {
        if (!matchedDetectionIndices.has(d)) {
          const det = currentDetections[d];
          const newTrackId = this.nextTrackId++;
          this.trackedFaces.set(newTrackId, {
            trackId: newTrackId,
            centroid: det.centroid,
            boundingBox: det.boundingBox,
            lastSeenTime: safeTs,
            eyesClosedStartTime: null,
            lastEyesClosedTime: 0,
            turnedAwayStartTime: null,
            prevCentroid: null,
            prevTimestamp: 0,
            motionVelocity: 0,
            matchedStudent: null,
          });
          matchedTrackIds.add(newTrackId);
          matchedDetectionIndices.add(d);
        }
      }

      // 4. Update temporal metrics and build output list for each detected student
      const metricsList: FaceMetrics[] = [];
      const assignedStudentIds = new Set<number>();

      // Sort detections left-to-right to establish stable desk numbers
      const sortedDetections = currentDetections
        .map((det, originalIdx) => ({ det, originalIdx }))
        .sort((a, b) => a.det.centroid.x - b.det.centroid.x);

      for (let rank = 0; rank < sortedDetections.length; rank++) {
        const { det, originalIdx } = sortedDetections[rank];

        // Find the matched track for this detection
        let targetTrack: TrackedFaceState | null = null;
        for (const track of this.trackedFaces.values()) {
          if (this.distance(det.centroid, track.centroid) < 0.08) {
            targetTrack = track;
            break;
          }
        }

        if (!targetTrack) {
          // Fallback if direct distance shifted slightly
          targetTrack = Array.from(this.trackedFaces.values())[0];
        }

        // --- Temporal Drowsiness / Sleeping (EAR < 0.225) with micro-blink debouncing ---
        const eyesClosed = det.ear < 0.225;
        let closedDurationSec = 0;
        if (eyesClosed) {
          if (targetTrack.eyesClosedStartTime === null) {
            targetTrack.eyesClosedStartTime = safeTs;
          }
          targetTrack.lastEyesClosedTime = safeTs;
          closedDurationSec = (safeTs - targetTrack.eyesClosedStartTime) / 1000;
        } else {
          if (targetTrack.eyesClosedStartTime !== null && (safeTs - targetTrack.lastEyesClosedTime) < 400) {
            closedDurationSec = (targetTrack.lastEyesClosedTime - targetTrack.eyesClosedStartTime) / 1000;
          } else {
            targetTrack.eyesClosedStartTime = null;
            targetTrack.lastEyesClosedTime = 0;
          }
        }

        // --- Temporal Disturbance (Turned Away Yaw > 28°) ---
        const isTurnedAway = Math.abs(det.yawDegrees) > 28;
        let disturbanceDurationSec = 0;
        if (isTurnedAway) {
          if (targetTrack.turnedAwayStartTime === null) {
            targetTrack.turnedAwayStartTime = safeTs;
          }
          disturbanceDurationSec = (safeTs - targetTrack.turnedAwayStartTime) / 1000;
        } else {
          targetTrack.turnedAwayStartTime = null;
        }

        // --- Motion Velocity ---
        let motionVelocity = 0;
        if (targetTrack.prevCentroid && targetTrack.prevTimestamp > 0) {
          const dt = (safeTs - targetTrack.prevTimestamp) / 1000;
          if (dt > 0) {
            motionVelocity = this.distance(det.centroid, targetTrack.prevCentroid) / dt;
          }
        }
        targetTrack.prevCentroid = det.centroid;
        targetTrack.prevTimestamp = safeTs;
        targetTrack.motionVelocity = motionVelocity;

        const isHighMotion = motionVelocity > 1.25;

        // --- Multi-Student Facial Recognition Matching ---
        let matchedStudent = targetTrack.matchedStudent || null;
        if (!matchedStudent && authorizedStudents && authorizedStudents.length > 0 && det.vector.length > 0) {
          let bestCandidate: any = null;
          let minDistance = 999;

          for (const candidate of authorizedStudents) {
            if (assignedStudentIds.has(candidate.id)) continue; // 1-to-1 matching across students in frame
            if (candidate.face_descriptor) {
              try {
                const candVector = typeof candidate.face_descriptor === 'string'
                  ? JSON.parse(candidate.face_descriptor)
                  : candidate.face_descriptor;
                if (Array.isArray(candVector) && candVector.length > 0) {
                  const dist = this.calculateVectorDistance(det.vector, candVector);
                  if (dist < minDistance) {
                    minDistance = dist;
                    bestCandidate = candidate;
                  }
                }
              } catch (e) {
                // descriptor parse warning
              }
            }
          }

          const STRICT_MATCH_THRESHOLD = 0.065;
          if (bestCandidate && minDistance <= STRICT_MATCH_THRESHOLD) {
            matchedStudent = {
              id: bestCandidate.id,
              student_id: bestCandidate.student_id,
              full_name: bestCandidate.full_name,
              roll_number: bestCandidate.roll_number,
              photo_data_url: bestCandidate.photo_data_url,
              confidence: Math.max(0.82, Math.min(0.99, parseFloat((1 - minDistance * 3.5).toFixed(2)))),
            };
            targetTrack.matchedStudent = matchedStudent;
            assignedStudentIds.add(bestCandidate.id);
          }
        } else if (matchedStudent) {
          assignedStudentIds.add(matchedStudent.id);
        }

        // --- Attention Status & Score ---
        let attentionStatus: 'ATTENTIVE' | 'EYES_CLOSING' | 'SLEEPING' | 'DISTRACTED' | 'HIGH_MOTION' = 'ATTENTIVE';
        let attentionScore = 95;

        if (closedDurationSec >= 3.8) {
          attentionStatus = 'SLEEPING';
          attentionScore = Math.max(0, 10 - Math.round(closedDurationSec * 2));
        } else if (eyesClosed && closedDurationSec >= 1.2) {
          attentionStatus = 'EYES_CLOSING';
          attentionScore = Math.max(25, 60 - Math.round(closedDurationSec * 12));
        } else if (disturbanceDurationSec >= 4.5) {
          attentionStatus = 'DISTRACTED';
          attentionScore = Math.max(30, 70 - Math.round(disturbanceDurationSec * 5));
        } else if (isHighMotion) {
          attentionStatus = 'HIGH_MOTION';
          attentionScore = 50;
        } else {
          attentionStatus = 'ATTENTIVE';
          attentionScore = Math.max(80, Math.min(99, Math.round(98 - Math.abs(det.yawDegrees) * 0.4)));
        }

        const deskNum = rank + 1;
        const deskLabel = matchedStudent
          ? `${matchedStudent.full_name} (${matchedStudent.roll_number || matchedStudent.student_id})`
          : `Student #${targetTrack.trackId} (Desk #${deskNum})`;

        metricsList.push({
          trackId: targetTrack.trackId,
          faceIndex: originalIdx,
          deskLabel,
          ear: parseFloat(det.ear.toFixed(3)),
          eyesClosed,
          closedDurationSec: parseFloat(closedDurationSec.toFixed(1)),
          yawDegrees: det.yawDegrees,
          isTurnedAway,
          disturbanceDurationSec: parseFloat(disturbanceDurationSec.toFixed(1)),
          motionVelocity: parseFloat(motionVelocity.toFixed(2)),
          isHighMotion,
          attentionStatus,
          attentionScore,
          boundingBox: det.boundingBox,
          matchedStudent,
        });
      }

      return metricsList;
    } catch (e) {
      console.error('Error in multi-student detectForVideo frame:', e);
      return [];
    }
  }

  // Draw overlay annotations on canvas with mirror-awareness so text is NEVER flipped backwards
  public drawOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    metrics: FaceMetrics[],
    showLandmarks: boolean = true,
    isMirrored: boolean = true
  ) {
    ctx.clearRect(0, 0, width, height);

    metrics.forEach((m, idx) => {
      // Calculate screen coordinate with mirror correction for readable text
      const bx = isMirrored
        ? (1 - m.boundingBox.x - m.boundingBox.width) * width
        : m.boundingBox.x * width;
      const by = m.boundingBox.y * height;
      const bw = m.boundingBox.width * width;
      const bh = m.boundingBox.height * height;

      // Color coding based on observed state
      let strokeColor = '#10b981'; // Green: Attentive
      let badgeBg = 'rgba(6, 78, 59, 0.9)';
      let label = `🟢 ${m.deskLabel} (${m.attentionScore}%)`;

      if (m.attentionStatus === 'SLEEPING') {
        strokeColor = '#ef4444'; // Bright Red: Sleeping
        badgeBg = 'rgba(153, 27, 27, 0.95)';
        label = `🚨 SLEEPING (${m.closedDurationSec}s): ${m.deskLabel}`;
      } else if (m.attentionStatus === 'EYES_CLOSING') {
        strokeColor = '#f59e0b'; // Amber: Eyes Closing
        badgeBg = 'rgba(146, 64, 14, 0.92)';
        label = `⚠️ EYES CLOSING (${m.closedDurationSec}s): ${m.deskLabel}`;
      } else if (m.attentionStatus === 'DISTRACTED') {
        strokeColor = '#f97316'; // Orange: Turned Away
        badgeBg = 'rgba(154, 52, 18, 0.92)';
        label = `⚠️ TURNED AWAY (${m.disturbanceDurationSec}s): ${m.deskLabel}`;
      } else if (m.attentionStatus === 'HIGH_MOTION') {
        strokeColor = '#a855f7'; // Purple: Sudden Motion
        badgeBg = 'rgba(88, 28, 135, 0.92)';
        label = `⚠️ SUDDEN MOTION: ${m.deskLabel}`;
      }

      // Draw modern futuristic corner brackets for each observed student
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      const cLen = Math.min(22, bw * 0.3);

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(bx, by + cLen);
      ctx.lineTo(bx, by);
      ctx.lineTo(bx + cLen, by);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(bx + bw - cLen, by);
      ctx.lineTo(bx + bw, by);
      ctx.lineTo(bx + bw, by + cLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(bx, by + bh - cLen);
      ctx.lineTo(bx, by + bh);
      ctx.lineTo(bx + cLen, by + bh);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(bx + bw - cLen, by + bh);
      ctx.lineTo(bx + bw, by + bh);
      ctx.lineTo(bx + bw, by + bh - cLen);
      ctx.stroke();

      // Soft bounding box stroke
      ctx.strokeStyle = strokeColor + '55';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, bh);

      // Student Observation Tag Header (Top)
      ctx.font = 'bold 12px Inter, system-ui, sans-serif';
      const textWidth = ctx.measureText(label).width;
      const tagWidth = Math.max(bw, textWidth + 16);
      const tagHeight = 24;
      const tagY = Math.max(4, by - tagHeight - 4);

      // Header Tag Background Pill
      ctx.fillStyle = badgeBg;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(bx, tagY, tagWidth, tagHeight, 6) : ctx.fillRect(bx, tagY, tagWidth, tagHeight);
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Header Tag Text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, bx + 8, tagY + 16);

      // Telemetry HUD Card (Bottom)
      if (showLandmarks) {
        const hudWidth = Math.max(bw, 190);
        const hudHeight = 36;
        const hudY = by + bh + 4;

        if (hudY + hudHeight < height + 20) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(bx, hudY, hudWidth, hudHeight, 6) : ctx.fillRect(bx, hudY, hudWidth, hudHeight);
          ctx.fill();
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // EAR line
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillStyle = m.eyesClosed ? '#facc15' : '#94a3b8';
          const earStr = `EAR: ${m.ear.toFixed(3)} ${m.eyesClosed ? `(${m.closedDurationSec}s CLOSED)` : '• OPEN'}`;
          ctx.fillText(earStr, bx + 6, hudY + 15);

          // YAW & FOCUS line
          ctx.fillStyle = m.isTurnedAway ? '#fb923c' : '#38bdf8';
          const yawStr = `YAW: ${m.yawDegrees > 0 ? '+' : ''}${m.yawDegrees}° ${m.isTurnedAway ? '(AWAY)' : '(BOARD)'} • FOCUS ${m.attentionScore}%`;
          ctx.fillText(yawStr, bx + 6, hudY + 29);
        }
      }
    });
  }

  public destroy() {
    if (this.landmarker) {
      this.landmarker.close();
      this.landmarker = null;
    }
  }
}

export const faceLandmarkerService = new FaceLandmarkerService();
