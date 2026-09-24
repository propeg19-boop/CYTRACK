-- Phase 1–3 schema. Run this in the Supabase SQL editor.
-- Every table has RLS on: the database refuses unauthorized access,
-- the frontend is never the security boundary.

create table cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now()
);

create table daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  mood text,
  energy smallint check (energy between 1 and 5),
  flow text check (flow in ('none', 'spotting', 'light', 'medium', 'heavy')),
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create table symptoms (
  id serial primary key,
  name text not null unique
);

create table daily_symptoms (
  daily_log_id uuid not null references daily_logs(id) on delete cascade,
  symptom_id int not null references symptoms(id),
  primary key (daily_log_id, symptom_id)
);

-- Partner linking is added in Phase 8, kept here so the FK shape is settled early.
create table partner_connections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  partner_id uuid references auth.users(id) on delete cascade,
  invite_code text unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default now()
);

create table sharing_permissions (
  connection_id uuid primary key references partner_connections(id) on delete cascade,
  share_period boolean not null default true,
  share_cycle_day boolean not null default true,
  share_symptoms boolean not null default false,
  share_mood boolean not null default false,
  share_history boolean not null default false
);

-- Partner observations are a separate, non-editable-by-owner data type —
-- never written into daily_logs, so the partner can never touch her records.
create table partner_observations (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references partner_connections(id) on delete cascade,
  observed_date date not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- === Row Level Security ===

alter table cycles enable row level security;
alter table daily_logs enable row level security;
alter table daily_symptoms enable row level security;
alter table partner_connections enable row level security;
alter table sharing_permissions enable row level security;
alter table partner_observations enable row level security;

create policy "owner full access to own cycles"
  on cycles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "owner full access to own daily_logs"
  on daily_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "owner full access to own daily_symptoms"
  on daily_symptoms for all
  using (
    exists (
      select 1 from daily_logs
      where daily_logs.id = daily_symptoms.daily_log_id
      and daily_logs.user_id = auth.uid()
    )
  );

create policy "connection parties can see the connection"
  on partner_connections for select
  using (auth.uid() = owner_id or auth.uid() = partner_id);

create policy "owner manages the connection"
  on partner_connections for insert
  with check (auth.uid() = owner_id);

create policy "owner updates the connection"
  on partner_connections for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Sharing permissions: only the owning side of the connection can set them.
create policy "owner manages sharing permissions"
  on sharing_permissions for all
  using (
    exists (
      select 1 from partner_connections
      where partner_connections.id = sharing_permissions.connection_id
      and partner_connections.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from partner_connections
      where partner_connections.id = sharing_permissions.connection_id
      and partner_connections.owner_id = auth.uid()
    )
  );

-- Partner can add observations, but only on connections where they're the partner,
-- and only insert/select — never update or delete the owner's view of them.
create policy "partner can add observations"
  on partner_observations for insert
  with check (
    exists (
      select 1 from partner_connections
      where partner_connections.id = partner_observations.connection_id
      and partner_connections.partner_id = auth.uid()
      and partner_connections.status = 'accepted'
    )
  );

create policy "connection parties can read observations"
  on partner_observations for select
  using (
    exists (
      select 1 from partner_connections
      where partner_connections.id = partner_observations.connection_id
      and (partner_connections.owner_id = auth.uid() or partner_connections.partner_id = auth.uid())
    )
  );

-- === Phase 5 additions ===
-- symptoms was created in Phase 1 with no RLS and no data — it's a shared
-- read-only reference list (not per-user), so it needs a SELECT policy for
-- authenticated users but no insert/update/delete policy at all.

alter table symptoms enable row level security;

create policy "authenticated users can read symptoms"
  on symptoms for select
  to authenticated
  using (true);

insert into symptoms (name) values
  ('Cramps'), ('Headache'), ('Bloating'), ('Fatigue'), ('Acne'),
  ('Backache'), ('Nausea'), ('Tender breasts'), ('Cravings'), ('Insomnia')
on conflict (name) do nothing;

-- === Phase 7 additions ===
-- One row per device/browser subscribed to push. A user can have several
-- (phone + laptop), so this is one-to-many, not a column on the user.

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "owner full access to own push_subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tracks whether a reminder was already sent for the currently predicted
-- period, so the scheduled job doesn't push the same reminder every day
-- until the period actually starts. One row per user.

create table notification_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reminders_enabled boolean not null default true,
  last_reminded_start_date date
);

alter table notification_settings enable row level security;

create policy "owner full access to own notification_settings"
  on notification_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- === Phase 8 additions ===
-- Partner mode. partner_connections/sharing_permissions/partner_observations
-- and their base policies already existed from Phase 1 — this phase adds
-- what's needed for a partner to actually see shared data, verified against
-- a real Postgres instance with RLS before shipping (not just read-reviewed).
--
-- Accepting an invite is NOT a direct table update from the client.
-- partner_connections only lets the OWNER update it — an invite's security
-- depends on the code being unguessable, not on the row being enumerable,
-- so there is deliberately no SELECT policy letting anyone browse pending
-- invites. Acceptance goes through the accept-invite Edge Function, which
-- uses the service role to look up the row by code after verifying the
-- caller's identity. Confirmed by testing: a naive client-side accept
-- silently updates 0 rows under this RLS — no error, just does nothing.

-- Row-level policy is safe here since cycles has no free-text columns —
-- nothing on this table needs column-level masking.
create policy "partner can view shared cycles"
  on cycles for select
  using (
    exists (
      select 1 from partner_connections pc
      join sharing_permissions sp on sp.connection_id = pc.id
      where pc.owner_id = cycles.user_id
        and pc.partner_id = auth.uid()
        and pc.status = 'accepted'
        and (sp.share_period or sp.share_cycle_day)
    )
  );

-- sharing_permissions previously only had a policy letting the OWNER read
-- it. Without this, the cycles policy above silently fails: its subquery
-- reads sharing_permissions as the PARTNER, who had no read access to that
-- table at all. Only caught by testing the full flow end to end — the
-- policy above looked correct in isolation and wasn't.
create policy "partner can view sharing permissions for their connection"
  on sharing_permissions for select
  using (
    exists (
      select 1 from partner_connections pc
      where pc.id = sharing_permissions.connection_id
        and pc.partner_id = auth.uid()
        and pc.status = 'accepted'
    )
  );

-- daily_logs deliberately gets NO new row-level SELECT policy for the
-- partner. Tested and confirmed: Postgres RLS is row-level, not
-- column-level — a policy granting row access "if share_mood is on" also
-- exposes daily_logs.notes (free text, can contain anything) in full to a
-- raw query, regardless of whether notes sharing was ever agreed to. The
-- fix is a SECURITY DEFINER function that does its own column masking and
-- is the *only* path to this data for a partner — direct queries to
-- daily_logs by a partner return nothing, by design.
create or replace function get_partner_logs(p_owner_id uuid)
returns table (log_date date, mood text, energy smallint, flow text, notes text, symptom_names text[])
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select
      dl.log_date,
      case when sp.share_mood or sp.share_history then dl.mood else null end,
      case when sp.share_history then dl.energy else null end,
      case when sp.share_period or sp.share_cycle_day or sp.share_history then dl.flow else null end,
      case when sp.share_history then dl.notes else null end,
      case when sp.share_symptoms or sp.share_history then
        (select array_agg(s.name) from daily_symptoms ds join symptoms s on s.id = ds.symptom_id where ds.daily_log_id = dl.id)
      else null end
    from daily_logs dl
    join partner_connections pc on pc.owner_id = dl.user_id
    join sharing_permissions sp on sp.connection_id = pc.id
    where dl.user_id = p_owner_id
      and pc.partner_id = auth.uid()
      and pc.status = 'accepted';
end;
$$;

grant execute on function get_partner_logs(uuid) to authenticated;

-- === Phase 9 additions ===
-- One cached insight per user per day. Without this cache, every app open
-- would call the Gemini API again — free-tier rate limits are low enough
-- (roughly hundreds of requests/day) that this isn't optional at any real
-- scale, only harmless right now because it's two people.

create table ai_insights (
  user_id uuid not null references auth.users(id) on delete cascade,
  insight_date date not null,
  content text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, insight_date)
);

alter table ai_insights enable row level security;

create policy "owner full access to own ai_insights"
  on ai_insights for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
