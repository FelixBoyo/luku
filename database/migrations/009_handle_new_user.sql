-- 009: Harden auth.users → profiles trigger for BFF signup (admin.createUser)
-- Safe to re-run (CREATE OR REPLACE)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, email, display_name)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'display_name', null)
    )
    on conflict (id) do update set
        email = excluded.email,
        display_name = coalesce(excluded.display_name, public.profiles.display_name);
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
