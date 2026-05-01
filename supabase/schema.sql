create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  curriculum text not null default 'UK National Curriculum',
  phase text not null default 'Primary',
  year_groups text[] not null default '{}',
  class_profile text[] not null default '{}',
  subjects text[] not null default '{}',
  lesson_length text not null default '60 min',
  output_style text not null default 'Balanced',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile"
  on public.profiles
  for all
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create table if not exists public.saved_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('text', 'image', 'pptx')),
  resource_type text not null,
  title text not null,
  output text not null,
  created_at timestamptz not null default now()
);

alter table public.saved_resources enable row level security;

drop policy if exists "Users manage own resources" on public.saved_resources;
create policy "Users manage own resources"
  on public.saved_resources
  for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists saved_resources_user_created_idx
  on public.saved_resources (user_id, created_at desc);

create table if not exists public.user_memory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in (
    'preference',
    'class_context',
    'resource_signal',
    'chat_summary',
    'manual_note'
  )),
  key text not null,
  value jsonb not null default '{}'::jsonb,
  source text not null check (source in (
    'profile',
    'generator',
    'saved_resource',
    'chat',
    'manual'
  )),
  confidence numeric(4,3) not null default 1 check (confidence >= 0 and confidence <= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.user_memory_items is
  'Per-user ChalkAI memory. Clients should soft delete by setting deleted_at so audit and undo remain possible.';
comment on column public.user_memory_items.value is
  'Small structured memory payload. Do not store severe PII, pupil-identifiable data, or full generated resources.';
comment on column public.user_memory_items.source is
  'Origin of the memory item for audit and retention decisions.';

alter table public.user_memory_items enable row level security;

drop policy if exists "Users select own memory items" on public.user_memory_items;
create policy "Users select own memory items"
  on public.user_memory_items
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users insert own memory items" on public.user_memory_items;
create policy "Users insert own memory items"
  on public.user_memory_items
  for insert
  to authenticated
  with check (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and deleted_at is null
  );

drop policy if exists "Users update own memory items" on public.user_memory_items;
create policy "Users update own memory items"
  on public.user_memory_items
  for update
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users delete own memory items" on public.user_memory_items;
create policy "Users delete own memory items"
  on public.user_memory_items
  for delete
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create index if not exists user_memory_items_user_kind_updated_idx
  on public.user_memory_items (user_id, kind, updated_at desc);

create index if not exists user_memory_items_user_active_idx
  on public.user_memory_items (user_id, deleted_at)
  where deleted_at is null;

create table if not exists public.memory_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'teacher_memory' check (kind in (
    'teacher_memory',
    'class_context',
    'resource_preferences',
    'chat_summary'
  )),
  summary text not null,
  source_item_ids uuid[] not null default '{}',
  token_count integer not null default 0 check (token_count >= 0),
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.memory_summaries is
  'Prompt-ready summaries derived from user_memory_items. Regenerate on retention cleanup or memory changes.';
comment on column public.memory_summaries.summary is
  'Bounded, non-sensitive prompt context. Severe PII and pupil-identifiable details must be excluded before writes.';

alter table public.memory_summaries enable row level security;

drop policy if exists "Users select own memory summaries" on public.memory_summaries;
create policy "Users select own memory summaries"
  on public.memory_summaries
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users insert own memory summaries" on public.memory_summaries;
create policy "Users insert own memory summaries"
  on public.memory_summaries
  for insert
  to authenticated
  with check (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and deleted_at is null
  );

drop policy if exists "Users update own memory summaries" on public.memory_summaries;
create policy "Users update own memory summaries"
  on public.memory_summaries
  for update
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users delete own memory summaries" on public.memory_summaries;
create policy "Users delete own memory summaries"
  on public.memory_summaries
  for delete
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create unique index if not exists memory_summaries_user_kind_idx
  on public.memory_summaries (user_id, kind)
  where deleted_at is null;

create index if not exists memory_summaries_user_updated_idx
  on public.memory_summaries (user_id, updated_at desc);
