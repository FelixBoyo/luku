import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type Props = {
    label: string;
    description?: string;
    value: boolean;
    onToggle: () => void;
};

export const SettingsToggleRow: React.FC<Props> = ({
    label,
    description,
    value,
    onToggle,
}) => (
    <Pressable style={styles.row} onPress={onToggle}>
        <View style={styles.body}>
            <Text style={styles.label}>{label}</Text>
            {description ? <Text style={styles.desc}>{description}</Text> : null}
        </View>
        <View style={[styles.track, value && styles.trackOn]}>
            <View style={[styles.thumb, value && styles.thumbOn]} />
        </View>
    </Pressable>
);

const styles = StyleSheet.create({
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
    body: { flex: 1 },
    label: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 14,
        color: colors.text.onDark,
    },
    desc: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
        marginTop: 2,
    },
    track: {
        width: 44,
        height: 26,
        borderRadius: 13,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    trackOn: { backgroundColor: colors.accent.primary },
    thumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.text.onDark,
    },
    thumbOn: { alignSelf: 'flex-end' },
});
