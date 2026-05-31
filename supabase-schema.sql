-- Run this in Supabase SQL Editor to create all tables

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  filename text,
  tema text,
  gancho text,
  estrutura text,
  producao text,
  viral_score numeric,
  viral_score_motivo text,
  pilar_choque numeric,
  pilar_divisao numeric,
  pilar_salvamento numeric,
  pilar_compartilhamento numeric,
  padroes text[],
  insights text,
  created_at timestamptz default now()
);

create table if not exists patterns (
  id uuid primary key default gen_random_uuid(),
  name text unique,
  frequency integer default 1,
  created_at timestamptz default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  handle text,
  text text,
  category text,
  score numeric,
  post text,
  reply text,
  created_at timestamptz default now()
);

create table if not exists growth (
  id uuid primary key default gen_random_uuid(),
  date date default current_date,
  followers integer,
  reach integer,
  impressions integer,
  created_at timestamptz default now()
);

-- Enable RLS
alter table videos enable row level security;
alter table patterns enable row level security;
alter table comments enable row level security;
alter table growth enable row level security;

-- Allow all for now (tighten when adding auth)
create policy "allow all" on videos for all using (true) with check (true);
create policy "allow all" on patterns for all using (true) with check (true);
create policy "allow all" on comments for all using (true) with check (true);
create policy "allow all" on growth for all using (true) with check (true);
