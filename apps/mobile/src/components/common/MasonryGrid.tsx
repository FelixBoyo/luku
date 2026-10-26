import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { splitMasonryColumns } from '../../lib/masonry';
import { spacing } from '../../theme/tokens';

type MasonryGridProps<T> = {
    items: T[];
    keyExtractor: (item: T, index: number) => string;
    renderItem: (item: T, index: number) => React.ReactNode;
    style?: ViewStyle;
};

export function MasonryGrid<T>({
    items,
    keyExtractor,
    renderItem,
    style,
}: MasonryGridProps<T>) {
    const [left, right] = splitMasonryColumns(items);

    return (
        <View style={[styles.masonry, style]}>
            <View style={styles.col}>
                {left.map((item, i) => (
                    <React.Fragment key={keyExtractor(item, i * 2)}>
                        {renderItem(item, i * 2)}
                    </React.Fragment>
                ))}
            </View>
            <View style={styles.col}>
                {right.map((item, i) => (
                    <React.Fragment key={keyExtractor(item, i * 2 + 1)}>
                        {renderItem(item, i * 2 + 1)}
                    </React.Fragment>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    masonry: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    col: {
        flex: 1,
        gap: spacing.md,
    },
});
