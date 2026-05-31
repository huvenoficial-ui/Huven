-- Run this in Supabase SQL Editor
-- Safe to run multiple times (IF NOT EXISTS / IF NOT EXISTS column guards)

-- Videos table
create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  filename text, tema text, gancho text, estrutura text, producao text,
  viral_score numeric, viral_score_motivo text,
  pilar_choque numeric, pilar_divisao numeric, pilar_salvamento numeric, pilar_compartilhamento numeric,
  padroes text[], insights text,
  created_at timestamptz default now()
);

-- Patterns table
create table if not exists patterns (
  id uuid primary key default gen_random_uuid(),
  name text unique, frequency integer default 1,
  created_at timestamptz default now()
);

-- CRM leads table
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  handle text,
  text text,
  score numeric default 5,
  stage text default 'novo',   -- novo | contato | proposta | fechado | perdido
  notes text default '',
  follow_up_date date,
  tags text[] default '{}',
  post text,
  reply text,
  created_at timestamptz default now()
);

-- Legacy comments table
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  handle text, text text, category text, score numeric, post text, reply text,
  created_at timestamptz default now()
);

-- Competitors table (full schema with all columns used by the app)
create table if not exists competitors (
  id uuid primary key default gen_random_uuid(),
  handle text unique,
  temas text,
  gaps text[] default '{}',
  notes text default '',
  followers integer,
  following integer,
  posts integer,
  engagement_rate numeric,
  profile_pic_url text,
  biography text,
  last_synced timestamptz,
  created_at timestamptz default now()
);

-- Add missing competitor columns if table already exists
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='competitors' and column_name='followers') then
    alter table competitors add column followers integer;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='competitors' and column_name='following') then
    alter table competitors add column following integer;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='competitors' and column_name='posts') then
    alter table competitors add column posts integer;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='competitors' and column_name='engagement_rate') then
    alter table competitors add column engagement_rate numeric;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='competitors' and column_name='profile_pic_url') then
    alter table competitors add column profile_pic_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='competitors' and column_name='biography') then
    alter table competitors add column biography text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='competitors' and column_name='last_synced') then
    alter table competitors add column last_synced timestamptz;
  end if;
end $$;

-- Instagram metrics table (stores one row per day per account)
create table if not exists instagram_metrics (
  id uuid primary key default gen_random_uuid(),
  username text,                        -- which account this row belongs to
  date date default current_date,
  followers integer,
  following integer,
  posts_count integer,
  avg_reach numeric,
  avg_impressions numeric,
  created_at timestamptz default now()
);

-- Add username column to instagram_metrics if it doesn't exist
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='instagram_metrics' and column_name='username') then
    alter table instagram_metrics add column username text;
  end if;
end $$;

-- Instagram profile table (current snapshot per account)
create table if not exists instagram_profile (
  id uuid primary key default gen_random_uuid(),
  username text unique,
  full_name text,
  biography text,
  profile_pic_url text,
  followers integer,
  following integer,
  posts integer,
  is_verified boolean default false,
  avg_likes numeric,
  avg_comments numeric,
  engagement_rate numeric,
  last_synced timestamptz,
  created_at timestamptz default now()
);

-- RLS
alter table videos enable row level security;
alter table patterns enable row level security;
alter table leads enable row level security;
alter table comments enable row level security;
alter table competitors enable row level security;
alter table instagram_metrics enable row level security;
alter table instagram_profile enable row level security;

-- Open policies (tighten when per-user auth is enforced)
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'videos' and policyname = 'allow all') then
    create policy "allow all" on videos for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'patterns' and policyname = 'allow all') then
    create policy "allow all" on patterns for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'leads' and policyname = 'allow all') then
    create policy "allow all" on leads for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'comments' and policyname = 'allow all') then
    create policy "allow all" on comments for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'competitors' and policyname = 'allow all') then
    create policy "allow all" on competitors for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'instagram_metrics' and policyname = 'allow all') then
    create policy "allow all" on instagram_metrics for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'instagram_profile' and policyname = 'allow all') then
    create policy "allow all" on instagram_profile for all using (true) with check (true);
  end if;
end $$;
