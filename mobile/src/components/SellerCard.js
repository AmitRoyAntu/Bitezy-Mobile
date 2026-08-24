import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../theme/colors';

const SellerCard = ({ seller, shopName, location, totalOrders, totalRevenue }) => {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.nameSection}>
          <View style={styles.shopIcon}>
            <Ionicons name="storefront-outline" size={20} color={colors.primary} />
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
    marginBottom: spacing.sm + 2,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    flex: 1,
  },
  shopIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
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
});

export default SellerCard;
