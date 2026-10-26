-- 011: Backfill profiles.handle for rows created before username-at-signup

do $$
declare
    r record;
    base_handle text;
    candidate text;
    suffix int;
    max_base_len int;
begin
    for r in
        select id, email
        from public.profiles
        where handle is null
    loop
        base_handle := lower(split_part(coalesce(r.email, 'user'), '@', 1));
        base_handle := regexp_replace(base_handle, '[^a-z0-9_]', '', 'g');

        if length(base_handle) < 3 then
            base_handle := rpad(base_handle, 3, '0');
        end if;

        if length(base_handle) > 20 then
            base_handle := left(base_handle, 20);
        end if;

        candidate := base_handle;
        suffix := 0;

        while exists (
            select 1
            from public.profiles p
            where p.handle is not null
              and lower(p.handle) = lower(candidate)
        ) loop
            suffix := suffix + 1;
            max_base_len := 20 - length(suffix::text);
            if max_base_len < 3 then
                max_base_len := 3;
            end if;
            candidate := left(base_handle, max_base_len) || suffix::text;
        end loop;

        update public.profiles
        set handle = candidate
        where id = r.id;
    end loop;
end $$;
