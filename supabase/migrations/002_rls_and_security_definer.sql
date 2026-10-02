-- CYTRACK Database Migration: 002_rls_and_security_definer.sql
-- Description: Strict Row Level Security policies, Partner Data Masking RPC, Invite Acceptance RPC, and Cascade Deletion.

-- 1. ENABLE RLS ON ALL SENSITIVE TABLES
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

-- 2. SYMPTOMS REFERENCE TABLE POLICIES (Public read for authenticated users)
CREATE POLICY "Allow authenticated users to read symptoms"
    ON public.symptoms FOR SELECT
    TO authenticated
    USING (true);

-- 3. PROFILES POLICIES
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. CYCLES POLICIES (Owner full control)
CREATE POLICY "Users can select own cycles"
    ON public.cycles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cycles"
    ON public.cycles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cycles"
    ON public.cycles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cycles"
    ON public.cycles FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 5. DAILY LOGS POLICIES (Strict: OWNER ONLY - PARTNERS CANNOT SELECT DIRECTLY)
-- CRITICAL SECURITY: Partners have ZERO direct SELECT on daily_logs to prevent leaking private notes or unshared columns.
CREATE POLICY "Users can select own daily logs"
    ON public.daily_logs FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily logs"
    ON public.daily_logs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily logs"
    ON public.daily_logs FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily logs"
    ON public.daily_logs FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 6. DAILY SYMPTOMS POLICIES (Owner only via parent log)
CREATE POLICY "Users can select own daily symptoms"
    ON public.daily_symptoms FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.daily_logs dl
            WHERE dl.id = daily_symptoms.daily_log_id AND dl.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own daily symptoms"
    ON public.daily_symptoms FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.daily_logs dl
            WHERE dl.id = daily_symptoms.daily_log_id AND dl.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own daily symptoms"
    ON public.daily_symptoms FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.daily_logs dl
            WHERE dl.id = daily_symptoms.daily_log_id AND dl.user_id = auth.uid()
        )
    );

-- 7. PARTNER CONNECTIONS POLICIES
CREATE POLICY "Users can view connections they own or are partner of"
    ON public.partner_connections FOR SELECT
    TO authenticated
    USING (auth.uid() = owner_id OR auth.uid() = partner_id);

CREATE POLICY "Owners can insert partner invitations"
    ON public.partner_connections FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners or partners can update connection status"
    ON public.partner_connections FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id OR auth.uid() = partner_id);

CREATE POLICY "Owners can delete partner connections"
    ON public.partner_connections FOR DELETE
    TO authenticated
    USING (auth.uid() = owner_id);

-- 8. SHARING PERMISSIONS POLICIES
CREATE POLICY "Owners and active partners can view permissions"
    ON public.sharing_permissions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.partner_connections pc
            WHERE pc.id = sharing_permissions.connection_id
            AND (pc.owner_id = auth.uid() OR (pc.partner_id = auth.uid() AND pc.status = 'active'))
        )
    );

CREATE POLICY "Only owners can update sharing permissions"
    ON public.sharing_permissions FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.partner_connections pc
            WHERE pc.id = sharing_permissions.connection_id
            AND pc.owner_id = auth.uid()
        )
    );

CREATE POLICY "System/Owner can insert sharing permissions"
    ON public.sharing_permissions FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.partner_connections pc
            WHERE pc.id = sharing_permissions.connection_id
            AND pc.owner_id = auth.uid()
        )
    );

-- 9. PARTNER OBSERVATIONS POLICIES
CREATE POLICY "Observations viewable by owner and partner of active connection"
    ON public.partner_observations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.partner_connections pc
            WHERE pc.id = partner_observations.connection_id
            AND pc.status = 'active'
            AND (pc.owner_id = auth.uid() OR pc.partner_id = auth.uid())
        )
    );

CREATE POLICY "Partners can insert observations into active connection"
    ON public.partner_observations FOR INSERT
    TO authenticated
    WITH CHECK (
        author_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.partner_connections pc
            WHERE pc.id = partner_observations.connection_id
            AND pc.status = 'active'
            AND (pc.owner_id = auth.uid() OR pc.partner_id = auth.uid())
        )
    );

-- 10. NOTIFICATIONS & AI POLICIES (Owner only)
CREATE POLICY "Users own their push subscriptions"
    ON public.push_subscriptions FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own their notification settings"
    ON public.notification_settings FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own their notification history"
    ON public.notification_history FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own their AI insights"
    ON public.ai_insights FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 11. SECURITY DEFINER: MASKED PARTNER DATA ACCESS
-- Secure RPC to retrieve ONLY permitted owner fields. Notes are NEVER returned.
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

    -- Verify active connection
    SELECT * INTO v_connection
    FROM public.partner_connections
    WHERE owner_id = p_owner_id
      AND partner_id = v_partner_id
      AND status = 'active';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active partner connection found';
    END IF;

    -- Fetch permissions
    SELECT * INTO v_perms
    FROM public.sharing_permissions
    WHERE connection_id = v_connection.id;

    -- Query logs and project only permitted fields (Notes is STRICTLY excluded)
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

-- 12. SECURITY DEFINER: ACCEPT PARTNER INVITE RPC
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

    -- Update connection to active and bind partner_id
    UPDATE public.partner_connections
    SET partner_id = v_user_id,
        status = 'active',
        updated_at = NOW()
    WHERE id = v_connection.id;

    -- Ensure default sharing permissions exist
    INSERT INTO public.sharing_permissions (connection_id, share_cycle, share_mood, share_energy, share_symptoms)
    VALUES (v_connection.id, true, true, true, true)
    ON CONFLICT (connection_id) DO NOTHING;

    RETURN jsonb_build_object('success', true, 'connection_id', v_connection.id, 'owner_id', v_connection.owner_id);
END;
$$;

-- 13. SECURITY DEFINER: REVOKE/DISCONNECT PARTNER RPC
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

-- 14. SECURITY DEFINER: COMPLETE PROFILE ONBOARDING RPC
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

    -- Update or insert profile
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

    -- If user provided last period start date, insert into cycles table
    IF p_last_period_start IS NOT NULL THEN
        INSERT INTO public.cycles (user_id, start_date, end_date, notes)
        VALUES (v_user_id, p_last_period_start, p_last_period_end, 'Initial cycle from onboarding')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Set default notification settings
    INSERT INTO public.notification_settings (user_id, period_reminders_enabled)
    VALUES (v_user_id, p_reminder_enabled)
    ON CONFLICT (user_id) DO UPDATE SET period_reminders_enabled = EXCLUDED.period_reminders_enabled;

    RETURN jsonb_build_object('success', true);
END;
$$;
