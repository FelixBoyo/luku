import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme/tokens';

const BG =
    'https://images.unsplash.com/photo-1662532577856-e8ee8b138a8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

const BounceDot: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(translateY, {
                    toValue: -8,
                    duration: 300,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    easing: Easing.in(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.delay(480 - delay),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [delay, translateY]);

    return (
        <Animated.View
            style={[styles.dot, { backgroundColor: color, transform: [{ translateY }] }]}
        />
    );
};

const SplashScreen: React.FC<Props> = ({ navigation }) => {
    useEffect(() => {
        const timer = setTimeout(() => navigation.replace('Landing'), 2800);
        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View style={styles.container}>
            <Image source={{ uri: BG }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient
                colors={['rgba(0,0,0,0.65)', 'transparent', 'rgba(0,0,0,0.8)']}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.top}>
                <Text style={styles.logo}>LUKU</Text>
                <Text style={styles.tagline}>Your Style. Your Wardrobe.</Text>
            </View>
            <View style={styles.bottom}>
                <View style={styles.dots}>
                    <BounceDot delay={0} color={colors.accent.warm} />
                    <BounceDot delay={160} color={colors.accent.primary} />
                    <BounceDot delay={320} color={colors.accent.warm} />
                </View>
                <Text style={styles.caption}>Style · Shop · Sustain</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    top: { paddingTop: 80, paddingHorizontal: spacing.page },
    logo: {
        fontFamily: typography.fontFamily.black,
        fontSize: 80,
        color: colors.text.cream,
        letterSpacing: -3,
        lineHeight: 76,
        marginLeft: -4,
    },
    tagline: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.accent.warm,
        textTransform: 'uppercase',
        letterSpacing: 4,
        marginTop: spacing.md,
    },
    bottom: { flex: 1, justifyContent: 'flex-end', paddingBottom: 40, alignItems: 'center', gap: spacing.lg },
    dots: { flexDirection: 'row', gap: 8 },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    caption: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: 'rgba(247,243,238,0.3)',
        textTransform: 'uppercase',
        letterSpacing: 3,
    },
});

export default SplashScreen;
