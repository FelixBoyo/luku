import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Banknote, Lock, Smartphone, Trash2 } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../../components/shell/ScreenHeader';
import { Input } from '../../components/common/Input';
import { GradientButton } from '../../components/auth/GradientButton';
import { useToast } from '../../context/ToastContext';
import type { MeStackParamList } from '../../navigation/types';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { apiGet, apiPost, apiDelete, ApiError } from '../../api/apiClient';
import { useRootNavigation } from '../../navigation/useRootNavigation';

type Props = NativeStackScreenProps<MeStackParamList, 'PayoutDetails'>;

type RecipientType = 'bank' | 'mobile_money';

type SavedRecipient = {
    id: string;
    type: RecipientType;
    label: string; // e.g. "Equity Bank •••• 4821" or "M-Pesa •••• 9021"
    accountName: string;
};

const KENYAN_BANKS = [
    { code: '', name: 'Select bank' },
    { code: '68', name: 'Equity Bank' },
    { code: '01', name: 'KCB' },
    { code: '11', name: 'Co-operative Bank' },
    { code: '02', name: 'Standard Chartered' },
    { code: '03', name: 'Absa Bank Kenya' },
    { code: '07', name: 'NCBA Bank Kenya' },
    { code: '70', name: 'Family Bank' },
];

const maskAccount = (value: string) =>
    value.length > 4 ? `•••• ${value.slice(-4)}` : value;

const PayoutDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
    const { showToast } = useToast();
    const rootNav = useRootNavigation();
    const returnToOrderId = route.params?.returnToOrderId;

    const [recipientType, setRecipientType] = useState<RecipientType>('bank');
    const [bankCode, setBankCode] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [mpesaPhone, setMpesaPhone] = useState('');
    const [accountName, setAccountName] = useState('');

    const [saving, setSaving] = useState(false);
    const [loadingExisting, setLoadingExisting] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [savedRecipient, setSavedRecipient] = useState<SavedRecipient | null>(null);

    useEffect(() => {
        let cancelled = false;
        const loadExisting = async () => {
            try {
                const res = await apiGet<{ recipient: SavedRecipient | null }>(
                    '/v1/api/payments/paystack/recipients/me',
                );
                if (!cancelled) {
                    setSavedRecipient(res.data?.recipient ?? null);
                }
            } catch {
                // No recipient on file yet — not an error state, just show the form.
            } finally {
                if (!cancelled) setLoadingExisting(false);
            }
        };
        void loadExisting();
        return () => {
            cancelled = true;
        };
    }, []);

    const isValid =
        accountName.trim().length > 1 &&
        (recipientType === 'bank'
            ? bankCode.length > 0 && accountNumber.replace(/\s/g, '').length >= 6
            : /^(?:\+?254|0)7\d{8}$/.test(mpesaPhone.replace(/\s/g, '')));

    const handleSave = async () => {
        if (!isValid || saving) return;
        setSaving(true);
        setErrorMessage('');
        try {
            const payload =
                recipientType === 'bank'
                    ? {
                          type: 'nuban' as const,
                          bankCode,
                          accountNumber: accountNumber.replace(/\s/g, ''),
                          accountName: accountName.trim(),
                      }
                    : {
                          type: 'mobile_money' as const,
                          phoneNumber: mpesaPhone.replace(/\s/g, ''),
                          accountName: accountName.trim(),
                      };

            const res = await apiPost<{ recipient: SavedRecipient }>(
                '/v1/api/payments/paystack/recipients',
                payload,
            );

            if (res.data?.recipient) {
                setSavedRecipient(res.data.recipient);
                setBankCode('');
                setAccountNumber('');
                setMpesaPhone('');
                setAccountName('');
                showToast('Payout details saved. You\u2019re ready to get paid on your next sale.');
                if (returnToOrderId) {
                    navigation.goBack();
                    rootNav.navigate('OrderTracking', { orderId: returnToOrderId });
                }
            }
        } catch (err) {
            if (err instanceof ApiError) {
                setErrorMessage(err.message);
            } else {
                setErrorMessage('Could not save payout details \u2014 try again.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async () => {
        if (!savedRecipient) return;
        try {
            await apiDelete(`/v1/api/payments/paystack/recipients/${savedRecipient.id}`);
            setSavedRecipient(null);
            showToast('Payout details removed.');
        } catch {
            showToast('Could not remove payout details \u2014 try again.');
        }
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Payout Details"
                subtitle="Where we send your earnings"
                onBack={() => navigation.goBack()}
            />
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {savedRecipient ? (
                    <View style={styles.savedSection}>
                        <Text style={styles.sectionLabel}>On File</Text>
                        <View style={styles.savedRow}>
                            <View style={styles.savedIcon}>
                                {savedRecipient.type === 'bank' ? (
                                    <Banknote size={18} color={colors.accent.primary} strokeWidth={2.5} />
                                ) : (
                                    <Smartphone size={18} color={colors.accent.primary} strokeWidth={2.5} />
                                )}
                            </View>
                            <View style={styles.flex}>
                                <Text style={styles.savedTitle}>{savedRecipient.label}</Text>
                                <Text style={styles.savedMeta}>{savedRecipient.accountName}</Text>
                            </View>
                            <Pressable onPress={() => void handleRemove()}>
                                <Trash2 size={16} color={colors.text.onDarkSubtle} strokeWidth={2.5} />
                            </Pressable>
                        </View>
                        <Text style={styles.bannerText}>
                            Replacing your payout details below will update where future sales are sent.
                        </Text>
                    </View>
                ) : !loadingExisting ? (
                    <View style={styles.banner}>
                        <View style={styles.bannerIcon}>
                            <Lock color={colors.accent.primary} size={20} strokeWidth={2.5} />
                        </View>
                        <Text style={styles.bannerText}>
                            Add your payout details so we can pay you automatically once a buyer
                            confirms delivery.
                        </Text>
                    </View>
                ) : null}

                <View style={styles.toggleRow}>
                    <Pressable
                        style={[styles.toggleBtn, recipientType === 'bank' && styles.toggleBtnActive]}
                        onPress={() => setRecipientType('bank')}
                    >
                        <Banknote
                            size={16}
                            color={recipientType === 'bank' ? colors.text.onDark : colors.text.onDarkSubtle}
                            strokeWidth={2.5}
                        />
                        <Text
                            style={[
                                styles.toggleText,
                                recipientType === 'bank' && styles.toggleTextActive,
                            ]}
                        >
                            Bank Account
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[
                            styles.toggleBtn,
                            recipientType === 'mobile_money' && styles.toggleBtnActive,
                        ]}
                        onPress={() => setRecipientType('mobile_money')}
                    >
                        <Smartphone
                            size={16}
                            color={
                                recipientType === 'mobile_money'
                                    ? colors.text.onDark
                                    : colors.text.onDarkSubtle
                            }
                            strokeWidth={2.5}
                        />
                        <Text
                            style={[
                                styles.toggleText,
                                recipientType === 'mobile_money' && styles.toggleTextActive,
                            ]}
                        >
                            M-Pesa
                        </Text>
                    </Pressable>
                </View>

                {recipientType === 'bank' ? (
                    <>
                        <Text style={styles.label}>Bank</Text>
                        {/* Swap for a proper picker component if one exists in components/common */}
                        <View style={styles.bankPickerRow}>
                            {KENYAN_BANKS.filter((b) => b.code).map((b) => (
                                <Pressable
                                    key={b.code}
                                    style={[
                                        styles.bankChip,
                                        bankCode === b.code && styles.bankChipActive,
                                    ]}
                                    onPress={() => setBankCode(b.code)}
                                >
                                    <Text
                                        style={[
                                            styles.bankChipText,
                                            bankCode === b.code && styles.bankChipTextActive,
                                        ]}
                                    >
                                        {b.name}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        <Text style={styles.label}>Account Number</Text>
                        <Input
                            dark
                            placeholder="0123456789"
                            keyboardType="number-pad"
                            value={accountNumber}
                            onChangeText={setAccountNumber}
                        />
                    </>
                ) : (
                    <>
                        <Text style={styles.label}>M-Pesa Phone Number</Text>
                        <Input
                            dark
                            placeholder="07XX XXX XXX or 2547XX…"
                            keyboardType="phone-pad"
                            value={mpesaPhone}
                            onChangeText={setMpesaPhone}
                        />
                    </>
                )}

                <Text style={styles.label}>Account Name</Text>
                <Input
                    dark
                    placeholder="As it appears on your account"
                    value={accountName}
                    onChangeText={setAccountName}
                />

                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                <GradientButton
                    label={saving ? 'Saving…' : 'Save Payout Details'}
                    disabled={!isValid || saving}
                    onPress={() => void handleSave()}
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
    toggleRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.sm,
        marginBottom: spacing.sm,
    },
    toggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    toggleBtnActive: {
        borderColor: colors.accent.primary,
        backgroundColor: 'rgba(72,205,138,0.12)',
    },
    toggleText: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 13,
        color: colors.text.onDarkSubtle,
    },
    toggleTextActive: { color: colors.text.onDark },
    label: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    bankPickerRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    bankChip: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    bankChipActive: {
        borderColor: colors.accent.primary,
        backgroundColor: 'rgba(72,205,138,0.12)',
    },
    bankChipText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkSubtle,
    },
    bankChipTextActive: { color: colors.text.onDark },
    errorText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.status.error,
        marginTop: spacing.sm,
    },
});

export default PayoutDetailsScreen;