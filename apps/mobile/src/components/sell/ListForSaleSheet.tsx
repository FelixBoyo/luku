import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { BottomSheet } from '../common/BottomSheet';
import { GradientButton } from '../auth/GradientButton';
import type { WardrobeItem } from '../../types/domain/wardrobe';
import { colors, radii, spacing, typography } from '../../theme/tokens';

export type QuickListPayload = { price: number; condition: string };

type Props = {
    visible: boolean;
    item: WardrobeItem | null;
    onClose: () => void;
    onList: (payload: QuickListPayload) => void | Promise<void>;
    onFullDetails: (wardrobeItemId: string) => void;
};

export const ListForSaleSheet: React.FC<Props> = ({
    visible,
    item,
    onClose,
    onList,
    onFullDetails,
}) => {
    const [price, setPrice] = useState('');
    const [condition, setCondition] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (item) {
            setPrice('');
            setCondition(item.condition);
            setSubmitting(false);
        }
    }, [item?.id, visible]);

    if (!item) return null;

    const priceValid = Number(price) > 0;

    const handleList = async () => {
        if (submitting || !priceValid) return;
        setSubmitting(true);
        try {
            await onList({ price: Number(price) || 0, condition });
            onClose();
        } catch {
            // leave sheet open with the error already surfaced by the caller;
            // re-enable so the user can retry
            setSubmitting(false);
        }
    };

    return (
        <BottomSheet visible={visible} onClose={onClose} title="List for Sale">
            <View style={styles.preview}>
                <Image source={{ uri: item.imageUrl }} style={styles.thumb} contentFit="cover" />
                <View style={styles.previewMeta}>
                    <Text style={styles.previewName}>{item.name}</Text>
                    <Text style={styles.previewSub}>
                        {item.brand} · {item.size} · {item.category}
                    </Text>
                </View>
            </View>

            <Text style={styles.label}>Listing Price (KES)</Text>
            <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.text.onDarkSubtle}
                editable={!submitting}
            />

            <Text style={styles.label}>Condition (if different)</Text>
            <TextInput
                style={styles.input}
                value={condition}
                onChangeText={setCondition}
                placeholder={item.condition}
                placeholderTextColor={colors.text.onDarkSubtle}
                editable={!submitting}
            />

            <View style={styles.actions}>
                <GradientButton
                    label="List Item"
                    loading={submitting}
                    disabled={submitting || !priceValid}
                    onPress={() => void handleList()}
                />
                <Pressable
                    style={[styles.secondary, submitting && styles.secondaryDisabled]}
                    disabled={submitting}
                    onPress={() => {
                        onClose();
                        onFullDetails(item.id);
                    }}
                >
                    <Text style={styles.secondaryText}>Full details</Text>
                </Pressable>
            </View>
        </BottomSheet>
    );
};

const styles = StyleSheet.create({
    preview: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    thumb: {
        width: 64,
        height: 64,
        borderRadius: radii.md,
    },
    previewMeta: { flex: 1, justifyContent: 'center' },
    previewName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
    },
    previewSub: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: colors.text.onDarkSubtle,
        marginTop: 2,
    },
    label: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDarkSubtle,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
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
    actions: { marginTop: spacing.xl, gap: spacing.md },
    spinner: { marginTop: -spacing.sm },
    secondary: { alignItems: 'center', paddingVertical: spacing.md },
    secondaryDisabled: { opacity: 0.4 },
    secondaryText: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 13,
        color: colors.accent.primary,
    },
});