import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type FilterChipsProps = {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    scrollable?: boolean;
};

export const FilterChips: React.FC<FilterChipsProps> = ({
    options,
    value,
    onChange,
    scrollable = false,
}) => {
    const chips = options.map((option) => {
        const active = option === value;
        return (
            <Pressable
                key={option}
                onPress={() => onChange(option)}
                style={[styles.chip, active && styles.chipActive]}
            >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {option}
                </Text>
            </Pressable>
        );
    });

    if (scrollable) {
        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.row}
            >
                {chips}
            </ScrollView>
        );
    }
    return <View style={styles.wrap}>{chips}</View>;
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingRight: spacing.page,
    },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    chipActive: {
        backgroundColor: colors.accent.primary,
        borderColor: colors.accent.primary,
    },
    chipText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
    },
    chipTextActive: { color: colors.text.primary },
});
