import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Calendar, Check, MapPin, Package } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { formatKES } from '../lib/format';
import { repositories } from '../repositories';
import type { Order } from '../types/domain/order';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderConfirmation'>;

const FALLBACK_ORDER: Order = {
    id: 'ORD-2026-05-001',
    placedDate: 'May 21, 2026',
    status: 'processing',
    total: 12400,
    estimatedDelivery: 'May 25-28, 2026',
    items: [
        {
            name: 'Wool Coat',
            price: 8900,
            quantity: 1,
            imageUrl: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=400',
            seller: 'ChicBoutique',
        },
    ],
    shippingAddress: {
        name: 'Shannon Martinez',
        street: '123 Moi Avenue',
        city: 'Nairobi',
        postal: '00100',
        phone: '',
    },
    timeline: [],
};

const NEXT_STEPS = [
    "You'll receive a confirmation email shortly",
    'Track your order status in the Orders section',
    'The seller will ship your items within 2-3 days',
    'Rate your purchase after delivery',
];

const OrderConfirmationScreen: React.FC<Props> = ({ navigation, route }) => {
    const orderId = route.params?.orderId ?? FALLBACK_ORDER.id;
    const [order, setOrder] = useState<Order>(FALLBACK_ORDER);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const fetched = await repositories.orders.getById(orderId);
                if (!cancelled && fetched) {
                    setOrder(fetched);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void load();
        return () => {
            cancelled = true;
        };
    }, [orderId]);

    const goToTracking = () =>
        navigation.navigate('OrderTracking', { orderId });

    const continueShopping = () =>
        navigation.navigate('MainTabs', {
            screen: 'Home',
            params: { screen: 'HomeMain' },
        });

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator color={colors.accent.primary} size="large" />
                </View>
            ) : null}
            <ScrollView showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={['rgba(72,205,138,0.3)', 'rgba(58,184,122,0.15)', '#000000']}
                    style={styles.hero}
                >
                    <LinearGradient
                        colors={[colors.accent.gradientStart, colors.accent.gradientEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroCheck}
                    >
                        <Check color={colors.text.primary} size={56} strokeWidth={3} />
                    </LinearGradient>
                    <Text style={styles.heroTitle}>ORDER PLACED!</Text>
                    <Text style={styles.heroSub}>Thank you for your purchase</Text>
                    <View style={styles.orderNoBox}>
                        <Text style={styles.orderNoLabel}>Order Number</Text>
                        <Text style={styles.orderNoValue}>{orderId}</Text>
                    </View>
                </LinearGradient>

                <View style={styles.body}>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconGreen}>
                                <Calendar color={colors.accent.primary} size={22} strokeWidth={2.5} />
                            </View>
                            <View style={styles.flex}>
                                <Text style={styles.infoLabel}>Estimated Delivery</Text>
                                <Text style={styles.infoValueLg}>{order.estimatedDelivery ?? 'TBD'}</Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <View style={styles.infoIcon}>
                                <MapPin color={colors.text.onDark} size={22} strokeWidth={2.5} />
                            </View>
                            <View style={styles.flex}>
                                <Text style={styles.infoLabel}>Delivery Address</Text>
                                <Text style={styles.infoName}>{order.shippingAddress.name}</Text>
                                <Text style={styles.infoMuted}>{order.shippingAddress.street}</Text>
                                <Text style={styles.infoMuted}>
                                    {order.shippingAddress.city}, {order.shippingAddress.postal}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Order Items</Text>
                    <View style={styles.itemList}>
                        {order.items.map((item, index) => (
                            <View key={`${item.name}-${index}`} style={styles.itemRow}>
                                <Image
                                    source={{ uri: item.imageUrl }}
                                    style={styles.itemThumb}
                                    contentFit="cover"
                                />
                                <View style={styles.flex}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemSeller}>Sold by {item.seller}</Text>
                                </View>
                                <Text style={styles.itemPrice}>{formatKES(item.price)}</Text>
                            </View>
                        ))}
                    </View>

                    <Pressable style={styles.primaryBtn} onPress={goToTracking}>
                        <Package color={colors.text.primary} size={18} strokeWidth={2.5} />
                        <Text style={styles.primaryBtnText}>Track Order</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryBtn} onPress={continueShopping}>
                        <Text style={styles.secondaryBtnText}>Continue Shopping</Text>
                        <ArrowRight color={colors.text.onDark} size={18} strokeWidth={2.5} />
                    </Pressable>

                    <View style={styles.nextCard}>
                        <Text style={styles.nextTitle}>What's Next?</Text>
                        {NEXT_STEPS.map((step, idx) => (
                            <View key={step} style={styles.nextRow}>
                                <View style={styles.nextNum}>
                                    <Text style={styles.nextNumText}>{idx + 1}</Text>
                                </View>
                                <Text style={styles.nextText}>{step}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    loadingWrap: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    hero: {
        alignItems: 'center',
        paddingTop: 96,
        paddingBottom: spacing.xxl,
        paddingHorizontal: spacing.page,
    },
    heroCheck: {
        width: 112,
        height: 112,
        borderRadius: 56,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.2)',
        marginBottom: spacing.xl,
    },
    heroTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 40,
        color: colors.text.onDark,
        letterSpacing: -1,
        marginBottom: spacing.sm,
    },
    heroSub: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDarkMuted,
        marginBottom: spacing.xl,
    },
    orderNoBox: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
    },
    orderNoLabel: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 10,
        color: colors.text.onDarkMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 2,
    },
    orderNoValue: {
        fontFamily: typography.fontFamily.black,
        fontSize: 16,
        color: colors.text.onDark,
    },
    body: { paddingHorizontal: spacing.page, paddingBottom: spacing.xxl },
    infoCard: {
        padding: spacing.xl,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.1)',
        gap: spacing.xl,
        marginTop: spacing.xl,
        marginBottom: spacing.xl,
    },
    infoRow: { flexDirection: 'row', gap: spacing.lg },
    infoIconGreen: {
        width: 48,
        height: 48,
        borderRadius: radii.lg,
        backgroundColor: 'rgba(72,205,138,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoIcon: {
        width: 48,
        height: 48,
        borderRadius: radii.lg,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    flex: { flex: 1 },
    infoLabel: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 10,
        color: colors.text.onDarkMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    infoValueLg: {
        fontFamily: typography.fontFamily.black,
        fontSize: 18,
        color: colors.text.onDark,
    },
    infoName: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 14,
        color: colors.text.onDark,
    },
    infoMuted: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
    },
    sectionTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: spacing.lg,
    },
    itemList: { gap: spacing.md, marginBottom: spacing.xl },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
        padding: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    itemThumb: { width: 64, height: 64, borderRadius: radii.md },
    itemName: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 14,
        color: colors.text.onDark,
    },
    itemSeller: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
    },
    itemPrice: {
        fontFamily: typography.fontFamily.black,
        fontSize: 16,
        color: colors.accent.primary,
    },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.text.onDark,
        paddingVertical: 16,
        borderRadius: radii.lg,
        marginBottom: spacing.md,
    },
    primaryBtnText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: 16,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: spacing.xl,
    },
    secondaryBtnText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    nextCard: {
        padding: spacing.xl,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: 'rgba(72,205,138,0.3)',
        backgroundColor: 'rgba(72,205,138,0.08)',
        gap: spacing.md,
    },
    nextTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 18,
        color: colors.text.onDark,
        marginBottom: spacing.sm,
    },
    nextRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
    nextNum: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
    },
    nextNumText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDark,
    },
    nextText: {
        flex: 1,
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDark,
        lineHeight: 20,
    },
});

export default OrderConfirmationScreen;
