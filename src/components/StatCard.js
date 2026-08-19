import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SHADOWS } from '../constants/theme';

export default function StatCard({ label, value, trend, trendColor }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={[styles.trend, { color: trendColor || COLORS.gray }]}>{trend}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'space-between',
    minHeight: 120,
    ...SHADOWS.sm,
  },
  label: {
    fontSize: 11,
    color: COLORS.gray,
    fontFamily: FONTS.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 26,
    fontFamily: FONTS.poppinsBold,
    color: COLORS.dark,
    marginVertical: 4,
  },
  trend: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
});
