import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors, fonts, spacing } from '../../theme/colors';
import AdminHeader from '../../components/AdminHeader';
import StatCard from '../../components/StatCard';
import OrderCard from '../../components/OrderCard';
import DataService from '../../api/DataService';

const AdminDashboardScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalSellers: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const [allOrders, allUsers] = await Promise.all([
        DataService.getAllOrders(),
        DataService.getUsers(),
      ]);

      const buyers = allUsers.filter((u) => u.role === 'buyer');
      const sellers = allUsers.filter((u) => u.role === 'seller');
      const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      setStats({
        totalRevenue,
        totalOrders: allOrders.length,
        totalUsers: buyers.length,
        totalSellers: sellers.length,
      });

      const sorted = [...allOrders].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setRecentOrders(sorted.slice(0, 5));
    } catch (e) {
      console.warn('AdminDashboard load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminHeader />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Platform overview — live data</Text>

        {/* Stats 2x2 Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              label="Total Revenue"
              value={`৳ ${stats.totalRevenue.toLocaleString()}`}
              trend="All-time"
              trendColor={colors.success}
            />
            <StatCard
              label="Total Orders"
              value={stats.totalOrders.toString()}
              trend="Across all sellers"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              label="Registered Users"
              value={stats.totalUsers.toString()}
              trend="Student accounts"
            />
            <StatCard
              label="Active Sellers"
              value={stats.totalSellers.toString()}
              trend="Canteens & Carts"
              trendColor={colors.info}
            />
          </View>
        </View>

        {/* Recent Global Orders */}
        <Text style={styles.sectionTitle}>Recent Global Orders</Text>
        <View style={styles.sectionCard}>
          {recentOrders.length === 0 ? (
            <Text style={styles.emptyText}>No orders yet.</Text>
          ) : (
            recentOrders.map((order) => (
              <OrderCard key={order._id || order.id} order={order} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textGray,
    marginBottom: spacing.md + 4,
  },
  statsGrid: {
    gap: spacing.sm,
    marginBottom: spacing.md + 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textGray,
    paddingVertical: spacing.lg,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
});

export default AdminDashboardScreen;
