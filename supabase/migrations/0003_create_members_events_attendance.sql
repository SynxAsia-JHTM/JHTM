create extension if not exists pgcrypto;

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  user_id bigint not null unique,
  name text not null default '',
  email text not null default '',
  phone text,
  gender text check (gender in ('Male', 'Female', 'Other')),
  category text check (category in ('Youth', 'Pastor', 'Leader', 'Member', 'Guest')),
  birthdate date,
  ministry text,
  status text not null default 'Active' check (status in ('Active', 'Pending', 'Inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists members_user_id_idx on public.members (user_id);
create index if not exists members_email_idx on public.members (email);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  time text not null default '00:00',
  location text not null default '',
  status text not null default 'Scheduled' check (status in ('Scheduled', 'Planned', 'Completed', 'Cancelled')),
  category text,
  speaker text,
  requires_registration boolean not null default false,
  max_slots integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_date_idx on public.events (date desc);
create index if not exists events_status_idx on public.events (status);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  attendee_type text not null check (attendee_type in ('member', 'guest')),
  member_id uuid references public.members(id) on delete cascade,
  guest_full_name text,
  guest_phone text,
  guest_email text,
  status text not null check (status in ('present', 'expected', 'late', 'excused', 'removed')),
  checkin_method text not null check (checkin_method in ('manual', 'qr')),
  checked_in_at timestamptz not null default now(),
  checked_in_by_user_id bigint,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_member_vs_guest_chk check (
    (attendee_type = 'member' and member_id is not null and guest_full_name is null)
    or
    (attendee_type = 'guest' and member_id is null and guest_full_name is not null)
  )
);

create index if not exists attendance_event_id_idx on public.attendance_records (event_id);
create index if not exists attendance_checked_in_at_idx on public.attendance_records (checked_in_at desc);
create index if not exists attendance_member_id_idx on public.attendance_records (member_id);

create unique index if not exists attendance_member_unique_per_event_idx
on public.attendance_records (event_id, member_id)
where member_id is not null;

