import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { WardrobeItem } from '../../types/domain/wardrobe';
import { colors, radii, spacing, typography } from '../../theme/tokens';

export type WardrobeFormValues = {
    name: string;
    brand: string;
    description: string;
    category: string;
    size: string;
    condition: string;
    purchasePrice: string;
};

type Props = {
    values: WardrobeFormValues;
    onChange: (patch: Partial<WardrobeFormValues>) => void;
    item?: Pick<WardrobeItem, 'source' | 'purchasePrice'>;
    categories?: string[];
    sizes?: string[];
    conditions?: string[];
};

const DEFAULT_CATS = ['Tops', 'Bottoms', 'Outerwear', 'Dresses', 'Shoes', 'Accessories', 'Bags'];
const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];
const DEFAULTCONDS = ['New / Never Worn', 'Gently Used', 'Used', 'Very Worn'];

const Chip: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({
    label,
    active,
    onPress,
}) => (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
);

export const WardrobeItemForm: React.FC<Props> = ({
    values,
    onChange,
    item,
    categories = DEFAULT_CATS,
    sizes = DEFAULT_SIZES,
    conditions = DEFAULTCONDS,
}) => {
    const priceReadOnly = item?.source === 'purchase';

    return (
        <View style={styles.wrap}>
            <Text style={styles.label}>Item Name</Text>
            <TextInput
                style={styles.input}
                value={values.name}
                onChangeText={(name) => onChange({ name })}
                placeholder="e.g., Vintage Leather Jacket"
                placeholderTextColor={colors.text.onDarkSubtle}
            />
            <Text style={styles.label}>Designer / Brand</Text>
            <TextInput
                style={styles.input}
                value={values.brand}
                onChangeText={(brand) => onChange({ brand })}
                placeholder="e.g., Zara, Gucci, No Brand"
                placeholderTextColor={colors.text.onDarkSubtle}
            />
            <Text style={styles.label}>Description</Text>
            <TextInput
                style={[styles.input, styles.textarea]}
                value={values.description}
                onChangeText={(description) => onChange({ description })}
                placeholder="Notes, fit, fabric, color…"
                placeholderTextColor={colors.text.onDarkSubtle}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
            />
            <Text style={styles.label}>Category</Text>
            <View style={styles.chipRow}>
                {categories.map((c) => (
                    <Chip
                        key={c}
                        label={c}
                        active={values.category === c}
                        onPress={() => onChange({ category: c })}
                    />
                ))}
            </View>
            <Text style={styles.label}>Size</Text>
            <View style={styles.chipRow}>
                {sizes.map((s) => (
                    <Chip
                        key={s}
                        label={s}
                        active={values.size === s}
                        onPress={() => onChange({ size: s })}
                    />
                ))}
            </View>
            <Text style={styles.label}>Condition</Text>
            <View style={styles.chipRow}>
                {conditions.map((c) => (
                    <Chip
                        key={c}
                        label={c}
                        active={values.condition === c}
                        onPress={() => onChange({ condition: c })}
                    />
                ))}
            </View>
            <Text style={styles.label}>Purchase Price (KES)</Text>
            <TextInput
                style={[styles.input, priceReadOnly && styles.inputReadOnly]}
                value={values.purchasePrice}
                onChangeText={(purchasePrice) => onChange({ purchasePrice })}
                keyboardType="numeric"
                editable={!priceReadOnly}
                placeholder="0"
                placeholderTextColor={colors.text.onDarkSubtle}
            />
            {priceReadOnly ? (
                <Text style={styles.hint}>Set automatically from your purchase</Text>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: { gap: spacing.sm },
    label: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDarkSubtle,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: spacing.sm,
    },
    input: {
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: spacing.md,
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDark,
    },
    inputReadOnly: { opacity: 0.6 },
    textarea: { minHeight: 80 },
    hint: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: colors.text.onDarkSubtle,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    chipActive: {
        borderColor: colors.accent.primary,
        backgroundColor: 'rgba(72,205,138,0.15)',
    },
    chipText: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 11,
        color: colors.text.onDarkMuted,
    },
    chipTextActive: { color: colors.accent.primary },
});
