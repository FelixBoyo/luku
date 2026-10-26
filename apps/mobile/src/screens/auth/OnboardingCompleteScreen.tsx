import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Sparkles } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useOnboarding } from '../../context/OnboardingContext';
import { colors, radii, spacing, typography } from '../../theme/tokens';

const FEATURES = [
    'AI-powered recommendations',
    'Personalized style matches',
    'Smart wardrobe tracking',
];

type Props = NativeStackScreenProps<AuthStackParamList, 'OnboardingComplete'>;

const OnboardingCompleteScreen: React.FC<Props> = ({ navigation }) => {
    const { markOnboardingDone } = useOnboarding();
    const progress = useRef(new Animated.Value(0)).current;
    const ping = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        let active = true;

        Animated.loop(
            Animated.timing(ping, {
                toValue: 1,
                duration: 1400,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            })
        ).start();

        Animated.timing(progress, {
            toValue: 1,
            duration: 2600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
        }).start();

        const timer = setTimeout(async () => {
            await markOnboardingDone();
            if (!active) return;
            // If no session caused an app-level swap, fall back to Sign In.
            navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
        }, 3000);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [markOnboardingDone, navigation, ping, progress]);

    const widthInterpolate = progress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });
    const pingScale = ping.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
    const pingOpacity = ping.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0] });

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(72,205,138,0.2)', '#000000', 'rgba(58,184,122,0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            <View style={[styles.sparkle, styles.sparkleTopLeft]}>
                <Sparkles color={colors.accent.primary} size={32} strokeWidth={2} />
            </View>
            <View style={[styles.sparkle, styles.sparkleRight]}>
                <Sparkles color={colors.accent.primary} size={40} strokeWidth={2} />
            </View>
            <View style={[styles.sparkle, styles.sparkleBottomRight]}>
                <Sparkles color={colors.accent.bright} size={24} strokeWidth={2} />
            </View>

            <View style={styles.content}>
                <View style={styles.iconWrap}>
                    <Animated.View
                        style={[
                            styles.ping,
                            { transform: [{ scale: pingScale }], opacity: pingOpacity },
                        ]}
                    />
                    <LinearGradient
                        colors={[colors.accent.gradientStart, colors.accent.gradientEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.iconCircle}
                    >
                        <Check color={colors.text.primary} size={56} strokeWidth={3} />
                    </LinearGradient>
                </View>

                <Text style={styles.title}>ALL SET!</Text>
                <Text style={styles.subtitle}>
                    Your style profile is ready. We're curating personalized picks just for
                    you.
                </Text>

                <View style={styles.features}>
                    {FEATURES.map((feature) => (
                        <View key={feature} style={styles.featureRow}>
                            <View style={styles.featureCheck}>
                                <Check color={colors.text.primary} size={14} strokeWidth={3} />
                            </View>
                            <Text style={styles.featureText}>{feature}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.progressWrap}>
                    <View style={styles.progressTrack}>
                        <Animated.View style={[styles.progressFill, { width: widthInterpolate }]}>
                            <LinearGradient
                                colors={[colors.accent.gradientStart, colors.accent.gradientEnd]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={StyleSheet.absoluteFill}
                            />
                        </Animated.View>
                    </View>
                    <Text style={styles.progressLabel}>
                        Loading your personalized feed...
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.shell,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },
    sparkle: { position: 'absolute', opacity: 0.3 },
    sparkleTopLeft: { top: 80, left: 40 },
    sparkleRight: { top: '33%', right: 32 },
    sparkleBottomRight: { bottom: 128, right: 64 },
    content: { alignItems: 'center', width: '100%' },
    iconWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxl },
    ping: {
        position: 'absolute',
        width: 128,
        height: 128,
        borderRadius: 64,
        borderWidth: 4,
        borderColor: colors.accent.primary,
    },
    iconCircle: {
        width: 128,
        height: 128,
        borderRadius: 64,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    title: {
        fontFamily: typography.fontFamily.black,
        fontSize: 48,
        color: colors.text.onDark,
        letterSpacing: -2,
        marginBottom: spacing.lg,
    },
    subtitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 340,
        marginBottom: spacing.xxl,
    },
    features: { gap: spacing.lg, marginBottom: 48 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    featureCheck: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.accent.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 15,
        color: colors.text.onDark,
    },
    progressWrap: { width: '100%', maxWidth: 280 },
    progressTrack: {
        height: 8,
        borderRadius: radii.pill,
        backgroundColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
    progressFill: { height: '100%', borderRadius: radii.pill, overflow: 'hidden' },
    progressLabel: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
    },
});

export default OnboardingCompleteScreen;
