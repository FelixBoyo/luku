-- 014: Expo push tokens (Member 2)

create table if not exists public.push_tokens (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null references auth.users on delete cascade,
    token text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(user_id, token)
);

create index if not exists idx_push_tokens_user_id
    on public.push_tokens (user_id);

drop trigger if exists update_push_tokens_updated_at on public.push_tokens;
create trigger update_push_tokens_updated_at
    before update on public.push_tokens
    for each row execute procedure public.update_updated_at_column();

alter table public.push_tokens enable row level security;

drop policy if exists "Users can manage their own push tokens" on public.push_tokens;
create policy "Users can manage their own push tokens"
    on public.push_tokens for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
