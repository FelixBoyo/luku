-- 003: Mobile profile fields + social connections
-- Safe to re-run on dev (IF NOT EXISTS / idempotent policies)

-- ---------------------------------------------------------------------------
-- Extend profiles (live dev has id + email only)
-- ---------------------------------------------------------------------------
alter table public.profiles
    add column if not exists display_name text,
    add column if not exists handle text,
    add column if not exists bio text,
    add column if not exists avatar_url text,
    add column if not exists location text,
    add column if not exists website text,
    add column if not exists style_preferences text[] not null default '{}',
    add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_profiles_handle_unique
    on public.profiles (lower(handle))
    where handle is not null;

create index if not exists idx_profiles_display_name
    on public.profiles (display_name);

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
    before update on public.profiles
    for each row execute procedure public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Follow graph (Member 1 — ConnectionsScreen)
-- ---------------------------------------------------------------------------
create table if not exists public.user_follows (
    follower_id uuid not null references auth.users on delete cascade,
    following_id uuid not null references auth.users on delete cascade,
    created_at timestamptz not null default now(),
    primary key (follower_id, following_id),
    constraint user_follows_not_self check (follower_id <> following_id)
);

create index if not exists idx_user_follows_following_id
    on public.user_follows (following_id);

alter table public.user_follows enable row level security;

drop policy if exists "Users can view follows they participate in" on public.user_follows;
create policy "Users can view follows they participate in"
    on public.user_follows for select
    using (auth.uid() in (follower_id, following_id));

drop policy if exists "Users can follow others" on public.user_follows;
create policy "Users can follow others"
    on public.user_follows for insert
    with check (auth.uid() = follower_id);

drop policy if exists "Users can unfollow" on public.user_follows;
create policy "Users can unfollow"
    on public.user_follows for delete
    using (auth.uid() = follower_id);

-- ---------------------------------------------------------------------------
-- Block list (Settings → Blocked accounts)
-- ---------------------------------------------------------------------------
create table if not exists public.user_blocks (
    blocker_id uuid not null references auth.users on delete cascade,
    blocked_id uuid not null references auth.users on delete cascade,
    created_at timestamptz not null default now(),
    primary key (blocker_id, blocked_id),
    constraint user_blocks_not_self check (blocker_id <> blocked_id)
);

create index if not exists idx_user_blocks_blocked_id
    on public.user_blocks (blocked_id);

alter table public.user_blocks enable row level security;

drop policy if exists "Users manage their own blocks" on public.user_blocks;
create policy "Users manage their own blocks"
    on public.user_blocks for all
    using (auth.uid() = blocker_id)
    with check (auth.uid() = blocker_id);

-- ---------------------------------------------------------------------------
-- Profile update policy (live dev may only allow insert/select)
-- ---------------------------------------------------------------------------
drop policy if exists "Users can update their own profile." on public.profiles;
create policy "Users can update their own profile."
    on public.profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);
