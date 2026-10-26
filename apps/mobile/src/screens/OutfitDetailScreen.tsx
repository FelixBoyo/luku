import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Edit2, Heart, Plus, Share2, Trash2 } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../components/shell/ScreenHeader';
import { PeekRail } from '../components/common/PeekRail';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { useAppState } from '../context/AppStateContext';
import { repositories } from '../repositories';
import type { Outfit } from '../types/domain/outfit';
import type { Product } from '../types/domain/product';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'OutfitDetail'>;

const PIECE_W = 140;
const PIECE_H = 140;

const OutfitDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    const { createOutfit, deleteOutfit } = useAppState();
    const [outfit, setOutfit] = useState<Outfit | null>(null);
    const [productMap, setProductMap] = useState<Record<string, Product>>({});
    const [loading, setLoading] = useState(true);
    const [remixing, setRemixing] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'delete' | 'unsave' | null>(null);
    const [wardrobeMap, setWardrobeMap] = useState<Record<string, { name: string; imageUrl: string }>>({});
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (!outfit) return;
        const wardrobeIds = outfit.pieces.filter((p) => p.type === 'wardrobe').map((p) => p.id);
        if (wardrobeIds.length === 0) {
            setWardrobeMap({});
            return;
        }
        repositories.wardrobe.list().then((items) => {
            const map: Record<string, { name: string; imageUrl: string }> = {};
            for (const item of items) {
                if (wardrobeIds.includes(item.id)) {
                    map[item.id] = { name: item.name, imageUrl: item.imageUrl };
                }
            }
            setWardrobeMap(map);
        });
    }, [outfit]);
    useEffect(() => {
        setLoading(true);
        repositories.outfits.getById(route.params.outfitId).then((o) => {
            setOutfit(o);
            setLoading(false);
        });
    }, [route.params.outfitId]);

    useEffect(() => {
        if (!outfit) return;
        const productIds = outfit.pieces.filter((p) => p.type === 'product').map((p) => p.id);
        if (productIds.length === 0) {
            setProductMap({});
            return;
        }
        Promise.all(
            productIds.map((id) =>
                repositories.products.getById(id).then((product) => [id, product] as const),
            ),
        ).then((entries) => {
            const map: Record<string, Product> = {};
            for (const [id, product] of entries) {
                if (product) map[id] = product;
            }
            setProductMap(map);
        });
    }, [outfit]);

    if (loading) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Outfit" onBack={() => navigation.goBack()} />
                <View style={styles.loading}>
                    <ActivityIndicator color={colors.accent.primary} />
                </View>
            </View>
        );
    }

    if (!outfit) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Outfit" onBack={() => navigation.goBack()} />
                <EmptyState title="Outfit not found" description="This outfit may have been removed" />
            </View>
        );
    }

    const wardrobePieces = outfit.pieces.filter((p) => p.type === 'wardrobe');
    const productPieces = outfit.pieces.filter((p) => p.type === 'product');
    const isManual = outfit.source === 'manual';
    const isInspiration = outfit.source === 'inspiration';

    const goEdit = () => navigation.navigate('CreateOutfit', { outfitId: outfit.id });

    const handleEditInspiration = async () => {
        if (remixing) return;
        setRemixing(true);
        try {
            const newOutfit = await createOutfit({
                name: `${outfit.name} (Remix)`,
                occasion: outfit.occasion,
                coverImageUrl: outfit.coverImageUrl,
                pieces: [...outfit.pieces],
            });
            navigation.navigate('CreateOutfit', { outfitId: newOutfit.id });
        } finally {
            setRemixing(false);
        }
    };

    const handleHeaderEdit = () => {
        if (isInspiration) {
            handleEditInspiration();
        } else {
            goEdit();
        }
    };

    const handleConfirmDestructive = async () => {
        if (!confirmAction || actionLoading) return;
        setActionLoading(true);
        try {
            await deleteOutfit(outfit.id);
            setConfirmAction(null);
            navigation.goBack();
        } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Something went wrong');
            setActionLoading(false);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out my outfit "${outfit.name}" on Luku: luku://outfit/${outfit.id}`,
                url: outfit.coverImageUrl,
            });
        } catch {
            /* user cancelled */
        }
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Outfit"
                onBack={() => navigation.goBack()}
                right={
                    isManual || isInspiration ? (
                        <Pressable
                            style={[styles.headerBtn, remixing && styles.headerBtnDisabled]}
                            onPress={handleHeaderEdit}
                            disabled={remixing}
                        >
                            <Edit2 size={18} color={colors.text.onDark} strokeWidth={2.5} />
                        </Pressable>
                    ) : undefined
                }
            />
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <Image source={{ uri: outfit.coverImageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={StyleSheet.absoluteFill} />
                    <View style={styles.heroLabel}>
                        <Text style={styles.heroName}>{outfit.name}</Text>
                        <Text style={styles.heroOccasion}>{outfit.occasion}</Text>
                    </View>
                </View>

                <View style={styles.heroActions}>
                    <Pressable style={styles.actionBtn} onPress={handleShare}>
                        <Share2 size={16} color={colors.text.onDark} strokeWidth={2.5} />
                        <Text style={styles.actionText}>Share</Text>
                    </Pressable>
                    {isInspiration ? (
                        <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={() => setConfirmAction('unsave')}>
                            <Heart size={16} color={colors.status.error} strokeWidth={2.5} />
                            <Text style={[styles.actionText, styles.deleteText]}>Unsave</Text>
                        </Pressable>
                    ) : isManual ? (
                        <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={() => setConfirmAction('delete')}>
                            <Trash2 size={16} color={colors.status.error} strokeWidth={2.5} />
                            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                        </Pressable>
                    ) : null}
                </View>

                {__DEV__ ? (
                    <Pressable
                        style={styles.devPreview}
                        onPress={() => navigation.navigate('SharedOutfit', { outfitId: outfit.id })}
                    >
                        <Text style={styles.devPreviewText}>Preview shared look</Text>
                    </Pressable>
                ) : null}

                <View style={styles.body}>
                    {outfit.pieces.length === 0 ? (
                        <EmptyState
                            title="No items in this outfit"
                            description="Add pieces from your wardrobe to complete the look"
                            actionLabel="Add Items"
                            onAction={goEdit}
                        />
                    ) : null}

                    {(wardrobePieces.length > 0 || isManual) ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>FROM YOUR WARDROBE</Text>
                            <PeekRail contentContainerStyle={styles.pieceRail}>
                                {wardrobePieces.map((p) => {
                                    const item = wardrobeMap[p.id];
                                    if (!item) return null;
                                    return (
                                        <Pressable
                                            key={p.id}
                                            onPress={() =>
                                                navigation.navigate('WardrobeItemDetail', { itemId: p.id })
                                            }
                                        >
                                            <View style={[styles.pieceCard, { width: PIECE_W, height: PIECE_H }]}>
                                                <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                                                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
                                                <Text style={styles.pieceName} numberOfLines={2}>{item.name}</Text>
                                            </View>
                                        </Pressable>
                                    );
                                })}
                                {isManual ? (
                                    <Pressable onPress={goEdit}>
                                        <View style={[styles.addTile, { width: PIECE_W, height: PIECE_H }]}>
                                            <Plus size={24} color="rgba(255,255,255,0.4)" strokeWidth={2} />
                                            <Text style={styles.addTileText}>Add item</Text>
                                        </View>
                                    </Pressable>
                                ) : null}
                            </PeekRail>
                        </View>
                    ) : null}

                    {productPieces.length > 0 ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>SHOP TO COMPLETE</Text>
                            <PeekRail contentContainerStyle={styles.pieceRail}>
                                {productPieces.map((p) => {
                                    const product = productMap[p.id];
                                    if (!product) return null;
                                    return (
                                        <Pressable
                                            key={p.id}
                                            onPress={() =>
                                                navigation.navigate('ProductDetail', { productId: p.id })
                                            }
                                        >
                                            <View style={[styles.pieceCard, { width: PIECE_W, height: PIECE_H }]}>
                                                <Image source={{ uri: product.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                                                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
                                                <Text style={styles.pieceName} numberOfLines={2}>{product.name}</Text>
                                            </View>
                                        </Pressable>
                                    );
                                })}
                            </PeekRail>
                        </View>
                    ) : null}
                </View>
            </ScrollView>

            <ConfirmDialog
                visible={confirmAction === 'delete'}
                title="Delete outfit?"
                description={`Remove "${outfit.name}" from your created outfits?`}
                confirmLabel="Delete"
                destructive
                loading={actionLoading}
                onCancel={() => setConfirmAction(null)}
                onConfirm={handleConfirmDestructive}
            />
            <ConfirmDialog
                visible={confirmAction === 'unsave'}
                title="Remove inspiration?"
                description={`Unsave "${outfit.name}" from your inspirations?`}
                confirmLabel="Unsave"
                destructive
                loading={actionLoading}
                onCancel={() => setConfirmAction(null)}
                onConfirm={handleConfirmDestructive}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerBtn: {
        width: 36,
        height: 36,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerBtnDisabled: { opacity: 0.5 },
    hero: { height: 380, position: 'relative' },
    heroLabel: { position: 'absolute', bottom: spacing.xl, left: spacing.page, right: spacing.page },
    heroName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 28,
        color: colors.text.onDark,
    },
    heroOccasion: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDarkMuted,
        marginTop: 4,
    },
    heroActions: {
        flexDirection: 'row',
        gap: spacing.sm,
        paddingHorizontal: spacing.page,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.dark,
    },
    devPreview: {
        marginHorizontal: spacing.page,
        marginTop: spacing.md,
        paddingVertical: spacing.sm,
        alignItems: 'center',
    },
    devPreviewText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: colors.text.onDarkSubtle,
    },
    body: { padding: spacing.page, paddingBottom: spacing.xxl },
    section: { marginBottom: spacing.xl },
    sectionLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDarkSubtle,
        letterSpacing: 1.5,
        marginBottom: spacing.md,
    },
    pieceRail: { paddingHorizontal: 0 },
    pieceCard: {
        borderRadius: radii.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    addTile: {
        borderRadius: radii.lg,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    addTileText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
    },
    pieceName: {
        position: 'absolute',
        bottom: spacing.sm,
        left: spacing.sm,
        right: spacing.sm,
        fontFamily: typography.fontFamily.bold,
        fontSize: 12,
        color: colors.text.onDark,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    actionText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDark,
        textTransform: 'uppercase',
    },
    deleteBtn: { borderColor: 'rgba(255,0,68,0.3)' },
    deleteText: { color: colors.status.error },
});

export default OutfitDetailScreen;
