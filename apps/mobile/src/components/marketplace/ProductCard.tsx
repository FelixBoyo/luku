import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Sparkles,Camera } from 'lucide-react-native';
import { formatKES } from '../../lib/format';
import { isSoldOut } from '../../lib/stock';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import type { Product } from '../../types/domain/product';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { SoldOutOverlay, SOLD_OUT_IMAGE_OPACITY } from './SoldOutOverlay';

type ProductCardProps = {
    product: Product;
    onPress: () => void;
    onTryOn?: () => void;
    variant?: 'grid' | 'rail';
};
export const ProductCard: React.FC<ProductCardProps> = ({
    product,
    onPress,
    onTryOn,
    variant = 'grid',
}) => {
    const { user } = useAuth();
    // Sold-out cards stay tappable so the detail screen can explain itself; the
    // dimming and badge are what stop the item reading as buyable.
    const soldOut = isSoldOut(product);
    const isOwn = Boolean(user?.id && product.seller.id === user.id);
    

    return (
        <Pressable
            onPress={onPress}
            style={[styles.card, variant === 'rail' && styles.railCard]}
            accessibilityRole="button"
            accessibilityLabel={
                soldOut
                    ? `${product.name}, sold out`
                    : isOwn
                      ? `${product.name}, yours`
                      : product.name
            }
        >
            <View style={styles.imageWrap}>
                <Image
                    source={{ uri: product.imageUrl }}
                    style={[styles.image, soldOut && { opacity: SOLD_OUT_IMAGE_OPACITY }]}
                    contentFit="cover"
                />
                {soldOut ? <SoldOutOverlay /> : null}
                {isOwn ? (
                    <View style={[styles.yoursPos, soldOut ? styles.yoursPosRight : styles.yoursPosLeft]}>
                        <Text style={styles.yoursText}>YOURS</Text>
                    </View>
                ) : null}
                {product.isTrending && !soldOut && !isOwn ? (
                    <View style={styles.badgePos}>
                        <Badge label="HOT" variant="trending" />
                    </View>
                ) : null}
                {product.aiMatch && product.aiMatch >= 90 && !soldOut ? (
                    <View style={styles.matchBadge}>
                        <Sparkles size={10} color={colors.text.primary} strokeWidth={3} />
                        <Text style={styles.matchText}>{product.aiMatch}%</Text>
                    </View>
                ) : null}
            </View>
            <View style={[styles.body, soldOut && styles.bodySoldOut]}>
                <Text style={styles.name} numberOfLines={1}>
                    {product.name}
                </Text>
                <Text style={styles.brand} numberOfLines={1}>
                    {product.brand}
                </Text>
                <Text style={styles.price}>{formatKES(product.price)}</Text>

                {product.tryOnAvailable && onTryOn && (
                    <Pressable
                        onPress={onTryOn}
                        style={styles.tryOnButton}
                    >
                        <Camera size={14} color={colors.accent.tryOn} />
                        <Text style={styles.tryOnText}>Try On</Text>
                    </Pressable>
                )}
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: { flex: 1, marginBottom: spacing.lg },
    railCard: { width: 140, flex: 0 },
    imageWrap: {
        aspectRatio: 3 / 4,
        borderRadius: radii.lg,
        overflow: 'hidden',
        backgroundColor: colors.background.muted,
    },
    image: { width: '100%', height: '100%' },
    badgePos: { position: 'absolute', top: 8, left: 8 },
    yoursPos: {
        position: 'absolute',
        top: 8,
        backgroundColor: colors.background.shell,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: radii.sm,
    },
    yoursPosLeft: { left: 8 },
    yoursPosRight: { right: 8 },
    yoursText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 9,
        letterSpacing: 0.6,
        color: colors.text.onDark,
    },
    matchBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.accent.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radii.pill,
    },
    matchText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.primary,
    },
    body: { marginTop: spacing.sm, gap: 2 },
    bodySoldOut: { opacity: 0.5 },
    name: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 13,
        color: colors.text.onDark,
    },
    brand: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: colors.text.onDarkMuted,
    },
    price: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.accent.primary,
        marginTop: 2,
    },
    tryOnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginTop: 8,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
},

tryOnText: {
    color: colors.accent.tryOn,
    fontSize: 12,
    fontWeight: '600',
},
});
