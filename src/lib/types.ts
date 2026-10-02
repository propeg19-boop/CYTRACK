export type FlowLevel = 'none' | 'spotting' | 'light' | 'medium' | 'heavy';
export type MoodType = 'calm' | 'happy' | 'energetic' | 'sensitive' | 'anxious' | 'irritated' | 'tired' | 'sad';

export interface UserProfile {
  id: string;
  email: string | null;
  onboarding_completed: boolean;
  primary_goal?: string | null;
  preferred_tone?: string | null;
  typical_cycle_length: number;
  typical_period_duration: number;
  cycles_regular: boolean;
  reminder_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cycle {
  id: string;
  user_id: string;
  start_date: string; // YYYY-MM-DD
  end_date?: string | null; // YYYY-MM-DD
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Symptom {
  id: string;
  name: string;
  category: 'physical' | 'emotional' | 'energy' | 'digestive';
  icon_name: string;
  sort_order?: number;
}

export interface DailyLog {
  id: string;
  user_id: string;
  log_date: string; // YYYY-MM-DD
  flow?: FlowLevel | null;
  mood?: MoodType | null;
  energy?: number | null; // 1 to 5
  notes?: string | null; // PRIVATE
  symptoms?: string[]; // array of symptom IDs or names
  created_at: string;
  updated_at: string;
}

export interface PartnerConnection {
  id: string;
  owner_id: string;
  partner_id: string | null;
  invite_code: string;
  status: 'pending' | 'active' | 'revoked';
  created_at: string;
  updated_at: string;
  permissions?: SharingPermissions;
  partner_email?: string;
  owner_email?: string;
}

export interface SharingPermissions {
  id?: string;
  connection_id: string;
  share_cycle: boolean;
  share_mood: boolean;
  share_energy: boolean;
  share_symptoms: boolean;
  updated_at?: string;
}

export interface PartnerObservation {
  id: string;
  connection_id: string;
  author_id: string;
  log_date: string;
  observation: string;
  created_at: string;
}

export interface NotificationSettings {
  user_id: string;
  period_reminder_days_before: number;
  daily_log_reminder_time: string;
  period_reminders_enabled: boolean;
  daily_reminders_enabled: boolean;
}

export interface AIInsight {
  id?: string;
  user_id: string;
  insight_date: string;
  content: string;
  disclaimer: string;
  model_used: string;
  created_at?: string;
}
