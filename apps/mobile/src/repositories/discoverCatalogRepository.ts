import type { Brand, Style } from '../types/domain/discover';
import type { Profile } from '../types/domain/profile';
import { mockBrands, getBrandById } from '../data/mock/brands';
import { mockStyles, getStyleById } from '../data/mock/styles';
import { mockUsers } from '../data/mock/profile';
import { apiGet } from '../api/apiClient';
import type { UserProfileDto } from '../../../../packages/contracts/src/auth';

const dtoToDiscoverProfile = (dto: UserProfileDto): Profile => {
    const name = dto.displayName ?? 'User';
    const initials =
        name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join('') || 'U';
    return {
        id: dto.id,
        name,
        handle: dto.handle ? `@${dto.handle.replace(/^@/, '')}` : '@user',
        initials,
        avatarUrl: dto.avatarUrl ?? undefined,
        bio: dto.bio ?? '',
        followers: dto.followerCount ?? 0,
        following: dto.followingCount ?? 0,
        listings: dto.listingCount ?? 0,
        rating: 0,
        verified: false,
    };
};

export type DiscoverCatalogRepository = {
    listProfiles: () => Promise<Profile[]>;
    listBrands: () => Promise<Brand[]>;
    listStyles: () => Promise<Style[]>;
    getBrand: (id: string) => Promise<Brand | null>;
    getStyle: (id: string) => Promise<Style | null>;
};

export const createEmptyDiscoverCatalogRepository = (): DiscoverCatalogRepository => ({
    listProfiles: async () => [],
    listBrands: async () => [],
    listStyles: async () => [],
    getBrand: async () => null,
    getStyle: async () => null,
});

export const createMockDiscoverCatalogRepository = (): DiscoverCatalogRepository => ({
    listProfiles: async () => [...mockUsers],
    listBrands: async () => [...mockBrands],
    listStyles: async () => [...mockStyles],
    getBrand: async (id) => getBrandById(id) ?? null,
    getStyle: async (id) => getStyleById(id) ?? null,
});

export const createApiDiscoverCatalogRepository = (): DiscoverCatalogRepository => ({
    listProfiles: async () => {
        const response = await apiGet<UserProfileDto[]>('/v1/api/profile/search');
        return (response.data ?? []).map(dtoToDiscoverProfile);
    },
    listBrands: async () => [],
    listStyles: async () => [],
    getBrand: async () => null,
    getStyle: async () => null,
});
