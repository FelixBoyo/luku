-- Dev auth users (run before dev_seed.sql)
-- Password for all: LukuDev2026!

create extension if not exists pgcrypto;

insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
) values
    (
        '00000000-0000-0000-0000-000000000000',
        'f0000001-0000-4000-8000-000000000001',
        'authenticated',
        'authenticated',
        'dev+buyer@luku.app',
        crypt('LukuDev2026!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"display_name":"Shannon Martinez"}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        'f0000001-0000-4000-8000-000000000002',
        'authenticated',
        'authenticated',
        'dev+seller@luku.app',
        crypt('LukuDev2026!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"display_name":"Chic Boutique"}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        'f0000001-0000-4000-8000-000000000003',
        'authenticated',
        'authenticated',
        'dev+seller2@luku.app',
        crypt('LukuDev2026!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"display_name":"Vintage Vibes"}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
    )
on conflict (id) do update set
    email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

insert into auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
) values
    (
        'f0000001-0000-4000-8000-000000000001',
        'f0000001-0000-4000-8000-000000000001',
        'f0000001-0000-4000-8000-000000000001',
        '{"sub":"f0000001-0000-4000-8000-000000000001","email":"dev+buyer@luku.app"}'::jsonb,
        'email',
        now(),
        now(),
        now()
    ),
    (
        'f0000001-0000-4000-8000-000000000002',
        'f0000001-0000-4000-8000-000000000002',
        'f0000001-0000-4000-8000-000000000002',
        '{"sub":"f0000001-0000-4000-8000-000000000002","email":"dev+seller@luku.app"}'::jsonb,
        'email',
        now(),
        now(),
        now()
    ),
    (
        'f0000001-0000-4000-8000-000000000003',
        'f0000001-0000-4000-8000-000000000003',
        'f0000001-0000-4000-8000-000000000003',
        '{"sub":"f0000001-0000-4000-8000-000000000003","email":"dev+seller2@luku.app"}'::jsonb,
        'email',
        now(),
        now(),
        now()
    )
on conflict (id) do update set
    identity_data = excluded.identity_data,
    updated_at = now();
