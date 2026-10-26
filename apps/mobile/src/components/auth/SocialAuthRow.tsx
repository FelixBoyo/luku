import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '../../theme/tokens';
import { InfoDialog } from '../common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import {
    isNativeAppleSignInAvailable,
    isNativeGoogleSignInAvailable,
} from '../../lib/nativeSocialAuth';
import {
    NativeSocialAuthUnavailableError,
    SocialAuthCancelled,
} from '../../lib/socialAuth';
import { GoogleIcon } from './GoogleIcon';
import { AppleIcon } from './AppleIcon';

type SocialAuthRowProps = {
    /** Optional overrides; when omitted, native provider sign-in is used. */
    onGoogle?: () => void;
    onApple?: () => void;
};

export const SocialAuthRow: React.FC<SocialAuthRowProps> = ({
    onGoogle,
    onApple,
}) => {
    const { signInWithGoogle, signInWithApple } = useAuth();
    const [info, setInfo] = useState<{ title: string; description: string } | null>(
        null,
    );
    const [busy, setBusy] = useState<'google' | 'apple' | null>(null);

    const showGoogle = isNativeGoogleSignInAvailable();
    const showApple = isNativeAppleSignInAvailable();

    const run = async (provider: 'google' | 'apple', action: () => Promise<void>) => {
        if (busy) return;
        setBusy(provider);
        try {
            await action();
        } catch (error) {
            if (error instanceof SocialAuthCancelled) return;
            if (error instanceof NativeSocialAuthUnavailableError) {
                setInfo({ title: 'Sign-in unavailable', description: error.message });
                return;
            }
            const message = error instanceof Error ? error.message : 'Sign-in failed';
            setInfo({ title: 'Sign-in failed', description: message });
        } finally {
            setBusy(null);
        }
    };

    const handleGoogle = onGoogle ?? (() => run('google', signInWithGoogle));
    const handleApple = onApple ?? (() => run('apple', signInWithApple));

    if (!showGoogle && !showApple) {
        return null;
    }

    return (
        <>
            <View style={styles.row}>
                {showGoogle ? (
                    <Pressable
                        style={styles.btn}
                        onPress={handleGoogle}
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
                        style={styles.btn}
                        onPress={handleApple}
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
            </View>
            <InfoDialog
                visible={info !== null}
                title={info?.title ?? ''}
                description={info?.description ?? ''}
                onClose={() => setInfo(null)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing.md },
    btn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default SocialAuthRow;
