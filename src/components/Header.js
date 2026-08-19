import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';

export default function Header() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
      <View style={styles.navbar}>
        <View style={styles.logoContainer}>
          <Ionicons name="fast-food" size={22} color={COLORS.primary} />
          <Text style={styles.logoText}>Bitezy</Text>
        </View>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={16} color={COLORS.primary} />
          <Text style={styles.adminText}>Admin</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  navbar: {
    height: SIZES.headerHeight,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoText: {
    fontSize: 20,
    fontFamily: FONTS.poppinsBold,
    color: COLORS.dark,
    letterSpacing: -0.5,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
  },
  adminText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.dark,
  },
});
