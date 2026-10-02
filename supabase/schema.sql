-- ============================================================================
-- CYTRACK — MASTER SUPABASE SQL SCHEMA & RLS SECURITY DEFINITIONS
-- ============================================================================
-- Complete consolidated schema with tables, indexes, RLS policies, 
-- partner data-masking RPC, invite handlers, and symptom seed data.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
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
CREATE TABLE IF NOT EXISTS public.cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
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
    category TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- 4. DAILY LOGS TABLE (PRIVATE TO OWNER ONLY)
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    flow TEXT CHECK (flow IN ('none', 'spotting', 'light', 'medium', 'heavy')),
    mood TEXT CHECK (mood IN ('calm', 'happy', 'energetic', 'sensitive', 'anxious', 'irritated', 'tired', 'sad')),
    energy INTEGER CHECK (energy >= 1 AND energy <= 5),
    notes TEXT,
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

-- 11. NOTIFICATION HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.notification_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    target_date DATE NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_notification_record UNIQUE (user_id, notification_type, target_date)
);

-- 12. AI INSIGHTS TABLE
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

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sharing_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read symptoms"
    ON public.symptoms FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can select own cycles"
    ON public.cycles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cycles"
    ON public.cycles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cycles"
    ON public.cycles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own cycles"
    ON public.cycles FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can select own daily logs"
    ON public.daily_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily logs"
    ON public.daily_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily logs"
    ON public.daily_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own daily logs"
    ON public.daily_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can select own daily symptoms"
    ON public.daily_symptoms FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.daily_logs dl WHERE dl.id = daily_symptoms.daily_log_id AND dl.user_id = auth.uid()));
CREATE POLICY "Users can insert own daily symptoms"
    ON public.daily_symptoms FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.daily_logs dl WHERE dl.id = daily_symptoms.daily_log_id AND dl.user_id = auth.uid()));
CREATE POLICY "Users can delete own daily symptoms"
    ON public.daily_symptoms FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.daily_logs dl WHERE dl.id = daily_symptoms.daily_log_id AND dl.user_id = auth.uid()));

CREATE POLICY "Users can view connections they own or are partner of"
    ON public.partner_connections FOR SELECT TO authenticated
    USING (auth.uid() = owner_id OR auth.uid() = partner_id);
CREATE POLICY "Owners can insert partner invitations"
    ON public.partner_connections FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners or partners can update connection status"
    ON public.partner_connections FOR UPDATE TO authenticated
    USING (auth.uid() = owner_id OR auth.uid() = partner_id);
CREATE POLICY "Owners can delete partner connections"
    ON public.partner_connections FOR DELETE TO authenticated
    USING (auth.uid() = owner_id);

CREATE POLICY "Owners and active partners can view permissions"
    ON public.sharing_permissions FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.partner_connections pc
        WHERE pc.id = sharing_permissions.connection_id
        AND (pc.owner_id = auth.uid() OR (pc.partner_id = auth.uid() AND pc.status = 'active'))
    ));
CREATE POLICY "Only owners can update sharing permissions"
    ON public.sharing_permissions FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.partner_connections pc
        WHERE pc.id = sharing_permissions.connection_id
        AND pc.owner_id = auth.uid()
    ));
CREATE POLICY "System/Owner can insert sharing permissions"
    ON public.sharing_permissions FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.partner_connections pc
        WHERE pc.id = sharing_permissions.connection_id
        AND pc.owner_id = auth.uid()
    ));

CREATE POLICY "Observations viewable by owner and partner of active connection"
    ON public.partner_observations FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.partner_connections pc
        WHERE pc.id = partner_observations.connection_id
        AND pc.status = 'active'
        AND (pc.owner_id = auth.uid() OR pc.partner_id = auth.uid())
    ));
CREATE POLICY "Partners can insert observations into active connection"
    ON public.partner_observations FOR INSERT TO authenticated
    WITH CHECK (
        author_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.partner_connections pc
            WHERE pc.id = partner_observations.connection_id
            AND pc.status = 'active'
            AND (pc.owner_id = auth.uid() OR pc.partner_id = auth.uid())
        )
    );

CREATE POLICY "Users own their push subscriptions"
    ON public.push_subscriptions FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own their notification settings"
    ON public.notification_settings FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own their notification history"
    ON public.notification_history FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own their AI insights"
    ON public.ai_insights FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SECURITY DEFINER PROCEDURES & FUNCTIONS
-- ============================================================================

-- 1. Masked Partner Log Access (Zero raw notes exposure)
CREATE OR REPLACE FUNCTION public.get_partner_shared_logs(
    p_owner_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_partner_id UUID;
    v_connection RECORD;
    v_perms RECORD;
    v_result JSONB;
BEGIN
    v_partner_id := auth.uid();
    IF v_partner_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_connection
    FROM public.partner_connections
    WHERE owner_id = p_owner_id
      AND partner_id = v_partner_id
      AND status = 'active';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active partner connection found';
    END IF;

    SELECT * INTO v_perms
    FROM public.sharing_permissions
    WHERE connection_id = v_connection.id;

    SELECT jsonb_agg(
        jsonb_build_object(
            'log_date', dl.log_date,
            'flow', CASE WHEN COALESCE(v_perms.share_cycle, true) THEN dl.flow ELSE NULL END,
            'mood', CASE WHEN COALESCE(v_perms.share_mood, true) THEN dl.mood ELSE NULL END,
            'energy', CASE WHEN COALESCE(v_perms.share_energy, true) THEN dl.energy ELSE NULL END,
            'symptoms', CASE WHEN COALESCE(v_perms.share_symptoms, true) THEN (
                SELECT jsonb_agg(s.name)
                FROM public.daily_symptoms ds
                JOIN public.symptoms s ON s.id = ds.symptom_id
                WHERE ds.daily_log_id = dl.id
            ) ELSE NULL END
        )
    ) INTO v_result
    FROM public.daily_logs dl
    WHERE dl.user_id = p_owner_id
      AND dl.log_date >= p_start_date
      AND dl.log_date <= p_end_date;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 2. Secure Invite Acceptance RPC
CREATE OR REPLACE FUNCTION public.accept_partner_invite(
    p_invite_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_connection RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_connection
    FROM public.partner_connections
    WHERE invite_code = UPPER(TRIM(p_invite_code))
      AND status = 'pending';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite code');
    END IF;

    IF v_connection.owner_id = v_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'You cannot accept your own invite');
    END IF;

    UPDATE public.partner_connections
    SET partner_id = v_user_id,
        status = 'active',
        updated_at = NOW()
    WHERE id = v_connection.id;

    INSERT INTO public.sharing_permissions (connection_id, share_cycle, share_mood, share_energy, share_symptoms)
    VALUES (v_connection.id, true, true, true, true)
    ON CONFLICT (connection_id) DO NOTHING;

    RETURN jsonb_build_object('success', true, 'connection_id', v_connection.id, 'owner_id', v_connection.owner_id);
END;
$$;

-- 3. Revoke/Disconnect Partner RPC
CREATE OR REPLACE FUNCTION public.revoke_partner_connection(
    p_connection_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    UPDATE public.partner_connections
    SET status = 'revoked',
        updated_at = NOW()
    WHERE id = p_connection_id
      AND (owner_id = v_user_id OR partner_id = v_user_id);

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Connection not found or permission denied');
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 4. Complete Onboarding Profile RPC
CREATE OR REPLACE FUNCTION public.complete_user_onboarding(
    p_primary_goal TEXT,
    p_preferred_tone TEXT,
    p_typical_cycle_length INTEGER,
    p_typical_period_duration INTEGER,
    p_cycles_regular BOOLEAN,
    p_reminder_enabled BOOLEAN,
    p_last_period_start DATE,
    p_last_period_end DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    INSERT INTO public.profiles (
        id, email, onboarding_completed, primary_goal, preferred_tone,
        typical_cycle_length, typical_period_duration, cycles_regular, reminder_enabled, updated_at
    )
    VALUES (
        v_user_id, (SELECT email FROM auth.users WHERE id = v_user_id), TRUE,
        p_primary_goal, p_preferred_tone, p_typical_cycle_length, p_typical_period_duration,
        p_cycles_regular, p_reminder_enabled, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        onboarding_completed = TRUE,
        primary_goal = EXCLUDED.primary_goal,
        preferred_tone = EXCLUDED.preferred_tone,
        typical_cycle_length = EXCLUDED.typical_cycle_length,
        typical_period_duration = EXCLUDED.typical_period_duration,
        cycles_regular = EXCLUDED.cycles_regular,
        reminder_enabled = EXCLUDED.reminder_enabled,
        updated_at = NOW();

    IF p_last_period_start IS NOT NULL THEN
        INSERT INTO public.cycles (user_id, start_date, end_date, notes)
        VALUES (v_user_id, p_last_period_start, p_last_period_end, 'Initial cycle from onboarding')
        ON CONFLICT DO NOTHING;
    END IF;

    INSERT INTO public.notification_settings (user_id, period_reminders_enabled)
    VALUES (v_user_id, p_reminder_enabled)
    ON CONFLICT (user_id) DO UPDATE SET period_reminders_enabled = EXCLUDED.period_reminders_enabled;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================================
-- SEED DATA: SYMPTOMS
-- ============================================================================
INSERT INTO public.symptoms (id, name, category, icon_name, sort_order) VALUES
('cramps', 'Cramps', 'physical', 'Zap', 1),
('headache', 'Headache', 'physical', 'Brain', 2),
('bloating', 'Bloating', 'digestive', 'Wind', 3),
('fatigue', 'Fatigue', 'energy', 'BatteryLow', 4),
('back_pain', 'Back Pain', 'physical', 'Activity', 5),
('breast_tenderness', 'Breast Tenderness', 'physical', 'Heart', 6),
('acne', 'Acne / Skin', 'physical', 'Sparkles', 7),
('nausea', 'Nausea', 'digestive', 'AlertCircle', 8),
('cravings', 'Cravings', 'digestive', 'Coffee', 9),
('mood_swings', 'Mood Swings', 'emotional', 'Smile', 10),
('anxiety', 'Anxiety', 'emotional', 'ShieldAlert', 11),
('insomnia', 'Insomnia', 'energy', 'Moon', 12)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    icon_name = EXCLUDED.icon_name,
    sort_order = EXCLUDED.sort_order;
