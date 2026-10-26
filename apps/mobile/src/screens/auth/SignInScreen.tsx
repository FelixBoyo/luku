import React, { useState, useRef } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../api/apiClient';
import { setPendingVerification } from '../../lib/pendingVerification';
import type { AuthStackParamList } from '../../navigation/types';
import { Input } from '../../components/common/Input';
import { GradientButton } from '../../components/auth/GradientButton';
import { OrDivider } from '../../components/auth/OrDivider';
import { SocialAuthRow } from '../../components/auth/SocialAuthRow';
import { InfoDialog } from '../../components/common/ConfirmDialog';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { normalizeHandleInput } from '../../lib/handle';
import type { LoginUnconfirmedDto } from '../../../../../packages/contracts/src/auth';

const BG =
    'https://images.unsplash.com/photo-1621804174943-fc6d0f06ef1c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

const SignInScreen: React.FC<Props> = ({ navigation }) => {
    const { login, resendOtp } = useAuth();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [inlineError, setInlineError] = useState('');
    const [infoDialog, setInfoDialog] = useState<{ title: string; description: string } | null>(
        null,
    );
    const passwordRef = useRef<TextInput>(null);

    const handleSignIn = async () => {
        const trimmed = identifier.trim();
        if (!trimmed || !password) {
            setInlineError('Email/username and password are required.');
            return;
        }
        setInlineError('');
        setLoading(true);
        const loginValue = trimmed.includes('@') ? trimmed : normalizeHandleInput(trimmed);
        try {
            await login(loginValue, password);
        } catch (error) {
            if (error instanceof ApiError && error.errorCode === 'AUTH_EMAIL_UNCONFIRMED') {
                const payload = error.data as LoginUnconfirmedDto | undefined;
                const otpEmail =
                    payload?.email ??
                    (trimmed.includes('@') ? trimmed : null);
                if (!otpEmail) {
                    setInfoDialog({
                        title: 'Verify your email',
                        description:
                            'Please verify your email to continue. Sign in with your email address to resend the code.',
                    });
                    return;
                }
                await resendOtp(otpEmail);
                await setPendingVerification(otpEmail);
                navigation.navigate('VerifyOtp', { email: otpEmail });
                return;
            }
            const message = error instanceof Error ? error.message : 'Sign in failed';
            setInfoDialog({ title: 'Sign in failed', description: message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Image source={{ uri: BG }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient
                colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.95)']}
                style={StyleSheet.absoluteFill}
            />
            <Pressable
                style={styles.back}
                onPress={() => navigation.navigate('Landing')}
                accessibilityRole="button"
            >
                <ArrowLeft color={colors.text.cream} size={20} strokeWidth={2.5} />
            </Pressable>
            <Text style={styles.wordmark}>LUKU</Text>

            <KeyboardAvoidingView
                behavior="padding"
                style={styles.panelWrap}
            >
                <LinearGradient
                    colors={['transparent', colors.background.earthyPanel, colors.background.earthyPanel]}
                    locations={[0, 0.12, 1]}
                    style={StyleSheet.absoluteFill}
                />
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.panel}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.eyebrow}>Welcome back</Text>
                    <Text style={styles.title}>Sign in to continue</Text>
                    {inlineError ? <Text style={styles.errorText}>{inlineError}</Text> : null}
                    <View style={styles.form}>
                        <Input
                            dark
                            placeholder="Email or username"
                            autoCapitalize="none"
                            autoCorrect={false}
                            value={identifier}
                            onChangeText={setIdentifier}
                            returnKeyType="next"
                            onSubmitEditing={() => passwordRef.current?.focus()}
                            blurOnSubmit={false}
                        />
                        <View>
                            <Input
                                ref={passwordRef}
                                dark
                                placeholder="Password"
                                style={styles.passwordInput}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                                returnKeyType="done"
                                onSubmitEditing={handleSignIn}
                            />
                            <Pressable
                                style={styles.eye}
                                onPress={() => setShowPassword((v) => !v)}
                            >
                                {showPassword ? (
                                    <EyeOff color="rgba(255,255,255,0.5)" size={18} />
                                ) : (
                                    <Eye color="rgba(255,255,255,0.5)" size={18} />
                                )}
                            </Pressable>
                        </View>
                        <Pressable onPress={() => navigation.navigate('PasswordReset')}>
                            <Text style={styles.forgot}>Forgot password?</Text>
                        </Pressable>
                        <GradientButton
                            label="Sign In"
                            loading={loading}
                            onPress={handleSignIn}
                        />
                        <OrDivider />
                        <SocialAuthRow />
                    </View>
                    <Pressable
                        onPress={() => navigation.navigate('SignUp')}
                        style={styles.switch}
                    >
                        <Text style={styles.switchText}>
                            No account?{' '}
                            <Text style={styles.switchBold}>Create one free</Text>
                        </Text>
                    </Pressable>
                </ScrollView>
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
        maxHeight: '78%',
    },
    scroll: { flexGrow: 0 },
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
        marginBottom: spacing.xl,
        marginTop: 4,
    },
    errorText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.status.error,
        marginTop: -spacing.md,
        marginBottom: spacing.md,
    },
    form: { gap: spacing.md },
    passwordInput: { paddingRight: 44 },
    eye: { position: 'absolute', right: 14, top: 14 },
    forgot: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 12,
        color: colors.accent.primary,
        textAlign: 'right',
    },
    switch: { alignItems: 'center', marginTop: spacing.xl },
    switchText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: 'rgba(247,243,238,0.35)',
    },
    switchBold: { color: colors.accent.terracotta, fontFamily: typography.fontFamily.bold },
});

export default SignInScreen;
