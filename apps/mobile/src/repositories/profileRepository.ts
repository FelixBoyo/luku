import type { ConnectionUserDto } from '../../../../packages/contracts/src/connections';
import type { UserProfileDto } from '../../../../packages/contracts/src/auth';
import { apiDelete, apiGet, apiPatch } from '../api/apiClient';
import { currentUserProfile } from '../data/mock/profile';
import type { Profile } from '../types/domain/profile';

export type EditableProfile = Profile & {
    email: string;
    location: string;
    website: string;
    stylePreferences: string[];
};

let profile: EditableProfile = {
    ...currentUserProfile,
    email: 'shannon@example.com',
    location: 'Nairobi, Kenya',
    website: 'shannonmartinez.com',
    stylePreferences: ['Minimalist', 'Sustainable', 'Vintage'],
};

const initialsFromName = (name: string): string =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('') || 'U';

export type ProfileRepository = {
    get: () => Promise<EditableProfile>;
    update: (patch: Partial<EditableProfile>) => Promise<EditableProfile>;
};

export const dtoToEditable = (dto: UserProfileDto): EditableProfile => {
    const name = dto.displayName ?? '';
    return {
        id: dto.id,
        name,
        initials: initialsFromName(name),
        handle: dto.handle ?? '',
        bio: dto.bio ?? '',
        avatarUrl: dto.avatarUrl ?? undefined,
        email: dto.email,
        location: dto.location ?? '',
        website: dto.website ?? '',
        stylePreferences: dto.stylePreferences ?? [],
        followers: dto.followerCount ?? 0,
        following: dto.followingCount ?? 0,
        listings: dto.listingCount ?? 0,
        rating: 0,
        verified: false,
    };
};

export const createMockProfileRepository = (): ProfileRepository => ({
    get: async () => ({ ...profile }),
    update: async (patch) => {
        const name = patch.name ?? profile.name;
        profile = {
            ...profile,
            ...patch,
            initials: patch.initials ?? initialsFromName(name),
        };
        return { ...profile };
    },
});

export const createApiProfileRepository = (): ProfileRepository => ({
    get: async () => {
        const response = await apiGet<UserProfileDto>('/v1/api/auth/me');
        return dtoToEditable(response.data);
    },
    update: async (patch) => {
        const response = await apiPatch<UserProfileDto>('/v1/api/profile', {
            displayName: patch.name,
            handle: patch.handle,
            bio: patch.bio,
            avatarUrl: patch.avatarUrl,
            location: patch.location,
            website: patch.website,
            stylePreferences: patch.stylePreferences,
        });
        return dtoToEditable(response.data);
    },
});

export const getProfileSync = (): EditableProfile => ({ ...profile });
