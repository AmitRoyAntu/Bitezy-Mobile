import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const AdminHeader = () => {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of the Admin panel?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.navbar}>
        <Logo size="small" showTagline={false} align="left" />
        <View style={styles.rightRow}>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
            <Text style={styles.adminText}>Admin</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.7}
            accessibilityLabel="Sign Out"
          >
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  navbar: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1,
    borderColor: colors.primaryGlow,
  },
  adminText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.primary,
    letterSpacing: 0.3,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AdminHeader;
