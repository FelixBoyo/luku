import React from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    type StyleProp,
    type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, typography } from '../../theme/tokens';

type GradientButtonProps = {
    label: string;
    onPress?: () => void;
    loading?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
};

export const GradientButton: React.FC<GradientButtonProps> = ({
    label,
    onPress,
    loading = false,
    disabled = false,
    style,
}) => {
    const isDisabled = disabled || loading;
    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            accessibilityRole="button"
            style={({ pressed }) => [
                { opacity: isDisabled ? 0.5 : pressed ? 0.92 : 1 },
                style,
            ]}
        >
            <LinearGradient
                colors={[colors.accent.gradientStart, colors.accent.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {loading ? (
                    <ActivityIndicator color={colors.text.primary} />
                ) : (
                    <Text style={styles.label}>{label}</Text>
                )}
            </LinearGradient>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    gradient: {
        paddingVertical: 16,
        borderRadius: radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.primary,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
});
