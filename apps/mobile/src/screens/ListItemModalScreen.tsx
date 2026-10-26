import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../components/shell/ScreenHeader';
import { SellForm, wardrobeToSellValues } from '../components/sell/SellForm';
import { PayoutPromptSheet } from '../components/sell/PayoutPromptSheet';
import { repositories } from '../repositories';
import type { WardrobeItem } from '../types/domain/wardrobe';
import { useRootNavigation } from '../navigation/useRootNavigation';
import { createListingFromSellForm } from '../lib/createListing';
import { sellerHasPayoutDetails } from '../lib/sellerHasPayoutDetails';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ListItemModal'>;

const ListItemModalScreen: React.FC<Props> = ({ route, navigation }) => {
    const rootNav = useRootNavigation();
    const wardrobeItemId = route.params.wardrobeItemId;

    const [item, setItem] = useState<WardrobeItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        repositories.wardrobe
            .getById(wardrobeItemId)
            .then((found) => {
                if (active) setItem(found);
            })
            .catch(() => {
                if (active) setItem(null);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [wardrobeItemId]);

    const [submitting, setSubmitting] = useState(false);
    const [payoutListingId, setPayoutListingId] = useState<string | null>(null);

    const goToConfirmation = (listingId: string) => {
        navigation.goBack();
        rootNav.navigate('MainTabs', {
            screen: 'Sell',
            params: { screen: 'ListingConfirmation', params: { listingId } },
        });
    };

    const handleSubmit = async (values: Parameters<typeof createListingFromSellForm>[0]) => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const listing = await createListingFromSellForm(values, wardrobeItemId);
            const hasPayout = await sellerHasPayoutDetails();
            setSubmitting(false);
            if (!hasPayout) {
                setPayoutListingId(listing.id);
                return;
            }
            goToConfirmation(listing.id);
        } catch (err) {
            setSubmitting(false);   // re-enable on failure so user can retry
            Alert.alert('Cannot list item', err instanceof Error ? err.message : 'Something went wrong');
        }
    };
    if (loading) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="List for Sale" onBack={() => navigation.goBack()} />
                <View style={styles.centerFill}>
                    <ActivityIndicator color={colors.accent.primary} />
                </View>
            </View>
        );
    }

    if (!item) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="List for Sale" onBack={() => navigation.goBack()} />
                <View style={styles.centerFill}>
                    <Text style={styles.errorText}>Item not found.</Text>
                </View>
            </View>
        );
    }

    const initialValues = wardrobeToSellValues(item);

    return (
        <View style={styles.container}>
            <ScreenHeader title="List for Sale" onBack={() => navigation.goBack()} />
            <ScrollView showsVerticalScrollIndicator={false}>
               <SellForm
    initialValues={initialValues}
    wardrobeItemId={wardrobeItemId}
    showDraft={false}
    submitting={submitting}
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
                    navigation.goBack();
                    rootNav.navigate('MainTabs', {
                        screen: 'Me',
                        params: { screen: 'PayoutDetails', initial: false },
                    });
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.shell },
    centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    errorText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDarkMuted,
    },
});

export default ListItemModalScreen;