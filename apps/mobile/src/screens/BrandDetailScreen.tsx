import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, Store } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ScreenHeader } from '../components/shell/ScreenHeader';
import { EmptyState } from '../components/common/EmptyState';
import { ProductCard } from '../components/marketplace/ProductCard';
import { useActiveProducts } from '../hooks/useProducts';
import { useRootNavigation } from '../navigation/useRootNavigation';
import { repositories } from '../repositories';
import type { Brand } from '../types/domain/discover';
import { colors, radii, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'BrandDetail'>;

const BrandDetailScreen: React.FC<Props> = ({ navigation, route }) => {
    const rootNav = useRootNavigation();
    const [brand, setBrand] = useState<Brand | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        repositories.discoverCatalog
            .getBrand(route.params.brandId)
            .then(setBrand)
            .finally(() => setLoading(false));
    }, [route.params.brandId]);

    const query = React.useMemo(() => brand ? { search: brand.name.split(' ')[0] } : undefined, [brand]);
    const { products: brandProducts } = useActiveProducts(query);

    if (loading) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Brand" onBack={() => navigation.goBack()} />
            </View>
        );
    }

    if (!brand) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Brand" onBack={() => navigation.goBack()} />
                <EmptyState
                    icon={Store}
                    title="Brand not found"
                    description="This brand profile is not available"
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader title={brand.name} onBack={() => navigation.goBack()} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <View style={styles.hero}>
                    <Image source={{ uri: brand.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={StyleSheet.absoluteFill} />
                    <View style={styles.heroInfo}>
                        <View style={styles.logo}>
                            <Text style={styles.logoText}>{brand.logoText}</Text>
                        </View>
                        <View style={styles.flex}>
                            <View style={styles.nameRow}>
                                <Text style={styles.name}>{brand.name}</Text>
                                {brand.verified ? (
                                    <CheckCircle color={colors.accent.primary} size={16} strokeWidth={2.5} />
                                ) : null}
                            </View>
                            <Text style={styles.tagline}>{brand.tagline}</Text>
                            <Text style={styles.meta}>
                                {brand.followers} followers · {brand.productCount} products · {brand.rating}★
                            </Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.description}>{brand.description}</Text>

                <Text style={styles.sectionTitle}>Products</Text>
                {brandProducts.length === 0 ? (
                    <EmptyState
                        title="No products yet"
                        description="Check back soon for new arrivals from this brand"
                    />
                ) : (
                    <View style={styles.grid}>
                        {brandProducts.map((p) => (
                            <View key={p.id} style={styles.gridItem}>
                                <ProductCard
                                    product={p}
                                    onPress={() =>
                                        rootNav.navigate('ProductDetail', { productId: p.id })
                                    }
                                />
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    scroll: { paddingBottom: spacing.xxl },
    hero: { height: 220, justifyContent: 'flex-end' },
    heroInfo: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: spacing.md,
        padding: spacing.page,
    },
    logo: {
        width: 56,
        height: 56,
        borderRadius: radii.lg,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: colors.border.dark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoText: {
        fontFamily: typography.fontFamily.black,
        fontSize: 16,
        color: colors.text.onDark,
    },
    flex: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    name: {
        fontFamily: typography.fontFamily.black,
        fontSize: 20,
        color: colors.text.onDark,
    },
    tagline: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkMuted,
        marginTop: 2,
    },
    meta: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.text.onDarkSubtle,
        marginTop: 4,
    },
    description: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDarkMuted,
        lineHeight: 20,
        paddingHorizontal: spacing.page,
        marginTop: spacing.lg,
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
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        paddingHorizontal: spacing.page,
    },
    gridItem: { width: '47%' },
});

export default BrandDetailScreen;
