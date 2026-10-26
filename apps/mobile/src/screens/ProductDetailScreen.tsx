import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Bookmark,
    Check,
    ChevronLeft,
    ChevronRight,
    MessageCircle,
    Minus,
    Package,
    Plus,
    Share2,
    ShoppingCart,
    Sparkles,
    Star,
    X,
    Zap,
} from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EmptyState } from '../components/common/EmptyState';
import { formatKES } from '../lib/format';
import { isSoldOut, maxSelectableQty } from '../lib/stock';
import { useAppState } from '../context/AppStateContext';
import { useToast } from '../context/ToastContext';
import { useActiveProducts, useProduct } from '../hooks/useProducts';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme/tokens';
import { ApiError } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const SIZE_GUIDE = [
    { size: 'XS', detail: 'Bust 81-84 cm' },
    { size: 'S', detail: 'Bust 86-89 cm' },
    { size: 'M', detail: 'Bust 91-94 cm' },
    { size: 'L', detail: 'Bust 97-100 cm' },
    { size: 'XL', detail: 'Bust 102-105 cm' },
];

const ProductDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const { product, loading, notFound } = useProduct(route.params.productId);
    const { products: catalogProducts } = useActiveProducts();
    const { addToCart, updateCartQty, removeFromCart, cartItems, toggleWishlist, isWishlisted } = useAppState();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [selectedSize, setSelectedSize] = useState('M');
    const [quantity, setQuantity] = useState(1);
    const [showSizeGuide, setShowSizeGuide] = useState(false);

    const cartLine = product ? cartItems.find((line) => line.productId === product.id) : undefined;
    const displayQty = cartLine ? cartLine.quantity : quantity;

    useEffect(() => {
        if (product?.size) setSelectedSize(product.size);
    }, [product?.id, product?.size]);

    const pairsWith = useMemo(
        () =>
            product
                ? catalogProducts
                      .filter((p) => p.id !== product.id && p.aiMatch)
                      .slice(0, 2)
                : [],
        [catalogProducts, product],
    );
    const similar = useMemo(
        () => {
            if (!product) return [];
            const sameCategory = catalogProducts.filter((p) => p.id !== product.id && p.category === product.category);
            const others = catalogProducts.filter((p) => p.id !== product.id && p.category !== product.category);
            return sameCategory.concat(others).slice(0, 3);
        },
        [catalogProducts, product],
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={colors.accent.primary} />
            </View>
        );
    }

    if (notFound || !product) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <Pressable style={styles.notFoundBack} onPress={() => navigation.goBack()}>
                    <ChevronLeft size={22} color={colors.text.onDark} strokeWidth={2.5} />
                </Pressable>
                <EmptyState
                    icon={Package}
                    title="Product not found"
                    description="This item may have been removed or is no longer available."
                    actionLabel="Go back"
                    onAction={() => navigation.goBack()}
                />
            </View>
        );
    }

    const wishlisted = isWishlisted(product.id);
    const reviews = product.reviews ?? [];
    const thumbs = product.images ?? [product.imageUrl, product.imageUrl, product.imageUrl];
    const soldOut = isSoldOut(product);
    const isOwnItem = Boolean(user?.id && product.seller.id === user.id);
    // Zero stock previously failed the `> 0` test and fell through to an
    // unlimited cap, which is how any quantity could be selected on a sold-out
    // item and only fail once it reached the cart.
    const maxQty = maxSelectableQty(product);

    const handleAddToCart = async () => {
        if (!product || soldOut || isOwnItem) return;
        try {
            await addToCart(product.id);
            if (quantity > 1) {
                await updateCartQty(product.id, quantity);
            }
            showToast('Added to cart');
        } catch (error) {
            if (error instanceof ApiError) {
                showToast(error.message);
                return;
            }
            showToast('Could not add to cart — try again');
        }
    };

    const capMessage = () => {
        if (soldOut) return 'Out of stock';
        return maxQty === Number.MAX_SAFE_INTEGER
            ? 'Cannot increase quantity'
            : `Only ${maxQty} left in stock`;
    };

    const handleCartQtyChange = async (delta: number) => {
        if (!product || !cartLine) return;
        const nextQty = cartLine.quantity + delta;
        if (nextQty <= 0) {
            try {
                await removeFromCart(product.id);
            } catch {
                showToast('Could not update quantity — try again');
            }
            return;
        }
        if (nextQty > maxQty) {
            showToast(capMessage());
            return;
        }
        try {
            await updateCartQty(product.id, nextQty);
        } catch {
            showToast('Could not update quantity — try again');
        }
    };

    // The next value is derived from `quantity` rather than inside a setState
    // updater: React may run an updater during render, and toasting from there
    // sets state on ToastProvider mid-render.
    const bumpLocalQty = (delta: number) => {
        if (!product) return;
        const next = quantity + delta;
        if (next < 1) return;
        if (next > maxQty) {
            showToast(capMessage());
            return;
        }
        setQuantity(next);
    };

    return (
        <View style={styles.container}>
            <View style={[styles.floatHeader, { top: insets.top + spacing.sm }]}>
                <Pressable style={styles.glassBtn} onPress={() => navigation.goBack()}>
                    <ChevronLeft size={22} color={colors.text.onDark} strokeWidth={2.5} />
                </Pressable>
                <View style={styles.glassRow}>
                    <Pressable
                        style={styles.glassBtn}
                        onPress={() => toggleWishlist(product.id, {
                            id: product.id,
                            name: product.name,
                            brand: product.brand,
                            price: product.price,
                            imageUrl: product.imageUrl,
                            addedDate: new Date().toLocaleDateString(),
                        })}
                    >
                        <Bookmark
                            size={20}
                            color={wishlisted ? colors.accent.primary : colors.text.onDark}
                            fill={wishlisted ? colors.accent.primary : 'transparent'}
                            strokeWidth={2.5}
                        />
                    </Pressable>
                    <Pressable style={styles.glassBtn}>
                        <Share2 size={20} color={colors.text.onDark} strokeWidth={2.5} />
                    </Pressable>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <Image source={{ uri: product.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    <LinearGradient
                        colors={['transparent', 'transparent', 'rgba(0,0,0,0.95)']}
                        style={StyleSheet.absoluteFill}
                    />
                    {product.isNew || product.condition ? (
                        <View
                            style={[
                                styles.conditionBadge,
                                { top: insets.top + 56 },
                            ]}
                        >
                            <Text style={styles.conditionText}>
                                {product.isNew ? 'NEW' : product.condition}
                            </Text>
                        </View>
                    ) : null}
                </View>

                <View style={styles.thumbStrip}>
                    {thumbs.map((uri, idx) => (
                        <View key={idx} style={styles.thumb}>
                            <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                        </View>
                    ))}
                </View>

                <View style={styles.body}>
                    <Text style={styles.brand}>{product.brand}</Text>
                    <Text style={styles.name}>{product.name}</Text>
                    <View style={styles.ratingRow}>
                        <Star size={14} color={colors.accent.primary} fill={colors.accent.primary} strokeWidth={2.5} />
                        <Text style={styles.ratingValue}>{product.rating ?? 4.8}</Text>
                        <Text style={styles.reviewCount}>({product.reviewCount ?? 0} reviews)</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>{formatKES(product.price)}</Text>
                        {product.originalPrice ? (
                            <Text style={styles.originalPrice}>{formatKES(product.originalPrice)}</Text>
                        ) : null}
                    </View>
                    {product.description ? (
                        <Text style={styles.description}>{product.description}</Text>
                    ) : null}

                    <View style={styles.sizeHeader}>
                        <Text style={styles.blockLabel}>Select Size</Text>
                        <Pressable onPress={() => setShowSizeGuide(true)}>
                            <Text style={styles.sizeGuideLink}>Size Guide</Text>
                        </Pressable>
                    </View>
                    <View style={styles.sizeRow}>
                        {SIZES.map((s) => (
                            <Pressable
                                key={s}
                                style={[styles.sizeBtn, selectedSize === s && styles.sizeBtnActive]}
                                onPress={() => setSelectedSize(s)}
                            >
                                <Text style={[styles.sizeText, selectedSize === s && styles.sizeTextActive]}>
                                    {s}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {!isOwnItem ? (
                        <>
                            <Text style={styles.blockLabel}>Quantity</Text>
                            <View style={styles.qtyRow}>
                                <Pressable
                                    style={styles.qtyBtn}
                                    onPress={() =>
                                        cartLine
                                            ? void handleCartQtyChange(-1)
                                            : bumpLocalQty(-1)
                                    }
                                >
                                    <Minus size={16} color={colors.text.onDark} strokeWidth={3} />
                                </Pressable>
                                <Text style={styles.qtyValue}>{displayQty}</Text>
                                <Pressable
                                    style={styles.qtyBtn}
                                    onPress={() =>
                                        cartLine ? void handleCartQtyChange(1) : bumpLocalQty(1)
                                    }
                                >
                                    <Plus size={16} color={colors.text.onDark} strokeWidth={3} />
                                </Pressable>
                            </View>
                        </>
                    ) : (
                        <Text style={styles.ownItemHint}>This is your item</Text>
                    )}

                    <Pressable
                        style={styles.sellerCard}
                        onPress={() => navigation.navigate('UserProfile', { userId: product.seller.id })}
                    >
                        <Text style={styles.sellerLabel}>SOLD BY</Text>
                        <View style={styles.sellerRow}>
                            {product.seller.avatarUrl ? (
                                <Image source={{ uri: product.seller.avatarUrl }} style={styles.sellerAvatar} contentFit="cover" />
                            ) : (
                                <View style={styles.sellerAvatar} />
                            )}
                            <View style={styles.flex}>
                                <Text style={styles.sellerName}>{product.seller.name}</Text>
                                <View style={styles.sellerMetaRow}>
                                    <Star size={12} color={colors.accent.primary} fill={colors.accent.primary} strokeWidth={3} />
                                    <Text style={styles.sellerMeta}>
                                        {product.seller.rating} · {product.seller.sales} sales
                                    </Text>
                                </View>
                            </View>
                            <ChevronRight size={20} color={colors.text.onDarkMuted} strokeWidth={2.5} />
                        </View>
                        <View style={styles.sellerStats}>
                            <View style={styles.sellerStat}>
                                <Text style={styles.sellerStatValue}>{product.seller.responseRate ?? 98}%</Text>
                                <Text style={styles.sellerStatLabel}>Response Rate</Text>
                            </View>
                            <View style={styles.sellerStat}>
                                <Text style={styles.sellerStatValue}>{product.seller.responseTime ?? '< 2h'}</Text>
                                <Text style={styles.sellerStatLabel}>Response Time</Text>
                            </View>
                        </View>
                        <Pressable
                            style={styles.contactBtn}
                            onPress={() =>
                                navigation.navigate('MainTabs', {
                                    screen: 'Home',
                                    params: { screen: 'Inbox' },
                                })
                            }
                        >
                            <MessageCircle size={16} color={colors.text.onDark} strokeWidth={2.5} />
                            <Text style={styles.contactText}>Contact Seller</Text>
                        </Pressable>
                    </Pressable>

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>PAIRS WELL WITH</Text>
                        <Text style={styles.sectionSub}>AI suggestions based on this item</Text>
                    </View>
                    <View style={styles.pairsList}>
                        {pairsWith.map((p) => (
                            <Pressable
                                key={p.id}
                                style={styles.pairRow}
                                onPress={() => navigation.push('ProductDetail', { productId: p.id })}
                            >
                                <Image source={{ uri: p.imageUrl }} style={styles.pairThumb} contentFit="cover" />
                                <View style={styles.flex}>
                                    <LinearGradient
                                        colors={[colors.accent.warm, colors.accent.terracotta]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.pairMatch}
                                    >
                                        <Sparkles size={11} color={colors.text.primary} strokeWidth={3} />
                                        <Text style={styles.pairMatchText}>{p.aiMatch}%</Text>
                                    </LinearGradient>
                                    <Text style={styles.pairName} numberOfLines={1}>{p.name}</Text>
                                    <Text style={styles.pairPrice}>{formatKES(p.price)}</Text>
                                </View>
                            </Pressable>
                        ))}
                    </View>

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>SIMILAR ITEMS</Text>
                        <Text style={styles.sectionSub}>More from this category</Text>
                    </View>
                    <View style={styles.similarRow}>
                        {similar.map((p) => (
                            <Pressable
                                key={p.id}
                                style={styles.similarCard}
                                onPress={() => navigation.push('ProductDetail', { productId: p.id })}
                            >
                                <View style={styles.similarImage}>
                                    <Image source={{ uri: p.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                                </View>
                                <Text style={styles.similarName} numberOfLines={1}>{p.name}</Text>
                                <Text style={styles.similarPrice}>{formatKES(p.price)}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <View style={styles.reviewsCard}>
                        <Text style={styles.sectionTitle}>CUSTOMER REVIEWS ({reviews.length})</Text>
                        {reviews.map((r, idx) => (
                            <View
                                key={r.name + idx}
                                style={[styles.review, idx < reviews.length - 1 && styles.reviewDivider]}
                            >
                                <View style={styles.reviewHead}>
                                    <View style={styles.reviewNameRow}>
                                        <Text style={styles.reviewName}>{r.name}</Text>
                                        {r.verified ? (
                                            <View style={styles.verifiedPill}>
                                                <Text style={styles.verifiedText}>VERIFIED</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                    <View style={styles.reviewStars}>
                                        {Array.from({ length: r.rating }).map((_, i) => (
                                            <Star key={i} size={11} color={colors.accent.primary} fill={colors.accent.primary} strokeWidth={2.5} />
                                        ))}
                                    </View>
                                </View>
                                <Text style={styles.reviewComment}>{r.comment}</Text>
                                <Text style={styles.reviewDate}>{r.date}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
                {isOwnItem ? (
                    <View style={styles.ownItemFooter}>
                        <Text style={styles.ownItemFooterText}>This is your item</Text>
                    </View>
                ) : cartLine ? (
                    <>
                        <View style={styles.footerCartRow}>
                            <Pressable
                                style={[
                                    styles.footerQtyBtn,
                                    cartLine.quantity <= 1 && styles.footerQtyBtnDisabled,
                                ]}
                                onPress={() => void handleCartQtyChange(-1)}
                            >
                                <Minus size={16} color={colors.text.onDark} strokeWidth={2.5} />
                            </Pressable>
                            <Text style={styles.footerQtyValue}>{cartLine.quantity}</Text>
                            <Pressable
                                style={styles.footerQtyBtn}
                                onPress={() => void handleCartQtyChange(1)}
                            >
                                <Plus size={16} color={colors.text.onDark} strokeWidth={2.5} />
                            </Pressable>
                        </View>
                        <Pressable
                            style={styles.cartBtn}
                            onPress={() => navigation.navigate('Cart')}
                        >
                            <ShoppingCart size={16} color={colors.text.onDark} strokeWidth={2.5} />
                            <Text style={styles.cartBtnText}>Go to Cart</Text>
                        </Pressable>
                    </>
                ) : (
                    <Pressable
                        style={[styles.buyBtn, soldOut && styles.buyBtnDisabled]}
                        onPress={() => void handleAddToCart()}
                        disabled={soldOut}
                        accessibilityState={{ disabled: soldOut }}
                    >
                        <ShoppingCart size={16} color={colors.text.primary} strokeWidth={2.5} />
                        <Text style={styles.buyBtnText}>
                            {soldOut ? 'Out of Stock' : 'Add to Cart'}
                        </Text>
                    </Pressable>
                )}
            </View>

            <Modal visible={showSizeGuide} transparent animationType="fade">
                <Pressable style={styles.modalBackdrop} onPress={() => setShowSizeGuide(false)}>
                    <Pressable style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>SIZE GUIDE</Text>
                            <Pressable onPress={() => setShowSizeGuide(false)}>
                                <X size={22} color={colors.text.secondary} strokeWidth={2.5} />
                            </Pressable>
                        </View>
                        {SIZE_GUIDE.map((row) => (
                            <View key={row.size} style={styles.guideRow}>
                                <Text style={styles.guideSize}>{row.size}</Text>
                                <Text style={styles.guideDetail}>{row.detail}</Text>
                            </View>
                        ))}
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    centered: { alignItems: 'center', justifyContent: 'center' },
    notFoundBack: {
        padding: spacing.page,
        alignSelf: 'flex-start',
    },
    flex: { flex: 1 },
    floatHeader: {
        position: 'absolute',
        left: spacing.page,
        right: spacing.page,
        zIndex: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    glassRow: { flexDirection: 'row', gap: spacing.sm },
    glassBtn: {
        width: 40,
        height: 40,
        borderRadius: radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    hero: { height: 460, position: 'relative' },
    conditionBadge: {
        position: 'absolute',
        left: spacing.page,
        backgroundColor: colors.accent.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: 5,
        borderRadius: radii.sm,
    },
    conditionText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    thumbStrip: {
        flexDirection: 'row',
        gap: spacing.sm,
        paddingHorizontal: spacing.page,
        marginTop: -spacing.xl,
        marginBottom: spacing.lg,
    },
    thumb: {
        width: 64,
        height: 64,
        borderRadius: radii.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: colors.background.muted,
    },
    body: { paddingHorizontal: spacing.page },
    brand: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: colors.text.onDarkMuted,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    name: {
        fontFamily: typography.fontFamily.black,
        fontSize: 30,
        color: colors.text.onDark,
        lineHeight: 34,
    },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
    ratingValue: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.onDark,
    },
    reviewCount: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
    },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.md, marginTop: spacing.md },
    price: {
        fontFamily: typography.fontFamily.black,
        fontSize: 32,
        color: colors.text.onDark,
    },
    originalPrice: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 16,
        color: colors.text.onDarkSubtle,
        textDecorationLine: 'line-through',
    },
    description: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDarkMuted,
        lineHeight: 22,
        marginTop: spacing.lg,
    },
    sizeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.xl,
        marginBottom: spacing.md,
    },
    blockLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sizeGuideLink: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 11,
        color: colors.accent.primary,
        textTransform: 'uppercase',
    },
    sizeRow: { flexDirection: 'row', gap: spacing.sm },
    sizeBtn: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: radii.md,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    sizeBtnActive: { backgroundColor: colors.text.onDark, borderColor: colors.text.onDark },
    sizeText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
    },
    sizeTextActive: { color: colors.text.primary },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
    ownItemHint: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        marginTop: spacing.md,
    },
    qtyBtn: {
        width: 40,
        height: 40,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    qtyValue: {
        fontFamily: typography.fontFamily.black,
        fontSize: 18,
        color: colors.text.onDark,
        width: 40,
        textAlign: 'center',
    },
    sellerCard: {
        marginTop: spacing.xl,
        padding: spacing.xl,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: colors.background.cardDark,
    },
    sellerLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDarkSubtle,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.md,
    },
    sellerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    sellerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    sellerName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 15,
        color: colors.text.onDark,
    },
    sellerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    sellerMeta: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
    },
    sellerStats: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
    sellerStat: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    sellerStatValue: {
        fontFamily: typography.fontFamily.black,
        fontSize: 16,
        color: colors.text.onDark,
    },
    sellerStatLabel: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: colors.text.onDarkMuted,
        marginTop: 2,
    },
    contactBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        marginTop: spacing.md,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    contactText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.onDark,
    },
    sectionHeader: { marginTop: spacing.xl, marginBottom: spacing.lg },
    sectionTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionSub: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkSubtle,
        marginTop: 2,
    },
    pairsList: { gap: spacing.md },
    pairRow: {
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    pairThumb: { width: 72, height: 72, borderRadius: radii.md },
    pairMatch: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radii.pill,
        marginBottom: 4,
    },
    pairMatchText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.primary,
    },
    pairName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
    },
    pairPrice: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
        marginTop: 2,
    },
    similarRow: { flexDirection: 'row', gap: spacing.md },
    similarCard: { flex: 1 },
    similarImage: {
        aspectRatio: 3 / 4,
        borderRadius: radii.lg,
        overflow: 'hidden',
        marginBottom: spacing.sm,
        backgroundColor: colors.background.muted,
    },
    similarName: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 12,
        color: colors.text.onDark,
    },
    similarPrice: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.onDark,
        marginTop: 2,
    },
    reviewsCard: {
        marginTop: spacing.xl,
        marginBottom: 120,
        padding: spacing.xl,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: colors.background.cardDark,
    },
    review: { paddingVertical: spacing.md },
    reviewDivider: { borderBottomWidth: 1, borderBottomColor: colors.border.dark },
    reviewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    reviewNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    reviewName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.onDark,
    },
    verifiedPill: {
        backgroundColor: colors.accent.bright,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: radii.sm,
    },
    verifiedText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 9,
        color: colors.text.onDark,
    },
    reviewStars: { flexDirection: 'row', gap: 2 },
    reviewComment: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        marginTop: 4,
    },
    reviewDate: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: colors.text.onDarkSubtle,
        marginTop: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        gap: spacing.md,
        paddingHorizontal: spacing.page,
        paddingTop: spacing.md,
        backgroundColor: 'rgba(0,0,0,0.95)',
        borderTopWidth: 1,
        borderTopColor: colors.border.dark,
    },
    ownItemFooter: {
        flex: 1,
        paddingVertical: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ownItemFooterText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDarkMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    cartBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.lg,
        borderRadius: radii.xl,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    cartBtnText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
        textTransform: 'uppercase',
    },
    buyBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.lg,
        borderRadius: radii.xl,
        backgroundColor: colors.accent.primary,
    },
    buyBtnDisabled: { opacity: 0.4 },
    buyBtnText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.primary,
        textTransform: 'uppercase',
    },
    footerCartRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
    },
    footerQtyBtn: {
        width: 36,
        height: 36,
        borderRadius: radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    footerQtyBtnDisabled: { opacity: 0.45 },
    footerQtyValue: {
        fontFamily: typography.fontFamily.black,
        fontSize: 16,
        color: colors.text.onDark,
        minWidth: 28,
        textAlign: 'center',
    },
    inCartLabel: {
        marginLeft: spacing.sm,
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
    },
    buyBtnSuccess: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.page,
    },
    modalCard: {
        width: '100%',
        backgroundColor: colors.background.card,
        borderRadius: radii.xl,
        padding: spacing.xl,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 18,
        color: colors.text.primary,
    },
    guideRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderRadius: radii.md,
        backgroundColor: colors.background.muted,
        marginBottom: spacing.sm,
    },
    guideSize: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.primary,
    },
    guideDetail: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.secondary,
    },
});

export default ProductDetailScreen;
