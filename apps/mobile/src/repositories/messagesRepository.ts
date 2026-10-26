import { mockMessages } from '../data/mock/inbox';
import type { Message } from '../types/domain/inbox';
import { apiGet, apiPost } from '../api/apiClient';
import type { InboxMessageDto, SendMessageRequest } from '../../../../packages/contracts/src/inbox';

export type MessagesRepository = {
    list: (threadId: string) => Promise<Message[]>;
    send: (threadId: string, text: string) => Promise<Message>;
};

const mapDtoToDomain = (dto: InboxMessageDto): Message => ({
    id: dto.id,
    text: dto.text,
    sent: dto.sent,
    time: dto.time,
    createdAt: dto.createdAt,
});

export const createMockMessagesRepository = (): MessagesRepository => ({
    list: async (threadId) => [...(mockMessages[threadId] ?? [])],
    send: async (threadId, text) => {
        const newMessage: Message = {
            id: `m-${Date.now()}`,
            text,
            sent: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        if (!mockMessages[threadId]) mockMessages[threadId] = [];
        mockMessages[threadId].push(newMessage);
        return newMessage;
    },
});

export const createEmptyMessagesRepository = (): MessagesRepository => ({
    list: async () => [],
    send: async () => {
        throw new Error('Not implemented');
    },
});

export const createApiMessagesRepository = (): MessagesRepository => ({
    list: async (threadId) => {
        const response = await apiGet<InboxMessageDto[]>(`/v1/api/inbox/threads/${threadId}/messages`);
        return (response.data ?? []).map(mapDtoToDomain);
    },
    send: async (threadId, text) => {
        const reqBody: SendMessageRequest = { text };
        const response = await apiPost<InboxMessageDto>(
            `/v1/api/inbox/threads/${threadId}/messages`,
            reqBody,
        );
        if (!response.data) {
            throw new Error('Failed to send message via API');
        }
        return mapDtoToDomain(response.data);
    },
});
