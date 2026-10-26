import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type Props = {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
};

export const CollectionSearch = React.forwardRef<TextInput, Props>(
    ({ value, onChangeText, placeholder = 'Search…' }, ref) => (
        <View style={styles.wrap}>
            <Search size={18} color={colors.text.onDarkSubtle} strokeWidth={2.5} />
            <TextInput
                ref={ref}
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={colors.text.onDarkSubtle}
                value={value}
                onChangeText={onChangeText}
            />
        </View>
    ),
);

CollectionSearch.displayName = 'CollectionSearch';

const styles = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    input: {
        flex: 1,
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDark,
    },
});
