import React from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    type PressableProps,
    type StyleProp,
    type ViewStyle,
} from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = PressableProps & {
    label: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    fullWidth?: boolean;
    style?: StyleProp<ViewStyle>;
};

const sizeStyles = {
    sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
    md: { paddingVertical: spacing.md + 2, paddingHorizontal: spacing.xl },
    lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
};

const variantStyles: Record<
    ButtonVariant,
    { bg: string; text: string; border?: string }
> = {
    primary: { bg: colors.background.shell, text: colors.text.onDark },
    secondary: {
        bg: colors.background.card,
        text: colors.text.primary,
        border: colors.border.black30,
    },
    ghost: { bg: 'transparent', text: colors.text.onDark },
    accent: { bg: colors.accent.primary, text: colors.text.primary },
    destructive: { bg: colors.status.error, text: colors.text.onDark },
};

export const Button: React.FC<ButtonProps> = ({
    label,
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    disabled,
    style,
    ...props
}) => {
    const v = variantStyles[variant];
    const isDisabled = disabled || loading;

    return (
        <Pressable
            accessibilityRole="button"
            disabled={isDisabled}
            style={({ pressed }) => [
                styles.base,
                sizeStyles[size],
                {
                    backgroundColor: v.bg,
                    borderColor: v.border,
                    borderWidth: v.border ? 2 : 0,
                    opacity: isDisabled ? 0.5 : pressed ? 0.9 : 1,
                    alignSelf: fullWidth ? 'stretch' : 'auto',
                },
                style,
            ]}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={v.text} />
            ) : (
                <Text style={[styles.label, { color: v.text }]}>{label}</Text>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
