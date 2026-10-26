import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Compass, Home, Plus, Sparkles, User } from 'lucide-react-native';
import { colors, spacing, typography } from '../../theme/tokens';

const TAB_CONFIG: Record<
    string,
    { label: string; Icon: typeof Home }
> = {
    Home: { label: 'Home', Icon: Home },
    Discover: { label: 'Discover', Icon: Compass },
    Sell: { label: 'Sell', Icon: Plus },
    Stylist: { label: 'Stylist', Icon: Sparkles },
    Me: { label: 'Me', Icon: User },
};

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
    state,
    descriptors,
    navigation,
}) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const isFocused = state.index === index;
                const config = TAB_CONFIG[route.name];
                if (!config) return null;

                const { label, Icon } = config;
                const color = isFocused
                    ? colors.accent.primary
                    : 'rgba(255,255,255,0.5)';

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });
                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                if (route.name === 'Sell') {
                    return (
                        <Pressable
                            key={route.key}
                            onPress={onPress}
                            style={styles.sellTab}
                            accessibilityRole="button"
                            accessibilityLabel={options.title ?? label}
                        >
                            <View style={styles.sellFab}>
                                <Plus
                                    color={colors.text.primary}
                                    size={24}
                                    strokeWidth={3}
                                />
                            </View>
                            <Text style={[styles.label, { color }]}>
                                {label}
                            </Text>
                        </Pressable>
                    );
                }

                return (
                    <Pressable
                        key={route.key}
                        onPress={onPress}
                        style={styles.tab}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isFocused }}
                        accessibilityLabel={options.title ?? label}
                    >
                        <Icon
                            color={color}
                            size={20}
                            strokeWidth={2.5}
                            fill={isFocused ? color : 'transparent'}
                        />
                        <Text style={[styles.label, { color }]}>{label}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: spacing.sm,
        paddingHorizontal: spacing.sm,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
        paddingVertical: spacing.sm,
    },
    sellTab: {
        flex: 1,
        alignItems: 'center',
        marginTop: -20,
    },
    sellFab: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.accent.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: colors.background.shell,
    },
    label: {
        fontFamily: typography.fontFamily.black,
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
