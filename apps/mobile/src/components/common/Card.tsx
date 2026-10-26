import React from 'react';
import {
    Pressable,
    StyleSheet,
    View,
    type StyleProp,
    type ViewStyle,
} from 'react-native';
import { colors, radii, spacing } from '../../theme/tokens';

type CardVariant = 'default' | 'elevated' | 'muted' | 'dark';

type CardProps = {
    children: React.ReactNode;
    variant?: CardVariant;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
    padding?: 'comfortable' | 'compact' | 'none';
};

export const Card: React.FC<CardProps> = ({
    children,
    variant = 'default',
    onPress,
    style,
    padding = 'comfortable',
}) => {
    const content = (
        <View
            style={[
                styles.base,
                variant === 'default' && styles.default,
                variant === 'elevated' && styles.elevated,
                variant === 'muted' && styles.muted,
                variant === 'dark' && styles.dark,
                padding === 'comfortable' && styles.padComfortable,
                padding === 'compact' && styles.padCompact,
                style,
            ]}
        >
            {children}
        </View>
    );

    if (onPress) {
        return (
            <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.9 }}>
                {content}
            </Pressable>
        );
    }
    return content;
};

const styles = StyleSheet.create({
    base: { borderRadius: radii.xl, overflow: 'hidden' },
    default: {
        backgroundColor: colors.background.card,
        borderWidth: 2,
        borderColor: colors.border.black30,
    },
    elevated: {
        backgroundColor: colors.background.card,
        borderWidth: 2,
        borderColor: colors.border.black30,
    },
    muted: {
        backgroundColor: colors.background.muted,
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.2)',
    },
    dark: {
        backgroundColor: colors.background.cardDark,
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    padComfortable: { padding: spacing.xl },
    padCompact: { padding: spacing.lg },
});
