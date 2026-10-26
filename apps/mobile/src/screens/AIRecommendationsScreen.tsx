import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, ShoppingCart, Sparkles, Star } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { CollectionHeader } from '../components/shell/CollectionHeader';
import { formatKES } from '../lib/format';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'AIRecommendations'>;

const recommendations = [
    {
        id: '2',
        name: 'Wool Trench Coat',
        brand: 'Timeless Essentials',
        price: 18900,
        imageUrl: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=800',
        aiReason: 'Completes your earth-tone wardrobe',
        matchScore: 98,
        matchesItems: ['Cashmere Sweater', 'Tailored Trousers', 'Leather Shoes'],
        rating: 4.8,
        reviewCount: 45,
    },
    {
        id: '3',
        name: 'Minimalist Handbag',
        brand: 'Essential Leather Co.',
        price: 9800,
        imageUrl: 'https://images.unsplash.com/photo-1665832102613-5b94286ec041?w=800',
        aiReason: 'Pairs with your existing accessories',
        matchScore: 94,
        matchesItems: ['White T-Shirt', 'Linen Shirt'],
        rating: 4.9,
        reviewCount: 32,
    },
    {
        id: '4',
        name: 'Silk Midi Dress',
        brand: 'Modern Staples',
        price: 7500,
        imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
        aiReason: 'Matches your minimalist aesthetic',
        matchScore: 91,
        matchesItems: ['Cotton T-Shirt', 'Sneakers'],
        rating: 4.7,
        reviewCount: 28,
    },
];

const HOW_IT_WORKS = [
    { n: '1', title: 'Wardrobe Analysis', desc: 'Our AI analyzes your existing items, colors, and style preferences.' },
    { n: '2', title: 'Smart Matching', desc: 'We find items that complement your wardrobe and fill style gaps.' },
    { n: '3', title: 'Personalized Ranking', desc: 'Items are scored based on compatibility, price, and seller quality.' },
];

const AIRecommendationsScreen: React.FC<Props> = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <CollectionHeader
                title="PICKED FOR YOU"
                subtitle={`${recommendations.length} AI-curated matches · based on your wardrobe`}
                onBack={() => navigation.goBack()}
            />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <View style={styles.body}>
                    <View style={styles.insightCard}>
                        <LinearGradient
                            colors={[colors.accent.gradientStart, colors.accent.gradientEnd]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.insightIcon}
                        >
                            <Sparkles color={colors.text.primary} size={22} strokeWidth={3} />
                        </LinearGradient>
                        <View style={styles.flex}>
                            <Text style={styles.insightTitle}>Style Analysis Complete</Text>
                            <Text style={styles.insightDesc}>
                                Based on your 24 wardrobe items, we found pieces that perfectly
                                complement your minimalist aesthetic.
                            </Text>
                            <View style={styles.insightTags}>
                                <View style={styles.tagGreen}>
                                    <Text style={styles.tagGreenText}>98% Match</Text>
                                </View>
                                <View style={styles.tagPlain}>
                                    <Text style={styles.tagPlainText}>3 Perfect Fits</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.sectionHead}>
                        <View>
                            <Text style={styles.sectionTitle}>Top Recommendations</Text>
                            <Text style={styles.sectionSub}>Ordered by match score</Text>
                        </View>
                        <View style={styles.refresh}>
                            <Sparkles color={colors.accent.primary} size={14} strokeWidth={3} />
                            <Text style={styles.refreshText}>Refresh</Text>
                        </View>
                    </View>

                    <View style={styles.cardList}>
                        {recommendations.map((p, idx) => (
                            <Pressable
                                key={p.id}
                                style={styles.bigCard}
                                onPress={() =>
                                    navigation.navigate('ProductDetail', { productId: p.id })
                                }
                            >
                                <Image source={{ uri: p.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.6)', '#000000']}
                                    style={StyleSheet.absoluteFill}
                                />
                                <View style={styles.bigCardTop}>
                                    <View style={styles.badgeRow}>
                                        <LinearGradient
                                            colors={[colors.accent.gradientStart, colors.accent.gradientEnd]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.matchBadge}
                                        >
                                            <Sparkles color={colors.text.primary} size={12} strokeWidth={3} />
                                            <Text style={styles.matchBadgeText}>{p.matchScore}% Match</Text>
                                        </LinearGradient>
                                        {idx === 0 ? (
                                            <View style={styles.pickBadge}>
                                                <Text style={styles.pickBadgeText}>#1 Pick</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                    <View style={styles.iconBtnRow}>
                                        <View style={styles.iconBtnGlass}>
                                            <Heart color={colors.text.onDark} size={18} strokeWidth={2.5} />
                                        </View>
                                        <View style={styles.iconBtnWhite}>
                                            <ShoppingCart color={colors.text.primary} size={18} strokeWidth={2.5} />
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.bigCardBottom}>
                                    <Text style={styles.bigName}>{p.name}</Text>
                                    <Text style={styles.bigBrand}>{p.brand}</Text>
                                    <Text style={styles.bigReason}>{p.aiReason}</Text>
                                    <View style={styles.matchItemRow}>
                                        {p.matchesItems.slice(0, 3).map((m) => (
                                            <View key={m} style={styles.matchItemChip}>
                                                <Text style={styles.matchItemText}>{m}</Text>
                                            </View>
                                        ))}
                                    </View>
                                    <View style={styles.priceRow}>
                                        <Text style={styles.bigPrice}>{formatKES(p.price)}</Text>
                                        <View style={styles.ratingRow}>
                                            <Star color={colors.accent.primary} fill={colors.accent.primary} size={14} strokeWidth={3} />
                                            <Text style={styles.ratingValue}>{p.rating}</Text>
                                            <Text style={styles.ratingCount}>({p.reviewCount})</Text>
                                        </View>
                                    </View>
                                </View>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={styles.sectionTitle}>How It Works</Text>
                    <View style={styles.stepsList}>
                        {HOW_IT_WORKS.map((s) => (
                            <View key={s.n} style={styles.stepRow}>
                                <View style={styles.stepNum}>
                                    <Text style={styles.stepNumText}>{s.n}</Text>
                                </View>
                                <View style={styles.flex}>
                                    <Text style={styles.stepTitle}>{s.title}</Text>
                                    <Text style={styles.stepDesc}>{s.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    scroll: { paddingBottom: spacing.xxl },
    flex: { flex: 1 },
    hero: { paddingHorizontal: spacing.page, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
    heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    heroTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 44,
        color: colors.text.onDark,
        letterSpacing: -1,
    },
    heroSub: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDarkMuted,
        marginTop: spacing.sm,
    },
    body: { paddingHorizontal: spacing.page },
    insightCard: {
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginBottom: spacing.xl,
    },
    insightIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    insightTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    insightDesc: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        lineHeight: 19,
        marginBottom: spacing.md,
    },
    insightTags: { flexDirection: 'row', gap: spacing.sm },
    tagGreen: {
        backgroundColor: colors.accent.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: 4,
        borderRadius: radii.sm,
    },
    tagGreenText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.primary,
        textTransform: 'uppercase',
    },
    tagPlain: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: spacing.md,
        paddingVertical: 4,
        borderRadius: radii.sm,
    },
    tagPlainText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDark,
        textTransform: 'uppercase',
    },
    sectionHead: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 2,
        marginTop: spacing.xl,
    },
    sectionSub: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
    },
    refresh: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
    refreshText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.accent.primary,
        textTransform: 'uppercase',
    },
    cardList: { gap: spacing.lg },
    bigCard: {
        height: 360,
        borderRadius: radii.xl,
        overflow: 'hidden',
        justifyContent: 'space-between',
        padding: spacing.lg,
    },
    bigCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    badgeRow: { flexDirection: 'row', gap: spacing.sm },
    matchBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.sm,
    },
    matchBadgeText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.primary,
    },
    pickBadge: {
        backgroundColor: colors.text.onDark,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.sm,
    },
    pickBadgeText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.primary,
        textTransform: 'uppercase',
    },
    iconBtnRow: { flexDirection: 'row', gap: spacing.sm },
    iconBtnGlass: {
        width: 38,
        height: 38,
        borderRadius: radii.md,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBtnWhite: {
        width: 38,
        height: 38,
        borderRadius: radii.md,
        backgroundColor: colors.text.onDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bigCardBottom: {},
    bigName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 24,
        color: colors.text.onDark,
        marginBottom: 4,
    },
    bigBrand: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: spacing.sm,
    },
    bigReason: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: spacing.sm,
    },
    matchItemRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
    matchItemChip: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.sm,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    matchItemText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: colors.text.onDark,
    },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bigPrice: {
        fontFamily: typography.fontFamily.black,
        fontSize: 22,
        color: colors.text.onDark,
    },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingValue: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
    },
    ratingCount: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
    },
    stepsList: { gap: spacing.md, marginBottom: spacing.xl },
    stepRow: {
        flexDirection: 'row',
        gap: spacing.lg,
        padding: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    stepNum: {
        width: 36,
        height: 36,
        borderRadius: radii.md,
        backgroundColor: colors.accent.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.primary,
    },
    stepTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    stepDesc: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
        lineHeight: 17,
    },
    cta: {
        marginTop: spacing.lg,
        backgroundColor: colors.text.onDark,
        paddingVertical: 16,
        borderRadius: radii.lg,
        alignItems: 'center',
    },
    ctaText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});

export default AIRecommendationsScreen;
