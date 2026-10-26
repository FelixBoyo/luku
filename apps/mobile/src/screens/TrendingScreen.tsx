import React, { useMemo, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CollectionHeader } from '../components/shell/CollectionHeader';
import { CollectionSearch } from '../components/common/CollectionSearch';
import { ProductCard } from '../components/marketplace/ProductCard';
import { EmptyState } from '../components/common/EmptyState';
import { ProductGridSkeleton } from '../components/skeletons';
import { useActiveProducts } from '../hooks/useProducts';
import { useRootNavigation } from '../navigation/useRootNavigation';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Trending'>;

const { width } = Dimensions.get('window');

const TrendingScreen: React.FC<Props> = ({ navigation }) => {
    const rootNav = useRootNavigation();
    const [query, setQuery] = useState('');
    const { products: catalogProducts, loading } = useActiveProducts();

    const products = useMemo(() => {
        const q = query.trim().toLowerCase();
        return catalogProducts
            .filter((p) => p.isTrending)
            .filter(
                (p) =>
                    !q ||
                    p.name.toLowerCase().includes(q) ||
                    p.brand.toLowerCase().includes(q),
            );
    }, [catalogProducts, query]);

    const trendingCount = catalogProducts.filter((p) => p.isTrending).length;

    return (
        <View style={styles.container}>
            <CollectionHeader
                title="TRENDING NOW"
                subtitle={`${trendingCount} popular picks`}
                onBack={() => navigation.goBack()}
                search={
                    <CollectionSearch
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Search products…"
                    />
                }
            />
            {loading ? (
                <ProductGridSkeleton />
            ) : products.length === 0 ? (
                <EmptyState
                    icon={TrendingUp}
                    title={query ? 'No matches' : 'Nothing trending yet'}
                    description={
                        query ? 'Try a different search term' : 'Check back soon for hot picks'
                    }
                />
            ) : (
                <ScrollView contentContainerStyle={styles.grid}>
                    {products.map((p) => (
                        <View key={p.id} style={styles.gridItem}>
                            <ProductCard
                                product={p}
                                onPress={() =>
                                    rootNav.navigate('ProductDetail', { productId: p.id })
                                }
                            />
                        </View>
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
        padding: spacing.page,
        gap: spacing.md,
    },
    gridItem: { width: (width - spacing.page * 2 - spacing.md) / 2 },
});

export default TrendingScreen;
