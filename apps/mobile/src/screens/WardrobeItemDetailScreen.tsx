import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ArrowRightLeft,
    Calendar,
    Check,
    ChevronLeft,
    ChevronRight,
    Edit2,
    Heart,
    Trash2,
} from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomSheet } from '../components/common/BottomSheet';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
    WardrobeItemForm,
    type WardrobeFormValues,
} from '../components/wardrobe/WardrobeItemForm';
import { repositories } from '../repositories';
import type { WardrobeItem, WearHistoryEntry } from '../types/domain/wardrobe';
import { useAppState } from '../context/AppStateContext';
import { formatKES } from '../lib/format';
import { listedWardrobeItemIds } from '../lib/wardrobeAvailability';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'WardrobeItemDetail'>;

const EMPTY_FORM: WardrobeFormValues = {
    name: '',
    brand: '',
    description: '',
    category: '',
    size: '',
    condition: '',
    purchasePrice: '',
};

const WardrobeItemDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const { logWear: persistLogWear, refreshWardrobe } = useAppState();

    const [itemId, setItemId] = useState(route.params.itemId);
    const [allItems, setAllItems] = useState<WardrobeItem[]>([]);
    const [item, setItem] = useState<WardrobeItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [liked, setLiked] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editForm, setEditForm] = useState<WardrobeFormValues>(EMPTY_FORM);
    const [showDelete, setShowDelete] = useState(false);
    const [wearCount, setWearCount] = useState(0);
    const [wearHistory, setWearHistory] = useState<WearHistoryEntry[]>([]);
    const [loggedToday, setLoggedToday] = useState(false);
    const [loggingWear, setLoggingWear] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const loadData = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const [list, listings, found] = await Promise.all([
                repositories.wardrobe.list(),
                repositories.listings.list(),
                repositories.wardrobe.getById(id),
            ]);
            // The chevrons walk this list, so it has to match what the wardrobe
            // surfaces show. `found` is fetched separately, which keeps the
            // "View in wardrobe" link on a listed item working — that item is
            // simply absent from the list, so both arrows hide.
            const listed = listedWardrobeItemIds(listings);
            setAllItems(list.filter((w) => !listed.has(w.id)));
            setItem(found);
            setWearCount(found.wearCount);
            setWearHistory(found.wearHistory ?? []);
            setEditForm({
                name: found.name,
                brand: found.brand,
                description: found.description ?? '',
                category: found.category,
                size: found.size,
                condition: found.condition,
                purchasePrice: String(found.purchasePrice),
            });
        } catch {
            setItem(null);
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        void loadData(itemId);
    }, [itemId, loadData]);

    const itemIndex = allItems.findIndex((i) => i.id === itemId);
    const prevItem = itemIndex > 0 ? allItems[itemIndex - 1] : null;
    const nextItem =
        itemIndex >= 0 && itemIndex < allItems.length - 1 ? allItems[itemIndex + 1] : null;
    const images = item ? (item.images.length > 0 ? item.images : [item.imageUrl]) : [];
    const costPerWear = item ? Math.round(item.purchasePrice / Math.max(wearCount, 1)) : 0;

    const goTo = (id: string) => {
        setItemId(id);
        setActiveImage(0);
        setLiked(false);
        setLoggedToday(false);
    };

    const logWear = async () => {
        if (loggingWear || loggedToday) return;
        setLoggingWear(true);
        try {
            await persistLogWear(itemId);
            await loadData(itemId);
            setLoggedToday(true);
        } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to log wear');
        } finally {
            setLoggingWear(false);
        }
    };

    const handleDelete = async () => {
        if (deleting) return;
        setDeleting(true);
        try {
            await repositories.wardrobe.remove(itemId);
            await refreshWardrobe();
            setShowDelete(false);
            navigation.goBack();
        } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete item');
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centerFill]}>
                <Text style={styles.loadingText}>Loading…</Text>
            </View>
        );
    }

    if (!item) {
        return (
            <View style={[styles.container, styles.centerFill]}>
                <Text style={styles.loadingText}>Item not found.</Text>
                <Pressable style={styles.backLink} onPress={() => navigation.goBack()}>
                    <Text style={styles.backLinkText}>Go back</Text>
                </Pressable>
            </View>
        );
    }
    

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
                <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()}>
                    <ChevronLeft size={20} color={colors.text.onDark} strokeWidth={2.5} />
                </Pressable>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerName} numberOfLines={1}>
                        {item.name}
                    </Text>
                    {itemIndex >= 0 ? (
                        <Text style={styles.headerCounter}>
                            {itemIndex + 1} / {allItems.length}
                        </Text>
                    ) : (
                        <Text style={styles.headerCounter}>Listed</Text>
                    )}
                </View>
                <View style={styles.headerActions}>
                    <Pressable
                        style={[styles.headerBtn, liked && styles.headerBtnLiked]}
                        onPress={() => setLiked((v) => !v)}
                    >
                        <Heart
                            size={16}
                            color={liked ? colors.accent.warm : colors.text.onDark}
                            fill={liked ? colors.accent.warm : 'transparent'}
                            strokeWidth={2.5}
                        />
                    </Pressable>
                    <Pressable style={styles.headerBtn} onPress={() => setShowDelete(true)}>
                        <Trash2 size={16} color={colors.status.error} strokeWidth={2.5} />
                    </Pressable>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <Image
                        source={{ uri: images[activeImage] }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.6)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                    {prevItem ? (
                        <Pressable style={styles.navArrowLeft} onPress={() => goTo(prevItem.id)}>
                            <ChevronLeft size={20} color={colors.text.onDark} strokeWidth={2.5} />
                        </Pressable>
                    ) : null}
                    {nextItem ? (
                        <Pressable style={styles.navArrowRight} onPress={() => goTo(nextItem.id)}>
                            <ChevronRight size={20} color={colors.text.onDark} strokeWidth={2.5} />
                        </Pressable>
                    ) : null}
                    {images.length > 1 ? (
                        <View style={styles.dots}>
                            {images.map((_, i) => (
                                <Pressable key={i} onPress={() => setActiveImage(i)}>
                                    <View
                                        style={[
                                            styles.dot,
                                            i === activeImage && styles.dotActive,
                                        ]}
                                    />
                                </Pressable>
                            ))}
                        </View>
                    ) : null}
                </View>

                {images.length > 1 ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.thumbRow}
                    >
                        {images.map((uri, i) => (
                            <Pressable
                                key={uri + i}
                                style={[styles.thumb, i === activeImage && styles.thumbActive]}
                                onPress={() => setActiveImage(i)}
                            >
                                <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                            </Pressable>
                        ))}
                    </ScrollView>
                ) : null}

                <View style={styles.body}>
                    <View style={styles.detailCard}>
                        <View style={styles.detailHead}>
                            <View style={styles.flex}>
                                <Text style={styles.name}>{item.name}</Text>
                                <Text style={styles.subtitle}>
                                    {item.brand} · {item.color}
                                </Text>
                            </View>
                            <Pressable
                                style={styles.editBtn}
                                onPress={() => {
                                    setEditForm({
                                        name: item.name,
                                        brand: item.brand,
                                        description: item.description ?? '',
                                        category: item.category,
                                        size: item.size,
                                        condition: item.condition,
                                        purchasePrice: String(item.purchasePrice),
                                    });
                                    setShowEdit(true);
                                }}
                            >
                                <Edit2 size={14} color={colors.text.onDarkMuted} strokeWidth={2.5} />
                            </Pressable>
                        </View>
                        <View style={styles.tags}>
                            {[item.size, item.condition, `Added ${item.dateAdded}`].map((t) => (
                                <View key={t} style={styles.tag}>
                                    <Text style={styles.tagText}>{t}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                    <Pressable
                        style={[styles.logWearBtn, loggedToday && styles.logWearBtnDone]}
                        onPress={() => void logWear()}
                        disabled={loggingWear || loggedToday}
                    >
                        {loggingWear ? (
                            <ActivityIndicator size="small" color={colors.accent.primary} />
                        ) : loggedToday ? (
                            <Check size={14} color={colors.text.primary} strokeWidth={3} />
                        ) : null}
                        <Text style={[styles.logWearText, loggedToday && styles.logWearTextDone]}>
                            {loggingWear ? 'Logging…' : loggedToday ? 'Wear Logged' : 'Log Wear'}
                        </Text>
                    </Pressable>

                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{wearCount}</Text>
                            <Text style={styles.statLabel}>Times Worn</Text>
                        </View>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{formatKES(item.purchasePrice)}</Text>
                            <Text style={styles.statLabel}>Purchase Price</Text>
                        </View>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{formatKES(costPerWear)}</Text>
                            <Text style={styles.statLabel}>Cost Per Wear</Text>
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <Pressable
                            style={styles.tryOnBtn}
                            onPress={() =>
                                navigation.navigate('VirtualTryOn', {
                                    source: 'wardrobe',
                                    itemId: item.id,
                                })
                            }
                        >
                            <Calendar size={16} color={colors.accent.tryOn} strokeWidth={2.5} />
                            <Text style={styles.tryOnText}>Try On</Text>
                        </Pressable>
                        <Pressable
                            style={styles.listBtn}
                            onPress={() =>
                                navigation.navigate('ListItemModal', {
                                    wardrobeItemId: itemId,
                                })
                            }
                        >
                            <ArrowRightLeft size={16} color={colors.accent.warm} strokeWidth={2.5} />
                            <Text style={styles.listText}>List for Sale</Text>
                        </Pressable>
                    </View>

                    {(item.outfits?.length ?? 0) > 0 ? (
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionLabel}>
                                IN {item.outfits!.length} OUTFITS
                            </Text>
                            <View style={styles.outfitGrid}>
                                {item.outfits!.map((o) => (
                                    <Pressable
                                        key={o.id}
                                        style={styles.outfitTile}
                                        onPress={() =>
                                            navigation.navigate('OutfitDetail', {
                                                outfitId: o.id,
                                            })
                                        }
                                    >
                                        <Image
                                            source={{ uri: o.imageUrl }}
                                            style={StyleSheet.absoluteFill}
                                            contentFit="cover"
                                        />
                                        <LinearGradient
                                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                                            style={StyleSheet.absoluteFill}
                                        />
                                        <Text style={styles.outfitName}>{o.name}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    ) : null}

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionLabel}>WEAR HISTORY</Text>
                        {wearHistory.length === 0 ? (
                            <Text style={styles.emptyHistory}>No wear history yet</Text>
                        ) : (
                            wearHistory.map((entry, idx) => (
                                <View
                                    key={entry.date + idx}
                                    style={[
                                        styles.historyRow,
                                        idx < wearHistory.length - 1 &&
                                            styles.historyDivider,
                                    ]}
                                >
                                    <View style={styles.historyDot} />
                                    <View style={styles.flex}>
                                        <Text style={styles.historyDate}>{entry.date}</Text>
                                        <Text style={styles.historyOccasion}>{entry.occasion}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>

            <BottomSheet visible={showEdit} onClose={() => setShowEdit(false)} title="Edit Item">
                <WardrobeItemForm
                    values={editForm}
                    onChange={(patch) => setEditForm((p) => ({ ...p, ...patch }))}
                    item={item}
                />
                <Pressable
                    style={styles.saveBtn}
                    onPress={async () => {
                        await repositories.wardrobe.update(itemId, {
                            name: editForm.name,
                            brand: editForm.brand,
                            description: editForm.description,
                            category: editForm.category,
                            size: editForm.size,
                            condition: editForm.condition,
                            purchasePrice: Number(editForm.purchasePrice) || 0,
                        });
                        await refreshWardrobe();
                        await loadData(itemId);
                        setShowEdit(false);
                    }}
                >
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                </Pressable>
            </BottomSheet>
            <ConfirmDialog
                visible={showDelete}
                title="Delete Item?"
                description={`This will remove ${item.name} from your wardrobe.`}
                confirmLabel="Delete"
                destructive
                loading={deleting}
                onCancel={() => setShowDelete(false)}
                onConfirm={() => void handleDelete()}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    centerFill: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
    loadingText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDarkMuted,
    },
    backLink: { paddingVertical: spacing.sm },
    backLinkText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.accent.primary,
    },
    flex: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.dark,
        backgroundColor: 'rgba(0,0,0,0.9)',
    },
    headerBtn: {
        width: 36,
        height: 36,
        borderRadius: radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    headerBtnLiked: {
        backgroundColor: 'rgba(242,184,114,0.15)',
        borderColor: 'rgba(242,184,114,0.3)',
    },
    headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.sm },
    headerName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
    },
    headerCounter: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 10,
        color: colors.text.onDarkSubtle,
    },
    headerActions: { flexDirection: 'row', gap: spacing.sm },
    hero: { aspectRatio: 3 / 4, position: 'relative' },
    categoryBadge: {
        position: 'absolute',
        top: spacing.lg,
        left: spacing.lg,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.md,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    categoryText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDark,
        textTransform: 'uppercase',
    },
    navArrowLeft: {
        position: 'absolute',
        left: spacing.lg,
        top: '50%',
        marginTop: -20,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    navArrowRight: {
        position: 'absolute',
        right: spacing.lg,
        top: '50%',
        marginTop: -20,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    dots: {
        position: 'absolute',
        bottom: spacing.lg,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
    dotActive: { width: 16, backgroundColor: colors.text.onDark },
    thumbRow: { paddingHorizontal: spacing.page, paddingTop: spacing.md, gap: spacing.sm },
    thumb: {
        width: 56,
        height: 56,
        borderRadius: radii.md,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    thumbActive: { borderColor: colors.accent.primary },
    body: { padding: spacing.page, gap: spacing.lg, paddingBottom: spacing.xxl },
    detailCard: {
        padding: spacing.lg,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: colors.background.cardDark,
    },
    detailHead: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
    name: {
        fontFamily: typography.fontFamily.black,
        fontSize: 20,
        color: colors.text.onDark,
    },
    subtitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        marginTop: 2,
    },
    editBtn: {
        width: 32,
        height: 32,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    tag: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.md,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: colors.border.dark,
    },
    tagText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDarkMuted,
    },
    logWearBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: 'rgba(72,205,138,0.4)',
        backgroundColor: 'rgba(72,205,138,0.08)',
        marginBottom: spacing.md,
    },
    logWearBtnDone: {
        borderColor: colors.accent.primary,
        backgroundColor: colors.accent.primary,
    },
    logWearText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.accent.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    logWearTextDone: { color: colors.text.primary },
    statsRow: { flexDirection: 'row', gap: spacing.md },
    stat: {
        flex: 1,
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: colors.background.cardDark,
    },
    statValue: {
        fontFamily: typography.fontFamily.black,
        fontSize: 16,
        color: colors.text.onDark,
        textAlign: 'center',
    },
    statLabel: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 10,
        color: colors.text.onDarkSubtle,
        marginTop: 2,
        textAlign: 'center',
    },
    actions: { flexDirection: 'row', gap: spacing.md },
    tryOnBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: 'rgba(138,72,205,0.3)',
        backgroundColor: 'rgba(138,72,205,0.08)',
    },
    tryOnText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.accent.tryOn,
        textTransform: 'uppercase',
    },
    listBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: 'rgba(242,184,114,0.3)',
        backgroundColor: 'rgba(242,184,114,0.08)',
    },
    listText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.accent.warm,
        textTransform: 'uppercase',
    },
    sectionCard: {
        padding: spacing.lg,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: colors.background.cardDark,
    },
    sectionLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDarkSubtle,
        letterSpacing: 1.5,
        marginBottom: spacing.md,
    },
    outfitGrid: { flexDirection: 'row', gap: spacing.sm },
    outfitTile: {
        flex: 1,
        aspectRatio: 3 / 4,
        borderRadius: radii.lg,
        overflow: 'hidden',
        justifyContent: 'flex-end',
        padding: spacing.sm,
    },
    outfitName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 9,
        color: colors.text.onDark,
    },
    emptyHistory: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkSubtle,
    },
    historyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
    historyDivider: { borderBottomWidth: 1, borderBottomColor: colors.border.dark },
    historyDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.accent.primary,
    },
    historyDate: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.text.onDark,
    },
    historyOccasion: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 10,
        color: colors.text.onDarkSubtle,
    },
    saveBtn: {
        marginTop: spacing.xl,
        paddingVertical: spacing.lg,
        borderRadius: radii.lg,
        backgroundColor: colors.accent.primary,
        alignItems: 'center',
    },
    saveBtnText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.primary,
        textTransform: 'uppercase',
    },
});

export default WardrobeItemDetailScreen;