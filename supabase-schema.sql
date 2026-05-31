-- Run this in Supabase SQL Editor

-- Existing tables (keep as is)
create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  filename text, tema text, gancho text, estrutura text, producao text,
  viral_score numeric, viral_score_motivo text,
  pilar_choque numeric, pilar_divisao numeric, pilar_salvamento numeric, pilar_compartilhamento numeric,
  padroes text[], insights text,
  created_at timestamptz default now()
);

create table if not exists patterns (
  id uuid primary key default gen_random_uuid(),
  name text unique, frequency integer default 1,
  created_at timestamptz default now()
);

-- CRM leads table (replaces old comments for social selling)
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

-- Keep old comments table for backward compat
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  handle text, text text, category text, score numeric, post text, reply text,
  created_at timestamptz default now()
);

-- Competitors
create table if not exists competitors (
  id uuid primary key default gen_random_uuid(),
  handle text unique,
  temas text,
  gaps text[] default '{}',
  notes text default '',
  created_at timestamptz default now()
);

-- Instagram metrics (real data via API)
create table if not exists instagram_metrics (
  id uuid primary key default gen_random_uuid(),
  date date default current_date,
  followers integer,
  following integer,
  posts_count integer,
  avg_reach numeric,
  avg_impressions numeric,
  created_at timestamptz default now()
);

-- RLS
alter table videos enable row level security;
alter table patterns enable row level security;
alter table leads enable row level security;
alter table comments enable row level security;
alter table competitors enable row level security;
alter table instagram_metrics enable row level security;

-- Policies (open for now — tighten when auth is enforced per-user)
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
end $$;
