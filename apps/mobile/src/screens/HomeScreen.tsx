import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Bookmark,
    Camera,
    ChevronDown,
    Heart,
    RefreshCw,
    Sparkles,
} from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabScreenLayout } from '../components/shell/TabScreenLayout';
import { ProductCard } from '../components/marketplace/ProductCard';
import { SoldOutOverlay, SOLD_OUT_IMAGE_OPACITY } from '../components/marketplace/SoldOutOverlay';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { RefineYourPicksCard } from '../components/home/RefineYourPicksCard';
import { ProductGridSkeleton } from '../components/skeletons';
import { formatKES } from '../lib/format';
import { firstInStock, isSoldOut } from '../lib/stock';
import { SHOW_REFINE_PICKS } from '../lib/config';
import { useActiveProducts } from '../hooks/useProducts';
import { AppRefreshControl, useRefresh } from '../components/common/AppRefreshControl';
import { useAppState } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';
import { useRootNavigation } from '../navigation/useRootNavigation';
import { repositories } from '../repositories';
import type { OutfitOfDay } from '../types/domain/home';
import type { HomeStackParamList, MainTabParamList, RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, 'HomeMain'>,
    CompositeScreenProps<
        BottomTabScreenProps<MainTabParamList>,
        NativeStackScreenProps<RootStackParamList>
    >
>;

const { width } = Dimensions.get('window');

const HomeScreen: React.FC<Props> = () => {
    const rootNav = useRootNavigation();
    const { products, loading: productsLoading, retry } = useActiveProducts();
    const {
        toggleWishlist,
        isWishlisted,
        wardrobeItems,
        saveInspiration,
    } = useAppState();
    const { user } = useAuth();
    const [ootdList, setOotdList] = useState<OutfitOfDay[]>([]);
    const [ootdIndex, setOotdIndex] = useState(0);
    const [liked, setLiked] = useState(false);

    const loadOotd = useCallback(
        () => repositories.home.listOutfitsOfDay().then(setOotdList),
        [],
    );

    useEffect(() => {
        void loadOotd();
    }, [loadOotd]);

    // Both feeds refresh together: a pull that only reloaded one would leave the
    // hero and the rails describing different snapshots of the catalogue.
    const refreshAll = useCallback(
        () => Promise.all([retry(), loadOotd()]),
        [retry, loadOotd],
    );
    const { refreshing, onRefresh } = useRefresh(refreshAll);

    const showOotd = ootdList.length > 0;
    const ootd = showOotd ? ootdList[ootdIndex % ootdList.length] : null;

    useEffect(() => {
        if (!ootd) {
            setLiked(false);
            return;
        }
        setLiked(false);
    }, [ootdIndex, ootd]);

    const hero = firstInStock(products);
    const rail = products.filter((p) => p.isTrending).slice(0, 6);
    const trending = products.filter((p) => p.isTrending);
    const moreForYou = products.slice(3, 7);

    const bounce = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(bounce, {
                    toValue: 6,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(bounce, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [bounce]);

    const openProduct = (id: string) =>
        rootNav.navigate('ProductDetail', { productId: id });

    return (
        <TabScreenLayout>
            <ScrollView
                showsVerticalScrollIndicator={false}
               
            >
                {showOotd && ootd ? (
                    <View style={styles.section}>
                        <Card variant="dark" padding="compact">
                            <Text style={styles.ootdLabel}>Outfit of the Day</Text>
                            <Text style={styles.ootdName}>{ootd.name}</Text>
                            <Text style={styles.ootdMeta}>
                                {ootd.occasion} · {ootd.temperature}
                            </Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.ootdScroll}
                            >
                                {ootd.items.map((piece) => {
                                    const item = wardrobeItems.find(
                                        (w) => w.id === piece.wardrobeItemId,
                                    );
                                    const imageUrl = item?.imageUrl ?? piece.imageUrl;
                                    const name = item?.name ?? piece.name;
                                    return (
                                        <Pressable
                                            key={piece.wardrobeItemId}
                                            style={styles.ootdItem}
                                            onPress={() => {
                                                if (item) {
                                                    rootNav.navigate('WardrobeItemDetail', {
                                                        itemId: piece.wardrobeItemId,
                                                    });
                                                }
                                            }}
                                        >
                                            <Image
                                                source={{ uri: imageUrl }}
                                                style={styles.ootdImage}
                                                contentFit="cover"
                                            />
                                            <LinearGradient
                                                colors={['transparent', 'rgba(0,0,0,0.7)']}
                                                style={styles.ootdGrad}
                                            />
                                            <Text style={styles.ootdItemText} numberOfLines={1}>
                                                {name}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                            <View style={styles.ootdActions}>
                                <Pressable
                                    style={[styles.ootdBtn, liked && styles.ootdBtnActive]}
                                    onPress={async () => {
                                        if (liked || !ootd) return;
                                        await saveInspiration({
                                            name: ootd.name,
                                            occasion: ootd.occasion,
                                            coverImageUrl: ootd.imageUrl,
                                            pieces: ootd.items.map((i) => ({
                                                type: 'wardrobe' as const,
                                                id: i.wardrobeItemId,
                                            })),
                                        });
                                        setLiked(true);
                                    }}
                                >
                                    <Heart
                                        size={16}
                                        color={liked ? colors.accent.warm : colors.text.onDark}
                                        fill={liked ? colors.accent.warm : 'transparent'}
                                    />
                                    <Text style={styles.ootdBtnText}>Save</Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.ootdBtn, styles.tryOnBtn]}
                                    onPress={() =>
                                        rootNav.navigate('VirtualTryOn', {
                                            source: 'ootd',
                                            outfit: {
                                                name: ootd.name,
                                                imageUrl: ootd.imageUrl,
                                                wardrobeItemIds: ootd.items.map((i) => i.wardrobeItemId),
                                            },
                                        })
                                    }
                                >
                                    <Camera size={16} color={colors.accent.tryOn} />
                                    <Text style={[styles.ootdBtnText, { color: colors.accent.tryOn }]}>
                                        Try On
                                    </Text>
                                </Pressable>
                                <Pressable
                                    style={styles.ootdBtn}
                                    onPress={() =>
                                        setOotdIndex((i) => (i + 1) % ootdList.length)
                                    }
                                >
                                    <RefreshCw size={16} color={colors.text.onDarkMuted} />
                                    <Text style={styles.ootdBtnText}>New</Text>
                                </Pressable>
                            </View>
                        </Card>
                    </View>
                ) : null}

                <View style={styles.scrollHint}>
                    <Text style={styles.scrollHintText}>Scroll for more</Text>
                    <Animated.View style={{ transform: [{ translateY: bounce }] }}>
                        <ChevronDown size={16} color="rgba(255,255,255,0.25)" />
                    </Animated.View>
                </View>

                {SHOW_REFINE_PICKS ? (
                    <RefineYourPicksCard
                        onUpdatePreferences={() =>
                            rootNav.navigate('Onboarding', { mode: 'preferences' })
                        }
                    />
                ) : null}

                {productsLoading ? (
                    <ProductGridSkeleton count={6} />
                ) : products.length === 0 ? (
                    <EmptyState
                        icon={Sparkles}
                        title="No products yet"
                        description="Check back soon for curated picks"
                    />
                ) : (
                    <>
                        <View style={styles.section}>
                            <View style={styles.rowBetween}>
                                <View style={styles.headerRow}>
                                    <Sparkles size={22} color={colors.accent.primary} />
                                    <Text style={styles.sectionTitle}>PICKED FOR YOU</Text>
                                </View>
                                <Pressable onPress={() => rootNav.navigate('AIRecommendations')}>
                                    <Text style={styles.seeAll}>See all</Text>
                                </Pressable>
                            </View>
                            <Text style={styles.sectionDesc}>
                                AI-curated recommendations based on your style and wardrobe
                            </Text>
                        </View>

                        {hero ? (
                            <View style={styles.hero}>
                                {/* Product image and image tap */}
                                <Pressable
                                    style={StyleSheet.absoluteFill}
                                    onPress={() => openProduct(hero.id)}
                                    accessibilityLabel={hero.name}
                                >
                                    <Image
                                        source={{ uri: hero.imageUrl }}
                                        style={[
                                            styles.heroImage,
                                            isSoldOut(hero) && {
                                                opacity: SOLD_OUT_IMAGE_OPACITY,
                                            },
                                        ]}
                                        contentFit="cover"
                                    />

                                    <LinearGradient
                                        colors={['transparent', 'rgba(0,0,0,0.9)']}
                                        style={styles.heroGrad}
                                    />

                                    {isSoldOut(hero) ? <SoldOutOverlay /> : null}

                                    {hero.aiMatch && !isSoldOut(hero) ? (
                                        <View style={styles.heroMatch}>
                                            <Sparkles size={14} color={colors.text.primary} />
                                            <Text style={styles.heroMatchText}>
                                                {hero.aiMatch}% Match
                                            </Text>
                                        </View>
                                    ) : null}
                                </Pressable>

                                {/* Product details and Try On button */}
                                <View style={styles.heroInfo}>
                                    <Text style={styles.heroBrand}>{hero.brand}</Text>
                                    <Text style={styles.heroName}>{hero.name}</Text>

                                    <Text style={styles.heroReason}>
                                        Complements your earth-tone wardrobe
                                    </Text>

                                    <Text style={styles.heroPrice}>
                                        {formatKES(hero.price)}
                                    </Text>

                                    {hero.tryOnAvailable && !isSoldOut(hero) ? (
                                        <Pressable
                                            style={styles.heroTryOnButton}
                                            onPress={() =>
                                                rootNav.navigate('VirtualTryOn', {
                                                    source: 'marketplace',
                                                    listingId: hero.id,
                                                })
                                            }
                                        >
                                            <Camera size={16} color={colors.text.primary} />
                                            <Text style={styles.heroTryOnText}>Try On</Text>
                                        </Pressable>
                                    ) : null}
                                </View>
                            </View>
                        ) : null}
                        <View style={styles.section}>
                            <View style={styles.rowBetween}>
                                <Text style={styles.sectionTitleSm}>TRENDING NOW</Text>
                                <Pressable onPress={() => rootNav.navigate('Trending')}>
                                    <Text style={styles.seeAll}>See all</Text>
                                </Pressable>
                            </View>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.trendingScroll}
                                decelerationRate="fast"
                            >
                                {rail.map((item) => (
                                    <ProductCard
                                        key={item.id}
                                        product={item}
                                        variant="rail"
                                        onPress={() => openProduct(item.id)}
                                        onTryOn={() =>
                                            rootNav.navigate('VirtualTryOn', {
                                                source: 'marketplace',
                                                listingId: item.id,
                                            })
                                        }
                                    />
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.section}>
                            <View style={styles.rowBetween}>
                                <Text style={styles.sectionTitleSm}>YOU MIGHT ALSO LIKE</Text>
                            </View>
                            <Text style={styles.sectionDescSm}>Based on items in your wardrobe</Text>
                            <View style={styles.grid}>
                                {trending.map((item) => (
                                    <View key={item.id} style={styles.gridItem}>
                                        <ProductCard
                                            key={item.id}
                                            product={item}
                                            variant="rail"
                                            onPress={() => openProduct(item.id)}
                                            onTryOn={() =>
                                                rootNav.navigate('VirtualTryOn', {
                                                    source: 'marketplace',
                                                    listingId: item.id,
                                                })
                                            }
                                        />
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <View style={styles.rowBetween}>
                                <Text style={styles.sectionTitleSm}>MORE FOR YOU</Text>
                            </View>
                            <View style={styles.moreList}>
                                {moreForYou.map((item) => {
                                    const saved = isWishlisted(item.id);
                                    const soldOut = isSoldOut(item);
                                    const isOwn = Boolean(user?.id && item.seller.id === user.id);
                                    return (
                                        <View key={item.id} style={styles.moreRow}>
                                            <Pressable
                                                style={styles.moreRowTap}
                                                onPress={() => openProduct(item.id)}
                                                accessibilityLabel={
                                                    soldOut
                                                        ? `${item.name}, sold out`
                                                        : isOwn
                                                          ? `${item.name}, yours`
                                                          : item.name
                                                }
                                            >
                                                <View style={styles.moreThumbWrap}>
                                                    <Image
                                                        source={{ uri: item.imageUrl }}
                                                        style={[
                                                            styles.moreThumb,
                                                            soldOut && { opacity: SOLD_OUT_IMAGE_OPACITY },
                                                        ]}
                                                        contentFit="cover"
                                                    />
                                                    {soldOut ? <SoldOutOverlay /> : null}
                                                {isOwn ? (
                                                    <View
                                                        style={[
                                                            styles.moreYours,
                                                            soldOut ? styles.moreYoursRight : styles.moreYoursLeft,
                                                        ]}
                                                    >
                                                        <Text style={styles.moreYoursText}>YOURS</Text>
                                                    </View>
                                                ) : null}
                                                </View>
                                                <View style={[styles.moreInfo, soldOut && { opacity: 0.5 }]}>
                                                    <Text style={styles.moreName} numberOfLines={1}>
                                                        {item.name}
                                                    </Text>
                                                    <Text style={styles.moreBrand} numberOfLines={1}>
                                                        {item.brand}
                                                    </Text>
                                                    <Text style={styles.morePrice}>{formatKES(item.price)}</Text>
                                                    {item.tryOnAvailable && !soldOut ? (
                                                    <Pressable
                                                            onPress={() =>
                                                                rootNav.navigate('VirtualTryOn', {
                                                                    source: 'marketplace',
                                                                    listingId: item.id,
                                                                })
                                                            }
                                                            style={styles.moreTryOnButton}
                                                        >
                                                            <Camera size={13} color={colors.accent.tryOn} />
                                                            <Text style={styles.moreTryOnText}>Try On</Text>
                                                        </Pressable>
                                                    ) : null}
                                                </View>
                                                {item.aiMatch && !soldOut ? (
                                                    <View style={styles.moreMatch}>
                                                        <Sparkles size={10} color={colors.text.primary} strokeWidth={3} />
                                                        <Text style={styles.moreMatchText}>{item.aiMatch}%</Text>
                                                    </View>
                                                ) : null}
                                            </Pressable>
                                            <Pressable
                                                style={styles.moreBookmark}
                                                onPress={() => toggleWishlist(item.id)}
                                            >
                                                <Bookmark
                                                    size={18}
                                                    color={saved ? colors.accent.primary : colors.text.onDarkMuted}
                                                    fill={saved ? colors.accent.primary : 'transparent'}
                                                    strokeWidth={2.5}
                                                />
                                            </Pressable>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    </>
                )}

            </ScrollView>
        </TabScreenLayout>
    );
};

const styles = StyleSheet.create({
    section: { paddingHorizontal: spacing.page, marginBottom: spacing.lg },
    ootdLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDarkSubtle,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    ootdName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 16,
        color: colors.text.onDark,
        marginTop: 4,
    },
    ootdMeta: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkSubtle,
    },
    ootdScroll: {
        gap: spacing.sm,
        marginTop: spacing.lg,
        marginBottom: spacing.md,
        paddingRight: spacing.md,
    },
    ootdItem: {
        width: 130,
        aspectRatio: 1,
        borderRadius: radii.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    ootdImage: { width: '100%', height: '100%' },
    ootdGrad: { ...StyleSheet.absoluteFill },
    ootdItemText: {
        position: 'absolute',
        bottom: 4,
        left: 4,
        right: 4,
        fontFamily: typography.fontFamily.bold,
        fontSize: 8,
        color: colors.text.onDark,
    },
    ootdActions: { flexDirection: 'row', gap: spacing.sm },
    ootdBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    ootdBtnActive: {
        borderColor: 'rgba(242,184,114,0.4)',
        backgroundColor: 'rgba(242,184,114,0.15)',
    },
    tryOnBtn: {
        borderColor: 'rgba(138,72,205,0.3)',
        backgroundColor: 'rgba(138,72,205,0.1)',
    },
    ootdBtnText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
        textTransform: 'uppercase',
    },
    scrollHint: { alignItems: 'center', gap: 4, marginBottom: spacing.md },
    scrollHintText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 9,
        color: 'rgba(255,255,255,0.25)',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    sectionTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 22,
        color: colors.text.onDark,
        letterSpacing: -0.5,
    },
    sectionTitleSm: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
        letterSpacing: 0.5,
    },
    sectionDesc: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        marginTop: spacing.sm,
    },
    sectionDescSm: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
        marginBottom: spacing.md,
    },
    hero: { height: 420, marginBottom: spacing.xl, overflow: 'hidden' },
    heroImage: { width: '100%', height: '100%' },
    heroGrad: { ...StyleSheet.absoluteFill },
    heroMatch: {
        position: 'absolute',
        top: 16,
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.accent.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radii.pill,
    },
    heroMatchText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.text.primary,
    },
    heroInfo: { position: 'absolute', bottom: 24, left: spacing.page, right: spacing.page },
    heroBrand: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.accent.primary,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    heroName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 28,
        color: colors.text.onDark,
        marginTop: 4,
    },
    heroReason: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 6,
    },
    heroPrice: {
        fontFamily: typography.fontFamily.black,
        fontSize: 18,
        color: colors.text.onDark,
        marginTop: 4,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    seeAll: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.accent.primary,
        textTransform: 'uppercase',
    },
    trendingScroll: {
        paddingRight: spacing.page,
        gap: spacing.md,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    gridItem: { width: (width - spacing.page * 2 - spacing.md) / 2 },
    moreList: { gap: spacing.md },
    moreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.04)',
        overflow: 'hidden',
    },
    moreRowTap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.sm,
    },
    moreThumbWrap: {
        width: 64,
        height: 64,
        borderRadius: radii.md,
        overflow: 'hidden',
        position: 'relative',
    },
    moreThumb: { width: '100%', height: '100%' },
    moreYours: {
        position: 'absolute',
        top: 4,
        backgroundColor: colors.background.shell,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: radii.sm,
    },
    moreYoursLeft: { left: 4 },
    moreYoursRight: { right: 4 },
    moreYoursText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 8,
        letterSpacing: 0.4,
        color: colors.text.onDark,
    },
    moreInfo: { flex: 1 },
    moreName: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 14,
        color: colors.text.onDark,
    },
    moreBrand: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
    },
    morePrice: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.accent.primary,
        marginTop: 2,
    },
    moreMatch: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: colors.accent.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radii.pill,
    },
    moreMatchText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.primary,
    },
    moreBookmark: { padding: spacing.sm },
    heroTryOnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 10,
    borderRadius: radii.md,
    backgroundColor: colors.accent.primary,
    alignSelf: 'flex-start',
},

heroTryOnText: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
},
moreTryOnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignSelf: 'flex-start',
},
moreTryOnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 11,
    color: colors.accent.tryOn,
},
});

export default HomeScreen;
