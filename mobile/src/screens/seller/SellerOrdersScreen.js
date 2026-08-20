import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatusBadge from '../../components/StatusBadge';
import OrderTypeBadge from '../../components/OrderTypeBadge';
import { colors, spacing, fonts } from '../../theme/colors';
import { useToast } from '../../context/ToastContext';
import DataService from '../../api/DataService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SellerOrdersScreen = () => {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = async () => {
    try {
      const sellerOrders = await DataService.getSellerOrders();
      setOrders(sellerOrders || []);
    } catch (err) {
      showToast('Error loading orders', 'error');
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

  const handleTabChange = (tab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await DataService.updateOrderStatus(orderId, newStatus);
      showToast(`Order updated to ${newStatus.replace(/_/g, ' ')}`);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId || o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRejectOrder = (orderId) => {
    Alert.alert(
      'Reject Order',
      'Are you sure you want to reject and cancel this customer order?',
      [
        { text: 'Back', style: 'cancel' },
        {
          text: 'Reject Order',
          style: 'destructive',
          onPress: () => handleUpdateStatus(orderId, 'CANCELLED'),
        },
      ]
    );
  };

  const handleWhatsAppCustomer = (order) => {
    const customerPhone = order.customer?.phone || '01812345678';
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`;
    const orderIdShort = order._id ? `#${order._id.slice(-6)}` : '#N/A';
    const message = encodeURIComponent(
      `Hello ${order.customer?.name || 'Customer'}, I am contacting you regarding your Bitezy order ${orderIdShort}.`
    );
    Linking.openURL(`https://wa.me/${intlPhone}?text=${message}`).catch(() => {
      Linking.openURL(`tel:${customerPhone}`).catch(() => {
        showToast('Could not open WhatsApp', 'error');
      });
    });
  };

  const handleCallCustomer = (order) => {
    const customerPhone = order.customer?.phone || '01812345678';
    Linking.openURL(`tel:${customerPhone}`).catch(() => {
      showToast('Could not start phone call', 'error');
    });
  };

  const filteredOrders = orders.filter((order) => {
    const isFinished = ['DELIVERED', 'PICKED_UP', 'CANCELLED'].includes(order.status);
    return activeTab === 'active' ? !isFinished : isFinished;
  });

  const activeCount = orders.filter(
    (o) => !['DELIVERED', 'PICKED_UP', 'CANCELLED'].includes(o.status)
  ).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + spacing.sm, 44) }]}>
        <Text style={styles.headerTitle}>Order Management</Text>
        <Text style={styles.headerSubtitle}>Manage incoming food requests & delivery statuses</Text>

        {/* Segmented Tabs */}
        <View style={styles.tabSegment}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'active' && styles.segmentBtnActive]}
            onPress={() => handleTabChange('active')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, activeTab === 'active' && styles.segmentTextActive]}>
              Active Orders
            </Text>
            {activeCount > 0 && (
              <View style={[styles.activeBadge, activeTab === 'active' && styles.activeBadgeHighlight]}>
                <Text style={[styles.activeBadgeText, activeTab === 'active' && styles.activeBadgeTextHighlight]}>
                  {activeCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'history' && styles.segmentBtnActive]}
            onPress={() => handleTabChange('history')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, activeTab === 'history' && styles.segmentTextActive]}>
              Order History
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          renderItem={({ item }) => {
            const orderIdShort = item._id ? `#${item._id.slice(-6)}` : '#N/A';
            const isDelivery = (item.type || '').toLowerCase() === 'delivery';
            const isUpdating = updatingId === (item._id || item.id);

            return (
              <View style={styles.orderCard}>
                {/* Card Top Row */}
                <View style={styles.cardTopRow}>
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.orderIdText}>{orderIdShort}</Text>
                      <OrderTypeBadge type={item.type} style={{ marginLeft: 6 }} />
                    </View>
                    <Text style={styles.orderTimeText}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                {/* Customer Details Box */}
                <View style={styles.customerBox}>
                  <View style={styles.customerInfoCol}>
                    <Text style={styles.customerName}>
                      {item.customer?.name || 'Student Buyer'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <Ionicons name="location-outline" size={12} color={colors.textGray} style={{ marginRight: 3 }} />
                      <Text style={styles.customerLocation} numberOfLines={1}>
                        {item.deliveryAddress || item.customer?.residence || 'CUET Campus'}
                      </Text>
                    </View>
                  </View>

                  {/* Customer Contact Action Buttons */}
                  <View style={styles.customerActionCol}>
                    <TouchableOpacity
                      style={styles.whatsAppPill}
                      onPress={() => handleWhatsAppCustomer(item)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="logo-whatsapp" size={13} color={colors.white} style={{ marginRight: 3 }} />
                      <Text style={styles.whatsAppPillText}>WhatsApp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.callPill}
                      onPress={() => handleCallCustomer(item)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="call" size={12} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Items Summary */}
                <View style={styles.itemsContainer}>
                  {Array.isArray(item.items) ? (
                    item.items.map((it, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemQty}>{it.qty || 1}x</Text>
                        <Text style={styles.itemName} numberOfLines={1}>{it.name}</Text>
                        <Text style={styles.itemPrice}>৳{(it.price || 0) * (it.qty || 1)}</Text>
                      </View>
                    ))
                  ) : null}
                </View>

                {/* Total & Divider */}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount:</Text>
                  <Text style={styles.totalVal}>৳ {item.total}</Text>
                </View>

                {/* Status Progression Action Buttons */}
                {item.status === 'PENDING' ? (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.acceptBtn]}
                      onPress={() => handleUpdateStatus(item._id || item.id, 'PREPARING')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={16} color={colors.white} style={{ marginRight: 4 }} />
                          <Text style={styles.actionBtnText}>Accept</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleRejectOrder(item._id || item.id)}
                      disabled={isUpdating}
                    >
                      <Ionicons name="close-circle" size={16} color={colors.danger} style={{ marginRight: 4 }} />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                ) : item.status === 'PREPARING' ? (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.sendBtn]}
                      onPress={() =>
                        handleUpdateStatus(
                          item._id || item.id,
                          isDelivery ? 'ON_THE_WAY' : 'READY'
                        )
                      }
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <>
                          <Ionicons
                            name={isDelivery ? 'bicycle' : 'notifications'}
                            size={16}
                            color={colors.white}
                            style={{ marginRight: 4 }}
                          />
                          <Text style={styles.actionBtnText}>
                            {isDelivery ? 'Send on Way' : 'Mark Ready'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : item.status === 'ON_THE_WAY' ? (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deliverBtn]}
                      onPress={() => handleUpdateStatus(item._id || item.id, 'DELIVERED')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <>
                          <Ionicons name="checkmark-done" size={16} color={colors.white} style={{ marginRight: 4 }} />
                          <Text style={styles.actionBtnText}>Mark Delivered</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : item.status === 'READY' ? (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deliverBtn]}
                      onPress={() => handleUpdateStatus(item._id || item.id, 'PICKED_UP')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <>
                          <Ionicons name="checkmark-done" size={16} color={colors.white} style={{ marginRight: 4 }} />
                          <Text style={styles.actionBtnText}>Mark Picked Up</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color={colors.textLight} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>No {activeTab} orders</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'active'
                  ? 'All incoming orders have been processed and completed.'
                  : 'No past orders recorded yet.'}
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
  header: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: fonts.headingExtraBold,
    fontSize: 20,
    color: colors.textDark,
  },
  headerSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textGray,
    marginTop: 2,
    marginBottom: spacing.md,
  },

  /* Tabs Segment */
  tabSegment: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: spacing.borderRadiusSm,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: spacing.borderRadiusSm - 2,
  },
  segmentBtnActive: {
    backgroundColor: colors.card,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textGray,
  },
  segmentTextActive: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  activeBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: spacing.borderRadiusFull,
    marginLeft: 6,
  },
  activeBadgeHighlight: {
    backgroundColor: colors.primary,
  },
  activeBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.textGray,
  },
  activeBadgeTextHighlight: {
    color: colors.white,
  },

  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* Order Card */
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderIdText: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
    color: colors.textDark,
  },
  orderTimeText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: spacing.borderRadiusSm,
    marginLeft: 8,
  },
  typeDelivery: { backgroundColor: colors.primaryLight },
  typePickup: { backgroundColor: '#F4ECF7' },
  typePillText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    textTransform: 'uppercase',
  },

  /* Customer Info Box */
  customerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFBFD',
    borderRadius: spacing.borderRadiusSm,
    padding: spacing.sm,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  customerInfoCol: { flex: 1, marginRight: spacing.xs },
  customerName: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textDark,
  },
  customerLocation: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textGray,
    marginTop: 2,
  },
  customerActionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  whatsAppPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: spacing.borderRadiusSm,
  },
  whatsAppPillText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.white,
  },
  callPill: {
    backgroundColor: colors.primaryLight,
    padding: 6,
    borderRadius: spacing.borderRadiusSm,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Items Container */
  itemsContainer: {
    paddingVertical: spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  itemQty: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
    width: 24,
  },
  itemName: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textDark,
    flex: 1,
  },
  itemPrice: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textGray,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs + 2,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textGray,
  },
  totalVal: {
    fontFamily: fonts.headingExtraBold,
    fontSize: 16,
    color: colors.primary,
  },

  /* Actions Row */
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm + 2,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: spacing.borderRadiusSm,
  },
  actionBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.white,
  },
  acceptBtn: {
    backgroundColor: colors.success,
    flex: 1,
  },
  rejectBtn: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    flex: 1,
  },
  rejectBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.danger,
  },
  sendBtn: {
    backgroundColor: '#2980B9',
  },
  deliverBtn: {
    backgroundColor: colors.success,
  },

  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
    color: colors.textDark,
  },
  emptySubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textGray,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
});

export default SellerOrdersScreen;
