import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Shirt } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CollectionHeader } from '../components/shell/CollectionHeader';
import { CollectionSearch } from '../components/common/CollectionSearch';
import { EmptyState } from '../components/common/EmptyState';
import { useRootNavigation } from '../navigation/useRootNavigation';
import type { RootStackParamList } from '../navigation/types';
import type { WardrobePairing } from '../types/domain/wardrobePairing';
import { repositories } from '../repositories';
import { formatKES } from '../lib/format';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'WardrobePairings'>;

const WardrobePairingsScreen: React.FC<Props> = ({ navigation }) => {
    const rootNav = useRootNavigation();
    const [query, setQuery] = useState('');
    const [pairings, setPairings] = useState<WardrobePairing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        repositories.wardrobePairings
            .list()
            .then(setPairings)
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return pairings;
        return pairings.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.pairs.toLowerCase().includes(q),
        );
    }, [pairings, query]);

    return (
        <View style={styles.container}>
            <CollectionHeader
                title="PAIR WITH YOUR WARDROBE"
                subtitle="Products that match your closet"
                onBack={() => navigation.goBack()}
                search={
                    <CollectionSearch
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Search pairings…"
                    />
                }
            />
            {loading ? null : filtered.length === 0 ? (
                <EmptyState
                    icon={Shirt}
                    title={query ? 'No matches' : 'No pairings yet'}
                    description={
                        query
                            ? 'Try a different search term'
                            : 'Wardrobe pairing suggestions will appear here when available'
                    }
                />
            ) : (
                <ScrollView
                    contentContainerStyle={styles.grid}
                    showsVerticalScrollIndicator={false}
                >
                    {filtered.map((item) => (
                        <Pressable
                            key={item.productId}
                            style={styles.card}
                            onPress={() =>
                                rootNav.navigate('ProductDetail', { productId: item.productId })
                            }
                        >
                            <View style={styles.imageWrap}>
                                <Image
                                    source={{ uri: item.image }}
                                    style={StyleSheet.absoluteFill}
                                    contentFit="cover"
                                />
                                <LinearGradient
                                    colors={[colors.accent.warm, colors.accent.terracotta]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.matchBadge}
                                >
                                    <Text style={styles.matchText}>{item.match}%</Text>
                                </LinearGradient>
                            </View>
                            <View style={styles.body}>
                                <Text style={styles.pairsLabel}>with your {item.pairs}</Text>
                                <Text style={styles.name} numberOfLines={1}>
                                    {item.name}
                                </Text>
                                <Text style={styles.price}>{formatKES(item.price)}</Text>
                            </View>
                        </Pressable>
                    ))}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        padding: spacing.page,
        paddingBottom: spacing.xxl,
    },
    card: {
        width: '47%',
        borderRadius: radii.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: colors.background.cardDark,
    },
    imageWrap: { aspectRatio: 3 / 4, position: 'relative' },
    matchBadge: {
        position: 'absolute',
        top: spacing.sm,
        left: spacing.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: radii.pill,
    },
    matchText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 10,
        color: colors.text.primary,
    },
    body: { padding: spacing.md },
    pairsLabel: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 10,
        color: colors.text.onDarkMuted,
        marginBottom: 2,
    },
    name: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.text.onDark,
    },
    price: {
        fontFamily: typography.fontFamily.black,
        fontSize: 13,
        color: colors.accent.warm,
        marginTop: 4,
    },
});

export default WardrobePairingsScreen;
