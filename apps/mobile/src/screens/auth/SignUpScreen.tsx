import React, { useState, useRef, useEffect } from 'react';
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
import type { AuthStackParamList } from '../../navigation/types';
import { Input } from '../../components/common/Input';
import { GradientButton } from '../../components/auth/GradientButton';
import { OrDivider } from '../../components/auth/OrDivider';
import { SocialAuthRow } from '../../components/auth/SocialAuthRow';
import { InfoDialog } from '../../components/common/ConfirmDialog';
import { colors, radii, spacing, typography } from '../../theme/tokens';
import { apiGet } from '../../api/apiClient';
import type { HandleAvailabilityResponseDto } from '../../../../../packages/contracts/src/auth';
import { isValidHandleFormat, normalizeHandleInput } from '../../lib/handle';

const BG =
    'https://images.unsplash.com/photo-1523297467724-f6758d7124c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

const SignUpScreen: React.FC<Props> = ({ navigation }) => {
    const { register } = useAuth();
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [inlineError, setInlineError] = useState('');
    const [usernameHint, setUsernameHint] = useState('');
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [infoDialog, setInfoDialog] = useState<{ title: string; description: string } | null>(
        null,
    );
    const emailRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);
    const usernameRef = useRef<TextInput>(null);
    const availabilityGeneration = useRef(0);

    useEffect(() => {
        const normalized = normalizeHandleInput(username);
        if (!normalized) {
            setUsernameHint('');
            setCheckingUsername(false);
            return;
        }
        if (!isValidHandleFormat(normalized)) {
            setUsernameHint('Use 3–20 lowercase letters, numbers, or underscores');
            setCheckingUsername(false);
            return;
        }

        const generation = ++availabilityGeneration.current;
        setCheckingUsername(true);
        const timer = setTimeout(() => {
            void (async () => {
                try {
                    const res = await apiGet<HandleAvailabilityResponseDto>(
                        `/v1/api/auth/handle-available?handle=${encodeURIComponent(normalized)}`,
                        false,
                    );
                    if (generation !== availabilityGeneration.current) {
                        return;
                    }
                    if (res.data?.available) {
                        setUsernameHint('');
                    } else {
                        setUsernameHint('Username is taken');
                    }
                } catch {
                    if (generation !== availabilityGeneration.current) {
                        return;
                    }
                    setUsernameHint('Could not check availability — try again');
                } finally {
                    if (generation === availabilityGeneration.current) {
                        setCheckingUsername(false);
                    }
                }
            })();
        }, 400);

        return () => {
            clearTimeout(timer);
            availabilityGeneration.current += 1;
        };
    }, [username]);

    const handleSignUp = async () => {
        const normalizedHandle = normalizeHandleInput(username);
        if (!fullName.trim() || !normalizedHandle || !email.trim() || !password) {
            setInlineError('Name, username, email and password are required.');
            return;
        }
        if (!isValidHandleFormat(normalizedHandle)) {
            setInlineError('Username must be 3–20 lowercase letters, numbers, or underscores.');
            return;
        }
        if (usernameHint === 'Username is taken') {
            setInlineError('Choose a different username.');
            return;
        }
        if (checkingUsername) {
            setInlineError('Still checking username availability…');
            return;
        }
        if (usernameHint === 'Could not check availability — try again') {
            setInlineError('Could not verify username — check connection and try again.');
            return;
        }
        setInlineError('');
        setLoading(true);
        try {
            const trimmedEmail = email.trim();
            await register(trimmedEmail, password, fullName.trim(), normalizedHandle);
            navigation.navigate('VerifyOtp', { email: trimmedEmail });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Sign up failed';
            setInfoDialog({ title: 'Sign up failed', description: message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Image source={{ uri: BG }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient
                colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.95)']}
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
                    <Text style={styles.eyebrow}>New here</Text>
                    <Text style={styles.title}>Create your account</Text>
                    {inlineError ? <Text style={styles.errorText}>{inlineError}</Text> : null}
                    <View style={styles.form}>
                        <Input
                            dark
                            placeholder="Full name"
                            autoCapitalize="words"
                            value={fullName}
                            onChangeText={setFullName}
                            returnKeyType="next"
                            onSubmitEditing={() => usernameRef.current?.focus()}
                            blurOnSubmit={false}
                        />
                        <View>
                            <View style={styles.handleRow}>
                                <Text style={styles.handlePrefix}>@</Text>
                                <TextInput
                                    ref={usernameRef}
                                    style={styles.handleInput}
                                    placeholder="yourname"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    value={username.replace(/^@/, '')}
                                    onChangeText={(t) => setUsername(t.toLowerCase().replace(/^@/, ''))}
                                    returnKeyType="next"
                                    onSubmitEditing={() => emailRef.current?.focus()}
                                    blurOnSubmit={false}
                                />
                            </View>
                            {usernameHint ? (
                                <Text style={styles.hintText}>{usernameHint}</Text>
                            ) : checkingUsername ? (
                                <Text style={styles.hintMuted}>Checking username…</Text>
                            ) : null}
                        </View>
                        <Input
                            ref={emailRef}
                            dark
                            placeholder="Email address"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
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
                                onSubmitEditing={handleSignUp}
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

                        <Text style={styles.terms}>
                            By creating an account you agree to our{' '}
                            <Text style={styles.termsLink}>Terms</Text>
                            {' & '}
                            <Text style={styles.termsLink}>Privacy Policy</Text>
                        </Text>

                        <GradientButton
                            label="Start Styling Free"
                            loading={loading}
                            onPress={handleSignUp}
                        />
                        <OrDivider />
                        <SocialAuthRow />
                    </View>
                    <Pressable
                        onPress={() => navigation.navigate('SignIn')}
                        style={styles.switch}
                    >
                        <Text style={styles.switchText}>
                            Already have an account?{' '}
                            <Text style={styles.switchBold}>Sign in</Text>
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
        paddingBottom: 36,
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
        marginBottom: spacing.lg,
        marginTop: 4,
    },
    errorText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.status.error,
        marginTop: -spacing.sm,
        marginBottom: spacing.md,
    },
    hintText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: colors.status.error,
        marginTop: 4,
        marginLeft: 2,
    },
    hintMuted: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: 'rgba(255,255,255,0.35)',
        marginTop: 4,
        marginLeft: 2,
    },
    handleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(0,0,0,0.35)',
        borderRadius: radii.lg,
        paddingLeft: spacing.md,
        minHeight: 48,
    },
    handlePrefix: {
        fontFamily: typography.fontFamily.black,
        fontSize: 15,
        color: 'rgba(247,243,238,0.45)',
        marginRight: 2,
    },
    handleInput: {
        flex: 1,
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 15,
        color: colors.text.cream,
        paddingVertical: spacing.md,
        paddingRight: spacing.md,
    },
    form: { gap: spacing.md },
    passwordInput: { paddingRight: 44 },
    eye: { position: 'absolute', right: 14, top: 14 },
    terms: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 10,
        lineHeight: 16,
        color: 'rgba(255,255,255,0.28)',
    },
    termsLink: {
        color: colors.accent.terracotta,
        textDecorationLine: 'underline',
    },
    switch: { alignItems: 'center', marginTop: spacing.lg },
    switchText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: 'rgba(247,243,238,0.35)',
    },
    switchBold: { color: colors.accent.terracotta, fontFamily: typography.fontFamily.bold },
});

export default SignUpScreen;
