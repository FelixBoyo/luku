import React, { useCallback, useMemo, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Bookmark } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CollectionHeader } from '../components/shell/CollectionHeader';
import { CollectionSearch } from '../components/common/CollectionSearch';
import { ProductCard } from '../components/marketplace/ProductCard';
import { EmptyState } from '../components/common/EmptyState';
import { useAppState } from '../context/AppStateContext';
import { wishlistItemToProduct } from '../lib/wishlistProducts';
import { formatKES } from '../lib/format';
import { useRootNavigation } from '../navigation/useRootNavigation';
import type { MeStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme/tokens';

type Props = NativeStackScreenProps<MeStackParamList, 'Wishlist'>;

const { width } = Dimensions.get('window');

const WishlistScreen: React.FC<Props> = ({ navigation }) => {
    const rootNav = useRootNavigation();
    const { wishlistItems, refreshWishlist } = useAppState();
    const [query, setQuery] = useState('');

    useFocusEffect(
        useCallback(() => {
            void refreshWishlist();
        }, [refreshWishlist]),
    );

    const products = useMemo(() => {
        const q = query.trim().toLowerCase();
        return wishlistItems
            .map(wishlistItemToProduct)
            .filter(
                (p) =>
                    !q ||
                    p.name.toLowerCase().includes(q) ||
                    p.brand.toLowerCase().includes(q),
            );
    }, [wishlistItems, query]);

    const totalValue = wishlistItems.reduce((s, i) => s + i.price, 0);

    return (
        <View style={styles.container}>
            <CollectionHeader
                title="WISHLIST"
                subtitle={`${wishlistItems.length} items · ${formatKES(totalValue)}`}
                onBack={() => navigation.goBack()}
                search={
                    <CollectionSearch
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Search wishlist…"
                    />
                }
            />
            {products.length === 0 ? (
                <EmptyState
                    icon={Bookmark}
                    title={query ? 'No matches' : 'Your wishlist is empty'}
                    description={
                        query
                            ? 'Try a different search term'
                            : 'Save items you love from the marketplace'
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

export default WishlistScreen;
