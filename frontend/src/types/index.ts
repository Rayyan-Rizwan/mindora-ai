// Mirrors backend/app/schemas/ response shapes. Keep in sync manually,
// or generate later from the FastAPI OpenAPI spec.

export type UserRole = "user" | "professional" | "admin";

// The current user's own profile fields, echoed back by GET /users/me so
// forms can be prefilled. Null until the profile row exists (account that
// has not completed profile setup).
export interface UserProfileInfo {
  phone: string | null;
  timezone: string | null;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_verified: boolean;
  is_active?: boolean;
  is_protected?: boolean;
  created_at: string;
  profile?: UserProfileInfo | null;
}

export interface Conversation {
  id: string;
  title: string | null;
  session_type: "text" | "voice";
  status: "active" | "ended";
  started_at: string;
  ended_at: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: "user" | "ai";
  content: string;
  created_at: string;
}

export interface MoodRecord {
  id: string;
  mood_score: number;
  mood_label: string | null;
  note: string | null;
  created_at: string;
}

export type AppointmentType = "chat" | "audio" | "video";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export type WeeklySchedule = Record<
  string,
  { start: string; end: string }[]
>;

export interface Professional {
  id: string;
  full_name: string;
  specialization: string;
  qualification: string | null;
  bio: string | null;
  years_experience: number;
  consultation_fee: string | number;
  availability: WeeklySchedule | null;
  consultation_types: AppointmentType[] | null;
}

export type ProfessionalApprovalStatus = "pending" | "approved" | "rejected";

export interface ProfessionalApplication {
  id: string;
  user_id: string;
  approval_status: ProfessionalApprovalStatus;
  license_number: string;
  specialization: string;
  qualification: string | null;
  bio: string | null;
  years_experience: number;
  consultation_fee: string | number;
  availability: WeeklySchedule | null;
  consultation_types: AppointmentType[] | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string | null;
  applicant_name: string | null;
  applicant_email: string | null;
  applicant_is_active: boolean | null;
}

export interface AvailabilitySlot {
  start: string;
  end: string;
  start_utc: string;
}

export interface ProfessionalAvailability {
  professional_id: string;
  date: string;
  timezone: string;
  slot_minutes: number;
  slots: AvailabilitySlot[];
}

export interface Appointment {
  id: string;
  patient_id: string;
  professional_id: string;
  scheduled_at: string;
  duration_minutes: number;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  created_at: string;
  meeting_url: string | null;
  professional_name: string | null;
  specialization: string | null;
  patient_name: string | null;
}

export interface PatientAssessmentSummary {
  id: string;
  assessment_type: string;
  assessment_name: string;
  completed_at: string | null;
  total_score: number;
  severity_level: string;
  interpretation: string | null;
  result_data: Record<string, unknown> | null;
}

export interface PatientMoodRecord {
  mood_date: string;
  mood_score: number;
  mood_label: string | null;
  note: string | null;
  created_at: string;
}

export interface PatientMoodStatistics {
  average_mood: number | null;
  highest_mood: number | null;
  lowest_mood: number | null;
  total_check_ins: number;
}

export interface PatientMoodTrends {
  current_7_day_average: number | null;
  previous_7_day_average: number | null;
}

export interface PatientMoodHistory {
  records: PatientMoodRecord[];
  statistics: PatientMoodStatistics;
  trends: PatientMoodTrends;
}

// Read-only platform analytics (admin dashboard). Aggregate counts only --
// no private or clinical user data is exposed.
export interface AdminAnalyticsSummary {
  users: {
    total: number;
    active: number;
    inactive: number;
    by_role: Record<string, number>;
  };
  professionals: {
    total: number;
    verified: number;
    active: number;
    by_approval_status: Record<string, number>;
  };
  appointments: {
    total: number;
    by_status: Record<string, number>;
  };
  assessments: {
    total: number;
    completed: number;
    in_progress: number;
  };
  mood_records: {
    total: number;
  };
}

export interface AdminReportDailyPoint {
  date: string;
  count: number;
}

// Read-only operational report (admin). Aggregate counts only for a bounded
// window -- no names, emails, assessment scores, mood notes or notification
// contents are exposed.
export interface AdminReportSummary {
  period: {
    days: number;
    start: string;
    end: string;
  };
  user_signups: {
    total: number;
    daily: AdminReportDailyPoint[];
  };
  appointments: {
    booked: number;
    by_status: Record<string, number>;
    by_type: Record<string, number>;
    daily: AdminReportDailyPoint[];
  };
  assessments: {
    started: number;
    completed: number;
    completion_rate: number;
    by_type: Record<string, { started: number; completed: number }>;
    daily: AdminReportDailyPoint[];
  };
  mood_checkins: {
    total: number;
    daily: AdminReportDailyPoint[];
  };
  notifications: {
    sent: number;
    read: number;
    unread: number;
    read_rate: number;
  };
}

// Knowledge-base document managed from the admin dashboard. Admin-managed
// documents (managed: true) can be edited/reprocessed/deleted; file-based
// documents are exposed read-only.
export interface KnowledgeBaseDocument {
  id: string | null;
  source: string;
  managed: boolean;
  chunk_count: number;
  file_type: string | null;
  file_name: string | null;
  category: string | null;
  title: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface KnowledgeBaseDocumentDetail extends KnowledgeBaseDocument {
  text: string;
}

export interface KnowledgeBaseList {
  total_documents: number;
  total_chunks: number;
  managed_documents: number;
  legacy_documents: number;
  documents: KnowledgeBaseDocument[];
}

export interface KnowledgeBaseDocumentInput {
  text: string;
  metadata?: Record<string, unknown> | null;
}

export interface KnowledgeBasePdfDocumentInput {
  file_base64: string;
  file_name?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface KnowledgeBaseDeleteResult {
  id: string;
  source: string;
  deleted_chunks: number;
}

// Admin-managed motivational messages used by the daily motivational
// notification feature. `builtin` entries are the hardcoded defaults shown
// until the admin edits them.
export interface MotivationalMessage {
  id: string;
  title: string;
  content: string;
  enabled: boolean;
  builtin: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface MotivationalMessageList {
  messages: MotivationalMessage[];
  total: number;
  enabled_count: number;
  using_defaults: boolean;
}

export interface MotivationalMessageInput {
  title: string;
  content: string;
}

export interface MotivationalMessageUpdateInput {
  title?: string;
  content?: string;
  enabled?: boolean;
}

// GET /appointments/me/summary (professional only). Counts are scoped
// server-side to the calling professional's own appointments. Aggregate
// counts only -- no patient details.
export interface ProfessionalAppointmentSummary {
  period: {
    days: number;
    start: string;
    end: string;
  };
  total: number;
  upcoming: number;
  by_status: Record<AppointmentStatus, number>;
  by_type: Record<AppointmentType, number>;
  by_day: { date: string; count: number }[];
  unique_patients: number;
}

// POST /admin/content/broadcast (+ /preview). In-app notifications only.
export type BroadcastRecipientMode = "all" | "role" | "user_ids";

export interface BroadcastRequest {
  title: string;
  content: string;
  recipient_mode: BroadcastRecipientMode;
  role?: UserRole;
  user_ids?: string[];
  force?: boolean;
}

export interface BroadcastPreview {
  recipient_mode: string;
  role: string | null;
  total_recipients: number;
  by_role: Record<string, number>;
  requested_ids: number | null;
  inactive_or_unknown_ids: number | null;
}

export interface BroadcastResult {
  title: string;
  recipient_mode: string;
  role: string | null;
  recipients_targeted: number;
  notifications_created: number;
  forced: boolean;
  channel: string;
}

// PATCH /users/{id}/role
export interface UserRoleChange {
  role: UserRole;
}

// POST /auth/forgot-password, /auth/reset-password
export interface AuthMessageResponse {
  message: string;
}
