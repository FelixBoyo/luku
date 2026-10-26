import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { colors, radii, spacing } from '../../theme/tokens';

type Props = {
    count?: number;
};

export const ConnectionRowSkeleton: React.FC<Props> = ({ count = 5 }) => (
    <View style={styles.list}>
        {Array.from({ length: count }, (_, i) => (
            <View key={i} style={styles.row}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <View style={styles.text}>
                    <Skeleton height={14} width="55%" />
                    <Skeleton height={11} width="40%" style={styles.gapSm} />
                </View>
                <Skeleton height={32} width={80} borderRadius={radii.pill} />
            </View>
        ))}
    </View>
);

const styles = StyleSheet.create({
    list: { gap: spacing.sm, padding: spacing.page },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    text: { flex: 1 },
    gapSm: { marginTop: 6 },
});
