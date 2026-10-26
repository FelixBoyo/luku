import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Camera,
    Check,
    Shirt,
    Sparkles,
    Upload,
    User as UserIcon,
} from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ScreenHeader } from '../components/shell/ScreenHeader';
import { EmptyState } from '../components/common/EmptyState';
import { repositories } from '../repositories';
import { getWardrobeItemSync } from '../repositories/wardrobeRepository';
import type { Outfit } from '../types/domain/outfit';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'VirtualTryOn'>;
type Mode = 'mannequin' | 'upload';

const bodyTypes = ['Petite', 'Slim', 'Athletic', 'Curvy', 'Plus Size'];
const skinTones = [
    { label: 'Fair', color: '#F5DEB3' },
    { label: 'Light', color: '#DEB887' },
    { label: 'Medium', color: '#C68642' },
    { label: 'Tan', color: '#A0522D' },
    { label: 'Deep', color: '#6B3A2A' },
];

const getOutfitPreviewImages = (outfit: Outfit) => {
    const images: { name: string; image: string }[] = [];
    for (const piece of outfit.pieces) {
        if (piece.type === 'wardrobe') {
            const item = getWardrobeItemSync(piece.id);
            if (item) images.push({ name: item.name, image: item.imageUrl });
        }
    }
    if (images.length === 0 && outfit.coverImageUrl) {
        images.push({ name: outfit.name, image: outfit.coverImageUrl });
    }
    return images;
};

const VirtualTryOnScreen: React.FC<Props> = ({ navigation }) => {
    const [mode, setMode] = useState<Mode>('mannequin');
    const [outfits, setOutfits] = useState<Outfit[]>([]);
    const [loadingOutfits, setLoadingOutfits] = useState(true);
    const [selectedOutfit, setSelectedOutfit] = useState<string | null>(null);
    const [bodyType, setBodyType] = useState('Athletic');
    const [skinTone, setSkinTone] = useState('Medium');

    useEffect(() => {
        setLoadingOutfits(true);
        repositories.outfits.list('created').then((list) => {
            setOutfits(list);
            setSelectedOutfit(list[0]?.id ?? null);
            setLoadingOutfits(false);
        });
    }, []);

    const activeOutfit = useMemo(
        () => outfits.find((o) => o.id === selectedOutfit) ?? outfits[0] ?? null,
        [outfits, selectedOutfit],
    );
    const previewImages = activeOutfit ? getOutfitPreviewImages(activeOutfit) : [];
    const toneColor = skinTones.find((s) => s.label === skinTone)?.color ?? '#C68642';

    return (
        <View style={styles.container}>
            <ScreenHeader title="Virtual Try-On" onBack={() => navigation.goBack()} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <View style={styles.modeToggle}>
                    {(['mannequin', 'upload'] as Mode[]).map((m) => {
                        const active = mode === m;
                        const Icon = m === 'mannequin' ? UserIcon : Upload;
                        return (
                            <Pressable
                                key={m}
                                onPress={() => setMode(m)}
                                style={[styles.modeBtn, active && styles.modeBtnActive]}
                            >
                                <Icon
                                    color={active ? colors.text.primary : 'rgba(255,255,255,0.5)'}
                                    size={14}
                                    strokeWidth={2.5}
                                />
                                <Text style={[styles.modeText, active && styles.modeTextActive]}>
                                    {m === 'mannequin' ? 'Mannequin' : 'My Photo'}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                <View style={styles.previewCard}>
                    {mode === 'mannequin' ? (
                        activeOutfit ? (
                        <>
                            <View style={styles.preview}>
                                <LinearGradient
                                    colors={['rgba(138,72,205,0.1)', 'transparent', 'rgba(0,0,0,0.4)']}
                                    style={StyleSheet.absoluteFill}
                                />
                                <View style={styles.aiBadge}>
                                    <Sparkles color={colors.accent.primary} size={12} strokeWidth={2.5} />
                                    <Text style={styles.aiBadgeText}>AI Preview</Text>
                                </View>
                                <View style={styles.silhouette}>
                                    <View style={[styles.head, { backgroundColor: toneColor }]}>
                                        <UserIcon color="rgba(255,255,255,0.4)" size={28} strokeWidth={1.5} />
                                    </View>
                                    <View style={styles.itemStack}>
                                        {previewImages.map((it) => (
                                            <View key={it.name} style={styles.stackItem}>
                                                <Image source={{ uri: it.image }} style={StyleSheet.absoluteFill} contentFit="cover" />
                                            </View>
                                        ))}
                                    </View>
                                </View>
                                <View style={styles.outfitNameBox}>
                                    <Text style={styles.outfitName}>{activeOutfit.name}</Text>
                                    <Text style={styles.outfitMeta}>
                                        {activeOutfit.occasion} · {activeOutfit.pieces.length} pieces
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.customize}>
                                <Text style={styles.customizeLabel}>Customise</Text>
                                <Text style={styles.fieldLabel}>Body Type</Text>
                                <View style={styles.chipRow}>
                                    {bodyTypes.map((bt) => {
                                        const active = bodyType === bt;
                                        return (
                                            <Pressable
                                                key={bt}
                                                onPress={() => setBodyType(bt)}
                                                style={[styles.bodyChip, active && styles.bodyChipActive]}
                                            >
                                                <Text style={[styles.bodyChipText, active && styles.bodyChipTextActive]}>
                                                    {bt}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                                <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Skin Tone</Text>
                                <View style={styles.toneRow}>
                                    {skinTones.map((st) => {
                                        const active = skinTone === st.label;
                                        return (
                                            <Pressable
                                                key={st.label}
                                                onPress={() => setSkinTone(st.label)}
                                                style={[
                                                    styles.toneDot,
                                                    { backgroundColor: st.color, borderColor: active ? '#fff' : 'transparent' },
                                                ]}
                                            >
                                                {active ? (
                                                    <Check color="#fff" size={14} strokeWidth={3} />
                                                ) : null}
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>
                        </>
                        ) : (
                            <EmptyState
                                icon={Shirt}
                                title="No outfits to try on"
                                description="Create an outfit first to preview it here"
                            />
                        )
                    ) : (
                        <View style={styles.uploadArea}>
                            <View style={styles.uploadIcon}>
                                <Camera color="rgba(255,255,255,0.4)" size={32} strokeWidth={1.5} />
                            </View>
                            <Text style={styles.uploadTitle}>Upload Your Photo</Text>
                            <Text style={styles.uploadSub}>See how outfits look on you</Text>
                            <View style={[styles.choosePhoto, styles.choosePhotoDisabled]}>
                                <Text style={styles.choosePhotoText}>Choose Photo</Text>
                            </View>
                            <Text style={styles.uploadHint}>
                                Photo upload coming soon — photos will be processed locally
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.selector}>
                    <Text style={styles.selectorLabel}>Select Outfit</Text>
                    {loadingOutfits ? (
                        <ActivityIndicator color={colors.accent.primary} style={styles.loader} />
                    ) : outfits.length === 0 ? (
                        <EmptyState
                            icon={Shirt}
                            title="No saved outfits"
                            description="Your created outfits will appear here"
                        />
                    ) : (
                    outfits.map((outfit) => {
                        const active = selectedOutfit === outfit.id;
                        const thumbs = getOutfitPreviewImages(outfit);
                        return (
                            <Pressable
                                key={outfit.id}
                                onPress={() => setSelectedOutfit(outfit.id)}
                                style={[styles.outfitRow, active && styles.outfitRowActive]}
                            >
                                <View style={styles.thumbStack}>
                                    {thumbs.slice(0, 3).map((it, i) => (
                                        <Image
                                            key={it.name + i}
                                            source={{ uri: it.image }}
                                            style={[styles.stackThumb, { marginLeft: i === 0 ? 0 : -8 }]}
                                            contentFit="cover"
                                        />
                                    ))}
                                    {outfit.pieces.length > 3 ? (
                                        <View style={[styles.stackThumb, styles.stackMore, { marginLeft: -8 }]}>
                                            <Text style={styles.stackMoreText}>+{outfit.pieces.length - 3}</Text>
                                        </View>
                                    ) : null}
                                </View>
                                <View style={styles.flex}>
                                    <Text style={styles.outfitRowName}>{outfit.name}</Text>
                                    <Text style={styles.outfitRowMeta}>
                                        {outfit.occasion} · {outfit.pieces.length} pieces
                                    </Text>
                                </View>
                                {active ? (
                                    <View style={styles.checkCircle}>
                                        <Check color={colors.text.primary} size={12} strokeWidth={3} />
                                    </View>
                                ) : null}
                            </Pressable>
                        );
                    })
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    scroll: { padding: spacing.page, paddingBottom: spacing.xxl, gap: spacing.lg },
    loader: { paddingVertical: spacing.xl },
    flex: { flex: 1 },
    modeToggle: {
        flexDirection: 'row',
        gap: spacing.sm,
        padding: 4,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    modeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        borderRadius: radii.md,
    },
    modeBtnActive: { backgroundColor: colors.text.onDark },
    modeText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    modeTextActive: { color: colors.text.primary },
    previewCard: {
        borderRadius: radii.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    preview: { aspectRatio: 3 / 4, alignItems: 'center', justifyContent: 'center' },
    aiBadge: {
        position: 'absolute',
        top: spacing.lg,
        left: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.md,
        paddingVertical: 4,
        borderRadius: radii.pill,
        backgroundColor: 'rgba(72,205,138,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(72,205,138,0.3)',
    },
    aiBadgeText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.accent.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    silhouette: { alignItems: 'center' },
    head: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    itemStack: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.sm,
        maxWidth: 240,
    },
    stackItem: {
        width: 64,
        height: 64,
        borderRadius: radii.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    outfitNameBox: {
        position: 'absolute',
        bottom: spacing.lg,
        left: spacing.lg,
        right: spacing.lg,
        padding: spacing.md,
        borderRadius: radii.lg,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    outfitName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
    },
    outfitMeta: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
    },
    customize: {
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border.dark,
    },
    customizeLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.md,
    },
    fieldLabel: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        marginBottom: spacing.sm,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    bodyChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    bodyChipActive: { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary },
    bodyChipText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
    },
    bodyChipTextActive: { color: colors.text.primary },
    toneRow: { flexDirection: 'row', gap: spacing.md },
    toneDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadArea: { aspectRatio: 3 / 4, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
    uploadIcon: {
        width: 64,
        height: 64,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 16,
        color: colors.text.onDark,
    },
    uploadSub: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
    },
    choosePhoto: {
        backgroundColor: colors.accent.primary,
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
    },
    choosePhotoDisabled: { opacity: 0.45 },
    choosePhotoText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    uploadHint: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: 'rgba(255,255,255,0.25)',
        textAlign: 'center',
        maxWidth: 200,
    },
    selector: {},
    selectorLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.md,
    },
    outfitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.03)',
        marginBottom: spacing.sm,
    },
    outfitRowActive: {
        borderColor: 'rgba(72,205,138,0.4)',
        backgroundColor: 'rgba(72,205,138,0.06)',
    },
    thumbStack: { flexDirection: 'row' },
    stackThumb: {
        width: 36,
        height: 36,
        borderRadius: radii.md,
        borderWidth: 2,
        borderColor: colors.background.shell,
    },
    stackMore: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stackMoreText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDark,
    },
    outfitRowName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
    },
    outfitRowMeta: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
    },
    checkCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.accent.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    completeCard: {
        padding: spacing.lg,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    completeHead: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    completeLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    shopAll: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: '#F2B872',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    completeRow: { flexDirection: 'row', gap: spacing.md },
    completeItem: {
        flex: 1,
        borderRadius: radii.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    completeImgWrap: { aspectRatio: 1 },
    bagBtn: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        width: 28,
        height: 28,
        borderRadius: radii.md,
        backgroundColor: '#F2B872',
        alignItems: 'center',
        justifyContent: 'center',
    },
    completeName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDark,
        paddingHorizontal: spacing.sm,
        paddingTop: spacing.sm,
    },
    completePrice: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: '#F2B872',
        paddingHorizontal: spacing.sm,
        paddingBottom: spacing.sm,
    },
});

export default VirtualTryOnScreen;
