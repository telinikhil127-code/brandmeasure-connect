-- BrandMeasure Connect — Admin dashboard tables
-- Run after 20250512120000_agency_dashboard.sql

create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text,
  city text,
  phone text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create index if not exists agencies_status_idx on public.agencies (status);

create table if not exists public.vendor_registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  company text,
  city text,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists vendor_registrations_status_idx on public.vendor_registrations (status);

create table if not exists public.platform_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text not null,
  user_role text not null,
  agency_id uuid references public.agencies (id) on delete set null,
  vendor_id uuid references public.vendors (id) on delete set null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create index if not exists platform_users_role_idx on public.platform_users (user_role);

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  severity text not null default 'info',
  read_at timestamptz,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_notifications_created_idx on public.admin_notifications (created_at desc);

-- Seed agencies (once)
insert into public.agencies (name, contact_email, city, phone, status)
select v.name, v.contact_email, v.city, v.phone, v.status
from (
  values
    ('Sparkline Media Pvt Ltd', 'ops@sparkline.in', 'Mumbai', '+91 22 4000 1000', 'active'),
    ('NorthStar OOH Agency', 'hello@northstarooh.com', 'Delhi', '+91 11 4100 2200', 'active'),
    ('Canvas Brand Solutions', 'team@canvasbrand.in', 'Bengaluru', '+91 80 4300 5500', 'suspended')
) as v(name, contact_email, city, phone, status)
where not exists (select 1 from public.agencies limit 1);

-- Demo pending vendor registrations (idempotent by email)
insert into public.vendor_registrations (full_name, email, phone, company, city, status)
select v.full_name, v.email, v.phone, v.company, v.city, 'pending'
from (
  values
    ('Anita Desai', 'anita.d@fieldops.in', '+91 98100 11223', 'FieldOps Measurements', 'Ahmedabad'),
    ('Mohammed Imran', 'imran.m@sitecheck.co', '+91 98450 33445', 'SiteCheck Vendor', 'Hyderabad')
) as v(full_name, email, phone, company, city)
where not exists (
  select 1 from public.vendor_registrations r where r.email in ('anita.d@fieldops.in', 'imran.m@sitecheck.co')
);

-- Platform directory users (demo)
insert into public.platform_users (email, display_name, user_role, status)
select u.email, u.display_name, u.user_role, u.status
from (
  values
    ('admin@brandmeasure.in', 'Platform Admin', 'admin', 'active'),
    ('aarav.m@sparkline.in', 'Aarav Mehta', 'agency', 'active'),
    ('suresh.k@measure.in', 'Suresh Kumar', 'vendor', 'active')
) as u(email, display_name, user_role, status)
where not exists (select 1 from public.platform_users limit 1);

insert into public.admin_notifications (title, body, severity)
select n.title, n.body, n.severity
from (
  values
    ('Welcome to Admin', 'Use Approvals to verify new vendor sign-ups.', 'info'),
    ('Payments threshold', '3 tasks pending payout review this week.', 'warning')
) as n(title, body, severity)
where not exists (select 1 from public.admin_notifications limit 1);

alter table public.agencies enable row level security;
alter table public.vendor_registrations enable row level security;
alter table public.platform_users enable row level security;
alter table public.admin_notifications enable row level security;

drop policy if exists "admin_agencies_anon" on public.agencies;
create policy "admin_agencies_anon" on public.agencies for all to anon using (true) with check (true);

drop policy if exists "admin_vendor_reg_anon" on public.vendor_registrations;
create policy "admin_vendor_reg_anon" on public.vendor_registrations for all to anon using (true) with check (true);

drop policy if exists "admin_platform_users_anon" on public.platform_users;
create policy "admin_platform_users_anon" on public.platform_users for all to anon using (true) with check (true);

drop policy if exists "admin_notifications_anon" on public.admin_notifications;
create policy "admin_notifications_anon" on public.admin_notifications for all to anon using (true) with check (true);
