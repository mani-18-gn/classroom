export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';
export type Language = 'en';

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  fullName: string;
  institutionId: string;
  teacherId?: number | null;
  studentId?: number | null;
  roleDetails?: any;
}

export interface Student {
  id: number;
  student_id: string;
  full_name: string;
  class_name: string;
  section: string;
  roll_number: string;
  email?: string;
  phone?: string;
  consent_status: 'CONSENTED' | 'WITHDRAWN' | 'PENDING';
  is_demo: number;
  photo_data_url?: string | null;
  face_descriptor?: string | null;
  biometric_status?: string;
  quality_score?: number;
  created_at: string;
}

export interface Classroom {
  id: number;
  classroom_code: string;
  name: string;
  class_name?: string;
  department?: string;
  semester?: string;
  teacher_name?: string;
  camera_source: string;
  status: 'IDLE' | 'MONITORING' | 'PAUSED';
  enrolled_count?: number;
  active_session_id?: number | null;
  created_at: string;
}

export interface MonitoringSession {
  id: number;
  session_code: string;
  classroom_id: number;
  classroom_name?: string;
  classroom_code?: string;
  class_name?: string;
  teacher_name?: string;
  started_at: string;
  ended_at?: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  avg_attention_score: number;
  avg_drowsiness_rate: number;
  avg_noise_level: 'QUIET' | 'MODERATE' | 'LOUD';
  total_students_detected: number;
  potential_events_count: number;
  verified_events_count: number;
}

export interface DetectedEvent {
  id: number;
  session_id: number;
  student_id?: number | null;
  student_name_snapshot: string;
  event_type: 'PROLONGED_EYE_CLOSURE' | 'CLASSROOM_DISTURBANCE' | 'PHYSICAL_CONFLICT';
  category: 'ATTENTION' | 'DISTURBANCE' | 'SAFETY';
  confidence_score: number;
  duration_seconds: number;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NEEDS_REVIEW';
  ai_observation: string;
  camera_id: string;
  timestamp: string;
  is_simulated: number;
  session_code?: string;
  classroom_name?: string;
  snapshot_count?: number;
  roll_number?: string;
  student_class?: string;
  student_section?: string;
  teacher_notes?: string;
  verification_reason?: string;
  verified_by_teacher?: string;
  verified_at?: string;
}

export interface EventSnapshot {
  id: number;
  event_id: number;
  snapshot_index: number;
  image_data_url: string;
  captured_at: string;
  expires_at?: string;
}

export interface TeacherVerification {
  id: number;
  event_id: number;
  teacher_id: number;
  teacher_name?: string;
  decision: 'VERIFIED' | 'FALSE_POSITIVE' | 'NEEDS_REVIEW';
  notes?: string;
  verified_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_name?: string;
  user_role?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: string;
  ip_address: string;
  timestamp: string;
}

export interface SystemSettings {
  retention_period_days: string;
  eye_closure_threshold_sec: string;
  head_pose_yaw_threshold_deg: string;
  noise_alert_threshold_db: string;
  min_face_match_confidence: string;
  allow_student_event_view: string;
  privacy_banner_dismissible: string;
  [key: string]: string;
}

export interface TimelineMarker {
  id: number;
  session_id: number;
  marker_type: string;
  title: string;
  notes?: string;
  timestamp: string;
}

export interface StudentPortalProfile {
  id: number;
  userId?: number;
  studentId: string;
  rollNumber: string;
  fullName: string;
  preferredName?: string;
  email: string;
  phone?: string;
  className: string;
  section: string;
  assignedClassroom?: string;
  institutionId?: string;
  accountRole: 'STUDENT';
  accountStatus: string;
  verificationStatus: string;
  bio?: string;
  emergencyContact?: string;
  photoDataUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface StudentClassroomDetails {
  classroom: {
    id?: number;
    classroom_code: string;
    name: string;
    department?: string;
    semester?: string;
    camera_source: string;
    camera_status: 'IDLE' | 'MONITORING' | 'PAUSED';
    teacher_name?: string;
    teacher_department?: string;
    teacher_email?: string;
    teacher_phone?: string;
    total_enrolled?: number;
    created_at?: string;
  };
  studentEnrollment: {
    studentId: string;
    fullName: string;
    className: string;
    section: string;
    rollNumber: string;
  };
  monitoringPolicy: {
    onDeviceInference: boolean;
    continuousVideoStreaming: boolean;
    retentionPeriod: string;
    humanInTheLoopMandate: string;
  };
  schedule: Array<{
    day: string;
    time: string;
    subject: string;
    room: string;
    teacher: string;
  }>;
  notices: Array<{
    id: number;
    title: string;
    date: string;
    content: string;
  }>;
  supportContact: {
    department: string;
    coordinator: string;
    email: string;
    phone: string;
  };
}

export interface ReviewAppeal {
  id: number;
  appeal_code: string;
  event_id: number;
  student_id: number;
  reason_category: 'INCORRECT_DETECTION' | 'WRONG_STUDENT' | 'NORMAL_ACTIVITY' | 'INCORRECT_TIMESTAMP' | 'OTHER';
  explanation?: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'ADDITIONAL_INFO_REQUIRED' | 'RESOLVED' | 'REJECTED';
  teacher_decision?: 'CONFIRMED' | 'CORRECTED' | 'DISMISSED';
  teacher_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at?: string;
  event_type?: string;
  category?: string;
  ai_observation?: string;
  confidence_score?: number;
  duration_seconds?: number;
  event_timestamp?: string;
  event_verification_status?: string;
}

export interface PrivacyRequest {
  id: number;
  request_code: string;
  student_id: number;
  user_id: number;
  category: 'ACCESS_PERSONAL_DATA' | 'CORRECT_INACCURATE_INFO' | 'REQUEST_ERASURE' | 'WITHDRAW_CONSENT' | 'PRIVACY_COMPLAINT' | 'DEACTIVATE_ACCOUNT' | 'PRIVACY_QUESTION';
  explanation: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'ADDITIONAL_INFO_REQUIRED' | 'RESOLVED' | 'REJECTED';
  admin_response?: string;
  reviewed_by?: string;
  completed_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  student_id?: number;
  type: string;
  title: string;
  message: string;
  link_tab?: string;
  is_read: number;
  created_at: string;
}

export interface LoginHistoryItem {
  id: number;
  ip_address: string;
  user_agent: string;
  status: string;
  timestamp: string;
}

export interface SupportTicket {
  id: number;
  ticket_code: string;
  user_id: number;
  student_id?: number;
  subject: string;
  category: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  admin_response?: string;
  created_at: string;
  updated_at?: string;
}

