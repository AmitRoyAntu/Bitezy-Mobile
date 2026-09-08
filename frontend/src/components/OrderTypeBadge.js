import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../theme/colors';

/**
 * Modular OrderTypeBadge component used across Customer and Seller apps.
 *
 * @param {'delivery' | 'pickup'} type - Order fulfillment type
 * @param {string} [label] - Optional custom label override
 * @param {'sm' | 'md'} [size='sm'] - Badge size variant
 * @param {object} [style] - Additional style overrides
 */
const OrderTypeBadge = ({ type = 'delivery', label, size = 'sm', style }) => {
  const isDelivery = String(type).toLowerCase() === 'delivery';

  const defaultLabel = isDelivery ? 'Hall Delivery' : 'Counter Pickup';
  const displayLabel = label || defaultLabel;

  const iconName = isDelivery ? 'bicycle' : 'storefront-outline';
  const iconColor = isDelivery ? colors.primary : '#4F46E5';

  return (
    <View
      style={[
        styles.badgeBase,
        isDelivery ? styles.badgeDelivery : styles.badgePickup,
        size === 'md' && styles.badgeMd,
        style,
      ]}
    >
      <Ionicons
        name={iconName}
        size={size === 'md' ? 13 : 11}
        color={iconColor}
        style={{ marginRight: 3.5 }}
      />
      <Text
        style={[
          styles.textBase,
          isDelivery ? styles.textDelivery : styles.textPickup,
          size === 'md' && styles.textMd,
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeBase: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: spacing.borderRadiusFull,
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeDelivery: {
    backgroundColor: 'rgba(255, 75, 38, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 38, 0.18)',
  },
  badgePickup: {
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.18)',
  },
  textBase: {
    fontFamily: fonts.semiBold,
    fontSize: 10.5,
    letterSpacing: 0.1,
  },
  textMd: {
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  textDelivery: {
    color: colors.primary,
  },
  textPickup: {
    color: '#4F46E5',
  },
});

export default OrderTypeBadge;
