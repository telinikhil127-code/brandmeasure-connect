-- BrandMeasure Connect — Agency dashboard tables
-- Run in Supabase SQL Editor or via CLI: supabase db push

create extension if not exists "pgcrypto";

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  city text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.measurement_tasks (
  id uuid primary key default gen_random_uuid(),
  task_code text not null unique,
  brand text not null,
  site text not null,
  city text not null,
  deadline text not null,
  payout_inr numeric(12, 2) not null default 0,
  status text not null default 'new',
  vendor_id uuid references public.vendors (id) on delete set null,
  payment_status text not null default 'unpaid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists measurement_tasks_status_idx on public.measurement_tasks (status);
create index if not exists measurement_tasks_vendor_idx on public.measurement_tasks (vendor_id);

create table if not exists public.agency_activity_log (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.measurement_tasks (id) on delete cascade,
  message text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists agency_activity_log_created_idx on public.agency_activity_log (created_at desc);

-- Seed demo vendors (idempotent insert by email where unique — use insert only if empty check)
insert into public.vendors (name, email, city, phone)
select v.name, v.email, v.city, v.phone
from (
  values
    ('Suresh Kumar', 'suresh.k@measure.in', 'Bengaluru', '+91 98765 43210'),
    ('Priya Nair', 'priya.n@fieldwork.co', 'Mumbai', '+91 91234 56789'),
    ('Ravi Singh', 'ravi.s@oohvendor.in', 'Delhi NCR', '+91 99887 76655')
) as v(name, email, city, phone)
where not exists (select 1 from public.vendors limit 1);

alter table public.vendors enable row level security;
alter table public.measurement_tasks enable row level security;
alter table public.agency_activity_log enable row level security;

-- Demo / development: allow anon key from the app to read & write.
-- Tighten these policies when you add Supabase Auth and agency-scoped rows.
drop policy if exists "agency_vendors_anon" on public.vendors;
create policy "agency_vendors_anon" on public.vendors
  for all to anon using (true) with check (true);

drop policy if exists "agency_tasks_anon" on public.measurement_tasks;
create policy "agency_tasks_anon" on public.measurement_tasks
  for all to anon using (true) with check (true);

drop policy if exists "agency_activity_anon" on public.agency_activity_log;
create policy "agency_activity_anon" on public.agency_activity_log
  for all to anon using (true) with check (true);
