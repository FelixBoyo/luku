-- Virtual Try-On Feature Database Schema

-- 1. User Profile Images Table
create table public.user_profile_images (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null references auth.users on delete cascade,
    image_url text not null,
    is_default boolean not null default false,
    created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.user_profile_images enable row level security;

-- RLS Policies
create policy "Users can manage their own profile images."
    on public.user_profile_images for all
    using (auth.uid() = user_id);

-- Index for performance
create index idx_user_profile_images_user_id on public.user_profile_images(user_id);
create index idx_user_profile_images_default on public.user_profile_images(user_id, is_default);

-- Trigger to ensure only one default image per user
create or replace function public.ensure_single_default_profile_image()
returns trigger as $$
begin
    if NEW.is_default = true then
        update public.user_profile_images
        set is_default = false
        where user_id = NEW.user_id and id != NEW.id;
    end if;
    return NEW;
end;
$$ language plpgsql;

create trigger on_profile_image_insert_update
    before insert or update on public.user_profile_images
    for each row execute procedure public.ensure_single_default_profile_image();

-- 2. Mannequin Settings Table
create table public.mannequin_settings (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null references auth.users on delete cascade unique,
    body_type text not null default 'average' check (body_type in ('slim', 'average', 'athletic', 'plus-size')),
    height_cm integer not null default 170 check (height_cm between 140 and 210),
    chest_cm integer check (chest_cm is null or chest_cm between 70 and 150),
    waist_cm integer check (waist_cm is null or waist_cm between 50 and 130),
    hips_cm integer check (hips_cm is null or hips_cm between 70 and 150),
    skin_tone text not null default 'medium' check (skin_tone in ('fair', 'light', 'medium', 'tan', 'brown', 'dark')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.mannequin_settings enable row level security;

-- RLS Policies
create policy "Users can manage their own mannequin settings."
    on public.mannequin_settings for all
    using (auth.uid() = user_id);

-- Index for performance
create index idx_mannequin_settings_user_id on public.mannequin_settings(user_id);

-- Trigger to update updated_at timestamp
create or replace function public.update_mannequin_settings_updated_at()
returns trigger as $$
begin
    NEW.updated_at = now();
    return NEW;
end;
$$ language plpgsql;

create trigger on_mannequin_settings_update
    before update on public.mannequin_settings
    for each row execute procedure public.update_mannequin_settings_updated_at();

-- Storage bucket for profile images (run in Supabase dashboard -> Storage)
-- Bucket name: 'user-profile-images'
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png
