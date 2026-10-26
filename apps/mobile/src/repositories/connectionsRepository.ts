import type { ConnectionUserDto } from '../../../../packages/contracts/src/connections';
import { formatHandleForDisplay } from '../lib/handle';
import { apiDelete, apiGet, apiPost } from '../api/apiClient';
import {
    initialFollowers,
    initialFollowing,
    type ConnectionUser,
} from '../data/mock/connections';

let followers: ConnectionUser[] = [...initialFollowers];
let following: ConnectionUser[] = [...initialFollowing];
let blocked: ConnectionUser[] = [];

const filterByQuery = (list: ConnectionUser[], query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
        (u) =>
            u.name.toLowerCase().includes(q) ||
            u.handle.toLowerCase().includes(q),
    );
};

const initialsFromName = (name: string): string =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('') || 'U';

const dtoToConnection = (dto: ConnectionUserDto): ConnectionUser => {
    const name = dto.displayName ?? 'User';
    return {
        id: dto.id,
        name,
        handle: formatHandleForDisplay(dto.handle),
        avatarUrl: dto.avatarUrl ?? undefined,
        initials: initialsFromName(name),
    };
};

export type ConnectionsRepository = {
    listFollowers: (query?: string) => Promise<ConnectionUser[]>;
    listFollowing: (query?: string) => Promise<ConnectionUser[]>;
    listBlocked: (query?: string) => Promise<ConnectionUser[]>;
    follow: (userId: string) => Promise<void>;
    unfollow: (userId: string) => Promise<void>;
    block: (userId: string) => Promise<void>;
    unblock: (userId: string) => Promise<void>;
    isFollowing: (userId: string) => Promise<boolean>;
};

export const createMockConnectionsRepository = (): ConnectionsRepository => ({
    listFollowers: async (query = '') => filterByQuery(followers, query),
    listFollowing: async (query = '') => filterByQuery(following, query),
    listBlocked: async (query = '') => filterByQuery(blocked, query),
    follow: async (userId) => {
        if (!following.some((u) => u.id === userId)) {
            const user = followers.find((u) => u.id === userId) ?? {
                id: userId,
                name: 'User',
                handle: '@user',
                initials: 'U',
            };
            following = [...following, user];
        }
    },
    unfollow: async (userId) => {
        following = following.filter((u) => u.id !== userId);
    },
    block: async (userId) => {
        const user = [...followers, ...following].find((u) => u.id === userId);
        if (user && !blocked.some((u) => u.id === userId)) {
            blocked = [...blocked, user];
        }
        following = following.filter((u) => u.id !== userId);
    },
    unblock: async (userId) => {
        blocked = blocked.filter((u) => u.id !== userId);
    },
    isFollowing: async (userId) => following.some((u) => u.id === userId),
});

export const createApiConnectionsRepository = (): ConnectionsRepository => ({
    listFollowers: async (query = '') => {
        const response = await apiGet<ConnectionUserDto[]>('/v1/api/connections/followers');
        const list = (response.data ?? []).map(dtoToConnection);
        return filterByQuery(list, query);
    },
    listFollowing: async (query = '') => {
        const response = await apiGet<ConnectionUserDto[]>('/v1/api/connections/following');
        const list = (response.data ?? []).map(dtoToConnection);
        return filterByQuery(list, query);
    },
    listBlocked: async (query = '') => {
        const response = await apiGet<ConnectionUserDto[]>('/v1/api/connections/blocked');
        const list = (response.data ?? []).map(dtoToConnection);
        return filterByQuery(list, query);
    },
    follow: async (userId) => {
        await apiPost<null>('/v1/api/connections/follow', { userId });
    },
    unfollow: async (userId) => {
        await apiDelete<null>(`/v1/api/connections/follow/${userId}`);
    },
    block: async (userId) => {
        await apiPost<null>('/v1/api/connections/block', { userId });
    },
    unblock: async (userId) => {
        await apiDelete<null>(`/v1/api/connections/block/${userId}`);
    },
    isFollowing: async (userId) => {
        const response = await apiGet<ConnectionUserDto[]>('/v1/api/connections/following');
        return (response.data ?? []).some((u) => u.id === userId);
    },
});
