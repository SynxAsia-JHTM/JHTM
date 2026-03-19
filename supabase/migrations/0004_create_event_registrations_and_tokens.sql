create extension if not exists pgcrypto;

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists event_registrations_unique_idx
on public.event_registrations (event_id, member_id);

create index if not exists event_registrations_event_id_idx on public.event_registrations (event_id);

create table if not exists public.checkin_tokens (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  scope text not null check (scope in ('service', 'member')),
  member_id uuid references public.members(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists checkin_tokens_event_id_idx on public.checkin_tokens (event_id);
create index if not exists checkin_tokens_expires_at_idx on public.checkin_tokens (expires_at);

