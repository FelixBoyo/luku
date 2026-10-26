import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CollectionHeader } from '../components/shell/CollectionHeader';
import { PillTabs } from '../components/common/PillTabs';
import { ListingsTabContent } from '../components/commerce/ListingsTabContent';
import { PurchasesTabContent } from '../components/commerce/PurchasesTabContent';
import { SalesTabContent } from '../components/commerce/SalesTabContent';
import { repositories } from '../repositories';
import { isToShipSale } from '../repositories/ordersRepository';
import type { MeStackParamList } from '../navigation/types';
import { colors } from '../theme/tokens';

type Props = NativeStackScreenProps<MeStackParamList, 'Commerce'>;

const TABS = [
    { id: 'listings', label: 'Listings' },
    { id: 'purchases', label: 'Purchases' },
    { id: 'sales', label: 'Sales' },
] as const;

type Tab = (typeof TABS)[number]['id'];

const CommerceScreen: React.FC<Props> = ({ navigation, route }) => {
    const [tab, setTab] = useState<Tab>(route.params?.initialTab ?? 'listings');
    const [listingCount, setListingCount] = useState(0);
    const [activeOrderCount, setActiveOrderCount] = useState(0);
    const [totalOrderCount, setTotalOrderCount] = useState(0);
    const [toShipCount, setToShipCount] = useState(0);

    const refreshCounts = useCallback(async () => {
        const [items, active, all, sales] = await Promise.all([
            repositories.listings.list(),
            repositories.orders.listActive(),
            repositories.orders.list(),
            repositories.orders.listSales(),
        ]);
        setListingCount(items.length);
        setActiveOrderCount(active.length);
        setTotalOrderCount(all.length);
        setToShipCount(sales.filter(isToShipSale).length);
    }, []);

    useFocusEffect(
        useCallback(() => {
            void refreshCounts();
        }, [refreshCounts]),
    );

    useEffect(() => {
        const next = route.params?.initialTab;
        if (next) {
            setTab(next);
        }
    }, [route.params?.initialTab]);

    return (
        <View style={styles.container}>
            <CollectionHeader
                title="COMMERCE"
                subtitle={`${listingCount} listings · ${activeOrderCount} active orders · ${toShipCount} to ship · ${totalOrderCount} purchases`}
                onBack={() => navigation.goBack()}
            />
            <PillTabs tabs={[...TABS]} activeId={tab} onChange={(id) => setTab(id as Tab)} />
            {tab === 'listings' ? (
                <ListingsTabContent showSearch />
            ) : tab === 'sales' ? (
                <SalesTabContent />
            ) : (
                <PurchasesTabContent />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
});

export default CommerceScreen;
