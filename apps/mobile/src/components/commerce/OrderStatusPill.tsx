import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { orderStatusColors, orderStatusLabel } from '../../lib/orderDisplay';
import type { Order } from '../../types/domain/order';
import { radii, spacing, typography } from '../../theme/tokens';

type Props = {
    order: Pick<Order, 'status' | 'escrowStatus'>;
    /** Me uses fully rounded pills; the order lists use squared ones. */
    rounded?: boolean;
};

export const OrderStatusPill = ({ order, rounded = false }: Props) => {
    const tone = orderStatusColors(order);
    return (
        <View
            style={[
                styles.pill,
                rounded && styles.rounded,
                { backgroundColor: tone.background },
            ]}
        >
            <Text style={[styles.text, { color: tone.text }]}>{orderStatusLabel(order)}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    pill: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.sm,
    },
    rounded: { borderRadius: radii.pill },
    text: {
        fontFamily: typography.fontFamily.black,
        fontSize: 9,
        textTransform: 'uppercase',
    },
});
