import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../components/shell/ScreenHeader';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Legal'>;

const TERMS = `Welcome to LUKU. By using our app you agree to these terms of service. LUKU provides style discovery, wardrobe management, and marketplace features. You are responsible for account security and accurate listing information.`;

const PRIVACY = `LUKU respects your privacy. We collect profile, wardrobe, and order data to personalize recommendations. We do not sell personal data. You may request data export or deletion from Settings.`;

const LegalScreen: React.FC<Props> = ({ route, navigation }) => {
    const [tab, setTab] = useState<'terms' | 'privacy'>(route.params?.tab ?? 'terms');

    return (
        <View style={styles.container}>
            <ScreenHeader title="Legal" onBack={() => navigation.goBack()} />
            <View style={styles.tabs}>
                <Pressable
                    style={[styles.tab, tab === 'terms' && styles.tabActive]}
                    onPress={() => setTab('terms')}
                >
                    <Text style={[styles.tabText, tab === 'terms' && styles.tabTextActive]}>Terms</Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, tab === 'privacy' && styles.tabActive]}
                    onPress={() => setTab('privacy')}
                >
                    <Text style={[styles.tabText, tab === 'privacy' && styles.tabTextActive]}>Privacy</Text>
                </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.body}>{tab === 'terms' ? TERMS : PRIVACY}</Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    tabs: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.page, marginBottom: spacing.lg },
    tab: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
    },
    tabActive: { backgroundColor: colors.text.onDark, borderColor: colors.text.onDark },
    tabText: { fontFamily: typography.fontFamily.black, fontSize: 12, color: colors.text.onDark, textTransform: 'uppercase' },
    tabTextActive: { color: colors.text.primary },
    content: { paddingHorizontal: spacing.page, paddingBottom: spacing.xxl },
    body: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 15,
        color: colors.text.onDarkMuted,
        lineHeight: 24,
    },
});

export default LegalScreen;
