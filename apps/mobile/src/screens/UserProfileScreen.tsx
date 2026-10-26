import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import {
    CheckCircle,
    MessageCircle,
    MoreVertical,
    Shirt,
    Star,
    Tag,
    User as UserIcon,
} from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ScreenHeader } from '../components/shell/ScreenHeader';
import { ProfileHeaderSkeleton } from '../components/skeletons';
import { EmptyState } from '../components/common/EmptyState';
import { repositories } from '../repositories';
import type { EditableProfile } from '../repositories/profileRepository';
import { useAuth } from '../context/AuthContext';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { colors, radii, spacing, typography } from '../theme/tokens';
import { formatHandleForDisplay } from '../lib/handle';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

const reviews = [
    { id: '1', reviewer: 'Marcus C.', rating: 5, comment: 'Great seller! Item exactly as described, fast shipping.', date: '2 days ago', item: 'Wool Coat' },
    { id: '2', reviewer: 'Sophia R.', rating: 5, comment: 'Lovely piece, well packaged. Would buy again!', date: '1 week ago', item: 'Cashmere Sweater' },
    { id: '3', reviewer: 'David K.', rating: 4, comment: 'Good quality, slightly different shade than photos.', date: '2 weeks ago', item: 'Silk Scarf' },
];

const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

const TABS = [
    { id: 'wardrobe', label: 'Wardrobe', icon: Shirt, count: 0 },
    { id: 'listings', label: 'Listings', icon: Tag, count: 0 },
    { id: 'reviews', label: 'Reviews', icon: Star, count: reviews.length },
    { id: 'about', label: 'About', icon: UserIcon, count: null },
] as const;

const UserProfileScreen: React.FC<Props> = ({ navigation, route }) => {
    const { showToast } = useToast();
    const { user: authUser } = useAuth();
    const userId = route.params.userId;
    const isOwnProfile = authUser?.id === userId;
    const [tab, setTab] = useState<(typeof TABS)[number]['id']>('wardrobe');
    const [profile, setProfile] = useState<EditableProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [following, setFollowing] = useState(false);
    const [followBusy, setFollowBusy] = useState(false);
    const [blockBusy, setBlockBusy] = useState(false);
    const [messageBusy, setMessageBusy] = useState(false);
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);

    const loadProfile = useCallback(async () => {
        setLoading(true);
        setLoadError(false);
        try {
            const [p, isFollowing] = await Promise.all([
                repositories.userProfile.getById(userId),
                repositories.connections.isFollowing(userId),
            ]);
            setProfile(p);
            setFollowing(isFollowing);
        } catch {
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        void loadProfile();
    }, [loadProfile]);

    const toggleFollow = async () => {
        setFollowBusy(true);
        try {
            if (following) {
                await repositories.connections.unfollow(userId);
                setFollowing(false);
                setProfile((prev) =>
                    prev
                        ? { ...prev, followers: Math.max(0, prev.followers - 1) }
                        : prev,
                );
            } else {
                await repositories.connections.follow(userId);
                setFollowing(true);
                setProfile((prev) =>
                    prev ? { ...prev, followers: prev.followers + 1 } : prev,
                );
            }
        } catch {
            showToast(following ? 'Unfollow failed' : 'Follow failed');
        } finally {
            setFollowBusy(false);
        }
    };

    const handleBlock = async () => {
        setShowBlockConfirm(false);
        setBlockBusy(true);
        try {
            await repositories.connections.block(userId);
            showToast('User blocked');
            navigation.goBack();
        } catch {
            showToast('Block failed');
        } finally {
            setBlockBusy(false);
        }
    };

    const handleMessage = async () => {
        setMessageBusy(true);
        try {
            const thread = await repositories.inbox.getOrCreateThreadWithUser(userId);
            navigation.navigate('Conversation', {
                conversationId: thread.id,
                name: formatHandleForDisplay(profile?.handle),
            });
        } catch {
            showToast('Could not start conversation');
        } finally {
            setMessageBusy(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Profile"
                onBack={() => navigation.goBack()}
                right={
                    !isOwnProfile && !loading && profile ? (
                        <Pressable
                            style={styles.headerMenuBtn}
                            onPress={() => setShowBlockConfirm(true)}
                            disabled={blockBusy}
                            accessibilityRole="button"
                            accessibilityLabel="Block user"
                        >
                            <MoreVertical color={colors.text.onDark} size={20} strokeWidth={2.5} />
                        </Pressable>
                    ) : undefined
                }
            />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {loading ? (
                    <ProfileHeaderSkeleton variant="user" />
                ) : loadError || !profile ? (
                    <EmptyState
                        title="Profile unavailable"
                        description="This user could not be loaded"
                    />
                ) : (
                <>
                <View style={styles.header}>
                    <View style={styles.headRow}>
                        {profile.avatarUrl ? (
                            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} contentFit="cover" />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <Text style={styles.avatarInitials}>{profile.initials}</Text>
                            </View>
                        )}
                        <View style={styles.flex}>
                            <View style={styles.nameRow}>
                                <Text style={styles.name}>
                                    {formatHandleForDisplay(profile.handle)}
                                </Text>
                                {profile.verified ? (
                                    <CheckCircle
                                        color={colors.accent.primary}
                                        size={16}
                                        strokeWidth={2.5}
                                    />
                                ) : null}
                            </View>
                            <View style={styles.statsRow}>
                                <Stat value={profile.followers} label="Followers" />
                                <View style={styles.statDivider} />
                                <Stat value={profile.following} label="Following" />
                                <View style={styles.statDivider} />
                                <Stat value={profile.listings} label="Listings" />
                            </View>
                        </View>
                    </View>

                    <Text style={styles.bio}>{profile.bio}</Text>

                    <View style={styles.ratingRow}>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                                key={i}
                                color="#F2B872"
                                fill={i <= Math.round(avgRating) ? '#F2B872' : 'transparent'}
                                size={14}
                                strokeWidth={2}
                            />
                        ))}
                        <Text style={styles.ratingValue}>{avgRating.toFixed(1)}</Text>
                        <Text style={styles.ratingCount}>({reviews.length} reviews)</Text>
                    </View>

                    <View style={styles.actionRow}>
                        <Pressable
                            onPress={() => void toggleFollow()}
                            disabled={followBusy}
                            style={[styles.followBtn, following ? styles.followingBtn : styles.notFollowingBtn]}
                        >
                            <Text style={[styles.followText, following ? styles.followingText : styles.notFollowingText]}>
                                {following ? 'Following' : 'Follow'}
                            </Text>
                        </Pressable>
                        <Pressable
                            style={styles.messageBtn}
                            disabled={messageBusy}
                            onPress={() => void handleMessage()}
                        >
                            <MessageCircle color={colors.text.onDark} size={16} strokeWidth={2.5} />
                            <Text style={styles.messageText}>Message</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.tabBar}>
                    {TABS.map((t) => {
                        const Icon = t.icon;
                        const active = tab === t.id;
                        return (
                            <Pressable key={t.id} style={styles.tab} onPress={() => setTab(t.id)}>
                                <Icon
                                    color={active ? colors.text.onDark : 'rgba(255,255,255,0.35)'}
                                    size={20}
                                    strokeWidth={2.5}
                                />
                                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                                    {t.label}
                                </Text>
                                {t.count !== null ? (
                                    <Text style={[styles.tabCount, active && styles.tabCountActive]}>
                                        {t.count}
                                    </Text>
                                ) : null}
                                {active ? <View style={styles.tabUnderline} /> : null}
                            </Pressable>
                        );
                    })}
                </View>

                <View style={styles.tabContent}>
                    {tab === 'wardrobe' && (
                        <EmptyState
                            icon={Shirt}
                            title="No wardrobe items"
                            description="This user's wardrobe is not public yet"
                        />
                    )}

                    {tab === 'listings' && (
                        <EmptyState
                            icon={Tag}
                            title="No listings"
                            description="This user has no active listings"
                        />
                    )}

                    {tab === 'reviews' && (
                        <View style={styles.reviewList}>
                            {reviews.map((r) => (
                                <View key={r.id} style={styles.reviewCard}>
                                    <View style={styles.reviewHead}>
                                        <Text style={styles.reviewName}>{r.reviewer}</Text>
                                        <Text style={styles.reviewDate}>{r.date}</Text>
                                    </View>
                                    <View style={styles.reviewStars}>
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <Star
                                                key={i}
                                                color="#F2B872"
                                                fill={i <= r.rating ? '#F2B872' : 'transparent'}
                                                size={12}
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </View>
                                    <Text style={styles.reviewComment}>{r.comment}</Text>
                                    <Text style={styles.reviewItem}>Re: {r.item}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {tab === 'about' && (
                        <View style={styles.aboutList}>
                            {[
                                { label: 'Location', value: profile.location || '—' },
                                { label: 'Website', value: profile.website || '—' },
                                { label: 'Listings', value: `${profile.listings} active` },
                            ].map((row) => (
                                <View key={row.label} style={styles.aboutRow}>
                                    <Text style={styles.aboutLabel}>{row.label}</Text>
                                    <Text style={styles.aboutValue}>{row.value}</Text>
                                </View>
                            ))}
                            <View style={styles.policyCard}>
                                <Text style={styles.policyTitle}>Seller Policies</Text>
                                {[
                                    'Items are authentic and as described',
                                    'Ships within 2 business days',
                                    'Returns accepted within 7 days',
                                    'Secure packaging on all orders',
                                ].map((p) => (
                                    <Text key={p} style={styles.policyText}>· {p}</Text>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
                </>
                )}
            </ScrollView>
            <ConfirmDialog
                visible={showBlockConfirm}
                title="Block user"
                description={`Block ${profile ? formatHandleForDisplay(profile.handle) : 'this user'}? They won't be able to interact with you.`}
                confirmLabel="Block"
                destructive
                onConfirm={() => void handleBlock()}
                onCancel={() => setShowBlockConfirm(false)}
            />
        </View>
    );
};

const Stat: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    scroll: { paddingBottom: spacing.xxl },
    flex: { flex: 1 },
    header: { paddingHorizontal: spacing.page, paddingTop: spacing.lg },
    headRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    avatarPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    avatarInitials: {
        fontFamily: typography.fontFamily.black,
        fontSize: 22,
        color: colors.text.onDark,
    },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    name: {
        fontFamily: typography.fontFamily.black,
        fontSize: 17,
        color: colors.text.onDark,
        marginBottom: spacing.sm,
    },
    handle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: spacing.md,
    },
    statsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    statDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.15)' },
    statValue: {
        fontFamily: typography.fontFamily.black,
        fontSize: 16,
        color: colors.text.onDark,
    },
    statLabel: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
    },
    bio: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: spacing.md,
    },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: spacing.lg },
    ratingValue: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.text.onDark,
        marginLeft: 4,
    },
    ratingCount: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
    },
    actionRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
    followBtn: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        alignItems: 'center',
    },
    notFollowingBtn: { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary },
    followingBtn: { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)' },
    followText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    notFollowingText: { color: colors.text.primary },
    followingText: { color: colors.text.onDark },
    messageBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    messageText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    headerMenuBtn: {
        width: 36,
        height: 36,
        borderRadius: radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: spacing.page,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.dark,
    },
    tab: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: spacing.md },
    tabLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: 'rgba(255,255,255,0.35)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    tabLabelActive: { color: colors.text.onDark },
    tabCount: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 9,
        color: 'rgba(255,255,255,0.25)',
    },
    tabCountActive: { color: colors.accent.primary },
    tabUnderline: {
        position: 'absolute',
        bottom: 0,
        left: 8,
        right: 8,
        height: 2,
        borderRadius: 1,
        backgroundColor: colors.accent.primary,
    },
    tabContent: { padding: spacing.page },
    masonry: { flexDirection: 'row', gap: spacing.md },
    masonryCol: { flex: 1, gap: spacing.md },
    wardrobeCard: {
        borderRadius: radii.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    catBadge: {
        position: 'absolute',
        top: spacing.md,
        left: spacing.md,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radii.md,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    catBadgeText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 9,
        color: colors.text.onDark,
        textTransform: 'uppercase',
    },
    wardrobeLabel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.md,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    wardrobeName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.text.onDark,
    },
    listingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    listingCard: {
        width: '47.5%',
        flexGrow: 1,
        aspectRatio: 3 / 4,
        borderRadius: radii.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    listingImg: { ...StyleSheet.absoluteFill },
    statusBadge: {
        position: 'absolute',
        top: spacing.md,
        left: spacing.md,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radii.md,
    },
    statusText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 9,
        color: colors.text.primary,
        textTransform: 'uppercase',
    },
    listingLabel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.md,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    listingName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.text.onDark,
    },
    listingPrice: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.accent.primary,
    },
    reviewList: { gap: spacing.md },
    reviewCard: {
        padding: spacing.lg,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    reviewHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    reviewName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
    },
    reviewDate: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
    },
    reviewStars: { flexDirection: 'row', gap: 2, marginBottom: spacing.sm },
    reviewComment: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 4,
    },
    reviewItem: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 10,
        color: 'rgba(255,255,255,0.35)',
    },
    aboutList: { gap: spacing.md },
    aboutRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    aboutLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    aboutValue: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
    },
    policyCard: {
        padding: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
        gap: spacing.sm,
    },
    policyTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    policyText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
    },
});

export default UserProfileScreen;
