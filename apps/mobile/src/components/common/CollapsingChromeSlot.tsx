import React from 'react';
import { Animated, Pressable, StyleSheet, View, type Animated as AnimatedType } from 'react-native';
import { Search } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

export const COMPACT_CHROME_HEIGHT = 48;

type CollapsingChromeSlotProps = {
    collapsed: boolean;
    fullOpacity: AnimatedType.Value;
    compactOpacity: AnimatedType.Value;
    fullChrome: React.ReactNode;
    compactChrome: React.ReactNode;
    compactHeight?: number;
};

export const CollapsingChromeSlot: React.FC<CollapsingChromeSlotProps> = ({
    collapsed,
    fullOpacity,
    compactOpacity,
    fullChrome,
    compactChrome,
    compactHeight = COMPACT_CHROME_HEIGHT,
}) => (
    <View
        style={[
            styles.chromeSlot,
            collapsed && { height: compactHeight, marginBottom: spacing.sm },
        ]}
    >
        <Animated.View
            style={[
                styles.fullChrome,
                { opacity: fullOpacity },
                collapsed && styles.fullChromeHidden,
            ]}
            pointerEvents={collapsed ? 'none' : 'auto'}
        >
            {fullChrome}
        </Animated.View>

        <Animated.View
            style={[styles.compactChrome, { opacity: compactOpacity, height: compactHeight }]}
            pointerEvents={collapsed ? 'auto' : 'none'}
        >
            {compactChrome}
        </Animated.View>
    </View>
);

type CompactSearchButtonProps = {
    onPress: () => void;
};

export const CompactSearchButton: React.FC<CompactSearchButtonProps> = ({ onPress }) => (
    <Pressable style={styles.compactSearchBtn} onPress={onPress}>
        <Search size={16} color={colors.text.onDark} strokeWidth={2.5} />
    </Pressable>
);

export const compactTabChipStyles = StyleSheet.create({
    chip: {
        flex: 1,
        height: 40,
        borderRadius: radii.pill,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: colors.border.dark,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    chipText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDark,
        textTransform: 'uppercase',
    },
});

const styles = StyleSheet.create({
    chromeSlot: {
        flexGrow: 0,
        position: 'relative',
    },
    fullChrome: { flexGrow: 0 },
    fullChromeHidden: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 0,
        overflow: 'hidden',
    },
    compactChrome: {
        position: 'absolute',
        top: 0,
        left: spacing.page,
        right: spacing.page,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    compactSearchBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: colors.border.dark,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
