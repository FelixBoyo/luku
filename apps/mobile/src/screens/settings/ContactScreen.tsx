import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../../components/shell/ScreenHeader';
import type { MeStackParamList } from '../../navigation/types';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type Props = NativeStackScreenProps<MeStackParamList, 'Contact'>;

const CATEGORIES = ['Feedback', 'Bug Report', 'Account Issue', 'Other'];

const ContactScreen: React.FC<Props> = ({ navigation }) => {
    const [category, setCategory] = useState('Feedback');
    const [message, setMessage] = useState('');

    return (
        <View style={styles.container}>
            <ScreenHeader title="Contact Us" onBack={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.chips}>
                    {CATEGORIES.map((c) => (
                        <Pressable
                            key={c}
                            style={[styles.chip, category === c && styles.chipActive]}
                            onPress={() => setCategory(c)}
                        >
                            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>
                                {c}
                            </Text>
                        </Pressable>
                    ))}
                </View>
                <Text style={styles.label}>Message</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Tell us how we can help..."
                    placeholderTextColor={colors.text.onDarkSubtle}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                />
                <Pressable style={[styles.submit, !message.trim() && styles.submitDisabled]}>
                    <Text style={styles.submitText}>Send Message</Text>
                </Pressable>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    scroll: { padding: spacing.page, paddingBottom: spacing.xxl },
    label: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDarkSubtle,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: spacing.sm,
        marginTop: spacing.lg,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    chipActive: {
        borderColor: colors.accent.primary,
        backgroundColor: 'rgba(72,205,138,0.15)',
    },
    chipText: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
    },
    chipTextActive: { color: colors.accent.primary },
    input: {
        minHeight: 140,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: spacing.lg,
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDark,
    },
    submit: {
        marginTop: spacing.xl,
        paddingVertical: spacing.lg,
        borderRadius: radii.lg,
        backgroundColor: colors.accent.primary,
        alignItems: 'center',
    },
    submitDisabled: { opacity: 0.4 },
    submitText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.primary,
        textTransform: 'uppercase',
    },
});

export default ContactScreen;
