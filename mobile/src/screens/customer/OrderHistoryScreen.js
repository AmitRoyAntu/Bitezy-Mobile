import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, fonts } from '../../theme/colors';
import DataService from '../../api/DataService';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TIMELINE_STEPS = [
  { key: 'PLACED', label: 'Placed' },
  { key: 'PREPARING', label: 'Kitchen' },
  { key: 'READY', label: 'On the way' },
  { key: 'COMPLETED', label: 'Delivered' },
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
      return 'Waiting for canteen to confirm...';
    case 'PREPARING':
      return '👨‍🍳 Kitchen is preparing your food';
    case 'READY':
      return isDelivery ? '🚴 Order is dispatched & on the way!' : '🛍️ Ready for pickup at counter!';
    case 'ON_THE_WAY':
      return '🚴 Rider is on the way to your hall';
    case 'DELIVERED':
    case 'PICKED_UP':
      return '✨ Delivered & completed';
    case 'CANCELLED':
      return '❌ Order was cancelled';
    default:
      return 'Processing...';
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

  const loadOrders = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
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

  // Automatically refresh orders whenever the screen gains focus (e.g. after placing an order)
  useFocusEffect(
    useCallback(() => {
      loadOrders(orders.length > 0);
    }, [])
  );

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
      showToast(`Dialer unavailable: ${phone}`, 'info');
    });
  };

  const handleWhatsApp = (phoneNumber, orderId, providerName) => {
    let cleanPhone = (phoneNumber || '01811112222').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '88' + cleanPhone;
    else if (!cleanPhone.startsWith('88')) cleanPhone = '88' + cleanPhone;

    const message = encodeURIComponent(
      `Hello ${providerName || 'Canteen'}, I'm inquiring about my Bitezy order ${orderId ? `#${orderId}` : ''}.`
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
      showToast('Items added to cart! 🛒');
      navigation.navigate('Cart');
    };

    if (cart.length > 0 && currentProviderName && currentProviderName.toLowerCase() !== providerName.toLowerCase()) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const replace = window.confirm(
          `Your cart has items from "${currentProviderName}". Replace with "${providerName}"?`
        );
        if (replace) proceedReorder();
      } else {
        Alert.alert(
          'Replace Cart?',
          `Your cart has items from "${currentProviderName}". Replace with "${providerName}"?`,
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
        showToast(`Order ${orderIdShort} cancelled`);
        setOrders((prev) =>
          prev.map((o) =>
            String(o._id || o.id) === String(orderId) ? { ...o, status: 'CANCELLED' } : o
          )
        );
      } catch (err) {
        showToast(err.message || 'Failed to cancel', 'error');
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(`Cancel order ${orderIdShort}?`)) executeCancel();
    } else {
      Alert.alert('Cancel Order', `Cancel order ${orderIdShort}?`, [
        { text: 'Keep', style: 'cancel' },
        { text: 'Cancel Order', style: 'destructive', onPress: executeCancel },
      ]);
    }
  };

  const renderActiveTracker = (status, orderType) => {
    const currentStep = getStepIndex(status);
    const statusMsg = getStatusMessage(status, orderType);

    return (
      <View style={styles.activeProgressBox}>
        {/* Status Bubble */}
        <View style={styles.statusBubble}>
          <View style={styles.pulseDotGreen} />
          <Text style={styles.statusBubbleText}>{statusMsg}</Text>
        </View>

        {/* Minimal Progress Bar */}
        <View style={styles.minimalStepperRow}>
          {TIMELINE_STEPS.map((step, idx) => {
            const isDone = idx <= currentStep;
            const isCurrent = idx === currentStep;
            return (
              <React.Fragment key={step.key}>
                <View style={styles.minimalStepItem}>
                  <View
                    style={[
                      styles.minimalDot,
                      isDone && styles.minimalDotDone,
                      isCurrent && styles.minimalDotCurrent,
                    ]}
                  >
                    {isDone ? (
                      <Ionicons name="checkmark" size={10} color={colors.white} />
                    ) : (
                      <View style={styles.minimalDotInner} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.minimalStepText,
                      isDone && styles.minimalStepTextDone,
                      isCurrent && styles.minimalStepTextCurrent,
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>

                {idx < TIMELINE_STEPS.length - 1 && (
                  <View
                    style={[
                      styles.minimalLine,
                      idx < currentStep && styles.minimalLineDone,
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>
      </View>
    );
  };

  const renderOrderItem = ({ item }) => {
    const orderIdShort = item._id ? `#${item._id.slice(-6)}` : '#N/A';
    const providerName = item.provider ? item.provider.name : item.providerName || 'CUET Canteen';
    const providerPhone = item.provider?.phone || '01811112222';
    const isActive = ['PENDING', 'PREPARING', 'READY', 'ON_THE_WAY'].includes(item.status);
    const isCancelled = item.status === 'CANCELLED';
    const isDelivered = ['DELIVERED', 'PICKED_UP'].includes(item.status);
    const isExpanded = !!expandedOrders[item._id || item.id];
    const itemsCount = item.items ? item.items.reduce((acc, curr) => acc + (curr.qty || 1), 0) : 1;

    const formattedDate = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      : 'Today';

    const itemsSummary = item.items
      ? item.items.map((i) => `${i.qty}x ${i.name}`).join('  •  ')
      : 'Campus Meal';

    return (
      <View style={[styles.cozyCard, isActive && styles.cozyCardActive]}>
        {/* Card Header: Canteen & Status */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.canteenCol}>
            <View style={styles.canteenTitleRow}>
              <Text style={styles.canteenTitle} numberOfLines={1}>
                {providerName}
              </Text>
            </View>
            <View style={styles.canteenMetaRow}>
              <Text style={styles.canteenSubtext}>
                {formattedDate} • {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
              </Text>
              <View
                style={[
                  styles.methodTag,
                  item.type === 'delivery' ? styles.methodTagDelivery : styles.methodTagPickup,
                ]}
              >
                <Ionicons
                  name={item.type === 'delivery' ? 'bicycle' : 'storefront-outline'}
                  size={11}
                  color={item.type === 'delivery' ? colors.primary : '#4F46E5'}
                  style={{ marginRight: 3 }}
                />
                <Text
                  style={[
                    styles.methodTagText,
                    item.type === 'delivery' ? styles.methodTagTextDelivery : styles.methodTagTextPickup,
                  ]}
                >
                  {item.type === 'delivery' ? 'Hall Delivery' : 'Counter Pickup'}
                </Text>
              </View>
            </View>
          </View>

          {/* Status Badge */}
          {isActive ? (
            <View style={styles.activePill}>
              <View style={styles.pulseDotAmber} />
              <Text style={styles.activePillText}>Live</Text>
            </View>
          ) : isDelivered ? (
            <View style={styles.deliveredPill}>
              <Ionicons name="checkmark" size={11} color="#059669" style={{ marginRight: 2 }} />
              <Text style={styles.deliveredPillText}>Delivered</Text>
            </View>
          ) : (
            <View style={styles.cancelledPill}>
              <Text style={styles.cancelledPillText}>Cancelled</Text>
            </View>
          )}
        </View>

        {/* Live Stepper (Shown ONLY for Active In-Progress Orders) */}
        {isActive && renderActiveTracker(item.status, item.type)}

        {/* Expandable Receipt Dropdown */}
        {isExpanded && (
          <View style={styles.receiptContainer}>
            <View style={styles.receiptDivider} />
            {item.items &&
              item.items.map((food, i) => (
                <View key={i} style={styles.receiptRow}>
                  <Text style={styles.receiptItemQty}>{food.qty}x</Text>
                  <Text style={styles.receiptItemName} numberOfLines={1}>
                    {food.name}
                  </Text>
                  <Text style={styles.receiptItemPrice}>৳ {(food.price || 0) * (food.qty || 1)}</Text>
                </View>
              ))}

            {item.deliveryAddress ? (
              <View style={styles.receiptMetaRow}>
                <Ionicons name="location-outline" size={12} color={colors.textGray} style={{ marginRight: 4 }} />
                <Text style={styles.receiptMetaText} numberOfLines={1}>
                  {item.deliveryAddress}
                </Text>
              </View>
            ) : null}

            {item.notes ? (
              <View style={styles.receiptMetaRow}>
                <Ionicons name="chatbox-outline" size={12} color={colors.textGray} style={{ marginRight: 4 }} />
                <Text style={styles.receiptMetaText} numberOfLines={1}>
                  "{item.notes}"
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Card Footer: Total Price + Actions */}
        <View style={styles.cardFooterRow}>
          <Text style={styles.cardTotalPrice}>৳ {item.total}</Text>

          <View style={styles.cardActionsCol}>
            {/* Circular Quick Contact Buttons (Active Orders) */}
            {isActive && (
              <>
                <TouchableOpacity
                  style={styles.circleBtnWhatsApp}
                  onPress={() => handleWhatsApp(providerPhone, item._id || item.id, providerName)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-whatsapp" size={14} color="#059669" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.circleBtnCall}
                  onPress={() => handleCall(providerPhone)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="call-outline" size={13} color={colors.primary} />
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.receiptToggle}
              onPress={() => toggleExpand(item._id || item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.receiptToggleText}>{isExpanded ? 'Hide' : 'Details'}</Text>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={12}
                color={colors.textGray}
                style={{ marginLeft: 2 }}
              />
            </TouchableOpacity>

            {item.status === 'PENDING' ? (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleCancelOrder(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.reorderBtn}
                onPress={() => handleReorder(item)}
                activeOpacity={0.85}
              >
                <Ionicons name="repeat" size={12} color={colors.white} style={{ marginRight: 4 }} />
                <Text style={styles.reorderBtnText}>Reorder</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Cozy Header */}
      <View style={[styles.headerBox, { paddingTop: Math.max(insets.top + spacing.sm, 40) }]}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>My Orders</Text>
          {activeOrdersCount > 0 && (
            <View style={styles.activeHeaderBadge}>
              <View style={styles.pulseDotGreen} />
              <Text style={styles.activeHeaderBadgeText}>{activeOrdersCount} Active</Text>
            </View>
          )}
        </View>

        {/* Segment Tabs */}
        <View style={styles.segmentContainer}>
          {FILTER_TABS.map((tab) => {
            const isActive = selectedTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.segmentTab, isActive && styles.segmentTabActive]}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setSelectedTab(tab);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
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
          renderItem={renderOrderItem}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="receipt-outline" size={32} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No orders to display</Text>
              <Text style={styles.emptySubtitle}>
                {selectedTab === 'All'
                  ? 'Your campus dining orders and tracking will appear here'
                  : `You have no ${selectedTab.toLowerCase()} orders.`}
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('ExploreStack')}
                activeOpacity={0.85}
              >
                <Ionicons name="restaurant-outline" size={14} color={colors.white} style={{ marginRight: 5 }} />
                <Text style={styles.emptyButtonText}>Explore Food Halls</Text>
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
    backgroundColor: '#F3F4F7',
  },

  /* Header */
  headerBox: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E6EC',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 22,
    color: colors.textDark,
    letterSpacing: -0.3,
  },
  activeHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
  },
  pulseDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  pulseDotAmber: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 5,
  },
  activeHeaderBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#059669',
  },

  /* Segment Tabs */
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: spacing.borderRadiusFull,
    padding: 3,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: spacing.borderRadiusFull,
  },
  segmentTabActive: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textGray,
  },
  segmentTextActive: {
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  /* List */
  listContent: {
    padding: spacing.md,
  },

  /* Cozy Order Card */
  cozyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.2,
    borderColor: '#DDE1E6',
    ...Platform.select({
      ios: {
        shadowColor: '#121217',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 14px rgba(18, 18, 23, 0.06), 0 1px 3px rgba(18, 18, 23, 0.04)',
      },
    }),
  },
  cozyCardActive: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 75, 38, 0.4)',
    backgroundColor: '#FFFDFB',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(255, 75, 38, 0.1), 0 1px 4px rgba(18, 18, 23, 0.04)',
      },
    }),
  },

  /* Card Header */
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  canteenCol: {
    flex: 1,
    marginRight: spacing.xs,
  },
  canteenTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  canteenTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 15,
    color: colors.textDark,
    letterSpacing: -0.2,
  },
  canteenSubtext: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textGray,
    marginRight: 6,
  },
  canteenMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 2,
    gap: 4,
  },
  methodTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: spacing.borderRadiusFull,
  },
  methodTagDelivery: {
    backgroundColor: 'rgba(255, 75, 38, 0.08)',
  },
  methodTagPickup: {
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
  },
  methodTagText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
  },
  methodTagTextDelivery: {
    color: colors.primary,
  },
  methodTagTextPickup: {
    color: '#4F46E5',
  },

  /* Badges */
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 75, 38, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
  },
  activePillText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
  },
  deliveredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
  },
  deliveredPillText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#059669',
  },
  cancelledPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
  },
  cancelledPillText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textGray,
  },

  /* Active Live Stepper Box */
  activeProgressBox: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 38, 0.12)',
  },
  statusBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBubbleText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.primaryDark,
  },
  minimalStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  minimalStepItem: {
    alignItems: 'center',
    zIndex: 2,
  },
  minimalDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimalDotDone: {
    backgroundColor: '#10B981',
  },
  minimalDotCurrent: {
    backgroundColor: colors.primary,
  },
  minimalDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  minimalStepText: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: colors.textLight,
    marginTop: 3,
  },
  minimalStepTextDone: {
    fontFamily: fonts.bold,
    color: '#059669',
  },
  minimalStepTextCurrent: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  minimalLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 14,
    marginHorizontal: -2,
    zIndex: 1,
  },
  minimalLineDone: {
    backgroundColor: '#10B981',
  },

  /* Items Line */
  itemsLine: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
    marginVertical: 4,
  },

  /* Receipt Breakdown */
  receiptContainer: {
    marginTop: 4,
    marginBottom: 6,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 6,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  receiptItemQty: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
    width: 22,
  },
  receiptItemName: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textDark,
    flex: 1,
  },
  receiptItemPrice: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textDark,
  },
  receiptMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  receiptMetaText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textGray,
  },

  /* Active Contact Bar */
  contactBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginBottom: 2,
  },
  contactPillWhatsApp: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingVertical: 5,
    borderRadius: spacing.borderRadiusFull,
  },
  contactPillWhatsAppText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#059669',
  },
  contactPillCall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 5,
    borderRadius: spacing.borderRadiusFull,
  },
  contactPillCallText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
  },

  /* Card Footer */
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cardTotalPrice: {
    fontFamily: fonts.headingBold,
    fontSize: 15,
    color: colors.textDark,
  },
  cardActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  receiptToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  receiptToggleText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textGray,
  },
  cancelBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: spacing.borderRadiusFull,
  },
  cancelBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#DC2626',
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
  },
  reorderBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.white,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBox: {
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
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
    marginTop: 3,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: spacing.borderRadiusFull,
  },
  emptyButtonText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.white,
  },
});

export default OrderHistoryScreen;
