import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CreditCard, Lock, Trash2 } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../../components/shell/ScreenHeader';
import { Input } from '../../components/common/Input';
import { GradientButton } from '../../components/auth/GradientButton';
import { useToast } from '../../context/ToastContext';
import type { MeStackParamList } from '../../navigation/types';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type Props = NativeStackScreenProps<MeStackParamList, 'PaymentMethods'>;

type SavedCard = {
    id: string;
    last4: string;
    expiry: string;
    cardholderName: string;
};

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

const PaymentMethodsScreen: React.FC<Props> = ({ navigation }) => {
    const { showToast } = useToast();
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cardName, setCardName] = useState('');
    const [savedCards, setSavedCards] = useState<SavedCard[]>([
        { id: 'c1', last4: '4242', expiry: '12/27', cardholderName: 'Shannon Martinez' },
    ]);

    const isValid =
        cardNumber.replace(/\s/g, '').length === 16 &&
        expiry.length === 5 &&
        cardName.length > 0;

    const handleSave = () => {
        const last4 = cardNumber.replace(/\s/g, '').slice(-4);
        setSavedCards((prev) => [
            ...prev,
            { id: `c${Date.now()}`, last4, expiry, cardholderName: cardName },
        ]);
        setCardNumber('');
        setExpiry('');
        setCardName('');
        showToast('Card saved. CVV is never stored.');
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Payment Methods"
                subtitle="Manage saved cards"
                onBack={() => navigation.goBack()}
            />
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {savedCards.length > 0 ? (
                    <View style={styles.savedSection}>
                        <Text style={styles.sectionLabel}>Saved Cards</Text>
                        {savedCards.map((card) => (
                            <View key={card.id} style={styles.savedRow}>
                                <View style={styles.savedIcon}>
                                    <CreditCard size={18} color={colors.accent.primary} strokeWidth={2.5} />
                                </View>
                                <View style={styles.flex}>
                                    <Text style={styles.savedTitle}>•••• {card.last4}</Text>
                                    <Text style={styles.savedMeta}>
                                        {card.cardholderName} · Exp {card.expiry}
                                    </Text>
                                </View>
                                <Pressable
                                    onPress={() =>
                                        setSavedCards((prev) => prev.filter((c) => c.id !== card.id))
                                    }
                                >
                                    <Trash2 size={16} color={colors.text.onDarkSubtle} strokeWidth={2.5} />
                                </Pressable>
                            </View>
                        ))}
                    </View>
                ) : null}

                <View style={styles.banner}>
                    <View style={styles.bannerIcon}>
                        <Lock color={colors.accent.primary} size={20} strokeWidth={2.5} />
                    </View>
                    <Text style={styles.bannerText}>
                        CVV is never stored. You will enter it at checkout only.
                    </Text>
                </View>

                <Text style={styles.label}>Add Card</Text>
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

                <Text style={styles.label}>Expiry</Text>
                <Input
                    dark
                    placeholder="MM/YY"
                    keyboardType="number-pad"
                    value={expiry}
                    onChangeText={(t) => setExpiry(formatExpiry(t))}
                />

                <Text style={styles.label}>Cardholder Name</Text>
                <Input
                    dark
                    placeholder="Name on card"
                    value={cardName}
                    onChangeText={setCardName}
                />

                <GradientButton
                    label="Save Card"
                    disabled={!isValid}
                    onPress={handleSave}
                />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    scroll: { padding: spacing.page, paddingBottom: spacing.xxl, gap: spacing.sm },
    flex: { flex: 1 },
    savedSection: { marginBottom: spacing.lg, gap: spacing.sm },
    sectionLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDarkSubtle,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: spacing.sm,
    },
    savedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    savedIcon: {
        width: 40,
        height: 40,
        borderRadius: radii.md,
        backgroundColor: 'rgba(72,205,138,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    savedTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
    },
    savedMeta: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
        marginTop: 2,
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
        marginBottom: spacing.md,
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
});

export default PaymentMethodsScreen;
