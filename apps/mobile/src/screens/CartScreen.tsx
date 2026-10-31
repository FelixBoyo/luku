import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Lock,
    MapPin,
    Minus,
    Plus,
    ShoppingBag,
    Smartphone,
    Trash2,
    Truck,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { AppRefreshControl, useRefresh } from '../components/common/AppRefreshControl';
import { useAppState, type CartLine } from '../context/AppStateContext';
import { formatKES } from '../lib/format';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme/tokens';
import { apiGet, apiPost, ApiError } from '../api/apiClient';
import { repositories } from '../repositories';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { USE_MOCK_DATA } from '../lib/config';
import { isCardCheckoutReady } from '../lib/cardCheckout';
import {
    getMpesaPhoneValidationError,
    isMpesaPhoneValidForCheckout,
} from '../lib/mpesaPhone';
import {
    KENYA_MPESA_PHONE_VALIDATION_MESSAGE,
    parseKenyaMpesaPhoneForPaystack,
} from '@core/validation';
import { VAT_RATE, calculateVat } from '../../../../packages/contracts/src/pricing';
import { loadSavedShippingAddress, saveShippingAddress } from '../lib/savedShippingAddress';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

type Step = 'cart' | 'shipping' | 'payment' | 'complete';

type MpesaStatusPayload = {
    paymentRequestId: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    customerMessage: string;
};

type CheckoutItem = {
    id: string;
    name: string;
    brand: string;
    price: number;
    imageUrl: string;
    quantity: number;
    color: string;
};

type SellerGroup = {
    businessId: string;
    sellerName: string;
    lines: CartLine[];
};

/** Escrow pays one seller per order (ADR D9), so sold-out lines cannot ride along. */
const isLineAvailable = (line: CartLine): boolean =>
    line.isActive !== false && line.stockQuantity !== 0;

const STEPS: { key: Step; label: string; icon: LucideIcon }[] = [
    { key: 'cart', label: 'Cart', icon: ShoppingBag },
    { key: 'shipping', label: 'Shipping', icon: MapPin },
    { key: 'payment', label: 'Payment', icon: CreditCard },
    { key: 'complete', label: 'Complete', icon: CheckCircle },
];

const COLORS = ['Camel', 'Black', 'Beige', 'Brown'];

const pollPaymentStatus = async (paymentRef: string): Promise<boolean> => {
    const startTime = Date.now();
    const timeout = 35000; // 35 seconds timeout
    
    while (Date.now() - startTime < timeout) {
        try {
            const statusRes = await apiGet<{ status: string }>(`/v1/api/payments/mpesa/requests/${paymentRef}`);
            if (statusRes.data?.status === 'COMPLETED') {
                return true;
            }
            if (statusRes.data?.status === 'FAILED' || statusRes.data?.status === 'CANCELLED') {
                return false;
            }
        } catch (err) {
            console.error('Error polling payment status:', err);
        }
        // Wait 2.5 seconds before next poll
        await new Promise<void>((resolve) => setTimeout(() => resolve(), 2500));
    }
    return false; // Timed out
};

const CartScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();
    const { user } = useAuth();
    const { cartItems, updateCartQty, removeFromCart, removePurchasedItems, clearCart, refreshCart } =
        useAppState();
    const { refreshing, onRefresh } = useRefresh(refreshCart);
    const [step, setStep] = useState<Step>('cart');
    const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    // Reference of a charge that already succeeded but whose order creation did
    // not. Reused on retry so the buyer is never billed twice.
    const [paidReference, setPaidReference] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'mpesa'>('card');
    const [mpesaPhone, setMpesaPhone] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkoutError, setCheckoutError] = useState('');
    const [checkoutErrorRef, setCheckoutErrorRef] = useState('');
    const [checkoutSandboxHint, setCheckoutSandboxHint] = useState('');
    const [mpesaMessage, setMpesaMessage] = useState('');
    const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
    const [stockByProductId, setStockByProductId] = useState<Record<string, number>>({});
    const [paymentStatusMessage, setPaymentStatusMessage] = useState<string | null>(null);

    // Shipping form state — the seller reads this off the order, so it must be
    // the buyer's real address, never a placeholder default (C-CORE-1).
    const [shippingName, setShippingName] = useState('');
    const [shippingStreet, setShippingStreet] = useState('');
    const [shippingCity, setShippingCity] = useState('');
    const [shippingPostal, setShippingPostal] = useState('');
    const [shippingPhone, setShippingPhone] = useState('');

    // Saved shipping address (C-CORE-1 follow-up): pre-fill from the buyer's
    // last submitted address instead of leaving the form empty. Only fills
    // fields the buyer has not already started typing into.
    useEffect(() => {
        if (!user?.id) {
            return;
        }
        let cancelled = false;
        void loadSavedShippingAddress(user.id).then((saved) => {
            if (cancelled || !saved) {
                return;
            }
            setShippingName((prev) => prev || saved.name);
            setShippingStreet((prev) => prev || saved.street);
            setShippingCity((prev) => prev || saved.city);
            setShippingPostal((prev) => prev || saved.postal);
            setShippingPhone((prev) => prev || saved.phone);
        });
        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    useEffect(() => {
        let cancelled = false;
        const loadStock = async () => {
            const next: Record<string, number> = {};
            await Promise.all(
                cartItems.map(async (line) => {
                    if (line.stockQuantity != null && line.stockQuantity > 0) {
                        next[line.productId] = line.stockQuantity;
                        return;
                    }
                    try {
                        const p = await repositories.products.getById(line.productId);
                        if (p?.stockQuantity != null && p.stockQuantity > 0) {
                            next[line.productId] = p.stockQuantity;
                        }
                    } catch {
                        /* ignore */
                    }
                }),
            );
            if (!cancelled) {
                setStockByProductId((prev) => ({ ...prev, ...next }));
            }
        };
        void loadStock();
        return () => {
            cancelled = true;
        };
    }, [cartItems]);

    const sellerGroups: SellerGroup[] = useMemo(() => {
        const bySeller = new Map<string, SellerGroup>();
        for (const line of cartItems) {
            const key = line.businessId;
            const group = bySeller.get(key);
            if (group) {
                group.lines.push(line);
                continue;
            }
            bySeller.set(key, {
                businessId: key,
                sellerName: line.sellerName || line.brand || 'Seller',
                lines: [line],
            });
        }
        return [...bySeller.values()];
    }, [cartItems]);

    // A lone seller needs no choice; several require an explicit pick before checkout.
    const activeSellerId = useMemo(() => {
        if (sellerGroups.length === 1) {
            return sellerGroups[0].businessId;
        }
        if (selectedSellerId && sellerGroups.some((g) => g.businessId === selectedSellerId)) {
            return selectedSellerId;
        }
        return null;
    }, [sellerGroups, selectedSellerId]);

    const activeGroup = useMemo(
        () => sellerGroups.find((g) => g.businessId === activeSellerId) ?? null,
        [sellerGroups, activeSellerId],
    );

    const checkoutLines = useMemo(
        () => (activeGroup ? activeGroup.lines.filter(isLineAvailable) : []),
        [activeGroup],
    );

    const items: CheckoutItem[] = checkoutLines.map((i, idx) => ({
        id: i.productId,
        name: i.name,
        brand: i.brand,
        price: i.price,
        imageUrl: i.imageUrl,
        quantity: i.quantity,
        color: i.color ?? COLORS[idx % COLORS.length],
    }));

    const stepIndex = STEPS.findIndex((s) => s.key === step);
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    // Delivery is buyer-arranged, so there is no shipping line. This total is an
    // estimate for display; Paystack Verify is the authority on what was captured.
    const tax = calculateVat(subtotal);
    const total = subtotal + tax;

    const cartLineCount = cartItems.length;
    const headerCount = step === 'cart' && !activeGroup ? cartLineCount : items.length;
    const headerTotal = step === 'cart' && !activeGroup ? null : total;

    const checkoutEmail = user?.email?.trim() ?? '';
    const mpesaInlineError =
        mpesaPhone.trim().length > 0 ? getMpesaPhoneValidationError(mpesaPhone) : null;

    const getShippingPhoneValidationError = (raw: string): string | null => {
        if (raw.trim().length === 0) {
            return 'Enter a contact phone number.';
        }
        return parseKenyaMpesaPhoneForPaystack(raw.trim()) ? null : KENYA_MPESA_PHONE_VALIDATION_MESSAGE;
    };
    const shippingPhoneInlineError =
        shippingPhone.trim().length > 0 ? getShippingPhoneValidationError(shippingPhone) : null;

    const isShippingAddressComplete = useMemo(
        () =>
            USE_MOCK_DATA ||
            (shippingName.trim().length > 0 &&
                shippingStreet.trim().length > 0 &&
                shippingCity.trim().length > 0 &&
                shippingPostal.trim().length > 0 &&
                getShippingPhoneValidationError(shippingPhone) === null),
        [shippingName, shippingStreet, shippingCity, shippingPostal, shippingPhone]
    );

    const handleContinueFromShipping = (): void => {
        if (user?.id && isShippingAddressComplete) {
            void saveShippingAddress(user.id, {
                name: shippingName,
                street: shippingStreet,
                city: shippingCity,
                postal: shippingPostal,
                phone: shippingPhone,
            });
        }
        setStep('payment');
    };

    const canPlaceOrder = useMemo(() => {
        if (step !== 'payment' || loading || items.length === 0 || !isShippingAddressComplete) {
            return false;
        }
        if (USE_MOCK_DATA) {
            return true;
        }
        if (paymentMethod === 'mpesa') {
            return isMpesaPhoneValidForCheckout(mpesaPhone);
        }
        return isCardCheckoutReady(cardNumber, cardExpiry, cardCvv, checkoutEmail.length > 0);
    }, [
        step,
        loading,
        items.length,
        isShippingAddressComplete,
        paymentMethod,
        mpesaPhone,
        cardNumber,
        cardExpiry,
        cardCvv,
        checkoutEmail,
    ]);

    const updateQty = async (id: string, delta: number) => {
        const line = cartItems.find((l) => l.productId === id);
        if (!line) return;
        if (delta < 0 && line.quantity <= 1) return;
        const maxQty =
            stockByProductId[id] ??
            (line.stockQuantity != null && line.stockQuantity > 0
                ? line.stockQuantity
                : Number.MAX_SAFE_INTEGER);
        if (delta > 0 && line.quantity >= maxQty) {
            showToast(
                maxQty === Number.MAX_SAFE_INTEGER
                    ? 'Cannot increase quantity'
                    : `Only ${maxQty} left in stock`,
            );
            return;
        }
        try {
            await updateCartQty(id, line.quantity + delta);
        } catch {
            showToast('Could not update quantity — try again');
        }
    };

    const removeItem = async (id: string) => {
        try {
            await removeFromCart(id);
        } catch {
            showToast('Could not remove item — try again');
        }
    };

    const openProduct = (productId: string) => {
        navigation.navigate('ProductDetail', { productId });
    };

    const goBack = () => {
        if (step === 'cart') {
            navigation.goBack();
            return;
        }
        // Leaving payment can change the cart or seller, so a captured charge must
        // not follow the buyer onto a different order total.
        if (step === 'payment') {
            setPaidReference(null);
        }
        setStep(STEPS[stepIndex - 1].key);
    };

    const waitForMpesaSuccess = async (paymentRequestId: string): Promise<void> => {
        const deadline = Date.now() + 120_000;
        while (Date.now() < deadline) {
            const statusRes = await apiGet<MpesaStatusPayload>(
                `/v1/api/payments/mpesa/requests/${encodeURIComponent(paymentRequestId)}`,
            );
            const payload = statusRes.data;
            setMpesaMessage(
                payload.customerMessage ||
                    'Check your phone and approve the M-Pesa prompt.',
            );
            if (payload.status === 'COMPLETED') {
                return;
            }
            if (payload.status === 'FAILED' || payload.status === 'CANCELLED') {
                throw new Error(payload.customerMessage || 'M-Pesa payment failed.');
            }
            await new Promise<void>((resolve) => setTimeout(() => resolve(), 3000));
        }
        throw new Error('Payment timed out. Check M-Pesa and try again.');
    };

    const handlePlaceOrder = async () => {
        if (checkoutLines.length === 0) {
            setCheckoutError('Select a seller with available items to check out.');
            return;
        }

        if (USE_MOCK_DATA) {
            // Mirror the live path so a mock order cannot be placed twice.
            removePurchasedItems(checkoutLines.map((i) => i.productId));
            setSelectedSellerId(null);
            setStep('complete');
            return;
        }

        setLoading(true);
        setCheckoutError('');
        setCheckoutErrorRef('');
        setCheckoutSandboxHint('');
        setMpesaMessage('');
        setPaymentStatusMessage('Initializing payment...');
        const paymentEmail = checkoutEmail || 'dev+buyer@luku.app';
        try {
            let ref = paidReference ?? '';
            if (ref) {
                setPaymentStatusMessage('Payment already received. Finishing your order...');
            } else if (paymentMethod === 'card') {
                const res = await apiPost<{ status: string; reference: string; authorizationUrl?: string }>('/v1/api/payments/paystack/charges', {
                    amount: total,
                    currency: 'KES',
                    method: 'card',
                    metadata: { email: paymentEmail },
                });
                
                if (res.data?.status === 'requires_action' && res.data.authorizationUrl) {
                    setPaymentStatusMessage('Please complete authorization in the browser...');
                    await WebBrowser.openBrowserAsync(res.data.authorizationUrl);
                    ref = res.data.reference;
                } else {
                    ref = res.data?.reference || `card_${Date.now()}`;
                }
            } else {
                const phoneError = getMpesaPhoneValidationError(mpesaPhone);
                if (phoneError) {
                    setCheckoutError(phoneError);
                    return;
                }
                const res = await apiPost<MpesaStatusPayload>('/v1/api/payments/mpesa/stk-push', {
                    amount: total,
                    phoneNumber: mpesaPhone,
                    metadata: { email: paymentEmail },
                });
                const paymentRequestId = res.data?.paymentRequestId;
                if (!paymentRequestId) {
                    throw new Error('Could not start M-Pesa payment.');
                }
                setMpesaMessage(
                    res.data.customerMessage ||
                        'Check your phone and approve the M-Pesa prompt.',
                );
                await waitForMpesaSuccess(paymentRequestId);
                ref = paymentRequestId;
            }

            if (!paidReference && paymentMethod === 'card') {
                setPaymentStatusMessage('Verifying card payment status...');
                const paymentSuccess = await pollPaymentStatus(ref);
                if (!paymentSuccess) {
                    throw new Error('Payment confirmation failed. Transaction was not approved.');
                }
            }

            // Money is captured from here on. If order creation fails, the retry
            // must reuse this reference — createOrder is idempotent on it.
            setPaidReference(ref);

            setPaymentStatusMessage('Creating your order...');
            const order = await repositories.orders.create({
                paymentReference: ref,
                shippingAddress: {
                    name: shippingName,
                    street: shippingStreet,
                    city: shippingCity,
                    postal: shippingPostal,
                    phone: shippingPhone,
                },
                items: checkoutLines.map((i) => ({
                    productId: i.productId,
                    quantity: i.quantity,
                })),
            });

            setCreatedOrderId(order.id);
            // The order already dropped these server-side; other sellers stay put.
            removePurchasedItems(checkoutLines.map((i) => i.productId));
            setSelectedSellerId(null);
            setPaidReference(null);

            setStep('complete');
        } catch (err) {
            if (err instanceof ApiError) {
                setCheckoutError(err.message);
                setCheckoutErrorRef(
                    err.requestId
                        ? `Ref: ${err.requestId}`
                        : err.errorCode
                          ? String(err.errorCode)
                          : '',
                );
                if (err.errorCode === 'MPESA_UNPROCESSED') {
                    setCheckoutSandboxHint(
                        'Sandbox: use Paystack test number 0710000000. Real Safaricom numbers need live keys.',
                    );
                } else {
                    setCheckoutSandboxHint('');
                }
            } else {
                setCheckoutError(err instanceof Error ? err.message : 'Checkout failed');
                setCheckoutErrorRef('');
                setCheckoutSandboxHint('');
            }
            console.error('Checkout failed:', err);
        } finally {
            setLoading(false);
            setMpesaMessage('');
            setPaymentStatusMessage(null);
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
                <Pressable style={styles.headerBtn} onPress={goBack}>
                    <ChevronLeft size={20} color={colors.text.onDark} strokeWidth={2.5} />
                </Pressable>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>CHECKOUT</Text>
                    <Text style={styles.headerSub}>
                        {headerCount} {headerCount === 1 ? 'item' : 'items'}
                        {headerTotal != null ? ` · ${formatKES(headerTotal)}` : ''}
                    </Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            <View style={styles.stepper}>
                <View style={styles.connectorRow}>
                    {STEPS.slice(0, -1).map((_, idx) => (
                        <View key={idx} style={styles.connectorSegment}>
                            <View
                                style={[
                                    styles.connectorLine,
                                    idx < stepIndex && styles.connectorLineDone,
                                ]}
                            />
                        </View>
                    ))}
                </View>
                <View style={styles.stepRow}>
                    {STEPS.map((s, idx) => {
                        const Icon = s.icon;
                        const isActive = idx === stepIndex;
                        const isDone = idx < stepIndex;
                        return (
                            <View key={s.key} style={styles.stepItem}>
                                <View
                                    style={[
                                        styles.stepNode,
                                        isDone && styles.stepNodeDone,
                                        isActive && styles.stepNodeActive,
                                        !isDone && !isActive && styles.stepNodePending,
                                    ]}
                                >
                                    <Icon
                                        size={18}
                                        color={
                                            isActive || isDone
                                                ? colors.text.primary
                                                : colors.text.onDarkSubtle
                                        }
                                        strokeWidth={2.5}
                                    />
                                </View>
                                <Text
                                    style={[styles.stepLabel, isActive && styles.stepLabelActive]}
                                >
                                    {s.label}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
               
            >
                {step === 'cart' ? (
                    <>
                        {cartItems.length === 0 ? (
                            <EmptyState
                                icon={ShoppingBag}
                                title="Your cart is empty"
                                description="Add items from the marketplace to get started"
                                actionLabel="Continue shopping"
                                onAction={() =>
                                    navigation.navigate('MainTabs', {
                                        screen: 'Home',
                                        params: { screen: 'HomeMain' },
                                    })
                                }
                            />
                        ) : (
                        <>
                        {sellerGroups.length > 1 ? (
                            <Text style={styles.multiSellerNote}>
                                Your cart has {sellerGroups.length} sellers. Pay one seller at a
                                time — the rest stay in your cart.
                            </Text>
                        ) : null}
                        {sellerGroups.map((group) => {
                            const isSelected = group.businessId === activeSellerId;
                            const availableCount = group.lines.filter(isLineAvailable).length;
                            return (
                            <View
                                key={group.businessId}
                                style={[styles.section, isSelected && styles.sectionSelected]}
                            >
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>
                                        {group.sellerName.toUpperCase()}
                                    </Text>
                                    <View style={styles.sectionBadge}>
                                        <Text style={styles.sectionBadgeText}>
                                            {group.lines.length}
                                        </Text>
                                    </View>
                                </View>
                                {group.lines.map((line, idx) => {
                                    const available = isLineAvailable(line);
                                    return (
                                    <View key={line.productId} style={styles.lineItem}>
                                        <Pressable onPress={() => openProduct(line.productId)}>
                                            <Image
                                                source={{ uri: line.imageUrl }}
                                                style={[
                                                    styles.thumb,
                                                    !available && styles.thumbMuted,
                                                ]}
                                                contentFit="cover"
                                            />
                                        </Pressable>
                                        <View style={styles.flex}>
                                            <Pressable onPress={() => openProduct(line.productId)}>
                                                <Text style={styles.lineName}>{line.name}</Text>
                                                <Text style={styles.lineBrand}>{line.brand}</Text>
                                                {available ? (
                                                    <Text style={styles.lineColor}>
                                                        {line.color ?? COLORS[idx % COLORS.length]}
                                                    </Text>
                                                ) : (
                                                    <Text style={styles.lineUnavailable}>
                                                        Unavailable
                                                    </Text>
                                                )}
                                            </Pressable>
                                            <View style={styles.qtyRow}>
                                                <Pressable
                                                    style={[
                                                        styles.qtyBtn,
                                                        line.quantity <= 1 && styles.qtyBtnDisabled,
                                                    ]}
                                                    onPress={() => void updateQty(line.productId, -1)}
                                                    disabled={line.quantity <= 1}
                                                >
                                                    <Minus
                                                        size={14}
                                                        color={
                                                            line.quantity <= 1
                                                                ? colors.text.onDarkSubtle
                                                                : colors.text.onDark
                                                        }
                                                        strokeWidth={3}
                                                    />
                                                </Pressable>
                                                <Text style={styles.qtyValue}>{line.quantity}</Text>
                                                <Pressable
                                                    style={styles.qtyBtn}
                                                    onPress={() => void updateQty(line.productId, 1)}
                                                >
                                                    <Plus size={14} color={colors.text.onDark} strokeWidth={3} />
                                                </Pressable>
                                            </View>
                                        </View>
                                        <View style={styles.lineActions}>
                                            <Text style={styles.linePrice}>
                                                {formatKES(line.price * line.quantity)}
                                            </Text>
                                            <Pressable
                                                style={styles.removeBtn}
                                                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                                accessibilityRole="button"
                                                accessibilityLabel={`Remove ${line.name} from cart`}
                                                onPress={() => void removeItem(line.productId)}
                                            >
                                                <Trash2 size={18} color={colors.status.error} strokeWidth={2.5} />
                                            </Pressable>
                                        </View>
                                    </View>
                                    );
                                })}
                                {sellerGroups.length > 1 ? (
                                    <Pressable
                                        style={[
                                            styles.sellerCheckoutBtn,
                                            availableCount === 0 && styles.btnDisabled,
                                        ]}
                                        disabled={availableCount === 0}
                                        onPress={() => {
                                            setSelectedSellerId(group.businessId);
                                            setStep('shipping');
                                        }}
                                    >
                                        <Text style={styles.sellerCheckoutText}>
                                            {availableCount === 0
                                                ? 'NOTHING AVAILABLE'
                                                : `CHECKOUT ${group.sellerName.toUpperCase()}`}
                                        </Text>
                                        {availableCount > 0 ? (
                                            <ChevronRight
                                                size={16}
                                                color={colors.text.onDark}
                                                strokeWidth={3}
                                            />
                                        ) : null}
                                    </Pressable>
                                ) : null}
                            </View>
                            );
                        })}
                        <Pressable
                            style={styles.clearCartBtn}
                            onPress={() => setShowClearConfirm(true)}
                        >
                            <Text style={styles.clearCartText}>Clear cart</Text>
                        </Pressable>
                        {activeGroup ? renderSummary(subtotal, tax, total) : null}
                        </>
                        )}
                    </>
                ) : null}

                {step === 'shipping' ? (
                    <>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>SHIPPING ADDRESS</Text>
                            <Field
                                label="FULL NAME"
                                placeholder="Jane Doe"
                                value={shippingName}
                                onChangeText={setShippingName}
                            />
                            <Field
                                label="ADDRESS"
                                placeholder="123 Kimathi Street"
                                value={shippingStreet}
                                onChangeText={setShippingStreet}
                            />
                            <View style={styles.fieldRow}>
                                <View style={styles.flex}>
                                    <Field
                                        label="CITY"
                                        placeholder="Nairobi"
                                        value={shippingCity}
                                        onChangeText={setShippingCity}
                                    />
                                </View>
                                <View style={styles.flex}>
                                    <Field
                                        label="POSTAL"
                                        placeholder="00100"
                                        value={shippingPostal}
                                        onChangeText={setShippingPostal}
                                    />
                                </View>
                            </View>
                            <Field
                                label="CONTACT PHONE"
                                placeholder="07XX XXX XXX"
                                value={shippingPhone}
                                onChangeText={setShippingPhone}
                            />
                            {shippingPhoneInlineError ? (
                                <Text style={styles.fieldError}>{shippingPhoneInlineError}</Text>
                            ) : null}
                        </View>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>DELIVERY</Text>
                            <View style={styles.deliveryNotice}>
                                <Truck size={18} color={colors.text.onDark} strokeWidth={2.5} />
                                <View style={styles.flex}>
                                    <Text style={styles.methodName}>Buyer-arranged delivery</Text>
                                    <Text style={styles.methodDesc}>
                                        Coordinate shipping directly with the seller after purchase.
                                        Delivery cost is not included at checkout.
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </>
                ) : null}

                {step === 'payment' ? (
                    <>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>PAYMENT METHOD</Text>
                            <Pressable
                                style={[styles.methodCard, paymentMethod === 'card' && styles.methodActive]}
                                onPress={() => setPaymentMethod('card')}
                            >
                                <CreditCard size={18} color={colors.text.onDark} strokeWidth={2.5} />
                                <View style={styles.flex}>
                                    <Text style={styles.methodName}>Credit / Debit Card</Text>
                                    <Text style={styles.methodDesc}>Visa, Mastercard, Amex</Text>
                                </View>
                            </Pressable>
                            <Pressable
                                style={[styles.methodCard, paymentMethod === 'mpesa' && styles.methodActive, { marginTop: spacing.sm }]}
                                onPress={() => setPaymentMethod('mpesa')}
                            >
                                <Smartphone size={18} color={colors.text.onDark} strokeWidth={2.5} />
                                <View style={styles.flex}>
                                    <Text style={styles.methodName}>M-Pesa (Paystack)</Text>
                                    <Text style={styles.methodDesc}>Lipa na M-Pesa STK Push</Text>
                                </View>
                            </Pressable>
                        </View>
                        {paymentMethod === 'card' ? (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>CARD DETAILS</Text>
                                {!checkoutEmail ? (
                                    <Text style={styles.checkoutHint}>
                                        Sign in with an account email to pay by card.
                                    </Text>
                                ) : null}
                                <View style={styles.field}>
                                    <Text style={styles.fieldLabel}>CARD NUMBER</Text>
                                    <TextInput
                                        style={styles.fieldInput}
                                        value={cardNumber}
                                        onChangeText={setCardNumber}
                                        placeholder="1234 5678 9012 3456"
                                        placeholderTextColor={colors.text.onDarkSubtle}
                                        keyboardType="number-pad"
                                    />
                                </View>
                                <View style={styles.fieldRow}>
                                    <View style={styles.flex}>
                                        <View style={styles.field}>
                                            <Text style={styles.fieldLabel}>EXPIRY</Text>
                                            <TextInput
                                                style={styles.fieldInput}
                                                value={cardExpiry}
                                                onChangeText={setCardExpiry}
                                                placeholder="MM/YY"
                                                placeholderTextColor={colors.text.onDarkSubtle}
                                                keyboardType="number-pad"
                                                maxLength={5}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.flex}>
                                        <View style={styles.field}>
                                            <Text style={styles.fieldLabel}>CVV</Text>
                                            <TextInput
                                                style={styles.fieldInput}
                                                value={cardCvv}
                                                onChangeText={setCardCvv}
                                                placeholder="123"
                                                placeholderTextColor={colors.text.onDarkSubtle}
                                                keyboardType="number-pad"
                                                maxLength={4}
                                                secureTextEntry
                                            />
                                        </View>
                                    </View>
                                </View>
                                <Text style={styles.checkoutHint}>
                                    Card payment completes on Paystack (redirect coming in a later
                                    update).
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>M-PESA DETAILS</Text>
                                <View style={styles.field}>
                                    <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
                                    <TextInput
                                        style={styles.fieldInput}
                                        value={mpesaPhone}
                                        onChangeText={(text) => {
                                            setMpesaPhone(text);
                                            setCheckoutError('');
                                            setCheckoutSandboxHint('');
                                        }}
                                        placeholder="07XX XXX XXX or 2547XX…"
                                        placeholderTextColor={colors.text.onDarkSubtle}
                                        keyboardType="phone-pad"
                                    />
                                    {mpesaInlineError ? (
                                        <Text style={styles.fieldError}>{mpesaInlineError}</Text>
                                    ) : null}
                                </View>
                            </View>
                        )}
                        <View style={styles.totalCard}>
                            <Text style={styles.totalCardLabel}>Total Amount</Text>
                            <Text style={styles.totalCardValue}>{formatKES(total)}</Text>
                        </View>
                        {mpesaMessage ? (
                            <Text style={styles.mpesaHint}>{mpesaMessage}</Text>
                        ) : null}
                        {paidReference ? (
                            <Text style={styles.paidNotice}>
                                Payment received. Finishing your order — you will not be
                                charged again.
                            </Text>
                        ) : null}
                        {checkoutError ? (
                            <Text style={styles.checkoutError}>{checkoutError}</Text>
                        ) : null}
                        {checkoutErrorRef ? (
                            <Text style={styles.checkoutErrorRef}>{checkoutErrorRef}</Text>
                        ) : null}
                        {checkoutSandboxHint ? (
                            <Text style={styles.checkoutHint}>{checkoutSandboxHint}</Text>
                        ) : null}
                    </>
                ) : null}

                {step === 'complete' ? (
                    <View style={styles.completeWrap}>
                        <View style={styles.completeIcon}>
                            <CheckCircle size={48} color={colors.text.onDark} strokeWidth={2.5} />
                        </View>
                        <Text style={styles.completeTitle}>ORDER CONFIRMED!</Text>
                        <Text style={styles.completeDesc}>
                            Thank you for your purchase. Your order #{createdOrderId || 'ORD-2848'} has been confirmed.
                        </Text>
                        <View style={styles.deliveryCard}>
                            <Text style={styles.deliveryLabel}>Estimated Delivery</Text>
                            <Text style={styles.deliveryValue}>May 24-26, 2026</Text>
                        </View>
                    </View>
                ) : null}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
                {step === 'cart' ? (
                    <Pressable
                        style={[styles.primaryBtn, items.length === 0 && styles.btnDisabled]}
                        disabled={items.length === 0}
                        onPress={() => setStep('shipping')}
                    >
                        <Text style={styles.primaryBtnText}>
                            {cartLineCount === 0
                                ? 'PROCEED TO SHIPPING'
                                : !activeGroup
                                  ? 'CHOOSE A SELLER TO CONTINUE'
                                  : items.length === 0
                                    ? 'NO AVAILABLE ITEMS'
                                    : 'PROCEED TO SHIPPING'}
                        </Text>
                        {items.length > 0 ? (
                            <ChevronRight size={18} color={colors.text.primary} strokeWidth={3} />
                        ) : null}
                    </Pressable>
                ) : null}
                {step === 'shipping' ? (
                    <Pressable
                        style={[styles.primaryBtn, !isShippingAddressComplete && styles.btnDisabled]}
                        disabled={!isShippingAddressComplete}
                        onPress={handleContinueFromShipping}
                    >
                        <Text style={styles.primaryBtnText}>CONTINUE</Text>
                        <ChevronRight size={18} color={colors.text.primary} strokeWidth={3} />
                    </Pressable>
                ) : null}
                {step === 'payment' ? (
                    <Pressable
                        style={[styles.primaryBtn, (!canPlaceOrder || loading) && styles.btnDisabled]}
                        disabled={!canPlaceOrder || loading}
                        onPress={handlePlaceOrder}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.text.primary} />
                        ) : (
                            <>
                                <Lock size={16} color={colors.text.primary} strokeWidth={3} />
                                <Text style={styles.primaryBtnText}>PLACE ORDER · {formatKES(total)}</Text>
                            </>
                        )}
                    </Pressable>
                ) : null}
                {step === 'complete' ? (
                    <View style={styles.completeActions}>
                        <Pressable
                            style={styles.primaryBtn}
                            onPress={() => navigation.navigate('OrderTracking', { orderId: createdOrderId || 'ORD-2848' })}
                        >
                            <Text style={styles.primaryBtnText}>TRACK ORDER</Text>
                        </Pressable>
                        <Pressable
                            style={styles.secondaryBtn}
                            onPress={() =>
                                navigation.navigate('MainTabs', {
                                    screen: 'Home',
                                    params: { screen: 'HomeMain' },
                                })
                            }
                        >
                            <Text style={styles.secondaryBtnText}>CONTINUE SHOPPING</Text>
                        </Pressable>
                    </View>
                ) : null}
            </View>
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={colors.accent.primary} />
                    <Text style={styles.loadingText}>
                        {paymentStatusMessage || 'Processing checkout...'}
                    </Text>
                </View>
            )}
            <ConfirmDialog
                visible={showClearConfirm}
                title="Clear cart?"
                description="This removes every item from your cart, including other sellers."
                confirmLabel="Clear"
                destructive
                onCancel={() => setShowClearConfirm(false)}
                onConfirm={() => {
                    setShowClearConfirm(false);
                    setSelectedSellerId(null);
                    void clearCart();
                }}
            />
        </View>
    );
};

const renderSummary = (subtotal: number, tax: number, total: number) => (
    <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>ORDER SUMMARY</Text>
        <SummaryRow label="Subtotal" value={formatKES(subtotal)} />
        <SummaryRow label="Delivery" value="Arranged by buyer" />
        <SummaryRow label={`VAT (${Math.round(VAT_RATE * 100)}%)`} value={formatKES(tax)} />
        <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>{formatKES(total)}</Text>
        </View>
    </View>
);

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryValue}>{value}</Text>
    </View>
);

const Field: React.FC<{
    label: string;
    value?: string;
    placeholder?: string;
    onChangeText?: (text: string) => void;
}> = ({
    label,
    value,
    placeholder,
    onChangeText,
}) => (
    <View style={styles.field}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
            style={styles.fieldInput}
            value={value}
            placeholder={placeholder}
            placeholderTextColor={colors.text.onDarkSubtle}
            onChangeText={onChangeText}
        />
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    flex: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.dark,
        backgroundColor: 'rgba(0,0,0,0.9)',
    },
    headerBtn: {
        width: 36,
        height: 36,
        borderRadius: radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    headerSpacer: { width: 36 },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 15,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    headerSub: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: colors.text.onDarkSubtle,
        marginTop: 1,
    },
    stepper: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.xl,
        position: 'relative',
    },
    connectorRow: {
        position: 'absolute',
        top: spacing.xl + 20,
        left: spacing.xl + 40,
        right: spacing.xl + 40,
        flexDirection: 'row',
    },
    connectorSegment: { flex: 1, paddingHorizontal: 4 },
    connectorLine: {
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    connectorLineDone: { backgroundColor: colors.accent.primary },
    stepRow: { flexDirection: 'row' },
    stepItem: { flex: 1, alignItems: 'center' },
    stepNode: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border.dark,
        zIndex: 2,
    },
    stepNodePending: {
        backgroundColor: colors.background.shell,
    },
    stepNodeDone: {
        backgroundColor: colors.accent.primary,
        borderColor: colors.accent.primary,
    },
    stepNodeActive: {
        backgroundColor: colors.text.onDark,
        borderColor: colors.text.onDark,
    },
    stepLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDarkSubtle,
        textTransform: 'uppercase',
        marginTop: spacing.sm,
    },
    stepLabelActive: { color: colors.text.onDark },
    content: { padding: spacing.page, paddingBottom: 140, gap: spacing.xl },
    section: {
        padding: spacing.xl,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: colors.background.cardDark,
        gap: spacing.md,
    },
    sectionSelected: { borderColor: colors.accent.primary },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    multiSellerNote: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        lineHeight: 18,
        color: colors.text.onDarkMuted,
    },
    sellerCheckoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        marginTop: spacing.xs,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.accent.primary,
    },
    sellerCheckoutText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.text.onDark,
        letterSpacing: 1,
    },
    sectionTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        paddingHorizontal: 6,
        backgroundColor: colors.accent.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionBadgeText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.primary,
    },
    lineItem: {
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    thumb: { width: 72, height: 72, borderRadius: radii.md },
    thumbMuted: { opacity: 0.45 },
    lineName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
    },
    lineBrand: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
    },
    lineColor: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkSubtle,
        marginTop: 1,
    },
    lineUnavailable: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 12,
        color: colors.status.error,
        marginTop: 1,
    },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
    qtyBtn: {
        width: 28,
        height: 28,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    qtyBtnDisabled: {
        opacity: 0.45,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    mpesaHint: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.accent.primary,
        textAlign: 'center',
        paddingHorizontal: spacing.md,
    },
    paidNotice: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.accent.primary,
        textAlign: 'center',
        paddingHorizontal: spacing.md,
    },
    checkoutError: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.status.error,
        textAlign: 'center',
        paddingHorizontal: spacing.md,
    },
    checkoutErrorRef: {
        fontFamily: typography.fontFamily.regular,
        fontSize: 11,
        color: colors.text.onDarkSubtle,
        textAlign: 'center',
        paddingHorizontal: spacing.md,
        marginTop: 4,
    },
    checkoutHint: {
        fontFamily: typography.fontFamily.regular,
        fontSize: 12,
        color: colors.text.onDarkSubtle,
        textAlign: 'center',
        paddingHorizontal: spacing.md,
        marginTop: spacing.sm,
    },
    fieldError: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.status.error,
        marginTop: 6,
    },
    qtyValue: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
        width: 28,
        textAlign: 'center',
    },
    // Own column rather than a trailing child of the quantity row: sharing that
    // row put a 26pt target next to the stepper and under the price, so the
    // topmost line routinely swallowed the tap.
    lineActions: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    removeBtn: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: -10,
        marginBottom: -10,
    },
    linePrice: {
        fontFamily: typography.fontFamily.black,
        fontSize: 15,
        color: colors.text.onDark,
    },
    summaryCard: {
        padding: spacing.xl,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(72,205,138,0.06)',
        gap: spacing.md,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 14,
        color: colors.text.onDark,
    },
    summaryValue: {
        fontFamily: typography.fontFamily.black,
        fontSize: 15,
        color: colors.text.onDark,
    },
    summaryTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border.dark,
    },
    summaryTotalLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 16,
        color: colors.text.onDark,
    },
    summaryTotalValue: {
        fontFamily: typography.fontFamily.black,
        fontSize: 22,
        color: colors.accent.primary,
    },
    field: { gap: spacing.sm },
    fieldRow: { flexDirection: 'row', gap: spacing.md },
    fieldLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDark,
        letterSpacing: 0.5,
    },
    fieldInput: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderWidth: 1,
        borderColor: colors.border.dark,
        borderRadius: radii.lg,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDark,
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1.5,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    deliveryNotice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    clearCartBtn: {
        alignSelf: 'flex-end',
        marginTop: spacing.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    clearCartText: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 13,
        color: colors.status.error,
    },
    methodActive: {
        borderColor: colors.accent.primary,
        backgroundColor: 'rgba(72,205,138,0.1)',
    },
    methodName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
    },
    methodDesc: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
    },
    methodPrice: {
        fontFamily: typography.fontFamily.black,
        fontSize: 15,
        color: colors.text.onDark,
    },
    totalCard: {
        padding: spacing.xl,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: colors.background.cardDark,
        alignItems: 'center',
    },
    totalCardLabel: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        marginBottom: spacing.sm,
    },
    totalCardValue: {
        fontFamily: typography.fontFamily.black,
        fontSize: 32,
        color: colors.text.onDark,
    },
    completeWrap: { alignItems: 'center', paddingVertical: spacing.xl },
    completeIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.accent.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    completeTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 26,
        color: colors.text.onDark,
        marginBottom: spacing.sm,
    },
    completeDesc: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDarkMuted,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.xl,
    },
    deliveryCard: {
        alignSelf: 'stretch',
        padding: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: colors.background.cardDark,
        alignItems: 'center',
    },
    deliveryLabel: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        marginBottom: spacing.sm,
    },
    deliveryValue: {
        fontFamily: typography.fontFamily.black,
        fontSize: 20,
        color: colors.text.onDark,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.page,
        paddingTop: spacing.md,
        backgroundColor: 'rgba(0,0,0,0.95)',
        borderTopWidth: 1,
        borderTopColor: colors.border.dark,
    },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.lg,
        borderRadius: radii.lg,
        backgroundColor: colors.text.onDark,
    },
    btnDisabled: { opacity: 0.5 },
    primaryBtnText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    completeActions: { gap: spacing.md },
    secondaryBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.lg,
        borderRadius: radii.lg,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    secondaryBtnText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0,0,0,0.85)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.lg,
        zIndex: 999,
    },
    loadingText: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 16,
        color: colors.text.onDark,
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
    },
});

export default CartScreen;
