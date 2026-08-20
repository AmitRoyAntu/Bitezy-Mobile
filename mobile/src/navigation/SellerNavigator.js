import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import SellerDashboardScreen from '../screens/seller/SellerDashboardScreen';
import SellerOrdersScreen from '../screens/seller/SellerOrdersScreen';
import SellerMenuScreen from '../screens/seller/SellerMenuScreen';
import SellerProfileScreen from '../screens/seller/SellerProfileScreen';
import SellerReviewsScreen from '../screens/seller/SellerReviewsScreen';

import { colors, fonts } from '../theme/colors';
import DataService from '../api/DataService';

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

const TabIcon = ({ name, nameFocused, focused, badge }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (badge > 0) {
      const isNative = Platform.OS !== 'web';
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 120,
          useNativeDriver: isNative,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: isNative,
        }),
      ]).start();
    }
  }, [badge]);

  return (
    <View style={styles.iconWrapper}>
      <Ionicons
        name={focused ? nameFocused : name}
        size={24}
        color={focused ? colors.primary : colors.textGray}
      />
      {badge > 0 && (
        <Animated.View style={[styles.badge, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </Animated.View>
      )}
    </View>
  );
};

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

  return (
    <Tab.Navigator
      initialRouteName="Orders"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textGray,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.semiBold,
          fontSize: 11,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={SellerDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="grid-outline"
              nameFocused="grid"
              focused={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Orders"
        component={SellerOrdersScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="receipt-outline"
              nameFocused="receipt"
              focused={focused}
              badge={pendingCount}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Menu"
        component={SellerMenuScreen}
        options={{
          tabBarLabel: 'Menu',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="fast-food-outline"
              nameFocused="fast-food"
              focused={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="settings-outline"
              nameFocused="settings"
              focused={focused}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconWrapper: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.danger,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.card,
  },
  badgeText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 9,
  },
});

export default SellerNavigator;
