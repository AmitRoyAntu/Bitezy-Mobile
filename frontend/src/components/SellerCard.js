import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../theme/colors';

const SellerCard = ({
  seller,
  shopName,
  location,
  totalOrders,
  totalRevenue,
  onToggleBlock,
}) => {
  const isBlocked = !!seller?.isBlocked;

  return (
    <View style={[styles.card, isBlocked && styles.cardBlocked]}>
      <View style={styles.topRow}>
        <View style={styles.nameSection}>
          <View style={[styles.shopIcon, isBlocked && styles.shopIconBlocked]}>
            <Ionicons
              name="storefront-outline"
              size={20}
              color={isBlocked ? colors.danger : colors.primary}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.shopName} numberOfLines={1}>
              {shopName || 'Provider Profile'}
            </Text>
            <Text style={styles.ownerName} numberOfLines={1}>
              {seller ? seller.name : 'Unknown Owner'}
            </Text>
          </View>
        </View>

        {onToggleBlock && (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: isBlocked ? colors.successLight : colors.dangerLight },
            ]}
            onPress={() => onToggleBlock(seller._id || seller.id, isBlocked)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isBlocked ? 'checkmark-circle-outline' : 'ban-outline'}
              size={16}
              color={isBlocked ? colors.success : colors.danger}
            />
          </TouchableOpacity>
        )}
      </View>

      {location ? (
        <View style={styles.locationRow}>
          <View style={styles.locationBadge}>
            <Ionicons name="location-outline" size={13} color={colors.textGray} />
            <Text style={styles.locationText} numberOfLines={1}>
              {location}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Orders</Text>
          <Text style={styles.statValue}>{totalOrders !== undefined ? totalOrders : 0}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Revenue</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            ৳{(totalRevenue || 0).toLocaleString()}
          </Text>
        </View>
      </View>

      {isBlocked && (
        <View style={styles.blockedBanner}>
          <Ionicons name="ban" size={12} color={colors.danger} />
          <Text style={styles.blockedText}>Seller Suspended & Storefront Closed</Text>
        </View>
      )}
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
  cardBlocked: {
    borderColor: colors.dangerBorder,
    backgroundColor: '#FFFAFA',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm + 2,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    flex: 1,
    marginRight: spacing.sm,
  },
  shopIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopIconBlocked: {
    backgroundColor: colors.dangerLight,
  },
  textContainer: {
    flex: 1,
  },
  shopName: {
    fontSize: 15,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
  },
  ownerName: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textGray,
    marginTop: 1,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationRow: {
    marginBottom: spacing.sm + 2,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  locationText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textGray,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: spacing.borderRadiusSm,
    padding: spacing.sm + 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    color: colors.textGray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textDark,
  },
  divider: {
    width: 1,
    backgroundColor: colors.borderDark,
    marginHorizontal: 8,
  },
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm + 2,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: '#FFEBEE',
  },
  blockedText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.danger,
  },
});

export default SellerCard;
