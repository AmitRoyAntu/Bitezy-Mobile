import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import {
  DEMO_ORDERS,
  DEMO_USERS,
  getBuyers,
  getSellers,
  getTotalRevenue,
  getRecentOrders,
} from '../constants/demoData';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import OrderCard from '../components/OrderCard';

export default function DashboardScreen() {
  const totalRevenue = getTotalRevenue();
  const totalOrders = DEMO_ORDERS.length;
  const buyers = getBuyers();
  const sellers = getSellers();
  const recentOrders = getRecentOrders(5);

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>
          High-level overview of the entire platform.
        </Text>

        {/* Stats Row — 2x2 grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              label="Total Revenue"
              value={`৳ ${totalRevenue.toLocaleString()}`}
              trend="All-time"
              trendColor={COLORS.success}
            />
            <StatCard
              label="Total Orders"
              value={totalOrders.toString()}
              trend="Across all sellers"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              label="Registered Users"
              value={buyers.length.toString()}
              trend="Student accounts"
            />
            <StatCard
              label="Active Sellers"
              value={sellers.length.toString()}
              trend="Canteens & Carts"
            />
          </View>
        </View>

        {/* Recent Global Orders */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Global Orders</Text>
          {recentOrders.length === 0 ? (
            <Text style={styles.emptyText}>No orders yet.</Text>
          ) : (
            recentOrders.map(order => (
              <OrderCard key={order._id} order={order} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.paddingScreen,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.poppinsBold,
    color: COLORS.dark,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.gray,
    marginBottom: 24,
  },
  statsGrid: {
    gap: 14,
    marginBottom: 28,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 20,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: FONTS.poppinsSemiBold,
    color: COLORS.dark,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    paddingVertical: 20,
    fontFamily: FONTS.regular,
    fontSize: 14,
  },
});
