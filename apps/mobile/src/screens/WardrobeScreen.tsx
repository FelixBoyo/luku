import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, Calendar, Droplet, Plus, Camera } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { CollectionHeader } from '../components/shell/CollectionHeader';
import { CollectionSearch } from '../components/common/CollectionSearch';
import {
    CollapsingChromeSlot,
    CompactSearchButton,
    compactTabChipStyles,
} from '../components/common/CollapsingChromeSlot';
import { PillTabs, type PillTab } from '../components/common/PillTabs';
import { focusSearchFromCompact, useCollapsingChrome } from '../hooks/useCollapsingChrome';
import { FilterChips } from '../components/common/FilterChips';
import { MasonryGrid } from '../components/common/MasonryGrid';
import type { WardrobeItem } from '../types/domain/wardrobe';
import { BottomSheet } from '../components/common/BottomSheet';
import { GradientButton } from '../components/auth/GradientButton';
import {
    WardrobeItemForm,
    type WardrobeFormValues,
} from '../components/wardrobe/WardrobeItemForm';
import { masonryHeight } from '../lib/masonry';
import { listedWardrobeItemIds } from '../lib/wardrobeAvailability';
import { repositories } from '../repositories';
import { colors, radii, spacing, typography } from '../theme/tokens';

import * as ImagePicker from 'expo-image-picker';
import {
    getWardrobeImageUploadUrl,
    uploadImageToSignedUrl,
} from '../api/bffUploads';

const EMPTY_FORM: WardrobeFormValues = {
    name: '',
    brand: '',
    description: '',
    category: '',
    size: '',
    condition: '',
    purchasePrice: '',
};

type Props = NativeStackScreenProps<RootStackParamList, 'Wardrobe'>;

type Item = WardrobeItem & {
    status: 'available' | 'in-wash';
};

const TABS = [
    { id: 'items', label: 'Items' },
    { id: 'insights', label: 'Insights' },
    { id: 'laundry', label: 'Laundry' },
    { id: 'wearlog', label: 'Wear Log' },
];

const FILTERS = ['All Items', 'Tops', 'Bottoms', 'Outerwear', 'Shoes'];
const CATEGORIES = ['Tops', 'Bottoms', 'Shoes', 'Outerwear'];

const WardrobeScreen: React.FC<Props> = ({ navigation }) => {
    const [tab, setTab] = useState('items');
    const [filter, setFilter] = useState('All Items');
    const [query, setQuery] = useState('');
    const [items, setItems] = useState<Item[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState<WardrobeFormValues>(EMPTY_FORM);
    const [pickedImage, setPickedImage] = useState<{
        uri: string;
        type: string;
        name: string;
    } | null>(null);
    const [uploading, setUploading] = useState(false);

const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photo library.');
        return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
        const contentType =
            ext === 'png' ? 'image/png'
            : ext === 'webp' ? 'image/webp'
            : 'image/jpeg';
        setPickedImage({ uri: asset.uri, type: contentType, name: `photo.${ext}` });
    }
};

    const refresh = useCallback(async () => {
        const [wardrobe, listingRows] = await Promise.all([
            repositories.wardrobe.list(),
            repositories.listings.list(),
        ]);
        const unavailableIds = listedWardrobeItemIds(listingRows);
        setItems(
            wardrobe
                .filter((w) => !unavailableIds.has(w.id))
                .map((w, idx) => ({
                    ...w,
                    status: idx === 2 ? ('in-wash' as const) : ('available' as const),
                })),
        );
    }, []);

    useFocusEffect(
        useCallback(() => {
            void refresh();
        }, [refresh]),
    );

    const inWash = items.filter((i) => i.status === 'in-wash');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return items.filter((i) => {
            const matchesFilter = filter === 'All Items' || i.category === filter;
            const matchesSearch =
                !q ||
                i.name.toLowerCase().includes(q) ||
                i.brand.toLowerCase().includes(q) ||
                i.category.toLowerCase().includes(q);
            return matchesFilter && matchesSearch;
        });
    }, [items, filter, query]);

    const featuredItem = useMemo(() => {
        if (filtered.length === 0) return null;
        return [...filtered].sort((a, b) => b.wearCount - a.wearCount)[0];
    }, [filtered]);

    const addItem = async () => {
        if (!addForm.name) return;
        setUploading(true);
        try {
            let imageUrl = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600';

            if (pickedImage) {
                const { signedUrl, publicUrl } = await getWardrobeImageUploadUrl(
                    pickedImage.name,
                    pickedImage.type,
                );
                await uploadImageToSignedUrl(signedUrl, pickedImage.uri, pickedImage.type);
                imageUrl = publicUrl;
            }

            await repositories.wardrobe.create({
                name: addForm.name,
                category: addForm.category || 'Tops',
                brand: addForm.brand || 'No Brand',
                color: '',
                size: addForm.size || 'M',
                condition: addForm.condition || 'Gently Used',
                purchasePrice: Number(addForm.purchasePrice) || 0,
                description: addForm.description,
                source: 'manual',
                imageUrl,
                images: [imageUrl],
            });
            await refresh();
            setAddForm(EMPTY_FORM);
            setPickedImage(null);
            setShowAdd(false);
        } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add item');
        } finally {
            setUploading(false);
        }
    };
    const pillTabs: PillTab[] = TABS.map((t) =>
        t.id === 'laundry' ? { ...t, badge: inWash.length } : t,
    );

    const {
        chromeCollapsed,
        fullChromeOpacity,
        compactChromeOpacity,
        onScroll,
    } = useCollapsingChrome();
    const searchRef = useRef<TextInput>(null);
    const flatListRef = useRef<FlatList<{ key: string }>>(null);

    const activeTabLabel = useMemo(() => {
        const active = pillTabs.find((t) => t.id === tab);
        if (!active) return tab;
        return active.badge != null && active.badge > 0
            ? `${active.label} (${active.badge})`
            : active.label;
    }, [pillTabs, tab]);

    const openItem = (itemId: string) =>
        navigation.navigate('WardrobeItemDetail', { itemId });

    const renderMasonryCard = (item: Item, index: number) => (
        <Pressable
            style={[styles.masonryCard, { height: masonryHeight(index) }]}
            onPress={() => openItem(item.id)}
        >
            <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
            {item.status === 'in-wash' ? (
                <View style={styles.washBadge}>
                    <Text style={styles.washText}>In Wash</Text>
                </View>
            ) : null}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gridLabelBg}
            >
                <Text style={styles.gridName}>{item.name}</Text>
                <Text style={styles.gridWears}>{item.wearCount} wears</Text>
            </LinearGradient>
        </Pressable>
    );

    const itemsTabContent = (
        <>
            {featuredItem ? (
                <Pressable
                    style={styles.heroWrap}
                    onPress={() => openItem(featuredItem.id)}
                >
                    <Image
                        source={{ uri: featuredItem.imageUrl }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.85)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.heroContent}>
                        <Text style={styles.heroCat}>{featuredItem.category}</Text>
                        <Text style={styles.heroName}>{featuredItem.name}</Text>
                        <View style={styles.heroMeta}>
                            <Text style={styles.heroWears}>Worn {featuredItem.wearCount}x</Text>
                            <View style={styles.mostWornBadge}>
                                <Text style={styles.mostWornText}>Most Worn</Text>
                            </View>
                        </View>
                    </View>
                </Pressable>
            ) : null}

            <View style={styles.filterRow}>
                <FilterChips
                    scrollable
                    options={FILTERS}
                    value={filter}
                    onChange={setFilter}
                />
            </View>

            {filtered.length > 0 ? (
                <MasonryGrid
                    items={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMasonryCard}
                />
            ) : (
                <Text style={styles.empty}>No items match your search</Text>
            )}
        </>
    );

    const insightsContent = (
        <View style={styles.section}>
            <View style={styles.statRow}>
                <StatTile label="Total" value={String(items.length)} highlight />
                <StatTile label="Avg Wear" value="3.2x" />
                <StatTile label="Sustain" value="4/5" />
            </View>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Category Breakdown</Text>
                {CATEGORIES.map((cat) => {
                    const count = items.filter((i) => i.category === cat).length;
                    const pct = items.length ? Math.round((count / items.length) * 100) : 0;
                    return (
                        <View key={cat} style={styles.breakRow}>
                            <View style={styles.breakHead}>
                                <Text style={styles.breakCat}>{cat}</Text>
                                <Text style={styles.breakCount}>{count} ({pct}%)</Text>
                            </View>
                            <View style={styles.barTrack}>
                                <View style={[styles.barFill, { width: `${pct}%` }]} />
                            </View>
                        </View>
                    );
                })}
            </View>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Eco Impact</Text>
                <View style={styles.ecoRow}>
                    <Text style={styles.ecoLabel}>CO₂ Saved</Text>
                    <Text style={styles.ecoValue}>24kg</Text>
                </View>
                <View style={styles.ecoRow}>
                    <Text style={styles.ecoLabel}>Rewears This Month</Text>
                    <Text style={styles.ecoValue}>42</Text>
                </View>
            </View>
        </View>
    );

    const laundryContent = (
        <View style={styles.section}>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>In Wash ({inWash.length})</Text>
                {inWash.length > 0 ? (
                    inWash.map((item) => (
                        <View key={item.id} style={styles.laundryRow}>
                            <Image source={{ uri: item.imageUrl }} style={styles.laundryThumb} contentFit="cover" />
                            <View style={styles.flex}>
                                <Text style={styles.laundryName}>{item.name}</Text>
                                <Text style={styles.laundryMeta}>{item.category} · {item.color}</Text>
                            </View>
                            <View style={styles.washingPill}>
                                <Text style={styles.washingText}>WASHING</Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <Text style={styles.empty}>No items currently in wash</Text>
                )}
            </View>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Care Schedule</Text>
                <View style={styles.careRow}>
                    <Calendar color={colors.accent.primary} size={20} strokeWidth={2.5} />
                    <View style={styles.flex}>
                        <Text style={styles.careTitle}>Dry Cleaning Due</Text>
                        <Text style={styles.careMeta}>Wool Coat · May 25</Text>
                    </View>
                </View>
                <View style={styles.careRow}>
                    <Droplet color={colors.accent.primary} size={20} strokeWidth={2.5} />
                    <View style={styles.flex}>
                        <Text style={styles.careTitle}>Hand Wash Reminder</Text>
                        <Text style={styles.careMeta}>Cashmere Sweater · May 22</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const wearLogContent = (
        <View style={styles.section}>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Recent Wears</Text>
                {[
                    { item: items[6], when: 'Today · 10:30 AM' },
                    { item: items[1], when: 'Yesterday · 2:00 PM' },
                    { item: items[2], when: 'May 17 · 9:00 AM' },
                ]
                    .filter(({ item }) => item)
                    .map(({ item, when }) => (
                        <View key={item.id} style={styles.laundryRow}>
                            <Image source={{ uri: item.imageUrl }} style={styles.laundryThumb} contentFit="cover" />
                            <View style={styles.flex}>
                                <Text style={styles.laundryName}>{item.name}</Text>
                                <Text style={styles.laundryMeta}>{when}</Text>
                            </View>
                        </View>
                    ))}
            </View>
            <View style={styles.card}>
                <View style={styles.streakRow}>
                    <View style={styles.streakLeft}>
                        <View style={styles.streakIcon}>
                            <Award color={colors.text.primary} size={24} strokeWidth={2.5} />
                        </View>
                        <View>
                            <Text style={styles.streakValue}>7 Days</Text>
                            <Text style={styles.streakLabel}>Current streak</Text>
                        </View>
                    </View>
                    <View style={styles.streakRight}>
                        <Text style={styles.streakTotal}>42</Text>
                        <Text style={styles.streakLabel}>Total wears</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const tabContent =
        tab === 'items'
            ? itemsTabContent
            : tab === 'insights'
              ? insightsContent
              : tab === 'laundry'
                ? laundryContent
                : wearLogContent;

    return (
        <View style={styles.container}>
            <CollectionHeader
                title="WARDROBE"
                subtitle={`${items.length} items · ${inWash.length} in wash`}
                onBack={() => navigation.goBack()}
            />
            <CollapsingChromeSlot
                collapsed={chromeCollapsed}
                fullOpacity={fullChromeOpacity}
                compactOpacity={compactChromeOpacity}
                fullChrome={
                    <View style={styles.chromeInner}>
                        <CollectionSearch
                            ref={searchRef}
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Search wardrobe…"
                        />
                        <PillTabs
                            tabs={pillTabs}
                            activeId={tab}
                            onChange={setTab}
                            scrollable
                        />
                    </View>
                }
                compactChrome={
                    <>
                        <CompactSearchButton
                            onPress={() => focusSearchFromCompact(flatListRef, searchRef)}
                        />
                        <View style={compactTabChipStyles.chip}>
                            <Text style={compactTabChipStyles.chipText}>{activeTabLabel}</Text>
                        </View>
                    </>
                }
            />
            <FlatList
                ref={flatListRef}
                data={[{ key: tab }]}
                keyExtractor={(item) => item.key}
                renderItem={() => <View style={styles.listBody}>{tabContent}</View>}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                style={styles.scrollView}
                onScroll={onScroll}
                scrollEventThrottle={16}
            />

            {tab === 'items' ? (
                <Pressable style={styles.fab} onPress={() => setShowAdd(true)}>
                    <Plus color={colors.text.primary} size={28} strokeWidth={3} />
                </Pressable>
            ) : null}

        <BottomSheet visible={showAdd} onClose={() => setShowAdd(false)} title="Add to Wardrobe">
            {/* Photo picker tile */}
            
            <Pressable style={styles.photoPicker} onPress={() => void pickImage()}>
                {pickedImage ? (
                    <Image
                        source={{ uri: pickedImage.uri }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                    />
                ) : (
                    <>
                        <Camera size={24} color={colors.text.onDarkMuted} strokeWidth={2} />
                        <Text style={styles.photoPickerText}>Add Photo</Text>
                    </>
                )}
            </Pressable>

            <WardrobeItemForm
                values={addForm}
                onChange={(patch) => setAddForm((p) => ({ ...p, ...patch }))}
            />
            <View style={styles.addSubmit}>
                <GradientButton
                    label={uploading ? 'Uploading…' : 'Add to Wardrobe'}
                    disabled={!addForm.name || uploading}
                    onPress={() => void addItem()}
                />
            </View>
        </BottomSheet>
        </View>
    );
};

const StatTile: React.FC<{ label: string; value: string; highlight?: boolean }> = ({
    label,
    value,
    highlight,
}) => (
    <View style={[styles.statTile, highlight && styles.statTileHighlight]}>
        <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    chromeInner: {
        paddingHorizontal: spacing.page,
        gap: spacing.sm,
    },
    scrollView: { flex: 1 },
    scroll: { paddingBottom: 120 },
    listBody: { paddingHorizontal: spacing.page },
    flex: { flex: 1 },
    heroWrap: {
        height: 240,
        borderRadius: radii.xl,
        overflow: 'hidden',
        justifyContent: 'flex-end',
        marginBottom: spacing.lg,
    },
    heroContent: { padding: spacing.lg },
    heroCat: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    heroName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 24,
        color: colors.text.onDark,
        marginBottom: spacing.sm,
    },
    heroMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    heroWears: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
    },
    mostWornBadge: {
        backgroundColor: colors.accent.primary,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: radii.sm,
    },
    mostWornText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.primary,
        textTransform: 'uppercase',
    },
    filterRow: { marginLeft: -spacing.page, marginBottom: spacing.lg },
    masonryCard: {
        borderRadius: radii.lg,
        overflow: 'hidden',
        backgroundColor: colors.background.muted,
    },
    washBadge: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        backgroundColor: colors.accent.primary,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: radii.sm,
        zIndex: 1,
    },
    washText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 9,
        color: colors.text.primary,
        textTransform: 'uppercase',
    },
    gridLabelBg: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.md,
        paddingTop: spacing.xl,
    },
    gridName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.onDark,
    },
    gridWears: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
    },
    section: { gap: spacing.lg },
    statRow: { flexDirection: 'row', gap: spacing.md },
    statTile: {
        flex: 1,
        padding: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
    },
    statTileHighlight: {
        backgroundColor: 'rgba(72,205,138,0.15)',
        borderColor: 'rgba(72,205,138,0.3)',
    },
    statValue: {
        fontFamily: typography.fontFamily.black,
        fontSize: 22,
        color: colors.text.onDark,
    },
    statValueHighlight: { color: colors.accent.primary },
    statLabel: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 10,
        color: colors.text.onDarkMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 2,
    },
    card: {
        padding: spacing.lg,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    cardTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.md,
    },
    breakRow: { marginBottom: spacing.md },
    breakHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    breakCat: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 13,
        color: colors.text.onDark,
    },
    breakCount: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
    },
    barTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 4, backgroundColor: colors.accent.primary },
    ecoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    ecoLabel: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
    },
    ecoValue: {
        fontFamily: typography.fontFamily.black,
        fontSize: 18,
        color: colors.text.onDark,
    },
    laundryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
    },
    laundryThumb: { width: 56, height: 56, borderRadius: radii.md },
    laundryName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
    },
    laundryMeta: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
    },
    washingPill: {
        backgroundColor: colors.accent.gradientEnd,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
    },
    washingText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDark,
    },
    empty: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        textAlign: 'center',
        paddingVertical: spacing.xl,
    },
    careRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        paddingVertical: spacing.sm,
    },
    careTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 14,
        color: colors.text.onDark,
    },
    careMeta: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
    },
    streakRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    streakLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    streakIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.accent.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    streakValue: {
        fontFamily: typography.fontFamily.black,
        fontSize: 18,
        color: colors.text.onDark,
    },
    streakLabel: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        color: colors.text.onDarkMuted,
    },
    streakRight: { alignItems: 'flex-end' },
    streakTotal: {
        fontFamily: typography.fontFamily.black,
        fontSize: 24,
        color: colors.text.onDark,
    },
    addSubmit: { marginTop: spacing.lg },
    fab: {
        position: 'absolute',
        bottom: spacing.tabBar,
        right: spacing.page,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.accent.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    photoPicker: {
        height: 180,
        borderRadius: radii.xl,
        borderWidth: 1.5,
        borderColor: colors.border.dark,
        borderStyle: 'dashed',
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
    photoPickerText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        marginTop: spacing.sm,
    },
});

export default WardrobeScreen;
