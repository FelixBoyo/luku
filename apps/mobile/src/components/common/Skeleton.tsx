import React, { useEffect, useRef, useState } from 'react';
import {
    AccessibilityInfo,
    Animated,
    StyleSheet,
    View,
    type DimensionValue,
    type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii } from '../../theme/tokens';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

type SkeletonProps = {
    width?: DimensionValue;
    height?: DimensionValue;
    style?: ViewStyle | ViewStyle[];
    borderRadius?: number;
    aspectRatio?: number;
    flex?: boolean;
};

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height,
    style,
    borderRadius = radii.md,
    aspectRatio,
    flex,
}) => {
    const shimmer = useRef(new Animated.Value(0)).current;
    const pulse = useRef(new Animated.Value(0.4)).current;
    const [reduceMotion, setReduceMotion] = useState(false);
    const [boxWidth, setBoxWidth] = useState(0);

    useEffect(() => {
        let mounted = true;
        AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
            if (mounted) setReduceMotion(enabled);
        });
        const sub = AccessibilityInfo.addEventListener(
            'reduceMotionChanged',
            (enabled) => setReduceMotion(enabled),
        );
        return () => {
            mounted = false;
            sub.remove();
        };
    }, []);

    useEffect(() => {
        if (reduceMotion) {
            const anim = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulse, {
                        toValue: 0.7,
                        duration: 700,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulse, {
                        toValue: 0.4,
                        duration: 700,
                        useNativeDriver: true,
                    }),
                ]),
            );
            anim.start();
            return () => anim.stop();
        }
        const anim = Animated.loop(
            Animated.timing(shimmer, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
            }),
        );
        anim.start();
        return () => anim.stop();
    }, [reduceMotion, shimmer, pulse]);

    const dimensionStyle: ViewStyle = {
        width,
        borderRadius,
        ...(aspectRatio ? { aspectRatio } : null),
        ...(height != null ? { height } : null),
        ...(flex ? { flex: 1 } : null),
    };

    if (reduceMotion) {
        return (
            <Animated.View
                style={[styles.base, dimensionStyle, { opacity: pulse }, style]}
            />
        );
    }

    const translateX = shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [-boxWidth, boxWidth],
    });

    return (
        <View
            style={[styles.base, dimensionStyle, style]}
            onLayout={(e) => setBoxWidth(e.nativeEvent.layout.width)}
        >
            <AnimatedGradient
                colors={[
                    'transparent',
                    'rgba(255,255,255,0.18)',
                    'transparent',
                ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}
            />
        </View>
    );
};

export const SkeletonCard: React.FC = () => (
    <View style={styles.card}>
        <Skeleton height={160} borderRadius={radii.lg} />
        <Skeleton height={14} width="70%" style={styles.gap} />
        <Skeleton height={12} width="50%" />
    </View>
);

const styles = StyleSheet.create({
    base: { backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
    card: { gap: 8, marginBottom: 12 },
    gap: { marginTop: 8 },
});
