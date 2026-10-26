import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SellStackParamList } from '../navigation/types';
import { TabScreenLayout } from '../components/shell/TabScreenLayout';
import { SellForm, wardrobeToSellValues } from '../components/sell/SellForm';
import { PayoutPromptSheet } from '../components/sell/PayoutPromptSheet';
import { getWardrobeItemSync } from '../repositories/wardrobeRepository';
import { createListingFromSellForm } from '../lib/createListing';
import { sellerHasPayoutDetails } from '../lib/sellerHasPayoutDetails';
import { useRootNavigation } from '../navigation/useRootNavigation';
import { colors, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<SellStackParamList, 'SellMain'>;

const SellScreen: React.FC<Props> = ({ navigation, route }) => {
    const rootNav = useRootNavigation();
    const wardrobeItemId = route.params?.wardrobeItemId;
    const [payoutListingId, setPayoutListingId] = useState<string | null>(null);

    const initialValues = useMemo(() => {
        if (!wardrobeItemId) return undefined;
        const item = getWardrobeItemSync(wardrobeItemId);
        return wardrobeToSellValues(item);
    }, [wardrobeItemId]);

    const goToConfirmation = (listingId: string) => {
        navigation.navigate('ListingConfirmation', { listingId });
    };

    const handleSubmit = async (values: Parameters<typeof createListingFromSellForm>[0]) => {
        const listing = await createListingFromSellForm(values, wardrobeItemId);
        const hasPayout = await sellerHasPayoutDetails();
        if (!hasPayout) {
            setPayoutListingId(listing.id);
            return;
        }
        goToConfirmation(listing.id);
    };

    return (
        <TabScreenLayout>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>LIST AN ITEM</Text>
                    <Text style={styles.subtitle}>Reach thousands of buyers on Luku</Text>
                </View>
                <SellForm
                    initialValues={initialValues}
                    wardrobeItemId={wardrobeItemId}
                    showDraft={false}
                    onSubmit={(values) => {
                        void handleSubmit(values);
                    }}
                />
            </ScrollView>
            <PayoutPromptSheet
                visible={payoutListingId !== null}
                onSkip={() => {
                    const listingId = payoutListingId;
                    setPayoutListingId(null);
                    if (listingId) goToConfirmation(listingId);
                }}
                onAddDetails={() => {
                    setPayoutListingId(null);
                    rootNav.navigate('MainTabs', {
                        screen: 'Me',
                        params: { screen: 'PayoutDetails', initial: false },
                    });
                }}
            />
        </TabScreenLayout>
    );
};

const styles = StyleSheet.create({
    header: { paddingHorizontal: spacing.page, paddingTop: spacing.lg },
    title: {
        fontFamily: typography.fontFamily.black,
        fontSize: 34,
        color: colors.text.onDark,
        letterSpacing: -1,
    },
    subtitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 13,
        color: colors.text.onDarkSubtle,
    },
});

export default SellScreen;
