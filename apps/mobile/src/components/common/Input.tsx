import React from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    View,
    type TextInputProps,
} from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type InputProps = TextInputProps & {
    label?: string;
    error?: string;
    dark?: boolean;
};

export const Input = React.forwardRef<TextInput, InputProps>(
    ({ label, error, dark = false, style, ...props }, ref) => (
        <View style={styles.wrap}>
            {label ? (
                <Text
                    style={[
                        styles.label,
                        { color: dark ? colors.text.onDarkMuted : colors.text.secondary },
                    ]}
                >
                    {label}
                </Text>
            ) : null}
            <TextInput
                ref={ref}
                placeholderTextColor={
                    dark ? 'rgba(255,255,255,0.3)' : colors.text.secondary
                }
                style={[
                    styles.input,
                    dark && styles.inputDark,
                    error ? styles.inputError : null,
                    style,
                ]}
                {...props}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    )
);
Input.displayName = 'Input';

const styles = StyleSheet.create({
    wrap: { gap: spacing.sm },
    label: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border.default,
        backgroundColor: colors.background.card,
        borderRadius: radii.lg,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md + 2,
        fontSize: 14,
        fontFamily: typography.fontFamily.semiBold,
        color: colors.text.primary,
    },
    inputDark: {
        borderColor: colors.border.dark,
        backgroundColor: colors.background.inputDark,
        color: colors.text.cream,
    },
    inputError: {
        borderColor: colors.status.error,
    },
    error: {
        color: colors.status.error,
        fontSize: 12,
        fontFamily: typography.fontFamily.medium,
    },
});
