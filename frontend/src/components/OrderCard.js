import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../theme/colors';
import StatusBadge from './StatusBadge';

const formatOrderDate = (dateString) => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return '';
  }
};

const OrderCard = ({ order, showItems = true }) => {
  if (!order) return null;

  const orderId = '#' + String(order._id || order.id || '').slice(-6);

  const customerName =
    typeof order.customer === 'object' && order.customer?.name
      ? order.customer.name
      : typeof order.customer === 'string'
      ? order.customer
      : 'Campus Buyer';

  const customerPhone =
    typeof order.customer === 'object' ? order.customer?.phone : null;

  const customerLocation =
    order.deliveryAddress ||
    (typeof order.customer === 'object' ? order.customer?.residence : null);

  const providerName =
    typeof order.provider === 'object' && order.provider?.name
      ? order.provider.name
      : order.providerName || 'Campus Canteen';

  const providerLocation =
    typeof order.provider === 'object' ? order.provider?.location : null;

  const orderType = (order.type || 'delivery').toLowerCase();
  const isDelivery = orderType === 'delivery';

  const items = Array.isArray(order.items) ? order.items : [];
  const totalItemQty = items.reduce((sum, i) => sum + (Number(i.qty || i.quantity) || 1), 0);
  const formattedDate = formatOrderDate(order.createdAt);

  return (
    <View style={styles.card}>
      {/* Top Header: Order ID + Type Badge + Status Badge */}
      <View style={styles.topRow}>
        <View style={styles.idGroup}>
          <Text style={styles.orderId}>{orderId}</Text>
          <View
            style={[
              styles.typeBadge,
              isDelivery ? styles.typeBadgeDelivery : styles.typeBadgePickup,
            ]}
          >
            <Ionicons
              name={isDelivery ? 'bicycle-outline' : 'bag-handle-outline'}
              size={12}
              color={isDelivery ? colors.primary : colors.secondary}
            />
            <Text
              style={[
                styles.typeBadgeText,
                { color: isDelivery ? colors.primary : colors.secondary },
              ]}
            >
              {isDelivery ? 'Delivery' : 'Pickup'}
            </Text>
          </View>
        </View>

        <StatusBadge status={order.status} />
      </View>

      {/* Customer & Provider Information */}
      <View style={styles.entitiesContainer}>
        {/* Customer Information */}
        <View style={styles.entityRow}>
          <View style={styles.entityIconBox}>
            <Ionicons name="person-outline" size={14} color={colors.primary} />
          </View>
          <View style={styles.entityTextBox}>
            <Text style={styles.entityName} numberOfLines={1}>
              {customerName}
            </Text>
            {(customerLocation || customerPhone) && (
              <Text style={styles.entitySub} numberOfLines={1}>
                {customerLocation || ''}
                {customerLocation && customerPhone ? ' • ' : ''}
                {customerPhone || ''}
              </Text>
            )}
          </View>
        </View>

        {/* Provider / Canteen Information */}
        <View style={styles.entityRow}>
          <View style={[styles.entityIconBox, { backgroundColor: 'rgba(238, 82, 83, 0.08)' }]}>
            <Ionicons name="storefront-outline" size={14} color={colors.secondary} />
          </View>
          <View style={styles.entityTextBox}>
            <Text style={styles.entityName} numberOfLines={1}>
              {providerName}
            </Text>
            {providerLocation && (
              <Text style={styles.entitySub} numberOfLines={1}>
                {providerLocation}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Item summary preview */}
      {showItems && items.length > 0 && (
        <View style={styles.itemsBox}>
          {items.slice(0, 3).map((item, idx) => (
            <View key={idx} style={styles.itemLine}>
              <Text style={styles.itemQty}>{item.qty || item.quantity || 1}x</Text>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.itemPrice}>
                ৳{(Number(item.price) || 0) * (Number(item.qty || item.quantity) || 1)}
              </Text>
            </View>
          ))}
          {items.length > 3 && (
            <Text style={styles.moreItemsText}>
              +{items.length - 3} more item{items.length - 3 > 1 ? 's' : ''}...
            </Text>
          )}
        </View>
      )}

      {/* Card Footer: Date, Items Count, and Total Amount */}
      <View style={styles.bottomRow}>
        <View style={styles.dateCol}>
          {formattedDate ? (
            <View style={styles.dateWrap}>
              <Ionicons name="time-outline" size={12} color={colors.textLight} />
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>
          ) : (
            <Text style={styles.dateText}>Live Order</Text>
          )}
          <Text style={styles.itemCountText}>
            {totalItemQty} {totalItemQty === 1 ? 'item' : 'items'}
          </Text>
        </View>

        <View style={styles.totalCol}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>৳{Number(order.total || 0).toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd + 2,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm + 4,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
  },
  idGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeBadgeDelivery: {
    backgroundColor: 'rgba(15, 88, 62, 0.08)',
    borderColor: 'rgba(15, 88, 62, 0.2)',
  },
  typeBadgePickup: {
    backgroundColor: 'rgba(238, 82, 83, 0.08)',
    borderColor: 'rgba(238, 82, 83, 0.2)',
  },
  typeBadgeText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
  },
  entitiesContainer: {
    gap: 8,
    marginBottom: spacing.sm + 2,
  },
  entityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  entityIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entityTextBox: {
    flex: 1,
  },
  entityName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textDark,
  },
  entitySub: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textGray,
    marginTop: 1,
  },
  itemsBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: spacing.borderRadiusSm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 4,
    marginVertical: spacing.xs,
    gap: 4,
  },
  itemLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemQty: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.primary,
    width: 24,
  },
  itemName: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textDark,
    marginRight: 6,
  },
  itemPrice: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.textDark,
  },
  moreItemsText: {
    fontSize: 11,
    fontFamily: fonts.italic || fonts.regular,
    color: colors.textGray,
    paddingTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
  },
  dateCol: {
    gap: 2,
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textGray,
  },
  itemCountText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textLight,
  },
  totalCol: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    color: colors.textGray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  totalAmount: {
    fontSize: 17,
    fontFamily: fonts.headingBold,
    color: colors.primary,
  },
});

export default OrderCard;
