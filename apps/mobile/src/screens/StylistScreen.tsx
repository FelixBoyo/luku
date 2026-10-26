import React, { useEffect, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Camera,
    Heart,
    RefreshCw,
    Send,
    ShoppingBag,
    Sparkles,
} from 'lucide-react-native';
import { TabScreenLayout } from '../components/shell/TabScreenLayout';
import { EmptyState } from '../components/common/EmptyState';
import { useAppState } from '../context/AppStateContext';
import { useRootNavigation } from '../navigation/useRootNavigation';
import { repositories } from '../repositories';
import { formatKES } from '../lib/format';
import { apiPost, ApiError } from '../api/apiClient';
import type { OutfitSuggestionsResponse } from '../../../../packages/contracts/src/ai/outfitSuggestions';
import type { StylistOutfit, StyleEnhancer } from '../types/domain/stylist';
import { colors, radii, spacing, typography } from '../theme/tokens';
import { useToast } from '../context/ToastContext';

const StylistScreen: React.FC = () => {
    const rootNav = useRootNavigation();
    const { addToCart } = useAppState();
    const { showToast } = useToast();
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [outfits, setOutfits] = useState<StylistOutfit[]>([]);
    const [enhancers, setEnhancers] = useState<StyleEnhancer[]>([]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

    useEffect(() => {
        setLoading(true);
        Promise.all([
            repositories.stylist.listOutfits(),
            repositories.stylist.listEnhancers(),
        ])
            .then(([o, e]) => {
                setOutfits(o);
                setEnhancers(e);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleGenerate = async () => {
        if (!prompt.trim() || isGenerating) return;
        setIsGenerating(true);
        try {
            const response = await apiPost<OutfitSuggestionsResponse>(
                '/v1/api/ai/outfit-suggestions',
                { occasion: prompt.trim() },
            );
            const suggestions = response.data?.suggestions ?? [];
            setOutfits(
                suggestions.map((s) => ({
                    id: s.id,
                    name: s.name,
                    occasion: s.occasion,
                    fromWardrobe: s.pieces.some((p) => Boolean(p.wardrobeItemId)),
                    items: s.pieces.map((p, idx) => ({
                        productId: p.wardrobeItemId ?? `${s.id}-piece-${idx}`,
                        name: p.name,
                        image: p.imageUrl ?? '',
                        owned: Boolean(p.wardrobeItemId),
                    })),
                })),
            );
        } catch {
            setOutfits([]);
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleFavorite = (id: string) => {
        setFavorites((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const openProduct = (productId: string) =>
        rootNav.navigate('ProductDetail', { productId });

    const hasDemo = outfits.length > 0 || enhancers.length > 0;

    return (
        <TabScreenLayout>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>STYLIST</Text>
                    <Text style={styles.subtitle}>
                        AI outfit suggestions from your wardrobe
                    </Text>
                </View>

                <View style={styles.promptCard}>
                    <Text style={styles.promptLabel}>Describe Your Needs</Text>
                    <TextInput
                        style={styles.promptInput}
                        placeholder="E.g., 'an outfit for a casual coffee date' or 'a professional look for my presentation'"
                        placeholderTextColor={colors.text.onDarkSubtle}
                        value={prompt}
                        onChangeText={setPrompt}
                        multiline
                    />
                    <View style={styles.promptFooter}>
                        <Text style={styles.promptHint}>
                            Be specific about occasion, weather, or style
                        </Text>
                        <Pressable
                            onPress={handleGenerate}
                            disabled={!prompt.trim() || isGenerating}
                            style={!prompt.trim() || isGenerating ? styles.generateDisabled : null}
                        >
                            <LinearGradient
                                colors={[colors.accent.warm, colors.accent.terracotta]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.generateBtn}
                            >
                                {isGenerating ? (
                                    <RefreshCw size={14} color={colors.text.primary} strokeWidth={2.5} />
                                ) : (
                                    <Send size={14} color={colors.text.primary} strokeWidth={2.5} />
                                )}
                                <Text style={styles.generateText}>
                                    {isGenerating ? 'Generating' : 'Generate'}
                                </Text>
                            </LinearGradient>
                        </Pressable>
                    </View>
                </View>

                {loading ? null : !hasDemo ? (
                    <EmptyState
                        icon={Sparkles}
                        title="AI stylist coming soon"
                        description="Outfit suggestions and style enhancers will appear here once the stylist API is available"
                    />
                ) : (
                    <>
                        {outfits.length > 0 ? (
                            <>
                                <Text style={styles.sectionLabel}>
                                    Suggested Outfits ({outfits.length})
                                </Text>
                                <View style={styles.outfitList}>
                                    {outfits.map((outfit) => (
                                        <View key={outfit.id} style={styles.outfitCard}>
                                            <View style={styles.outfitHeader}>
                                                <View style={styles.flex}>
                                                    {outfit.fromWardrobe ? (
                                                        <View style={styles.wardrobeBadge}>
                                                            <View style={styles.wardrobeDot} />
                                                            <Text style={styles.wardrobeBadgeText}>
                                                                From Your Wardrobe
                                                            </Text>
                                                        </View>
                                                    ) : null}
                                                    <Text style={styles.outfitName}>{outfit.name}</Text>
                                                    <Text style={styles.outfitOccasion}>{outfit.occasion}</Text>
                                                </View>
                                                <View style={styles.outfitActions}>
                                                    <Pressable
                                                        style={styles.tryOnAction}
                                                        onPress={() => rootNav.navigate('VirtualTryOn')}
                                                    >
                                                        <Camera size={16} color={colors.accent.tryOn} strokeWidth={2.5} />
                                                    </Pressable>
                                                    <Pressable
                                                        style={[
                                                            styles.action,
                                                            favorites.has(outfit.id) && styles.actionFav,
                                                        ]}
                                                        onPress={() => toggleFavorite(outfit.id)}
                                                    >
                                                        <Heart
                                                            size={16}
                                                            color={
                                                                favorites.has(outfit.id)
                                                                    ? colors.accent.warm
                                                                    : colors.text.onDark
                                                            }
                                                            fill={
                                                                favorites.has(outfit.id)
                                                                    ? colors.accent.warm
                                                                    : 'transparent'
                                                            }
                                                            strokeWidth={2.5}
                                                        />
                                                    </Pressable>
                                                    <Pressable style={styles.action}>
                                                        <RefreshCw size={16} color={colors.text.onDarkMuted} strokeWidth={2.5} />
                                                    </Pressable>
                                                </View>
                                            </View>

                                            <ScrollView
                                                horizontal
                                                showsHorizontalScrollIndicator={false}
                                                contentContainerStyle={styles.itemsRail}
                                            >
                                                {outfit.items.map((item) => (
                                                    <Pressable
                                                        key={item.productId}
                                                        style={styles.itemTile}
                                                        onPress={() => openProduct(item.productId)}
                                                    >
                                                        <Image
                                                            source={{ uri: item.image }}
                                                            style={StyleSheet.absoluteFill}
                                                            contentFit="cover"
                                                        />
                                                        <LinearGradient
                                                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                                                            style={StyleSheet.absoluteFill}
                                                        />
                                                        {item.owned ? (
                                                            <View style={styles.ownedDot} />
                                                        ) : (
                                                            <View style={styles.buyBadge}>
                                                                <ShoppingBag size={10} color={colors.text.primary} strokeWidth={3} />
                                                            </View>
                                                        )}
                                                        <Text style={styles.itemName} numberOfLines={1}>
                                                            {item.name}
                                                        </Text>
                                                    </Pressable>
                                                ))}
                                            </ScrollView>

                                            {!outfit.fromWardrobe &&
                                            outfit.items.some((i) => !i.owned) ? (
                                                <View style={styles.completeLook}>
                                                    <Text style={styles.completeTitle}>Complete The Look</Text>
                                                    {outfit.items
                                                        .filter((i) => !i.owned)
                                                        .map((item) => (
                                                            <View key={item.productId} style={styles.buyRow}>
                                                                <Pressable
                                                                    style={styles.buyRowTap}
                                                                    onPress={() => openProduct(item.productId)}
                                                                >
                                                                    <Image
                                                                        source={{ uri: item.image }}
                                                                        style={styles.buyThumb}
                                                                        contentFit="cover"
                                                                    />
                                                                    <View style={styles.flex}>
                                                                        <Text style={styles.buyName}>{item.name}</Text>
                                                                        <Text style={styles.buyPrice}>
                                                                            {formatKES(item.price ?? 0)}
                                                                        </Text>
                                                                    </View>
                                                                </Pressable>
                                                                <Pressable
                                                                    style={styles.buyBtn}
                                                                    onPress={() => {
                                                                        void (async () => {
                                                                            try {
                                                                                await addToCart(item.productId);
                                                                                showToast('Added to cart');
                                                                            } catch (error) {
                                                                                showToast(
                                                                                    error instanceof ApiError
                                                                                        ? error.message
                                                                                        : 'Could not add to cart — try again'
                                                                                );
                                                                            }
                                                                        })();
                                                                    }}
                                                                >
                                                                    <ShoppingBag size={14} color={colors.text.onDark} strokeWidth={2.5} />
                                                                </Pressable>
                                                            </View>
                                                        ))}
                                                </View>
                                            ) : null}
                                        </View>
                                    ))}
                                </View>
                            </>
                        ) : null}

                        {enhancers.length > 0 ? (
                            <View style={styles.enhancerCard}>
                                <Text style={styles.enhancerTitle}>Style Enhancers</Text>
                                <Text style={styles.enhancerSub}>
                                    Items that complement your wardrobe
                                </Text>
                                <View style={styles.enhancerGrid}>
                                    {enhancers.map((item) => (
                                        <Pressable
                                            key={item.productId}
                                            style={styles.enhancerItem}
                                            onPress={() => openProduct(item.productId)}
                                        >
                                            <View style={styles.enhancerImageWrap}>
                                                <Image
                                                    source={{ uri: item.image }}
                                                    style={StyleSheet.absoluteFill}
                                                    contentFit="cover"
                                                />
                                                <LinearGradient
                                                    colors={[colors.accent.warm, colors.accent.terracotta]}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={styles.matchBadge}
                                                >
                                                    <Text style={styles.matchText}>{item.match}% Match</Text>
                                                </LinearGradient>
                                            </View>
                                            <Text style={styles.enhancerName} numberOfLines={1}>
                                                {item.name}
                                            </Text>
                                            <Text style={styles.enhancerPrice}>
                                                {formatKES(item.price)}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        ) : null}
                    </>
                )}

                <View style={styles.bottomSpace} />
            </ScrollView>
        </TabScreenLayout>
    );
};

const styles = StyleSheet.create({
    flex: { flex: 1 },
    header: { paddingHorizontal: spacing.page, paddingTop: spacing.lg },
    title: {
        fontFamily: typography.fontFamily.black,
        fontSize: 34,
        color: colors.text.onDark,
        letterSpacing: -1,
    },
    subtitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        marginTop: 2,
    },
    promptCard: {
        margin: spacing.page,
        padding: spacing.xl,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: colors.background.cardDark,
    },
    promptLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.md,
    },
    promptInput: {
        minHeight: 90,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderWidth: 1,
        borderColor: colors.border.dark,
        borderRadius: radii.lg,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDark,
        textAlignVertical: 'top',
        marginBottom: spacing.md,
    },
    promptFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    promptHint: {
        flex: 1,
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: colors.text.onDarkSubtle,
    },
    generateDisabled: { opacity: 0.4 },
    generateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
    },
    generateText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.text.primary,
        textTransform: 'uppercase',
    },
    sectionLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 2,
        paddingHorizontal: spacing.page,
        marginBottom: spacing.lg,
    },
    outfitList: { paddingHorizontal: spacing.page, gap: spacing.xl },
    outfitCard: {
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: colors.background.cardDark,
        padding: spacing.xl,
    },
    outfitHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: spacing.lg,
    },
    wardrobeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 5,
        backgroundColor: 'rgba(72,205,138,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(72,205,138,0.3)',
        borderRadius: radii.pill,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginBottom: 6,
    },
    wardrobeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.accent.primary,
    },
    wardrobeBadgeText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 9,
        color: colors.accent.primary,
        letterSpacing: 1,
    },
    outfitName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 16,
        color: colors.text.onDark,
    },
    outfitOccasion: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkSubtle,
        marginTop: 2,
    },
    outfitActions: { flexDirection: 'row', gap: spacing.sm, marginLeft: spacing.md },
    action: {
        width: 36,
        height: 36,
        borderRadius: radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    actionFav: {
        backgroundColor: 'rgba(242,184,114,0.2)',
        borderColor: 'rgba(242,184,114,0.4)',
    },
    tryOnAction: {
        width: 36,
        height: 36,
        borderRadius: radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(138,72,205,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(138,72,205,0.3)',
    },
    itemsRail: { gap: spacing.sm },
    itemTile: {
        width: 120,
        height: 120,
        borderRadius: radii.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border.dark,
        justifyContent: 'flex-end',
        padding: 6,
    },
    ownedDot: {
        position: 'absolute',
        top: 6,
        left: 6,
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: colors.accent.primary,
    },
    buyBadge: {
        position: 'absolute',
        top: 5,
        right: 5,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.accent.warm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemName: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 9,
        color: colors.text.onDark,
    },
    completeLook: {
        marginTop: spacing.lg,
        paddingTop: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border.dark,
        gap: spacing.sm,
    },
    completeTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.sm,
    },
    buyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        padding: spacing.md,
    },
    buyRowTap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    buyThumb: { width: 44, height: 44, borderRadius: radii.md },
    buyName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.onDark,
    },
    buyPrice: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.accent.warm,
    },
    buyBtn: {
        width: 32,
        height: 32,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    enhancerCard: {
        margin: spacing.page,
        padding: spacing.xl,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: colors.background.cardDark,
    },
    enhancerTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 15,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    enhancerSub: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkSubtle,
        marginTop: 2,
        marginBottom: spacing.lg,
    },
    enhancerGrid: { flexDirection: 'row', gap: spacing.md },
    enhancerItem: { flex: 1 },
    enhancerImageWrap: {
        aspectRatio: 3 / 4,
        borderRadius: radii.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border.dark,
        marginBottom: spacing.sm,
    },
    matchBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radii.pill,
    },
    matchText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.primary,
    },
    enhancerName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.onDark,
    },
    enhancerPrice: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.accent.warm,
        marginTop: 2,
    },
    bottomSpace: { height: spacing.xxl },
});

export default StylistScreen;
