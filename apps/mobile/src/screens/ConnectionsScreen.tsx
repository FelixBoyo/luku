import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CollectionHeader } from '../components/shell/CollectionHeader';
import { CollectionSearch } from '../components/common/CollectionSearch';
import { PillTabs } from '../components/common/PillTabs';
import { EmptyState } from '../components/common/EmptyState';
import { ConnectionRowSkeleton } from '../components/skeletons';
import type { ConnectionUser } from '../types/domain/connections';
import type { MeStackParamList } from '../navigation/types';
import { useRootNavigation } from '../navigation/useRootNavigation';
import { repositories } from '../repositories';
import { useToast } from '../context/ToastContext';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<MeStackParamList, 'Connections'>;
type Tab = 'followers' | 'following';
type LoadState = 'loading' | 'ready' | 'error';

const TABS = [
    { id: 'followers', label: 'Followers' },
    { id: 'following', label: 'Following' },
] as const;

const ConnectionsScreen: React.FC<Props> = ({ route, navigation }) => {
    const { showToast } = useToast();
    const rootNav = useRootNavigation();
    const [tab, setTab] = useState<Tab>(route.params?.initialTab ?? 'followers');
    const [query, setQuery] = useState('');
    const [followers, setFollowers] = useState<ConnectionUser[]>([]);
    const [following, setFollowing] = useState<ConnectionUser[]>([]);
    const [loadState, setLoadState] = useState<LoadState>('loading');

    const load = useCallback(async () => {
        setLoadState('loading');
        try {
            const [f1, f2] = await Promise.all([
                repositories.connections.listFollowers(''),
                repositories.connections.listFollowing(''),
            ]);
            setFollowers(f1);
            setFollowing(f2);
            setLoadState('ready');
        } catch {
            setLoadState('error');
            showToast('Could not load connections');
        }
    }, [showToast]);

    const q = query.trim().toLowerCase();
    const matchesQuery = (user: ConnectionUser) =>
        !q ||
        user.name.toLowerCase().includes(q) ||
        user.handle.toLowerCase().includes(q);

    const filteredFollowers = useMemo(
        () => followers.filter(matchesQuery),
        [followers, q],
    );
    const filteredFollowing = useMemo(
        () => following.filter(matchesQuery),
        [following, q],
    );

    const list = tab === 'followers' ? filteredFollowers : filteredFollowing;

    useEffect(() => {
        void load();
    }, [load]);

    const handleUnfollow = async (userId: string) => {
        try {
            await repositories.connections.unfollow(userId);
            await load();
        } catch {
            showToast('Unfollow failed');
        }
    };

    return (
        <View style={styles.container}>
            <CollectionHeader
                title="CONNECTIONS"
                subtitle={`${followers.length} followers · ${following.length} following`}
                onBack={() => navigation.goBack()}
            />
            <PillTabs tabs={[...TABS]} activeId={tab} onChange={(id) => setTab(id as Tab)} />
            <View style={styles.searchPad}>
                <CollectionSearch
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search people…"
                />
            </View>
            {loadState === 'loading' ? (
                <ConnectionRowSkeleton count={6} />
            ) : loadState === 'error' ? (
                <EmptyState
                    title="Could not load"
                    description="Pull to retry or check your connection"
                />
            ) : (
                <ScrollView contentContainerStyle={styles.scroll}>
                    {list.length === 0 ? (
                        <EmptyState
                            title="No results"
                            description={
                                query.trim()
                                    ? 'Try a different search term'
                                    : tab === 'followers'
                                      ? 'No followers yet'
                                      : 'Not following anyone yet'
                            }
                        />
                    ) : (
                        list.map((user) => (
                            <View key={user.id} style={styles.row}>
                                <Pressable
                                    style={styles.rowMain}
                                    onPress={() => rootNav.navigate('UserProfile', { userId: user.id })}
                                    accessibilityRole="button"
                                >
                                    {user.avatarUrl ? (
                                        <Image
                                            source={{ uri: user.avatarUrl }}
                                            style={styles.avatarImage}
                                            contentFit="cover"
                                        />
                                    ) : (
                                        <View style={styles.avatar}>
                                            <Text style={styles.avatarText}>{user.initials}</Text>
                                        </View>
                                    )}
                                    <View style={styles.flex}>
                                        <Text style={styles.name}>{user.handle}</Text>
                                    </View>
                                </Pressable>
                                {tab === 'following' ? (
                                    <Pressable
                                        style={styles.unfollowBtn}
                                        onPress={() => void handleUnfollow(user.id)}
                                    >
                                        <Text style={styles.unfollowText}>Unfollow</Text>
                                    </Pressable>
                                ) : null}
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    searchPad: { paddingHorizontal: spacing.page, marginBottom: spacing.md },
    scroll: { padding: spacing.page, paddingBottom: spacing.xxl, gap: spacing.sm },
    flex: { flex: 1 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    rowMain: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.text.onDark,
    },
    name: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 14,
        color: colors.text.onDark,
    },
    handle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
        marginTop: 2,
    },
    unfollowBtn: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: 'rgba(255,0,68,0.35)',
    },
    unfollowText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.status.error,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});

export default ConnectionsScreen;
