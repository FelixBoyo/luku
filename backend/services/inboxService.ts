import { getSupabaseAdmin } from '../data/supabaseAdmin';
import type { InboxThreadDto, InboxMessageDto } from '../../packages/contracts/src/inbox';
import { formatHandleForDisplay } from '../lib/handleUtils';

export const listThreads = async (userId: string): Promise<InboxThreadDto[]> => {
    const supabase = getSupabaseAdmin();

    // 1. Fetch threads where the user is participant one or participant two
    const { data: threads, error: threadsError } = await supabase
        .from('inbox_threads')
        .select('*')
        .or(`participant_one_id.eq.${userId},participant_two_id.eq.${userId}`);

    if (threadsError) throw new Error(threadsError.message);
    // get-or-create inserts a row with no messages when someone taps Message
    // on a profile. Keep that id for Conversation, but hide empty threads
    // from the list and unread badge until the first send.
    const activeThreads = (threads ?? []).filter(
        (t) => t.last_message_at != null || Boolean(t.last_message_body),
    );
    if (activeThreads.length === 0) return [];

    const threadIds = activeThreads.map((t) => t.id);

    // 2. Fetch last messages to determine who sent them and when
    const { data: messages, error: messagesError } = await supabase
        .from('inbox_messages')
        .select('id, thread_id, sender_id, created_at')
        .in('thread_id', threadIds)
        .order('created_at', { ascending: false });

    if (messagesError) throw new Error(messagesError.message);

    // 3. Fetch read receipts for this user
    const { data: reads, error: readsError } = await supabase
        .from('inbox_thread_reads')
        .select('*')
        .eq('user_id', userId)
        .in('thread_id', threadIds);

    if (readsError) throw new Error(readsError.message);

    // 4. Fetch user profiles for other participants
    const otherParticipantIds = activeThreads.map((t) =>
        t.participant_one_id === userId ? t.participant_two_id : t.participant_one_id,
    );

    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, handle, avatar_url')
        .in('id', otherParticipantIds);

    if (profilesError) throw new Error(profilesError.message);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]));
    const readMap = new Map(reads?.map((r) => [r.thread_id, r.last_read_at]));

    // Find the latest message for each thread
    const latestMessageMap = new Map<string, { sender_id: string; created_at: string }>();
    for (const msg of messages ?? []) {
        if (!latestMessageMap.has(msg.thread_id)) {
            latestMessageMap.set(msg.thread_id, {
                sender_id: msg.sender_id,
                created_at: msg.created_at,
            });
        }
    }

    return activeThreads.map((t) => {
        const otherId = t.participant_one_id === userId ? t.participant_two_id : t.participant_one_id;
        const profile = profileMap.get(otherId);
        const lastReadAt = readMap.get(t.id);
        const latestMsg = latestMessageMap.get(t.id);

        let unread = false;
        if (latestMsg && latestMsg.sender_id !== userId) {
            if (!lastReadAt) {
                unread = true;
            } else {
                unread = new Date(latestMsg.created_at) > new Date(lastReadAt);
            }
        }

        // Format time nicely
        let timeStr = '';
        if (t.last_message_at) {
            const date = new Date(t.last_message_at);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffMins < 60) {
                timeStr = diffMins <= 0 ? 'now' : `${diffMins}m`;
            } else if (diffHours < 24) {
                timeStr = `${diffHours}h`;
            } else {
                timeStr = `${diffDays}d`;
            }
        }

        return {
            id: String(t.id),
            name: formatHandleForDisplay(profile?.handle as string | null | undefined),
            userId: String(otherId),
            preview: String(t.last_message_body || ''),
            time: timeStr,
            unread,
            avatarUrl: profile?.avatar_url || undefined,
            listingProductId: t.product_id || undefined,
        };
    }).sort((a, b) => {
        // Sort threads by last message time or creation date descending
        const threadA = activeThreads.find((t) => t.id === a.id);
        const threadB = activeThreads.find((t) => t.id === b.id);
        const timeA = new Date(threadA?.last_message_at || threadA?.created_at || 0).getTime();
        const timeB = new Date(threadB?.last_message_at || threadB?.created_at || 0).getTime();
        return timeB - timeA;
    });
};

export const getOrCreateThreadWithUser = async (
    userId: string,
    otherUserId: string,
): Promise<InboxThreadDto> => {
    const supabase = getSupabaseAdmin();

    if (userId === otherUserId) {
        throw new Error('Cannot message yourself');
    }

    const { data: existing, error: existingError } = await supabase
        .from('inbox_threads')
        .select('*')
        .or(
            `and(participant_one_id.eq.${userId},participant_two_id.eq.${otherUserId}),and(participant_one_id.eq.${otherUserId},participant_two_id.eq.${userId})`,
        )
        .maybeSingle();

    if (existingError) throw new Error(existingError.message);

    let threadRow = existing;
    if (!threadRow) {
        const { data: inserted, error: insertError } = await supabase
            .from('inbox_threads')
            .insert({ participant_one_id: userId, participant_two_id: otherUserId })
            .select('*')
            .single();
        if (insertError) throw new Error(insertError.message);
        threadRow = inserted;
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('handle, avatar_url')
        .eq('id', otherUserId)
        .maybeSingle();

    return {
        id: String(threadRow.id),
        name: formatHandleForDisplay(profile?.handle as string | null | undefined),
        userId: otherUserId,
        preview: String(threadRow.last_message_body || ''),
        time: '',
        unread: false,
        avatarUrl: profile?.avatar_url || undefined,
        listingProductId: threadRow.product_id || undefined,
    };
};

export const getMessages = async (userId: string, threadId: string): Promise<InboxMessageDto[]> => {
    const supabase = getSupabaseAdmin();

    // Verify participation
    const { data: thread, error: threadError } = await supabase
        .from('inbox_threads')
        .select('participant_one_id, participant_two_id')
        .eq('id', threadId)
        .maybeSingle();

    if (threadError) throw new Error(threadError.message);
    if (!thread || (thread.participant_one_id !== userId && thread.participant_two_id !== userId)) {
        throw new Error('Unauthorized thread access');
    }

    const { data: messages, error: messagesError } = await supabase
        .from('inbox_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

    if (messagesError) throw new Error(messagesError.message);

    return (messages ?? []).map((m) => {
        const date = new Date(m.created_at);
        return {
            id: String(m.id),
            text: String(m.body),
            senderId: String(m.sender_id),
            sent: m.sender_id === userId,
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: m.created_at,
        };
    });
};

export const sendMessage = async (
    userId: string,
    threadId: string,
    text: string,
): Promise<InboxMessageDto> => {
    const supabase = getSupabaseAdmin();

    // Verify participation
    const { data: thread, error: threadError } = await supabase
        .from('inbox_threads')
        .select('participant_one_id, participant_two_id')
        .eq('id', threadId)
        .maybeSingle();

    if (threadError) throw new Error(threadError.message);
    if (!thread || (thread.participant_one_id !== userId && thread.participant_two_id !== userId)) {
        throw new Error('Unauthorized thread access');
    }

    const { data: message, error: messageError } = await supabase
        .from('inbox_messages')
        .insert({
            thread_id: threadId,
            sender_id: userId,
            body: text,
        })
        .select('*')
        .single();

    if (messageError) throw new Error(messageError.message);

    // Update read receipt for sender
    await markAsRead(userId, threadId);

    const date = new Date(message.created_at);
    return {
        id: String(message.id),
        text: String(message.body),
        senderId: String(message.sender_id),
        sent: true,
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: message.created_at,
    };
};

export const markAsRead = async (userId: string, threadId: string): Promise<void> => {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
        .from('inbox_thread_reads')
        .upsert({
            thread_id: threadId,
            user_id: userId,
            last_read_at: new Date().toISOString(),
        });

    if (error) throw new Error(error.message);
};

export const getUnreadCount = async (userId: string): Promise<number> => {
    const threads = await listThreads(userId);
    return threads.filter((t) => t.unread).length;
};
