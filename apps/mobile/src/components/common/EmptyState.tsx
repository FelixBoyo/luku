import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type Props = {
    icon?: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
};

export const EmptyState: React.FC<Props> = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
}) => (
    <View style={styles.wrap}>
        {Icon ? (
            <View style={styles.iconCircle}>
                <Icon size={32} color={colors.text.onDarkSubtle} strokeWidth={2} />
            </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
        {actionLabel && onAction ? (
            <Pressable style={styles.action} onPress={onAction}>
                <Text style={styles.actionText}>{actionLabel}</Text>
            </Pressable>
        ) : null}
    </View>
);

const styles = StyleSheet.create({
    wrap: {
        alignItems: 'center',
        paddingVertical: spacing.xxl * 2,
        paddingHorizontal: spacing.page,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontFamily: typography.fontFamily.black,
        fontSize: 16,
        color: colors.text.onDark,
        textAlign: 'center',
    },
    description: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        marginTop: spacing.sm,
        textAlign: 'center',
        lineHeight: 20,
    },
    action: {
        marginTop: spacing.xl,
        backgroundColor: colors.text.onDark,
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
    },
    actionText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
