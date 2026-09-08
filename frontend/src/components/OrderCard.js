import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../theme/colors';
import StatusBadge from './StatusBadge';

const OrderCard = ({ order, showItems = false }) => {
  const orderId = '#' + String(order._id || order.id || '').slice(-6);
  const customerName =
    typeof order.customer === 'object' && order.customer?.name
      ? order.customer.name
      : typeof order.customer === 'string'
      ? order.customer
      : 'Customer';
  const providerName =
    typeof order.provider === 'object' && order.provider?.name
      ? order.provider.name
      : order.providerName || 'Provider';
  const itemsSummary = (order.items || [])
    .map((i) => `${i.qty || i.quantity || 1}x ${i.name}`)
    .join(', ');

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.orderId}>{orderId}</Text>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>Customer</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {customerName}
          </Text>
        </View>
        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>Provider</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {providerName}
          </Text>
        </View>
        <View style={styles.detailColRight}>
          <Text style={styles.detailLabel}>Total</Text>
          <Text style={styles.totalValue}>৳{order.total || 0}</Text>
        </View>
      </View>

      {showItems && itemsSummary ? (
        <View style={styles.itemsRow}>
          <Text style={styles.detailLabel}>Items Ordered</Text>
          <Text style={styles.itemsText}>{itemsSummary}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    marginBottom: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm + 4,
  },
  orderId: {
    fontSize: 15,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCol: {
    flex: 1.2,
    marginRight: 6,
  },
  detailColRight: {
    flex: 0.8,
    alignItems: 'flex-end',
  },
  detailLabel: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    color: colors.textGray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textDark,
  },
  totalValue: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  itemsRow: {
    marginTop: spacing.sm + 2,
    paddingTop: spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemsText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textDark,
    marginTop: 2,
  },
});

export default OrderCard;
