import React from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import CustomerNavigator from './CustomerNavigator';
import SellerNavigator from './SellerNavigator';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { colors, spacing } from '../theme/colors';

const RootNavigator = () => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Logo size="large" showTagline />
        <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
      </View>
    );
  }

  const renderRoleNavigator = () => {
    if (!isAuthenticated) {
      return <AuthNavigator />;
    }

    switch (role) {
      // case 'admin':
      //   return <AdminNavigator />;
      case 'seller':
        return <SellerNavigator />;
      case 'buyer':
      case 'customer':
      default:
        return <CustomerNavigator />;
    }
  };

  return <NavigationContainer>{renderRoleNavigator()}</NavigationContainer>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  spinner: {
    marginTop: spacing.md,
  },
});

export default RootNavigator;
