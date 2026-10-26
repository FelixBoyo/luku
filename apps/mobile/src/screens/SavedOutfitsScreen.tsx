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
import { Heart, Plus, Sparkles } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CollectionHeader } from '../components/shell/CollectionHeader';
import { CollectionSearch } from '../components/common/CollectionSearch';
import { PillTabs } from '../components/common/PillTabs';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { useAppState } from '../context/AppStateContext';
import type { Outfit } from '../types/domain/outfit';
import { useRootNavigation } from '../navigation/useRootNavigation';
import type { MeStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<MeStackParamList, 'SavedOutfits'>;

const { width } = Dimensions.get('window');
const cardWidth = (width - spacing.page * 2 - spacing.md) / 2;
const cardHeight = cardWidth * (4 / 3);

const TABS = [
    { id: 'created', label: 'Created' },
    { id: 'inspirations', label: 'Inspirations' },
] as const;

type Tab = (typeof TABS)[number]['id'];

const SavedOutfitsScreen: React.FC<Props> = ({ navigation, route }) => {
    const rootNav = useRootNavigation();
    const [tab, setTab] = useState<Tab>(route.params?.initialTab ?? 'created');
    const { createdOutfits, inspirationOutfits, refreshOutfits, deleteOutfit } = useAppState();
    const [query, setQuery] = useState('');
    const [unsaveTarget, setUnsaveTarget] = useState<Outfit | null>(null);

    useFocusEffect(
        useCallback(() => {
            void refreshOutfits();
        }, [refreshOutfits]),
    );

    const outfits = tab === 'created' ? createdOutfits : inspirationOutfits;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return outfits.filter(
            (o) =>
                !q ||
                o.name.toLowerCase().includes(q) ||
                o.occasion.toLowerCase().includes(q),
        );
    }, [outfits, query]);

    const totalCount = createdOutfits.length + inspirationOutfits.length;

    return (
        <View style={styles.container}>
            <CollectionHeader
                title="SAVED OUTFITS"
                subtitle={`${totalCount} outfits · ${createdOutfits.length} created · ${inspirationOutfits.length} saved`}
                onBack={() => navigation.goBack()}
                search={
                    <CollectionSearch
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Search outfits…"
                    />
                }
            />
            <PillTabs tabs={[...TABS]} activeId={tab} onChange={(id) => setTab(id as Tab)} />

            {filtered.length === 0 && tab === 'inspirations' ? (
                <EmptyState
                    icon={Sparkles}
                    title={query ? 'No matches' : 'No inspirations yet'}
                    description="Save outfits from Home or Stylist to build your board"
                />
            ) : filtered.length === 0 && tab === 'created' && !query ? (
                <View style={styles.emptyCreated}>
                    <EmptyState
                        icon={Sparkles}
                        title="No outfits yet"
                        description="Create your first outfit to save looks from your wardrobe"
                        actionLabel="New Outfit"
                        onAction={() => rootNav.navigate('CreateOutfit')}
                    />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.grid}>
                    {tab === 'created' ? (
                        <Pressable onPress={() => rootNav.navigate('CreateOutfit')}>
                            <View style={[styles.dashedCard, { width: cardWidth, height: cardHeight }]}>
                                <Plus color="rgba(255,255,255,0.35)" size={22} strokeWidth={2} />
                                <Text style={styles.dashedText}>New Outfit</Text>
                            </View>
                        </Pressable>
                    ) : null}
                    {filtered.map((o) => (
                        <Pressable
                            key={o.id}
                            onPress={() => rootNav.navigate('OutfitDetail', { outfitId: o.id })}
                        >
                            <View style={[styles.card, { width: cardWidth, height: cardHeight }]}>
                                <Image
                                    source={{ uri: o.coverImageUrl }}
                                    style={StyleSheet.absoluteFill}
                                    contentFit="cover"
                                />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.9)']}
                                    style={StyleSheet.absoluteFill}
                                />
                                {tab === 'inspirations' ? (
                                    <Pressable
                                        style={styles.heart}
                                        hitSlop={8}
                                        onPress={() => setUnsaveTarget(o)}
                                    >
                                        <Heart
                                            color={colors.accent.primary}
                                            fill={colors.accent.primary}
                                            size={16}
                                            strokeWidth={2.5}
                                        />
                                    </Pressable>
                                ) : null}
                                <View style={styles.label}>
                                    <Text style={styles.name}>{o.name}</Text>
                                    <Text style={styles.meta}>
                                        {o.pieces.length} pieces · {o.occasion}
                                    </Text>
                                </View>
                            </View>
                        </Pressable>
                    ))}
                </ScrollView>
            )}

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
                    if (unsaveTarget) await deleteOutfit(unsaveTarget.id);
                    setUnsaveTarget(null);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    emptyCreated: { flex: 1 },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: spacing.page,
        gap: spacing.md,
    },
    dashedCard: {
        borderRadius: radii.lg,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    dashedText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDarkMuted,
        textTransform: 'uppercase',
    },
    card: { borderRadius: radii.lg, overflow: 'hidden', position: 'relative' },
    heart: { position: 'absolute', top: spacing.sm, right: spacing.sm, zIndex: 2 },
    label: { position: 'absolute', bottom: spacing.md, left: spacing.md, right: spacing.md },
    name: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.onDark,
    },
    meta: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 10,
        color: colors.text.onDarkMuted,
        marginTop: 2,
    },
});

export default SavedOutfitsScreen;
