import React, { useState, useEffect } from 'react';
import { Platform, UIManager } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SellerDashboardScreen from '../screens/seller/SellerDashboardScreen';
import SellerOrdersScreen from '../screens/seller/SellerOrdersScreen';
import SellerMenuScreen from '../screens/seller/SellerMenuScreen';
import SellerProfileScreen from '../screens/seller/SellerProfileScreen';
import SellerReviewsScreen from '../screens/seller/SellerReviewsScreen';
import FloatingTabBar from '../components/FloatingTabBar';

import { colors, fonts } from '../theme/colors';
import DataService from '../api/DataService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Tab = createBottomTabNavigator();
const SettingsStack = createNativeStackNavigator();

const SettingsStackNavigator = () => (
  <SettingsStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.card },
      headerTitleStyle: { fontFamily: fonts.headingBold, fontSize: 16, color: colors.textDark },
      headerTintColor: colors.primary,
    }}
  >
    <SettingsStack.Screen
      name="SellerProfile"
      component={SellerProfileScreen}
      options={{ headerShown: false }}
    />
    <SettingsStack.Screen
      name="Reviews"
      component={SellerReviewsScreen}
      options={{ title: 'Customer Reviews' }}
    />
  </SettingsStack.Navigator>
);

const SellerNavigator = () => {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const orders = await DataService.getSellerOrders();
        const pending = (orders || []).filter(
          (o) => !['DELIVERED', 'PICKED_UP', 'CANCELLED'].includes(o.status)
        ).length;
        setPendingCount(pending);
      } catch (e) {
        // silent catch
      }
    };

    fetchPendingOrders();
    const interval = setInterval(fetchPendingOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const getIconName = (routeName, isFocused) => {
    switch (routeName) {
      case 'Dashboard':
        return isFocused ? 'grid' : 'grid-outline';
      case 'Orders':
        return isFocused ? 'receipt' : 'receipt-outline';
      case 'Menu':
        return isFocused ? 'restaurant' : 'restaurant-outline';
      case 'Settings':
        return isFocused ? 'settings' : 'settings-outline';
      default:
        return 'grid-outline';
    }
  };

  const getBadgeCount = (routeName) => {
    if (routeName === 'Orders') return pendingCount;
    return 0;
  };

  const shouldHideTabBar = (currentRoute, focusedChildName) => {
    return (
      currentRoute.name === 'Settings' &&
      !!focusedChildName &&
      focusedChildName !== 'SellerProfile'
    );
  };

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      tabBar={(props) => (
        <FloatingTabBar
          {...props}
          getIconName={getIconName}
          getBadgeCount={getBadgeCount}
          shouldHide={shouldHideTabBar}
        />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={SellerDashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="Orders"
        component={SellerOrdersScreen}
        options={{ tabBarLabel: 'Orders' }}
      />
      <Tab.Screen
        name="Menu"
        component={SellerMenuScreen}
        options={{ tabBarLabel: 'Menu' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

export default SellerNavigator;
