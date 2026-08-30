-- RotaGuide optional cloud backup.
--
-- Design constraint: this table holds health data for a project whose
-- own ethics analysis commits to never transmitting injection data
-- off-device without explicit consent. So the schema stores the minimum
-- the rotation logic needs and nothing else.
--
-- Deliberately absent: name, date of birth, glucose readings, insulin
-- doses, device identifiers, IP addresses. If a column is not required
-- to compute a rotation recommendation, it is not here.

create table if not exists public.injections (
  id          uuid primary key,
  user_id     uuid not null references auth.users on delete cascade,
  region      text not null,
  zone        smallint not null,
  occurred_at timestamptz not null,
  created_at  timestamptz not null default now(),

  -- Mirror the domain model's constraints at the database boundary.
  -- The client validates with Zod; the server does not take that on
  -- trust.
  constraint injections_region_valid check (
    region in ('abdomen-L', 'abdomen-R', 'thigh-L', 'thigh-R', 'arm-L', 'arm-R')
  ),
  constraint injections_zone_range check (zone >= 0 and zone < 12)
);

-- The only query the app makes is "my injections, by time".
create index if not exists injections_user_occurred_idx
  on public.injections (user_id, occurred_at desc);

-- ── Row Level Security ──────────────────────────────────────────────
-- Enabled with no exceptions. Without a policy, RLS denies by default,
-- so each operation is granted explicitly and every one is scoped to
-- the authenticated user.

alter table public.injections enable row level security;

-- Force RLS even for the table owner, so a privileged connection cannot
-- accidentally bypass these policies.
alter table public.injections force row level security;

drop policy if exists "read own injections" on public.injections;
create policy "read own injections"
  on public.injections
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "insert own injections" on public.injections;
create policy "insert own injections"
  on public.injections
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Entries are immutable once written — that is what makes last-write-
-- wins per id a safe conflict resolution strategy. The update policy
-- exists only so the client's upsert succeeds when re-pushing a row it
-- already sent; the check clause keeps it scoped to the owner.
drop policy if exists "update own injections" on public.injections;
create policy "update own injections"
  on public.injections
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "delete own injections" on public.injections;
create policy "delete own injections"
  on public.injections
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Anonymous users get nothing. Stated explicitly rather than left to
-- the absence of a policy.
revoke all on public.injections from anon;
