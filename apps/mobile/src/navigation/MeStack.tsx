import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MeStackParamList } from './types';
import MeScreen from '../screens/MeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import WishlistScreen from '../screens/WishlistScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SecuritySettingsScreen from '../screens/settings/SecuritySettingsScreen';
import LanguageRegionScreen from '../screens/settings/LanguageRegionScreen';
import PrivacySettingsScreen from '../screens/settings/PrivacySettingsScreen';
import BlockedAccountsScreen from '../screens/settings/BlockedAccountsScreen';
import ContactScreen from '../screens/settings/ContactScreen';
import PaymentMethodsScreen from '../screens/settings/PaymentMethodsScreen';
import ConnectionsScreen from '../screens/ConnectionsScreen';
import SavedOutfitsScreen from '../screens/SavedOutfitsScreen';
import CommerceScreen from '../screens/CommerceScreen';
import PayoutDetailsScreen from '../screens/settings/PayoutDetailsScreen';


const Stack = createNativeStackNavigator<MeStackParamList>();

const MeStack: React.FC = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MeMain" component={MeScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Wishlist" component={WishlistScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
        <Stack.Screen name="LanguageRegion" component={LanguageRegionScreen} />
        <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
        <Stack.Screen name="BlockedAccounts" component={BlockedAccountsScreen} />
        <Stack.Screen name="Contact" component={ContactScreen} />
        <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
        <Stack.Screen name="Connections" component={ConnectionsScreen} />
        <Stack.Screen name="SavedOutfits" component={SavedOutfitsScreen} />
        <Stack.Screen name="Commerce" component={CommerceScreen} />
        <Stack.Screen name="PayoutDetails" component={PayoutDetailsScreen} />
    </Stack.Navigator>
);

export default MeStack;
