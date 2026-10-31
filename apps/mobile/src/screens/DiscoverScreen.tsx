import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Bookmark, Search, SlidersHorizontal, Star } from 'lucide-react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TabScreenLayout } from '../components/shell/TabScreenLayout';
import { BottomSheet } from '../components/common/BottomSheet';
import { EmptyState } from '../components/common/EmptyState';
import {
    CollapsingChromeSlot,
    CompactSearchButton,
} from '../components/common/CollapsingChromeSlot';
import { MasonryGrid } from '../components/common/MasonryGrid';
import { focusSearchFromCompact, useCollapsingChrome } from '../hooks/useCollapsingChrome';
import { DiscoverProductCard } from '../components/marketplace/DiscoverProductCard';
import { SoldOutOverlay, SOLD_OUT_IMAGE_OPACITY } from '../components/marketplace/SoldOutOverlay';
import { MasonrySkeleton } from '../components/skeletons';
import { useAppState } from '../context/AppStateContext';
import { useActiveProducts } from '../hooks/useProducts';
import { AppRefreshControl, useRefresh } from '../components/common/AppRefreshControl';
import { useRootNavigation } from '../navigation/useRootNavigation';
import type {
    DiscoverStackParamList,
    MainTabParamList,
    RootStackParamList,
} from '../navigation/types';
import type { Product } from '../types/domain/product';
import type { Brand, Style } from '../types/domain/discover';
import type { Profile } from '../types/domain/profile';
import type { WardrobePairing } from '../types/domain/wardrobePairing';
import { repositories } from '../repositories';
import { formatKES } from '../lib/format';
import { firstInStock, isSoldOut } from '../lib/stock';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = CompositeScreenProps<
    NativeStackScreenProps<DiscoverStackParamList, 'DiscoverMain'>,
    CompositeScreenProps<
        BottomTabScreenProps<MainTabParamList>,
        NativeStackScreenProps<RootStackParamList>
    >
>;

type WardrobePairingItem = WardrobePairing;

const PAGE_SIZE = 8;
const MAX_FEED = 48;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STYLE_COL_WIDTH = (SCREEN_WIDTH - spacing.page * 2 - spacing.md) / 2;

const CATEGORIES = ['All', 'Outerwear', 'Tops', 'Bottoms', 'Dresses', 'Shoes', 'Accessories'];
const SIZES = ['All', 'XS', 'S', 'M', 'L', 'XL'];
const PRICE_RANGES = [
    { label: 'All Prices', min: 0, max: Infinity },
    { label: 'Under 5,000', min: 0, max: 5000 },
    { label: '5,000 - 10,000', min: 5000, max: 10000 },
    { label: '10,000 - 15,000', min: 10000, max: 15000 },
    { label: 'Over 15,000', min: 15000, max: Infinity },
];

type SearchTab = 'items' | 'profiles' | 'brands' | 'styles';

type FeedItem = Product & { feedKey: string };

const DiscoverScreen: React.FC<Props> = () => {
    const rootNav = useRootNavigation();
    const { toggleWishlist, isWishlisted } = useAppState();
    const [query, setQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [category, setCategory] = useState('All');
    const [size, setSize] = useState('All');
    const [priceIdx, setPriceIdx] = useState(0);
    const [searchTab, setSearchTab] = useState<SearchTab>('items');

    const isSearching = query.trim().length > 0;
    const q = query.trim().toLowerCase();

    const queryPayload = useMemo(() => {
        const range = PRICE_RANGES[priceIdx];
        return {
            search: q || undefined,
            category: category !== 'All' ? category : undefined,
            size: size !== 'All' ? size : undefined,
            minPrice: range.min > 0 ? range.min : undefined,
            maxPrice: range.max < Infinity ? range.max : undefined,
            limit: PAGE_SIZE,
        };
    }, [q, category, size, priceIdx]);

    const { products, loading: productsLoading, loadingMore, hasMore, loadMore, retry } = useActiveProducts(queryPayload);
    const { refreshing, onRefresh } = useRefresh(retry);

    const {
        chromeCollapsed,
        fullChromeOpacity,
        compactChromeOpacity,
        onScroll,
    } = useCollapsingChrome();
    const searchRef = useRef<TextInput>(null);
    const flatListRef = useRef<FlatList<{ key: string }>>(null);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [styleItems, setStyleItems] = useState<Style[]>([]);
    const [wardrobePairings, setWardrobePairings] = useState<WardrobePairingItem[]>([]);

    useEffect(() => {
        Promise.all([
            repositories.discoverCatalog.listProfiles(),
            repositories.discoverCatalog.listBrands(),
            repositories.discoverCatalog.listStyles(),
            repositories.wardrobePairings.list(),
        ]).then(([p, b, s, w]) => {
            setProfiles(p);
            setBrands(b);
            setStyleItems(s);
            setWardrobePairings(w);
        });
    }, []);

    const visibleFeed = useMemo(
        () => products.map(p => ({ ...p, feedKey: p.id })),
        [products]
    );

    const filteredProfiles = useMemo(
        () =>
            profiles.filter(
                (u) => u.name.toLowerCase().includes(q) || u.handle.toLowerCase().includes(q),
            ),
        [profiles, q],
    );
    const filteredBrands = useMemo(
        () => brands.filter((b) => b.name.toLowerCase().includes(q)),
        [brands, q],
    );
    const filteredStyles = useMemo(
        () => styleItems.filter((s) => s.name.toLowerCase().includes(q)),
        [styleItems, q],
    );

    const activeFilters =
        (category !== 'All' ? 1 : 0) + (size !== 'All' ? 1 : 0) + (priceIdx !== 0 ? 1 : 0);

    const clearFilters = () => {
        setCategory('All');
        setSize('All');
        setPriceIdx(0);
    };

    const openProduct = (id: string) => {
        rootNav.navigate('ProductDetail', { productId: id });
    };



    const renderFilterBtn = (compact?: boolean) => (
        <Pressable
            style={[
                compact ? styles.compactFilterBtn : styles.filterBtn,
                activeFilters > 0 && styles.filterBtnActive,
            ]}
            onPress={() => setShowFilters(true)}
        >
            <SlidersHorizontal
                size={14}
                color={activeFilters > 0 ? colors.text.primary : colors.text.onDark}
                strokeWidth={2.5}
            />
            <Text
                style={[
                    compact ? styles.compactFilterText : styles.filterBtnText,
                    activeFilters > 0 && styles.filterBtnTextActive,
                ]}
            >
                Filters{activeFilters > 0 ? ` (${activeFilters})` : ''}
            </Text>
        </Pressable>
    );

    const filterSheetContent = (
        <>
            {activeFilters > 0 ? (
                <Pressable style={styles.sheetClearRow} onPress={clearFilters}>
                    <Text style={styles.clearText}>Clear all filters</Text>
                </Pressable>
            ) : null}
            <Text style={styles.filterLabel}>Category</Text>
            <View style={styles.chipWrap}>
                {CATEGORIES.map((c) => (
                    <Pressable
                        key={c}
                        style={[styles.chip, category === c && styles.chipActive]}
                        onPress={() => setCategory(c)}
                    >
                        <Text style={[styles.chipText, category === c && styles.chipTextActive]}>
                            {c}
                        </Text>
                    </Pressable>
                ))}
            </View>
            <Text style={styles.filterLabel}>Size</Text>
            <View style={styles.chipWrap}>
                {SIZES.map((s) => (
                    <Pressable
                        key={s}
                        style={[styles.chip, size === s && styles.chipActive]}
                        onPress={() => setSize(s)}
                    >
                        <Text style={[styles.chipText, size === s && styles.chipTextActive]}>
                            {s}
                        </Text>
                    </Pressable>
                ))}
            </View>
            <Text style={styles.filterLabel}>Price Range</Text>
            <View style={styles.priceList}>
                {PRICE_RANGES.map((r, i) => (
                    <Pressable
                        key={r.label}
                        style={[styles.priceRow, priceIdx === i && styles.chipActive]}
                        onPress={() => setPriceIdx(i)}
                    >
                        <Text style={[styles.chipText, priceIdx === i && styles.chipTextActive]}>
                            {r.label}
                        </Text>
                    </Pressable>
                ))}
            </View>
        </>
    );

    const searchTabs: { id: SearchTab; label: string; count: number }[] = [
        { id: 'items', label: 'Items', count: products.length },
        { id: 'profiles', label: 'Profiles', count: filteredProfiles.length },
        { id: 'brands', label: 'Brands', count: filteredBrands.length },
        { id: 'styles', label: 'Styles', count: filteredStyles.length },
    ];

    const featuredProduct = !isSearching ? (firstInStock(products) ?? null) : null;
    const masonryProducts =
        !isSearching && featuredProduct
            ? visibleFeed.filter((p) => p.id !== featuredProduct.id)
            : visibleFeed;

    const renderSearchResults = () => {
        if (searchTab === 'profiles') {
            if (filteredProfiles.length === 0) {
                return (
                    <EmptyState
                        title="No profiles found"
                        description="Try a different search term"
                    />
                );
            }
            return (
                <View style={styles.list}>
                    {filteredProfiles.map((p) => (
                        <Pressable
                            key={p.id}
                            style={styles.rowCard}
                            onPress={() => rootNav.navigate('UserProfile', { userId: p.id })}
                        >
                            {p.avatarUrl ? (
                                <Image
                                    source={{ uri: p.avatarUrl }}
                                    style={styles.avatarImage}
                                    contentFit="cover"
                                />
                            ) : (
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{p.initials}</Text>
                                </View>
                            )}
                            <View style={styles.flex}>
                                <Text style={styles.rowName}>{p.handle}</Text>
                            </View>
                            <View style={styles.viewPill}>
                                <Text style={styles.viewPillText}>View</Text>
                            </View>
                        </Pressable>
                    ))}
                </View>
            );
        }
        if (searchTab === 'brands') {
            if (filteredBrands.length === 0) {
                return (
                    <EmptyState
                        title="No brands found"
                        description="Try a different search term"
                    />
                );
            }
            return (
                <View style={styles.list}>
                    {filteredBrands.map((b) => (
                        <Pressable
                            key={b.id}
                            style={styles.rowCard}
                            onPress={() => rootNav.navigate('BrandDetail', { brandId: b.id })}
                        >
                            <View style={styles.brandLogo}>
                                <Text style={styles.avatarText}>{b.logoText}</Text>
                            </View>
                            <View style={styles.flex}>
                                <Text style={styles.rowName}>{b.name}</Text>
                                <Text style={styles.rowMeta}>
                                    {b.productCount} products available
                                </Text>
                            </View>
                            <View style={styles.viewPill}>
                                <Text style={styles.viewPillText}>Explore</Text>
                            </View>
                        </Pressable>
                    ))}
                </View>
            );
        }
        if (searchTab === 'styles') {
            if (filteredStyles.length === 0) {
                return (
                    <EmptyState
                        title="No styles found"
                        description="Try a different search term"
                    />
                );
            }
            return (
                <View style={styles.grid}>
                    {filteredStyles.map((s) => (
                        <Pressable
                            key={s.id}
                            style={styles.styleCard}
                            onPress={() => rootNav.navigate('StyleDetail', { styleId: s.id })}
                        >
                            <Image
                                source={{ uri: s.coverUrl }}
                                style={StyleSheet.absoluteFill}
                                contentFit="cover"
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.9)']}
                                style={StyleSheet.absoluteFill}
                            />
                            <View style={styles.styleLabel}>
                                <Text style={styles.styleName}>{s.name}</Text>
                                <Text style={styles.styleFollowers}>{s.followers} following</Text>
                            </View>
                        </Pressable>
                    ))}
                </View>
            );
        }
        if (productsLoading) {
            return <MasonrySkeleton count={6} />;
        }
        if (visibleFeed.length === 0) {
            return (
                <EmptyState
                    icon={Search}
                    title="No items found"
                    description="Try adjusting your filters or search terms"
                />
            );
        }
        return (
            <MasonryGrid
                items={visibleFeed}
                keyExtractor={(item) => item.feedKey}
                renderItem={(item, index) => (
                    <DiscoverProductCard
                        product={item}
                        index={index}
                        onPress={() => openProduct(item.id)}
                        onWishlist={() => void toggleWishlist(item.id, {
                            id: item.id,
                            name: item.name,
                            brand: item.brand,
                            price: item.price,
                            imageUrl: item.imageUrl,
                            addedDate: new Date().toLocaleDateString(),
                        })}
                        wishlisted={isWishlisted(item.id)}
                    />
                )}
            />
        );
    };

    const listHeader = (
        <>
            {!isSearching ? (
                <View style={styles.railSection}>
                    <View style={styles.railHeader}>
                        <Text style={styles.railTitle}>PAIR WITH YOUR WARDROBE</Text>
                        <Pressable onPress={() => rootNav.navigate('WardrobePairings')}>
                            <Text style={styles.viewAll}>View All</Text>
                        </Pressable>
                    </View>
                    {wardrobePairings.length === 0 ? (
                        <View style={styles.sectionEmpty}>
                            <EmptyState
                                title="No pairings yet"
                                description="Add wardrobe items to get personalized pairing suggestions"
                            />
                        </View>
                    ) : (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.rail}
                        >
                            {wardrobePairings.map((item) => (
                                <Pressable
                                    key={item.productId}
                                    style={styles.pairCard}
                                    onPress={() => openProduct(item.productId)}
                                >
                                    <View style={styles.pairImageWrap}>
                                        <Image
                                            source={{ uri: item.image }}
                                            style={StyleSheet.absoluteFill}
                                            contentFit="cover"
                                        />
                                        <LinearGradient
                                            colors={[colors.accent.warm, colors.accent.terracotta]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.pairMatch}
                                        >
                                            <Text style={styles.pairMatchText}>{item.match}%</Text>
                                        </LinearGradient>
                                    </View>
                                    <Text style={styles.pairWith}>with your {item.pairs}</Text>
                                    <Text style={styles.pairName} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                    <Text style={styles.pairPrice}>{formatKES(item.price)}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    )}
                </View>
            ) : null}

            {featuredProduct ? (
                <Pressable
                    style={styles.featuredCard}
                    onPress={() => openProduct(featuredProduct.id)}
                    accessibilityLabel={
                        isSoldOut(featuredProduct)
                            ? `${featuredProduct.name}, sold out`
                            : featuredProduct.name
                    }
                >
                    <Image
                        source={{ uri: featuredProduct.imageUrl }}
                        style={[
                            StyleSheet.absoluteFill,
                            isSoldOut(featuredProduct) && { opacity: SOLD_OUT_IMAGE_OPACITY },
                        ]}
                        contentFit="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.9)']}
                        style={StyleSheet.absoluteFill}
                    />
                    {isSoldOut(featuredProduct) ? <SoldOutOverlay /> : null}
                    {featuredProduct.rating && !isSoldOut(featuredProduct) ? (
                        <View style={styles.ratingPill}>
                            <Star
                                size={11}
                                color={colors.text.primary}
                                fill={colors.text.primary}
                                strokeWidth={3}
                            />
                            <Text style={styles.ratingPillText}>{featuredProduct.rating}</Text>
                        </View>
                    ) : null}
                    <Pressable
                        style={styles.featuredBookmark}
                        onPress={() => void toggleWishlist(featuredProduct.id, {
                            id: featuredProduct.id,
                            name: featuredProduct.name,
                            brand: featuredProduct.brand,
                            price: featuredProduct.price,
                            imageUrl: featuredProduct.imageUrl,
                            addedDate: new Date().toLocaleDateString(),
                        })}
                    >
                        <Bookmark
                            size={18}
                            color={isWishlisted(featuredProduct.id) ? colors.accent.primary : colors.text.onDark}
                            fill={isWishlisted(featuredProduct.id) ? colors.accent.primary : 'transparent'}
                            strokeWidth={2.5}
                        />
                    </Pressable>
                    <View style={[styles.cardLabel, isSoldOut(featuredProduct) && { opacity: 0.5 }]}>
                        <Text style={styles.cardBrand}>{featuredProduct.brand}</Text>
                        <Text style={styles.cardNameFeatured} numberOfLines={2}>
                            {featuredProduct.name}
                        </Text>
                        <View style={styles.cardPriceRow}>
                            <Text style={styles.cardPriceFeatured}>
                                {formatKES(featuredProduct.price)}
                            </Text>
                            {!isSoldOut(featuredProduct) ? (
                                <View style={styles.featuredBadge}>
                                    <Text style={styles.featuredBadgeText}>Featured</Text>
                                </View>
                            ) : null}
                        </View>
                    </View>
                </Pressable>
            ) : null}
        </>
    );

    const listEmpty = productsLoading ? (
        <MasonrySkeleton count={6} />
    ) : (
        <EmptyState
            icon={Search}
            title="No Results Found"
            description="Try adjusting your filters or search terms"
            actionLabel={activeFilters > 0 ? 'Clear All Filters' : undefined}
            onAction={activeFilters > 0 ? clearFilters : undefined}
        />
    );

    const listFooter = loadingMore ? (
        <View style={styles.footerLoader}>
            <ActivityIndicator color={colors.accent.primary} />
        </View>
    ) : !hasMore && visibleFeed.length > 0 ? (
        <Text style={styles.endText}>You&apos;re all caught up</Text>
    ) : null;

    return (
        <TabScreenLayout>
            <View style={styles.shell}>
                <CollapsingChromeSlot
                    collapsed={chromeCollapsed}
                    fullOpacity={fullChromeOpacity}
                    compactOpacity={compactChromeOpacity}
                    fullChrome={
                        <>
                            <View style={styles.searchWrap}>
                                <Search
                                    size={18}
                                    color={colors.text.onDarkSubtle}
                                    strokeWidth={2.5}
                                    style={styles.searchIcon}
                                />
                                <TextInput
                                    ref={searchRef}
                                    style={styles.searchInput}
                                    placeholder="Search items, brands, profiles, styles..."
                                    placeholderTextColor={colors.text.onDarkSubtle}
                                    value={query}
                                    onChangeText={setQuery}
                                />
                            </View>

                            {isSearching ? (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.tabRow}
                                    style={styles.tabScroll}
                                >
                                    {searchTabs.map((t) => {
                                        const active = searchTab === t.id;
                                        return (
                                            <Pressable
                                                key={t.id}
                                                style={[styles.tab, active && styles.tabActive]}
                                                onPress={() => setSearchTab(t.id)}
                                            >
                                                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                                                    {t.label} ({t.count})
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>
                            ) : null}

                            <View style={styles.filterBar}>
                                {renderFilterBtn()}
                                {activeFilters > 0 ? (
                                    <Pressable onPress={clearFilters}>
                                        <Text style={styles.clearText}>Clear all</Text>
                                    </Pressable>
                                ) : null}
                            </View>
                        </>
                    }
                    compactChrome={
                        <>
                            <CompactSearchButton
                                onPress={() => focusSearchFromCompact(flatListRef, searchRef)}
                            />
                            {renderFilterBtn(true)}
                        </>
                    }
                />

                <FlatList
                    ref={flatListRef}
                    data={
                        isSearching
                            ? [{ key: 'search' }]
                            : productsLoading || visibleFeed.length > 0
                              ? [{ key: 'feed' }]
                              : []
                    }
                    keyExtractor={(item) => item.key}
                    renderItem={() => (
                        <View style={styles.results}>
                            {isSearching ? (
                                renderSearchResults()
                            ) : productsLoading ? (
                                <MasonrySkeleton count={6} />
                            ) : (
                                <MasonryGrid
                                    items={masonryProducts}
                                    keyExtractor={(item) => item.feedKey}
                                    renderItem={(item, index) => (
                                        <DiscoverProductCard
                                            product={item}
                                            index={index + 1}
                                            onPress={() => openProduct(item.id)}
                                            onWishlist={() => void toggleWishlist(item.id, {
                                                id: item.id,
                                                name: item.name,
                                                brand: item.brand,
                                                price: item.price,
                                                imageUrl: item.imageUrl,
                                                addedDate: new Date().toLocaleDateString(),
                                            })}
                                            wishlisted={isWishlisted(item.id)}
                                        />
                                    )}
                                />
                            )}
                        </View>
                    )}
                    ListHeaderComponent={!isSearching ? listHeader : null}
                    ListEmptyComponent={listEmpty}
                    ListFooterComponent={!isSearching ? listFooter : null}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    onEndReached={!isSearching ? loadMore : undefined}
                    onEndReachedThreshold={0.35}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                
                />

                <BottomSheet
                    visible={showFilters}
                    onClose={() => setShowFilters(false)}
                    title="Filters"
                >
                    {filterSheetContent}
                </BottomSheet>
            </View>
        </TabScreenLayout>
    );
};

const styles = StyleSheet.create({
    shell: { flex: 1 },
    compactFilterBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        height: 40,
        borderRadius: radii.pill,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    compactFilterText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDark,
        textTransform: 'uppercase',
    },
    sheetClearRow: {
        alignItems: 'flex-end',
        marginBottom: spacing.lg,
    },
    flex: { flex: 1 },
    searchWrap: {
        marginHorizontal: spacing.page,
        marginTop: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: colors.border.dark,
        borderRadius: radii.pill,
        paddingHorizontal: spacing.lg,
    },
    searchIcon: { marginRight: spacing.sm },
    searchInput: {
        flex: 1,
        paddingVertical: spacing.md + 2,
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDark,
    },
    tabScroll: { flexGrow: 0 },
    tabRow: { paddingHorizontal: spacing.page, paddingTop: spacing.md, gap: spacing.sm },
    tab: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: colors.border.dark,
        marginRight: spacing.sm,
    },
    tabActive: { backgroundColor: colors.text.onDark, borderColor: colors.text.onDark },
    tabText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.text.onDark,
        textTransform: 'uppercase',
    },
    tabTextActive: { color: colors.text.primary },
    filterBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.page,
        paddingVertical: spacing.md,
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radii.pill,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    filterBtnActive: {
        backgroundColor: colors.accent.primary,
        borderColor: colors.accent.primary,
    },
    filterBtnText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.onDark,
    },
    filterBtnTextActive: { color: colors.text.primary },
    filterCount: {
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: colors.text.primary,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    filterCountText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDark,
    },
    clearText: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
    },
    filterLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.md,
    },
    chipWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    chip: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    chipActive: {
        backgroundColor: colors.accent.primary,
        borderColor: colors.accent.primary,
    },
    chipText: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 13,
        color: colors.text.onDark,
    },
    chipTextActive: { color: colors.text.primary },
    priceList: { gap: spacing.sm },
    priceRow: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radii.md,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    listContent: { paddingBottom: spacing.xxl },
    railSection: { marginBottom: spacing.lg },
    railHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.page,
        marginBottom: spacing.md,
    },
    railTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDarkSubtle,
        letterSpacing: 1.5,
    },
    viewAll: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.accent.warm,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionEmpty: { paddingHorizontal: spacing.page },
    rail: { paddingHorizontal: spacing.page, gap: spacing.sm },
    pairCard: { width: 144 },
    pairImageWrap: {
        aspectRatio: 3 / 4,
        borderRadius: radii.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border.dark,
        marginBottom: spacing.sm,
    },
    pairMatch: {
        position: 'absolute',
        top: 8,
        left: 8,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: radii.pill,
    },
    pairMatchText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.primary,
    },
    pairWith: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 10,
        color: colors.text.onDarkSubtle,
    },
    pairName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.onDark,
    },
    pairPrice: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.accent.primary,
        marginTop: 2,
    },
    featuredCard: {
        marginHorizontal: spacing.page,
        height: 300,
        borderRadius: radii.lg,
        overflow: 'hidden',
        justifyContent: 'flex-end',
        marginBottom: spacing.lg,
    },
    featuredBookmark: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    results: { paddingHorizontal: spacing.page },
    list: { gap: spacing.md },
    rowCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
        padding: spacing.lg,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: colors.background.cardDark,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 2,
        borderColor: colors.border.dark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarImage: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: colors.border.dark,
    },
    brandLogo: {
        width: 56,
        height: 56,
        borderRadius: radii.lg,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: colors.border.dark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 16,
        color: colors.text.onDark,
    },
    rowName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 15,
        color: colors.text.onDark,
    },
    rowHandle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        marginTop: 1,
    },
    rowMeta: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: colors.text.onDarkSubtle,
        marginTop: 4,
    },
    viewPill: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
        backgroundColor: colors.text.onDark,
    },
    viewPillText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.primary,
        textTransform: 'uppercase',
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    styleCard: {
        width: STYLE_COL_WIDTH,
        aspectRatio: 4 / 5,
        borderRadius: radii.lg,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    styleLabel: { padding: spacing.lg },
    styleName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 20,
        color: colors.text.onDark,
    },
    styleFollowers: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        marginTop: 2,
    },
    ratingPill: {
        position: 'absolute',
        top: spacing.md,
        left: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: radii.pill,
    },
    ratingPillText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.primary,
    },
    cardLabel: { padding: spacing.lg },
    cardBrand: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: colors.text.onDarkMuted,
        marginBottom: 2,
    },
    cardNameFeatured: {
        fontFamily: typography.fontFamily.black,
        fontSize: 24,
        color: colors.text.onDark,
        marginBottom: spacing.sm,
    },
    cardPriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardPriceFeatured: {
        fontFamily: typography.fontFamily.black,
        fontSize: 22,
        color: colors.text.onDark,
    },
    featuredBadge: {
        backgroundColor: colors.accent.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: 4,
        borderRadius: radii.pill,
    },
    featuredBadgeText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.primary,
        textTransform: 'uppercase',
    },
    footerLoader: { paddingVertical: spacing.xl, alignItems: 'center' },
    endText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
        textAlign: 'center',
        paddingVertical: spacing.lg,
    },
});

export default DiscoverScreen;
