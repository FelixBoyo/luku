import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Sparkles } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../components/shell/ScreenHeader';
import { EmptyState } from '../components/common/EmptyState';
import { useAppState } from '../context/AppStateContext';
import { repositories } from '../repositories';
import type { Outfit } from '../types/domain/outfit';
import type { Product } from '../types/domain/product';
import { getWardrobeItemSync } from '../repositories/wardrobeRepository';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'SharedOutfit'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PIECE_W = (SCREEN_WIDTH - spacing.page * 2 - spacing.md) / 2;
const PIECE_H = PIECE_W;

const SharedOutfitScreen: React.FC<Props> = ({ route, navigation }) => {
    const { saveInspiration, createOutfit } = useAppState();
    const [outfit, setOutfit] = useState<Outfit | null>(null);
    const [productMap, setProductMap] = useState<Record<string, Product>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [remixing, setRemixing] = useState(false);

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
                <ScreenHeader title="Shared Look" onBack={() => navigation.goBack()} />
                <View style={styles.loading}>
                    <ActivityIndicator color={colors.accent.primary} />
                </View>
            </View>
        );
    }

    if (!outfit) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Shared Look" onBack={() => navigation.goBack()} />
                <EmptyState title="Outfit not found" description="This shared look is no longer available" />
            </View>
        );
    }

    const wardrobePieces = outfit.pieces.filter((p) => p.type === 'wardrobe');
    const productPieces = outfit.pieces.filter((p) => p.type === 'product');

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        try {
            await saveInspiration({
                name: outfit.name,
                occasion: outfit.occasion,
                coverImageUrl: outfit.coverImageUrl,
                pieces: [...outfit.pieces],
            });
            navigation.goBack();
        } finally {
            setSaving(false);
        }
    };

    const handleRemix = async () => {
        if (remixing) return;
        setRemixing(true);
        try {
            const newOutfit = await createOutfit({
                name: `${outfit.name} (Remix)`,
                occasion: outfit.occasion,
                coverImageUrl: outfit.coverImageUrl,
                pieces: [...outfit.pieces],
            });
            navigation.replace('OutfitDetail', { outfitId: newOutfit.id });
        } finally {
            setRemixing(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScreenHeader title="Shared Look" onBack={() => navigation.goBack()} />
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
                    <Pressable
                        style={[styles.actionBtn, saving && styles.actionBtnDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        <Heart size={16} color={colors.accent.warm} strokeWidth={2.5} />
                        <Text style={styles.actionText}>Save</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.actionBtn, remixing && styles.actionBtnDisabled]}
                        onPress={handleRemix}
                        disabled={remixing}
                    >
                        <Sparkles size={16} color={colors.text.onDark} strokeWidth={2.5} />
                        <Text style={styles.actionText}>Remix</Text>
                    </Pressable>
                </View>

                <View style={styles.body}>
                    {wardrobePieces.length > 0 ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>PIECES</Text>
                            <View style={styles.grid}>
                                {wardrobePieces.map((p) => {
                                    const item = getWardrobeItemSync(p.id);
                                    return (
                                        <View key={p.id} style={[styles.pieceCard, { width: PIECE_W, height: PIECE_H }]}>
                                            <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                                            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
                                            <Text style={styles.pieceName}>{item.name}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    ) : null}

                    {productPieces.length > 0 ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>SHOP TO COMPLETE</Text>
                            <View style={styles.grid}>
                                {productPieces.map((p) => {
                                    const product = productMap[p.id];
                                    if (!product) return null;
                                    return (
                                        <Pressable
                                            key={p.id}
                                            onPress={() => navigation.navigate('ProductDetail', { productId: p.id })}
                                        >
                                            <View style={[styles.pieceCard, { width: PIECE_W, height: PIECE_H }]}>
                                                <Image source={{ uri: product.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                                                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
                                                <Text style={styles.pieceName}>{product.name}</Text>
                                            </View>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                    ) : null}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
    body: { padding: spacing.page, paddingBottom: spacing.xxl },
    section: { marginBottom: spacing.xl },
    sectionLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDarkSubtle,
        letterSpacing: 1.5,
        marginBottom: spacing.md,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    pieceCard: {
        borderRadius: radii.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border.dark,
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
    actionBtnDisabled: { opacity: 0.5 },
    actionText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDark,
        textTransform: 'uppercase',
    },
});

export default SharedOutfitScreen;
