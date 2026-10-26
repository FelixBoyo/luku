import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Bell } from 'lucide-react-native';
import { ScreenHeader } from '../components/shell/ScreenHeader';
import { FilterChips } from '../components/common/FilterChips';
import { EmptyState } from '../components/common/EmptyState';
import type { RootStackParamList } from '../navigation/types';
import type { AppNotification, NotificationCategory } from '../types/domain/notification';
import { repositories } from '../repositories';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

type Category = 'all' | NotificationCategory;

const CATEGORY_LABELS: Record<Category, string> = {
    all: 'All',
    orders: 'Orders',
    style: 'Style',
    marketplace: 'Marketplace',
};

const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
    const [category, setCategory] = useState<Category>('all');
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    useEffect(() => {
        repositories.notifications.list().then(setNotifications);
    }, []);

    const filtered = useMemo(
        () =>
            category === 'all'
                ? notifications
                : notifications.filter((n) => n.category === category),
        [category, notifications],
    );

    const unreadCount = notifications.filter((n) => n.unread).length;

    const chipOptions = (['all', 'orders', 'style', 'marketplace'] as Category[]).map((id) => {
        const count =
            id === 'all'
                ? notifications.length
                : notifications.filter((n) => n.category === id).length;
        return `${CATEGORY_LABELS[id]} (${count})`;
    });

    const chipValue = `${CATEGORY_LABELS[category]} (${
        category === 'all'
            ? notifications.length
            : notifications.filter((n) => n.category === category).length
    })`;

    const handleChipChange = (label: string) => {
        const match = (Object.keys(CATEGORY_LABELS) as Category[]).find(
            (id) => label.startsWith(CATEGORY_LABELS[id]),
        );
        if (match) setCategory(match);
    };

    const renderItem = ({ item: n }: { item: AppNotification }) => {
        const Icon = n.icon;
        return (
            <Pressable style={[styles.row, n.unread && styles.rowUnread]}>
                <View style={styles.iconWrap}>
                    <Icon size={20} color={colors.accent.primary} strokeWidth={2.5} />
                </View>
                <View style={styles.flex}>
                    <Text style={styles.rowTitle}>{n.title}</Text>
                    <Text style={styles.body}>{n.body}</Text>
                    <Text style={styles.time}>{n.time}</Text>
                </View>
                {n.unread ? <View style={styles.dot} /> : null}
            </Pressable>
        );
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Notifications"
                subtitle={unreadCount > 0 ? `${unreadCount} new` : undefined}
                onBack={() => navigation.goBack()}
            />
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <View style={styles.chipWrap}>
                        <FilterChips
                            options={chipOptions}
                            value={chipValue}
                            onChange={handleChipChange}
                            scrollable
                        />
                    </View>
                }
                ListEmptyComponent={
                    <EmptyState
                        icon={Bell}
                        title="No notifications"
                        description={`Nothing in ${CATEGORY_LABELS[category]} right now`}
                    />
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    list: { paddingBottom: spacing.xxl, flexGrow: 1 },
    chipWrap: { paddingHorizontal: spacing.page, paddingBottom: spacing.md },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        paddingHorizontal: spacing.page,
        paddingVertical: spacing.lg,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border.dark,
    },
    rowUnread: { backgroundColor: 'rgba(72,205,138,0.06)' },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: radii.lg,
        backgroundColor: 'rgba(72,205,138,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    flex: { flex: 1 },
    rowTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
        marginBottom: 4,
    },
    body: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        marginBottom: 4,
    },
    time: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: colors.text.onDarkSubtle,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.accent.primary,
        marginTop: 6,
    },
});

export default NotificationsScreen;
