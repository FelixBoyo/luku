import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import type { AuthStackParamList } from '../../navigation/types';
import { GradientButton } from '../../components/auth/GradientButton';
import { OtpDigitInput } from '../../components/auth/OtpDigitInput';
import { InfoDialog } from '../../components/common/ConfirmDialog';
import { colors, radii, spacing, typography } from '../../theme/tokens';

const BG =
    'https://images.unsplash.com/photo-1580478491436-fd6a937acc9e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyOtp'>;

const maskEmail = (email: string): string => {
    const [name, domain] = email.split('@');
    if (!domain) return email;
    const visible = name.slice(0, 2);
    return `${visible}${'*'.repeat(Math.max(name.length - 2, 1))}@${domain}`;
};

const VerifyOtpScreen: React.FC<Props> = ({ navigation, route }) => {
    const { email } = route.params;
    const { verifyOtp, resendOtp } = useAuth();

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [inlineError, setInlineError] = useState('');
    const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
    const [infoDialog, setInfoDialog] = useState<{ title: string; description: string } | null>(
        null,
    );

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => {
            setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleVerify = async () => {
        if (code.length !== CODE_LENGTH) {
            setInlineError('Enter the 6-digit code.');
            return;
        }
        setInlineError('');
        setLoading(true);
        try {
            await verifyOtp(email, code);
            navigation.navigate('Onboarding');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Verification failed';
            setInlineError(message);
            setCode('');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0) return;
        try {
            await resendOtp(email);
            setCooldown(RESEND_COOLDOWN);
            setInfoDialog({
                title: 'Code sent',
                description: `We sent a new 6-digit code to ${email}. Check spam if you don't see it.`,
            });
        } catch {
            setInfoDialog({
                title: 'Could not resend',
                description: 'Please try again in a moment.',
            });
        }
    };

    return (
        <View style={styles.container}>
            <Image source={{ uri: BG }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient
                colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.95)']}
                style={StyleSheet.absoluteFill}
            />
            <Pressable
                style={styles.back}
                onPress={() => navigation.goBack()}
                accessibilityRole="button"
            >
                <ArrowLeft color={colors.text.cream} size={20} strokeWidth={2.5} />
            </Pressable>
            <Text style={styles.wordmark}>LUKU</Text>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.panelWrap}
            >
                <LinearGradient
                    colors={['transparent', colors.background.earthyPanel, colors.background.earthyPanel]}
                    locations={[0, 0.12, 1]}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.panel}>
                    <Text style={styles.eyebrow}>Verify email</Text>
                    <Text style={styles.title}>Enter your code</Text>
                    <Text style={styles.subtitle}>
                        We sent a 6-digit code to{' '}
                        <Text style={styles.emailHighlight}>{maskEmail(email)}</Text>.
                    </Text>
                    <Text style={styles.hint}>
                        Enter the code in the app — you don&apos;t need to click any link in the
                        email.
                    </Text>
                    {inlineError ? <Text style={styles.errorText}>{inlineError}</Text> : null}

                    <OtpDigitInput
                        value={code}
                        onChange={(next) => {
                            setInlineError('');
                            setCode(next);
                        }}
                    />

                    <GradientButton
                        label="Verify"
                        loading={loading}
                        onPress={handleVerify}
                    />

                    <Pressable
                        onPress={handleResend}
                        disabled={cooldown > 0}
                        style={styles.resend}
                        accessibilityRole="button"
                    >
                        <Text style={styles.resendText}>
                            {cooldown > 0 ? (
                                `Resend code in ${cooldown}s`
                            ) : (
                                <Text style={styles.resendBold}>Resend code</Text>
                            )}
                        </Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
            <InfoDialog
                visible={infoDialog !== null}
                title={infoDialog?.title ?? ''}
                description={infoDialog?.description ?? ''}
                onClose={() => setInfoDialog(null)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.earthyPanel },
    back: {
        position: 'absolute',
        top: 56,
        left: 20,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    wordmark: {
        position: 'absolute',
        top: 48,
        alignSelf: 'center',
        fontFamily: typography.fontFamily.black,
        fontSize: 56,
        color: colors.text.cream,
        letterSpacing: -2,
    },
    panelWrap: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    panel: {
        paddingHorizontal: spacing.page,
        paddingBottom: 40,
        paddingTop: spacing.xxl,
    },
    eyebrow: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.accent.primary,
        textTransform: 'uppercase',
        letterSpacing: 4,
    },
    title: {
        fontFamily: typography.fontFamily.black,
        fontSize: 24,
        color: colors.text.cream,
        marginTop: 4,
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: 'rgba(247,243,238,0.45)',
        marginBottom: spacing.xl,
        lineHeight: 20,
    },
    emailHighlight: {
        color: colors.accent.warm,
        fontFamily: typography.fontFamily.bold,
    },
    hint: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: 'rgba(247,243,238,0.35)',
        marginTop: -spacing.md,
        marginBottom: spacing.lg,
        lineHeight: 18,
    },
    errorText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.status.error,
        marginTop: -spacing.md,
        marginBottom: spacing.md,
    },
    resend: { alignItems: 'center', marginTop: spacing.xl },
    resendText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: 'rgba(247,243,238,0.45)',
    },
    resendBold: { color: colors.accent.terracotta, fontFamily: typography.fontFamily.bold },
});

export default VerifyOtpScreen;
