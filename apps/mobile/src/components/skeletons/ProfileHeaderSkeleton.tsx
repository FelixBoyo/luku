import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { colors, radii, spacing } from '../../theme/tokens';

const StatSkeleton: React.FC = () => (
    <View style={styles.stat}>
        <Skeleton height={17} width={36} />
        <Skeleton height={11} width={52} style={styles.gapSm} />
    </View>
);

type ProfileHeaderSkeletonProps = {
    variant?: 'me' | 'user';
};

export const ProfileHeaderSkeleton: React.FC<ProfileHeaderSkeletonProps> = ({
    variant = 'me',
}) => (
    <View style={styles.header}>
        <View style={styles.headerRow}>
            <Skeleton width={72} height={72} borderRadius={36} />
            <View style={styles.flex}>
                <Skeleton height={20} width="55%" style={styles.name} />
                {variant === 'user' ? (
                    <Skeleton height={12} width="35%" style={styles.handle} />
                ) : null}
                <View style={styles.statsRow}>
                    <StatSkeleton />
                    <View style={styles.statDivider} />
                    <StatSkeleton />
                    <View style={styles.statDivider} />
                    <StatSkeleton />
                </View>
            </View>
        </View>
        {variant === 'user' ? (
            <>
                <Skeleton height={12} width="90%" style={styles.bio} />
                <Skeleton height={12} width="70%" style={styles.bioLine} />
            </>
        ) : null}
        <View style={styles.actionRow}>
            <Skeleton height={44} flex borderRadius={radii.lg} />
            <Skeleton height={44} flex borderRadius={radii.lg} />
        </View>
    </View>
);

const styles = StyleSheet.create({
    header: { paddingHorizontal: spacing.page, paddingTop: spacing.lg },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    flex: { flex: 1 },
    name: { marginBottom: spacing.sm },
    handle: { marginBottom: spacing.sm },
    statsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    stat: { alignItems: 'center' },
    statDivider: {
        width: 1,
        height: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    bio: { marginTop: spacing.lg },
    bioLine: { marginTop: spacing.sm },
    actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
    gapSm: { marginTop: 6 },
});
