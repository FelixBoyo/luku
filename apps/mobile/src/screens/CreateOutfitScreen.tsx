import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Shirt } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../components/shell/ScreenHeader';
import { GradientButton } from '../components/auth/GradientButton';
import { EmptyState } from '../components/common/EmptyState';
import { Input } from '../components/common/Input';
import { useAppState } from '../context/AppStateContext';
import { useActiveProducts } from '../hooks/useProducts';
import type { OutfitPiece } from '../types/domain/outfit';
import { repositories } from '../repositories';
import { getOutfitCoverFromPieces } from '../repositories/outfitsRepository';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateOutfit'>;

const OCCASIONS = ['Casual', 'Work', 'Brunch', 'Evening', 'Weekend', 'Travel'];
const FOOTER_HEIGHT = 100;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_W = (SCREEN_WIDTH - spacing.page * 2 - spacing.md * 2) / 3;
const ITEM_H = ITEM_W;

const matchesQuery = (query: string, ...fields: string[]) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return fields.some((f) => f.toLowerCase().includes(q));
};

const CreateOutfitScreen: React.FC<Props> = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const { wardrobeItems, createOutfit, updateOutfit, refreshWardrobe } = useAppState();
    const editId = route.params?.outfitId;
    const [name, setName] = useState('');
    const [occasion, setOccasion] = useState('Casual');
    const [selectedWardrobe, setSelectedWardrobe] = useState<Set<string>>(new Set());
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [wardrobeQuery, setWardrobeQuery] = useState('');
    const [productQuery, setProductQuery] = useState('');
    const [wardrobeLoading, setWardrobeLoading] = useState(true);
    const { products: catalogProducts, loading: productsLoading } = useActiveProducts();
    const [saving, setSaving] = useState(false);

    useFocusEffect(
        useCallback(() => {
            setWardrobeLoading(true);
            refreshWardrobe().finally(() => setWardrobeLoading(false));
        }, [refreshWardrobe]),
    );

    useEffect(() => {
        if (editId) {
            repositories.outfits.getById(editId).then((o) => {
                if (!o) return;
                setName(o.name);
                setOccasion(o.occasion);
                setSelectedWardrobe(new Set(o.pieces.filter((p) => p.type === 'wardrobe').map((p) => p.id)));
                setSelectedProducts(new Set(o.pieces.filter((p) => p.type === 'product').map((p) => p.id)));
            });
        }
    }, [editId]);

    const filteredWardrobe = useMemo(
        () =>
            wardrobeItems.filter((item) =>
                matchesQuery(wardrobeQuery, item.name, item.brand, item.category),
            ),
        [wardrobeItems, wardrobeQuery],
    );

    const filteredProducts = useMemo(
        () =>
            catalogProducts.filter((p) =>
                matchesQuery(productQuery, p.name, p.brand),
            ),
        [catalogProducts, productQuery],
    );

    const toggleWardrobe = (id: string) => {
        setSelectedWardrobe((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleProduct = (id: string) => {
        setSelectedProducts((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };
    const handleSave = async () => {
        if (saving) return;
        if (!name.trim() || selectedWardrobe.size + selectedProducts.size === 0) return;
        setSaving(true);
        try {
            const pieces: OutfitPiece[] = [
                ...[...selectedWardrobe].map((id) => ({ type: 'wardrobe' as const, id })),
                ...[...selectedProducts].map((id) => ({ type: 'product' as const, id })),
            ];
            const coverImageUrl = getOutfitCoverFromPieces(pieces, wardrobeItems);
            const payload = {
                name: name.trim(),
                occasion,
                coverImageUrl,
                pieces,
            };

            if (editId) {
                const outfit = await updateOutfit(editId, payload);
                navigation.replace('OutfitDetail', { outfitId: outfit.id });
            } else {
                const outfit = await createOutfit(payload);
                navigation.replace('OutfitDetail', { outfitId: outfit.id });
            }
        } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save outfit');
            setSaving(false);
        }
    };
    const totalSelected = selectedWardrobe.size + selectedProducts.size;
    const canSave = name.trim().length > 0 && totalSelected > 0;

    const renderPickerTile = (
        id: string,
        imageUrl: string,
        label: string,
        active: boolean,
        onPress: () => void,
    ) => (
        <Pressable key={id} onPress={onPress}>
            <View
                style={[
                    styles.itemCardInner,
                    { width: ITEM_W, height: ITEM_H },
                    active && styles.itemCardActive,
                ]}
            >
                <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                {active ? (
                    <View style={styles.check}>
                        <Text style={styles.checkText}>✓</Text>
                    </View>
                ) : null}
                <Text style={styles.itemName} numberOfLines={1}>{label}</Text>
            </View>
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <ScreenHeader
                title={editId ? 'Edit Outfit' : 'New Outfit'}
                onBack={() => navigation.goBack()}
            />
            <ScrollView
                contentContainerStyle={[
                    styles.scroll,
                    { paddingBottom: FOOTER_HEIGHT + insets.bottom + spacing.lg },
                ]}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.label}>Name</Text>
                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g., Minimalist Chic"
                    placeholderTextColor={colors.text.onDarkSubtle}
                />
                <Text style={styles.label}>Occasion</Text>
                <View style={styles.chips}>
                    {OCCASIONS.map((o) => (
                        <Pressable
                            key={o}
                            style={[styles.chip, occasion === o && styles.chipActive]}
                            onPress={() => setOccasion(o)}
                        >
                            <Text style={[styles.chipText, occasion === o && styles.chipTextActive]}>
                                {o}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                <Text style={styles.label}>Pick from wardrobe</Text>
                <Input
                    dark
                    placeholder="Search wardrobe..."
                    value={wardrobeQuery}
                    onChangeText={setWardrobeQuery}
                />
                {wardrobeLoading ? (
                    <ActivityIndicator color={colors.accent.primary} style={styles.loader} />
                ) : wardrobeItems.length === 0 ? (
                    <EmptyState
                        icon={Shirt}
                        title="Wardrobe is empty"
                        description="Add items to your wardrobe before creating an outfit"
                    />
                ) : filteredWardrobe.length === 0 ? (
                    <EmptyState
                        title="No matches"
                        description="Try a different search term"
                    />
                ) : (
                    <View style={styles.grid}>
                        {filteredWardrobe.map((item) =>
                            renderPickerTile(
                                item.id,
                                item.imageUrl,
                                item.name,
                                selectedWardrobe.has(item.id),
                                () => toggleWardrobe(item.id),
                            ),
                        )}
                    </View>
                )}

                <Text style={styles.label}>Shop to complete (optional)</Text>
                <Input
                    dark
                    placeholder="Search products..."
                    value={productQuery}
                    onChangeText={setProductQuery}
                />
                {productsLoading ? (
                    <ActivityIndicator color={colors.accent.primary} style={styles.loader} />
                ) : filteredProducts.length === 0 ? (
                    <EmptyState
                        title="No products found"
                        description="Try a different search term"
                    />
                ) : (
                    <View style={styles.grid}>
                        {filteredProducts.map((product) =>
                            renderPickerTile(
                                product.id,
                                product.imageUrl,
                                product.name,
                                selectedProducts.has(product.id),
                                () => toggleProduct(product.id),
                            ),
                        )}
                    </View>
                )}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
                {totalSelected > 0 ? (
                    <Text style={styles.selectedCount}>
                        {totalSelected} piece{totalSelected === 1 ? '' : 's'} selected
                    </Text>
                ) : null}
                <GradientButton
                    label={saving ? 'Saving…' : editId ? 'Update Outfit' : 'Save Outfit'}
                    disabled={!canSave || saving}
                    onPress={() => void handleSave()}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    scroll: { padding: spacing.page },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing.page,
        paddingTop: spacing.md,
        backgroundColor: 'rgba(0,0,0,0.95)',
        borderTopWidth: 1,
        borderTopColor: colors.border.dark,
        gap: spacing.sm,
    },
    label: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDarkSubtle,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: spacing.sm,
        marginTop: spacing.lg,
    },
    input: {
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: spacing.lg,
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDark,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
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
        fontSize: 12,
        color: colors.text.onDarkMuted,
    },
    chipTextActive: { color: colors.accent.primary },
    loader: { marginVertical: spacing.lg },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md, marginBottom: spacing.md },
    itemCardInner: {
        borderRadius: radii.md,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    itemCardActive: { borderColor: colors.accent.primary },
    check: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: colors.accent.primary,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    checkText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.text.primary,
    },
    itemName: {
        position: 'absolute',
        bottom: 2,
        left: 4,
        right: 4,
        fontFamily: typography.fontFamily.bold,
        fontSize: 8,
        color: colors.text.onDark,
    },
    selectedCount: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        textAlign: 'center',
    },
});

export default CreateOutfitScreen;
