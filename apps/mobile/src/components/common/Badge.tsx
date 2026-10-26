import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type BadgeVariant = 'accent' | 'dark' | 'trending';

type BadgeProps = {
    label: string;
    variant?: BadgeVariant;
    style?: ViewStyle;
};

export const Badge: React.FC<BadgeProps> = ({
    label,
    variant = 'accent',
    style,
}) => (
    <View
        style={[
            styles.base,
            variant === 'accent' && styles.accent,
            variant === 'dark' && styles.dark,
            variant === 'trending' && styles.trending,
            style,
        ]}
    >
        <Text
            style={[
                styles.text,
                variant === 'dark' ? styles.textOnDark : styles.textOnAccent,
            ]}
        >
            {label}
        </Text>
    </View>
);

const styles = StyleSheet.create({
    base: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radii.sm,
        alignSelf: 'flex-start',
    },
    accent: { backgroundColor: colors.accent.primary },
    dark: { backgroundColor: colors.background.shell },
    trending: { backgroundColor: colors.accent.primary },
    text: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        textTransform: 'uppercase',
    },
    textOnAccent: { color: colors.text.primary },
    textOnDark: { color: colors.text.onDark },
});
