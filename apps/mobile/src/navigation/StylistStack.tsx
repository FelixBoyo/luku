import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { StylistStackParamList } from './types';
import StylistScreen from '../screens/StylistScreen';

const Stack = createNativeStackNavigator<StylistStackParamList>();

const StylistStack: React.FC = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="StylistMain" component={StylistScreen} />
    </Stack.Navigator>
);

export default StylistStack;
