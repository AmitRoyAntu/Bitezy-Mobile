import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../theme/colors';

const StatCard = ({ label, value, trend, trendColor, onPress, icon }) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <View style={styles.topRow}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {onPress && (
          <View style={styles.tapIndicator}>
            <Ionicons name={icon || 'chevron-forward'} size={13} color={colors.primary} />
          </View>
        )}
      </View>

      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>

      {trend ? (
        <View style={styles.trendRow}>
          <Text
            style={[styles.trend, { color: trendColor || colors.textGray }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {trend}
          </Text>
        </View>
      ) : null}
    </Container>
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
    overflow: 'hidden',
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: colors.textGray,
    fontFamily: fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
    marginRight: 4,
  },
  tapIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 22,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
    marginVertical: 4,
  },
  trendRow: {
    marginTop: 2,
  },
  trend: {
    fontSize: 12,
    fontFamily: fonts.medium,
  },
});

export default StatCard;
