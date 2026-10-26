import { mockInboxThreads } from '../data/mock/inbox';
import type { InboxThread } from '../types/domain/inbox';
import { apiGet, apiPost } from '../api/apiClient';
import type { InboxThreadDto } from '../../../../packages/contracts/src/inbox';

export type InboxRepository = {
    unreadCount: () => Promise<number>;
    listThreads: () => Promise<InboxThread[]>;
    markAsRead: (threadId: string) => Promise<void>;
    getOrCreateThreadWithUser: (userId: string) => Promise<InboxThread>;
};

const mapDtoToDomain = (dto: InboxThreadDto): InboxThread => ({
    id: dto.id,
    name: dto.name,
    userId: dto.userId,
    preview: dto.preview,
    time: dto.time,
    unread: dto.unread,
    avatarUrl: dto.avatarUrl,
    listingProductId: dto.listingProductId,
});

const stubThreadForUser = (userId: string): InboxThread => ({
    id: `mock-thread-${userId}`,
    name: '@user',
    userId,
    preview: '',
    time: '',
    unread: false,
});

export const createMockInboxRepository = (): InboxRepository => ({
    unreadCount: async () =>
        mockInboxThreads.filter((t) => t.unread).length,
    listThreads: async () => [...mockInboxThreads],
    markAsRead: async () => {},
    getOrCreateThreadWithUser: async (userId: string) => {
        const found = mockInboxThreads.find((t) => t.userId === userId);
        return found ?? stubThreadForUser(userId);
    },
});

export const createEmptyInboxRepository = (): InboxRepository => ({
    unreadCount: async () => 0,
    listThreads: async () => [],
    markAsRead: async () => {},
    getOrCreateThreadWithUser: async (userId: string) => stubThreadForUser(userId),
});

export const createApiInboxRepository = (): InboxRepository => ({
    unreadCount: async () => {
        const response = await apiGet<number>('/v1/api/inbox/unread-count');
        return response.data ?? 0;
    },
    listThreads: async () => {
        const response = await apiGet<InboxThreadDto[]>('/v1/api/inbox/threads');
        return (response.data ?? []).map(mapDtoToDomain);
    },
    markAsRead: async (threadId: string) => {
        await apiPost<null>(`/v1/api/inbox/threads/${threadId}/read`, {});
    },
    getOrCreateThreadWithUser: async (userId: string) => {
        const response = await apiPost<InboxThreadDto>(
            `/v1/api/inbox/threads/with/${encodeURIComponent(userId)}`,
            {},
        );
        if (!response.data) {
            throw new Error('Failed to start conversation');
        }
        return mapDtoToDomain(response.data);
    },
});
