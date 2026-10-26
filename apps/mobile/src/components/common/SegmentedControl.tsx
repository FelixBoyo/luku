import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type Segment = {
    label: string;
    value: string;
    badge?: string | number;
};

type SegmentedControlProps = {
    segments: Segment[];
    activeSegment: string;
    onChange: (value: string) => void;
    dark?: boolean;
    scrollable?: boolean;
};

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
    segments,
    activeSegment,
    onChange,
    dark = false,
    scrollable = false,
}) => {
    const content = segments.map((segment) => {
        const isActive = activeSegment === segment.value;
        return (
            <Pressable
                key={segment.value}
                onPress={() => onChange(segment.value)}
                style={[
                    styles.segment,
                    dark ? styles.segmentDark : styles.segmentLight,
                    isActive &&
                        (dark ? styles.segmentActiveDark : styles.segmentActiveLight),
                ]}
            >
                <Text
                    style={[
                        styles.segmentText,
                        dark
                            ? isActive
                                ? styles.textActiveDark
                                : styles.textDark
                            : isActive
                              ? styles.textActiveLight
                              : styles.textLight,
                    ]}
                >
                    {segment.label}
                    {segment.badge !== undefined ? ` (${segment.badge})` : ''}
                </Text>
            </Pressable>
        );
    });

    if (scrollable) {
        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                    styles.row,
                    dark ? styles.containerDark : styles.containerLight,
                ]}
            >
                {content}
            </ScrollView>
        );
    }

    return (
        <View style={[styles.row, dark ? styles.containerDark : styles.containerLight]}>
            {content}
        </View>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: spacing.xs,
        padding: spacing.xs,
        borderRadius: radii.lg,
    },
    containerLight: {
        backgroundColor: colors.background.muted,
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.2)',
    },
    containerDark: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    segment: {
        flex: 1,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: radii.md,
        alignItems: 'center',
    },
    segmentLight: { backgroundColor: 'transparent' },
    segmentDark: { backgroundColor: 'transparent' },
    segmentActiveLight: {
        backgroundColor: colors.background.card,
        borderWidth: 2,
        borderColor: colors.border.black30,
    },
    segmentActiveDark: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: colors.accent.primary,
    },
    segmentText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    textLight: { color: 'rgba(0,0,0,0.6)' },
    textActiveLight: { color: colors.text.primary },
    textDark: { color: colors.text.onDarkMuted },
    textActiveDark: { color: colors.accent.primary },
});
