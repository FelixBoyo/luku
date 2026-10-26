import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { ChevronRight, Package } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PillTabs } from '../common/PillTabs';
import { ViewAllLink } from '../common/ViewAllLink';
import { EmptyState } from '../common/EmptyState';
import { AppRefreshControl, useRefresh } from '../common/AppRefreshControl';
import { OrderListSkeleton } from '../skeletons/OrderRowSkeleton';
import { formatKES } from '../../lib/format';
import { formatOrderId } from '../../lib/orderDisplay';
import { OrderStatusPill } from './OrderStatusPill';
import { repositories } from '../../repositories';
import type { Order, Return } from '../../types/domain/order';
import { useRootNavigation } from '../../navigation/useRootNavigation';
import { colors, radii, spacing, typography } from '../../theme/tokens';

const TABS = [
    { id: 'active', label: 'Active' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'returns', label: 'Returns' },
] as const;

type Tab = (typeof TABS)[number]['id'];

const returnStatusLabel: Record<Return['status'], string> = {
    requested: 'REQUESTED',
    approved: 'APPROVED',
    received: 'RECEIVED',
    refunded: 'REFUNDED',
    rejected: 'REJECTED',
};

export const PurchasesTabContent: React.FC = () => {
    const rootNav = useRootNavigation();
    const [tab, setTab] = useState<Tab>('active');
    const [activeOrders, setActiveOrders] = useState<Order[]>([]);
    const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
    const [returns, setReturns] = useState<Return[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = useCallback(async () => {
        const [active, delivered, returnList] = await Promise.all([
            repositories.orders.listActive(),
            repositories.orders.listDelivered(),
            repositories.orders.listReturns(),
        ]);
        setActiveOrders(active);
        setDeliveredOrders(delivered);
        setReturns(returnList);
    }, []);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            const run = async () => {
                try {
                    await fetchOrders();
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
        }, [fetchOrders]),
    );

    const { refreshing, onRefresh } = useRefresh(fetchOrders);

    const currentOrders = tab === 'active' ? activeOrders : tab === 'delivered' ? deliveredOrders : [];
    const emptyTitle =
        tab === 'active'
            ? 'No active orders'
            : tab === 'delivered'
              ? 'No delivered orders'
              : 'No returns';

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
                    {tab === 'active'
                        ? activeOrders.map((order) => (
                              <Pressable
                                  key={order.id}
                                  style={styles.orderCard}
                                  onPress={() =>
                                      rootNav.navigate('OrderTracking', { orderId: order.id })
                                  }
                              >
                                  <View style={styles.orderHead}>
                                      <View>
                                          <Text style={styles.orderId}>
                                              {formatOrderId(order.id)}
                                          </Text>
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
                                      <ChevronRight size={18} color={colors.text.onDarkMuted} strokeWidth={2.5} />
                                  </View>
                              </Pressable>
                          ))
                        : null}

                    {tab === 'delivered'
                        ? deliveredOrders.map((order) => (
                              <Pressable
                                  key={order.id}
                                  style={styles.orderCard}
                                  onPress={() =>
                                      rootNav.navigate('OrderTracking', { orderId: order.id })
                                  }
                              >
                                  <View style={styles.orderHead}>
                                      <View>
                                          <Text style={styles.orderId}>
                                              {formatOrderId(order.id)}
                                          </Text>
                                          <Text style={styles.orderDate}>{order.placedDate}</Text>
                                      </View>
                                      <OrderStatusPill order={order} />
                                  </View>
                                  <View style={styles.thumbRow}>
                                      {order.items.map((item) => (
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
                                      <ChevronRight size={18} color={colors.text.onDarkMuted} strokeWidth={2.5} />
                                  </View>
                              </Pressable>
                          ))
                        : null}

                    {tab === 'returns'
                        ? returns.map((ret) => (
                              <View key={ret.id} style={styles.orderCard}>
                                  <View style={styles.orderHead}>
                                      <View>
                                          <Text style={styles.orderId}>
                                              {formatOrderId(ret.id)}
                                          </Text>
                                          <Text style={styles.orderDate}>
                                              Order {formatOrderId(ret.orderId)} · {ret.date}
                                          </Text>
                                      </View>
                                      <View style={styles.statusPill}>
                                          <Text style={styles.statusText}>
                                              {returnStatusLabel[ret.status]}
                                          </Text>
                                      </View>
                                  </View>
                                  <Text style={styles.returnReason}>{ret.reason}</Text>
                                  <Text style={styles.refundAmount}>
                                      Refund: {formatKES(ret.refundAmount)}
                                  </Text>
                              </View>
                          ))
                        : null}

                    {tab !== 'returns' && currentOrders.length === 0 ? (
                        <EmptyState icon={Package} title={emptyTitle} description="Your orders will appear here" />
                    ) : null}
                    {tab === 'returns' && returns.length === 0 ? (
                        <EmptyState icon={Package} title={emptyTitle} description="Your returns will appear here" />
                    ) : null}
                </ScrollView>
            )}
            <ViewAllLink
                label="Manage all orders"
                onPress={() => rootNav.navigate('Orders')}
            />
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
    statusPill: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.sm,
        backgroundColor: 'rgba(72,205,138,0.3)',
    },
    statusText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 9,
        color: colors.accent.primary,
    },
    thumbRow: { flexDirection: 'row', gap: spacing.sm },
    thumb: { width: 56, height: 56, borderRadius: radii.md },
    orderFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    orderTotal: {
        fontFamily: typography.fontFamily.black,
        fontSize: 18,
        color: colors.text.onDark,
    },
    returnReason: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
    },
    refundAmount: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.accent.warm,
    },
});
