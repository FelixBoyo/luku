import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    AlertTriangle,
    Calendar,
    CheckCircle,
    ChevronLeft,
    MapPin,
    Package,
    Truck,
} from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog, InfoDialog } from '../components/common/ConfirmDialog';
import { ApiError } from '../api/apiClient';
import { formatKES } from '../lib/format';
import { formatOrderId } from '../lib/orderDisplay';
import {
    orderReachedActionTarget,
    shouldRecheckOrderAfterError,
    type OrderAction,
} from '../lib/orderActionRecovery';
import { repositories } from '../repositories';
import type { Order } from '../types/domain/order';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderTracking'>;

type PendingAction = OrderAction;

const ACTION_SUCCESS: Record<PendingAction, { title: string; description: string }> = {
    'confirm-receipt': {
        title: 'Receipt confirmed',
        description: 'Thanks — your payment will now be released to the seller.',
    },
    ship: {
        title: 'Marked as shipped',
        description: 'The buyer can now confirm receipt once the item arrives.',
    },
    dispute: {
        title: 'Problem reported',
        description: 'This order is on hold and our team will follow up with you shortly.',
    },
};

const OrderTrackingScreen: React.FC<Props> = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [resultDialog, setResultDialog] = useState<{ title: string; description: string } | null>(
        null,
    );
    const [openPayoutOnDismiss, setOpenPayoutOnDismiss] = useState(false);

    const loadOrder = useCallback(() => {
        setLoading(true);
        return repositories.orders
            .getById(route.params.orderId)
            .then((o) => setOrder(o))
            .finally(() => setLoading(false));
    }, [route.params.orderId]);

    useEffect(() => {
        void loadOrder();
    }, [loadOrder]);

    const runAction = useCallback(async () => {
        if (!order || !pendingAction) return;
        setActionLoading(true);
        let refreshed = false;
        try {
            if (pendingAction === 'confirm-receipt') {
                await repositories.orders.confirmReceipt(order.id);
            } else if (pendingAction === 'ship') {
                await repositories.orders.markShipped(order.id);
            } else {
                await repositories.orders.dispute(order.id);
            }
            setResultDialog(ACTION_SUCCESS[pendingAction]);
        } catch (err) {
            const recheck = err instanceof ApiError && shouldRecheckOrderAfterError(err);
            const fresh = recheck
                ? await repositories.orders.getById(order.id).catch(() => null)
                : null;
            if (fresh) {
                refreshed = true;
                setOrder(fresh);
            }

            if (fresh && orderReachedActionTarget(pendingAction, fresh.escrowStatus)) {
                setResultDialog(ACTION_SUCCESS[pendingAction]);
            } else if (err instanceof ApiError && err.status === 409) {
                // The order already moved on (e.g. the auto-release timer beat
                // us). Treat it as done, not an error.
                setResultDialog({
                    title: 'Already updated',
                    description: 'This order has already moved to its next step.',
                });
            } else if (err instanceof ApiError && err.errorCode === 'PAYOUT_DETAILS_REQUIRED') {
                setOpenPayoutOnDismiss(true);
                setResultDialog({
                    title: 'Add payout details',
                    description:
                        'Tell us where to send your money before you mark this order as shipped.',
                });
            } else {
                const message =
                    err instanceof ApiError
                        ? err.message
                        : 'Something went wrong. Please try again.';
                setResultDialog({ title: "That didn't work", description: message });
            }
        } finally {
            setActionLoading(false);
            setPendingAction(null);
            if (!refreshed) void loadOrder();
        }
    }, [order, pendingAction, loadOrder]);

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator color={colors.accent.primary} />
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.container}>
                <View style={[styles.headerBar, { paddingTop: insets.top + spacing.lg }]}>
                    <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <ChevronLeft size={20} color={colors.text.onDark} strokeWidth={2.5} />
                    </Pressable>
                    <View style={styles.headerCopy}>
                        <Text style={styles.title}>ORDER TRACKING</Text>
                    </View>
                </View>
                <EmptyState
                    icon={Package}
                    title="Order not found"
                    description="This order may have been removed or is no longer available"
                />
            </View>
        );
    }

    const currentStep = order.timeline.find((t) => t.current) ?? order.timeline.filter((t) => t.completed).pop();

    const isSeller = order.viewerRole === 'seller';
    const isBuyer = order.viewerRole !== 'seller';
    const canShip =
        isSeller && (order.escrowStatus === 'in_escrow' || order.escrowStatus === 'paid');
    const canConfirmReceipt = isBuyer && order.escrowStatus === 'shipped';
    const canDispute =
        isBuyer && (order.escrowStatus === 'shipped' || order.escrowStatus === 'in_escrow');
    const isDisputed = order.escrowStatus === 'disputed';

    return (
        <View style={styles.container}>
            <View style={[styles.headerBar, { paddingTop: insets.top + spacing.lg }]}>
                <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <ChevronLeft size={20} color={colors.text.onDark} strokeWidth={2.5} />
                </Pressable>
                <View style={styles.headerCopy}>
                    <Text style={styles.title}>ORDER TRACKING</Text>
                    <Text style={styles.orderId}>Order {formatOrderId(order.id)}</Text>
                </View>
            </View>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollBody}
            >

                <View style={[styles.heroCard, isDisputed && styles.heroCardDisputed]}>
                    <View style={styles.heroRow}>
                        <View style={[styles.heroIcon, isDisputed && styles.heroIconDisputed]}>
                            {isDisputed ? (
                                <AlertTriangle size={28} color={colors.status.error} strokeWidth={2.5} />
                            ) : (
                                <Truck size={28} color={colors.text.primary} strokeWidth={2.5} />
                            )}
                        </View>
                        <View style={styles.flex}>
                            <Text style={[styles.heroStatus, isDisputed && styles.heroStatusDisputed]}>
                                {isDisputed ? 'ON HOLD' : (currentStep?.label ?? 'Processing').toUpperCase()}
                            </Text>
                            <Text style={styles.heroTitle}>
                                {isDisputed ? 'This order is on hold' : 'Your order is on its way!'}
                            </Text>
                        </View>
                    </View>
                    {!isDisputed && order.estimatedDelivery ? (
                        <View style={styles.metaRow}>
                            <Calendar size={14} color={colors.text.onDarkMuted} strokeWidth={2.5} />
                            <Text style={styles.metaText}>
                                Estimated delivery: {order.estimatedDelivery}
                            </Text>
                        </View>
                    ) : null}
                    {order.trackingNumber ? (
                        <View style={styles.metaRow}>
                            <Package size={14} color={colors.text.onDarkMuted} strokeWidth={2.5} />
                            <Text style={styles.metaText}>Tracking: {order.trackingNumber}</Text>
                        </View>
                    ) : null}
                </View>

                {isDisputed ? (
                    <View style={styles.section}>
                        <View style={styles.disputeBanner}>
                            <AlertTriangle size={18} color={colors.status.error} strokeWidth={2.5} />
                            <View style={styles.flex}>
                                <Text style={styles.disputeBannerTitle}>
                                    {isBuyer ? 'Your payment is on hold' : 'Payment is on hold'}
                                </Text>
                                <Text style={styles.disputeBannerBody}>
                                    {isBuyer
                                        ? 'A problem was reported on this order, so funds stay held in escrow while our team reviews it — there is nothing more for you to do. If it is resolved in your favor, you get a 100% refund of what you paid; otherwise payment is released to the seller.'
                                        : 'The buyer reported a problem with this order. Payment stays held in escrow while our team reviews it, and we will follow up with next steps.'}
                                </Text>
                            </View>
                        </View>
                    </View>
                ) : null}

                {canShip || canConfirmReceipt || canDispute ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>ACTIONS</Text>
                        {canShip ? (
                            <Pressable
                                style={styles.primaryAction}
                                onPress={() => setPendingAction('ship')}
                            >
                                <Truck
                                    size={18}
                                    color={colors.text.primary}
                                    strokeWidth={2.5}
                                />
                                <Text style={styles.primaryActionText}>Mark as shipped</Text>
                            </Pressable>
                        ) : null}
                        {canConfirmReceipt ? (
                            <Pressable
                                style={styles.primaryAction}
                                onPress={() => setPendingAction('confirm-receipt')}
                            >
                                <CheckCircle
                                    size={18}
                                    color={colors.text.primary}
                                    strokeWidth={2.5}
                                />
                                <Text style={styles.primaryActionText}>Confirm receipt</Text>
                            </Pressable>
                        ) : null}
                        {canDispute ? (
                            <Pressable
                                style={styles.secondaryAction}
                                onPress={() => setPendingAction('dispute')}
                            >
                                <AlertTriangle
                                    size={18}
                                    color={colors.status.error}
                                    strokeWidth={2.5}
                                />
                                <Text style={styles.secondaryActionText}>Report a problem</Text>
                            </Pressable>
                        ) : null}
                        {canConfirmReceipt ? (
                            <Text style={styles.actionHint}>
                                Only confirm once the item is in your hands — this releases
                                payment to the seller.
                            </Text>
                        ) : null}
                    </View>
                ) : null}

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>ORDER TIMELINE</Text>
                    {order.timeline.map((step, idx) => (
                        <View key={step.label} style={styles.timelineRow}>
                            <View style={styles.timelineLeft}>
                                <View
                                    style={[
                                        styles.timelineNode,
                                        step.completed && styles.timelineNodeDone,
                                    ]}
                                >
                                    {step.completed ? (
                                        <CheckCircle
                                            size={20}
                                            color={colors.text.primary}
                                            fill={colors.text.primary}
                                            strokeWidth={2.5}
                                        />
                                    ) : (
                                        <View style={styles.timelineDot} />
                                    )}
                                </View>
                                {idx < order.timeline.length - 1 ? (
                                    <View
                                        style={[
                                            styles.timelineLine,
                                            step.completed && styles.timelineLineDone,
                                        ]}
                                    />
                                ) : null}
                            </View>
                            <View style={styles.timelineBody}>
                                <Text
                                    style={[
                                        styles.timelineLabel,
                                        step.completed && styles.timelineLabelDone,
                                        step.current && styles.timelineLabelCurrent,
                                    ]}
                                >
                                    {step.label}
                                </Text>
                                <Text style={styles.timelineDate}>{step.date}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>ITEMS</Text>
                    {order.items.map((item) => (
                        <View key={item.name} style={styles.itemRow}>
                            <Image source={{ uri: item.imageUrl }} style={styles.itemThumb} contentFit="cover" />
                            <View style={styles.flex}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemSeller}>{item.seller}</Text>
                                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                            </View>
                            <Text style={styles.itemPrice}>
                                {formatKES(item.price * item.quantity)}
                            </Text>
                        </View>
                    ))}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Order Total</Text>
                        <Text style={styles.totalValue}>{formatKES(order.total)}</Text>
                    </View>
                </View>

                <View style={[styles.section, { marginBottom: spacing.xxl }]}>
                    <Text style={styles.sectionLabel}>SHIPPING ADDRESS</Text>
                    <View style={styles.addressCard}>
                        <MapPin size={16} color={colors.accent.primary} strokeWidth={2.5} />
                        <View style={styles.flex}>
                            <Text style={styles.addressName}>{order.shippingAddress.name}</Text>
                            <Text style={styles.addressLine}>{order.shippingAddress.street}</Text>
                            <Text style={styles.addressLine}>
                                {order.shippingAddress.city}, {order.shippingAddress.postal}
                            </Text>
                            <Text style={styles.addressLine}>{order.shippingAddress.phone}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <ConfirmDialog
                visible={pendingAction === 'ship'}
                title="Mark as shipped?"
                description="Tell the buyer this order is on its way. They can confirm receipt once it arrives."
                confirmLabel="Mark as shipped"
                loading={actionLoading}
                onConfirm={runAction}
                onCancel={() => setPendingAction(null)}
            />
            <ConfirmDialog
                visible={pendingAction === 'confirm-receipt'}
                title="Confirm receipt?"
                description="Confirm you've received this order. Your payment is released to the seller and the order is closed."
                confirmLabel="Confirm receipt"
                loading={actionLoading}
                onConfirm={runAction}
                onCancel={() => setPendingAction(null)}
            />
            <ConfirmDialog
                visible={pendingAction === 'dispute'}
                title="Report a problem?"
                description="This opens a dispute and puts the order on hold while our team looks into it. Use this if the item hasn't arrived or isn't as described."
                confirmLabel="Report a problem"
                destructive
                loading={actionLoading}
                onConfirm={runAction}
                onCancel={() => setPendingAction(null)}
            />
            <InfoDialog
                visible={resultDialog !== null}
                title={resultDialog?.title ?? ''}
                description={resultDialog?.description ?? ''}
                onClose={() => {
                    setResultDialog(null);
                    if (openPayoutOnDismiss) {
                        setOpenPayoutOnDismiss(false);
                        // `initial: false` keeps MeMain under PayoutDetails so back works
                        // even when the Me tab has not been opened yet.
                        navigation.navigate('MainTabs', {
                            screen: 'Me',
                            params: {
                                screen: 'PayoutDetails',
                                initial: false,
                                params: { returnToOrderId: order?.id },
                            },
                        });
                    }
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    centered: { alignItems: 'center', justifyContent: 'center' },
    flex: { flex: 1 },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.page,
        paddingBottom: spacing.md,
        backgroundColor: colors.background.shell,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.dark,
    },
    headerCopy: { flex: 1 },
    scrollBody: { paddingTop: spacing.lg },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    title: {
        fontFamily: typography.fontFamily.black,
        fontSize: 18,
        color: colors.text.onDark,
        letterSpacing: -0.5,
    },
    orderId: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        marginTop: 2,
    },
    heroCard: {
        marginHorizontal: spacing.page,
        padding: spacing.xl,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: 'rgba(72,205,138,0.3)',
        backgroundColor: 'rgba(72,205,138,0.1)',
        marginBottom: spacing.xl,
    },
    heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.lg },
    heroIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.accent.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroStatus: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.accent.primary,
        letterSpacing: 1,
    },
    heroTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 18,
        color: colors.text.onDark,
        marginTop: 2,
    },
    heroCardDisputed: {
        borderColor: 'rgba(255,0,68,0.35)',
        backgroundColor: 'rgba(255,0,68,0.1)',
    },
    heroIconDisputed: {
        backgroundColor: colors.status.errorBg,
    },
    heroStatusDisputed: {
        color: colors.status.error,
    },
    disputeBanner: {
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.status.error,
        backgroundColor: 'rgba(255,0,68,0.06)',
    },
    disputeBannerTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.status.error,
        marginBottom: 4,
    },
    disputeBannerBody: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
        lineHeight: 17,
    },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
    metaText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
    },
    section: { paddingHorizontal: spacing.page, marginBottom: spacing.xl },
    sectionLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDarkSubtle,
        letterSpacing: 1.5,
        marginBottom: spacing.lg,
    },
    primaryAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
        backgroundColor: colors.accent.primary,
    },
    primaryActionText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.primary,
    },
    secondaryAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.status.error,
        backgroundColor: 'rgba(255,255,255,0.02)',
        marginTop: spacing.md,
    },
    secondaryActionText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.status.error,
    },
    actionHint: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
        marginTop: spacing.md,
        lineHeight: 17,
    },
    timelineRow: { flexDirection: 'row', marginBottom: spacing.lg, gap: spacing.md },
    timelineLeft: { alignItems: 'center', width: 48 },
    timelineNode: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 2,
        borderColor: colors.border.dark,
    },
    timelineNodeDone: {
        backgroundColor: colors.accent.primary,
        borderColor: colors.accent.primary,
    },
    timelineDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    timelineLine: {
        width: 2,
        flex: 1,
        minHeight: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    timelineLineDone: { backgroundColor: colors.accent.primary },
    timelineBody: { flex: 1, paddingTop: 12 },
    timelineLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDarkSubtle,
    },
    timelineLabelDone: { color: colors.text.onDark },
    timelineLabelCurrent: { color: colors.accent.primary },
    timelineDate: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkSubtle,
        marginTop: 2,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: colors.background.cardDark,
        marginBottom: spacing.sm,
    },
    itemThumb: { width: 64, height: 64, borderRadius: radii.md },
    itemName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
    },
    itemSeller: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
    },
    itemQty: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: colors.text.onDarkSubtle,
        marginTop: 2,
    },
    itemPrice: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border.dark,
        marginTop: spacing.sm,
    },
    totalLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
    },
    totalValue: {
        fontFamily: typography.fontFamily.black,
        fontSize: 18,
        color: colors.accent.primary,
    },
    addressCard: {
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: colors.background.cardDark,
    },
    addressName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
    },
    addressLine: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        marginTop: 2,
    },
});

export default OrderTrackingScreen;
