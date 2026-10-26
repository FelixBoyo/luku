import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';

export const OrDivider: React.FC = () => (
    <View style={styles.row}>
        <View style={styles.line} />
        <Text style={styles.label}>or</Text>
        <View style={styles.line} />
    </View>
);

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: 4,
    },
    line: { flex: 1, height: 1, backgroundColor: colors.border.dark },
    label: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: 'rgba(255,255,255,0.25)',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
});
