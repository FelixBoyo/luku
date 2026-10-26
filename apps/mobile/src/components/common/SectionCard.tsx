import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';
import { Card } from './Card';

type SectionCardState = 'default' | 'loading' | 'empty' | 'error';

type SectionCardProps = {
    title: string;
    subtitle?: string;
    badge?: string;
    children?: React.ReactNode;
    state?: SectionCardState;
    emptyMessage?: string;
    errorMessage?: string;
    headerRight?: React.ReactNode;
};

export const SectionCard: React.FC<SectionCardProps> = ({
    title,
    subtitle,
    badge,
    children,
    state = 'default',
    emptyMessage = 'No data available',
    errorMessage = 'Something went wrong',
    headerRight,
}) => {
    const header = (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>{title}</Text>
                    {badge ? <Text style={styles.badge}>{badge}</Text> : null}
                </View>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {headerRight}
        </View>
    );

    if (state === 'loading') {
        return (
            <Card variant="dark" padding="comfortable">
                {header}
                <ActivityIndicator color={colors.accent.primary} style={styles.loader} />
            </Card>
        );
    }

    if (state === 'empty') {
        return (
            <Card variant="dark" padding="comfortable">
                {header}
                <Text style={styles.empty}>{emptyMessage}</Text>
            </Card>
        );
    }

    if (state === 'error') {
        return (
            <Card variant="dark" padding="comfortable">
                {header}
                <Text style={styles.error}>{errorMessage}</Text>
            </Card>
        );
    }

    return (
        <Card variant="dark" padding="comfortable">
            {header}
            {children}
        </Card>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.lg,
    },
    headerLeft: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    title: {
        fontFamily: typography.fontFamily.black,
        fontSize: 16,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        marginTop: spacing.xs,
    },
    badge: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.primary,
        backgroundColor: colors.accent.primary,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
        textTransform: 'uppercase',
    },
    empty: {
        textAlign: 'center',
        fontFamily: typography.fontFamily.semiBold,
        color: colors.text.onDarkMuted,
        paddingVertical: spacing.xxl,
    },
    error: {
        textAlign: 'center',
        fontFamily: typography.fontFamily.semiBold,
        color: colors.status.error,
        paddingVertical: spacing.xxl,
    },
    loader: { marginVertical: spacing.xl },
});
