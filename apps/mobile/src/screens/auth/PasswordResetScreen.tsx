import React, { useState } from 'react';
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
import { ArrowLeft, Eye, EyeOff, Mail } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { apiPost } from '../../api/apiClient';
import type { AuthStackParamList } from '../../navigation/types';
import { Input } from '../../components/common/Input';
import { GradientButton } from '../../components/auth/GradientButton';
import { OtpDigitInput } from '../../components/auth/OtpDigitInput';
import { InfoDialog } from '../../components/common/ConfirmDialog';
import { colors, radii, spacing, typography } from '../../theme/tokens';

const BG =
    'https://images.unsplash.com/photo-1580478491436-fd6a937acc9e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080';

const CODE_LENGTH = 6;

type Props = NativeStackScreenProps<AuthStackParamList, 'PasswordReset'>;

type ResetStep = 'request' | 'code' | 'password' | 'complete';

const PasswordResetScreen: React.FC<Props> = ({ navigation, route }) => {
    const recoveryToken = route.params?.recoveryToken;
    const isDeepLinkConfirm = Boolean(recoveryToken);

    const [step, setStep] = useState<ResetStep>(isDeepLinkConfirm ? 'password' : 'request');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [inlineError, setInlineError] = useState('');
    const [infoDialog, setInfoDialog] = useState<{ title: string; description: string } | null>(
        null,
    );

    const handleRequestCode = async () => {
        if (!email.trim()) {
            setInlineError('Enter your email address.');
            return;
        }
        setInlineError('');
        setLoading(true);
        const trimmedEmail = email.trim();
        try {
            await apiPost('/v1/api/auth/password-reset', { email: trimmedEmail }, false);
            setEmail(trimmedEmail);
            setStep('code');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Reset failed';
            setInfoDialog({ title: 'Reset failed', description: message });
        } finally {
            setLoading(false);
        }
    };

    const handleContinueFromCode = () => {
        if (code.trim().length !== CODE_LENGTH) {
            setInlineError('Enter the 6-digit code from your email.');
            return;
        }
        setInlineError('');
        setStep('password');
    };

    const handleConfirmPassword = async () => {
        if (!password || password.length < 8) {
            setInlineError('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setInlineError('Passwords do not match.');
            return;
        }
        setInlineError('');
        setLoading(true);
        try {
            if (isDeepLinkConfirm && recoveryToken) {
                await apiPost<null>(
                    '/v1/api/auth/password-reset/confirm',
                    { accessToken: recoveryToken, password },
                    false,
                );
            } else {
                await apiPost<null>(
                    '/v1/api/auth/password-reset/confirm-otp',
                    { email: email.trim(), code: code.trim(), password },
                    false,
                );
            }
            setStep('complete');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Reset failed';
            setInfoDialog({ title: 'Reset failed', description: message });
        } finally {
            setLoading(false);
        }
    };

    const renderBody = () => {
        if (step === 'complete') {
            return (
                <>
                    <Text style={styles.eyebrow}>All set</Text>
                    <Text style={styles.title}>Password updated</Text>
                    <Text style={styles.subtitle}>Sign in with your new password.</Text>
                    <GradientButton
                        label="Back to Sign In"
                        onPress={() => navigation.navigate('SignIn')}
                    />
                </>
            );
        }

        if (step === 'password') {
            return (
                <>
                    <Text style={styles.eyebrow}>Account recovery</Text>
                    <Text style={styles.title}>Set a new password</Text>
                    <Text style={styles.subtitle}>Choose a strong password for your account.</Text>
                    {inlineError ? <Text style={styles.errorText}>{inlineError}</Text> : null}
                    <View style={styles.form}>
                        <Input
                            dark
                            placeholder="New password"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                        />
                        <Input
                            dark
                            placeholder="Confirm password"
                            secureTextEntry={!showPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                        <Pressable
                            style={styles.showPassword}
                            onPress={() => setShowPassword((v) => !v)}
                        >
                            {showPassword ? (
                                <EyeOff color="rgba(255,255,255,0.5)" size={18} />
                            ) : (
                                <Eye color="rgba(255,255,255,0.5)" size={18} />
                            )}
                        </Pressable>
                        <GradientButton
                            label="Update Password"
                            loading={loading}
                            onPress={handleConfirmPassword}
                        />
                    </View>
                </>
            );
        }

        if (step === 'code') {
            return (
                <>
                    <Text style={styles.eyebrow}>Check your inbox</Text>
                    <Text style={styles.title}>Enter your code</Text>
                    <Text style={styles.subtitle}>
                        We sent a verification code to{' '}
                        <Text style={styles.emailHighlight}>{email}</Text>.
                    </Text>
                    {inlineError ? <Text style={styles.errorText}>{inlineError}</Text> : null}
                    <View style={styles.form}>
                        <OtpDigitInput
                            value={code}
                            onChange={(next) => {
                                setInlineError('');
                                setCode(next);
                            }}
                        />
                        <GradientButton
                            label="Continue"
                            loading={loading}
                            onPress={handleContinueFromCode}
                        />
                        <Pressable
                            style={styles.outlineBtn}
                            onPress={() => void handleRequestCode()}
                            accessibilityRole="button"
                        >
                            <Text style={styles.outlineBtnText}>Resend code</Text>
                        </Pressable>
                    </View>
                </>
            );
        }

        return (
            <>
                <Text style={styles.eyebrow}>Account recovery</Text>
                <Text style={styles.title}>Reset your password</Text>
                <Text style={styles.subtitle}>
                    Enter your email and we&apos;ll send a verification code.
                </Text>
                {inlineError ? <Text style={styles.errorText}>{inlineError}</Text> : null}
                <View style={styles.form}>
                    <View>
                        <Mail
                            color="rgba(255,255,255,0.3)"
                            size={16}
                            strokeWidth={2}
                            style={styles.mailIcon}
                        />
                        <Input
                            dark
                            placeholder="Email address"
                            style={styles.mailInput}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>
                    <GradientButton
                        label="Send verification code"
                        loading={loading}
                        onPress={handleRequestCode}
                    />
                </View>
                <Pressable
                    onPress={() => navigation.navigate('SignIn')}
                    style={styles.switch}
                >
                    <Text style={styles.switchText}>
                        Remember it? <Text style={styles.switchBold}>Back to sign in</Text>
                    </Text>
                </Pressable>
            </>
        );
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
                <View style={styles.panel}>{renderBody()}</View>
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
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.accent.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.sm,
    },
    title: {
        fontFamily: typography.fontFamily.black,
        fontSize: 28,
        color: colors.text.cream,
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: 'rgba(255,255,255,0.65)',
        lineHeight: 20,
        marginBottom: spacing.lg,
    },
    errorText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.status.error,
        marginBottom: spacing.md,
    },
    form: { gap: spacing.md },
    mailIcon: { position: 'absolute', left: 16, top: 18, zIndex: 1 },
    mailInput: { paddingLeft: 44 },
    showPassword: { alignSelf: 'flex-end', marginTop: -8 },
    switch: { marginTop: spacing.xl, alignItems: 'center' },
    switchText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
    },
    switchBold: { color: colors.text.cream, fontFamily: typography.fontFamily.bold },
    emailHighlight: { color: colors.text.cream, fontFamily: typography.fontFamily.bold },
    outlineBtn: {
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
    },
    outlineBtnText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.cream,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});

export default PasswordResetScreen;
