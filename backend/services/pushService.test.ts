import { describe, expect, it, vi, beforeEach } from 'vitest';
import { registerPushToken, sendPushNotification } from './pushService';
import { getSupabaseAdmin } from '../data/supabaseAdmin';

vi.mock('../data/supabaseAdmin', () => ({
    getSupabaseAdmin: vi.fn(),
}));

vi.mock('expo-server-sdk', () => {
    class MockExpo {
        static isExpoPushToken = vi.fn((token) => token.startsWith('ExponentPushToken['));
        chunkPushNotifications = vi.fn((msgs) => [msgs]);
        sendPushNotificationsAsync = vi.fn().mockResolvedValue([{ status: 'ok', id: '123' }]);
    }

    return {
        Expo: MockExpo,
    };
});

// Since we use the default export of Expo internally (const expo = new Expo(...)),
// we can't easily assert on `expo.sendPushNotificationsAsync` directly without 
// some hacky mock manipulation. But we can test the token DB interactions.

describe('pushService', () => {
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();
        
        mockSupabase = {
            from: vi.fn().mockReturnThis(),
            upsert: vi.fn().mockResolvedValue({ error: null }),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ 
                data: [{ token: 'ExponentPushToken[123]' }], 
                error: null 
            }),
            delete: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ error: null }),
        };

        vi.mocked(getSupabaseAdmin).mockReturnValue(mockSupabase);
    });

    it('registers a valid token', async () => {
        await registerPushToken('user-1', 'ExponentPushToken[abc]');
        
        expect(mockSupabase.from).toHaveBeenCalledWith('push_tokens');
        expect(mockSupabase.upsert).toHaveBeenCalledWith(
            { user_id: 'user-1', token: 'ExponentPushToken[abc]' },
            { onConflict: 'user_id, token' }
        );
    });

    it('rejects an invalid token', async () => {
        await expect(registerPushToken('user-1', 'bad-token')).rejects.toThrow(/not a valid Expo push token/);
    });

    it('sends push notifications to all valid tokens', async () => {
        await sendPushNotification('user-1', 'Hello', 'World');
        
        expect(mockSupabase.from).toHaveBeenCalledWith('push_tokens');
        expect(mockSupabase.select).toHaveBeenCalledWith('token');
        expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-1');
        
        // delete.in shouldn't be called since all tickets are 'ok' (from the mock)
        expect(mockSupabase.delete).not.toHaveBeenCalled();
    });
});
