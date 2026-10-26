import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { colors, radii, spacing } from '../../theme/tokens';

export const InboxRowSkeleton: React.FC = () => (
    <View style={styles.thread}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={styles.body}>
            <Skeleton height={14} width="50%" />
            <Skeleton height={12} width="85%" style={styles.gap} />
        </View>
        <Skeleton height={10} width={32} />
    </View>
);

type InboxListSkeletonProps = { count?: number };

export const InboxListSkeleton: React.FC<InboxListSkeletonProps> = ({ count = 6 }) => (
    <View style={styles.list}>
        {Array.from({ length: count }, (_, i) => (
            <InboxRowSkeleton key={i} />
        ))}
    </View>
);

const styles = StyleSheet.create({
    list: { padding: spacing.page, gap: spacing.sm },
    thread: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        backgroundColor: colors.background.cardDark,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    body: { flex: 1 },
    gap: { marginTop: spacing.sm },
});
