import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../theme/colors';
import AdminHeader from '../../components/AdminHeader';
import OrderCard from '../../components/OrderCard';
import StatusBadge from '../../components/StatusBadge';
import DataService from '../../api/DataService';

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Preparing', value: 'PREPARING' },
  { label: 'Ready', value: 'READY' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Picked Up', value: 'PICKED_UP' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const SORT_OPTIONS = [
  { label: 'Recent First', value: 'recent_desc', icon: 'time-outline' },
  { label: 'Oldest First', value: 'recent_asc', icon: 'timer-outline' },
  { label: 'Price: High to Low', value: 'price_desc', icon: 'arrow-down-outline' },
  { label: 'Price: Low to High', value: 'price_asc', icon: 'arrow-up-outline' },
];

const AdminOrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('recent_desc');

  // Selected Order for Modal Details
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      const allOrders = await DataService.getAllOrders();
      setOrders(allOrders || []);
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

  const filteredAndSortedOrders = useMemo(() => {
    let result = [...orders];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((o) => {
        const orderId = String(o._id || o.id || '').toLowerCase();
        const customerName = (
          typeof o.customer === 'object' ? o.customer?.name || '' : o.customer || ''
        ).toLowerCase();
        const providerName = (
          typeof o.provider === 'object' ? o.provider?.name || '' : o.providerName || ''
        ).toLowerCase();
        return orderId.includes(q) || customerName.includes(q) || providerName.includes(q);
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortOption === 'recent_desc') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortOption === 'recent_asc') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortOption === 'price_desc') {
        return (b.total || 0) - (a.total || 0);
      }
      if (sortOption === 'price_asc') {
        return (a.total || 0) - (b.total || 0);
      }
      return 0;
    });

    return result;
  }, [orders, statusFilter, searchQuery, sortOption]);

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
        data={filteredAndSortedOrders}
        keyExtractor={(item) => String(item._id || item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedOrder(item)}
            activeOpacity={0.8}
          >
            <OrderCard order={item} showItems />
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>All System Orders</Text>
            <Text style={styles.subtitle}>
              {filteredAndSortedOrders.length} of {orders.length} orders — tap any order for details
            </Text>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color={colors.textGray} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by order ID, student, or canteen..."
                placeholderTextColor={colors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textGray} />
                </TouchableOpacity>
              )}
            </View>

            {/* Sort Filter Selector */}
            <View style={styles.sortSection}>
              <Text style={styles.filterSectionLabel}>Sort By:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {SORT_OPTIONS.map((opt) => {
                  const isActive = sortOption === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.sortChip, isActive && styles.sortChipActive]}
                      onPress={() => setSortOption(opt.value)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={13}
                        color={isActive ? colors.white : colors.textGray}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.sortChipText,
                          isActive && styles.sortChipTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Status Filter Chips */}
            <View style={styles.statusSection}>
              <Text style={styles.filterSectionLabel}>Filter By Status:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {STATUS_FILTERS.map((f) => {
                  const isActive = statusFilter === f.value;
                  return (
                    <TouchableOpacity
                      key={f.value}
                      style={[styles.filterChip, isActive && styles.filterChipActive]}
                      onPress={() => setStatusFilter(f.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          isActive && styles.filterChipTextActive,
                        ]}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>No orders matched your filters.</Text>
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

      {/* FULL ORDER DETAIL INSPECTION MODAL */}
      <Modal
        visible={!!selectedOrder}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Order #{String(selectedOrder?._id || selectedOrder?.id || '').slice(-6)}
                </Text>
                <Text style={styles.modalSubtitle}>Full Order Inspection</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelectedOrder(null)}
              >
                <Ionicons name="close" size={20} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Status:</Text>
                  <StatusBadge status={selectedOrder.status} />
                </View>

                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Order Type:</Text>
                  <Text style={styles.orderDetailVal}>
                    {selectedOrder.type === 'delivery' ? '🛵 Room Delivery' : '🛍️ Self Pickup'}
                  </Text>
                </View>

                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Customer:</Text>
                  <Text style={styles.orderDetailVal}>
                    {typeof selectedOrder.customer === 'object'
                      ? selectedOrder.customer?.name
                      : selectedOrder.customer || 'Student'}
                  </Text>
                </View>

                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Canteen / Provider:</Text>
                  <Text style={styles.orderDetailVal}>
                    {typeof selectedOrder.provider === 'object'
                      ? selectedOrder.provider?.name
                      : selectedOrder.providerName || 'Vendor'}
                  </Text>
                </View>

                {selectedOrder.deliveryAddress ? (
                  <View style={styles.orderDetailRow}>
                    <Text style={styles.orderDetailLabel}>Delivery Address:</Text>
                    <Text style={styles.orderDetailVal}>{selectedOrder.deliveryAddress}</Text>
                  </View>
                ) : null}

                {selectedOrder.createdAt && (
                  <View style={styles.orderDetailRow}>
                    <Text style={styles.orderDetailLabel}>Placed At:</Text>
                    <Text style={styles.orderDetailVal}>
                      {new Date(selectedOrder.createdAt).toLocaleString()}
                    </Text>
                  </View>
                )}

                <Text style={[styles.modalSectionLabel, { marginTop: 14 }]}>Items Ordered:</Text>
                <View style={styles.orderItemsBox}>
                  {(selectedOrder.items || []).map((item, i) => (
                    <View key={i} style={styles.itemLine}>
                      <Text style={styles.itemLineQty}>{item.qty || item.quantity || 1}x</Text>
                      <Text style={styles.itemLineName}>{item.name}</Text>
                      <Text style={styles.itemLinePrice}>
                        ৳{(item.price || 0) * (item.qty || item.quantity || 1)}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.orderSummaryBox}>
                  <View style={styles.summaryLine}>
                    <Text style={styles.sumLineLabel}>Subtotal</Text>
                    <Text style={styles.sumLineVal}>৳{selectedOrder.subtotal || selectedOrder.total}</Text>
                  </View>
                  <View style={styles.summaryLine}>
                    <Text style={styles.sumLineLabel}>Delivery Fee</Text>
                    <Text style={styles.sumLineVal}>৳{selectedOrder.deliveryFee || 0}</Text>
                  </View>
                  <View style={[styles.summaryLine, styles.totalLine]}>
                    <Text style={styles.totalLineLabel}>Total Amount</Text>
                    <Text style={styles.totalLineVal}>৳{selectedOrder.total}</Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  listContent: {
    padding: spacing.md,
    paddingBottom: 120, // Generous padding so FloatingTabBar never covers the last order
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
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm + 4,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textDark,
    marginLeft: spacing.sm,
  },
  filterSectionLabel: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.textGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sortSection: {
    marginBottom: spacing.sm + 4,
  },
  statusSection: {
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.xs + 4,
    paddingVertical: 2,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  sortChipText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textDark,
  },
  sortChipTextActive: {
    color: colors.white,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textGray,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textGray,
    fontFamily: fonts.regular,
    fontSize: 14,
    marginTop: spacing.sm,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: spacing.borderRadiusLg,
    borderTopRightRadius: spacing.borderRadiusLg,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textGray,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSectionLabel: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.textGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  orderDetailLabel: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textGray,
  },
  orderDetailVal: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textDark,
  },
  orderItemsBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: spacing.borderRadiusSm,
    padding: spacing.sm + 4,
    marginBottom: spacing.sm + 4,
  },
  itemLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  itemLineQty: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.primary,
    width: 30,
  },
  itemLineName: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textDark,
    flex: 1,
  },
  itemLinePrice: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textDark,
  },
  orderSummaryBox: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    gap: 4,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sumLineLabel: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textGray,
  },
  sumLineVal: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textDark,
  },
  totalLine: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLineLabel: {
    fontSize: 15,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
  },
  totalLineVal: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    color: colors.primary,
  },
});

export default AdminOrdersScreen;
