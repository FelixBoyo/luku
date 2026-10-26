import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View, Alert } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ArrowRightLeft,
    Bookmark,
    ChevronRight,
    Heart,
    Pencil,
    Plus,
    Settings,
    Shirt,
    ShoppingBag,
    SlidersHorizontal,
    Sparkles,
    Tag,
    Camera,
    Truck,
} from 'lucide-react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TabScreenLayout } from '../components/shell/TabScreenLayout';
import { ProfileHeaderSkeleton, WardrobeGridSkeleton } from '../components/skeletons';
import { ViewAllLink } from '../components/common/ViewAllLink';
import { BottomSheet } from '../components/common/BottomSheet';
import { GradientButton } from '../components/auth/GradientButton';
import { WardrobeItemForm, type WardrobeFormValues } from '../components/wardrobe/WardrobeItemForm';
import { ListForSaleSheet } from '../components/sell/ListForSaleSheet';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { createListingFromWardrobe } from '../lib/createListing';
import { formatHandleForDisplay } from '../lib/handle';
import { repositories } from '../repositories';
import type { EditableProfile } from '../repositories/profileRepository';
import type { Listing } from '../types/domain/listing';
import type { Outfit } from '../types/domain/outfit';
import type { Order } from '../types/domain/order';
import type { WardrobeItem } from '../types/domain/wardrobe';
import { useAppState } from '../context/AppStateContext';
import { formatKES } from '../lib/format';
import { formatOrderId } from '../lib/orderDisplay';
import { OrderStatusPill } from '../components/commerce/OrderStatusPill';
import { isToShipSale } from '../repositories/ordersRepository';
import { listedWardrobeItemIds } from '../lib/wardrobeAvailability';
import { AppRefreshControl, useRefresh } from '../components/common/AppRefreshControl';
import { useRootNavigation } from '../navigation/useRootNavigation';
import type { MainTabParamList, MeStackParamList, RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme/tokens';
import * as ImagePicker from 'expo-image-picker';
import {
    getWardrobeImageUploadUrl,
    uploadImageToSignedUrl,
} from '../api/bffUploads';

type Props = CompositeScreenProps<
    NativeStackScreenProps<MeStackParamList, 'MeMain'>,
    CompositeScreenProps<
        BottomTabScreenProps<MainTabParamList>,
        NativeStackScreenProps<RootStackParamList>
    >
>;

type WItem = WardrobeItem & { h: number };

const HEIGHTS = [220, 280, 200, 300, 230, 270, 250];
const toDisplayItem = (item: WardrobeItem, idx: number): WItem => ({ ...item, h: HEIGHTS[idx % HEIGHTS.length] });

const TABS = [
    { id: 'wardrobe', label: 'Wardrobe', icon: Shirt },
    { id: 'saved', label: 'Saved', icon: Heart },
    { id: 'wishlist', label: 'Wishlist', icon: Bookmark },
    { id: 'commerce', label: 'Commerce', icon: Tag },
] as const;

const W_CATS = ['All', 'Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories', 'Bags'];
const SIZES = ['All', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];
const CONDITIONS = ['All', 'New / Never Worn', 'Gently Used', 'Used', 'Very Worn'];
const C_STATUS = ['All', 'Active', 'Draft', 'Sold'];
const PREVIEW_WARDROBE = 4;
const PREVIEW_SAVED = 4;
const PREVIEW_WISHLIST = 4;
const PREVIEW_LISTINGS = 4;
const PREVIEW_ORDERS = 3;

const EMPTY_FORM: WardrobeFormValues = {
    name: '',
    brand: '',
    description: '',
    category: '',
    size: '',
    condition: '',
    purchasePrice: '',
};

const Chip: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({ label, active, onPress }) => (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
);

const MeScreen: React.FC<Props> = ({ navigation }) => {
    const rootNav = useRootNavigation();
    const {
        wardrobeItems,
        refreshWardrobe,
        createdOutfits,
        inspirationOutfits,
        refreshOutfits,
        deleteOutfit,
        wishlistItems,
        refreshWishlist,
        toggleWishlist,
    } = useAppState();
    const [section, setSection] = useState<string>('wardrobe');
    const [savedSubTab, setSavedSubTab] = useState<'created' | 'inspirations'>('created');
    const [commerceTab, setCommerceTab] = useState<'listings' | 'purchases'>('listings');
    const [wardrobe, setWardrobe] = useState<WItem[]>([]);
    const [listings, setListings] = useState<Listing[]>([]);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    const [showWFilters, setShowWFilters] = useState(false);
    const [wCat, setWCat] = useState('All');
    const [wSize, setWSize] = useState('All');
    const [wCond, setWCond] = useState('All');

    const [showCFilters, setShowCFilters] = useState(false);
    const [cStatus, setCStatus] = useState('All');

    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState<WardrobeFormValues>(EMPTY_FORM);
    const [listSaleItem, setListSaleItem] = useState<WItem | null>(null);
    const [unsaveTarget, setUnsaveTarget] = useState<Outfit | null>(null);
    const [moveListingTarget, setMoveListingTarget] = useState<Listing | null>(null);
    const [movingListing, setMovingListing] = useState(false);
    const [profile, setProfile] = useState<EditableProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [wardrobeLoading, setWardrobeLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [activeOrderCount, setActiveOrderCount] = useState(0);
    const [toShipCount, setToShipCount] = useState(0);
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

    const loadWardrobe = useCallback(async () => {
        setWardrobeLoading(true);
        try {
            await refreshWardrobe();
        } finally {
            setWardrobeLoading(false);
        }
    }, [refreshWardrobe]);

    const refreshProfile = useCallback(async () => {
        setProfileLoading(true);
        try {
            const p = await repositories.profile.get();
            setProfile(p);
        } finally {
            setProfileLoading(false);
        }
    }, []);

    const refreshListings = useCallback(async () => {
        const items = await repositories.listings.list();
        setListings(items);
    }, []);

    const refreshConnectionCounts = useCallback(async () => {
        const [followers, following] = await Promise.all([
            repositories.connections.listFollowers(),
            repositories.connections.listFollowing(),
        ]);
        setFollowerCount(followers.length);
        setFollowingCount(following.length);
    }, []);

    const refreshOrders = useCallback(async () => {
        const [all, active, sales] = await Promise.all([
            repositories.orders.list(),
            repositories.orders.listActive(),
            repositories.orders.listSales(),
        ]);
        setOrders(all);
        setActiveOrderCount(active.length);
        setToShipCount(sales.filter(isToShipSale).length);
    }, []);

    // Pull-to-refresh deliberately skips the skeleton-setting variants above:
    // collapsing the whole page into placeholders on a manual pull hides the
    // content the pull was meant to update.
    const refreshAll = useCallback(
        () =>
            Promise.all([
                refreshWardrobe(),
                refreshOutfits(),
                refreshListings(),
                refreshConnectionCounts(),
                refreshWishlist(),
                repositories.profile.get().then(setProfile),
                refreshOrders(),
            ]),
        [
            refreshWardrobe,
            refreshOutfits,
            refreshListings,
            refreshConnectionCounts,
            refreshWishlist,
            refreshOrders,
        ],
    );

    const { refreshing, onRefresh } = useRefresh(refreshAll);

    useFocusEffect(
        useCallback(() => {
            loadWardrobe();
            refreshOutfits();
            refreshListings();
            refreshConnectionCounts();
            refreshWishlist();
            refreshProfile();
            refreshOrders();
        }, [loadWardrobe, refreshOutfits, refreshListings, refreshConnectionCounts, refreshWishlist, refreshProfile, refreshOrders]),
    );

    useEffect(() => {
        setWardrobe(wardrobeItems.map((w, idx) => toDisplayItem(w, idx)));
    }, [wardrobeItems]);

    const wActive = (wCat !== 'All' ? 1 : 0) + (wSize !== 'All' ? 1 : 0) + (wCond !== 'All' ? 1 : 0);
    const cActive = cStatus !== 'All' ? 1 : 0;
    const unavailableWardrobeIds = useMemo(() => listedWardrobeItemIds(listings), [listings]);
    // Two values, because the tab badge and the View all link answer "how many
    // do you own?" while the preview answers "how many match these chips?".
    // Driving both from the filtered list hid the link whenever a chip was set.
    const availableWardrobe = wardrobe.filter((i) => !unavailableWardrobeIds.has(i.id));
    const filteredWardrobe = availableWardrobe.filter((i) => {
        if (wCat !== 'All' && i.category !== wCat) return false;
        if (wSize !== 'All' && i.size !== wSize) return false;
        if (wCond !== 'All' && i.condition !== wCond) return false;
        return true;
    });
    const filteredListings = listings.filter((l) => cStatus === 'All' || l.status === cStatus);
    const previewWardrobe = filteredWardrobe.slice(0, PREVIEW_WARDROBE);
    const previewWishlist = wishlistItems.slice(0, PREVIEW_WISHLIST);
    const previewListings = filteredListings.slice(0, PREVIEW_LISTINGS);

    const listIt = (it: WItem) => setListSaleItem(it);
const moveToWardrobe = async (l: Listing) => {
    if (!l.wardrobeItemId) {
        await repositories.wardrobe.create({
            name: l.name,
            category: l.category || 'Tops',
            brand: 'No Brand',
            color: '',
            size: l.size || 'M',
            condition: l.condition || 'Gently Used',
            purchasePrice: l.price,
            imageUrl: l.imageUrl,
            images: [l.imageUrl],
            source: 'manual',
        });
    }

    await repositories.listings.remove(l.id);
    await refreshWardrobe();
    await refreshListings();
    setSection('wardrobe');
};
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
            await loadWardrobe();
            setAddForm(EMPTY_FORM);
            setPickedImage(null);
            setShowAdd(false);
        } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add item');
        } finally {
            setUploading(false);
        }
    };

    const wishlistTotal = wishlistItems.reduce((s, i) => s + i.price, 0);
    const col = (start: number) => previewWardrobe.filter((_, i) => i % 2 === start);
    const screenWidth = Dimensions.get('window').width;
    const savedCardWidth = (screenWidth - spacing.page * 2 - spacing.md) / 2;
    const savedCardHeight = savedCardWidth * (4 / 3);
    const recentOrders = orders.slice(0, PREVIEW_ORDERS);
    const currentOutfits = savedSubTab === 'created' ? createdOutfits : inspirationOutfits;
    const previewOutfits = currentOutfits.slice(0, PREVIEW_SAVED);

    const DashedAddCard: React.FC<{ label: string; onPress: () => void; width?: number }> = ({
        label,
        onPress,
        width,
    }) => {
        const w = width ?? savedCardWidth;
        return (
            <Pressable onPress={onPress}>
                <View style={[styles.dashedCard, { width: w, height: w * (4 / 3) }]}>
                    <View style={styles.dashedInner}>
                        <Plus color="rgba(255,255,255,0.35)" size={22} strokeWidth={2} />
                        <Text style={styles.dashedText}>{label}</Text>
                    </View>
                </View>
            </Pressable>
        );
    };

    const ListingCard: React.FC<{ listing: Listing }> = ({ listing: l }) => (
        <Pressable onPress={() => rootNav.navigate('ListingDetail', { listingId: l.id })}>
            <View style={[styles.listingCardInner, { width: savedCardWidth, height: savedCardHeight }]}>
                <Image source={{ uri: l.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
                <View style={[styles.statusBadge, {
                    backgroundColor:
                        l.status === 'Draft'
                            ? 'rgba(242,184,114,0.85)'
                            : l.status === 'Sold'
                              ? 'rgba(255,255,255,0.35)'
                              : 'rgba(72,205,138,0.85)',
                }]}>
                    <Text style={styles.statusText}>{l.status}</Text>
                </View>
                <Pressable
                    style={styles.moveBtn}
                    onPress={() => setMoveListingTarget(l)}
                    hitSlop={8}
                >
                    <ArrowRightLeft color="rgba(255,255,255,0.7)" size={14} strokeWidth={2.5} />
                </Pressable>
                <View style={styles.listingLabel}>
                    <Text style={styles.listingName}>{l.name}</Text>
                    {l.price > 0 ? <Text style={styles.listingPrice}>{formatKES(l.price)}</Text> : null}
                    {l.views > 0 ? <Text style={styles.listingViews}>{l.views} views</Text> : null}
                </View>
            </View>
        </Pressable>
    );

    const SavedOutfitCard: React.FC<{
        outfit: Outfit;
        showHeart?: boolean;
    }> = ({ outfit, showHeart }) => (
        <Pressable onPress={() => rootNav.navigate('OutfitDetail', { outfitId: outfit.id })}>
            <View style={[styles.savedCardInner, { width: savedCardWidth, height: savedCardHeight }]}>
                <Image source={{ uri: outfit.coverImageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={StyleSheet.absoluteFill} />
                {showHeart ? (
                    <Pressable
                        style={styles.savedHeart}
                        hitSlop={8}
                        onPress={() => setUnsaveTarget(outfit)}
                    >
                        <Heart color={colors.accent.primary} fill={colors.accent.primary} size={16} strokeWidth={2.5} />
                    </Pressable>
                ) : null}
                <View style={styles.savedLabel}>
                    <Text style={styles.savedName}>{outfit.name}</Text>
                    <Text style={styles.savedMeta}>{outfit.pieces.length} pieces · {outfit.occasion}</Text>
                </View>
            </View>
        </Pressable>
    );

    return (
        <TabScreenLayout>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={<AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {profileLoading ? (
                    <ProfileHeaderSkeleton />
                ) : (
                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        {profile?.avatarUrl ? (
                            <Image
                                source={{ uri: profile.avatarUrl }}
                                style={styles.avatarImage}
                                contentFit="cover"
                            />
                        ) : (
                        <LinearGradient
                            colors={[colors.accent.gradientStart, colors.accent.gradientEnd]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.avatar}
                        >
                            <Text style={styles.avatarText}>{profile?.initials ?? ''}</Text>
                        </LinearGradient>
                        )}
                        <View style={styles.flex}>
                            <Text style={styles.name}>
                                {formatHandleForDisplay(profile?.handle)}
                            </Text>
                            <View style={styles.statsRow}>
                                <Pressable
                                    style={styles.stat}
                                    onPress={() => navigation.navigate('Connections', { initialTab: 'followers' })}
                                >
                                    <Text style={styles.statValue}>{followerCount}</Text>
                                    <Text style={styles.statLabel}>Followers</Text>
                                </Pressable>
                                <View style={styles.statDivider} />
                                <Pressable
                                    style={styles.stat}
                                    onPress={() => navigation.navigate('Connections', { initialTab: 'following' })}
                                >
                                    <Text style={styles.statValue}>{followingCount}</Text>
                                    <Text style={styles.statLabel}>Following</Text>
                                </Pressable>
                                <View style={styles.statDivider} />
                                <View style={styles.stat}>
                                    <Text style={styles.statValue}>{listings.length}</Text>
                                    <Text style={styles.statLabel}>Listings</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                    <View style={styles.actionRow}>
                        <Pressable
                            style={styles.actionBtn}
                            onPress={() => navigation.navigate('EditProfile')}
                        >
                            <Pencil size={14} color={colors.text.onDark} strokeWidth={2.5} />
                            <Text style={styles.actionBtnText}>Edit Profile</Text>
                        </Pressable>
                        <Pressable
                            style={styles.actionBtn}
                            onPress={() => navigation.navigate('Settings')}
                        >
                            <Settings size={14} color={colors.text.onDark} strokeWidth={2.5} />
                            <Text style={styles.actionBtnText}>Settings</Text>
                        </Pressable>
                    </View>
                    <Text style={styles.bio}>{profile?.bio ?? ''}</Text>
                </View>
                )}

                <View style={styles.tabBar}>
                    {TABS.map((t) => {
                        const Icon = t.icon;
                        const active = section === t.id;
                        const count =
                            t.id === 'wardrobe' ? availableWardrobe.length
                                : t.id === 'saved'
                                    ? createdOutfits.length + inspirationOutfits.length
                                    : t.id === 'wishlist' ? wishlistItems.length
                                        : listings.length;
                        return (
                            <Pressable key={t.id} style={styles.tab} onPress={() => setSection(t.id)}>
                                <Icon color={active ? colors.text.onDark : 'rgba(255,255,255,0.35)'} size={20} strokeWidth={2.5} />
                                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
                                <Text style={[styles.tabCount, active && styles.tabCountActive]}>{count}</Text>
                                {active ? <View style={styles.tabUnderline} /> : null}
                            </Pressable>
                        );
                    })}
                </View>

                {section === 'wardrobe' && (
                    <View style={styles.body}>
                        <Pressable style={styles.addBtn} onPress={() => setShowAdd(true)}>
                            <View style={styles.addIcon}>
                                <Plus color={colors.accent.primary} size={16} strokeWidth={2.5} />
                            </View>
                            <View>
                                <Text style={styles.addTitle}>Add to Wardrobe</Text>
                                <Text style={styles.addSub}>Photo, brand, size, condition</Text>
                            </View>
                        </Pressable>

                        <View style={styles.filterBar}>
                            <Pressable
                                onPress={() => setShowWFilters((v) => !v)}
                                style={[styles.filterToggle, wActive > 0 && styles.filterToggleActive]}
                            >
                                <SlidersHorizontal color={wActive > 0 ? colors.text.primary : colors.text.onDark} size={14} strokeWidth={2.5} />
                                <Text style={[styles.filterToggleText, wActive > 0 && styles.filterToggleTextActive]}>Filters</Text>
                                {wActive > 0 ? (
                                    <View style={styles.filterCount}>
                                        <Text style={styles.filterCountText}>{wActive}</Text>
                                    </View>
                                ) : null}
                            </Pressable>
                            {wActive > 0 ? (
                                <Pressable onPress={() => { setWCat('All'); setWSize('All'); setWCond('All'); }}>
                                    <Text style={styles.clearAll}>Clear all</Text>
                                </Pressable>
                            ) : null}
                        </View>

                        {showWFilters ? (
                            <View style={styles.filterPanel}>
                                <Text style={styles.filterGroupLabel}>Category</Text>
                                <View style={styles.chipWrap}>
                                    {W_CATS.map((f) => <Chip key={f} label={f} active={wCat === f} onPress={() => setWCat(f)} />)}
                                </View>
                                <Text style={styles.filterGroupLabel}>Size</Text>
                                <View style={styles.chipWrap}>
                                    {SIZES.map((f) => <Chip key={f} label={f} active={wSize === f} onPress={() => setWSize(f)} />)}
                                </View>
                                <Text style={styles.filterGroupLabel}>Condition</Text>
                                <View style={styles.chipWrap}>
                                    {CONDITIONS.map((f) => <Chip key={f} label={f} active={wCond === f} onPress={() => setWCond(f)} />)}
                                </View>
                            </View>
                        ) : null}

                        {availableWardrobe.length > PREVIEW_WARDROBE ? (
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionHeaderTitle}>Wardrobe preview</Text>
                                <ViewAllLink
                                    align="end"
                                    label="View all wardrobe"
                                    onPress={() => rootNav.navigate('Wardrobe')}
                                />
                            </View>
                        ) : null}

                        {wardrobeLoading ? (
                            <WardrobeGridSkeleton count={6} />
                        ) : (
                            <>
                                {filteredWardrobe.length === 0 ? (
                                    <EmptyState
                                        icon={Shirt}
                                        title="No wardrobe items"
                                        description={
                                            wActive > 0
                                                ? 'Try adjusting your filters'
                                                : 'Add your first piece to start building outfits'
                                        }
                                        actionLabel={wActive > 0 ? undefined : 'Add to Wardrobe'}
                                        onAction={wActive > 0 ? undefined : () => setShowAdd(true)}
                                    />
                                ) : null}

                                <View style={styles.masonry}>
                                    {[col(0), col(1)].map((column, ci) => (
                                        <View key={ci} style={styles.masonryCol}>
                                            {column.map((it) => (
                                                <Pressable
                                                    key={it.id}
                                                    style={[styles.wCard, { height: it.h }]}
                                                    onPress={() => rootNav.navigate('WardrobeItemDetail', { itemId: it.id })}
                                                >
                                                    <Image source={{ uri: it.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                                                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={StyleSheet.absoluteFill} />
                                                    <View style={styles.catBadge}>
                                                        <Text style={styles.catBadgeText}>{it.category}</Text>
                                                    </View>
                                                    <Pressable style={styles.listItBtn} onPress={() => listIt(it)}>
                                                        <Tag color="#F2B872" size={14} strokeWidth={2.5} />
                                                    </Pressable>
                                                    <View style={styles.wLabel}>
                                                        <Text style={styles.wName}>{it.name}</Text>
                                                        <Text style={styles.wWears}>Worn {it.wearCount}x</Text>
                                                    </View>
                                                </Pressable>
                                            ))}
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}
                    </View>
                )}

                {section === 'saved' && (
                    <View style={styles.body}>
                        <View style={styles.subTabs}>
                            <Pressable
                                onPress={() => setSavedSubTab('created')}
                                style={[styles.subTab, savedSubTab === 'created' && styles.subTabActive]}
                            >
                                <Text style={[styles.subTabText, savedSubTab === 'created' && styles.subTabTextActive]}>
                                    Created ({createdOutfits.length})
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setSavedSubTab('inspirations')}
                                style={[styles.subTab, savedSubTab === 'inspirations' && styles.subTabActive]}
                            >
                                <Text style={[styles.subTabText, savedSubTab === 'inspirations' && styles.subTabTextActive]}>
                                    Inspirations ({inspirationOutfits.length})
                                </Text>
                            </Pressable>
                        </View>
                        {currentOutfits.length > PREVIEW_SAVED ? (
                            <ViewAllLink
                                label="View all saved"
                                onPress={() =>
                                    navigation.navigate('SavedOutfits', { initialTab: savedSubTab })
                                }
                            />
                        ) : null}
                        <View style={styles.grid2}>
                            {savedSubTab === 'created' ? (
                                <>
                                    <DashedAddCard
                                        label="New Outfit"
                                        width={savedCardWidth}
                                        onPress={() => rootNav.navigate('CreateOutfit')}
                                    />
                                    {previewOutfits.map((o) => (
                                        <SavedOutfitCard key={o.id} outfit={o} />
                                    ))}
                                </>
                            ) : inspirationOutfits.length === 0 ? (
                                <View style={{ width: '100%' }}>
                                    <EmptyState
                                        icon={Sparkles}
                                        title="No inspirations yet"
                                        description="Save outfits from Home or Stylist to build your inspiration board"
                                    />
                                </View>
                            ) : (
                                previewOutfits.map((o) => (
                                    <SavedOutfitCard key={o.id} outfit={o} showHeart />
                                ))
                            )}
                        </View>
                    </View>
                )}

                {section === 'wishlist' && (
                    <View style={styles.body}>
                        <View style={styles.wishlistHead}>
                            <Text style={styles.sectionLabel}>Items You Want</Text>
                            <Text style={styles.wishlistTotal}>{formatKES(wishlistTotal)}</Text>
                        </View>
                        {wishlistItems.length > PREVIEW_WISHLIST ? (
                            <ViewAllLink
                                label="View all wishlist"
                                onPress={() => navigation.navigate('Wishlist')}
                            />
                        ) : null}
                        <View style={styles.list}>
                            {wishlistItems.length === 0 ? (
                                <EmptyState
                                    icon={Bookmark}
                                    title="Wishlist is empty"
                                    description="Save items you love while browsing the marketplace"
                                    actionLabel="Discover"
                                    onAction={() =>
                                        rootNav.navigate('MainTabs', {
                                            screen: 'Discover',
                                            params: { screen: 'DiscoverMain' },
                                        })
                                    }
                                />
                            ) : null}
                            {previewWishlist.map((w) => (
                                <Pressable
                                    key={w.id}
                                    style={styles.wishRow}
                                    onPress={() => rootNav.navigate('ProductDetail', { productId: w.id })}
                                >
                                    <Image source={{ uri: w.imageUrl }} style={styles.wishThumb} contentFit="cover" />
                                    <View style={styles.flex}>
                                        <Text style={styles.wishName} numberOfLines={1}>{w.name}</Text>
                                        <Text style={styles.wishBrand}>{w.brand}</Text>
                                        <Text style={styles.wishPrice}>{formatKES(w.price)}</Text>
                                    </View>
                                    <Pressable
                                        onPress={(e) => {
                                            e.stopPropagation?.();
                                            void toggleWishlist(w.id);
                                        }}
                                        hitSlop={8}
                                    >
                                        <Heart color={colors.accent.primary} fill={colors.accent.primary} size={20} strokeWidth={2.5} />
                                    </Pressable>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                )}

                {section === 'commerce' && (
                    <View style={styles.body}>
                        {toShipCount > 0 ? (
                            <Pressable
                                style={styles.toShipBanner}
                                onPress={() =>
                                    navigation.navigate('Commerce', { initialTab: 'sales' })
                                }
                            >
                                <View style={styles.toShipIcon}>
                                    <Truck size={16} color={colors.accent.warm} strokeWidth={2.5} />
                                </View>
                                <Text style={styles.toShipText}>
                                    {toShipCount} {toShipCount === 1 ? 'order' : 'orders'} to ship
                                </Text>
                                <ChevronRight size={18} color={colors.text.onDarkMuted} strokeWidth={2.5} />
                            </Pressable>
                        ) : null}
                        <View style={styles.subTabs}>
                            {(['listings', 'purchases'] as const).map((t) => (
                                <Pressable
                                    key={t}
                                    onPress={() => setCommerceTab(t)}
                                    style={[styles.subTab, commerceTab === t && styles.subTabActive]}
                                >
                                    <Text style={[styles.subTabText, commerceTab === t && styles.subTabTextActive]}>
                                        {t === 'listings' ? `Listings (${listings.length})` : 'Purchases'}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        {commerceTab === 'listings' ? (
                            <>
                                {filteredListings.length > PREVIEW_LISTINGS ? (
                                    <View style={styles.sectionHeaderRow}>
                                        <Text style={styles.sectionHeaderTitle}>Your listings</Text>
                                        <ViewAllLink
                                            align="end"
                                            label="View all commerce"
                                            onPress={() =>
                                                navigation.navigate('Commerce', {
                                                    initialTab: 'listings',
                                                })
                                            }
                                        />
                                    </View>
                                ) : null}
                                <View style={styles.filterBar}>
                                    <Pressable
                                        onPress={() => setShowCFilters((v) => !v)}
                                        style={[styles.filterToggle, cActive > 0 && styles.filterToggleActive]}
                                    >
                                        <SlidersHorizontal color={cActive > 0 ? colors.text.primary : colors.text.onDark} size={14} strokeWidth={2.5} />
                                        <Text style={[styles.filterToggleText, cActive > 0 && styles.filterToggleTextActive]}>Filters</Text>
                                        {cActive > 0 ? (
                                            <View style={styles.filterCount}>
                                                <Text style={styles.filterCountText}>{cActive}</Text>
                                            </View>
                                        ) : null}
                                    </Pressable>
                                    {cActive > 0 ? (
                                        <Pressable onPress={() => setCStatus('All')}>
                                            <Text style={styles.clearAll}>Clear all</Text>
                                        </Pressable>
                                    ) : null}
                                </View>
                                {showCFilters ? (
                                    <View style={styles.filterPanel}>
                                        <Text style={styles.filterGroupLabel}>Status</Text>
                                        <View style={styles.chipWrap}>
                                            {C_STATUS.map((f) => <Chip key={f} label={f} active={cStatus === f} onPress={() => setCStatus(f)} />)}
                                        </View>
                                    </View>
                                ) : null}
                                {filteredListings.length === 0 ? (
                                    <EmptyState
                                        icon={Tag}
                                        title="No listings yet"
                                        description="List items from your wardrobe to start selling"
                                        actionLabel="Create Listing"
                                        onAction={() =>
                                            rootNav.navigate('MainTabs', {
                                                screen: 'Sell',
                                                params: { screen: 'SellMain' },
                                            })
                                        }
                                    />
                                ) : null}
                                <View style={styles.grid2}>
                                    <DashedAddCard
                                        label="New Listing"
                                        width={savedCardWidth}
                                        onPress={() =>
                                            rootNav.navigate('MainTabs', {
                                                screen: 'Sell',
                                                params: { screen: 'SellMain' },
                                            })
                                        }
                                    />
                                    {previewListings.map((l) => (
                                        <ListingCard key={l.id} listing={l} />
                                    ))}
                                </View>
                            </>
                        ) : orders.length > 0 ? (
                            <View style={styles.purchasesList}>
                                {orders.length > PREVIEW_ORDERS ? (
                                    <View style={styles.sectionHeaderRow}>
                                        <Text style={styles.sectionHeaderTitle}>Recent orders</Text>
                                        <ViewAllLink
                                            align="end"
                                            label="View all commerce"
                                            onPress={() =>
                                                navigation.navigate('Commerce', {
                                                    initialTab: 'purchases',
                                                })
                                            }
                                        />
                                    </View>
                                ) : null}
                                <Text style={styles.purchasesSub}>
                                    {activeOrderCount} active · {orders.length} total orders
                                </Text>
                                {recentOrders.map((order) => (
                                    <Pressable
                                        key={order.id}
                                        style={styles.orderRow}
                                        onPress={() =>
                                            rootNav.navigate('OrderTracking', { orderId: order.id })
                                        }
                                    >
                                        <View style={styles.orderHead}>
                                            <View>
                                                <Text style={styles.orderId}>
                                                    {formatOrderId(order.id)}
                                                </Text>
                                                <Text style={styles.orderDate}>{order.placedDate}</Text>
                                            </View>
                                            <OrderStatusPill order={order} rounded />
                                        </View>
                                        <View style={styles.thumbRow}>
                                            {order.items.slice(0, 3).map((item) => (
                                                <Image
                                                    key={item.name}
                                                    source={{ uri: item.imageUrl }}
                                                    style={styles.orderThumb}
                                                    contentFit="cover"
                                                />
                                            ))}
                                        </View>
                                        <View style={styles.orderFooter}>
                                            <Text style={styles.orderTotal}>{formatKES(order.total)}</Text>
                                            <ChevronRight size={18} color={colors.text.onDarkMuted} strokeWidth={2.5} />
                                        </View>
                                    </Pressable>
                                ))}
                            </View>
                        ) : (
                            <EmptyState
                                icon={ShoppingBag}
                                title="No purchases yet"
                                description="Items you buy will appear here"
                                actionLabel="Discover"
                                onAction={() =>
                                    rootNav.navigate('MainTabs', {
                                        screen: 'Discover',
                                        params: { screen: 'DiscoverMain' },
                                    })
                                }
                            />
                        )}
                    </View>
                )}
            </ScrollView>


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

            <ListForSaleSheet
                visible={listSaleItem !== null}
                item={listSaleItem}
                onClose={() => setListSaleItem(null)}
                onList={async ({ price, condition }) => {
                    if (!listSaleItem) return;
                    const listing = await createListingFromWardrobe(listSaleItem, {
                        price,
                        condition,
                    });
                    await refreshListings();
                    setListSaleItem(null);
                    rootNav.navigate('MainTabs', {
                        screen: 'Sell',
                        params: {
                            screen: 'ListingConfirmation',
                            params: { listingId: listing.id },
                        },
                    });
                }}
                onFullDetails={(wardrobeItemId) => {
                    rootNav.navigate('ListItemModal', { wardrobeItemId });
                }}
            />

            <ConfirmDialog
                visible={unsaveTarget !== null}
                title="Remove inspiration?"
                description={
                    unsaveTarget
                        ? `Unsave "${unsaveTarget.name}" from your inspirations?`
                        : ''
                }
                confirmLabel="Unsave"
                destructive
                onCancel={() => setUnsaveTarget(null)}
                onConfirm={async () => {
                    if (!unsaveTarget) return;
                    await deleteOutfit(unsaveTarget.id);
                    await refreshOutfits();
                    setUnsaveTarget(null);
                }}
            />

            <ConfirmDialog
                visible={moveListingTarget !== null}
                title="Return to wardrobe?"
                description={
                    moveListingTarget
                        ? `Move "${moveListingTarget.name}" back to your wardrobe and remove this listing?`
                        : ''
                }
                confirmLabel="Move"
                destructive
                loading={movingListing}
                onCancel={() => setMoveListingTarget(null)}
                onConfirm={async () => {
                    if (!moveListingTarget) return;
                    setMovingListing(true);
                    try {
                        await moveToWardrobe(moveListingTarget);
                        setMoveListingTarget(null);
                    } catch (err) {
                        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to move item');
                    } finally {
                        setMovingListing(false);
                    }
                }}
            />
            
        </TabScreenLayout>
    );
};

const styles = StyleSheet.create({
    scroll: { paddingBottom: spacing.xxl },
    flex: { flex: 1 },
    header: { paddingHorizontal: spacing.page, paddingTop: spacing.lg },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)' },
    avatarImage: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)' },
    avatarText: { fontFamily: typography.fontFamily.black, fontSize: 24, color: colors.text.primary },
    name: {
        fontFamily: typography.fontFamily.black,
        fontSize: 17,
        color: colors.text.onDark,
        marginBottom: spacing.sm,
    },
    statsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    stat: { alignItems: 'center' },
    statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },
    statValue: { fontFamily: typography.fontFamily.black, fontSize: 17, color: colors.text.onDark },
    statLabel: { fontFamily: typography.fontFamily.semiBold, fontSize: 11, color: colors.text.onDarkMuted },
    actionRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.lg,
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
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    actionBtnText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    bio: { fontFamily: typography.fontFamily.semiBold, fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: spacing.md },
    tabBar: {
        flexDirection: 'row', paddingHorizontal: spacing.page, marginTop: spacing.xl,
        borderBottomWidth: 1, borderBottomColor: colors.border.dark,
    },
    tab: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: spacing.md },
    tabLabel: { fontFamily: typography.fontFamily.black, fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 },
    tabLabelActive: { color: colors.text.onDark },
    tabCount: { fontFamily: typography.fontFamily.semiBold, fontSize: 9, color: 'rgba(255,255,255,0.25)' },
    tabCountActive: { color: colors.accent.primary },
    tabUnderline: { position: 'absolute', bottom: 0, left: 8, right: 8, height: 2, borderRadius: 1, backgroundColor: colors.accent.primary },
    body: { paddingHorizontal: spacing.page, paddingTop: spacing.lg },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    sectionHeaderTitle: {
        flex: 1,
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDarkMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    addBtn: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md,
        borderRadius: radii.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(72,205,138,0.4)',
        backgroundColor: 'rgba(72,205,138,0.05)', marginBottom: spacing.lg,
    },
    addIcon: { width: 32, height: 32, borderRadius: radii.md, backgroundColor: 'rgba(72,205,138,0.15)', alignItems: 'center', justifyContent: 'center' },
    addTitle: { fontFamily: typography.fontFamily.black, fontSize: 14, color: colors.accent.primary },
    addSub: { fontFamily: typography.fontFamily.semiBold, fontSize: 12, color: 'rgba(255,255,255,0.4)' },
    filterBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
    filterToggle: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
        borderRadius: radii.pill, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)',
    },
    filterToggleActive: { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary },
    filterToggleText: { fontFamily: typography.fontFamily.black, fontSize: 12, color: colors.text.onDark },
    filterToggleTextActive: { color: colors.text.primary },
    filterCount: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: radii.pill, backgroundColor: colors.background.shell },
    filterCountText: { fontFamily: typography.fontFamily.black, fontSize: 10, color: colors.text.onDark },
    clearAll: { fontFamily: typography.fontFamily.bold, fontSize: 12, color: 'rgba(255,255,255,0.5)' },
    filterPanel: {
        padding: spacing.lg, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: spacing.lg, gap: spacing.sm,
    },
    filterGroupLabel: { fontFamily: typography.fontFamily.black, fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.sm },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border.dark, backgroundColor: 'rgba(255,255,255,0.05)' },
    chipActive: { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary },
    chipText: { fontFamily: typography.fontFamily.black, fontSize: 12, color: 'rgba(255,255,255,0.6)' },
    chipTextActive: { color: colors.text.primary },
    masonry: { flexDirection: 'row', gap: spacing.md },
    masonryCol: { flex: 1, gap: spacing.md },
    wCard: { borderRadius: radii.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    catBadge: { position: 'absolute', top: spacing.md, left: spacing.md, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.md, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
    catBadgeText: { fontFamily: typography.fontFamily.black, fontSize: 9, color: colors.text.onDark, textTransform: 'uppercase' },
    listItBtn: { position: 'absolute', top: spacing.md, right: spacing.md, width: 28, height: 28, borderRadius: radii.md, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    wLabel: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.md },
    wName: { fontFamily: typography.fontFamily.black, fontSize: 12, color: colors.text.onDark },
    wWears: { fontFamily: typography.fontFamily.semiBold, fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
    sectionLabel: { fontFamily: typography.fontFamily.black, fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.lg },
    grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    savedCardInner: {
        position: 'relative',
        borderRadius: radii.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    savedHeart: { position: 'absolute', top: spacing.md, right: spacing.md, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' },
    savedLabel: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.md },
    savedName: { fontFamily: typography.fontFamily.black, fontSize: 12, color: colors.text.onDark },
    savedMeta: { fontFamily: typography.fontFamily.semiBold, fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
    dashedCard: {
        borderRadius: radii.xl,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        overflow: 'hidden',
    },
    dashedInner: {
        flex: 1,
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        padding: spacing.md,
    },
    dashedText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
    },
    wishlistHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    wishlistTotal: { fontFamily: typography.fontFamily.semiBold, fontSize: 12, color: 'rgba(255,255,255,0.5)' },
    list: { gap: spacing.md },
    wishRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border.dark, backgroundColor: 'rgba(255,255,255,0.05)' },
    wishThumb: { width: 64, height: 64, borderRadius: radii.md },
    wishName: { fontFamily: typography.fontFamily.black, fontSize: 14, color: colors.text.onDark },
    wishBrand: { fontFamily: typography.fontFamily.semiBold, fontSize: 12, color: 'rgba(255,255,255,0.5)' },
    wishPrice: { fontFamily: typography.fontFamily.black, fontSize: 14, color: '#F2B872', marginTop: 2 },
    subTabs: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
    subTab: { flex: 1, paddingVertical: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border.dark, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
    subTabActive: { backgroundColor: colors.text.onDark, borderColor: colors.text.onDark },
    subTabText: { fontFamily: typography.fontFamily.black, fontSize: 12, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 },
    subTabTextActive: { color: colors.text.primary },
    listingCardInner: {
        position: 'relative',
        borderRadius: radii.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    statusBadge: { position: 'absolute', top: spacing.md, left: spacing.md, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.md },
    statusText: { fontFamily: typography.fontFamily.black, fontSize: 9, color: colors.text.primary, textTransform: 'uppercase' },
    moveBtn: { position: 'absolute', top: spacing.md, right: spacing.md, width: 28, height: 28, borderRadius: radii.md, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    listingLabel: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.md },
    listingName: { fontFamily: typography.fontFamily.black, fontSize: 12, color: colors.text.onDark },
    listingPrice: { fontFamily: typography.fontFamily.black, fontSize: 13, color: colors.accent.primary },
    listingViews: { fontFamily: typography.fontFamily.semiBold, fontSize: 10, color: 'rgba(255,255,255,0.5)' },
    purchasesList: { gap: spacing.md },
    toShipBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: 'rgba(242,184,114,0.35)',
        backgroundColor: 'rgba(242,184,114,0.12)',
    },
    toShipIcon: {
        width: 32,
        height: 32,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(242,184,114,0.2)',
    },
    toShipText: {
        flex: 1,
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.accent.warm,
        textTransform: 'uppercase',
    },
    purchasesSub: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: spacing.sm,
    },
    orderRow: {
        padding: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: colors.background.cardDark,
        gap: spacing.md,
    },
    orderHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    orderId: { fontFamily: typography.fontFamily.black, fontSize: 14, color: colors.text.onDark },
    orderDate: { fontFamily: typography.fontFamily.semiBold, fontSize: 12, color: colors.text.onDarkMuted, marginTop: 2 },
    thumbRow: { flexDirection: 'row', gap: spacing.sm },
    orderThumb: { width: 48, height: 48, borderRadius: radii.md },
    orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderTotal: { fontFamily: typography.fontFamily.black, fontSize: 16, color: colors.text.onDark },
    viewAllLink: { alignItems: 'center', paddingVertical: spacing.md },
    viewAllRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: spacing.sm,
        marginBottom: spacing.md,
    },
    viewAllLinkText: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 13,
        color: colors.accent.primary,
    },
    photoGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    coverPhoto: { flex: 2, aspectRatio: 2, borderRadius: radii.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.03)' },
    coverPhotoText: { fontFamily: typography.fontFamily.black, fontSize: 10, color: 'rgba(255,255,255,0.4)' },
    subPhoto: { flex: 1, aspectRatio: 1, borderRadius: radii.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.02)' },
    addFieldLabel: { fontFamily: typography.fontFamily.black, fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.md },
    addInput: { borderWidth: 1, borderColor: colors.border.dark, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: radii.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontFamily: typography.fontFamily.semiBold, fontSize: 14, color: colors.text.onDark },
    addTextArea: { minHeight: 88, paddingTop: spacing.md },
    addSubmit: { marginTop: spacing.xl },
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

export default MeScreen;
