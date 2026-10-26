-- 013: Notifications (Member 2)

create table if not exists public.notifications (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null references auth.users on delete cascade,
    category text not null,
    title text not null,
    body text not null,
    unread boolean not null default true,
    created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id
    on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications"
    on public.notifications for select
    using (auth.uid() = user_id);

drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications"
    on public.notifications for update
    using (auth.uid() = user_id);

drop policy if exists "Users can insert their own notifications" on public.notifications;
create policy "Users can insert their own notifications"
    on public.notifications for insert
    with check (auth.uid() = user_id);

drop policy if exists "Service role can manage notifications" on public.notifications;
create policy "Service role can manage notifications"
    on public.notifications for all
    to service_role
    using (true)
    with check (true);

-- Webhook Trigger using pg_net
create extension if not exists pg_net;

create or replace function public.notify_order_status_webhook()
returns trigger as $$
declare
  webhook_url text := current_setting('app.settings.orders_webhook_url', true);
  webhook_secret text := current_setting('app.settings.webhook_secret', true);
begin
  -- Default to local backend for development if setting is missing
  if webhook_url is null or webhook_url = '' then
    webhook_url := 'http://host.docker.internal:3001/webhooks/orders';
  end if;

  if webhook_secret is null or webhook_secret = '' then
    webhook_secret := 'dev_webhook_secret';
  end if;

  perform net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-webhook-secret', webhook_secret
      ),
      body := jsonb_build_object(
          'type', 'UPDATE',
          'table', 'orders',
          'schema', 'public',
          'record', row_to_json(new),
          'old_record', row_to_json(old)
      )
  );

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists order_status_webhook_trigger on public.orders;
create trigger order_status_webhook_trigger
  after update of status on public.orders
  for each row
  when (old.status is distinct from new.status and new.status in ('paid', 'shipped', 'delivered'))
  execute procedure public.notify_order_status_webhook();
