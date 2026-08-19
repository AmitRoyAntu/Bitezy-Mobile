import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS } from '../constants/theme';

export default function SellerCard({ seller, shopName, location, totalOrders, totalRevenue }) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.nameSection}>
          <View style={styles.shopIcon}>
            <Ionicons name="storefront" size={18} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shopName}>{shopName}</Text>
            <Text style={styles.ownerName}>{seller.name}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="close-circle" size={18} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.locationRow}>
        <View style={styles.locationBadge}>
          <Ionicons name="location" size={12} color={COLORS.gray} />
          <Text style={styles.locationText}>{location}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Orders</Text>
          <Text style={styles.statValue}>{totalOrders}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Revenue</Text>
          <Text style={[styles.statValue, { color: COLORS.dark }]}>
            ৳{totalRevenue.toLocaleString()}
          </Text>
        </View>
      </View>
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
    marginBottom: 12,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  shopIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopName: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: COLORS.dark,
  },
  ownerName: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.gray,
    marginTop: 1,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationRow: {
    marginBottom: 14,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f2f6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  locationText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.gray,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    padding: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontFamily: FONTS.poppinsSemiBold,
    color: COLORS.dark,
  },
  divider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
});
