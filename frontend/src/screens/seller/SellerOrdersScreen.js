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
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerEyebrow}>Operations</Text>
            <Text style={styles.headerTitle}>Order Management</Text>
            <Text style={styles.headerSubtitle}>Manage incoming food requests & delivery statuses</Text>
          </View>
          <View style={styles.headerIconBox}>
            <Ionicons name="receipt" size={18} color={colors.primary} />
          </View>
        </View>

        {/* Segmented Tabs */}
        <View style={styles.tabSegment}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'active' && styles.segmentBtnActive]}
            onPress={() => handleTabChange('active')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="flash"
              size={13}
              color={activeTab === 'active' ? colors.primary : colors.textGray}
              style={{ marginRight: 5 }}
            />
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
            <Ionicons
              name="archive-outline"
              size={13}
              color={activeTab === 'history' ? colors.primary : colors.textGray}
              style={{ marginRight: 5 }}
            />
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
                  <View style={{ flex: 1, marginRight: spacing.sm }}>
                    <Text style={styles.orderEyebrow}>Order</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <Text style={styles.orderIdText}>{orderIdShort}</Text>
                      <OrderTypeBadge type={item.type} style={{ marginLeft: 6 }} />
                    </View>
                    <View style={styles.orderTimeRow}>
                      <Ionicons name="time-outline" size={11} color={colors.textGray} style={{ marginRight: 3 }} />
                      <Text style={styles.orderTimeText}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </Text>
                    </View>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                {/* Customer Details Box */}
                <View style={styles.customerBox}>
                  <View style={styles.customerAvatar}>
                    <Text style={styles.customerAvatarText}>
                      {(item.customer?.name || 'S').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.customerInfoCol}>
                    <View style={styles.customerTopRow}>
                      <Text style={styles.customerEyebrow}>Customer</Text>
                      {item.customer?.buyerType ? (
                        <View style={[
                          styles.roleChip,
                          item.customer.buyerType === 'Staff' || item.customer.buyerType === 'Teacher'
                            ? styles.roleChipStaff
                            : styles.roleChipStudent,
                        ]}>
                          <Text style={[
                            styles.roleChipText,
                            item.customer.buyerType === 'Staff' || item.customer.buyerType === 'Teacher'
                              ? styles.roleChipTextStaff
                              : styles.roleChipTextStudent,
                          ]}>
                            {item.customer.buyerType}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.customerName} numberOfLines={1}>
                      {item.customer?.name || 'Student Buyer'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                      <Ionicons name="location" size={11} color={colors.primary} style={{ marginRight: 3 }} />
                      <Text style={styles.customerLocation} numberOfLines={1}>
                        {item.deliveryAddress || item.customer?.residence || 'CUET Campus'}
                      </Text>
                    </View>
                  </View>

                  {/* Customer Contact Action Buttons */}
                  <View style={styles.customerActionCol}>
                    <TouchableOpacity
                      style={styles.whatsappBtn}
                      onPress={() => handleWhatsAppCustomer(item)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="logo-whatsapp" size={16} color={colors.white} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => handleCallCustomer(item)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="call" size={14} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Special Instructions */}
                {item.notes ? (
                  <View style={styles.notesBox}>
                    <View style={styles.notesIconBox}>
                      <Ionicons name="chatbox-ellipses" size={14} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notesEyebrow}>Special Instructions</Text>
                      <Text style={styles.notesText}>"{item.notes}"</Text>
                    </View>
                  </View>
                ) : null}

                {/* Items Summary */}
                <View style={styles.itemsContainer}>
                  <Text style={styles.itemsEyebrow}>Items</Text>
                  {Array.isArray(item.items) ? (
                    item.items.map((it, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <View style={styles.qtyChip}>
                          <Text style={styles.qtyChipText}>{it.qty || 1}</Text>
                        </View>
                        <Text style={styles.itemName} numberOfLines={1}>{it.name}</Text>
                        <Text style={styles.itemPrice}>৳{(it.price || 0) * (it.qty || 1)}</Text>
                      </View>
                    ))
                  ) : null}
                </View>

                {/* Total & Divider */}
                <View style={styles.totalRow}>
                  <View style={styles.totalLabelCol}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalSub}>Inclusive of all items</Text>
                  </View>
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
              <View style={styles.emptyIconHalo}>
                <Ionicons name="receipt-outline" size={32} color={colors.primary} />
              </View>
              <Text style={styles.emptyEyebrow}>Nothing here yet</Text>
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
    paddingBottom: spacing.md,
    borderBottomLeftRadius: spacing.borderRadiusLg,
    borderBottomRightRadius: spacing.borderRadiusLg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 3,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primaryGlow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  headerEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: fonts.headingExtraBold,
    fontSize: 22,
    color: colors.textDark,
  },
  headerSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textGray,
    marginTop: 2,
  },

  /* Tabs Segment */
  tabSegment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: spacing.borderRadiusFull,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: spacing.borderRadiusFull,
  },
  segmentBtnActive: {
    backgroundColor: colors.card,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
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
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: spacing.borderRadiusFull,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
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
    flexGrow: 1,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* Order Card */
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  orderIdText: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
    color: colors.textDark,
  },
  orderTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  orderTimeText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textGray,
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
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  customerAvatarText: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
    color: colors.white,
  },
  customerInfoCol: { flex: 1, marginRight: spacing.xs },
  customerEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.textGray,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 1,
  },
  customerName: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textDark,
  },
  customerLocation: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textGray,
  },
  customerActionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  whatsappBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  roleChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: spacing.borderRadiusFull,
  },
  roleChipStaff: {
    backgroundColor: '#FEF3C7',
  },
  roleChipStudent: {
    backgroundColor: colors.infoLight,
  },
  roleChipText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  roleChipTextStaff: {
    color: '#B45309',
  },
  roleChipTextStudent: {
    color: colors.info,
  },

  /* Special Instructions Box */
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  notesIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    shadowColor: colors.primaryGlow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  notesEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  notesText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textDark,
    lineHeight: 17,
  },

  /* Items Container */
  itemsContainer: {
    paddingVertical: spacing.xs,
  },
  itemsEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.textGray,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  qtyChip: {
    width: 26,
    height: 22,
    borderRadius: spacing.borderRadiusSm,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  qtyChipText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
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
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabelCol: { flex: 1 },
  totalLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.textGray,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  totalSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  totalVal: {
    fontFamily: fonts.headingExtraBold,
    fontSize: 18,
    color: colors.primary,
  },

  /* Actions Row */
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: spacing.borderRadiusFull,
  },
  actionBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.white,
  },
  acceptBtn: {
    backgroundColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  rejectBtn: {
    backgroundColor: colors.dangerLight,
    flex: 1,
  },
  rejectBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.danger,
  },
  sendBtn: {
    backgroundColor: colors.info,
    shadowColor: colors.info,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  deliverBtn: {
    backgroundColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emptyIconHalo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.primaryGlow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  emptyEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
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
    marginTop: 6,
    maxWidth: 260,
    lineHeight: 18,
  },
});

export default SellerOrdersScreen;
