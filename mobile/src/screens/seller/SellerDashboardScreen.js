import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logo from '../../components/Logo';
import OrderTypeBadge from '../../components/OrderTypeBadge';
import { colors, spacing, fonts } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DataService from '../../api/DataService';

const SellerDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [provider, setProvider] = useState(null);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartDays, setChartDays] = useState(7);

  const loadDashboardData = async () => {
    try {
      const myProvider = await DataService.getMyProvider();
      setProvider(myProvider);

      const [sellerOrders, sellerReviews] = await Promise.all([
        DataService.getSellerOrders(),
        myProvider ? DataService.getReviewsByProvider(myProvider._id || myProvider.id) : [],
      ]);

      setOrders(sellerOrders || []);
      setReviews(sellerReviews || []);
    } catch (err) {
      showToast('Error loading dashboard data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleToggleOpenStatus = async () => {
    if (!provider) return;
    const newStatus = provider.isOpen === false ? true : false;
    try {
      await DataService.updateProvider(provider._id || provider.id, { isOpen: newStatus });
      setProvider({ ...provider, isOpen: newStatus });
      showToast(`Canteen is now marked as ${newStatus ? 'OPEN' : 'CLOSED'}`);
    } catch (err) {
      showToast('Failed to update canteen status', 'error');
    }
  };

  // KPIs Calculations
  const todayStr = new Date().toDateString();
  const completedOrders = orders.filter((o) =>
    ['DELIVERED', 'PICKED_UP'].includes(o.status)
  );

  const todayCompletedOrders = orders.filter(
    (o) =>
      new Date(o.createdAt).toDateString() === todayStr &&
      ['DELIVERED', 'PICKED_UP'].includes(o.status)
  );

  const todayRevenue = todayCompletedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(
    (o) => !['DELIVERED', 'PICKED_UP', 'CANCELLED'].includes(o.status)
  ).length;

  const avgRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : provider?.rating || '4.8';

  // Order Type Distribution
  const totalCompleted = completedOrders.length;
  const deliveryOrdersCount = completedOrders.filter((o) => (o.type || '').toLowerCase() === 'delivery').length;
  const pickupOrdersCount = completedOrders.filter((o) => (o.type || '').toLowerCase() === 'pickup').length;
  const deliveryPercent = totalCompleted > 0 ? Math.round((deliveryOrdersCount / totalCompleted) * 100) : 60;
  const pickupPercent = totalCompleted > 0 ? Math.round((pickupOrdersCount / totalCompleted) * 100) : 40;

  // Weekly Sales Trend Data (Last 7 Days)
  const salesDays = [];
  const now = new Date();
  const salesMap = {};

  for (let i = chartDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const dayLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    salesMap[key] = 0;
    salesDays.push({ key, label: dayLabel, sales: 0 });
  }

  completedOrders.forEach((o) => {
    if (o.createdAt) {
      const key = new Date(o.createdAt).toISOString().split('T')[0];
      if (salesMap[key] !== undefined) {
        salesMap[key] += o.total || 0;
      }
    }
  });

  salesDays.forEach((sd) => {
    sd.sales = salesMap[sd.key] || 0;
  });

  const maxSales = Math.max(...salesDays.map((d) => d.sales), 100);

  // Top Selling Items Ranking
  const itemCounts = {};
  completedOrders.forEach((o) => {
    if (Array.isArray(o.items)) {
      o.items.forEach((item) => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + (item.qty || 1);
      });
    }
  });

  const topItems = Object.entries(itemCounts)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 3);

  // Recent 3 Orders
  const recentOrders = [...orders].reverse().slice(0, 3);

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Brand Navbar */}
      <View style={[styles.topNavbar, { paddingTop: Math.max(insets.top + spacing.md, 48) }]}>
        <Logo size="small" showTagline={false} />
        <View style={styles.navBusinessBadge}>
          <Ionicons name="storefront" size={14} color={colors.primary} style={{ marginRight: 5 }} />
          <Text style={styles.navBusinessText} numberOfLines={1}>
            {provider?.name || `${currentUser?.name}'s Canteen`}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Canteen Header Hero */}
        <View style={styles.headerHero}>
          <View style={styles.headerTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.canteenTitle} numberOfLines={1}>
                {provider?.name || `${currentUser?.name}'s Canteen`}
              </Text>
              <Text style={styles.managerSubtitle}>
                CUET Campus • {provider?.location || 'Ground Floor'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.statusTogglePill,
                provider?.isOpen === false ? styles.statusClosed : styles.statusOpen,
              ]}
              onPress={handleToggleOpenStatus}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.statusDot,
                  provider?.isOpen === false ? styles.dotClosed : styles.dotOpen,
                ]}
              />
              <Text style={styles.statusToggleText}>
                {provider?.isOpen === false ? 'Closed' : 'Open'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3 KPI Stats Cards */}
        <View style={styles.kpiGrid}>
          {/* Today's Revenue */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="wallet-outline" size={18} color="#2ECC71" />
            </View>
            <Text style={styles.kpiLabel}>Today's Sales</Text>
            <Text style={styles.kpiValue}>৳ {todayRevenue.toLocaleString()}</Text>
            <Text style={styles.kpiSub}>Total: ৳ {totalRevenue.toLocaleString()}</Text>
          </View>

          {/* Orders */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="receipt-outline" size={18} color="#FF9800" />
            </View>
            <Text style={styles.kpiLabel}>Total Orders</Text>
            <Text style={styles.kpiValue}>{totalOrdersCount}</Text>
            <Text style={[styles.kpiSub, pendingOrdersCount > 0 && { color: colors.danger, fontFamily: fonts.bold }]}>
              Pending: {pendingOrdersCount}
            </Text>
          </View>

          {/* Rating */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: '#FFF8E1' }]}>
              <Ionicons name="star" size={18} color="#FFC107" />
            </View>
            <Text style={styles.kpiLabel}>Avg. Rating</Text>
            <Text style={styles.kpiValue}>★ {avgRating}</Text>
            <Text style={styles.kpiSub}>{reviews.length} Reviews</Text>
          </View>
        </View>

        {/* Weekly Sales Trend Chart */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionHeading}>Weekly Sales Trend</Text>
              <Text style={styles.sectionSub}>Daily revenue (BDT)</Text>
            </View>
            <View style={styles.timeTag}>
              <Text style={styles.timeTagText}>Last 7 Days</Text>
            </View>
          </View>

          <View style={styles.barChartContainer}>
            {salesDays.map((item) => {
              const heightPercent = Math.max((item.sales / maxSales) * 100, 8);
              return (
                <View key={item.key} style={styles.chartCol}>
                  <Text style={styles.chartBarValue}>
                    {item.sales > 0 ? `৳${item.sales}` : '0'}
                  </Text>
                  <View style={styles.chartTrack}>
                    <View
                      style={[
                        styles.chartBarFill,
                        { height: `${heightPercent}%` },
                        item.sales > 0 && styles.chartBarActive,
                      ]}
                    />
                  </View>
                  <Text style={styles.chartDayLabel}>{item.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Order Distribution & Top Selling Items */}
        <View style={styles.splitRow}>
          {/* Order Distribution */}
          <View style={styles.halfCard}>
            <Text style={styles.sectionHeading}>Order Distribution</Text>
            <Text style={styles.sectionSub}>Fulfillment breakdown</Text>

            <View style={styles.progressItem}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>
                  <Ionicons name="bicycle" size={13} color={colors.primary} /> Delivery
                </Text>
                <Text style={styles.progressPercent}>{deliveryPercent}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${deliveryPercent}%`, backgroundColor: colors.primary }]} />
              </View>
            </View>

            <View style={styles.progressItem}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>
                  <Ionicons name="storefront-outline" size={13} color="#4F46E5" /> Pickup
                </Text>
                <Text style={styles.progressPercent}>{pickupPercent}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${pickupPercent}%`, backgroundColor: '#4F46E5' }]} />
              </View>
            </View>
          </View>

          {/* Top Selling Items */}
          <View style={styles.halfCard}>
            <Text style={styles.sectionHeading}>Top Dishes</Text>
            <Text style={styles.sectionSub}>Most ordered</Text>

            {topItems.length === 0 ? (
              <Text style={styles.noDataText}>No completed orders yet</Text>
            ) : (
              topItems.map((item, idx) => (
                <View key={item.name} style={styles.topDishRow}>
                  <View
                    style={[
                      styles.rankCircle,
                      idx === 0 && { backgroundColor: '#FFD700' },
                      idx === 1 && { backgroundColor: '#C0C0C0' },
                      idx === 2 && { backgroundColor: '#CD7F32' },
                    ]}
                  >
                    <Text style={styles.rankNum}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dishName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.dishSales}>{item.qty} portions sold</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Recent Orders Preview */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionHeading}>Incoming & Recent Orders</Text>
              <Text style={styles.sectionSub}>Latest requests from students</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Orders')} activeOpacity={0.7}>
              <Text style={styles.viewAllLink}>View All →</Text>
            </TouchableOpacity>
          </View>

          {recentOrders.length === 0 ? (
            <View style={styles.emptyRecentBox}>
              <Ionicons name="receipt-outline" size={32} color={colors.textLight} />
              <Text style={styles.emptyRecentText}>No orders received yet.</Text>
            </View>
          ) : (
            recentOrders.map((ord) => {
              const orderIdShort = ord._id ? `#${ord._id.slice(-5)}` : '#N/A';
              const customerName = ord.customer?.name || 'Student Buyer';

              return (
                <View key={ord._id || ord.id} style={styles.recentOrderRow}>
                  <View style={styles.orderLeftCol}>
                    <View style={styles.orderIdBadge}>
                      <Text style={styles.orderIdText}>{orderIdShort}</Text>
                    </View>
                    <View>
                      <Text style={styles.orderCustomerName} numberOfLines={1}>{customerName}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                        <OrderTypeBadge type={ord.type} />
                        <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: colors.textDark, marginLeft: 6 }}>
                          ৳{ord.total}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.orderRightCol}>
                    <View
                      style={[
                        styles.orderStatusPill,
                        ord.status === 'PENDING' && { backgroundColor: '#FFF3E0' },
                        ord.status === 'PREPARING' && { backgroundColor: '#E3F2FD' },
                        ord.status === 'DELIVERED' && { backgroundColor: '#E8F5E9' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.orderStatusText,
                          ord.status === 'PENDING' && { color: '#E67E22' },
                          ord.status === 'PREPARING' && { color: '#2980B9' },
                          ord.status === 'DELIVERED' && { color: '#27AE60' },
                        ]}
                      >
                        {ord.status}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topNavbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navBusinessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: spacing.borderRadiusFull,
    maxWidth: '55%',
  },
  navBusinessText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
  },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerHero: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  canteenTitle: {
    fontFamily: fonts.headingExtraBold,
    fontSize: 20,
    color: colors.textDark,
  },
  managerSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textGray,
    marginTop: 2,
  },
  statusTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
  },
  statusOpen: { backgroundColor: '#E8F5E9' },
  statusClosed: { backgroundColor: '#FFEBEE' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  dotOpen: { backgroundColor: colors.success },
  dotClosed: { backgroundColor: colors.danger },
  statusToggleText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.textDark,
  },

  /* KPIs */
  kpiGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.sm + 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.textGray,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
    color: colors.textDark,
    marginVertical: 2,
  },
  kpiSub: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textLight,
  },

  /* Section Card */
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionHeading: {
    fontFamily: fonts.headingBold,
    fontSize: 15,
    color: colors.textDark,
  },
  sectionSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textGray,
  },
  timeTag: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeTagText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.textGray,
  },

  /* Bar Chart */
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 20,
    paddingBottom: 4,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBarValue: {
    fontFamily: fonts.semiBold,
    fontSize: 9,
    color: colors.textDark,
    marginBottom: 4,
  },
  chartTrack: {
    width: 14,
    height: 85,
    backgroundColor: '#F1F2F6',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: '#BDC3C7',
    borderRadius: 7,
  },
  chartBarActive: {
    backgroundColor: colors.primary,
  },
  chartDayLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textGray,
    marginTop: 6,
  },

  /* Split Row */
  splitRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  halfCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  progressItem: {
    marginTop: spacing.sm,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textDark,
  },
  progressPercent: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.textDark,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F2F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  topDishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 8,
  },
  rankCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNum: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.white,
  },
  dishName: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.textDark,
  },
  dishSales: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textGray,
  },
  noDataText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textLight,
    marginTop: spacing.sm,
  },

  /* Recent Orders */
  viewAllLink: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
  },
  emptyRecentBox: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRecentText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textGray,
    marginTop: 4,
  },
  recentOrderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  orderIdBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusSm,
  },
  orderIdText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
  },
  orderCustomerName: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textDark,
  },
  orderTypeSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textGray,
    marginTop: 1,
  },
  orderRightCol: {
    alignItems: 'flex-end',
  },
  orderStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
  },
  orderStatusText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
});

export default SellerDashboardScreen;
