import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatusBadge from '../../components/StatusBadge';
import { colors, spacing, fonts } from '../../theme/colors';
import DataService from '../../api/DataService';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

const TIMELINE_STEPS = [
  { key: 'PLACED', label: 'Placed', icon: 'receipt-outline', desc: 'Order received by canteen' },
  { key: 'PREPARING', label: 'Kitchen', icon: 'restaurant-outline', desc: 'Preparing your fresh meal' },
  { key: 'READY', label: 'On Way', icon: 'bicycle-outline', desc: 'Dispatched / Ready for pickup' },
  { key: 'COMPLETED', label: 'Delivered', icon: 'checkmark-circle-outline', desc: 'Delivered to your hall' },
];

const getStepIndex = (status) => {
  switch (status) {
    case 'PENDING':
      return 0;
    case 'PREPARING':
      return 1;
    case 'READY':
    case 'ON_THE_WAY':
      return 2;
    case 'DELIVERED':
    case 'PICKED_UP':
      return 3;
    default:
      return -1;
  }
};

const getStatusMessage = (status, orderType) => {
  const isDelivery = orderType === 'delivery';
  switch (status) {
    case 'PENDING':
      return 'Waiting for canteen confirmation...';
    case 'PREPARING':
      return '👨‍🍳 Chef is currently preparing your meal';
    case 'READY':
      return isDelivery ? '🚴 Order is ready & on the way!' : '🛍️ Your order is ready for pickup!';
    case 'ON_THE_WAY':
      return '🚴 Rider is on the way to your hall';
    case 'DELIVERED':
    case 'PICKED_UP':
      return '✨ Order completed. Enjoy your meal!';
    case 'CANCELLED':
      return '❌ This order was cancelled.';
    default:
      return 'Processing order...';
  }
};

const OrderHistoryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { reorderOrder, cart, currentProviderName } = useCart();
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

  const handleCall = (phoneNumber) => {
    const phone = phoneNumber || '01811112222';
    Linking.openURL(`tel:${phone}`).catch(() => {
      showToast(`Phone dialer unavailable. Number: ${phone}`, 'info');
    });
  };

  const handleWhatsApp = (phoneNumber, orderId, providerName) => {
    let cleanPhone = (phoneNumber || '01811112222').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '88' + cleanPhone;
    } else if (!cleanPhone.startsWith('88')) {
      cleanPhone = '88' + cleanPhone;
    }

    const message = encodeURIComponent(
      `Hello ${providerName || 'Canteen'}, I am inquiring regarding my Bitezy order ${orderId ? `#${orderId}` : ''}.`
    );
    const url = `https://wa.me/${cleanPhone}?text=${message}`;

    Linking.openURL(url).catch(() => {
      showToast(`Could not open WhatsApp for ${phoneNumber}`, 'info');
    });
  };

  const handleReorder = (order) => {
    if (!order.items || order.items.length === 0) {
      showToast('No items found in this order', 'warning');
      return;
    }

    const providerName =
      (order.provider && typeof order.provider === 'object'
        ? order.provider.name
        : order.providerName) || 'Canteen';

    const proceedReorder = () => {
      reorderOrder(order.items, providerName);
      showToast('Items added to cart!');
      navigation.navigate('Cart');
    };

    if (cart.length > 0 && currentProviderName && currentProviderName.toLowerCase() !== providerName.toLowerCase()) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const replace = window.confirm(
          `Your cart already has items from "${currentProviderName}". Reordering from "${providerName}" will replace them.`
        );
        if (replace) proceedReorder();
      } else {
        Alert.alert(
          'Replace Current Cart?',
          `Your cart already has items from "${currentProviderName}". Reordering from "${providerName}" will replace them.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Replace & Reorder', style: 'destructive', onPress: proceedReorder },
          ]
        );
      }
    } else {
      proceedReorder();
    }
  };

  const handleCancelOrder = (order) => {
    const orderId = order._id || order.id;
    const orderIdShort = order._id ? `#${order._id.slice(-6)}` : '#N/A';

    const executeCancel = async () => {
      try {
        await DataService.updateOrderStatus(orderId, 'CANCELLED');
        showToast(`Order ${orderIdShort} has been cancelled`);
        setOrders((prev) =>
          prev.map((o) =>
            String(o._id || o.id) === String(orderId) ? { ...o, status: 'CANCELLED' } : o
          )
        );
      } catch (err) {
        showToast(err.message || 'Failed to cancel order', 'error');
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm(
        `Are you sure you want to cancel order ${orderIdShort}? The canteen has not accepted or prepared it yet.`
      );
      if (confirmed) {
        executeCancel();
      }
    } else {
      Alert.alert(
        'Cancel Order',
        `Are you sure you want to cancel order ${orderIdShort}? The canteen has not accepted or prepared it yet.`,
        [
          { text: 'Keep Order', style: 'cancel' },
          {
            text: 'Cancel Order',
            style: 'destructive',
            onPress: executeCancel,
          },
        ]
      );
    }
  };

  const renderTimeline = (status, orderType) => {
    if (status === 'CANCELLED') {
      return (
        <View style={styles.cancelledBanner}>
          <Ionicons name="close-circle" size={16} color={colors.danger} />
          <Text style={styles.cancelledText}>This order was cancelled.</Text>
        </View>
      );
    }

    const currentStep = getStepIndex(status);
    const statusMsg = getStatusMessage(status, orderType);

    return (
      <View style={styles.trackerCard}>
        {/* Step Nodes Bar */}
        <View style={styles.timelineRow}>
          {TIMELINE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            const isUpcoming = idx > currentStep;

            return (
              <React.Fragment key={step.key}>
                <View style={styles.stepNodeContainer}>
                  <View
                    style={[
                      styles.stepNode,
                      isCompleted && styles.stepNodeCompleted,
                      isCurrent && styles.stepNodeCurrent,
                      isUpcoming && styles.stepNodeUpcoming,
                    ]}
                  >
                    <Ionicons
                      name={isCompleted ? 'checkmark' : step.icon}
                      size={isCompleted ? 14 : 13}
                      color={
                        isCompleted
                          ? colors.white
                          : isCurrent
                          ? colors.white
                          : colors.textLight
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.stepNodeLabel,
                      isCompleted && styles.stepNodeLabelCompleted,
                      isCurrent && styles.stepNodeLabelCurrent,
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>

                {idx < TIMELINE_STEPS.length - 1 && (
                  <View
                    style={[
                      styles.stepLine,
                      idx < currentStep && styles.stepLineCompleted,
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* Live Status Hint */}
        <View style={styles.liveStatusRow}>
          <View style={[styles.liveStatusDot, currentStep === 3 ? styles.liveStatusDotDone : styles.liveStatusDotActive]} />
          <Text style={styles.liveStatusText} numberOfLines={1}>
            {statusMsg}
          </Text>
        </View>
      </View>
    );
  };


  return (
    <View style={styles.container}>
      <Text style={[styles.headerTitle, { paddingTop: Math.max(insets.top + spacing.md, 48) }]}>My Orders</Text>

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
            const providerPhone = item.provider?.phone || '01811112222';
            const isActive = ['PENDING', 'PREPARING', 'READY', 'ON_THE_WAY'].includes(item.status);
            const isDeliveryActive = item.type === 'delivery' && ['READY', 'ON_THE_WAY'].includes(item.status);

            return (
              <View style={styles.orderCard}>
                <View style={styles.rowBetween}>
                  <View style={styles.idRow}>
                    <Ionicons name="receipt-outline" size={15} color={colors.textDark} style={{ marginRight: 4 }} />
                    <Text style={styles.orderId}>{orderIdShort}</Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                <Text style={styles.providerName}>{providerName}</Text>
                <Text style={styles.itemsSummary}>{itemsSummary}</Text>

                {/* Visual Order Progress Timeline */}
                {renderTimeline(item.status, item.type)}

                {/* Quick Contact Bar for Active Orders */}
                {isActive && (
                  <View style={styles.contactContainer}>
                    <Text style={styles.contactHeader}>
                      {isDeliveryActive ? '🚴 Delivery on the way • Contact Rider / Canteen:' : '📞 Need assistance with this order?'}
                    </Text>
                    <View style={styles.contactButtonsRow}>
                      <TouchableOpacity
                        style={styles.contactActionBtn}
                        onPress={() => handleCall(providerPhone)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="call-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                        <Text style={styles.contactBtnText}>Call</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.contactActionBtn, styles.whatsappActionBtn]}
                        onPress={() => handleWhatsApp(providerPhone, item._id || item.id, providerName)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="logo-whatsapp" size={15} color={colors.whatsApp} style={{ marginRight: 4 }} />
                        <Text style={styles.whatsappBtnText}>WhatsApp</Text>
                      </TouchableOpacity>

                      {isDeliveryActive && (
                        <TouchableOpacity
                          style={[styles.contactActionBtn, styles.riderActionBtn]}
                          onPress={() => handleCall('01822334455')}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="bicycle" size={14} color={colors.white} style={{ marginRight: 4 }} />
                          <Text style={styles.riderBtnText}>Call Rider</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}

                <View style={styles.rowBetweenFooter}>
                  <View>
                    <Text style={styles.dateText}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                    </Text>
                    <Text style={styles.totalVal}>৳ {item.total}</Text>
                  </View>

                  <View style={styles.footerActionsRow}>
                    {/* Cancel Option before seller accepts */}
                    {item.status === 'PENDING' && (
                      <TouchableOpacity
                        style={styles.cancelOrderBtn}
                        onPress={() => handleCancelOrder(item)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="close-circle-outline" size={14} color={colors.danger} style={{ marginRight: 4 }} />
                        <Text style={styles.cancelOrderBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    )}

                    {/* Quick 1-Tap Reorder Button */}
                    <TouchableOpacity
                      style={styles.reorderBtn}
                      onPress={() => handleReorder(item)}
                      activeOpacity={0.82}
                    >
                      <Ionicons name="repeat" size={14} color={colors.white} style={{ marginRight: 4 }} />
                      <Text style={styles.reorderBtnText}>Reorder</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="receipt-outline" size={38} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No orders placed yet</Text>
              <Text style={styles.emptySubtitle}>
                Your orders will show here with real-time live tracking
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
    fontFamily: fonts.headingBold,
    fontSize: 22,
    color: colors.textDark,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm + 2,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    letterSpacing: -0.4,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 130,
  },
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 14px rgba(18, 18, 23, 0.06)',
      },
    }),
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textDark,
  },
  providerName: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
    color: colors.primary,
    marginTop: 2,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  itemsSummary: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textGray,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  
  /* Live Tracker Card */
  trackerCard: {
    backgroundColor: '#F8F9FC',
    borderRadius: spacing.borderRadiusMd - 2,
    padding: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.borderDark,
    marginBottom: spacing.sm + 2,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  stepNodeContainer: {
    alignItems: 'center',
    zIndex: 2,
  },
  stepNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderDark,
  },
  stepNodeCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepNodeCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepNodeUpcoming: {
    backgroundColor: '#EEF0F4',
    borderColor: colors.borderDark,
  },
  stepNodeLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  stepNodeLabelCompleted: {
    color: colors.textDark,
    fontFamily: fonts.bold,
  },
  stepNodeLabelCurrent: {
    color: colors.primary,
    fontFamily: fonts.headingBold,
  },
  stepLine: {
    flex: 1,
    height: 2.5,
    backgroundColor: colors.borderDark,
    marginBottom: 16,
    marginHorizontal: -4,
    zIndex: 1,
  },
  stepLineCompleted: {
    backgroundColor: colors.success,
  },
  liveStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 2,
  },
  liveStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  liveStatusDotActive: {
    backgroundColor: colors.primary,
  },
  liveStatusDotDone: {
    backgroundColor: colors.success,
  },
  liveStatusText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textDark,
    flex: 1,
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    padding: spacing.sm,
    borderRadius: spacing.borderRadiusSm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  cancelledText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.danger,
  },

  /* Contact Bar for Active Orders */
  contactContainer: {
    backgroundColor: '#F8F9FC',
    borderRadius: spacing.borderRadiusSm + 2,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactHeader: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.textDark,
    marginBottom: spacing.xs + 2,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  contactActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingVertical: 7,
    borderRadius: spacing.borderRadiusSm,
  },
  contactBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.primary,
  },
  whatsappActionBtn: {
    borderColor: colors.successBorder,
    backgroundColor: colors.successLight,
  },
  whatsappBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#0D9488',
  },
  riderActionBtn: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  riderBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.white,
  },

  rowBetweenFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  dateText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textLight,
    marginBottom: 2,
  },
  totalVal: {
    fontFamily: fonts.headingBold,
    fontSize: 17,
    color: colors.textDark,
  },
  footerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
  },
  cancelOrderBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.danger,
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: spacing.borderRadiusFull,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(255, 75, 38, 0.22)',
      },
    }),
  },
  reorderBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.white,
    letterSpacing: 0.1,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { padding: spacing.xl, alignItems: 'center', marginTop: 40 },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 17,
    color: colors.textDark,
  },
  emptySubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textGray,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});

export default OrderHistoryScreen;

