import React, { useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet, Text, Animated, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ProviderListScreen from '../screens/customer/ProviderListScreen';
import ProviderMenuScreen from '../screens/customer/ProviderMenuScreen';
import ProviderReviewsScreen from '../screens/customer/ProviderReviewsScreen';
import CartScreen from '../screens/customer/CartScreen';
import OrderHistoryScreen from '../screens/customer/OrderHistoryScreen';
import CustomerProfileScreen from '../screens/customer/CustomerProfileScreen';

import { colors, fonts } from '../theme/colors';
import { useCart } from '../context/CartContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ExploreStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="ProviderList"
      component={ProviderListScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ProviderMenu"
      component={ProviderMenuScreen}
      options={{ title: 'Menu Options', headerTintColor: colors.primary }}
    />
    <Stack.Screen
      name="ProviderReviews"
      component={ProviderReviewsScreen}
      options={{ title: 'Reviews', headerTintColor: colors.primary }}
    />
  </Stack.Navigator>
);

const TabIcon = ({ name, nameFocused, focused, badge }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (badge > 0) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.35,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [badge]);

  return (
    <View style={styles.iconContainer}>
      <Ionicons
        name={focused ? nameFocused : name}
        size={24}
        color={focused ? colors.primary : colors.textGray}
      />
      {badge > 0 && (
        <Animated.View style={[styles.badge, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const CustomerNavigator = () => {
  const { totalItems } = useCart();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textGray,
        tabBarStyle: {
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="ExploreStack"
        component={ExploreStack}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="restaurant-outline"
              nameFocused="restaurant"
              focused={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarLabel: 'Cart',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="bag-handle-outline"
              nameFocused="bag-handle"
              focused={focused}
              badge={totalItems}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Orders"
        component={OrderHistoryScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="receipt-outline"
              nameFocused="receipt"
              focused={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={CustomerProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="person-outline"
              nameFocused="person"
              focused={focused}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: { position: 'relative', width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
});

export default CustomerNavigator;
