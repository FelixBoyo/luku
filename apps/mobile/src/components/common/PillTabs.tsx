import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

export type PillTab = {
    id: string;
    label: string;
    badge?: number;
};

type Props = {
    tabs: PillTab[];
    activeId: string;
    onChange: (id: string) => void;
    scrollable?: boolean;
};

export const PillTabs: React.FC<Props> = ({ tabs, activeId, onChange, scrollable }) => {
    const content = tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
            <Pressable
                key={tab.id}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => onChange(tab.id)}
            >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {tab.label}
                    {tab.badge != null && tab.badge > 0 ? ` (${tab.badge})` : ''}
                </Text>
            </Pressable>
        );
    });

    if (scrollable) {
        return (
            <View style={styles.scrollableWrap}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {content}
                </ScrollView>
            </View>
        );
    }

    return <View style={styles.row}>{content}</View>;
};

const styles = StyleSheet.create({
    scrollableWrap: { flexGrow: 0 },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.page,
        marginBottom: spacing.lg,
    },
    scrollContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.page,
        marginBottom: spacing.lg,
    },
    tab: {
        minHeight: 36,
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radii.md,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    tabActive: {
        backgroundColor: colors.text.onDark,
        borderColor: colors.text.onDark,
    },
    tabText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        lineHeight: 16,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        includeFontPadding: false,
    },
    tabTextActive: {
        color: colors.text.primary,
    },
});
