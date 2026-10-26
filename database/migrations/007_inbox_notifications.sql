-- 007: Inbox threads + messages (Member 4)
-- REST-first; realtime can layer on later.

-- ---------------------------------------------------------------------------
-- Threads (buyer ↔ seller, optionally scoped to a listing/product)
-- ---------------------------------------------------------------------------
create table if not exists public.inbox_threads (
    id uuid not null default gen_random_uuid() primary key,
    participant_one_id uuid not null references auth.users on delete cascade,
    participant_two_id uuid not null references auth.users on delete cascade,
    listing_id uuid references public.listings on delete set null,
    product_id uuid references public.products on delete set null,
    last_message_body text,
    last_message_at timestamptz,
    created_at timestamptz not null default now(),
    constraint inbox_threads_participant_order
        check (participant_one_id < participant_two_id),
    constraint inbox_threads_participants_distinct
        check (participant_one_id <> participant_two_id)
);

create unique index if not exists idx_inbox_threads_participants_context
    on public.inbox_threads (
        participant_one_id,
        participant_two_id,
        coalesce(listing_id, '00000000-0000-0000-0000-000000000000'::uuid),
        coalesce(product_id, '00000000-0000-0000-0000-000000000000'::uuid)
    );

create index if not exists idx_inbox_threads_last_message_at
    on public.inbox_threads (last_message_at desc nulls last);

alter table public.inbox_threads enable row level security;

drop policy if exists "Participants can view their threads" on public.inbox_threads;
create policy "Participants can view their threads"
    on public.inbox_threads for select
    using (auth.uid() in (participant_one_id, participant_two_id));

drop policy if exists "Participants can create threads" on public.inbox_threads;
create policy "Participants can create threads"
    on public.inbox_threads for insert
    with check (auth.uid() in (participant_one_id, participant_two_id));

drop policy if exists "Participants can update thread metadata" on public.inbox_threads;
create policy "Participants can update thread metadata"
    on public.inbox_threads for update
    using (auth.uid() in (participant_one_id, participant_two_id));

-- ---------------------------------------------------------------------------
-- Messages
-- ---------------------------------------------------------------------------
create table if not exists public.inbox_messages (
    id uuid not null default gen_random_uuid() primary key,
    thread_id uuid not null references public.inbox_threads on delete cascade,
    sender_id uuid not null references auth.users on delete cascade,
    body text not null,
    created_at timestamptz not null default now()
);

create index if not exists idx_inbox_messages_thread_id
    on public.inbox_messages (thread_id, created_at);

alter table public.inbox_messages enable row level security;

drop policy if exists "Participants can view messages in their threads" on public.inbox_messages;
create policy "Participants can view messages in their threads"
    on public.inbox_messages for select
    using (
        exists (
            select 1
            from public.inbox_threads t
            where t.id = thread_id
              and auth.uid() in (t.participant_one_id, t.participant_two_id)
        )
    );

drop policy if exists "Participants can send messages" on public.inbox_messages;
create policy "Participants can send messages"
    on public.inbox_messages for insert
    with check (
        auth.uid() = sender_id
        and exists (
            select 1
            from public.inbox_threads t
            where t.id = thread_id
              and auth.uid() in (t.participant_one_id, t.participant_two_id)
        )
    );

-- ---------------------------------------------------------------------------
-- Read receipts (unread badge)
-- ---------------------------------------------------------------------------
create table if not exists public.inbox_thread_reads (
    thread_id uuid not null references public.inbox_threads on delete cascade,
    user_id uuid not null references auth.users on delete cascade,
    last_read_at timestamptz not null default now(),
    primary key (thread_id, user_id)
);

alter table public.inbox_thread_reads enable row level security;

drop policy if exists "Users manage their own read state" on public.inbox_thread_reads;
create policy "Users manage their own read state"
    on public.inbox_thread_reads for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Keep thread preview in sync when a message is inserted
create or replace function public.inbox_touch_thread_on_message()
returns trigger as $$
begin
    update public.inbox_threads
    set
        last_message_body = left(new.body, 500),
        last_message_at = new.created_at
    where id = new.thread_id;
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists inbox_messages_touch_thread on public.inbox_messages;
create trigger inbox_messages_touch_thread
    after insert on public.inbox_messages
    for each row execute procedure public.inbox_touch_thread_on_message();
