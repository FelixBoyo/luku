import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { ChevronRight } from 'lucide-react-native';
import { formatKES } from '../../lib/format';
import { formatOrderId } from '../../lib/orderDisplay';
import { OrderStatusPill } from './OrderStatusPill';
import type { Order } from '../../types/domain/order';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type Props = {
    order: Order;
    onPress: () => void;
};

export const OrderCard: React.FC<Props> = ({ order, onPress }) => {
    const visibleItems = order.items.slice(0, 3);
    const extraCount = order.items.length - visibleItems.length;

    return (
        <Pressable
            style={({ pressed }) => [
                styles.orderCard,
                pressed && styles.orderCardPressed,
            ]}
            onPress={onPress}
        >
            <View style={styles.orderHead}>
                <View>
                    <Text style={styles.orderId}>{formatOrderId(order.id)}</Text>
                    <Text style={styles.orderDate}>{order.placedDate}</Text>
                </View>
                <OrderStatusPill order={order} />
            </View>
            <View style={styles.thumbRow}>
                {visibleItems.map((item, index) => (
                    <Image
                        key={`${item.name}-${index}`}
                        source={{ uri: item.imageUrl }}
                        style={styles.thumb}
                        contentFit="cover"
                    />
                ))}
                {extraCount > 0 ? (
                    <View style={styles.extraThumb}>
                        <Text style={styles.extraThumbText}>+{extraCount}</Text>
                    </View>
                ) : null}
            </View>
            <View style={styles.orderFooter}>
                <Text style={styles.orderTotal}>{formatKES(order.total)}</Text>
                <ChevronRight size={18} color={colors.text.onDarkMuted} strokeWidth={2.5} />
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    orderCard: {
        padding: spacing.lg,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: colors.background.cardDark,
        gap: spacing.md,
    },
    orderCardPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.99 }],
    },
    orderHead: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    orderId: {
        fontFamily: typography.fontFamily.black,
        fontSize: 15,
        color: colors.text.onDark,
    },
    orderDate: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
        marginTop: 2,
    },
    thumbRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        alignItems: 'center',
    },
    thumb: {
        width: 56,
        height: 56,
        borderRadius: radii.md,
        backgroundColor: colors.background.inputDark,
    },
    extraThumb: {
        width: 56,
        height: 56,
        borderRadius: radii.md,
        backgroundColor: colors.background.inputDark,
        borderWidth: 1,
        borderColor: colors.border.dark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    extraThumbText: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
    },
    orderFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    orderTotal: {
        fontFamily: typography.fontFamily.black,
        fontSize: 18,
        color: colors.text.onDark,
    },
});
