import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { ChevronRight, Package } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PillTabs } from '../common/PillTabs';
import { EmptyState } from '../common/EmptyState';
import { AppRefreshControl, useRefresh } from '../common/AppRefreshControl';
import { OrderListSkeleton } from '../skeletons/OrderRowSkeleton';
import { formatKES } from '../../lib/format';
import { formatOrderId } from '../../lib/orderDisplay';
import { OrderStatusPill } from './OrderStatusPill';
import { repositories } from '../../repositories';
import { saleBucket, type SaleBucket } from '../../repositories/ordersRepository';
import type { Order } from '../../types/domain/order';
import { useRootNavigation } from '../../navigation/useRootNavigation';
import { colors, radii, spacing, typography } from '../../theme/tokens';

const TABS = [
    { id: 'to_ship', label: 'To ship' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'completed', label: 'Completed' },
    { id: 'issues', label: 'Issues' },
] as const;

type Tab = SaleBucket;

const EMPTY: Record<Tab, { title: string; description: string }> = {
    to_ship: {
        title: 'Nothing to ship',
        description: 'Orders you need to send will show up here',
    },
    shipped: {
        title: 'No shipped sales',
        description: 'Once you mark an order as shipped it will appear here',
    },
    completed: {
        title: 'No completed sales',
        description: 'Released and delivered sales will appear here',
    },
    issues: {
        title: 'No issues',
        description: 'Held, cancelled or refunded sales will appear here',
    },
};

export const SalesTabContent: React.FC = () => {
    const rootNav = useRootNavigation();
    const [tab, setTab] = useState<Tab>('to_ship');
    const [sales, setSales] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSales = useCallback(async () => {
        setSales(await repositories.orders.listSales());
    }, []);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            const run = async () => {
                try {
                    await fetchSales();
                } finally {
                    if (!cancelled) {
                        setLoading(false);
                    }
                }
            };
            void run();
            return () => {
                cancelled = true;
            };
        }, [fetchSales]),
    );

    const { refreshing, onRefresh } = useRefresh(fetchSales);

    const visible = useMemo(
        () => sales.filter((order) => saleBucket(order) === tab),
        [sales, tab],
    );
    const empty = EMPTY[tab];

    return (
        <View style={styles.wrap}>
            <PillTabs tabs={[...TABS]} activeId={tab} onChange={(id) => setTab(id as Tab)} />
            {loading ? (
                <OrderListSkeleton />
            ) : (
                <ScrollView
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {visible.map((order) => (
                        <Pressable
                            key={order.id}
                            style={styles.orderCard}
                            onPress={() =>
                                rootNav.navigate('OrderTracking', { orderId: order.id })
                            }
                        >
                            <View style={styles.orderHead}>
                                <View>
                                    <Text style={styles.orderId}>{formatOrderId(order.id)}</Text>
                                    <Text style={styles.orderDate}>{order.placedDate}</Text>
                                </View>
                                <OrderStatusPill order={order} />
                            </View>
                            <View style={styles.thumbRow}>
                                {order.items.slice(0, 3).map((item) => (
                                    <Image
                                        key={item.name}
                                        source={{ uri: item.imageUrl }}
                                        style={styles.thumb}
                                        contentFit="cover"
                                    />
                                ))}
                            </View>
                            <View style={styles.orderFooter}>
                                <Text style={styles.orderTotal}>{formatKES(order.total)}</Text>
                                <ChevronRight
                                    size={18}
                                    color={colors.text.onDarkMuted}
                                    strokeWidth={2.5}
                                />
                            </View>
                        </Pressable>
                    ))}
                    {visible.length === 0 ? (
                        <EmptyState icon={Package} title={empty.title} description={empty.description} />
                    ) : null}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: { flex: 1 },
    list: { paddingHorizontal: spacing.page, paddingBottom: spacing.md, gap: spacing.md },
    orderCard: {
        padding: spacing.lg,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: colors.background.cardDark,
        gap: spacing.md,
    },
    orderHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    orderId: {
        fontFamily: typography.fontFamily.black,
        fontSize: 15,
        color: colors.text.onDark,
    },
    orderDate: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
        marginTop: 2,
    },
    thumbRow: { flexDirection: 'row', gap: spacing.sm },
    thumb: { width: 56, height: 56, borderRadius: radii.md },
    orderFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    orderTotal: {
        fontFamily: typography.fontFamily.black,
        fontSize: 18,
        color: colors.text.onDark,
    },
});
