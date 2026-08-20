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
  { key: 'PLACED', label: 'Placed' },
  { key: 'PREPARING', label: 'Preparing' },
  { key: 'READY', label: 'On the Way' },
  { key: 'COMPLETED', label: 'Delivered' },
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

  const renderTimeline = (status) => {
    if (status === 'CANCELLED') {
      return (
        <View style={styles.cancelledBanner}>
          <Ionicons name="close-circle" size={16} color={colors.danger} />
          <Text style={styles.cancelledText}>This order was cancelled.</Text>
        </View>
      );
    }

    const currentStep = getStepIndex(status);

    return (
      <View style={styles.timelineContainer}>
        {TIMELINE_STEPS.map((step, idx) => {
          const isDone = idx <= currentStep;
          const isCurrent = idx === currentStep;

          return (
            <React.Fragment key={step.key}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    isDone && styles.stepCircleDone,
                    isCurrent && styles.stepCircleCurrent,
                  ]}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={10} color={colors.white} />
                  ) : (
                    <View style={styles.stepDotInner} />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isDone && styles.stepLabelDone,
                    isCurrent && styles.stepLabelCurrent,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
              {idx < TIMELINE_STEPS.length - 1 && (
                <View
                  style={[
                    styles.stepConnector,
                    idx < currentStep && styles.stepConnectorDone,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
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
                {renderTimeline(item.status)}

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
                        <Ionicons name="logo-whatsapp" size={15} color="#25D366" style={{ marginRight: 4 }} />
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
                        <Text style={styles.cancelOrderBtnText}>Cancel Order</Text>
                      </TouchableOpacity>
                    )}

                    {/* Quick Reorder Button */}
                    <TouchableOpacity
                      style={styles.reorderBtn}
                      onPress={() => handleReorder(item)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="refresh-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.reorderBtnText}>Reorder</Text>
                    </TouchableOpacity>
                  </View>
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
  container: { flex: 1, backgroundColor: '#F6F8FA' },
  headerTitle: {
    fontFamily: fonts.headingExtraBold,
    fontSize: 22,
    fontWeight: '800',
    color: colors.textDark,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
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
  orderId: { fontSize: 14, fontWeight: '700', color: colors.textDark },
  providerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  itemsSummary: { fontSize: 13, color: colors.textGray, marginBottom: spacing.md },
  
  /* Timeline */
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: spacing.borderRadiusSm,
    marginBottom: spacing.md,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
  },
  stepCircleDone: {
    backgroundColor: colors.success,
  },
  stepCircleCurrent: {
    backgroundColor: colors.primary,
  },
  stepDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textLight,
  },
  stepLabel: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: '600',
    textAlign: 'center',
  },
  stepLabelDone: {
    color: colors.textDark,
  },
  stepLabelCurrent: {
    color: colors.primary,
    fontWeight: '700',
  },
  stepConnector: {
    height: 2,
    flex: 0.7,
    backgroundColor: colors.border,
    marginBottom: 14,
  },
  stepConnectorDone: {
    backgroundColor: colors.success,
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
    fontSize: 12,
    color: colors.danger,
    fontWeight: '600',
  },

  /* Contact Bar for Active Orders */
  contactContainer: {
    backgroundColor: colors.background,
    borderRadius: spacing.borderRadiusSm,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
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
    borderColor: colors.border,
    paddingVertical: 7,
    borderRadius: spacing.borderRadiusSm,
  },
  contactBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.primary,
  },
  whatsappActionBtn: {
    borderColor: '#D4F5E1',
    backgroundColor: '#F0FBF4',
  },
  whatsappBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#128C7E',
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
  dateText: { fontFamily: fonts.regular, fontSize: 11, color: colors.textLight, marginBottom: 2 },
  totalVal: { fontFamily: fonts.headingBold, fontSize: 16, color: colors.textDark },
  footerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: spacing.borderRadiusSm,
  },
  cancelOrderBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.danger,
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: spacing.borderRadiusSm,
  },
  reorderBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primary,
  },
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
  emptyTitle: { fontFamily: fonts.headingBold, fontSize: 18, color: colors.textDark },
  emptySubtitle: { fontFamily: fonts.regular, fontSize: 13, color: colors.textGray, marginTop: spacing.xs },
});

export default OrderHistoryScreen;
