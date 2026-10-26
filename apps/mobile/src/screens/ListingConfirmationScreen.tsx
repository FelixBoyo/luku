import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SellStackParamList } from '../navigation/types';
import { Button } from '../components/common/Button';
import { useRootNavigation } from '../navigation/useRootNavigation';
import { colors, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<SellStackParamList, 'ListingConfirmation'>;

const ListingConfirmationScreen: React.FC<Props> = ({ navigation, route }) => {
    const rootNav = useRootNavigation();
    const { listingId } = route.params;

    const goToListings = () => {
        rootNav.navigate('MainTabs', {
            screen: 'Me',
            params: {
                screen: 'Commerce',
                params: { initialTab: 'listings' },
            },
        });
    };

    return (
        <View style={styles.container}>
            <CheckCircle size={64} color={colors.accent.primary} strokeWidth={2} />
            <Text style={styles.title}>Listing Published!</Text>
            <Text style={styles.subtitle}>
                Your item is now live on the LUKU marketplace.
            </Text>
            <Button
                label="Go to Listings"
                variant="accent"
                onPress={goToListings}
                style={styles.btn}
            />
            <Button
                label="View Listing"
                variant="secondary"
                onPress={() => rootNav.navigate('ListingDetail', { listingId })}
                style={styles.btnSecondary}
            />
            <Button
                label="Back to Sell"
                variant="ghost"
                onPress={() => navigation.navigate('SellMain')}
                style={styles.btnGhost}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.shell,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.page,
    },
    title: {
        fontFamily: typography.fontFamily.black,
        fontSize: 28,
        color: colors.text.onDark,
        marginTop: spacing.xl,
    },
    subtitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 14,
        color: colors.text.onDarkMuted,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
    btn: { marginTop: spacing.xxl, alignSelf: 'stretch' },
    btnSecondary: { marginTop: spacing.md, alignSelf: 'stretch' },
    btnGhost: { marginTop: spacing.md, alignSelf: 'stretch' },
});

export default ListingConfirmationScreen;
