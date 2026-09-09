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
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../theme/colors';
import AdminHeader from '../../components/AdminHeader';
import OrderCard from '../../components/OrderCard';
import StatusBadge from '../../components/StatusBadge';
import Toast from '../../components/Toast';
import DataService from '../../api/DataService';

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Preparing', value: 'PREPARING' },
  { label: 'Ready', value: 'READY' },
  { label: 'On The Way', value: 'ON_THE_WAY' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Picked Up', value: 'PICKED_UP' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const SORT_OPTIONS = [
  { label: 'Recent First', value: 'recent_desc', icon: 'time-outline' },
  { label: 'Oldest First', value: 'recent_asc', icon: 'timer-outline' },
  { label: 'Amount: High to Low', value: 'price_desc', icon: 'arrow-down-outline' },
  { label: 'Amount: Low to High', value: 'price_asc', icon: 'arrow-up-outline' },
];

const AdminOrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('recent_desc');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // Selected Order for Modal Details & Actions
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const allOrders = await DataService.getAdminOrders();
      setOrders(allOrders || []);
    } catch (e) {
      console.warn('AdminOrdersScreen load error:', e);
      setToast({
        visible: true,
        message: 'Failed to load orders from database',
        type: 'error',
      });
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

  // Live summary metrics calculated directly from database orders
  const summaryMetrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const activeOrders = orders.filter((o) =>
      ['PENDING', 'PREPARING', 'READY', 'ON_THE_WAY'].includes(o.status)
    ).length;
    const completedOrders = orders.filter((o) =>
      ['DELIVERED', 'PICKED_UP'].includes(o.status)
    ).length;
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED').length;

    return {
      totalOrders,
      totalRevenue,
      activeOrders,
      completedOrders,
      cancelledOrders,
    };
  }, [orders]);

  // Counts by status for dynamic filter chip badges
  const statusCounts = useMemo(() => {
    const counts = { all: orders.length };
    STATUS_FILTERS.forEach((f) => {
      if (f.value !== 'all') {
        counts[f.value] = orders.filter((o) => o.status === f.value).length;
      }
    });
    return counts;
  }, [orders]);

  // Status transition handler for Admin
  const handleUpdateStatus = useCallback(
    async (orderId, nextStatus) => {
      const targetOrder = orders.find((o) => String(o._id || o.id) === String(orderId));
      const shortId = '#' + String(orderId).slice(-6);
      const confirmMsg = `Are you sure you want to update order ${shortId} to "${nextStatus.replace(/_/g, ' ')}"?`;

      const executeUpdate = async () => {
        setIsUpdatingStatus(true);
        try {
          await DataService.updateOrderStatus(orderId, nextStatus);

          // Optimistic local state update
          setOrders((prev) =>
            prev.map((o) =>
              String(o._id || o.id) === String(orderId) ? { ...o, status: nextStatus } : o
            )
          );

          if (selectedOrder && String(selectedOrder._id || selectedOrder.id) === String(orderId)) {
            setSelectedOrder((prev) => ({ ...prev, status: nextStatus }));
          }

          setToast({
            visible: true,
            message: `Order ${shortId} updated to ${nextStatus.replace(/_/g, ' ')}`,
            type: 'success',
          });
        } catch (err) {
          console.warn('Status update error:', err);
          setToast({
            visible: true,
            message: err.message || 'Failed to update order status in database',
            type: 'error',
          });
        } finally {
          setIsUpdatingStatus(false);
        }
      };

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.confirm(confirmMsg)) {
          executeUpdate();
        }
        return;
      }

      Alert.alert('Update Order Status', confirmMsg, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: nextStatus === 'CANCELLED' ? 'destructive' : 'default',
          onPress: executeUpdate,
        },
      ]);
    },
    [orders, selectedOrder]
  );

  // Filtered & Sorted orders
  const filteredAndSortedOrders = useMemo(() => {
    let result = [...orders];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter);
    }

    // Search filter across multiple fields
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((o) => {
        const orderId = String(o._id || o.id || '').toLowerCase();
        const shortId = orderId.slice(-6);

        const customerName = (
          typeof o.customer === 'object' ? o.customer?.name || '' : o.customer || ''
        ).toLowerCase();
        const customerEmail = (
          typeof o.customer === 'object' ? o.customer?.email || '' : ''
        ).toLowerCase();
        const customerPhone = (
          typeof o.customer === 'object' ? o.customer?.phone || '' : ''
        ).toLowerCase();
        const customerDept = (
          typeof o.customer === 'object' ? o.customer?.department || '' : ''
        ).toLowerCase();
        const customerId = (
          typeof o.customer === 'object' ? o.customer?.cuetId || '' : ''
        ).toLowerCase();

        const providerName = (
          typeof o.provider === 'object' ? o.provider?.name || '' : o.providerName || ''
        ).toLowerCase();
        const providerLocation = (
          typeof o.provider === 'object' ? o.provider?.location || '' : ''
        ).toLowerCase();

        const deliveryAddress = (o.deliveryAddress || '').toLowerCase();
        const couponCode = (o.couponCode || '').toLowerCase();
        const orderType = (o.type || '').toLowerCase();

        const itemsMatch = Array.isArray(o.items)
          ? o.items.some((i) => (i.name || '').toLowerCase().includes(q))
          : false;

        return (
          orderId.includes(q) ||
          shortId.includes(q) ||
          customerName.includes(q) ||
          customerEmail.includes(q) ||
          customerPhone.includes(q) ||
          customerDept.includes(q) ||
          customerId.includes(q) ||
          providerName.includes(q) ||
          providerLocation.includes(q) ||
          deliveryAddress.includes(q) ||
          couponCode.includes(q) ||
          orderType.includes(q) ||
          itemsMatch
        );
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortOption === 'recent_desc') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortOption === 'recent_asc') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortOption === 'price_desc') {
        return (Number(b.total) || 0) - (Number(a.total) || 0);
      }
      if (sortOption === 'price_asc') {
        return (Number(a.total) || 0) - (Number(b.total) || 0);
      }
      return 0;
    });

    return result;
  }, [orders, statusFilter, searchQuery, sortOption]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading campus orders from database...</Text>
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
              Monitor, inspect, and update live campus canteen orders from database
            </Text>

            {/* Quick Metrics Bar from Database */}
            <View style={styles.summaryBar}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryVal}>{summaryMetrics.totalOrders}</Text>
                <Text style={styles.summaryLbl}>Orders</Text>
              </View>
              <View style={styles.summaryDiv} />
              <View style={styles.summaryCol}>
                <Text style={[styles.summaryVal, { color: colors.primary }]}>
                  ৳{summaryMetrics.totalRevenue.toLocaleString()}
                </Text>
                <Text style={styles.summaryLbl}>Volume</Text>
              </View>
              <View style={styles.summaryDiv} />
              <View style={styles.summaryCol}>
                <Text style={[styles.summaryVal, { color: colors.warning }]}>
                  {summaryMetrics.activeOrders}
                </Text>
                <Text style={styles.summaryLbl}>Active</Text>
              </View>
              <View style={styles.summaryDiv} />
              <View style={styles.summaryCol}>
                <Text style={[styles.summaryVal, { color: colors.success }]}>
                  {summaryMetrics.completedOrders}
                </Text>
                <Text style={styles.summaryLbl}>Completed</Text>
              </View>
            </View>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color={colors.textGray} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by order ID, student, canteen, item..."
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

            {/* Sort Selector */}
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

            {/* Status Filter Chips with Dynamic Database Counts */}
            <View style={styles.statusSection}>
              <Text style={styles.filterSectionLabel}>Filter By Status:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {STATUS_FILTERS.map((f) => {
                  const isActive = statusFilter === f.value;
                  const count = statusCounts[f.value] || 0;
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
                        {f.label} ({count})
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

      {/* FULL ORDER DETAIL INSPECTION & STATUS MANAGEMENT MODAL */}
      <Modal
        visible={!!selectedOrder}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Order #{String(selectedOrder?._id || selectedOrder?.id || '').slice(-6)}
                </Text>
                <Text style={styles.modalSubtitle}>Full Order Inspection & Controls</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelectedOrder(null)}
              >
                <Ionicons name="close" size={20} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                {/* Status & Type Bar */}
                <View style={styles.modalStatusRow}>
                  <StatusBadge status={selectedOrder.status} />
                  <View style={styles.typeBadgeModal}>
                    <Ionicons
                      name={selectedOrder.type === 'delivery' ? 'bicycle-outline' : 'bag-handle-outline'}
                      size={14}
                      color={selectedOrder.type === 'delivery' ? colors.primary : colors.secondary}
                    />
                    <Text style={styles.typeBadgeModalText}>
                      {selectedOrder.type === 'delivery' ? 'Room Delivery' : 'Self Pickup'}
                    </Text>
                  </View>
                </View>

                {/* Customer Information Section */}
                <Text style={styles.sectionHeader}>Customer Details</Text>
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={15} color={colors.primary} />
                    <Text style={styles.infoLabel}>Name:</Text>
                    <Text style={styles.infoVal}>
                      {typeof selectedOrder.customer === 'object'
                        ? selectedOrder.customer?.name || 'Campus Buyer'
                        : selectedOrder.customer || 'Campus Buyer'}
                    </Text>
                  </View>

                  {selectedOrder.customer?.email && (
                    <TouchableOpacity
                      style={styles.infoRow}
                      onPress={() => Linking.openURL(`mailto:${selectedOrder.customer.email}`)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="mail-outline" size={15} color={colors.textGray} />
                      <Text style={styles.infoLabel}>Email:</Text>
                      <Text style={[styles.infoVal, { color: colors.primary, textDecorationLine: 'underline' }]}>
                        {selectedOrder.customer.email}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {selectedOrder.customer?.phone && (
                    <TouchableOpacity
                      style={styles.infoRow}
                      onPress={() => Linking.openURL(`tel:${selectedOrder.customer.phone}`)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="call-outline" size={15} color={colors.textGray} />
                      <Text style={styles.infoLabel}>Phone:</Text>
                      <Text style={[styles.infoVal, { color: colors.primary, textDecorationLine: 'underline' }]}>
                        {selectedOrder.customer.phone}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {(selectedOrder.customer?.department || selectedOrder.customer?.cuetId) && (
                    <View style={styles.infoRow}>
                      <Ionicons name="school-outline" size={15} color={colors.textGray} />
                      <Text style={styles.infoLabel}>Dept / ID:</Text>
                      <Text style={styles.infoVal}>
                        {selectedOrder.customer.department || 'N/A'}
                        {selectedOrder.customer.cuetId ? ` • ID: ${selectedOrder.customer.cuetId}` : ''}
                      </Text>
                    </View>
                  )}

                  {selectedOrder.deliveryAddress ? (
                    <View style={styles.infoRow}>
                      <Ionicons name="location-outline" size={15} color={colors.textGray} />
                      <Text style={styles.infoLabel}>Address:</Text>
                      <Text style={styles.infoVal}>{selectedOrder.deliveryAddress}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Canteen Information Section */}
                <Text style={styles.sectionHeader}>Canteen / Provider Details</Text>
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Ionicons name="storefront-outline" size={15} color={colors.secondary} />
                    <Text style={styles.infoLabel}>Shop:</Text>
                    <Text style={styles.infoVal}>
                      {typeof selectedOrder.provider === 'object'
                        ? selectedOrder.provider?.name || 'Campus Canteen'
                        : selectedOrder.providerName || 'Campus Canteen'}
                    </Text>
                  </View>

                  {selectedOrder.provider?.location && (
                    <View style={styles.infoRow}>
                      <Ionicons name="map-outline" size={15} color={colors.textGray} />
                      <Text style={styles.infoLabel}>Location:</Text>
                      <Text style={styles.infoVal}>{selectedOrder.provider.location}</Text>
                    </View>
                  )}

                  {selectedOrder.createdAt && (
                    <View style={styles.infoRow}>
                      <Ionicons name="time-outline" size={15} color={colors.textGray} />
                      <Text style={styles.infoLabel}>Placed At:</Text>
                      <Text style={styles.infoVal}>
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Itemized Breakdown Section */}
                <Text style={styles.sectionHeader}>Items Ordered ({selectedOrder.items?.length || 0})</Text>
                <View style={styles.orderItemsBox}>
                  {(selectedOrder.items || []).map((item, i) => (
                    <View key={i} style={styles.itemLine}>
                      <Text style={styles.itemLineQty}>{item.qty || item.quantity || 1}x</Text>
                      <Text style={styles.itemLineName}>{item.name}</Text>
                      <Text style={styles.itemLinePrice}>
                        ৳{((Number(item.price) || 0) * (Number(item.qty || item.quantity) || 1)).toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Billing Summary Box */}
                <View style={styles.orderSummaryBox}>
                  <View style={styles.summaryLine}>
                    <Text style={styles.sumLineLabel}>Subtotal</Text>
                    <Text style={styles.sumLineVal}>
                      ৳{Number(selectedOrder.subtotal || selectedOrder.total).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.summaryLine}>
                    <Text style={styles.sumLineLabel}>Delivery Fee</Text>
                    <Text style={styles.sumLineVal}>৳{Number(selectedOrder.deliveryFee || 0).toLocaleString()}</Text>
                  </View>

                  {(selectedOrder.discount > 0 || selectedOrder.couponCode) && (
                    <View style={styles.summaryLine}>
                      <Text style={[styles.sumLineLabel, { color: colors.success }]}>
                        Discount {selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : ''}
                      </Text>
                      <Text style={[styles.sumLineVal, { color: colors.success, fontFamily: fonts.bold }]}>
                        -৳{Number(selectedOrder.discount || 0).toLocaleString()}
                      </Text>
                    </View>
                  )}

                  <View style={[styles.summaryLine, styles.totalLine]}>
                    <Text style={styles.totalLineLabel}>Total Bill</Text>
                    <Text style={styles.totalLineVal}>৳{Number(selectedOrder.total || 0).toLocaleString()}</Text>
                  </View>
                </View>

                {/* ADMIN STATUS CONTROLS */}
                <Text style={[styles.sectionHeader, { marginTop: spacing.md }]}>Admin Status Controls</Text>
                <View style={styles.actionControlsBox}>
                  {selectedOrder.status === 'PENDING' && (
                    <View style={styles.actionBtnRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.info }]}
                        onPress={() => handleUpdateStatus(selectedOrder._id || selectedOrder.id, 'PREPARING')}
                        disabled={isUpdatingStatus}
                      >
                        <Ionicons name="restaurant-outline" size={16} color={colors.white} />
                        <Text style={styles.actionBtnText}>Accept & Prepare</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.danger }]}
                        onPress={() => handleUpdateStatus(selectedOrder._id || selectedOrder.id, 'CANCELLED')}
                        disabled={isUpdatingStatus}
                      >
                        <Ionicons name="close-circle-outline" size={16} color={colors.white} />
                        <Text style={styles.actionBtnText}>Cancel Order</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {selectedOrder.status === 'PREPARING' && (
                    <View style={styles.actionBtnRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.purple }]}
                        onPress={() => handleUpdateStatus(selectedOrder._id || selectedOrder.id, 'READY')}
                        disabled={isUpdatingStatus}
                      >
                        <Ionicons name="bag-check-outline" size={16} color={colors.white} />
                        <Text style={styles.actionBtnText}>Mark as Ready</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.danger }]}
                        onPress={() => handleUpdateStatus(selectedOrder._id || selectedOrder.id, 'CANCELLED')}
                        disabled={isUpdatingStatus}
                      >
                        <Ionicons name="close-circle-outline" size={16} color={colors.white} />
                        <Text style={styles.actionBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {selectedOrder.status === 'READY' && (
                    <View style={styles.actionBtnRow}>
                      {selectedOrder.type === 'delivery' ? (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: colors.purple }]}
                          onPress={() => handleUpdateStatus(selectedOrder._id || selectedOrder.id, 'ON_THE_WAY')}
                          disabled={isUpdatingStatus}
                        >
                          <Ionicons name="bicycle-outline" size={16} color={colors.white} />
                          <Text style={styles.actionBtnText}>Dispatch (On The Way)</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: colors.success }]}
                          onPress={() => handleUpdateStatus(selectedOrder._id || selectedOrder.id, 'PICKED_UP')}
                          disabled={isUpdatingStatus}
                        >
                          <Ionicons name="checkmark-done-circle-outline" size={16} color={colors.white} />
                          <Text style={styles.actionBtnText}>Mark as Picked Up</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {selectedOrder.status === 'ON_THE_WAY' && (
                    <View style={styles.actionBtnRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.success }]}
                        onPress={() => handleUpdateStatus(selectedOrder._id || selectedOrder.id, 'DELIVERED')}
                        disabled={isUpdatingStatus}
                      >
                        <Ionicons name="checkmark-done-circle-outline" size={16} color={colors.white} />
                        <Text style={styles.actionBtnText}>Mark as Delivered</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {['DELIVERED', 'PICKED_UP', 'CANCELLED'].includes(selectedOrder.status) && (
                    <View style={styles.completedNotice}>
                      <Ionicons
                        name={selectedOrder.status === 'CANCELLED' ? 'close-circle' : 'checkmark-circle'}
                        size={20}
                        color={selectedOrder.status === 'CANCELLED' ? colors.danger : colors.success}
                      />
                      <Text
                        style={[
                          styles.completedNoticeText,
                          { color: selectedOrder.status === 'CANCELLED' ? colors.danger : colors.success },
                        ]}
                      >
                        This order is finalized ({selectedOrder.status.replace(/_/g, ' ')}).
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Instant Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
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
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textGray,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 120, // FloatingTabBar clearance
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
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryVal: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textDark,
  },
  summaryLbl: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    color: colors.textGray,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryDiv: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
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
    height: '100%',
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textDark,
    marginLeft: spacing.sm,
  },
  sortSection: {
    marginBottom: spacing.sm + 2,
  },
  statusSection: {
    marginBottom: 4,
  },
  filterSectionLabel: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.textGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.xs + 4,
    paddingVertical: 2,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  sortChipText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textDark,
  },
  sortChipTextActive: {
    color: colors.white,
    fontFamily: fonts.semiBold,
  },
  filterChip: {
    paddingHorizontal: spacing.sm + 4,
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
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textDark,
  },
  filterChipTextActive: {
    color: colors.white,
    fontFamily: fonts.bold,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.md,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm + 4,
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
    fontSize: 12,
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
  modalStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  typeBadgeModal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  typeBadgeModalText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.textDark,
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.textGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: spacing.borderRadiusSm,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.textGray,
    width: 60,
  },
  infoVal: {
    flex: 1,
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
    alignItems: 'center',
    paddingVertical: 5,
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
    gap: 5,
    marginBottom: spacing.sm,
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
    fontSize: 17,
    fontFamily: fonts.headingBold,
    color: colors.primary,
  },
  actionControlsBox: {
    marginTop: 4,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: spacing.borderRadiusSm,
  },
  actionBtnText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  completedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surfaceSubtle,
    paddingVertical: 12,
    borderRadius: spacing.borderRadiusSm,
  },
  completedNoticeText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
  },
});

export default AdminOrdersScreen;
