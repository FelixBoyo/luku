import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type Props = {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    right?: React.ReactNode;
    search?: React.ReactNode;
    children?: React.ReactNode;
};

export const CollectionHeader: React.FC<Props> = ({
    title,
    subtitle,
    onBack,
    right,
    search,
    children,
}) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.wrap, { paddingTop: insets.top + spacing.lg }]}>
            <View style={styles.topRow}>
                {onBack ? (
                    <Pressable style={styles.backBtn} onPress={onBack}>
                        <ChevronLeft size={20} color={colors.text.onDark} strokeWidth={2.5} />
                    </Pressable>
                ) : (
                    <View style={styles.backPlaceholder} />
                )}
                {right ? <View style={styles.right}>{right}</View> : null}
            </View>
            <View>
                <Text style={styles.title}>{title}</Text>
                <View style={styles.titleUnderline} />
            </View>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            {search ? <View style={styles.searchSlot}>{search}</View> : null}
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        paddingHorizontal: spacing.page,
        paddingBottom: spacing.lg,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    backPlaceholder: { width: 40, height: 40 },
    right: { marginLeft: 'auto' },
    title: {
        fontFamily: typography.fontFamily.black,
        fontSize: 36,
        color: colors.text.onDark,
        letterSpacing: -1,
    },
    titleUnderline: {
        height: 4,
        backgroundColor: colors.accent.primary,
        borderRadius: 2,
        marginTop: 4,
        width: 80,
    },
    subtitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        marginTop: spacing.md,
    },
    searchSlot: {
        marginTop: spacing.lg,
    },
});
