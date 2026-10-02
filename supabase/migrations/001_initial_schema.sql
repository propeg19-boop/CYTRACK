-- CYTRACK Database Migration: 001_initial_schema.sql
-- Description: Core tables for profiles, cycles, symptoms, daily tracking, partner sharing, notifications, and AI insights.

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
-- Extends Supabase auth.users with app-specific profile & onboarding metadata
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    primary_goal TEXT,
    preferred_tone TEXT DEFAULT 'warm',
    typical_cycle_length INTEGER DEFAULT 28,
    typical_period_duration INTEGER DEFAULT 5,
    cycles_regular BOOLEAN DEFAULT TRUE,
    reminder_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CYCLES TABLE
-- Represents logged menstrual periods and cycle starts
CREATE TABLE IF NOT EXISTS public.cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE, -- NULL indicates currently active/open period
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_cycle_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_cycles_user_start ON public.cycles(user_id, start_date DESC);

-- 3. SYMPTOMS REFERENCE TABLE
CREATE TABLE IF NOT EXISTS public.symptoms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'physical', 'emotional', 'energy', 'digestive'
    icon_name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- 4. DAILY LOGS TABLE
-- One record per user per calendar day
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    flow TEXT CHECK (flow IN ('none', 'spotting', 'light', 'medium', 'heavy')),
    mood TEXT CHECK (mood IN ('calm', 'happy', 'energetic', 'sensitive', 'anxious', 'irritated', 'tired', 'sad')),
    energy INTEGER CHECK (energy >= 1 AND energy <= 5),
    notes TEXT, -- PRIVATE USER NOTES: Never exposed to partners or AI
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_log_date UNIQUE (user_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs(user_id, log_date DESC);

-- 5. DAILY SYMPTOMS JOIN TABLE
CREATE TABLE IF NOT EXISTS public.daily_symptoms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_log_id UUID NOT NULL REFERENCES public.daily_logs(id) ON DELETE CASCADE,
    symptom_id TEXT NOT NULL REFERENCES public.symptoms(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_log_symptom UNIQUE (daily_log_id, symptom_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_symptoms_log ON public.daily_symptoms(daily_log_id);

-- 6. PARTNER CONNECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.partner_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    invite_code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_owner_active_connection UNIQUE (owner_id, partner_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_owner ON public.partner_connections(owner_id);
CREATE INDEX IF NOT EXISTS idx_partner_partner ON public.partner_connections(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_invite_code ON public.partner_connections(invite_code);

-- 7. SHARING PERMISSIONS TABLE
-- Granular column-level permission matrix managed by owner
CREATE TABLE IF NOT EXISTS public.sharing_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE UNIQUE,
    share_cycle BOOLEAN NOT NULL DEFAULT TRUE,
    share_mood BOOLEAN NOT NULL DEFAULT TRUE,
    share_energy BOOLEAN NOT NULL DEFAULT TRUE,
    share_symptoms BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. PARTNER OBSERVATIONS TABLE
-- Separate notes thread added by partner. Never stored in owner's daily_logs.
CREATE TABLE IF NOT EXISTS public.partner_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    observation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_obs_conn_date ON public.partner_observations(connection_id, log_date DESC);

-- 9. PUSH SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_endpoint UNIQUE (user_id, endpoint)
);

-- 10. NOTIFICATION SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.notification_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    period_reminder_days_before INTEGER NOT NULL DEFAULT 2,
    daily_log_reminder_time TIME DEFAULT '20:00:00',
    period_reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    daily_reminders_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. NOTIFICATION HISTORY (DEDUPLICATION) TABLE
CREATE TABLE IF NOT EXISTS public.notification_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL, -- 'period_upcoming', 'daily_log'
    target_date DATE NOT NULL, -- The cycle start or date for which reminder was sent
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_notification_record UNIQUE (user_id, notification_type, target_date)
);

-- 12. AI INSIGHTS (DAILY CACHE) TABLE
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    insight_date DATE NOT NULL,
    content TEXT NOT NULL,
    disclaimer TEXT NOT NULL DEFAULT 'AI-generated and for informational purposes only. Not medical advice.',
    model_used TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_insight_date UNIQUE (user_id, insight_date)
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_user_date ON public.ai_insights(user_id, insight_date DESC);
