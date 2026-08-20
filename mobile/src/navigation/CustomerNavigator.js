import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { View, StyleSheet, Text, TouchableOpacity, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ProviderListScreen from '../screens/customer/ProviderListScreen';
import ProviderMenuScreen from '../screens/customer/ProviderMenuScreen';
import ProviderReviewsScreen from '../screens/customer/ProviderReviewsScreen';
import CartScreen from '../screens/customer/CartScreen';
import OrderHistoryScreen from '../screens/customer/OrderHistoryScreen';
import CustomerProfileScreen from '../screens/customer/CustomerProfileScreen';

import { colors, fonts, spacing } from '../theme/colors';
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

const CustomFloatingTabBar = ({ state, descriptors, navigation }) => {
  const { totalItems } = useCart();

  // Hide the floating tab bar when inside Menu or Reviews sub-screens
  const currentRoute = state.routes[state.index];
  const focusedChildName = getFocusedRouteNameFromRoute(currentRoute);
  if (currentRoute.name === 'ExploreStack' && focusedChildName && focusedChildName !== 'ProviderList') {
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
            if (route.name === 'ExploreStack') return isFocused ? 'restaurant' : 'restaurant-outline';
            if (route.name === 'Cart') return isFocused ? 'bag-handle' : 'bag-handle-outline';
            if (route.name === 'Orders') return isFocused ? 'receipt' : 'receipt-outline';
            if (route.name === 'Profile') return isFocused ? 'person' : 'person-outline';
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
                {route.name === 'Cart' && totalItems > 0 && !isFocused && (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveBadgeText}>{totalItems}</Text>
                  </View>
                )}
              </View>
              {isFocused && (
                <Text style={styles.activeTabLabel} numberOfLines={1}>
                  {label === 'ExploreStack' ? 'Explore' : label}
                  {route.name === 'Cart' && totalItems > 0 ? ` (${totalItems})` : ''}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const CustomerNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomFloatingTabBar {...props} />}
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
    fontSize: 9,
    fontFamily: fonts.bold,
  },
});

export default CustomerNavigator;


