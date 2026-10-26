import { describe, expect, it, vi, beforeEach } from 'vitest';
import { listThreads, getMessages, sendMessage, markAsRead, getUnreadCount } from './inboxService';
import { getSupabaseAdmin } from '../data/supabaseAdmin';

vi.mock('../data/supabaseAdmin', () => ({
    getSupabaseAdmin: vi.fn(),
}));

const createMockBuilder = (result: { data: any; error: any }) => {
    const builder: any = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        or: vi.fn(() => builder),
        in: vi.fn(() => builder),
        order: vi.fn(() => builder),
        maybeSingle: vi.fn(() => builder),
        single: vi.fn(() => builder),
        insert: vi.fn(() => builder),
        upsert: vi.fn(() => builder),
        then: (onfulfilled: any) => {
            return Promise.resolve(result).then(onfulfilled);
        },
    };
    return builder;
};

describe('inboxService', () => {
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSupabase = {
            from: vi.fn(),
        };
        vi.mocked(getSupabaseAdmin).mockReturnValue(mockSupabase);
    });

    describe('listThreads', () => {
        it('lists and formats inbox threads, mapping the correct participant profile and unread states', async () => {
            const dbThreads = [
                {
                    id: 'thread_1',
                    participant_one_id: 'user_123',
                    participant_two_id: 'user_other',
                    last_message_body: 'Hello there!',
                    last_message_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago
                    created_at: '2026-06-27T00:00:00Z',
                },
            ];

            const dbMessages = [
                {
                    id: 'msg_1',
                    thread_id: 'thread_1',
                    sender_id: 'user_other',
                    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
                },
            ];

            const dbReads = [
                {
                    thread_id: 'thread_1',
                    user_id: 'user_123',
                    last_read_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // Read 15 mins ago (so unread)
                },
            ];

            const dbProfiles = [
                {
                    id: 'user_other',
                    handle: 'johndoe',
                    avatar_url: 'john.png',
                },
            ];

            let fromCallCount = 0;
            mockSupabase.from.mockImplementation((table: string) => {
                fromCallCount++;
                if (table === 'inbox_threads') {
                    return createMockBuilder({ data: dbThreads, error: null });
                } else if (table === 'inbox_messages') {
                    return createMockBuilder({ data: dbMessages, error: null });
                } else if (table === 'inbox_thread_reads') {
                    return createMockBuilder({ data: dbReads, error: null });
                } else if (table === 'profiles') {
                    return createMockBuilder({ data: dbProfiles, error: null });
                }
            });

            const threads = await listThreads('user_123');

            expect(mockSupabase.from).toHaveBeenCalledWith('inbox_threads');
            expect(threads).toHaveLength(1);
            const thread = threads[0];
            expect(thread.id).toBe('thread_1');
            expect(thread.name).toBe('@johndoe');
            expect(thread.preview).toBe('Hello there!');
            expect(thread.unread).toBe(true);
            expect(thread.time).toBe('10m');
        });

        it('omits threads with no last_message_at from the list', async () => {
            const dbThreads = [
                {
                    id: 'thread_empty',
                    participant_one_id: 'user_123',
                    participant_two_id: 'user_ghost',
                    last_message_body: null,
                    last_message_at: null,
                    created_at: '2026-06-27T00:00:00Z',
                },
                {
                    id: 'thread_live',
                    participant_one_id: 'user_123',
                    participant_two_id: 'user_other',
                    last_message_body: 'Hey',
                    last_message_at: '2026-06-27T10:00:00Z',
                    created_at: '2026-06-27T00:00:00Z',
                },
            ];

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'inbox_threads') {
                    return createMockBuilder({ data: dbThreads, error: null });
                }
                if (table === 'inbox_messages') {
                    return createMockBuilder({ data: [], error: null });
                }
                if (table === 'inbox_thread_reads') {
                    return createMockBuilder({ data: [], error: null });
                }
                if (table === 'profiles') {
                    return createMockBuilder({
                        data: [{ id: 'user_other', handle: 'johndoe', avatar_url: null }],
                        error: null,
                    });
                }
            });

            const threads = await listThreads('user_123');

            expect(threads).toHaveLength(1);
            expect(threads[0].id).toBe('thread_live');
        });
    });

    describe('getMessages', () => {
        it('retrieves thread history if the user is a valid participant', async () => {
            const thread = {
                participant_one_id: 'user_123',
                participant_two_id: 'user_other',
            };

            const messages = [
                {
                    id: 'msg_1',
                    thread_id: 'thread_1',
                    sender_id: 'user_other',
                    body: 'Hello',
                    created_at: '2026-06-27T10:00:00.000Z',
                },
            ];

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'inbox_threads') {
                    return createMockBuilder({ data: thread, error: null });
                } else if (table === 'inbox_messages') {
                    return createMockBuilder({ data: messages, error: null });
                }
            });

            const result = await getMessages('user_123', 'thread_1');

            expect(result).toHaveLength(1);
            expect(result[0].text).toBe('Hello');
            expect(result[0].sent).toBe(false); // Sent by user_other, so sent = false
        });

        it('throws an unauthorized error if user is not a participant', async () => {
            const thread = {
                participant_one_id: 'user_other_1',
                participant_two_id: 'user_other_2',
            };

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'inbox_threads') {
                    return createMockBuilder({ data: thread, error: null });
                }
            });

            await expect(getMessages('user_123', 'thread_1')).rejects.toThrow('Unauthorized thread access');
        });
    });

    describe('sendMessage', () => {
        it('persists message and marks thread as read for the sender', async () => {
            const thread = {
                participant_one_id: 'user_123',
                participant_two_id: 'user_other',
            };

            const insertedMessage = {
                id: 'msg_new',
                thread_id: 'thread_1',
                sender_id: 'user_123',
                body: 'Hello back',
                created_at: '2026-06-27T10:05:00.000Z',
            };

            let fromCallCount = 0;
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'inbox_threads') {
                    return createMockBuilder({ data: thread, error: null });
                } else if (table === 'inbox_messages') {
                    return createMockBuilder({ data: insertedMessage, error: null });
                } else if (table === 'inbox_thread_reads') {
                    return createMockBuilder({ data: null, error: null });
                }
            });

            const result = await sendMessage('user_123', 'thread_1', 'Hello back');

            expect(result.text).toBe('Hello back');
            expect(result.sent).toBe(true);
            expect(mockSupabase.from).toHaveBeenCalledWith('inbox_thread_reads');
        });
    });

    describe('markAsRead', () => {
        it('upserts a read receipt for the thread', async () => {
            mockSupabase.from.mockReturnValue(createMockBuilder({ data: null, error: null }));

            await markAsRead('user_123', 'thread_1');

            expect(mockSupabase.from).toHaveBeenCalledWith('inbox_thread_reads');
        });
    });

    describe('getUnreadCount', () => {
        it('returns correct count of unread threads', async () => {
            const dbThreads = [
                {
                    id: 'thread_1',
                    participant_one_id: 'user_123',
                    participant_two_id: 'user_other',
                    last_message_body: 'Unread message',
                    last_message_at: new Date(Date.now() - 5 * 60000).toISOString(),
                },
                {
                    id: 'thread_2',
                    participant_one_id: 'user_123',
                    participant_two_id: 'user_another',
                    last_message_body: 'Read message',
                    last_message_at: new Date(Date.now() - 30 * 60000).toISOString(),
                },
            ];

            const dbMessages = [
                {
                    id: 'msg_1',
                    thread_id: 'thread_1',
                    sender_id: 'user_other',
                    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
                },
                {
                    id: 'msg_2',
                    thread_id: 'thread_2',
                    sender_id: 'user_another',
                    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
                },
            ];

            const dbReads = [
                {
                    thread_id: 'thread_2',
                    user_id: 'user_123',
                    last_read_at: new Date(Date.now() - 15 * 60000).toISOString(), // Read 15 mins ago, message was 30 mins ago (so read!)
                },
            ];

            const dbProfiles = [
                { id: 'user_other', display_name: 'Other' },
                { id: 'user_another', display_name: 'Another' },
            ];

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'inbox_threads') {
                    return createMockBuilder({ data: dbThreads, error: null });
                } else if (table === 'inbox_messages') {
                    return createMockBuilder({ data: dbMessages, error: null });
                } else if (table === 'inbox_thread_reads') {
                    return createMockBuilder({ data: dbReads, error: null });
                } else if (table === 'profiles') {
                    return createMockBuilder({ data: dbProfiles, error: null });
                }
            });

            const count = await getUnreadCount('user_123');

            expect(count).toBe(1); // Only thread_1 is unread
        });
    });
});
