import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { radii, spacing } from '../../theme/tokens';

export const EditProfileSkeleton: React.FC = () => (
    <View style={styles.wrap}>
        <Skeleton height={10} width={100} />
        <View style={styles.avatarRow}>
            <Skeleton width={80} height={80} borderRadius={40} />
            <Skeleton height={36} width={120} borderRadius={radii.md} />
        </View>
        {Array.from({ length: 5 }, (_, i) => (
            <View key={i} style={styles.field}>
                <Skeleton height={10} width={80} />
                <Skeleton height={44} borderRadius={radii.md} style={styles.gapSm} />
            </View>
        ))}
        <Skeleton height={10} width={140} style={styles.gapMd} />
        <View style={styles.chips}>
            {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} height={32} width={88} borderRadius={radii.pill} />
            ))}
        </View>
    </View>
);

const styles = StyleSheet.create({
    wrap: { padding: spacing.page, gap: spacing.md },
    avatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    field: { marginTop: spacing.sm },
    gapSm: { marginTop: spacing.sm },
    gapMd: { marginTop: spacing.lg },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
