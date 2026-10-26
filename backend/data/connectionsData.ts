import type { ConnectionUserDto } from '../../packages/contracts/src/connections';
import { getSupabaseAdmin } from './supabaseAdmin';

type ProfileRow = {
    id: string;
    display_name: string | null;
    handle: string | null;
    avatar_url: string | null;
};

const toConnectionDto = (row: ProfileRow): ConnectionUserDto => ({
    id: row.id,
    displayName: row.display_name,
    handle: row.handle,
    avatarUrl: row.avatar_url,
});

const loadProfilesByIds = async (ids: string[]): Promise<ConnectionUserDto[]> => {
    if (ids.length === 0) return [];

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, handle, avatar_url')
        .in('id', ids);

    if (error || !data) {
        throw new Error(error?.message ?? 'Failed to load connections');
    }

    const byId = new Map(
        (data as ProfileRow[]).map((row) => [row.id, toConnectionDto(row)]),
    );
    return ids.map((id) => byId.get(id)).filter((row): row is ConnectionUserDto => row != null);
};

export const listFollowers = async (userId: string): Promise<ConnectionUserDto[]> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('following_id', userId);

    if (error) {
        throw new Error(error.message);
    }

    const ids = (data ?? []).map((row) => row.follower_id as string);
    return loadProfilesByIds(ids);
};

export const listFollowing = async (userId: string): Promise<ConnectionUserDto[]> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId);

    if (error) {
        throw new Error(error.message);
    }

    const ids = (data ?? []).map((row) => row.following_id as string);
    return loadProfilesByIds(ids);
};

export const followUser = async (followerId: string, followingId: string): Promise<void> => {
    if (followerId === followingId) {
        throw new Error('Cannot follow yourself');
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('user_follows').insert({
        follower_id: followerId,
        following_id: followingId,
    });

    if (error) {
        throw new Error(error.message);
    }
};

export const unfollowUser = async (followerId: string, followingId: string): Promise<void> => {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

    if (error) {
        throw new Error(error.message);
    }
};

export const blockUser = async (blockerId: string, blockedId: string): Promise<void> => {
    if (blockerId === blockedId) {
        throw new Error('Cannot block yourself');
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('user_blocks').insert({
        blocker_id: blockerId,
        blocked_id: blockedId,
    });

    if (error) {
        throw new Error(error.message);
    }
};

export const unblockUser = async (blockerId: string, blockedId: string): Promise<void> => {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId);

    if (error) {
        throw new Error(error.message);
    }
};

export const listBlocked = async (userId: string): Promise<ConnectionUserDto[]> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('user_blocks')
        .select('blocked_id')
        .eq('blocker_id', userId);

    if (error) {
        throw new Error(error.message);
    }

    const ids = (data ?? []).map((row) => row.blocked_id as string);
    return loadProfilesByIds(ids);
};
