import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { getSupabaseAdmin } from '../data/supabaseAdmin';
import { safeLogger } from '../http/redact';

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

export const registerPushToken = async (userId: string, token: string): Promise<void> => {
    if (!Expo.isExpoPushToken(token)) {
        throw new Error(`Push token ${token} is not a valid Expo push token`);
    }

    const supabase = getSupabaseAdmin();
    // Insert token if it doesn't already exist for this user
    const { error } = await supabase
        .from('push_tokens')
        .upsert({ user_id: userId, token }, { onConflict: 'user_id, token' });

    if (error) {
        safeLogger.error('[PushService] Failed to register push token', { error, userId });
        throw new Error('Failed to save push token');
    }
};

export const sendPushNotification = async (userId: string, title: string, body: string, data?: any): Promise<void> => {
    const supabase = getSupabaseAdmin();
    
    // Fetch all tokens for the user
    const { data: tokens, error } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', userId);

    if (error) {
        safeLogger.error('[PushService] Failed to fetch push tokens', { error, userId });
        return;
    }

    if (!tokens || tokens.length === 0) {
        // User has no registered devices
        return;
    }

    const messages: ExpoPushMessage[] = [];
    for (const pushToken of tokens) {
        if (!Expo.isExpoPushToken(pushToken.token)) {
            continue;
        }

        messages.push({
            to: pushToken.token,
            sound: 'default',
            title,
            body,
            data,
        });
    }

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    // Send the chunks to the Expo push notification service
    for (const chunk of chunks) {
        try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        } catch (error) {
            safeLogger.error('[PushService] Error sending push notification chunk', { error });
        }
    }

    // Process tickets to clean up deregistered tokens
    const tokensToRemove: string[] = [];
    for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        if (ticket.status === 'error' && ticket.details && ticket.details.error === 'DeviceNotRegistered') {
            tokensToRemove.push(messages[i].to as string);
        }
    }

    if (tokensToRemove.length > 0) {
        const { error: deleteError } = await supabase
            .from('push_tokens')
            .delete()
            .in('token', tokensToRemove);
            
        if (deleteError) {
            safeLogger.error('[PushService] Failed to clean up deregistered tokens', { error: deleteError });
        } else {
            safeLogger.info('[PushService] Cleaned up deregistered tokens', { count: tokensToRemove.length });
        }
    }
};
