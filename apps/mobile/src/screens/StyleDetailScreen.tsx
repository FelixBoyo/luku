import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ScreenHeader } from '../components/shell/ScreenHeader';
import { EmptyState } from '../components/common/EmptyState';
import { MasonryGrid } from '../components/common/MasonryGrid';
import { DiscoverProductCard } from '../components/marketplace/DiscoverProductCard';
import { useAppState } from '../context/AppStateContext';
import { useActiveProducts } from '../hooks/useProducts';
import { useRootNavigation } from '../navigation/useRootNavigation';
import { repositories } from '../repositories';
import type { Style } from '../types/domain/discover';
import type { Product } from '../types/domain/product';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'StyleDetail'>;

type FeedItem = Product & { feedKey: string };

const StyleDetailScreen: React.FC<Props> = ({ navigation, route }) => {
    const rootNav = useRootNavigation();
    const { toggleWishlist, isWishlisted } = useAppState();
    const [style, setStyle] = useState<Style | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        repositories.discoverCatalog
            .getStyle(route.params.styleId)
            .then(setStyle)
            .finally(() => setLoading(false));
    }, [route.params.styleId]);

    const query = React.useMemo(() => style ? { style: style.name } : undefined, [style]);
    const { products } = useActiveProducts(query);

    const feed: FeedItem[] = products.map((p, i) => ({
        ...p,
        feedKey: `${p.id}-style-${i}`,
    }));

    if (loading) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Style" onBack={() => navigation.goBack()} />
            </View>
        );
    }

    if (!style) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Style" onBack={() => navigation.goBack()} />
                <EmptyState
                    icon={Sparkles}
                    title="Style not found"
                    description="This style collection is not available"
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader title={style.name} onBack={() => navigation.goBack()} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <View style={styles.hero}>
                    <Image source={{ uri: style.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={StyleSheet.absoluteFill} />
                    <View style={styles.heroInfo}>
                        <Text style={styles.name}>{style.name}</Text>
                        <Text style={styles.tagline}>{style.tagline}</Text>
                        <Text style={styles.followers}>{style.followers} following</Text>
                    </View>
                </View>

                <Text style={styles.description}>{style.description}</Text>

                <View style={styles.chipWrap}>
                    {style.keywords.map((kw) => (
                        <View key={kw} style={styles.chip}>
                            <Text style={styles.chipText}>{kw}</Text>
                        </View>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>Curated picks</Text>
                {feed.length === 0 ? (
                    <EmptyState
                        title="No items yet"
                        description="Products for this style will appear here"
                    />
                ) : (
                    <View style={styles.feed}>
                        <MasonryGrid
                            items={feed}
                            keyExtractor={(item) => item.feedKey}
                            renderItem={(item, index) => (
                                <DiscoverProductCard
                                    product={item}
                                    index={index}
                                    onPress={() =>
                                        rootNav.navigate('ProductDetail', { productId: item.id })
                                    }
                                    onWishlist={() => void toggleWishlist(item.id)}
                                    wishlisted={isWishlisted(item.id)}
                                />
                            )}
                        />
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    scroll: { paddingBottom: spacing.xxl },
    hero: { height: 240, justifyContent: 'flex-end' },
    heroInfo: { padding: spacing.page },
    name: {
        fontFamily: typography.fontFamily.black,
        fontSize: 28,
        color: colors.text.onDark,
    },
    tagline: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDarkMuted,
        marginTop: 4,
    },
    followers: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkSubtle,
        marginTop: spacing.sm,
    },
    description: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDarkMuted,
        lineHeight: 20,
        paddingHorizontal: spacing.page,
        marginTop: spacing.lg,
    },
    chipWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        paddingHorizontal: spacing.page,
        marginTop: spacing.lg,
    },
    chip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: colors.border.dark,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    chipText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDarkMuted,
    },
    sectionTitle: {
        fontFamily: typography.fontFamily.black,
        fontSize: 11,
        color: colors.text.onDark,
        textTransform: 'uppercase',
        letterSpacing: 2,
        paddingHorizontal: spacing.page,
        marginTop: spacing.xl,
        marginBottom: spacing.lg,
    },
    feed: { paddingHorizontal: spacing.page },
});

export default StyleDetailScreen;
