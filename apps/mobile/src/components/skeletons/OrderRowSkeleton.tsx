import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { colors, radii, spacing } from '../../theme/tokens';

export const OrderRowSkeleton: React.FC = () => (
    <View style={styles.card}>
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <Skeleton height={15} width={120} />
                <Skeleton height={12} width={80} style={styles.gapSm} />
            </View>
            <Skeleton height={24} width={88} borderRadius={radii.sm} />
        </View>
        <View style={styles.thumbRow}>
            <Skeleton width={56} height={56} borderRadius={radii.md} />
            <Skeleton width={56} height={56} borderRadius={radii.md} />
            <Skeleton width={56} height={56} borderRadius={radii.md} />
        </View>
        <View style={styles.footer}>
            <Skeleton height={18} width={100} />
            <Skeleton width={20} height={20} borderRadius={radii.sm} />
        </View>
    </View>
);

type OrderListSkeletonProps = { count?: number };

export const OrderListSkeleton: React.FC<OrderListSkeletonProps> = ({ count = 3 }) => (
    <View style={styles.list}>
        {Array.from({ length: count }, (_, i) => (
            <OrderRowSkeleton key={i} />
        ))}
    </View>
);

const styles = StyleSheet.create({
    list: { paddingHorizontal: spacing.page, gap: spacing.md },
    card: {
        padding: spacing.lg,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: colors.background.cardDark,
        gap: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerLeft: { gap: 0 },
    thumbRow: { flexDirection: 'row', gap: spacing.sm },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    gapSm: { marginTop: 6 },
});
