import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../theme/colors';

const StatCard = ({ label, value, trend, trendColor }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {trend ? (
        <Text style={[styles.trend, { color: trendColor || colors.textGray }]}>
          {trend}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: spacing.md,
    borderRadius: spacing.borderRadiusMd,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
    minHeight: 110,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 11,
    color: colors.textGray,
    fontFamily: fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 22,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
    marginVertical: 4,
  },
  trend: {
    fontSize: 12,
    fontFamily: fonts.medium,
  },
});

export default StatCard;
