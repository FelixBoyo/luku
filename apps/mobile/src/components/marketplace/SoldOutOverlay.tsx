import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, typography } from '../../theme/tokens';

/**
 * Dim + corner chip used on every product surface so featured, hero and grid
 * cannot disagree about what sold-out looks like. The parent still owns tap
 * handling; this only paints the state. Image dimming stays on the parent
 * via `SOLD_OUT_IMAGE_OPACITY`.
 */
export const SOLD_OUT_IMAGE_OPACITY = 0.35;

export const SoldOutOverlay: React.FC = () => (
    <View style={styles.overlay} pointerEvents="none">
        <Text style={styles.chip}>SOLD OUT</Text>
    </View>
);

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFill,
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        padding: 8,
    },
    chip: {
        fontFamily: typography.fontFamily.black,
        fontSize: 9,
        letterSpacing: 0.6,
        color: colors.text.onDark,
        backgroundColor: colors.background.shell,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: radii.sm,
        overflow: 'hidden',
    },
});
