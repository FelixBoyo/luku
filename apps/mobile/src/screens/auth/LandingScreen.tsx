import React, { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { GoogleIcon } from '../../components/auth/GoogleIcon';
import { AppleIcon } from '../../components/auth/AppleIcon';
import { useOnboarding } from '../../context/OnboardingContext';
import { useAuth } from '../../context/AuthContext';
import {
    isNativeAppleSignInAvailable,
    isNativeGoogleSignInAvailable,
} from '../../lib/nativeSocialAuth';
import {
    NativeSocialAuthUnavailableError,
    SocialAuthCancelled,
} from '../../lib/socialAuth';
import { InfoDialog } from '../../components/common/ConfirmDialog';
import { colors, radii, spacing, typography } from '../../theme/tokens';

const BG =
    'https://images.unsplash.com/photo-1731589802397-6a1088d63630?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080';

type Props = NativeStackScreenProps<AuthStackParamList, 'Landing'>;

type DevRoute = keyof Pick<
    AuthStackParamList,
    'Onboarding' | 'OnboardingComplete' | 'SignIn' | 'SignUp' | 'PasswordReset'
>;

const DEV_SHORTCUTS: { label: string; route: DevRoute }[] = [
    { label: 'Onboarding', route: 'Onboarding' },
    { label: 'Onboarding Done', route: 'OnboardingComplete' },
    { label: 'Sign In', route: 'SignIn' },
    { label: 'Sign Up', route: 'SignUp' },
    { label: 'Reset Password', route: 'PasswordReset' },
];

const DEV_OTP_EMAIL = 'dev@example.com';

const LandingScreen: React.FC<Props> = ({ navigation }) => {
    const { devBypassToApp } = useOnboarding();
    const { signInWithGoogle, signInWithApple } = useAuth();
    const [infoDialog, setInfoDialog] = useState<{ title: string; description: string } | null>(
        null,
    );
    const [busy, setBusy] = useState<'google' | 'apple' | null>(null);

    const showGoogle = isNativeGoogleSignInAvailable();
    const showApple = isNativeAppleSignInAvailable();

    const runProvider = async (provider: 'google' | 'apple', action: () => Promise<void>) => {
        if (busy) return;
        setBusy(provider);
        try {
            await action();
        } catch (error) {
            if (error instanceof SocialAuthCancelled) return;
            if (error instanceof NativeSocialAuthUnavailableError) {
                setInfoDialog({ title: 'Sign-in unavailable', description: error.message });
                return;
            }
            const message = error instanceof Error ? error.message : 'Sign-in failed';
            setInfoDialog({ title: 'Sign-in failed', description: message });
        } finally {
            setBusy(null);
        }
    };

    return (
        <View style={styles.container}>
            <Image source={{ uri: BG }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient
                colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.92)']}
                style={StyleSheet.absoluteFill}
            />

            {__DEV__ ? (
                <View style={styles.devPanel}>
                    <Text style={styles.devLabel}>Dev shortcuts</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.devRow}
                    >
                        {DEV_SHORTCUTS.map(({ label, route }) => (
                            <Pressable
                                key={route}
                                style={styles.devChip}
                                onPress={() => navigation.navigate(route)}
                            >
                                <Text style={styles.devChipText}>{label}</Text>
                            </Pressable>
                        ))}
                        <Pressable
                            style={styles.devChip}
                            onPress={() =>
                                navigation.navigate('VerifyOtp', { email: DEV_OTP_EMAIL })
                            }
                        >
                            <Text style={styles.devChipText}>Verify OTP</Text>
                        </Pressable>
                        <Pressable style={styles.devChipPrimary} onPress={devBypassToApp}>
                            <Text style={styles.devChipPrimaryText}>Skip to App</Text>
                        </Pressable>
                    </ScrollView>
                </View>
            ) : null}

            <View style={styles.content}>
                <View>
                    <Text style={styles.logo}>LUKU</Text>
                    <View style={styles.tagRow}>
                        <View style={styles.line} />
                        <Text style={styles.tagline}>Stylist · Wardrobe · Shop</Text>
                    </View>
                </View>

                <View style={styles.bottom}>
                    <Text style={styles.desc}>
                        AI styling from your own wardrobe — then shop what completes the look.
                    </Text>
                    <View style={styles.authRow}>
                        {showGoogle ? (
                            <Pressable
                                style={styles.iconBtn}
                                onPress={() => runProvider('google', signInWithGoogle)}
                                disabled={busy !== null}
                                accessibilityRole="button"
                                accessibilityLabel="Continue with Google"
                            >
                                {busy === 'google' ? (
                                    <ActivityIndicator color={colors.text.cream} />
                                ) : (
                                    <GoogleIcon />
                                )}
                            </Pressable>
                        ) : null}
                        {showApple ? (
                            <Pressable
                                style={styles.iconBtn}
                                onPress={() => runProvider('apple', signInWithApple)}
                                disabled={busy !== null}
                                accessibilityRole="button"
                                accessibilityLabel="Continue with Apple"
                            >
                                {busy === 'apple' ? (
                                    <ActivityIndicator color={colors.text.cream} />
                                ) : (
                                    <AppleIcon />
                                )}
                            </Pressable>
                        ) : null}
                        <Pressable
                            style={styles.iconBtn}
                            onPress={() => navigation.navigate('SignIn')}
                            accessibilityRole="button"
                            accessibilityLabel="Continue with email"
                        >
                            <Mail color={colors.text.cream} size={20} strokeWidth={2} />
                        </Pressable>

                        <View style={styles.divider} />

                        <Pressable
                            style={styles.joinWrap}
                            onPress={() => navigation.navigate('SignUp')}
                            accessibilityRole="button"
                        >
                            <LinearGradient
                                colors={[colors.accent.gradientStart, colors.accent.gradientEnd]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.joinPill}
                            >
                                <Text style={styles.joinText}>Join Free</Text>
                            </LinearGradient>
                        </Pressable>
                    </View>

                    {__DEV__ && !showGoogle ? (
                        <Text style={styles.expoGoHint}>
                            Google/Apple need a dev build — use email in Expo Go
                        </Text>
                    ) : null}

                    <Text style={styles.terms}>
                        Continuing means you accept our{' '}
                        <Text style={styles.termsLink}>Terms</Text>
                        {' & '}
                        <Text style={styles.termsLink}>Privacy</Text>
                    </Text>
                </View>
            </View>
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
    container: { flex: 1, backgroundColor: '#000' },
    devPanel: {
        position: 'absolute',
        top: 52,
        left: spacing.page,
        right: spacing.page,
        zIndex: 20,
        gap: spacing.sm,
    },
    devLabel: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 9,
        color: 'rgba(247,243,238,0.45)',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    devRow: { gap: spacing.sm, paddingRight: spacing.page },
    devChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    devChipText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: colors.text.cream,
    },
    devChipPrimary: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.pill,
        backgroundColor: colors.accent.primary,
    },
    devChipPrimaryText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.primary,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: spacing.page,
        paddingTop: __DEV__ ? 108 : 56,
        paddingBottom: 40,
    },
    logo: {
        fontFamily: typography.fontFamily.black,
        fontSize: 96,
        color: colors.text.cream,
        letterSpacing: -4,
        lineHeight: 88,
        marginLeft: -4,
    },
    tagRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
    line: { width: 24, height: 1, backgroundColor: colors.accent.warm },
    tagline: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.accent.warm,
        textTransform: 'uppercase',
        letterSpacing: 3,
    },
    bottom: { gap: spacing.xl },
    desc: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: 'rgba(247,243,238,0.65)',
        maxWidth: 280,
        lineHeight: 20,
    },
    authRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    iconBtn: {
        width: 56,
        height: 56,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(255,255,255,0.07)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.15)' },
    joinWrap: { flex: 1 },
    joinPill: {
        height: 56,
        borderRadius: radii.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    joinText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.text.primary,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    expoGoHint: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 10,
        color: 'rgba(247,243,238,0.35)',
        marginTop: -spacing.md,
    },
    terms: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 10,
        color: 'rgba(247,243,238,0.28)',
    },
    termsLink: {
        color: 'rgba(247,243,238,0.45)',
        textDecorationLine: 'underline',
    },
});

export default LandingScreen;
