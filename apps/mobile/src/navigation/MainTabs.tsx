import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';
import { BottomTabBar } from '../components/shell/BottomTabBar';
import HomeStack from './HomeStack';
import DiscoverStack from './DiscoverStack';
import SellStack from './SellStack';
import StylistStack from './StylistStack';
import MeStack from './MeStack';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs: React.FC = () => (
    <Tab.Navigator
        tabBar={(props) => <BottomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
    >
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen name="Discover" component={DiscoverStack} />
        <Tab.Screen name="Sell" component={SellStack} />
        <Tab.Screen name="Stylist" component={StylistStack} />
        <Tab.Screen name="Me" component={MeStack} />
    </Tab.Navigator>
);

export default MainTabs;
