-- AINARA Trace — Supabase starter schema
create extension if not exists pgcrypto;

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  type text not null,
  status text not null default 'Pending' check (status in ('Verified','Pending','Review')),
  last_transaction date,
  created_at timestamptz not null default now()
);

create table if not exists public.gold_batches (
  id uuid primary key default gen_random_uuid(),
  batch_code text unique not null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  weight_grams numeric(12,3) not null check (weight_grams >= 0),
  purity numeric(5,2),
  status text not null default 'Traceable' check (status in ('Traceable','Under Review','Verified')),
  source text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.trace_events (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.gold_batches(id) on delete cascade,
  actor_name text not null,
  actor_type text not null,
  event_name text not null,
  event_date timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.suppliers enable row level security;
alter table public.gold_batches enable row level security;
alter table public.trace_events enable row level security;

-- Prototype policies. Tighten these for production once Supabase Auth/roles are enabled.
drop policy if exists "demo read suppliers" on public.suppliers;
create policy "demo read suppliers" on public.suppliers for select using (true);

drop policy if exists "demo read batches" on public.gold_batches;
create policy "demo read batches" on public.gold_batches for select using (true);

drop policy if exists "demo read events" on public.trace_events;
create policy "demo read events" on public.trace_events for select using (true);

-- Realtime publication
alter publication supabase_realtime add table public.suppliers;
alter publication supabase_realtime add table public.gold_batches;
alter publication supabase_realtime add table public.trace_events;

insert into public.suppliers (code, name, type, status, last_transaction)
values
  ('SUP-001', 'Aurora Gold Collectors', 'Collector', 'Verified', '2026-09-05'),
  ('SUP-002', 'Nusantara Recycle Metals', 'Recycler', 'Verified', '2026-09-04'),
  ('SUP-003', 'Cendana Refinery', 'Refiner', 'Pending', '2026-09-03'),
  ('SUP-004', 'Mutiara Gold Store', 'Gold Retailer', 'Review', '2026-09-02')
on conflict (code) do nothing;
