import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Image as ImageIcon, MessageCircle, MoreVertical, Send } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EmptyState } from '../components/common/EmptyState';
import { formatKES } from '../lib/format';
import { repositories } from '../repositories';
import { useAppState } from '../context/AppStateContext';
import type { InboxThread, Message } from '../types/domain/inbox';
import type { Product } from '../types/domain/product';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Conversation'>;

const getMsgDateString = (isoString?: string) => {
    if (!isoString) return 'mock-date';
    return isoString.split('T')[0];
};

const formatSeparatorDate = (isoString?: string) => {
    if (!isoString) return 'Today';
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
    }
};

const ConversationScreen: React.FC<Props> = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const { markInboxThreadAsRead } = useAppState();
    const { conversationId, name } = route.params;
    const [thread, setThread] = useState<InboxThread | null>(null);
    const [listing, setListing] = useState<Product | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [draft, setDraft] = useState('');

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const threads = await repositories.inbox.listThreads();
                const found = threads.find((t) => t.id === conversationId) ?? null;
                const [msgs, product] = await Promise.all([
                    repositories.messages.list(conversationId),
                    found?.listingProductId
                        ? repositories.products.getById(found.listingProductId)
                        : Promise.resolve(null),
                ]);
                if (!cancelled) {
                    setThread(found);
                    setMessages(msgs);
                    setListing(product);
                    void markInboxThreadAsRead(conversationId);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void load();
        return () => {
            cancelled = true;
        };
    }, [conversationId, markInboxThreadAsRead]);

    const send = async () => {
        if (!draft.trim()) return;
        const text = draft.trim();
        setDraft('');
        try {
            const newMsg = await repositories.messages.send(conversationId, text);
            setMessages((prev) => [...prev, newMsg]);
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };


    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator color={colors.accent.primary} />
            </View>
        );
    }

    if (!thread) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
                    <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
                        <ChevronLeft size={22} color={colors.text.onDark} strokeWidth={2.5} />
                    </Pressable>
                </View>
                <EmptyState
                    icon={MessageCircle}
                    title="Conversation not found"
                    description="This thread may have been removed"
                />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
                <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
                    <ChevronLeft size={22} color={colors.text.onDark} strokeWidth={2.5} />
                </Pressable>
                <Pressable
                    style={styles.headerInfo}
                    onPress={() =>
                        navigation.navigate('UserProfile', {
                            userId: thread.userId,
                        })
                    }
                >
                    {thread.avatarUrl ? (
                        <Image source={{ uri: thread.avatarUrl }} style={styles.headerAvatar} contentFit="cover" />
                    ) : (
                        <View style={styles.headerAvatar} />
                    )}
                    <View style={styles.flex}>
                        <Text style={styles.headerName}>{name}</Text>
                    </View>
                </Pressable>
                <Pressable style={styles.iconBtn}>
                    <MoreVertical size={20} color={colors.text.onDark} strokeWidth={2.5} />
                </Pressable>
            </View>

            {listing ? (
                <Pressable
                    style={styles.listingCard}
                    onPress={() => navigation.navigate('ProductDetail', { productId: listing.id })}
                >
                    <Image source={{ uri: listing.imageUrl }} style={styles.listingThumb} contentFit="cover" />
                    <View style={styles.flex}>
                        <Text style={styles.listingName} numberOfLines={1}>{listing.name}</Text>
                        <Text style={styles.listingPrice}>{formatKES(listing.price)}</Text>
                    </View>
                </Pressable>
            ) : null}

            <FlatList
                data={messages}
                keyExtractor={(m) => m.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <EmptyState
                        icon={MessageCircle}
                        title="No messages yet"
                        description="Send a message to start the conversation"
                    />
                }
                renderItem={({ item, index }) => {
                    const prevMsg = index > 0 ? messages[index - 1] : null;
                    const showDateSeparator = !prevMsg || getMsgDateString(prevMsg.createdAt) !== getMsgDateString(item.createdAt);
                    
                    return (
                        <View style={styles.messageRowContainer}>
                            {showDateSeparator && (
                                <View style={styles.dateSeparator}>
                                    <Text style={styles.dateSeparatorText}>
                                        {formatSeparatorDate(item.createdAt)}
                                    </Text>
                                </View>
                            )}
                            <View style={[styles.bubbleWrap, item.sent ? styles.alignEnd : styles.alignStart]}>
                                {item.sent ? (
                                    <LinearGradient
                                        colors={[colors.accent.primary, colors.accent.bright]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.bubbleSent}
                                    >
                                        <Text style={styles.sentText}>{item.text}</Text>
                                    </LinearGradient>
                                ) : (
                                    <View style={styles.bubbleReceived}>
                                        <Text style={styles.receivedText}>{item.text}</Text>
                                    </View>
                                )}
                                <Text style={[styles.time, item.sent ? styles.timeSent : styles.timeReceived]}>
                                    {item.time}
                                </Text>
                            </View>
                        </View>
                    );
                }}
            />

            <View style={[styles.inputRow, { paddingBottom: insets.bottom + spacing.sm }]}>
                <Pressable style={styles.attachBtn}>
                    <ImageIcon size={20} color={colors.text.onDark} strokeWidth={2.5} />
                </Pressable>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    placeholderTextColor={colors.text.onDarkSubtle}
                    value={draft}
                    onChangeText={setDraft}
                    onSubmitEditing={send}
                />
                <Pressable onPress={send} disabled={!draft.trim()}>
                    <LinearGradient
                        colors={[colors.accent.primary, colors.accent.bright]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.sendBtn, !draft.trim() && styles.sendDisabled]}
                    >
                        <Send size={18} color={colors.text.primary} strokeWidth={2.5} />
                    </LinearGradient>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    centered: { alignItems: 'center', justifyContent: 'center' },
    flex: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.dark,
        backgroundColor: 'rgba(0,0,0,0.9)',
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 2,
        borderColor: colors.border.dark,
    },
    headerName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 15,
        color: colors.text.onDark,
    },
    activeNow: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.accent.primary,
        marginTop: 1,
    },
    listingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        margin: spacing.page,
        marginBottom: 0,
        padding: spacing.md,
        borderRadius: radii.lg,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    listingThumb: { width: 56, height: 56, borderRadius: radii.md },
    listingName: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 14,
        color: colors.text.onDark,
    },
    listingPrice: {
        fontFamily: typography.fontFamily.black,
        fontSize: 16,
        color: colors.accent.primary,
        marginTop: 2,
    },
    list: { padding: spacing.page, gap: spacing.sm, flexGrow: 1 },
    bubbleWrap: { maxWidth: '80%', marginBottom: spacing.sm },
    alignEnd: { alignSelf: 'flex-end', alignItems: 'flex-end' },
    alignStart: { alignSelf: 'flex-start', alignItems: 'flex-start' },
    bubbleSent: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radii.xl,
    },
    bubbleReceived: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radii.xl,
        backgroundColor: colors.background.cardDark,
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    sentText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        lineHeight: 20,
        color: colors.text.primary,
    },
    receivedText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        lineHeight: 20,
        color: colors.text.onDark,
    },
    time: {
        fontFamily: typography.fontFamily.medium,
        fontSize: 10,
        marginTop: 4,
    },
    timeSent: { color: colors.text.onDarkSubtle },
    timeReceived: { color: colors.text.onDarkSubtle },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.page,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border.dark,
        backgroundColor: 'rgba(0,0,0,0.9)',
    },
    attachBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: colors.border.dark,
        borderRadius: radii.pill,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDark,
    },
    sendBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendDisabled: { opacity: 0.5 },
    messageRowContainer: {
        width: '100%',
    },
    dateSeparator: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: spacing.lg,
    },
    dateSeparatorText: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 10,
        color: colors.text.onDarkSubtle,
        backgroundColor: colors.background.cardDark,
        paddingHorizontal: spacing.md,
        paddingVertical: 4,
        borderRadius: radii.sm,
        borderWidth: 1,
        borderColor: colors.border.dark,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});

export default ConversationScreen;
