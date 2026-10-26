import { createClient } from '@supabase/supabase-js';

const PROJECT_ID =
    (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID ||
    process.env.SUPABASE_PROJECT_ID ||
    '';
const ANON_KEY =
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';

// Build URL only when we have a project id
const supabaseUrl = PROJECT_ID ? `https://${PROJECT_ID}.supabase.co` : '';
const supabaseAnonKey = ANON_KEY;

// const supabaseUrl = `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`;
// const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Set this to `true` to skip the login/registration screen during development.
// A mock user session will be created automatically.
// IMPORTANT: Ensure this is `false` in any production environment.
export const ENABLE_DEV_BYPASS = false;

// =================================================================================
// --- DATABASE SCHEMA ---
// Run the following SQL in your Supabase SQL Editor to set up the database tables.
// =================================================================================
/*
-- 1. Create profiles table to store public user data
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  primary key (id)
);
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
-- This trigger automatically creates a profile entry when a new user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Create clothing_items table
create table public.clothing_items (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users on delete cascade,
  image_url text not null,
  name text not null,
  category text not null,
  color text not null,
  style text not null,
  season text not null,
  status text not null default 'clean'::text,
  created_at timestamptz not null default now()
);
alter table public.clothing_items enable row level security;
create policy "Users can manage their own clothing items." on public.clothing_items for all using (auth.uid() = user_id);

-- 3. Create outfits table (to store favorited outfits)
create table public.outfits (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null references auth.users on delete cascade,
    outfit_name text not null,
    description text,
    created_at timestamptz not null default now()
);
alter table public.outfits enable row level security;
create policy "Users can manage their own outfits." on public.outfits for all using (auth.uid() = user_id);

-- 4. Create outfit_items join table (many-to-many between outfits and clothing_items)
create table public.outfit_items (
    outfit_id uuid not null references public.outfits on delete cascade,
    item_id uuid not null references public.clothing_items on delete cascade,
    primary key (outfit_id, item_id)
);
alter table public.outfit_items enable row level security;
create policy "Users can manage items in their own outfits." on public.outfit_items for all
    using (auth.uid() = (select user_id from public.outfits where id = outfit_id));

-- 5. Create albums table
create table public.albums (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null references auth.users on delete cascade,
    name text not null,
    created_at timestamptz not null default now()
);
alter table public.albums enable row level security;
create policy "Users can manage their own albums." on public.albums for all using (auth.uid() = user_id);

-- 6. Create album_outfits join table (many-to-many between albums and outfits)
create table public.album_outfits (
    album_id uuid not null references public.albums on delete cascade,
    outfit_id uuid not null references public.outfits on delete cascade,
    primary key (album_id, outfit_id)
);
alter table public.album_outfits enable row level security;
create policy "Users can manage outfits in their own albums." on public.album_outfits for all
    using (auth.uid() = (select user_id from public.albums where id = album_id));

-- 7. Create trips table
create table public.trips (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null references auth.users on delete cascade,
    name text not null,
    destination text,
    start_date date,
    end_date date,
    notes text,
    plan jsonb, -- Storing the generated plan as JSONB
    created_at timestamptz not null default now()
);
alter table public.trips enable row level security;
create policy "Users can manage their own trips." on public.trips for all using (auth.uid() = user_id);

*/
// =================================================================================

const isPlaceholder =
    !PROJECT_ID ||
    !ANON_KEY ||
    PROJECT_ID.includes('SUPABASE_PROJECT_ID') ||
    ANON_KEY.includes('SUPABASE_ANON_KEY') ||
    ANON_KEY.length < 20;

// In test runs we rely on Vitest mocks and do NOT want
// configuration errors to crash the entire app or test suite.
const isTestEnv =
    typeof process !== 'undefined' &&
    typeof process.env !== 'undefined' &&
    process.env.NODE_ENV === 'test';

if (!supabaseUrl || !supabaseAnonKey) {
    if (!isTestEnv) {
        throw new Error('Supabase URL and Anon Key must be provided.');
    } else {
        // During tests we avoid throwing here so that modules which
        // import Supabase can still be evaluated while Vitest replaces
        // this module with the test mock in `src/test/mocks/supabaseClient.ts`.
        // eslint-disable-next-line no-console
        console.warn(
            'Supabase URL and Anon Key are not configured. Continuing in test environment without a real Supabase client.'
        );
    }
}

if (isPlaceholder && !ENABLE_DEV_BYPASS) {
    console.warn('--- SUPABASE IS NOT CONFIGURED ---');
    console.warn(
        'Authentication will not work. Please replace the placeholder values in `services/supabaseClient.ts` with your actual Supabase credentials, or enable the developer bypass.'
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export a flag to check if Supabase is configured
export const isSupabaseConfigured = !isPlaceholder;
