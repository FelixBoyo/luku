import React, { useCallback, useMemo, useState } from 'react';
import {
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Tag, Plus } from 'lucide-react-native';
import { CollectionSearch } from '../common/CollectionSearch';
import { FilterChips } from '../common/FilterChips';
import { EmptyState } from '../common/EmptyState';
import type { Listing, ListingStatus } from '../../types/domain/listing';
import { formatKES } from '../../lib/format';
import { repositories } from '../../repositories';
import { useRootNavigation } from '../../navigation/useRootNavigation';
import { colors, radii, spacing, typography } from '../../theme/tokens';

const { width } = Dimensions.get('window');
const cardWidth = (width - spacing.page * 2 - spacing.md) / 2;
const cardHeight = cardWidth * (4 / 3);

const STATUS_OPTIONS: Array<ListingStatus | 'All'> = ['All', 'Active', 'Draft', 'Sold'];

type Props = {
    showSearch?: boolean;
};

export const ListingsTabContent: React.FC<Props> = ({ showSearch = true }) => {
    const rootNav = useRootNavigation();
    const [listings, setListings] = useState<Listing[]>([]);
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<ListingStatus | 'All'>('All');

    const refresh = useCallback(async () => {
        const items = await repositories.listings.list();
        setListings(items);
    }, []);

    useFocusEffect(
        useCallback(() => {
            void refresh();
        }, [refresh]),
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return listings.filter((l) => {
            const matchesStatus = status === 'All' || l.status === status;
            const matchesSearch = !q || l.name.toLowerCase().includes(q);
            return matchesStatus && matchesSearch;
        });
    }, [listings, query, status]);

    return (
        <View style={styles.wrap}>
            {showSearch ? (
                <View style={styles.searchPad}>
                    <CollectionSearch
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Search listings…"
                    />
                </View>
            ) : null}
            <View style={styles.filterPad}>
                <FilterChips
                    scrollable
                    options={[...STATUS_OPTIONS]}
                    value={status}
                    onChange={(v) => setStatus(v as ListingStatus | 'All')}
                />
            </View>
            {filtered.length === 0 ? (
                <EmptyState
                    icon={Tag}
                    title={query || status !== 'All' ? 'No matches' : 'No listings yet'}
                    description="List items from your wardrobe or the Sell tab"
                />
            ) : (
                <ScrollView contentContainerStyle={styles.grid}>
                    <Pressable
                        onPress={() =>
                            rootNav.navigate('MainTabs', {
                                screen: 'Sell',
                                params: { screen: 'SellMain' },
                            })
                        }
                    >
                        <View style={[styles.newListingCard, { width: cardWidth, height: cardHeight }]}>
                            <View style={styles.newListingInner}>
                                <Plus color="rgba(255,255,255,0.35)" size={22} strokeWidth={2} />
                                <Text style={styles.newListingText}>New Listing</Text>
                            </View>
                        </View>
                    </Pressable>
                    {filtered.map((l) => (
                        <Pressable
                            key={l.id}
                            onPress={() => rootNav.navigate('ListingDetail', { listingId: l.id })}
                        >
                            <View style={[styles.card, { width: cardWidth, height: cardHeight }]}>
                                <Image
                                    source={{ uri: l.imageUrl }}
                                    style={StyleSheet.absoluteFill}
                                    contentFit="cover"
                                />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                                    style={StyleSheet.absoluteFill}
                                />
                                <View
                                    style={[
                                        styles.badge,
                                        {
                                            backgroundColor:
                                                l.status === 'Draft'
                                                    ? 'rgba(242,184,114,0.85)'
                                                    : l.status === 'Sold'
                                                      ? 'rgba(255,255,255,0.35)'
                                                      : 'rgba(72,205,138,0.85)',
                                        },
                                    ]}
                                >
                                    <Text style={styles.badgeText}>{l.status}</Text>
                                </View>
                                <View style={styles.label}>
                                    <Text style={styles.name}>{l.name}</Text>
                                    {l.price > 0 ? (
                                        <Text style={styles.price}>{formatKES(l.price)}</Text>
                                    ) : null}
                                </View>
                            </View>
                        </Pressable>
                    ))}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: { flex: 1 },
    searchPad: { paddingHorizontal: spacing.page, marginBottom: spacing.md },
    filterPad: { paddingLeft: spacing.page, marginBottom: spacing.md },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: spacing.page,
        gap: spacing.md,
    },
    card: { borderRadius: radii.lg, overflow: 'hidden', position: 'relative' },
    newListingCard: {
        borderRadius: radii.lg,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.25)',
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    newListingInner: { alignItems: 'center', gap: spacing.sm },
    newListingText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkMuted,
    },
    badge: {
        position: 'absolute',
        top: spacing.sm,
        left: spacing.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radii.md,
    },
    badgeText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 9,
        color: colors.text.primary,
        textTransform: 'uppercase',
    },
    label: { position: 'absolute', bottom: spacing.md, left: spacing.md, right: spacing.md },
    name: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.onDark,
    },
    price: {
        fontFamily: typography.fontFamily.black,
        fontSize: 12,
        color: colors.accent.primary,
        marginTop: 2,
    },
});
