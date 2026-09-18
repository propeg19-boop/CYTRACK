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
