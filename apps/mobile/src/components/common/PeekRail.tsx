import React from 'react';
import { ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { spacing } from '../../theme/tokens';

type Props = {
    children: React.ReactNode;
    contentContainerStyle?: ViewStyle;
};

export const PeekRail: React.FC<Props> = ({ children, contentContainerStyle }) => (
    <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        contentContainerStyle={[styles.content, contentContainerStyle]}
    >
        {children}
    </ScrollView>
);

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: spacing.page,
        paddingRight: spacing.page * 2,
        gap: spacing.md,
        flexDirection: 'row',
    },
});
