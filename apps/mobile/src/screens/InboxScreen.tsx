import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { MessageSquare, MoreVertical, Search } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabScreenLayout } from '../components/shell/TabScreenLayout';
import {
    CollapsingChromeSlot,
    CompactSearchButton,
    compactTabChipStyles,
} from '../components/common/CollapsingChromeSlot';
import { EmptyState } from '../components/common/EmptyState';
import { InboxListSkeleton } from '../components/skeletons';
import { focusSearchFromCompact, useCollapsingChrome } from '../hooks/useCollapsingChrome';
import { repositories } from '../repositories';
import { useAppState } from '../context/AppStateContext';
import type { InboxThread } from '../types/domain/inbox';
import { useRootNavigation } from '../navigation/useRootNavigation';
import type { HomeStackParamList, MainTabParamList, RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, 'Inbox'>,
    CompositeScreenProps<
        BottomTabScreenProps<MainTabParamList>,
        NativeStackScreenProps<RootStackParamList>
    >
>;

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

const TABS = ['All', 'Unread', 'Archived'] as const;

const InboxScreen: React.FC<Props> = () => {
    const rootNav = useRootNavigation();
    const { refreshInboxUnread } = useAppState();
    const [tab, setTab] = useState<(typeof TABS)[number]>('All');
    const [query, setQuery] = useState('');
    const [allThreads, setAllThreads] = useState<InboxThread[]>([]);
    const [loadState, setLoadState] = useState<LoadState>('loading');
    const {
        chromeCollapsed,
        fullChromeOpacity,
        compactChromeOpacity,
        onScroll,
    } = useCollapsingChrome();
    const searchRef = useRef<TextInput>(null);
    const flatListRef = useRef<FlatList<InboxThread>>(null);

    const loadThreads = useCallback(async () => {
        setLoadState('loading');
        try {
            const threads = await repositories.inbox.listThreads();
            setAllThreads(threads);
            setLoadState(threads.length === 0 ? 'empty' : 'ready');
        } catch {
            setLoadState('error');
        }
    }, []);

    useEffect(() => {
        void loadThreads();
    }, [loadThreads]);

    useFocusEffect(
        useCallback(() => {
            void refreshInboxUnread();
            void loadThreads();
        }, [refreshInboxUnread, loadThreads]),
    );

    const threads = useMemo(() => {
        const q = query.trim().toLowerCase();
        return allThreads.filter((t) => {
            const matchesTab =
                tab === 'All' ? true : tab === 'Unread' ? t.unread : false;
            const matchesSearch =
                !q ||
                t.name.toLowerCase().includes(q) ||
                t.preview.toLowerCase().includes(q);
            return matchesTab && matchesSearch;
        });
    }, [allThreads, tab, query]);

    const renderThread = useCallback(
        ({ item }: { item: InboxThread }) => (
            <Pressable
                style={[styles.thread, item.unread && styles.threadUnread]}
                onPress={() =>
                    rootNav.navigate('Conversation', {
                        conversationId: item.id,
                        name: item.name,
                    })
                }
            >
                {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} style={styles.avatar} contentFit="cover" />
                ) : (
                    <View style={styles.avatar} />
                )}
                <View style={styles.threadBody}>
                    <View style={styles.threadHeader}>
                        <Text style={styles.threadName}>{item.name}</Text>
                        <Text style={styles.threadTime}>{item.time}</Text>
                    </View>
                    <Text
                        style={[styles.threadPreview, item.unread && styles.threadPreviewUnread]}
                        numberOfLines={1}
                    >
                        {item.preview}
                    </Text>
                </View>
                <Pressable style={styles.moreBtn} hitSlop={8}>
                    <MoreVertical size={16} color={colors.text.onDarkSubtle} strokeWidth={2.5} />
                </Pressable>
                {item.unread ? <View style={styles.unreadDot} /> : null}
            </Pressable>
        ),
        [rootNav],
    );

    const listEmpty = loadState === 'loading' ? (
        <InboxListSkeleton count={6} />
    ) : loadState === 'error' ? (
        <EmptyState
            title="Could not load messages"
            description="Check your connection and try again"
        />
    ) : (
        <EmptyState
            icon={MessageSquare}
            title="No messages yet"
            description={
                tab === 'Archived'
                    ? 'You have no archived conversations'
                    : query.trim()
                      ? 'Try a different search term'
                      : 'Your inbox is all caught up'
            }
        />
    );

    return (
        <TabScreenLayout>
            <View style={styles.container}>
                <CollapsingChromeSlot
                    collapsed={chromeCollapsed}
                    fullOpacity={fullChromeOpacity}
                    compactOpacity={compactChromeOpacity}
                    fullChrome={
                        <View style={styles.chromeInner}>
                            <View style={styles.searchWrap}>
                                <Search size={18} color={colors.text.onDarkSubtle} strokeWidth={2.5} />
                                <TextInput
                                    ref={searchRef}
                                    style={styles.searchInput}
                                    placeholder="Search messages..."
                                    placeholderTextColor={colors.text.onDarkSubtle}
                                    value={query}
                                    onChangeText={setQuery}
                                />
                            </View>
                            <View style={styles.tabs}>
                                {TABS.map((t) => {
                                    const active = tab === t;
                                    return (
                                        <Pressable
                                            key={t}
                                            style={[styles.tab, active && styles.tabActive]}
                                            onPress={() => setTab(t)}
                                        >
                                            <Text style={[styles.tabText, active && styles.tabTextActive]}>
                                                {t}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                    }
                    compactChrome={
                        <>
                            <CompactSearchButton
                                onPress={() => focusSearchFromCompact(flatListRef, searchRef)}
                            />
                            <View style={compactTabChipStyles.chip}>
                                <Text style={compactTabChipStyles.chipText}>{tab}</Text>
                            </View>
                        </>
                    }
                />

                {loadState === 'loading' ? (
                    <InboxListSkeleton count={6} />
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={threads}
                        keyExtractor={(item) => item.id}
                        renderItem={renderThread}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        onScroll={onScroll}
                        scrollEventThrottle={16}
                        ListEmptyComponent={listEmpty}
                    />
                )}
            </View>
        </TabScreenLayout>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    chromeInner: {
        paddingHorizontal: spacing.page,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.dark,
    },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: colors.border.dark,
        borderRadius: radii.pill,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
    },
    searchInput: {
        flex: 1,
        paddingVertical: spacing.md,
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDark,
    },
    tabs: { flexDirection: 'row', gap: spacing.sm },
    tab: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    tabActive: { backgroundColor: colors.text.onDark, borderColor: colors.text.onDark },
    tabText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    tabTextActive: { color: colors.text.primary },
    list: { padding: spacing.page, gap: spacing.sm, paddingBottom: spacing.xxl, flexGrow: 1 },
    thread: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        backgroundColor: colors.background.cardDark,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        marginBottom: spacing.sm,
    },
    threadUnread: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderColor: 'rgba(255,255,255,0.2)',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 2,
        borderColor: colors.border.dark,
    },
    threadBody: { flex: 1 },
    threadHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    threadName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
    },
    threadTime: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: colors.text.onDarkSubtle,
    },
    threadPreview: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        marginTop: 2,
    },
    threadPreviewUnread: { color: colors.text.onDark },
    moreBtn: { padding: 4 },
    unreadDot: {
        position: 'absolute',
        top: spacing.lg,
        right: spacing.lg,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.accent.primary,
    },
});

export default InboxScreen;
