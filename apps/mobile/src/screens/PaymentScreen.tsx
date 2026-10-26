import React, { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { CreditCard, Lock } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ScreenHeader } from '../components/shell/ScreenHeader';
import { Input } from '../components/common/Input';
import { GradientButton } from '../components/auth/GradientButton';
import { formatKES } from '../lib/format';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

const ORDER_TOTAL = 12400;
const SHIPPING = 1000;

const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '').replace(/\D/g, '');
    return (cleaned.match(/.{1,4}/g)?.join(' ') ?? cleaned).substring(0, 19);
};

const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length >= 2
        ? `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`
        : cleaned;
};

const PaymentScreen: React.FC<Props> = ({ navigation }) => {
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardName, setCardName] = useState('');
    const [saveCard, setSaveCard] = useState(false);
    const [processing, setProcessing] = useState(false);

    const isValid =
        cardNumber.replace(/\s/g, '').length === 16 &&
        expiry.length === 5 &&
        cvv.length === 3 &&
        cardName.length > 0;

    const handlePay = () => {
        setProcessing(true);
        setTimeout(() => {
            setProcessing(false);
            navigation.navigate('OrderConfirmation', { orderId: 'ORD-2026-05-001' });
        }, 1600);
    };

    return (
        <View style={styles.container}>
            <ScreenHeader title="Payment" onBack={() => navigation.goBack()} />
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.subtitle}>Secure checkout</Text>

                <View style={styles.banner}>
                    <View style={styles.bannerIcon}>
                        <Lock color={colors.accent.primary} size={20} strokeWidth={2.5} />
                    </View>
                    <Text style={styles.bannerText}>
                        Your payment information is encrypted and secure
                    </Text>
                </View>

                <Text style={styles.label}>Card Number</Text>
                <View>
                    <CreditCard
                        color="rgba(255,255,255,0.4)"
                        size={18}
                        strokeWidth={2.5}
                        style={styles.cardIcon}
                    />
                    <Input
                        dark
                        placeholder="1234 5678 9012 3456"
                        keyboardType="number-pad"
                        style={styles.cardInput}
                        value={cardNumber}
                        onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                    />
                </View>

                <View style={styles.row}>
                    <View style={styles.flex}>
                        <Text style={styles.label}>Expiry</Text>
                        <Input
                            dark
                            placeholder="MM/YY"
                            keyboardType="number-pad"
                            value={expiry}
                            onChangeText={(t) => setExpiry(formatExpiry(t))}
                        />
                    </View>
                    <View style={styles.flex}>
                        <Text style={styles.label}>CVV</Text>
                        <Input
                            dark
                            placeholder="123"
                            keyboardType="number-pad"
                            value={cvv}
                            onChangeText={(t) => setCvv(t.replace(/\D/g, '').substring(0, 3))}
                        />
                    </View>
                </View>

                <Text style={styles.label}>Cardholder Name</Text>
                <Input
                    dark
                    placeholder="Name on card"
                    value={cardName}
                    onChangeText={setCardName}
                />

                <Pressable
                    style={styles.checkRow}
                    onPress={() => setSaveCard((v) => !v)}
                >
                    <View style={[styles.checkbox, saveCard && styles.checkboxOn]} />
                    <Text style={styles.checkLabel}>Save card for future purchases</Text>
                </Pressable>

                <View style={styles.summary}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>
                            {formatKES(ORDER_TOTAL - SHIPPING)}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Shipping</Text>
                        <Text style={styles.summaryValue}>{formatKES(SHIPPING)}</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>{formatKES(ORDER_TOTAL)}</Text>
                    </View>
                </View>

                <GradientButton
                    label={processing ? 'Processing...' : `Pay ${formatKES(ORDER_TOTAL)}`}
                    loading={processing}
                    disabled={!isValid}
                    onPress={handlePay}
                />
                <Text style={styles.fineprint}>
                    Your payment is secure and encrypted
                </Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    content: { padding: spacing.page, paddingBottom: spacing.xxl, gap: spacing.sm },
    subtitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDarkMuted,
        marginBottom: spacing.md,
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginBottom: spacing.lg,
    },
    bannerIcon: {
        width: 40,
        height: 40,
        borderRadius: radii.md,
        backgroundColor: 'rgba(72,205,138,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerText: {
        flex: 1,
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
    },
    label: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    cardIcon: { position: 'absolute', left: 16, top: 16, zIndex: 1 },
    cardInput: { paddingLeft: 44 },
    row: { flexDirection: 'row', gap: spacing.md },
    flex: { flex: 1 },
    checkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginTop: spacing.lg,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: radii.sm,
        borderWidth: 2,
        borderColor: colors.border.dark,
    },
    checkboxOn: {
        backgroundColor: colors.accent.primary,
        borderColor: colors.accent.primary,
    },
    checkLabel: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDark,
    },
    summary: {
        marginTop: spacing.xl,
        marginBottom: spacing.xl,
        padding: spacing.xl,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.1)',
        gap: spacing.md,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryLabel: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDarkMuted,
    },
    summaryValue: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 14,
        color: colors.text.onDark,
    },
    summaryDivider: { height: 1, backgroundColor: colors.border.dark },
    totalLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 16,
        color: colors.text.onDark,
    },
    totalValue: {
        fontFamily: typography.fontFamily.black,
        fontSize: 22,
        color: colors.accent.primary,
    },
    fineprint: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: colors.text.onDarkSubtle,
        textAlign: 'center',
        marginTop: spacing.md,
    },
});

export default PaymentScreen;
