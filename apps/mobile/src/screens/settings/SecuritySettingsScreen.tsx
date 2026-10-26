import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../../components/shell/ScreenHeader';
import { Input } from '../../components/common/Input';
import { GradientButton } from '../../components/auth/GradientButton';
import { SettingsToggleRow } from '../../components/settings/SettingsToggleRow';
import { useToast } from '../../context/ToastContext';
import type { MeStackParamList } from '../../navigation/types';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type Props = NativeStackScreenProps<MeStackParamList, 'SecuritySettings'>;

const SecuritySettingsScreen: React.FC<Props> = ({ navigation }) => {
    const { showToast } = useToast();
    const [twoFa, setTwoFa] = useState(false);
    const [biometric, setBiometric] = useState(true);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [inlineError, setInlineError] = useState('');

    const canSubmit =
        currentPassword.length > 0 &&
        newPassword.length >= 8 &&
        newPassword === confirmPassword;

    const handleChangePassword = () => {
        if (newPassword.length < 8) {
            setInlineError('New password must be at least 8 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setInlineError('New password and confirmation do not match.');
            return;
        }
        setInlineError('');
        showToast('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    return (
        <View style={styles.container}>
            <ScreenHeader title="Security" onBack={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <Text style={styles.sectionLabel}>Change Password</Text>
                {inlineError ? <Text style={styles.errorText}>{inlineError}</Text> : null}
                <Text style={styles.label}>Current Password</Text>
                <Input
                    dark
                    secureTextEntry
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                />
                <Text style={styles.label}>New Password</Text>
                <Input
                    dark
                    secureTextEntry
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChangeText={setNewPassword}
                />
                <Text style={styles.label}>Confirm New Password</Text>
                <Input
                    dark
                    secureTextEntry
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />
                <View style={styles.submitWrap}>
                    <GradientButton
                        label="Update Password"
                        disabled={!canSubmit}
                        onPress={handleChangePassword}
                    />
                </View>

                <View style={styles.group}>
                    <SettingsToggleRow
                        label="Two-Factor Authentication"
                        description="Extra security for your account"
                        value={twoFa}
                        onToggle={() => setTwoFa((v) => !v)}
                    />
                    <SettingsToggleRow
                        label="Biometric Login"
                        description="Use Face ID or fingerprint"
                        value={biometric}
                        onToggle={() => setBiometric((v) => !v)}
                    />
                </View>
                <Text style={styles.sectionLabel}>Active Sessions</Text>
                <View style={styles.sessionCard}>
                    <Text style={styles.sessionTitle}>This device</Text>
                    <Text style={styles.sessionMeta}>Nairobi, Kenya · Active now</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    scroll: { padding: spacing.page, paddingBottom: spacing.xxl, gap: spacing.sm },
    sectionLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDarkSubtle,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    errorText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.status.error,
        marginBottom: spacing.sm,
    },
    label: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDarkMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    submitWrap: { marginTop: spacing.lg, marginBottom: spacing.xl },
    group: { gap: spacing.sm },
    sessionCard: {
        padding: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    sessionTitle: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 14,
        color: colors.text.onDark,
    },
    sessionMeta: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
        marginTop: 4,
    },
});

export default SecuritySettingsScreen;
