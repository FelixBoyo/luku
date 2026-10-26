import type { ProfilePatchRequest, UserProfileDto } from '../../packages/contracts/src/auth';
import { getProfileByUserId, searchPublicProfiles, updateProfileByUserId } from '../data/profileData';
import { listFollowers, listFollowing } from '../data/connectionsData';
import { getListingsCountBySeller } from './listingsService';

const withSocialCounts = async (profile: UserProfileDto): Promise<UserProfileDto> => {
    const [followers, following, listingCount] = await Promise.all([
        listFollowers(profile.id),
        listFollowing(profile.id),
        getListingsCountBySeller(profile.id),
    ]);
    return {
        ...profile,
        followerCount: followers.length,
        followingCount: following.length,
        listingCount,
    };
};

export const fetchProfile = async (userId: string): Promise<UserProfileDto | null> => {
    const profile = await getProfileByUserId(userId);
    return profile ? withSocialCounts(profile) : null;
};

export const fetchProfileById = async (userId: string): Promise<UserProfileDto | null> => {
    const profile = await getProfileByUserId(userId);
    return profile ? withSocialCounts(profile) : null;
};

export const searchProfiles = async (
    query: string,
    excludeUserId?: string,
): Promise<UserProfileDto[]> => {
    const rows = await searchPublicProfiles(query, 50, excludeUserId);
    return Promise.all(rows.map((p) => withSocialCounts(p)));
};

export const patchProfile = (
    userId: string,
    patch: ProfilePatchRequest,
): Promise<UserProfileDto> => updateProfileByUserId(userId, patch);
