import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Bookmark, Star } from 'lucide-react-native';
import { formatKES } from '../../lib/format';
import { masonryHeight } from '../../lib/masonry';
import { isSoldOut } from '../../lib/stock';
import type { Product } from '../../types/domain/product';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { SoldOutOverlay, SOLD_OUT_IMAGE_OPACITY } from './SoldOutOverlay';

type DiscoverProductCardProps = {
    product: Product;
    index: number;
    onPress: () => void;
    onWishlist: () => void;
    wishlisted: boolean;
};

export const DiscoverProductCard: React.FC<DiscoverProductCardProps> = ({
    product,
    index,
    onPress,
    onWishlist,
    wishlisted,
}) => {
    const height = masonryHeight(index);
    const soldOut = isSoldOut(product);

    return (
        <Pressable
            onPress={onPress}
            style={[styles.card, { height }]}
            accessibilityRole="button"
            accessibilityLabel={soldOut ? `${product.name}, sold out` : product.name}
        >
            <Image
                source={{ uri: product.imageUrl }}
                style={[StyleSheet.absoluteFill, soldOut && { opacity: SOLD_OUT_IMAGE_OPACITY }]}
                contentFit="cover"
            />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.9)']}
                style={StyleSheet.absoluteFill}
            />
            {soldOut ? <SoldOutOverlay /> : null}
            {product.rating && !soldOut ? (
                <View style={styles.ratingPill}>
                    <Star
                        size={11}
                        color={colors.text.primary}
                        fill={colors.text.primary}
                        strokeWidth={3}
                    />
                    <Text style={styles.ratingPillText}>{product.rating}</Text>
                </View>
            ) : null}
            <Pressable
                style={styles.bookmarkBtn}
                onPress={(e) => {
                    e.stopPropagation();
                    onWishlist();
                }}
                hitSlop={8}
            >
                <Bookmark
                    size={16}
                    color={wishlisted ? colors.accent.primary : colors.text.onDark}
                    fill={wishlisted ? colors.accent.primary : 'transparent'}
                    strokeWidth={2.5}
                />
            </Pressable>
            <View style={[styles.label, soldOut && styles.labelSoldOut]}>
                <Text style={styles.brand} numberOfLines={1}>
                    {product.brand}
                </Text>
                <Text style={styles.name} numberOfLines={2}>
                    {product.name}
                </Text>
                <Text style={styles.price}>{formatKES(product.price)}</Text>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: radii.lg,
        overflow: 'hidden',
        justifyContent: 'flex-end',
        backgroundColor: colors.background.muted,
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
    bookmarkBtn: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: { padding: spacing.md },
    labelSoldOut: { opacity: 0.5 },
    brand: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 10,
        color: colors.text.onDarkMuted,
        marginBottom: 2,
    },
    name: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
        marginBottom: spacing.xs,
    },
    price: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.accent.primary,
    },
});
