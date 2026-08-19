import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SHADOWS } from '../constants/theme';
import StatusBadge from './StatusBadge';

export default function OrderCard({ order, showItems = false }) {
  const orderId = '#' + order._id.slice(-6);
  const customerName = order.customer ? order.customer.name : 'Unknown';
  const providerName = order.provider ? order.provider.name : 'Unknown';
  const itemsSummary = order.items.map(i => `${i.qty}x ${i.name}`).join(', ');

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.orderId}>{orderId}</Text>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>Customer</Text>
          <Text style={styles.detailValue}>{customerName}</Text>
        </View>
        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>Provider</Text>
          <Text style={styles.detailValue}>{providerName}</Text>
        </View>
        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>Total</Text>
          <Text style={styles.totalValue}>৳{order.total}</Text>
        </View>
      </View>

      {showItems && (
        <View style={styles.itemsRow}>
          <Text style={styles.detailLabel}>Items</Text>
          <Text style={styles.itemsText}>{itemsSummary}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  orderId: {
    fontSize: 15,
    fontFamily: FONTS.poppinsSemiBold,
    color: COLORS.dark,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.dark,
  },
  totalValue: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.dark,
  },
  itemsRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  itemsText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: '#555',
    marginTop: 3,
  },
});
