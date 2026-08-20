import React, { useState, useEffect, useMemo } from 'react';
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
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatusBadge from '../../components/StatusBadge';
import { colors, spacing, fonts } from '../../theme/colors';
import DataService from '../../api/DataService';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TIMELINE_STEPS = [
  { key: 'PLACED', label: 'Placed', icon: 'receipt-outline' },
  { key: 'PREPARING', label: 'Kitchen', icon: 'restaurant-outline' },
  { key: 'READY', label: 'On Way', icon: 'bicycle-outline' },
  { key: 'COMPLETED', label: 'Delivered', icon: 'checkmark-circle-outline' },
];

const FILTER_TABS = ['All', 'Active', 'Completed', 'Cancelled'];

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
      return '👨‍🍳 Kitchen is preparing your fresh meal';
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
      return 'Processing your order...';
  }
};

const OrderHistoryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('All');
  const [expandedOrders, setExpandedOrders] = useState({});

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

  const toggleExpand = (orderId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const activeOrdersCount = useMemo(() => {
    return orders.filter((o) => ['PENDING', 'PREPARING', 'READY', 'ON_THE_WAY'].includes(o.status)).length;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (selectedTab === 'Active') {
      return orders.filter((o) => ['PENDING', 'PREPARING', 'READY', 'ON_THE_WAY'].includes(o.status));
    }
    if (selectedTab === 'Completed') {
      return orders.filter((o) => ['DELIVERED', 'PICKED_UP'].includes(o.status));
    }
    if (selectedTab === 'Cancelled') {
      return orders.filter((o) => o.status === 'CANCELLED');
    }
    return orders;
  }, [orders, selectedTab]);

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
          <Ionicons name="close-circle" size={15} color={colors.danger} style={{ marginRight: 6 }} />
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
                      size={13}
                      color={isCompleted || isCurrent ? colors.white : colors.textLight}
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
          <View
            style={[
              styles.liveStatusDot,
              currentStep === 3 ? styles.liveStatusDotDone : styles.liveStatusDotActive,
            ]}
          />
          <Text style={styles.liveStatusText} numberOfLines={1}>
            {statusMsg}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Screen Header */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top + spacing.sm, 40) }]}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>My Orders</Text>
          {activeOrdersCount > 0 && (
            <View style={styles.activeOrdersPill}>
              <View style={styles.livePulseDot} />
              <Text style={styles.activeOrdersPillText}>
                {activeOrdersCount} Active {activeOrdersCount === 1 ? 'Order' : 'Orders'}
              </Text>
            </View>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabsRow}>
          {FILTER_TABS.map((tab) => {
            const isActive = selectedTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterTabBtn, isActive && styles.filterTabBtnActive]}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setSelectedTab(tab);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                  {tab}
                  {tab === 'Active' && activeOrdersCount > 0 ? ` (${activeOrdersCount})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          contentContainerStyle={[styles.listContent, { paddingBottom: 110 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => {
            const orderIdShort = item._id ? `#${item._id.slice(-6)}` : '#N/A';
            const providerName = item.provider ? item.provider.name : item.providerName || 'CUET Canteen';
            const providerPhone = item.provider?.phone || '01811112222';
            const isActive = ['PENDING', 'PREPARING', 'READY', 'ON_THE_WAY'].includes(item.status);
            const isDeliveryActive = item.type === 'delivery' && ['READY', 'ON_THE_WAY'].includes(item.status);
            const isExpanded = !!expandedOrders[item._id || item.id];
            const itemCount = item.items ? item.items.reduce((acc, curr) => acc + (curr.qty || 1), 0) : 1;

            const formattedDate = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recently placed';

            return (
              <View style={styles.orderCard}>
                {/* Card Top: Order ID & Status */}
                <View style={styles.orderCardTopRow}>
                  <View style={styles.orderIdBadge}>
                    <Ionicons name="receipt-outline" size={13} color={colors.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.orderIdText}>{orderIdShort}</Text>
                  </View>

                  <View style={styles.orderTypePill}>
                    <Ionicons
                      name={item.type === 'delivery' ? 'bicycle-outline' : 'bag-handle-outline'}
                      size={11}
                      color={colors.textDark}
                      style={{ marginRight: 3 }}
                    />
                    <Text style={styles.orderTypeText}>
                      {item.type === 'delivery' ? 'Delivery' : 'Pickup'}
                    </Text>
                  </View>

                  <StatusBadge status={item.status} />
                </View>

                {/* Canteen Information Banner */}
                <View style={styles.providerRow}>
                  <View style={styles.providerIconBox}>
                    <Ionicons name="storefront" size={16} color={colors.primary} />
                  </View>
                  <View style={styles.providerInfoCol}>
                    <Text style={styles.providerNameText} numberOfLines={1}>
                      {providerName}
                    </Text>
                    <Text style={styles.orderDateText}>{formattedDate}</Text>
                  </View>
                </View>

                {/* Visual Order Progress Tracker */}
                {renderTimeline(item.status, item.type)}

                {/* Expandable Receipt / Items Section */}
                <TouchableOpacity
                  style={styles.detailsToggleBtn}
                  onPress={() => toggleExpand(item._id || item.id)}
                  activeOpacity={0.75}
                >
                  <View style={styles.detailsToggleLeft}>
                    <Ionicons
                      name={isExpanded ? 'chevron-up-circle' : 'chevron-down-circle'}
                      size={16}
                      color={colors.primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.detailsToggleText}>
                      {isExpanded ? 'Hide Details' : `View Details & Receipt (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`}
                    </Text>
                  </View>
                  <Text style={styles.detailsTogglePrice}>৳ {item.total}</Text>
                </TouchableOpacity>

                {/* Expanded Breakdown Box */}
                {isExpanded && (
                  <View style={styles.expandedReceiptCard}>
                    <Text style={styles.receiptSectionHeading}>Itemized Breakdown</Text>
                    {item.items &&
                      item.items.map((foodItem, idx) => (
                        <View key={idx} style={styles.receiptItemRow}>
                          <Text style={styles.receiptItemQty}>{foodItem.qty}x</Text>
                          <Text style={styles.receiptItemName} numberOfLines={1}>
                            {foodItem.name}
                          </Text>
                          <Text style={styles.receiptItemPrice}>৳ {(foodItem.price || 0) * (foodItem.qty || 1)}</Text>
                        </View>
                      ))}

                    {/* Delivery Address & Cooking Notes */}
                    {item.deliveryAddress ? (
                      <View style={styles.receiptMetaBox}>
                        <Ionicons name="location-outline" size={13} color={colors.textGray} style={{ marginRight: 4 }} />
                        <Text style={styles.receiptMetaText} numberOfLines={1}>
                          {item.deliveryAddress}
                        </Text>
                      </View>
                    ) : null}

                    {item.notes ? (
                      <View style={[styles.receiptMetaBox, { marginTop: 4 }]}>
                        <Ionicons name="chatbox-outline" size={13} color={colors.textGray} style={{ marginRight: 4 }} />
                        <Text style={styles.receiptMetaText} numberOfLines={1}>
                          Note: "{item.notes}"
                        </Text>
                      </View>
                    ) : null}
                  </View>
                )}

                {/* Contact Bar for Active Orders */}
                {isActive && (
                  <View style={styles.activeContactBar}>
                    <TouchableOpacity
                      style={styles.contactBtnWhatsApp}
                      onPress={() => handleWhatsApp(providerPhone, item._id || item.id, providerName)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="logo-whatsapp" size={14} color={colors.white} style={{ marginRight: 4 }} />
                      <Text style={styles.contactBtnWhatsAppText}>WhatsApp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.contactBtnCall}
                      onPress={() => handleCall(providerPhone)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="call-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.contactBtnCallText}>Call Canteen</Text>
                    </TouchableOpacity>

                    {isDeliveryActive && (
                      <TouchableOpacity
                        style={styles.contactBtnRider}
                        onPress={() => handleCall('01822334455')}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="bicycle" size={14} color={colors.white} style={{ marginRight: 4 }} />
                        <Text style={styles.contactBtnRiderText}>Rider</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Card Footer: Amount & Reorder */}
                <View style={styles.orderCardFooter}>
                  <View style={styles.footerPriceCol}>
                    <Text style={styles.footerPriceLabel}>Total Amount</Text>
                    <Text style={styles.footerPriceVal}>৳ {item.total}</Text>
                  </View>

                  <View style={styles.footerActionsRow}>
                    {item.status === 'PENDING' && (
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => handleCancelOrder(item)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="close-circle-outline" size={13} color={colors.danger} style={{ marginRight: 3 }} />
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.reorderPillBtn}
                      onPress={() => handleReorder(item)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="repeat" size={14} color={colors.white} style={{ marginRight: 4 }} />
                      <Text style={styles.reorderPillBtnText}>Reorder</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="receipt-outline" size={40} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Orders Found</Text>
              <Text style={styles.emptySubtitle}>
                {selectedTab === 'All'
                  ? 'Your orders will show here with real-time live tracking'
                  : `You have no ${selectedTab.toLowerCase()} orders right now.`}
              </Text>
              <TouchableOpacity
                style={styles.emptyExploreBtn}
                onPress={() => navigation.navigate('ExploreStack')}
                activeOpacity={0.85}
              >
                <Ionicons name="restaurant" size={15} color={colors.white} style={{ marginRight: 6 }} />
                <Text style={styles.emptyExploreBtnText}>Browse Campus Canteens</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /* Header Container */
  headerContainer: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 22,
    color: colors.textDark,
    letterSpacing: -0.4,
  },
  activeOrdersPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  activeOrdersPillText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#065F46',
  },

  /* Filter Tabs */
  filterTabsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterTabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: spacing.borderRadiusFull,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  filterTabBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textGray,
  },
  filterTabTextActive: {
    fontFamily: fonts.bold,
    color: colors.white,
  },

  /* Content */
  listContent: {
    padding: spacing.md,
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
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 10px rgba(18, 18, 23, 0.04)',
      },
    }),
  },

  /* Card Header */
  orderCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2,
  },
  orderIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
  },
  orderIdText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
  },
  orderTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
  },
  orderTypeText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.textDark,
  },

  /* Provider Info */
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  providerIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  providerInfoCol: {
    flex: 1,
  },
  providerNameText: {
    fontFamily: fonts.headingBold,
    fontSize: 15,
    color: colors.textDark,
    letterSpacing: -0.2,
  },
  orderDateText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textGray,
    marginTop: 1,
  },

  /* Tracker Stepper */
  trackerCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: spacing.borderRadiusSm,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.borderDark,
    marginVertical: spacing.xs + 2,
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
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderDark,
  },
  stepNodeCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepNodeCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepNodeUpcoming: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.borderDark,
  },
  stepNodeLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 9,
    color: colors.textLight,
    marginTop: 3,
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
    height: 2,
    backgroundColor: colors.borderDark,
    marginBottom: 14,
    marginHorizontal: -4,
    zIndex: 1,
  },
  stepLineCompleted: {
    backgroundColor: '#10B981',
  },
  liveStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: spacing.borderRadiusSm,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 2,
  },
  liveStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  liveStatusDotActive: {
    backgroundColor: colors.primary,
  },
  liveStatusDotDone: {
    backgroundColor: '#10B981',
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
    marginVertical: spacing.xs,
  },
  cancelledText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.danger,
  },

  /* Expandable Details */
  detailsToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    paddingVertical: 6,
    marginTop: 2,
  },
  detailsToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsToggleText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.primary,
  },
  detailsTogglePrice: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.textDark,
  },
  expandedReceiptCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: spacing.borderRadiusSm,
    padding: spacing.sm + 2,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  receiptSectionHeading: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  receiptItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  receiptItemQty: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
    width: 22,
  },
  receiptItemName: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textDark,
    flex: 1,
    marginRight: spacing.sm,
  },
  receiptItemPrice: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.textDark,
  },
  receiptMetaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  receiptMetaText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textGray,
    flex: 1,
  },

  /* Active Contact Bar */
  activeContactBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  contactBtnWhatsApp: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.whatsApp,
    paddingVertical: 7,
    borderRadius: spacing.borderRadiusSm,
  },
  contactBtnWhatsAppText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.white,
  },
  contactBtnCall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 38, 0.2)',
    paddingVertical: 7,
    borderRadius: spacing.borderRadiusSm,
  },
  contactBtnCallText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
  },
  contactBtnRider: {
    flex: 0.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.purple,
    paddingVertical: 7,
    borderRadius: spacing.borderRadiusSm,
  },
  contactBtnRiderText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.white,
  },

  /* Card Footer */
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs + 2,
  },
  footerPriceCol: {
    justifyContent: 'center',
  },
  footerPriceLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textGray,
  },
  footerPriceVal: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
    color: colors.textDark,
  },
  footerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
  },
  cancelBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.danger,
  },
  reorderPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: spacing.borderRadiusFull,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  reorderPillBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.white,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: 30,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 18,
    color: colors.textDark,
  },
  emptySubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textGray,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: spacing.md,
  },
  emptyExploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: spacing.borderRadiusFull,
  },
  emptyExploreBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.white,
  },
});

export default OrderHistoryScreen;


