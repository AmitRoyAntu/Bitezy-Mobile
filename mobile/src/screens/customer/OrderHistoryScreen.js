import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from '../../components/StatusBadge';
import { colors, spacing } from '../../theme/colors';
import DataService from '../../api/DataService';
import { useToast } from '../../context/ToastContext';

const OrderHistoryScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { showToast } = useToast();

  const loadOrders = async () => {
    try {
      const data = await DataService.getOrders();
      setOrders(data || []);
    } catch (err) {
      showToast('Error loading order history', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>My Orders</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          renderItem={({ item }) => {
            const itemsSummary = item.items
              ? item.items.map((i) => `${i.qty}x ${i.name}`).join(', ')
              : '';
            const orderIdShort = item._id ? `#${item._id.slice(-6)}` : '#N/A';
            const providerName = item.provider ? item.provider.name : item.providerName || 'Canteen';

            return (
              <View style={styles.orderCard}>
                <View style={styles.rowBetween}>
                  <Text style={styles.orderId}>{orderIdShort}</Text>
                  <StatusBadge status={item.status} />
                </View>

                <Text style={styles.providerName}>{providerName}</Text>
                <Text style={styles.itemsSummary}>{itemsSummary}</Text>

                <View style={styles.rowBetweenFooter}>
                  <Text style={styles.dateText}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                  </Text>
                  <Text style={styles.totalVal}>৳ {item.total}</Text>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="receipt-outline" size={40} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No orders placed yet</Text>
              <Text style={styles.emptySubtitle}>
                Your order history will appear here
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textDark,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listContent: { padding: spacing.lg },
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  orderId: { fontSize: 14, fontWeight: '700', color: colors.textDark },
  providerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginVertical: spacing.xs,
  },
  itemsSummary: { fontSize: 13, color: colors.textGray, marginBottom: spacing.sm },
  rowBetweenFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  dateText: { fontSize: 11, color: colors.textLight },
  totalVal: { fontSize: 16, fontWeight: '800', color: colors.textDark },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { padding: spacing.xl, alignItems: 'center', marginTop: 40 },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textDark },
  emptySubtitle: { fontSize: 13, color: colors.textGray, marginTop: spacing.xs },
});

export default OrderHistoryScreen;
