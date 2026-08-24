import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FloatingTabBar from '../components/FloatingTabBar';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminSellersScreen from '../screens/admin/AdminSellersScreen';

const Tab = createBottomTabNavigator();

const getIconName = (routeName, isFocused) => {
  switch (routeName) {
    case 'AdminDashboard':
      return isFocused ? 'pie-chart' : 'pie-chart-outline';
    case 'AdminOrders':
      return isFocused ? 'receipt' : 'receipt-outline';
    case 'AdminUsers':
      return isFocused ? 'people' : 'people-outline';
    case 'AdminSellers':
      return isFocused ? 'storefront' : 'storefront-outline';
    default:
      return 'grid-outline';
  }
};

const getBadgeCount = () => 0;
const shouldHideTabBar = () => false;

const AdminNavigator = () => {
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
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="AdminOrders"
        component={AdminOrdersScreen}
        options={{ tabBarLabel: 'Orders' }}
      />
      <Tab.Screen
        name="AdminUsers"
        component={AdminUsersScreen}
        options={{ tabBarLabel: 'Users' }}
      />
      <Tab.Screen
        name="AdminSellers"
        component={AdminSellersScreen}
        options={{ tabBarLabel: 'Sellers' }}
      />
    </Tab.Navigator>
  );
};

export default AdminNavigator;
