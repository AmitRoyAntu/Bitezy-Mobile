import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  UIManager,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import SellerDashboardScreen from '../screens/seller/SellerDashboardScreen';
import SellerOrdersScreen from '../screens/seller/SellerOrdersScreen';
import SellerMenuScreen from '../screens/seller/SellerMenuScreen';
import SellerProfileScreen from '../screens/seller/SellerProfileScreen';
import SellerReviewsScreen from '../screens/seller/SellerReviewsScreen';

import { colors, fonts, spacing } from '../theme/colors';
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

const CustomFloatingTabBar = ({ state, descriptors, navigation, pendingCount }) => {
  // Hide floating bar when inside sub-screens (e.g. Reviews)
  const currentRoute = state.routes[state.index];
  const focusedChildName = getFocusedRouteNameFromRoute(currentRoute);
  if (currentRoute.name === 'Settings' && focusedChildName && focusedChildName !== 'SellerProfile') {
    return null;
  }

  return (
    <View style={styles.floatingContainer} pointerEvents="box-none">
      <View style={styles.capsuleDock}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const getIconName = () => {
            if (route.name === 'Dashboard') return isFocused ? 'grid' : 'grid-outline';
            if (route.name === 'Orders') return isFocused ? 'receipt' : 'receipt-outline';
            if (route.name === 'Menu') return isFocused ? 'restaurant' : 'restaurant-outline';
            if (route.name === 'Settings') return isFocused ? 'settings' : 'settings-outline';
            return 'grid-outline';
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.85}
              style={[
                styles.tabItem,
                isFocused && styles.tabItemFocused,
              ]}
            >
              <View style={styles.iconWrapper}>
                <Ionicons
                  name={getIconName()}
                  size={20}
                  color={isFocused ? colors.white : colors.textDark}
                />
                {route.name === 'Orders' && pendingCount > 0 && !isFocused && (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveBadgeText}>
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </Text>
                  </View>
                )}
              </View>

              {isFocused && (
                <Text style={styles.activeTabLabel} numberOfLines={1}>
                  {label}
                  {route.name === 'Orders' && pendingCount > 0 ? ` (${pendingCount})` : ''}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
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
      initialRouteName="Dashboard"
      tabBar={(props) => <CustomFloatingTabBar {...props} pendingCount={pendingCount} />}
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

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 22 : 16,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  capsuleDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 6,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1.2,
    borderColor: colors.borderDark,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: colors.secondary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 8px 24px rgba(18, 18, 23, 0.12)',
      },
    }),
  },
  tabItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemFocused: {
    width: 'auto',
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: spacing.borderRadiusFull,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(255, 75, 38, 0.28)',
      },
    }),
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabLabel: {
    fontFamily: fonts.headingBold,
    color: colors.white,
    fontSize: 13,
    letterSpacing: -0.2,
  },
  inactiveBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.primary,
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  inactiveBadgeText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 9,
    textAlign: 'center',
  },
});

export default SellerNavigator;
