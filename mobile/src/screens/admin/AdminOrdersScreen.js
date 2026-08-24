import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors, fonts, spacing } from '../../theme/colors';
import AdminHeader from '../../components/AdminHeader';
import OrderCard from '../../components/OrderCard';
import DataService from '../../api/DataService';

const AdminOrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const allOrders = await DataService.getAllOrders();
      const sorted = [...allOrders].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setOrders(sorted);
    } catch (e) {
      console.warn('AdminOrdersScreen load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
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
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item._id || item.id)}
        renderItem={({ item }) => <OrderCard order={item} showItems />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>All System Orders</Text>
            <Text style={styles.subtitle}>
              {orders.length} orders across the platform
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No orders in the system.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      />
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
    paddingVertical: 60,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  header: {
    marginBottom: spacing.md,
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
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textGray,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
});

export default AdminOrdersScreen;
