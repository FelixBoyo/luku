import React, { useMemo, useState } from 'react';
import {
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Heart, Sparkles, Star, TrendingUp } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { SoldOutOverlay, SOLD_OUT_IMAGE_OPACITY } from '../components/marketplace/SoldOutOverlay';
import { EmptyState } from '../components/common/EmptyState';
import { ProductGridSkeleton } from '../components/skeletons';
import { useActiveProducts } from '../hooks/useProducts';
import { useRootNavigation } from '../navigation/useRootNavigation';
import type { HomeStackParamList, MainTabParamList, RootStackParamList } from '../navigation/types';
import { formatKES } from '../lib/format';
import { firstInStock, isSoldOut } from '../lib/stock';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, 'Marketplace'>,
    CompositeScreenProps<
        BottomTabScreenProps<MainTabParamList>,
        NativeStackScreenProps<RootStackParamList>
    >
>;

const { width } = Dimensions.get('window');
const colWidth = (width - spacing.page * 2 - spacing.md) / 2;

const VIEW_MODES = [
    { id: 'recommended', label: 'For You', icon: Sparkles },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'new', label: 'New Arrivals', icon: null },
] as const;

const CATEGORIES = ['All', 'Outerwear', 'Tops', 'Bottoms', 'Dresses', 'Shoes', 'Accessories'];

type ViewMode = (typeof VIEW_MODES)[number]['id'];

const MarketplaceScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const rootNav = useRootNavigation();
    const [viewMode, setViewMode] = useState<ViewMode>('recommended');
    const [category, setCategory] = useState('All');
    const { products: catalogProducts, loading } = useActiveProducts();

    const products = useMemo(() => {
        let list =
            category === 'All'
                ? [...catalogProducts]
                : catalogProducts.filter((p) => p.category === category);
        if (viewMode === 'trending') {
            list = list
                .filter((p) => p.isTrending)
                .concat(list.filter((p) => !p.isTrending));
        } else if (viewMode === 'new') {
            list = list.filter((p) => p.isNew).concat(list.filter((p) => !p.isNew));
        } else {
            list = list.sort((a, b) => (b.aiMatch ?? 0) - (a.aiMatch ?? 0));
        }
        return list;
    }, [viewMode, category, catalogProducts]);

    const hero = firstInStock(products);
    const rest = hero ? products.filter((p) => p.id !== hero.id) : products.slice(1);

    const openProduct = (id: string) =>
        rootNav.navigate('ProductDetail', { productId: id });

    return (
        <View style={styles.container}>
            <Pressable
                style={[styles.backBtn, { top: insets.top + spacing.sm }]}
                onPress={() => navigation.goBack()}
            >
                <ChevronLeft size={22} color={colors.text.onDark} strokeWidth={2.5} />
            </Pressable>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {loading ? (
                    <ProductGridSkeleton />
                ) : products.length === 0 ? (
                    <EmptyState
                        icon={Sparkles}
                        title="No products yet"
                        description="Check back soon for new arrivals"
                    />
                ) : (
                <>
                {hero ? (
                    <Pressable
                        style={styles.hero}
                        onPress={() => openProduct(hero.id)}
                        accessibilityLabel={isSoldOut(hero) ? `${hero.name}, sold out` : hero.name}
                    >
                        <Image
                            source={{ uri: hero.imageUrl }}
                            style={[
                                StyleSheet.absoluteFill,
                                isSoldOut(hero) && { opacity: SOLD_OUT_IMAGE_OPACITY },
                            ]}
                            contentFit="cover"
                        />
                        <LinearGradient
                            colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)', '#000000']}
                            style={StyleSheet.absoluteFill}
                        />
                        {isSoldOut(hero) ? <SoldOutOverlay /> : null}
                        <Text style={[styles.heroTitle, { top: insets.top + spacing.lg }]}>MARKET</Text>
                        <View style={styles.heroInfo}>
                            <View style={styles.flex}>
                                {hero.aiMatch && hero.aiMatch >= 90 && !isSoldOut(hero) ? (
                                    <LinearGradient
                                        colors={[colors.accent.primary, colors.accent.bright]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.heroMatch}
                                    >
                                        <Sparkles size={11} color={colors.text.primary} strokeWidth={3} />
                                        <Text style={styles.heroMatchText}>{hero.aiMatch}%</Text>
                                    </LinearGradient>
                                ) : null}
                                <Text style={styles.heroName}>{hero.name}</Text>
                                <Text style={styles.heroBrand}>{hero.brand}</Text>
                            </View>
                            <Text style={styles.heroPrice}>{formatKES(hero.price)}</Text>
                        </View>
                    </Pressable>
                ) : null}

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.modeRow}
                >
                    {VIEW_MODES.map((m) => {
                        const Icon = m.icon;
                        const active = viewMode === m.id;
                        return (
                            <Pressable
                                key={m.id}
                                style={[styles.mode, active && styles.modeActive]}
                                onPress={() => setViewMode(m.id)}
                            >
                                {Icon ? (
                                    <Icon
                                        size={14}
                                        color={active ? colors.text.primary : colors.text.onDark}
                                        strokeWidth={3}
                                    />
                                ) : null}
                                <Text style={[styles.modeText, active && styles.modeTextActive]}>
                                    {m.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.catRow}
                >
                    {CATEGORIES.map((c) => {
                        const active = category === c;
                        return (
                            <Pressable
                                key={c}
                                style={[styles.cat, active && styles.catActive]}
                                onPress={() => setCategory(c)}
                            >
                                <Text style={[styles.catText, active && styles.catTextActive]}>{c}</Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>

                <View style={styles.grid}>
                    {rest.map((p, idx) => {
                        const tall = idx % 3 === 0;
                        const soldOut = isSoldOut(p);
                        return (
                            <Pressable
                                key={p.id}
                                style={[styles.card, { height: tall ? colWidth * 1.7 : colWidth * 1.33 }]}
                                onPress={() => openProduct(p.id)}
                                accessibilityLabel={soldOut ? `${p.name}, sold out` : p.name}
                            >
                                <Image
                                    source={{ uri: p.imageUrl }}
                                    style={[
                                        StyleSheet.absoluteFill,
                                        soldOut && { opacity: SOLD_OUT_IMAGE_OPACITY },
                                    ]}
                                    contentFit="cover"
                                />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)']}
                                    style={StyleSheet.absoluteFill}
                                />
                                {soldOut ? <SoldOutOverlay /> : null}
                                {!soldOut ? (
                                <View style={styles.badges}>
                                    {p.isTrending ? (
                                        <View style={styles.hotBadge}>
                                            <TrendingUp size={11} color={colors.text.primary} strokeWidth={3} />
                                            <Text style={styles.hotText}>HOT</Text>
                                        </View>
                                    ) : null}
                                    {p.isNew ? (
                                        <View style={styles.newBadge}>
                                            <Text style={styles.newText}>NEW</Text>
                                        </View>
                                    ) : null}
                                    {p.aiMatch && p.aiMatch >= 90 ? (
                                        <LinearGradient
                                            colors={[colors.accent.primary, colors.accent.bright]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.aiBadge}
                                        >
                                            <Sparkles size={10} color={colors.text.primary} strokeWidth={3} />
                                            <Text style={styles.aiText}>{p.aiMatch}%</Text>
                                        </LinearGradient>
                                    ) : null}
                                </View>
                                ) : null}
                                <View style={styles.heartBtn}>
                                    <Heart size={16} color={colors.text.onDark} strokeWidth={2.5} />
                                </View>
                                <View style={[styles.cardLabel, soldOut && { opacity: 0.5 }]}>
                                    <Text style={styles.cardName} numberOfLines={1}>{p.name}</Text>
                                    <Text style={styles.cardBrand} numberOfLines={1}>{p.brand}</Text>
                                    <View style={styles.cardBottom}>
                                        <Text style={styles.cardPrice}>{formatKES(p.price)}</Text>
                                        {p.rating && !soldOut ? (
                                            <View style={styles.ratingRow}>
                                                <Star size={11} color={colors.accent.primary} fill={colors.accent.primary} strokeWidth={3} />
                                                <Text style={styles.ratingText}>{p.rating}</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                </View>
                            </Pressable>
                        );
                    })}
                </View>
                </>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    flex: { flex: 1 },
    backBtn: {
        position: 'absolute',
        right: spacing.page,
        zIndex: 20,
        width: 40,
        height: 40,
        borderRadius: radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    scroll: { paddingBottom: spacing.tabBar },
    hero: { height: 360, position: 'relative', justifyContent: 'flex-end', overflow: 'hidden' },
    heroTitle: {
        position: 'absolute',
        left: spacing.page,
        fontFamily: typography.fontFamily.black,
        fontSize: 44,
        color: colors.text.onDark,
        letterSpacing: -2,
    },
    heroInfo: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: spacing.page,
    },
    heroMatch: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginBottom: spacing.sm,
    },
    heroMatchText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.primary,
    },
    heroName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 24,
        color: colors.text.onDark,
    },
    heroBrand: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        marginTop: 2,
    },
    heroPrice: {
        fontFamily: typography.fontFamily.black,
        fontSize: 26,
        color: colors.text.onDark,
    },
    modeRow: { paddingHorizontal: spacing.page, paddingTop: spacing.xl, gap: spacing.sm },
    mode: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        marginRight: spacing.sm,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    modeActive: { backgroundColor: colors.text.onDark, borderColor: colors.text.onDark },
    modeText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    modeTextActive: { color: colors.text.primary },
    catRow: { paddingHorizontal: spacing.page, paddingTop: spacing.lg, gap: spacing.sm },
    cat: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        marginRight: spacing.sm,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    catActive: { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary },
    catText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
    },
    catTextActive: { color: colors.text.primary },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: spacing.page,
        paddingTop: spacing.lg,
        gap: spacing.md,
    },
    card: {
        width: colWidth,
        borderRadius: radii.lg,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    badges: { position: 'absolute', top: spacing.sm, left: spacing.sm, gap: 4 },
    hotBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        alignSelf: 'flex-start',
        backgroundColor: colors.accent.primary,
        paddingHorizontal: 6,
        paddingVertical: 3,
    },
    hotText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 9,
        color: colors.text.primary,
    },
    newBadge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.text.onDark,
        paddingHorizontal: 6,
        paddingVertical: 3,
    },
    newText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 9,
        color: colors.text.primary,
    },
    aiBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 3,
    },
    aiText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 9,
        color: colors.text.primary,
    },
    heartBtn: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    cardLabel: { padding: spacing.md },
    cardName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
    },
    cardBrand: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: colors.text.onDarkMuted,
        marginTop: 1,
    },
    cardBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
    },
    cardPrice: {
        fontFamily: typography.fontFamily.black,
        fontSize: 16,
        color: colors.text.onDark,
    },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    ratingText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.text.onDark,
    },
});

export default MarketplaceScreen;
