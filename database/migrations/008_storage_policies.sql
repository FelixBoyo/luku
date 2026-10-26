-- 008: Wardrobe image bucket + policies (Member 3 uploads)
-- Legacy buckets (product-images, user-profile-images, etc.) already exist on dev.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'wardrobe-images',
    'wardrobe-images',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update
set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Path convention: {user_id}/{wardrobe_item_id}/{filename}

drop policy if exists "Wardrobe images are publicly accessible" on storage.objects;
create policy "Wardrobe images are publicly accessible"
    on storage.objects for select
    using (bucket_id = 'wardrobe-images');

drop policy if exists "Users can upload wardrobe images" on storage.objects;
create policy "Users can upload wardrobe images"
    on storage.objects for insert
    with check (
        bucket_id = 'wardrobe-images'
        and auth.role() = 'authenticated'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

drop policy if exists "Users can update their wardrobe images" on storage.objects;
create policy "Users can update their wardrobe images"
    on storage.objects for update
    using (
        bucket_id = 'wardrobe-images'
        and auth.role() = 'authenticated'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

drop policy if exists "Users can delete their wardrobe images" on storage.objects;
create policy "Users can delete their wardrobe images"
    on storage.objects for delete
    using (
        bucket_id = 'wardrobe-images'
        and auth.role() = 'authenticated'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

-- Listing images reuse wardrobe folder or a dedicated listings subfolder
drop policy if exists "Users can upload listing images" on storage.objects;
create policy "Users can upload listing images"
    on storage.objects for insert
    with check (
        bucket_id = 'wardrobe-images'
        and auth.role() = 'authenticated'
        and (storage.foldername(name))[1] = auth.uid()::text
        and (storage.foldername(name))[2] = 'listings'
    );
