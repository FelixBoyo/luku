import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import MainTabs from './MainTabs';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import ConversationScreen from '../screens/ConversationScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import WardrobeItemDetailScreen from '../screens/WardrobeItemDetailScreen';
import ComingSoonScreen from '../screens/ComingSoonScreen';
import PaymentScreen from '../screens/PaymentScreen';
import OrderConfirmationScreen from '../screens/OrderConfirmationScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import AIRecommendationsScreen from '../screens/AIRecommendationsScreen';
import TrendingScreen from '../screens/TrendingScreen';
import BrandDetailScreen from '../screens/BrandDetailScreen';
import StyleDetailScreen from '../screens/StyleDetailScreen';
import WardrobeScreen from '../screens/WardrobeScreen';
import WardrobePairingsScreen from '../screens/WardrobePairingsScreen';
import VirtualTryOnScreen from '../screens/VirtualTryOnScreen';
import HelpScreen from '../screens/HelpScreen';
import HelpArticleScreen from '../screens/HelpArticleScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import LegalScreen from '../screens/LegalScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import OutfitDetailScreen from '../screens/OutfitDetailScreen';
import CreateOutfitScreen from '../screens/CreateOutfitScreen';
import ListItemModalScreen from '../screens/ListItemModalScreen';
import ListingDetailScreen from '../screens/ListingDetailScreen';
import SharedOutfitScreen from '../screens/SharedOutfitScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNav: React.FC = () => (
    <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Conversation" component={ConversationScreen} />
            <Stack.Screen name="Orders" component={OrdersScreen} />
            <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
            <Stack.Screen
                name="WardrobeItemDetail"
                component={WardrobeItemDetailScreen}
            />
            <Stack.Screen name="ComingSoon" component={ComingSoonScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen
                name="OrderConfirmation"
                component={OrderConfirmationScreen}
            />

            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
            <Stack.Screen
                name="AIRecommendations"
                component={AIRecommendationsScreen}
            />
            <Stack.Screen name="Trending" component={TrendingScreen} />
            <Stack.Screen name="BrandDetail" component={BrandDetailScreen} />
            <Stack.Screen name="StyleDetail" component={StyleDetailScreen} />
            <Stack.Screen name="Wardrobe" component={WardrobeScreen} />
            <Stack.Screen name="WardrobePairings" component={WardrobePairingsScreen} />
            <Stack.Screen name="VirtualTryOn" component={VirtualTryOnScreen} />
            <Stack.Screen name="Help" component={HelpScreen} />
            <Stack.Screen name="HelpArticle" component={HelpArticleScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Legal" component={LegalScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="OutfitDetail" component={OutfitDetailScreen} />
            <Stack.Screen name="CreateOutfit" component={CreateOutfitScreen} />
            <Stack.Screen
                name="ListItemModal"
                component={ListItemModalScreen}
                options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
            <Stack.Screen name="SharedOutfit" component={SharedOutfitScreen} />
        </Stack.Navigator>
    </NavigationContainer>
);

export default RootNav;
