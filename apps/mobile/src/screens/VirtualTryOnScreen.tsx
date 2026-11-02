import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Check, Upload, User as UserIcon } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ScreenHeader } from '../components/shell/ScreenHeader';
import { repositories } from '../repositories';
import { apiGet, apiPost } from '../api/apiClient';
import { MANNEQUINS, mannequinToBase64 } from '../lib/mannequins';
import type { MannequinGender } from '../lib/mannequins';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'VirtualTryOn'>;
type Mode = 'mannequin' | 'upload';
type Phase = 'idle' | 'working' | 'done' | 'error';

type TryOnItem = {
    id: string;
    source: 'wardrobe' | 'marketplace';
    name: string;
    imageUrl: string;
    category?: string;
    price?: number;
    sellerName?: string;
    sellerWhatsapp?: string;
};

const sleep = (ms: number): Promise<void> => new Promise<void>((resolve) => setTimeout(resolve, ms));

const VirtualTryOnScreen: React.FC<Props> = ({ navigation, route }) => {
    const [mode, setMode] = useState<Mode>('upload');
    const [gender, setGender] = useState<MannequinGender>('female');
    const [mannequinId, setMannequinId] = useState('female_average');

    const [catalogue, setCatalogue] = useState<TryOnItem[]>([]);
    const [pickedItem, setPickedItem] = useState<TryOnItem | null>(null);
    const [phase, setPhase] = useState<Phase>('idle');
    const [resultUri, setResultUri] = useState<string | null>(null);
    const [statusMsg, setStatusMsg] = useState('');

    // Incremented on every new run and every reset, so a stale poll loop stops
    // instead of writing its result over a different mode or selection.
    const runIdRef = useRef(0);

    // Garment selection: same three branches as before, but it no longer waits
    // for 'upload' mode, because Mannequin mode needs the garment too.
    useEffect(() => {
        const loadItems = async () => {
            try {
                const params = route.params;

                if (!params || params.source === 'standalone') {
                    setCatalogue([]);
                    setPickedItem(null);
                    return;
                }

                if (params.source === 'wardrobe') {
                    const item = await repositories.wardrobe.getById(params.itemId);

                    const mapped = [{
                        id: item.id,
                        source: 'wardrobe' as const,
                        name: item.name,
                        imageUrl: item.imageUrl,
                        category: item.category,
                    }];

                    setCatalogue(mapped);
                    setPickedItem(mapped[0]);
                }

                if (params.source === 'ootd') {
                    const wardrobeItems = await repositories.wardrobe.list();

                    const selected = wardrobeItems.filter((item) =>
                        params.outfit.wardrobeItemIds.includes(item.id),
                    );

                    const mapped = selected.map((item) => ({
                        id: item.id,
                        source: 'wardrobe' as const,
                        name: item.name,
                        imageUrl: item.imageUrl,
                        category: item.category,
                    }));

                    setCatalogue(mapped);
                    setPickedItem(mapped[0] ?? null);
                }

                if (params.source === 'marketplace') {
                    const product = await repositories.products.getById(params.listingId);

                    if (!product) {
                        setCatalogue([]);
                        setPickedItem(null);
                        return;
                    }

                    const item: TryOnItem = {
                        id: product.id,
                        source: 'marketplace',
                        name: product.name,
                        imageUrl: product.imageUrl,
                        category: product.category,
                        price: product.price,
                        sellerName: product.seller?.name,
                    };

                    setCatalogue([item]);
                    setPickedItem(item);
                }
            } catch (error) {
                console.error('Failed to load try-on items:', error);
                setStatusMsg('Could not load items');
            }
        };

        loadItems();
    }, [route.params]);

    const selectedMannequin = MANNEQUINS.find((m) => m.id === mannequinId) ?? MANNEQUINS[0];
    const genderMannequins = MANNEQUINS.filter((m) => m.gender === gender);

    const resetRun = () => {
        runIdRef.current += 1;
        setPhase('idle');
        setResultUri(null);
        setStatusMsg('');
    };

    const switchMode = (next: Mode) => {
        if (next === mode) return;
        resetRun();
        setMode(next);
    };

    const selectGender = (g: MannequinGender) => {
        if (g === gender || phase === 'working') return;
        resetRun();
        setGender(g);
        setMannequinId(`${g}_average`);
    };

    const selectMannequin = (id: string) => {
        if (phase === 'working') return;
        resetRun();
        setMannequinId(id);
    };

    const selectGarment = (item: TryOnItem) => {
        if (phase === 'working') return;
        setPickedItem(item);
        resetRun();
    };

    // Shared by My Photo and Mannequin: both send a base64 person image.
    const runTryOn = async (photoBase64: string, runId: number) => {
        if (!pickedItem) return;
        try {
            setPhase('working');
            setResultUri(null);
            setStatusMsg('Dressing you up... about 15 seconds');
            console.log('[TRY-ON] Debug:', {
                itemId: pickedItem.id,
                source: pickedItem.source,
                hasPhotoBase64: !!photoBase64,
                photoBase64Length: photoBase64.length,
            });
            const start = await apiPost<{ taskId: string }>(
                '/v1/api/ai/try-on',
                {
                    itemId: pickedItem.id,
                    source: pickedItem.source,
                    photoBase64,
                },
                true,
                60000,
            );
            if (runIdRef.current !== runId) return;
            const taskId = start.data?.taskId;
            if (!taskId) throw new Error('No task id returned');
            for (let i = 0; i < 30; i++) {
                await sleep(3000);
                if (runIdRef.current !== runId) return;
                const poll = await apiGet<{
                    status: string;
                    imageDataUri?: string;
                    error?: string;
                }>(`/v1/api/ai/try-on/${taskId}`);
                if (runIdRef.current !== runId) return;
                const d = poll.data;
                if (d?.status === 'success' && d.imageDataUri) {
                    setResultUri(d.imageDataUri);
                    setPhase('done');
                    return;
                }
                if (d?.status === 'error') throw new Error(d.error || 'Try-on failed');
            }
            throw new Error('Took too long, please try again');
        } catch (e: any) {
            if (runIdRef.current !== runId) return;
            setStatusMsg(e?.message || 'Something went wrong');
            setPhase('error');
        }
    };

    // My Photo: same steps as before (permission, picker, base64, run).
    const choosePhotoAndTryOn = async () => {
        if (!pickedItem || phase === 'working') return;
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
            setStatusMsg('Photo access is needed.');
            setPhase('error');
            return;
        }
        const picked = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.5,
            base64: true,
        });
        if (picked.canceled) return;
        const photoBase64 = picked.assets[0].base64;
        if (!photoBase64) {
            setStatusMsg('Could not read that photo, try another one.');
            setPhase('error');
            return;
        }
        const runId = ++runIdRef.current;
        await runTryOn(photoBase64, runId);
    };

    // Mannequin: convert the bundled image to base64, then reuse runTryOn.
    const tryOnMannequin = async () => {
        if (!pickedItem || phase === 'working') return;
        const runId = ++runIdRef.current;
        try {
            setPhase('working');
            setResultUri(null);
            setStatusMsg('Preparing mannequin...');
            const photoBase64 = await mannequinToBase64(selectedMannequin);
            if (runIdRef.current !== runId) return;
            await runTryOn(photoBase64, runId);
        } catch (e: any) {
            if (runIdRef.current !== runId) return;
            setStatusMsg(e?.message || 'Could not prepare the mannequin image');
            setPhase('error');
        }
    };

    const messageSeller = () => {
        if (!pickedItem?.sellerWhatsapp) return;
        const text = encodeURIComponent(
            `Hi, I'm interested in the ${pickedItem.name} I saw on LUKU.`,
        );
        Linking.openURL(`https://wa.me/${pickedItem.sellerWhatsapp}?text=${text}`);
    };

    const whatsappButton =
        phase === 'done' && pickedItem?.sellerWhatsapp ? (
            <Pressable
                onPress={messageSeller}
                style={[styles.whatsappBtn, { marginHorizontal: spacing.lg, marginBottom: spacing.lg }]}
            >
                <Text style={styles.choosePhotoText}>
                    Message {pickedItem.sellerName ?? 'seller'} on WhatsApp
                </Text>
            </Pressable>
        ) : null;

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
                                onPress={() => switchMode(m)}
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
                        <View>
                            <View style={styles.stage}>
                                {phase === 'done' && resultUri ? (
                                    <Image source={{ uri: resultUri }} style={styles.stageImg} contentFit="contain" />
                                ) : (
                                    <Image source={selectedMannequin.source} style={styles.stageImg} contentFit="contain" />
                                )}
                                {phase === 'working' ? (
                                    <View style={styles.stageOverlay}>
                                        <ActivityIndicator color={colors.accent.primary} />
                                        <Text style={styles.uploadSub}>{statusMsg}</Text>
                                    </View>
                                ) : null}
                            </View>
                            {phase === 'error' ? (
                                <Text style={[styles.errorText, { padding: spacing.lg }]}>{statusMsg}</Text>
                            ) : null}
                            {phase !== 'working' ? (
                                <Pressable
                                    onPress={tryOnMannequin}
                                    disabled={!pickedItem}
                                    style={[
                                        styles.choosePhoto,
                                        { margin: spacing.lg },
                                        !pickedItem && styles.choosePhotoDisabled,
                                    ]}
                                >
                                    <Text style={[styles.choosePhotoText, { textAlign: 'center' }]}>
                                        {phase === 'done' ? 'Try again' : 'Try on this mannequin'}
                                    </Text>
                                </Pressable>
                            ) : null}
                            {whatsappButton}
                            <Text style={[styles.uploadHint, { alignSelf: 'center', paddingBottom: spacing.lg }]}>
                                Preset model. Fit on your own body may differ.
                            </Text>
                        </View>
                    ) : (
                        <View>
                            {phase === 'done' && resultUri ? (
                                <Image source={{ uri: resultUri }} style={styles.resultImg} contentFit="contain" />
                            ) : (
                                <View style={styles.uploadArea}>
                                    {phase === 'working' ? (
                                        <>
                                            <ActivityIndicator color={colors.accent.primary} />
                                            <Text style={styles.uploadSub}>{statusMsg}</Text>
                                        </>
                                    ) : (
                                        <>
                                            <View style={styles.uploadIcon}>
                                                <Camera color="rgba(255,255,255,0.4)" size={32} strokeWidth={1.5} />
                                            </View>
                                            <Text style={styles.uploadTitle}>Upload Your Photo</Text>
                                            <Text style={styles.uploadSub}>
                                                Stand facing the camera, alone, with your face visible
                                            </Text>
                                            {phase === 'error' ? (
                                                <Text style={styles.errorText}>{statusMsg}</Text>
                                            ) : null}
                                        </>
                                    )}
                                </View>
                            )}
                            {phase !== 'working' ? (
                                <Pressable
                                    onPress={choosePhotoAndTryOn}
                                    disabled={!pickedItem}
                                    style={[
                                        styles.choosePhoto,
                                        { margin: spacing.lg },
                                        !pickedItem && styles.choosePhotoDisabled,
                                    ]}
                                >
                                    <Text style={[styles.choosePhotoText, { textAlign: 'center' }]}>
                                        {phase === 'done' ? 'Try another photo' : 'Choose Photo'}
                                    </Text>
                                </Pressable>
                            ) : null}
                            {whatsappButton}
                            <Text style={[styles.uploadHint, { alignSelf: 'center', paddingBottom: spacing.lg }]}>
                                Your photo is used only to create this preview.
                            </Text>
                        </View>
                    )}
                </View>

                {mode === 'mannequin' ? (
                    <View style={styles.selector}>
                        <Text style={styles.selectorLabel}>Model</Text>
                        <View style={styles.genderRow}>
                            {(['female', 'male'] as MannequinGender[]).map((g) => {
                                const active = gender === g;
                                return (
                                    <Pressable
                                        key={g}
                                        onPress={() => selectGender(g)}
                                        style={[styles.genderChip, active && styles.genderChipActive]}
                                    >
                                        <Text style={[styles.genderChipText, active && styles.genderChipTextActive]}>
                                            {g === 'female' ? 'Female' : 'Male'}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                        <View style={styles.mannequinGrid}>
                            {genderMannequins.map((m) => {
                                const active = m.id === mannequinId;
                                return (
                                    <Pressable
                                        key={m.id}
                                        onPress={() => selectMannequin(m.id)}
                                        style={[styles.mannequinThumb, active && styles.mannequinThumbActive]}
                                    >
                                        <Image source={m.source} style={styles.mannequinThumbImg} contentFit="cover" />
                                        {active ? (
                                            <View style={styles.mannequinCheck}>
                                                <Check color={colors.text.primary} size={12} strokeWidth={3} />
                                            </View>
                                        ) : null}
                                        <Text
                                            style={[
                                                styles.mannequinThumbLabel,
                                                active && styles.mannequinThumbLabelActive,
                                            ]}
                                        >
                                            {m.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                ) : null}

                <View style={styles.selector}>
                    <Text style={styles.selectorLabel}>Select Item</Text>
                    {catalogue.length === 0 ? (
                        <Text style={styles.emptyHint}>
                            Open Try-On from a product, wardrobe item or outfit to choose a garment.
                        </Text>
                    ) : (
                        catalogue.map((item) => {
                            const active = pickedItem?.id === item.id;
                            return (
                                <Pressable
                                    key={item.id}
                                    onPress={() => selectGarment(item)}
                                    style={[styles.outfitRow, active && styles.outfitRowActive]}
                                >
                                    <Image
                                        source={{ uri: item.imageUrl }}
                                        style={styles.stackThumb}
                                        contentFit="cover"
                                    />
                                    <View style={styles.flex}>
                                        <Text style={styles.outfitRowName}>{item.name}</Text>
                                        <Text style={styles.outfitRowMeta}>
                                            {item.price != null
                                                ? `KES ${Number(item.price).toLocaleString('en-KE')}`
                                                : 'Price unavailable'}
                                            {item.sellerName ? ` · ${item.sellerName}` : ''}
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
    stage: { position: 'relative' },
    stageImg: { width: '100%', aspectRatio: 3 / 4 },
    stageOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        padding: spacing.xl,
    },
    uploadArea: {
        aspectRatio: 3 / 4,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        padding: spacing.xl,
    },
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
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
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
        maxWidth: 220,
    },
    resultImg: { width: '100%', aspectRatio: 3 / 4 },
    errorText: { color: '#ff6b6b', fontSize: 12, textAlign: 'center' },
    whatsappBtn: {
        backgroundColor: '#25D366',
        padding: spacing.md,
        borderRadius: radii.lg,
        alignItems: 'center',
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
    emptyHint: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
    },
    genderRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    genderChip: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    genderChipActive: { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary },
    genderChipText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        textTransform: 'uppercase',
    },
    genderChipTextActive: { color: colors.text.primary },
    mannequinGrid: { flexDirection: 'row', gap: spacing.sm },
    mannequinThumb: {
        flex: 1,
        borderRadius: radii.lg,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    mannequinThumbActive: { borderColor: colors.accent.primary },
    mannequinThumbImg: { width: '100%', aspectRatio: 3 / 4 },
    mannequinThumbLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        paddingVertical: spacing.sm,
        textTransform: 'uppercase',
    },
    mannequinThumbLabelActive: { color: colors.accent.primary },
    mannequinCheck: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.accent.primary,
        alignItems: 'center',
        justifyContent: 'center',
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
    stackThumb: {
        width: 36,
        height: 36,
        borderRadius: radii.md,
        borderWidth: 2,
        borderColor: colors.background.shell,
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
});

export default VirtualTryOnScreen;