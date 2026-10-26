import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigationState } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Mail, ShoppingCart } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { useAppState } from '../../context/AppStateContext';
import { useRootNavigation } from '../../navigation/useRootNavigation';

type TopNavProps = {
    showBack?: boolean;
    onBack?: () => void;
    title?: string;
};

const getActiveRouteName = (state: { routes: { name: string; state?: unknown }[]; index: number }): string => {
    const route = state.routes[state.index];
    if (route.state) {
        return getActiveRouteName(route.state as typeof state);
    }
    return route.name;
};

export const TopNav: React.FC<TopNavProps> = ({
    showBack,
    onBack,
    title,
}) => {
    const insets = useSafeAreaInsets();
    const navigation = useRootNavigation();
    const { cartItemCount, inboxUnreadCount } = useAppState();

    const activeRoute = useNavigationState((state) =>
        state ? getActiveRouteName(state as Parameters<typeof getActiveRouteName>[0]) : 'HomeMain',
    );
    const isInbox = activeRoute === 'Inbox';
    const showBackBtn = showBack || isInbox;

    const handleBack = () => {
        if (onBack) onBack();
        else if (isInbox) {
            navigation.navigate('MainTabs', {
                screen: 'Home',
                params: { screen: 'HomeMain' },
            });
        } else navigation.goBack();
    };

    return (
        <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
            <View style={styles.row}>
                {showBackBtn ? (
                    <Pressable
                        onPress={handleBack}
                        style={styles.iconBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                    >
                        <ChevronLeft color={colors.text.onDark} size={22} strokeWidth={2.5} />
                    </Pressable>
                ) : (
                    <Pressable
                        onPress={() =>
                            navigation.navigate('MainTabs', {
                                screen: 'Home',
                                params: { screen: 'Inbox' },
                            })
                        }
                        style={styles.iconBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Inbox"
                    >
                        <Mail color={colors.text.onDark} size={22} strokeWidth={2.5} />
                        {inboxUnreadCount > 0 ? (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    {inboxUnreadCount}
                                </Text>
                            </View>
                        ) : null}
                    </Pressable>
                )}

                <Pressable
                    onPress={() =>
                        navigation.navigate('MainTabs', {
                            screen: 'Home',
                            params: { screen: 'HomeMain' },
                        })
                    }
                    style={styles.logoWrap}
                >
                    <Text style={styles.logo}>{title ?? (isInbox ? 'INBOX' : 'LUKU')}</Text>
                </Pressable>

                <Pressable
                    onPress={() => navigation.navigate('Cart')}
                    style={styles.iconBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Cart"
                >
                    <ShoppingCart
                        color={colors.text.onDark}
                        size={22}
                        strokeWidth={2.5}
                    />
                    {cartItemCount > 0 ? (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{cartItemCount}</Text>
                        </View>
                    ) : null}
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        backgroundColor: 'rgba(0,0,0,0.9)',
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.page,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    iconBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radii.md,
    },
    logoWrap: { flex: 1, alignItems: 'center' },
    logo: {
        fontFamily: typography.fontFamily.black,
        fontSize: 28,
        color: colors.text.onDark,
        letterSpacing: -1,
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: colors.accent.primary,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.primary,
    },
});
