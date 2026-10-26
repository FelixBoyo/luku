import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { DiscoverStackParamList } from './types';
import DiscoverScreen from '../screens/DiscoverScreen';

const Stack = createNativeStackNavigator<DiscoverStackParamList>();

const DiscoverStack: React.FC = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="DiscoverMain" component={DiscoverScreen} />
    </Stack.Navigator>
);

export default DiscoverStack;
