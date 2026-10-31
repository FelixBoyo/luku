import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    useFonts,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_900Black,
} from '@expo-google-fonts/outfit';
import RootNav from './navigation/RootNav';
import AuthStack from './navigation/AuthStack';
import { AppStateProvider } from './context/AppStateContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OnboardingProvider } from './context/OnboardingContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NavigationContainer } from '@react-navigation/native';
import { colors } from './theme/tokens';

import type { AuthStackParamList } from './navigation/types';
import { parseRecoveryToken } from './lib/parseRecoveryToken';
import { getActivePendingVerification } from './lib/pendingVerification';

const ONBOARDING_KEY = 'luku_onboarding_done';
const SKIP_ONBOARDING = process.env.EXPO_PUBLIC_SKIP_ONBOARDING === 'true';

const isPasswordResetUrl = (url: string): boolean =>
    url.includes('reset-password') || url.includes('type=recovery');

const AppRoot: React.FC = () => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [onboardingDone, setOnboardingDone] = useState(false);
    const [devBypass, setDevBypass] = useState(false);
    const [bootLoading, setBootLoading] = useState(true);
    const [authInitialRoute, setAuthInitialRoute] = useState<keyof AuthStackParamList>(
        SKIP_ONBOARDING ? 'SignIn' : 'Splash',
    );
    const [authStackKey, setAuthStackKey] = useState(0);
    const [passwordResetToken, setPasswordResetToken] = useState<string | undefined>();
    const [verifyOtpEmail, setVerifyOtpEmail] = useState<string | undefined>();
    const hadSession = useRef(false);
    const deepLinkHandled = useRef(false);
    const bootPendingChecked = useRef(false);

    const [fontsLoaded] = useFonts({
        Outfit_400Regular,
        Outfit_500Medium,
        Outfit_600SemiBold,
        Outfit_700Bold,
        Outfit_900Black,
    });

    useEffect(() => {
        if (SKIP_ONBOARDING) {
            setOnboardingDone(true);
            setBootLoading(false);
            return;
        }
        AsyncStorage.getItem(ONBOARDING_KEY).then((flag) => {
            setOnboardingDone(flag === 'true');
            setBootLoading(false);
        });
    }, []);

    useEffect(() => {
        const handleUrl = (url: string | null) => {
            if (url && isPasswordResetUrl(url)) {
                const token = parseRecoveryToken(url);
                if (token) setPasswordResetToken(token);
                setAuthInitialRoute('PasswordReset');
                deepLinkHandled.current = true;
            }
        };

        Linking.getInitialURL().then(handleUrl);
        const subscription = Linking.addEventListener('url', (event) => handleUrl(event.url));
        return () => subscription.remove();
    }, []);

    useEffect(() => {
        if (authLoading || bootLoading || isAuthenticated || deepLinkHandled.current) {
            return;
        }
        if (bootPendingChecked.current) {
            return;
        }
        bootPendingChecked.current = true;
        getActivePendingVerification().then((pending) => {
            if (pending) {
                setAuthInitialRoute('VerifyOtp');
                setVerifyOtpEmail(pending.email);
            }
        });
    }, [authLoading, bootLoading, isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            hadSession.current = true;
            return;
        }
        if (hadSession.current) {
            setAuthInitialRoute('SignIn');
            setVerifyOtpEmail(undefined);
            setAuthStackKey((k) => k + 1);
        }
    }, [isAuthenticated]);

    const markOnboardingDone = useCallback(async () => {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        setOnboardingDone(true);
    }, []);

    const devBypassToApp = useCallback(async () => {
        if (!__DEV__) return;
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        setOnboardingDone(true);
        setDevBypass(true);
    }, []);

    if (bootLoading || authLoading || !fontsLoaded) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.accent.primary} />
                <StatusBar style="light" />
            </View>
        );
    }

    const renderRoot = () => {
        if ((isAuthenticated && onboardingDone) || (__DEV__ && devBypass)) {
            return <RootNav />;
        }
        if (isAuthenticated && !onboardingDone) {
            return (
                <NavigationContainer>
                    <AuthStack
                        initialRouteName="Onboarding"
                        passwordResetToken={passwordResetToken}
                    />
                </NavigationContainer>
            );
        }
        return (
                <NavigationContainer>
                    <AuthStack
                        key={authStackKey}
                        initialRouteName={authInitialRoute}
                        passwordResetToken={passwordResetToken}
                        verifyOtpEmail={verifyOtpEmail}
                    />
                </NavigationContainer>
        );
    };

    return (
        <AppStateProvider>
            <ToastProvider>
                <OnboardingProvider value={{ markOnboardingDone, devBypassToApp }}>
                    <StatusBar style="light" />
                    {renderRoot()}
                </OnboardingProvider>
            </ToastProvider>
        </AppStateProvider>
    );
};

const App: React.FC = () => (
    <SafeAreaProvider>
        <ErrorBoundary>
            <AuthProvider>
                <AppRoot />
            </AuthProvider>
        </ErrorBoundary>
    </SafeAreaProvider>
);

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background.shell,
    },
});

export default App;
