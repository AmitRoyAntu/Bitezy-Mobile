import React from 'react';
import { Platform, UIManager } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ProviderListScreen from '../screens/customer/ProviderListScreen';
import ProviderMenuScreen from '../screens/customer/ProviderMenuScreen';
import ProviderReviewsScreen from '../screens/customer/ProviderReviewsScreen';
import CartScreen from '../screens/customer/CartScreen';
import OrderHistoryScreen from '../screens/customer/OrderHistoryScreen';
import CustomerProfileScreen from '../screens/customer/CustomerProfileScreen';
import FloatingTabBar from '../components/FloatingTabBar';

import { colors, fonts } from '../theme/colors';
import { useCart } from '../context/CartContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ExploreStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerTintColor: colors.primary,
      headerTitleStyle: { fontFamily: fonts.headingBold, color: colors.textDark },
      headerBackTitleVisible: false,
    }}
  >
    <Stack.Screen
      name="ProviderList"
      component={ProviderListScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ProviderMenu"
      component={ProviderMenuScreen}
      options={{ title: 'Menu & Details' }}
    />
    <Stack.Screen
      name="ProviderReviews"
      component={ProviderReviewsScreen}
      options={{ title: 'Student Reviews' }}
    />
  </Stack.Navigator>
);

const CustomerNavigator = () => {
  const { totalItems } = useCart();

  const getIconName = (routeName, isFocused) => {
    switch (routeName) {
      case 'ExploreStack':
        return isFocused ? 'restaurant' : 'restaurant-outline';
      case 'Cart':
        return isFocused ? 'bag-handle' : 'bag-handle-outline';
      case 'Orders':
        return isFocused ? 'receipt' : 'receipt-outline';
      case 'Profile':
        return isFocused ? 'person' : 'person-outline';
      default:
        return 'grid-outline';
    }
  };

  const getBadgeCount = (routeName) => {
    if (routeName === 'Cart') return totalItems;
    return 0;
  };

  const shouldHideTabBar = (currentRoute, focusedChildName) => {
    return (
      currentRoute.name === 'ExploreStack' &&
      !!focusedChildName &&
      focusedChildName !== 'ProviderList'
    );
  };

  return (
    <Tab.Navigator
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
        name="ExploreStack"
        component={ExploreStack}
        options={{ tabBarLabel: 'Explore' }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ tabBarLabel: 'Cart' }}
      />
      <Tab.Screen
        name="Orders"
        component={OrderHistoryScreen}
        options={{ tabBarLabel: 'Orders' }}
      />
      <Tab.Screen
        name="Profile"
        component={CustomerProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default CustomerNavigator;
