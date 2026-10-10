// Mirrors backend/app/schemas/ response shapes. Keep in sync manually,
// or generate later from the FastAPI OpenAPI spec.

export type UserRole = "patient" | "professional" | "admin";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_verified: boolean;
  created_at: string;
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
