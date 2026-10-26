import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { LucideIcon } from 'lucide-react-native';
import {
    Banknote,
    Bell,
    ChevronRight,
    CreditCard,
    Globe,
    HelpCircle,
    Lock,
    LogOut,
    Mail,
    Shield,
    User,
} from 'lucide-react-native';
import { ScreenHeader } from '../components/shell/ScreenHeader';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useRootNavigation } from '../navigation/useRootNavigation';
import type { MeStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<MeStackParamList, 'Settings'>;

type SettingsRow = {
    icon: LucideIcon;
    label: string;
    description?: string;
    action: string;
};

const SECTIONS: { title: string; rows: SettingsRow[] }[] = [
    {
        title: 'Account',
        rows: [
            { icon: Lock, label: 'Password & Security', description: 'Change password, 2FA', action: 'security' },
            { icon: CreditCard, label: 'Payment Methods', description: 'Cards, billing', action: 'payment' },
            { icon: Banknote, label: 'Payout Details', description: 'Where you get paid as a seller', action: 'payout' },
        ],
    },
    {
        title: 'Preferences',
        rows: [
            { icon: Bell, label: 'Notifications', description: 'Push, email, SMS', action: 'notifications' },
            { icon: Globe, label: 'Language & Region', description: 'English, Kenya', action: 'language' },
        ],
    },
    {
        title: 'Privacy & Safety',
        rows: [
            { icon: Shield, label: 'Privacy Controls', description: 'Who can see your content', action: 'privacy' },
            { icon: User, label: 'Blocked Accounts', description: 'Manage blocked users', action: 'blocked' },
        ],
    },
    {
        title: 'Support',
        rows: [
            { icon: HelpCircle, label: 'Help & FAQ', description: 'Get support', action: 'help' },
            { icon: Mail, label: 'Contact Us', description: 'Send feedback', action: 'contact' },
        ],
    },
    {
        title: 'Legal',
        rows: [
            { icon: ChevronRight, label: 'Terms of Service', action: 'terms' },
            { icon: ChevronRight, label: 'Privacy Policy', action: 'privacy-policy' },
        ],
    },
];

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
    const rootNav = useRootNavigation();
    const { logout } = useAuth();
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

    const handleSignOut = async () => {
        setShowSignOutConfirm(false);
        await logout();
    };

    const handleAction = (action: string) => {
        switch (action) {
            case 'security':
                navigation.navigate('SecuritySettings');
                break;
            case 'language':
                navigation.navigate('LanguageRegion');
                break;
            case 'privacy':
                navigation.navigate('PrivacySettings');
                break;
            case 'blocked':
                navigation.navigate('BlockedAccounts');
                break;
            case 'contact':
                navigation.navigate('Contact');
                break;
            case 'payment':
                navigation.navigate('PaymentMethods');
                break;
            case 'payout':
                navigation.navigate('PayoutDetails');
                break;
            case 'notifications':
                rootNav.navigate('Notifications');
                break;
            case 'help':
                rootNav.navigate('Help');
                break;
            case 'terms':
                rootNav.navigate('Legal', { tab: 'terms' });
                break;
            case 'privacy-policy':
                rootNav.navigate('Legal', { tab: 'privacy' });
                break;
            default:
                break;
        }
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Settings"
                subtitle="Manage your account and preferences"
                onBack={() => navigation.goBack()}
            />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {SECTIONS.map((section) => (
                    <View key={section.title} style={styles.section}>
                        <Text style={styles.sectionLabel}>{section.title}</Text>
                        <View style={styles.sectionList}>
                            {section.rows.map((row) => {
                                const Icon = row.icon;
                                return (
                                    <Pressable
                                        key={row.label}
                                        style={styles.row}
                                        onPress={() => handleAction(row.action)}
                                    >
                                        <View style={styles.rowIcon}>
                                            <Icon size={20} color={colors.text.onDark} strokeWidth={2.5} />
                                        </View>
                                        <View style={styles.rowBody}>
                                            <Text style={styles.rowLabel}>{row.label}</Text>
                                            {row.description ? (
                                                <Text style={styles.rowDesc}>{row.description}</Text>
                                            ) : null}
                                        </View>
                                        <ChevronRight size={18} color={colors.text.onDarkMuted} strokeWidth={2.5} />
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                ))}

                <Pressable style={styles.signOut} onPress={() => setShowSignOutConfirm(true)}>
                    <LogOut size={18} color={colors.text.onDark} strokeWidth={2.5} />
                    <Text style={styles.signOutText}>Sign Out</Text>
                </Pressable>

                <ConfirmDialog
                    visible={showSignOutConfirm}
                    title="Sign out"
                    description="Are you sure you want to sign out?"
                    confirmLabel="Sign out"
                    onCancel={() => setShowSignOutConfirm(false)}
                    onConfirm={() => {
                        setShowSignOutConfirm(false);
                        void handleSignOut();
                    }}
                />

                <View style={styles.appInfo}>
                    <Text style={styles.appName}>LUKU</Text>
                    <Text style={styles.appVersion}>Version 1.0.0</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    scroll: { paddingHorizontal: spacing.page, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
    section: { marginBottom: spacing.xl },
    sectionLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDarkSubtle,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: spacing.md,
    },
    sectionList: { gap: spacing.sm },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    rowIcon: {
        width: 40,
        height: 40,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    rowBody: { flex: 1 },
    rowLabel: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 14,
        color: colors.text.onDark,
    },
    rowDesc: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
        marginTop: 2,
    },
    signOut: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginTop: spacing.md,
    },
    signOutText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    appInfo: { alignItems: 'center', marginTop: spacing.xxl, gap: 4 },
    appName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.onDark,
    },
    appVersion: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkSubtle,
    },
});

export default SettingsScreen;