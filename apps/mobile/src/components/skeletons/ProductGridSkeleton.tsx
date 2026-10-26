import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { radii, spacing } from '../../theme/tokens';

export const ProductCardSkeleton: React.FC = () => (
    <View style={styles.card}>
        <Skeleton aspectRatio={3 / 4} borderRadius={radii.lg} />
        <Skeleton height={13} width="75%" style={styles.gapBody} />
        <Skeleton height={11} width="50%" style={styles.gapSm} />
        <Skeleton height={13} width="40%" style={styles.gapSm} />
    </View>
);

type ProductGridSkeletonProps = {
    count?: number;
};

export const ProductGridSkeleton: React.FC<ProductGridSkeletonProps> = ({
    count = 6,
}) => {
    const leftCount = Math.ceil(count / 2);
    const rightCount = count - leftCount;
    return (
        <View style={styles.grid}>
            <View style={styles.col}>
                {Array.from({ length: leftCount }, (_, i) => (
                    <ProductCardSkeleton key={`l${i}`} />
                ))}
            </View>
            <View style={styles.col}>
                {Array.from({ length: rightCount }, (_, i) => (
                    <ProductCardSkeleton key={`r${i}`} />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: { flex: 0, marginBottom: spacing.lg },
    gapBody: { marginTop: spacing.sm },
    gapSm: { marginTop: 4 },
    grid: {
        flexDirection: 'row',
        gap: spacing.md,
        paddingHorizontal: spacing.page,
    },
    col: { flex: 1, gap: 0 },
});
