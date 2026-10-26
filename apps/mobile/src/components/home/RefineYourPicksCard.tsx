import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Sparkles, X } from 'lucide-react-native';
import { Card } from '../common/Card';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type Props = {
    onUpdatePreferences: () => void;
    onDismiss?: () => void;
};

/** Retained for future re-enable; not rendered on Home by default. */
export const RefineYourPicksCard: React.FC<Props> = ({
    onUpdatePreferences,
    onDismiss,
}) => {
    const [visible, setVisible] = useState(true);

    if (!visible) return null;

    const dismiss = () => {
        setVisible(false);
        onDismiss?.();
    };

    return (
        <View style={styles.section}>
            <Card variant="dark" padding="comfortable">
                <Pressable style={styles.close} onPress={dismiss}>
                    <X size={16} color={colors.text.onDarkMuted} />
                </Pressable>
                <View style={styles.row}>
                    <Sparkles size={24} color={colors.accent.warm} />
                    <View style={styles.body}>
                        <Text style={styles.title}>Refine Your Picks</Text>
                        <Text style={styles.desc}>
                            Update your style preferences to get better recommendations
                        </Text>
                        <Pressable style={styles.btn} onPress={onUpdatePreferences}>
                            <Text style={styles.btnText}>Update Preferences</Text>
                        </Pressable>
                    </View>
                </View>
            </Card>
        </View>
    );
};

const styles = StyleSheet.create({
    section: { paddingHorizontal: spacing.page, marginBottom: spacing.lg },
    close: { position: 'absolute', top: 12, right: 12, zIndex: 1 },
    row: { flexDirection: 'row', gap: spacing.lg },
    body: { flex: 1 },
    title: {
        fontFamily: typography.fontFamily.black,
        fontSize: 16,
        color: colors.text.onDark,
    },
    desc: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        marginTop: 4,
    },
    btn: {
        alignSelf: 'flex-start',
        marginTop: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    btnText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});

export default RefineYourPicksCard;
