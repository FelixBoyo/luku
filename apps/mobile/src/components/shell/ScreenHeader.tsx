import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type ScreenHeaderProps = {
    title?: string;
    subtitle?: string;
    onBack?: () => void;
    right?: React.ReactNode;
    showBack?: boolean;
};

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
    title,
    subtitle,
    onBack,
    right,
    showBack = true,
}) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
            <View style={styles.row}>
                {showBack ? (
                    <Pressable
                        onPress={onBack}
                        style={styles.iconBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                    >
                        <ChevronLeft color={colors.text.onDark} size={22} strokeWidth={2.5} />
                    </Pressable>
                ) : (
                    <View style={styles.iconBtn} />
                )}

                {title ? (
                    <View style={styles.titleWrap}>
                        <Text style={styles.title} numberOfLines={1}>
                            {title}
                        </Text>
                        {subtitle ? (
                            <Text style={styles.subtitle} numberOfLines={2}>
                                {subtitle}
                            </Text>
                        ) : null}
                    </View>
                ) : (
                    <View style={styles.flex} />
                )}

                <View style={styles.rightSlot}>{right}</View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        backgroundColor: 'rgba(0,0,0,0.9)',
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.page,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.dark,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    flex: { flex: 1 },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleWrap: { flex: 1, alignItems: 'center' },
    title: {
        textAlign: 'center',
        fontFamily: typography.fontFamily.black,
        fontSize: 15,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    subtitle: {
        textAlign: 'center',
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
        marginTop: 4,
        paddingHorizontal: spacing.sm,
    },
    rightSlot: { minWidth: 36, alignItems: 'flex-end' },
});
