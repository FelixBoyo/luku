import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRightLeft, Edit2, Pause, Trash2 } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/shell/ScreenHeader';
import { BottomSheet } from '../components/common/BottomSheet';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import type { Listing, ListingStatus } from '../types/domain/listing';
import { formatKES } from '../lib/format';
import { repositories } from '../repositories';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ListingDetail'>;

type ActionInProgress = 'sold' | 'pause' | 'save' | 'delete' | 'move' | null;

const STATUSES: ListingStatus[] = ['Active', 'Draft', 'Sold'];

const formatListedDate = (iso?: string) => {
    if (!iso) return 'Unknown';
    return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const ListingDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [showEdit, setShowEdit] = useState(false);
    const [showMoveConfirm, setShowMoveConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPrice, setEditPrice] = useState('');
    const [editStatus, setEditStatus] = useState<ListingStatus>('Active');
    const [editCategory, setEditCategory] = useState('');
    const [editSize, setEditSize] = useState('');
    const [editCondition, setEditCondition] = useState('');
    const [actionInProgress, setActionInProgress] = useState<ActionInProgress>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const item = await repositories.listings.getById(route.params.listingId);
        setListing(item);
        if (item) {
            setEditName(item.name);
            setEditPrice(String(item.price));
            setEditStatus(item.status);
            setEditCategory(item.category ?? '');
            setEditSize(item.size ?? '');
            setEditCondition(item.condition ?? '');
        }
        setLoading(false);
    }, [route.params.listingId]);

    useEffect(() => {
        load();
    }, [load]);

    const handleSaveEdit = async () => {
        if (!listing || actionInProgress) return;
        setActionInProgress('save');
        try {
            const updated = await repositories.listings.update(listing.id, {
                name: editName.trim() || listing.name,
                price: Number(editPrice) || listing.price,
                status: editStatus,
                category: editCategory.trim() || listing.category,
                size: editSize.trim() || listing.size,
                condition: editCondition.trim() || listing.condition,
            });
            setListing(updated);
            setShowEdit(false);
        } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save changes');
        } finally {
            setActionInProgress(null);
        }
    };

    const handleMarkSold = async () => {
        if (!listing || actionInProgress) return;
        setActionInProgress('sold');
        try {
            const updated = await repositories.listings.update(listing.id, { status: 'Sold' });
            setListing(updated);
        } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to mark as sold');
        } finally {
            setActionInProgress(null);
        }
    };

    const handlePause = async () => {
        if (!listing || actionInProgress) return;
        setActionInProgress('pause');
        try {
            const updated = await repositories.listings.update(listing.id, { status: 'Draft' });
            setListing(updated);
        } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to pause listing');
        } finally {
            setActionInProgress(null);
        }
    };

    const handleResume = async () => {
        if (!listing || actionInProgress) return;
        setActionInProgress('pause');
        try {
            const updated = await repositories.listings.update(listing.id, { status: 'Active' });
            setListing(updated);
        } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to resume listing');
        } finally {
            setActionInProgress(null);
        }
    };

    const handleDelete = async () => {
        if (!listing || actionInProgress) return;
        if (listing.status === 'Sold') {
            Alert.alert('Cannot delete', 'Sold listings cannot be deleted, as they represent a completed sale.');
            return;
        }
        setActionInProgress('delete');
        try {
            await repositories.listings.remove(listing.id);
            setShowDeleteConfirm(false);
            navigation.goBack();
        } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete listing');
            setActionInProgress(null);
        }
    };

    const handleMoveToWardrobe = async () => {
        if (!listing || actionInProgress) return;
        setActionInProgress('move');
        try {
            if (!listing.wardrobeItemId) {
                // No original wardrobe item exists for this listing — recreate one
                await repositories.wardrobe.create({
                    name: listing.name,
                    category: listing.category || 'Tops',
                    brand: 'No Brand',
                    color: '',
                    size: listing.size || 'M',
                    condition: listing.condition || 'Gently Used',
                    purchasePrice: listing.price,
                    imageUrl: listing.imageUrl,
                    images: [listing.imageUrl],
                    source: 'manual',
                });
            }
            // If wardrobeItemId exists, the original item was never deleted when
            // listed — un-listing just means removing the listing record itself.
            await repositories.listings.remove(listing.id);
            setShowMoveConfirm(false);
            navigation.navigate('MainTabs', {
                screen: 'Me',
                params: { screen: 'MeMain' },
            });
        } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to move item to wardrobe');
            setActionInProgress(null);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Listing" onBack={() => navigation.goBack()} />
                <View style={styles.loading}>
                    <ActivityIndicator color={colors.accent.primary} />
                </View>
            </View>
        );
    }

    if (!listing) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Listing" onBack={() => navigation.goBack()} />
                <EmptyState title="Listing not found" description="This listing may have been removed" />
            </View>
        );
    }

    const statusColor =
        listing.status === 'Draft'
            ? 'rgba(242,184,114,0.85)'
            : listing.status === 'Sold'
              ? 'rgba(255,255,255,0.35)'
              : 'rgba(72,205,138,0.85)';

    const anyActionRunning = actionInProgress !== null;

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Listing"
                onBack={() => navigation.goBack()}
                right={
                    <Pressable
                        style={[styles.headerBtn, anyActionRunning && styles.btnDisabled]}
                        onPress={() => setShowEdit(true)}
                        disabled={anyActionRunning}
                    >
                        <Edit2 size={18} color={colors.text.onDark} strokeWidth={2.5} />
                    </Pressable>
                }
            />
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <Image source={{ uri: listing.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={StyleSheet.absoluteFill} />
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.statusText}>{listing.status}</Text>
                    </View>
                    <View style={styles.heroLabel}>
                        <Text style={styles.heroName}>{listing.name}</Text>
                        <Text style={styles.heroPrice}>{formatKES(listing.price)}</Text>
                        {listing.views > 0 ? (
                            <Text style={styles.heroMeta}>{listing.views} views</Text>
                        ) : null}
                    </View>
                </View>

                <View style={styles.body}>
                    <View style={styles.metaCard}>
                        {listing.category ? (
                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>Category</Text>
                                <Text style={styles.metaValue}>{listing.category}</Text>
                            </View>
                        ) : null}
                        {listing.size ? (
                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>Size</Text>
                                <Text style={styles.metaValue}>{listing.size}</Text>
                            </View>
                        ) : null}
                        {listing.condition ? (
                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>Condition</Text>
                                <Text style={styles.metaValue}>{listing.condition}</Text>
                            </View>
                        ) : null}
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Listed</Text>
                            <Text style={styles.metaValue}>{formatListedDate(listing.createdAt)}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Views</Text>
                            <Text style={styles.metaValue}>{listing.views}</Text>
                        </View>
                    </View>

                    {listing.wardrobeItemId ? (
                        <Pressable
                            style={styles.linkRow}
                            onPress={() =>
                                navigation.navigate('WardrobeItemDetail', {
                                    itemId: listing.wardrobeItemId!,
                                })
                            }
                        >
                            <Text style={styles.linkText}>View in wardrobe</Text>
                        </Pressable>
                    ) : null}

                    {listing.status === 'Active' ? (
                        <>
                            <Pressable
                                style={[styles.actionBtn, anyActionRunning && styles.btnDisabled]}
                                onPress={() => void handleMarkSold()}
                                disabled={anyActionRunning}
                            >
                                {actionInProgress === 'sold' ? (
                                    <ActivityIndicator size="small" color={colors.accent.warm} />
                                ) : null}
                                <Text style={styles.actionText}>
                                    {actionInProgress === 'sold' ? 'Marking as sold…' : 'Mark as sold'}
                                </Text>
                            </Pressable>
                            <Pressable
                                style={[styles.actionBtn, styles.actionBtnMuted, anyActionRunning && styles.btnDisabled]}
                                onPress={() => void handlePause()}
                                disabled={anyActionRunning}
                            >
                                {actionInProgress === 'pause' ? (
                                    <ActivityIndicator size="small" color={colors.text.onDarkMuted} />
                                ) : (
                                    <Pause size={16} color={colors.text.onDarkMuted} strokeWidth={2.5} />
                                )}
                                <Text style={styles.actionTextMuted}>
                                    {actionInProgress === 'pause' ? 'Pausing…' : 'Pause listing'}
                                </Text>
                            </Pressable>
                        </>
                    ) : null}

                    {listing.status === 'Draft' ? (
                        <Pressable
                            style={[styles.actionBtn, anyActionRunning && styles.btnDisabled]}
                            onPress={() => void handleResume()}
                            disabled={anyActionRunning}
                        >
                            {actionInProgress === 'pause' ? (
                                <ActivityIndicator size="small" color={colors.accent.warm} />
                            ) : null}
                            <Text style={styles.actionText}>
                                {actionInProgress === 'pause' ? 'Resuming…' : 'Resume listing'}
                            </Text>
                        </Pressable>
                    ) : null}

                    {listing.status !== 'Sold' ? (
                        <Pressable
                            style={[styles.actionBtn, anyActionRunning && styles.btnDisabled]}
                            onPress={() => setShowMoveConfirm(true)}
                            disabled={anyActionRunning}
                        >
                            <ArrowRightLeft size={16} color={colors.accent.warm} strokeWidth={2.5} />
                            <Text style={styles.actionText}>Return to wardrobe</Text>
                        </Pressable>
                    ) : null}
                    {listing.status !== 'Sold' ? (
                        <Pressable
                            style={[styles.actionBtn, styles.actionBtnDanger, anyActionRunning && styles.btnDisabled]}
                            onPress={() => setShowDeleteConfirm(true)}
                            disabled={anyActionRunning}
                        >
                            <Trash2 size={16} color="#F87171" strokeWidth={2.5} />
                            <Text style={styles.actionTextDanger}>Delete listing</Text>
                        </Pressable>
                    ) : null}
                </View>
            </ScrollView>

            <BottomSheet visible={showEdit} onClose={() => setShowEdit(false)} title="Edit Listing">
                <Text style={styles.fieldLabel}>Name</Text>
                <TextInput
                    style={styles.fieldInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholderTextColor={colors.text.onDarkSubtle}
                    editable={actionInProgress !== 'save'}
                />
                <Text style={styles.fieldLabel}>Price (KES)</Text>
                <TextInput
                    style={styles.fieldInput}
                    value={editPrice}
                    onChangeText={setEditPrice}
                    keyboardType="numeric"
                    placeholderTextColor={colors.text.onDarkSubtle}
                    editable={actionInProgress !== 'save'}
                />
                <Text style={styles.fieldLabel}>Category</Text>
                <TextInput
                    style={styles.fieldInput}
                    value={editCategory}
                    onChangeText={setEditCategory}
                    placeholderTextColor={colors.text.onDarkSubtle}
                    editable={actionInProgress !== 'save'}
                />
                <Text style={styles.fieldLabel}>Size</Text>
                <TextInput
                    style={styles.fieldInput}
                    value={editSize}
                    onChangeText={setEditSize}
                    placeholderTextColor={colors.text.onDarkSubtle}
                    editable={actionInProgress !== 'save'}
                />
                <Text style={styles.fieldLabel}>Condition</Text>
                <TextInput
                    style={styles.fieldInput}
                    value={editCondition}
                    onChangeText={setEditCondition}
                    placeholderTextColor={colors.text.onDarkSubtle}
                    editable={actionInProgress !== 'save'}
                />
                <Text style={styles.fieldLabel}>Status</Text>
                <View style={styles.chipRow}>
                    {STATUSES.map((s) => (
                        <Pressable
                            key={s}
                            style={[styles.chip, editStatus === s && styles.chipActive]}
                            onPress={() => setEditStatus(s)}
                            disabled={actionInProgress === 'save'}
                        >
                            <Text style={[styles.chipText, editStatus === s && styles.chipTextActive]}>
                                {s}
                            </Text>
                        </Pressable>
                    ))}
                </View>
                <Pressable
                    style={[
                        styles.saveBtn,
                        { marginBottom: insets.bottom },
                        actionInProgress === 'save' && styles.btnDisabled,
                    ]}
                    onPress={() => void handleSaveEdit()}
                    disabled={actionInProgress === 'save'}
                >
                    {actionInProgress === 'save' ? (
                        <ActivityIndicator size="small" color={colors.text.primary} />
                    ) : (
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                    )}
                </Pressable>
            </BottomSheet>

            <ConfirmDialog
                visible={showMoveConfirm}
                title="Return to wardrobe?"
                description={`Move "${listing.name}" back to your wardrobe and remove this listing?`}
                confirmLabel="Move"
                destructive
                loading={actionInProgress === 'move'}
                onCancel={() => setShowMoveConfirm(false)}
                onConfirm={() => void handleMoveToWardrobe()}
            />

            <ConfirmDialog
                visible={showDeleteConfirm}
                title="Delete listing?"
                description={`Permanently remove "${listing.name}" from your listings?`}
                confirmLabel="Delete"
                destructive
                loading={actionInProgress === 'delete'}
                onCancel={() => setShowDeleteConfirm(false)}
                onConfirm={() => void handleDelete()}
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
    btnDisabled: { opacity: 0.5 },
    hero: { height: 380, position: 'relative' },
    statusBadge: {
        position: 'absolute',
        top: spacing.lg,
        left: spacing.lg,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radii.md,
    },
    statusText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 9,
        color: colors.text.primary,
        textTransform: 'uppercase',
    },
    heroLabel: { position: 'absolute', bottom: spacing.xl, left: spacing.page, right: spacing.page },
    heroName: {
        fontFamily: typography.fontFamily.black,
        fontSize: 28,
        color: colors.text.onDark,
    },
    heroPrice: {
        fontFamily: typography.fontFamily.black,
        fontSize: 20,
        color: colors.accent.primary,
        marginTop: 4,
    },
    heroMeta: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        marginTop: 4,
    },
    body: { padding: spacing.page, paddingBottom: spacing.xxl, gap: spacing.md },
    metaCard: {
        padding: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
        gap: spacing.sm,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metaLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDarkSubtle,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    metaValue: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDark,
    },
    linkRow: {
        padding: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    linkText: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 14,
        color: colors.accent.primary,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: 'rgba(242,184,114,0.35)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    actionBtnMuted: {
        borderColor: colors.border.dark,
    },
    actionBtnDanger: {
        borderColor: 'rgba(239,68,68,0.35)',
        backgroundColor: 'rgba(239,68,68,0.08)',
    },
    actionText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.accent.warm,
        textTransform: 'uppercase',
    },
    actionTextMuted: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.text.onDarkMuted,
        textTransform: 'uppercase',
    },
    actionTextDanger: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: '#F87171',
        textTransform: 'uppercase',
    },
    fieldLabel: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.onDarkSubtle,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    fieldInput: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderWidth: 1,
        borderColor: colors.border.dark,
        borderRadius: radii.lg,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDark,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
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
    saveBtn: {
        marginTop: spacing.xl,
        paddingVertical: spacing.lg,
        borderRadius: radii.lg,
        backgroundColor: colors.accent.primary,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    saveBtnText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.primary,
        textTransform: 'uppercase',
    },
});

export default ListingDetailScreen;