import React, { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList, RootStackParamList } from '../../navigation/types';
import { colors, radii, spacing, typography } from '../../theme/tokens';

const STYLE_OPTIONS = [
    'Minimalist',
    'Vintage',
    'Bohemian',
    'Streetwear',
    'Elegant',
    'Casual',
    'Formal',
    'Athleisure',
    'Preppy',
    'Edgy',
    'Romantic',
    'Classic',
];

const COMPLETE_FEATURES = [
    'Get AI-powered outfit suggestions',
    'Build mood boards and collections',
    'Track your sustainability impact',
    'Shop curated marketplace items',
];

type Props = NativeStackScreenProps<
    RootStackParamList & AuthStackParamList,
    'Onboarding'
>;

const OnboardingScreen: React.FC<Props> = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const isPreferences = route.params?.mode === 'preferences';
    const [step, setStep] = useState(1);
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

    const toggleStyle = (style: string) =>
        setSelectedStyles((prev) =>
            prev.includes(style)
                ? prev.filter((s) => s !== style)
                : [...prev, style]
        );

    const handleStep1Continue = () => {
        if (isPreferences) navigation.goBack();
        else setStep(2);
    };

    return (
        <View style={styles.container}>
            {isPreferences ? (
                <View style={[styles.prefHeader, { paddingTop: insets.top + spacing.md }]}>
                    <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <ChevronLeft size={20} color={colors.text.onDark} strokeWidth={2.5} />
                    </Pressable>
                    <Text style={styles.prefTitle}>STYLE PREFERENCES</Text>
                </View>
            ) : (
                <View style={styles.progressWrap}>
                    <View style={styles.progressBars}>
                        {[1, 2, 3].map((num) => (
                            <View
                                key={num}
                                style={[
                                    styles.progressBar,
                                    num <= step && styles.progressBarActive,
                                ]}
                            />
                        ))}
                    </View>
                    <Text style={styles.progressLabel}>Step {step} of 3</Text>
                </View>
            )}

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {step === 1 && (
                    <View>
                        <Text style={styles.title}>
                            {isPreferences ? 'Refine Your Picks' : 'Welcome to LUKU!'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {isPreferences
                                ? 'Update your style preferences for better recommendations.'
                                : "Let's personalize your experience. What's your style?"}
                        </Text>
                        <View style={styles.chips}>
                            {STYLE_OPTIONS.map((style) => {
                                const active = selectedStyles.includes(style);
                                return (
                                    <Pressable
                                        key={style}
                                        onPress={() => toggleStyle(style)}
                                        style={[styles.chip, active && styles.chipActive]}
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                active && styles.chipTextActive,
                                            ]}
                                        >
                                            {style}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                        <Pressable
                            disabled={selectedStyles.length === 0}
                            onPress={handleStep1Continue}
                            style={[
                                styles.primaryBtn,
                                selectedStyles.length === 0 && styles.btnDisabled,
                            ]}
                        >
                            <Text style={styles.primaryBtnText}>
                                {isPreferences ? 'Save Preferences' : 'Continue'}
                            </Text>
                            <ChevronRight color={colors.text.primary} size={18} strokeWidth={3} />
                        </Pressable>
                    </View>
                )}

                {!isPreferences && step === 2 && (
                    <View>
                        <Text style={styles.title}>Build Your Wardrobe</Text>
                        <Text style={styles.subtitle}>
                            Start by adding items to your digital wardrobe. We'll use AI to
                            help you create amazing outfits.
                        </Text>
                        <View style={styles.addCard}>
                            <View style={styles.addCircle}>
                                <Text style={styles.addPlus}>+</Text>
                            </View>
                            <Text style={styles.addTitle}>Add Your First Item</Text>
                            <Text style={styles.addHint}>
                                Take a photo or upload from your gallery
                            </Text>
                        </View>
                        <View style={styles.row}>
                            <Pressable
                                onPress={() => setStep(1)}
                                style={[styles.outlineBtn, styles.flex]}
                            >
                                <Text style={styles.outlineBtnText}>Back</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setStep(3)}
                                style={[styles.primaryBtn, styles.flex]}
                            >
                                <Text style={styles.primaryBtnText}>Skip for Now</Text>
                            </Pressable>
                        </View>
                    </View>
                )}

                {!isPreferences && step === 3 && (
                    <View>
                        <View style={styles.successHeader}>
                            <LinearGradient
                                colors={[colors.accent.gradientStart, colors.accent.gradientEnd]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.successCircle}
                            >
                                <Check color={colors.text.onDark} size={44} strokeWidth={3} />
                            </LinearGradient>
                            <Text style={styles.title}>You're All Set!</Text>
                            <Text style={[styles.subtitle, styles.centered]}>
                                Welcome to LUKU. Let's start your style journey.
                            </Text>
                        </View>
                        <View style={styles.features}>
                            {COMPLETE_FEATURES.map((feature) => (
                                <View key={feature} style={styles.featureRow}>
                                    <View style={styles.featureCheck}>
                                        <Check
                                            color={colors.text.primary}
                                            size={14}
                                            strokeWidth={3}
                                        />
                                    </View>
                                    <Text style={styles.featureText}>{feature}</Text>
                                </View>
                            ))}
                        </View>
                        <Pressable
                            onPress={() => navigation.navigate('OnboardingComplete')}
                            style={styles.primaryBtn}
                        >
                            <Text style={styles.primaryBtnText}>Get Started</Text>
                        </Pressable>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    prefHeader: {
        paddingHorizontal: spacing.page,
        paddingBottom: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.dark,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: colors.border.dark,
        marginBottom: spacing.lg,
    },
    prefTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 28,
        color: colors.text.onDark,
        letterSpacing: -0.5,
    },
    progressWrap: { paddingHorizontal: spacing.xl, paddingTop: 56, paddingBottom: spacing.lg },
    progressBars: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    progressBar: {
        flex: 1,
        height: 8,
        borderRadius: radii.pill,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    progressBarActive: { backgroundColor: colors.accent.primary },
    progressLabel: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xxl,
    },
    title: {
        fontFamily: typography.fontFamily.black,
        fontSize: 30,
        color: colors.text.onDark,
        marginBottom: spacing.md,
    },
    subtitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 15,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 22,
        marginBottom: spacing.xxl,
    },
    centered: { textAlign: 'center', marginBottom: 0 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl },
    chip: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'transparent',
    },
    chipActive: { backgroundColor: colors.text.onDark, borderColor: colors.text.onDark },
    chipText: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 14,
        color: colors.text.onDark,
    },
    chipTextActive: { color: colors.text.primary },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.text.onDark,
        paddingVertical: 16,
        borderRadius: radii.lg,
    },
    primaryBtnText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    btnDisabled: { opacity: 0.4 },
    outlineBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: radii.lg,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    outlineBtnText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    row: { flexDirection: 'row', gap: spacing.md },
    flex: { flex: 1 },
    addCard: {
        alignItems: 'center',
        padding: spacing.xxl,
        marginBottom: spacing.xxl,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    addCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.4)',
        backgroundColor: 'rgba(72,205,138,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    addPlus: {
        fontFamily: typography.fontFamily.regular,
        fontSize: 40,
        color: colors.text.onDark,
        lineHeight: 44,
    },
    addTitle: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 15,
        color: colors.text.onDark,
        marginBottom: spacing.xs,
    },
    addHint: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
    },
    successHeader: { alignItems: 'center', marginBottom: spacing.xxl },
    successCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    features: { gap: spacing.md, marginBottom: spacing.xxl },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    featureCheck: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.accent.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureText: {
        flex: 1,
        fontFamily: typography.fontFamily.bold,
        fontSize: 14,
        color: colors.text.onDark,
    },
});

export default OnboardingScreen;
