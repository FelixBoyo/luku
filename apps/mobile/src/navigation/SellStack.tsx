import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { SellStackParamList } from './types';
import SellScreen from '../screens/SellScreen';
import ListingConfirmationScreen from '../screens/ListingConfirmationScreen';

const Stack = createNativeStackNavigator<SellStackParamList>();

const SellStack: React.FC = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SellMain" component={SellScreen} />
        <Stack.Screen
            name="ListingConfirmation"
            component={ListingConfirmationScreen}
        />
    </Stack.Navigator>
);

export default SellStack;
