create extension if not exists pgcrypto;

create table if not exists public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  user_id bigint not null,
  message text not null,
  visibility text not null default 'private' check (visibility in ('private', 'leaders', 'public')),
  is_anonymous boolean not null default false,
  status text not null default 'Submitted',
  created_at timestamptz not null default now()
);

create index if not exists prayer_requests_user_id_idx on public.prayer_requests (user_id);
create index if not exists prayer_requests_created_at_idx on public.prayer_requests (created_at desc);

