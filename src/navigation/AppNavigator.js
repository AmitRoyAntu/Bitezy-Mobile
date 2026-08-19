import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';

import DashboardScreen from '../screens/DashboardScreen';
import OrdersScreen from '../screens/OrdersScreen';
import UsersScreen from '../screens/UsersScreen';
import SellersScreen from '../screens/SellersScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Dashboard: { focused: 'pie-chart', unfocused: 'pie-chart-outline' },
  Orders: { focused: 'receipt', unfocused: 'receipt-outline' },
  Users: { focused: 'people', unfocused: 'people-outline' },
  Sellers: { focused: 'storefront', unfocused: 'storefront-outline' },
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            const icons = TAB_ICONS[route.name];
            const iconName = focused ? icons.focused : icons.unfocused;
            return <Ionicons name={iconName} size={22} color={color} />;
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.gray,
          tabBarStyle: {
            height: 65,
            paddingTop: 8,
            paddingBottom: 10,
            backgroundColor: COLORS.white,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
          },
          tabBarLabelStyle: {
            fontFamily: FONTS.semiBold,
            fontSize: 11,
            marginTop: 2,
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Orders" component={OrdersScreen} />
        <Tab.Screen name="Users" component={UsersScreen} />
        <Tab.Screen name="Sellers" component={SellersScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
