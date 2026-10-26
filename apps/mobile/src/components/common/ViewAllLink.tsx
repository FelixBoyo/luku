import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, spacing, typography } from '../../theme/tokens';

type Props = {
    label: string;
    onPress: () => void;
    align?: 'center' | 'end';
};

export const ViewAllLink: React.FC<Props> = ({ label, onPress, align = 'center' }) => (
    <Pressable
        style={[styles.row, align === 'end' && styles.rowEnd]}
        onPress={onPress}
    >
        <Text style={styles.text}>{label}</Text>
        <ChevronRight size={16} color={colors.accent.primary} strokeWidth={2.5} />
    </Pressable>
);

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.sm,
    },
    rowEnd: {
        justifyContent: 'flex-end',
        paddingVertical: 0,
    },
    text: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.accent.primary,
    },
});
