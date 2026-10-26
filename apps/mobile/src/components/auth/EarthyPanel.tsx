import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../../theme/tokens';

type EarthyPanelProps = {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
};

/**
 * Bottom auth panel matching the design's
 * `linear-gradient(to top, #130B04 88%, transparent)` espresso-brown rise.
 */
export const EarthyPanel: React.FC<EarthyPanelProps> = ({ children, style }) => (
    <View style={[styles.wrap, style]}>
        <LinearGradient
            colors={['transparent', colors.background.earthyPanel, colors.background.earthyPanel]}
            locations={[0, 0.12, 1]}
            style={StyleSheet.absoluteFill}
        />
        <View style={styles.content}>{children}</View>
    </View>
);

const styles = StyleSheet.create({
    wrap: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    content: {
        paddingHorizontal: spacing.page,
        paddingBottom: 40,
        paddingTop: spacing.xxl,
    },
});
