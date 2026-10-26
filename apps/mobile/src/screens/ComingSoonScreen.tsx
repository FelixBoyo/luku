import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell, Sparkles } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ScreenHeader } from '../components/shell/ScreenHeader';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ComingSoon'>;

const ComingSoonScreen: React.FC<Props> = ({ navigation, route }) => {
    const [notified, setNotified] = useState(false);
    const feature = route.params?.feature;

    return (
        <View style={styles.container}>
            <ScreenHeader title={feature} onBack={() => navigation.goBack()} />
            <View style={styles.content}>
                <View style={styles.iconCircle}>
                    <Sparkles color={colors.accent.primary} size={56} strokeWidth={2} />
                </View>
                <Text style={styles.title}>COMING SOON</Text>
                <Text style={styles.desc}>
                    We're working on something special. This feature will be available in a
                    future update.
                </Text>

                {!notified ? (
                    <Pressable style={styles.notifyBtn} onPress={() => setNotified(true)}>
                        <Bell color={colors.text.primary} size={18} strokeWidth={2.5} />
                        <Text style={styles.notifyText}>Notify Me</Text>
                    </Pressable>
                ) : (
                    <View style={styles.notifiedBox}>
                        <Text style={styles.notifiedText}>
                            We'll let you know when it's ready!
                        </Text>
                    </View>
                )}

                <Pressable style={styles.returnBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.returnText}>Go Back</Text>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },
    iconCircle: {
        width: 128,
        height: 128,
        borderRadius: 64,
        borderWidth: 2,
        borderColor: 'rgba(72,205,138,0.4)',
        backgroundColor: 'rgba(72,205,138,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xxl,
    },
    title: {
        fontFamily: typography.fontFamily.black,
        fontSize: 44,
        color: colors.text.onDark,
        letterSpacing: -1,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    desc: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 15,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 320,
        marginBottom: spacing.xxl,
    },
    notifyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.accent.primary,
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.lg,
        borderRadius: radii.lg,
    },
    notifyText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    notifiedBox: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    notifiedText: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 14,
        color: colors.accent.primary,
    },
    returnBtn: { marginTop: spacing.xxl },
    returnText: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});

export default ComingSoonScreen;
