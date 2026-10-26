import type { ProfilePatchRequest, UserProfileDto } from '../../packages/contracts/src/auth';
import { normalizeHandleInput } from '../lib/handleUtils';
import { getSupabaseAdmin } from './supabaseAdmin';

type ProfileRow = {
    id: string;
    email: string;
    display_name: string | null;
    handle: string | null;
    bio: string | null;
    avatar_url: string | null;
    location: string | null;
    website: string | null;
    style_preferences: string[] | null;
};

export const rowToProfileDto = (row: ProfileRow): UserProfileDto => ({
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    handle: row.handle,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    location: row.location,
    website: row.website,
    stylePreferences: row.style_preferences ?? [],
});

export const getProfileByUserId = async (userId: string): Promise<UserProfileDto | null> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error || !data) {
        return null;
    }

    return rowToProfileDto(data as ProfileRow);
};

export const getEmailByHandle = async (handle: string): Promise<string | null> => {
    const normalized = normalizeHandleInput(handle);
    if (!normalized) {
        return null;
    }
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .ilike('handle', normalized)
        .maybeSingle();

    if (error || !data?.email) {
        return null;
    }
    return String(data.email);
};

export const updateProfileByUserId = async (
    userId: string,
    patch: ProfilePatchRequest,
): Promise<UserProfileDto> => {
    const supabase = getSupabaseAdmin();
    const updates: Record<string, unknown> = {};

    if (patch.displayName !== undefined) updates.display_name = patch.displayName;
    if (patch.handle !== undefined) updates.handle = patch.handle;
    if (patch.bio !== undefined) updates.bio = patch.bio;
    if (patch.avatarUrl !== undefined) updates.avatar_url = patch.avatarUrl;
    if (patch.location !== undefined) updates.location = patch.location;
    if (patch.website !== undefined) updates.website = patch.website;
    if (patch.stylePreferences !== undefined) {
        updates.style_preferences = patch.stylePreferences;
    }

    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select('*')
        .single();

    if (error || !data) {
        if (error?.code === '23505' || /unique|duplicate/i.test(error?.message ?? '')) {
            throw new Error('Handle is already taken');
        }
        throw new Error(error?.message ?? 'Profile update failed');
    }

    return rowToProfileDto(data as ProfileRow);
};

export const searchPublicProfiles = async (
    query: string,
    limit = 50,
    excludeUserId?: string,
): Promise<UserProfileDto[]> => {
    const supabase = getSupabaseAdmin();
    const q = query.trim();
    let request = supabase.from('profiles').select('*').limit(limit);
    if (excludeUserId) {
        request = request.neq('id', excludeUserId);
    }
    if (q) {
        const pattern = `%${q.replace(/[%_]/g, '')}%`;
        request = request.or(`display_name.ilike.${pattern},handle.ilike.${pattern}`);
    }
    const { data, error } = await request;
    if (error || !data) {
        throw new Error(error?.message ?? 'Profile search failed');
    }
    return (data as ProfileRow[]).map(rowToProfileDto);
};
