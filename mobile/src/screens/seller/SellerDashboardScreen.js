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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logo from '../../components/Logo';
import OrderTypeBadge from '../../components/OrderTypeBadge';
import StatusBadge from '../../components/StatusBadge';
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
      showToast(`Canteen is now ${newStatus ? 'OPEN' : 'CLOSED'}`);
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
      {/* Top Navbar */}
      <View style={[styles.topNavbar, { paddingTop: Math.max(insets.top + spacing.sm, 40) }]}>
        <Logo size="small" showTagline={false} />
        <View style={styles.navBusinessBadge}>
          <Ionicons name="storefront" size={13} color={colors.primary} style={{ marginRight: 5 }} />
          <Text style={styles.navBusinessText} numberOfLines={1}>
            {provider?.name || `${currentUser?.name}'s Canteen`}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {/* Canteen Hero Card */}
        <View style={styles.headerHero}>
          <View style={styles.headerHeroGlow} />
          <View style={styles.headerTopRow}>
            <View style={styles.canteenIconBox}>
              <Ionicons name="storefront" size={18} color={colors.primary} />
            </View>

            <View style={{ flex: 1, marginRight: spacing.xs }}>
              <Text style={styles.heroEyebrow}>Your Canteen</Text>
              <Text style={styles.canteenTitle} numberOfLines={1}>
                {provider?.name || `${currentUser?.name}'s Canteen`}
              </Text>
              <Text style={styles.managerSubtitle} numberOfLines={1}>
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
              <Text style={[styles.statusToggleText, provider?.isOpen === false && { color: colors.danger }]}>
                {provider?.isOpen === false ? 'Closed' : 'Open'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3 KPI Stats Cards */}
        <View style={styles.kpiGrid}>
          {/* Today's Sales */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: colors.successLight }]}>
              <Ionicons name="wallet-outline" size={16} color={colors.success} />
            </View>
            <Text style={styles.kpiLabel}>Today's Sales</Text>
            <Text style={styles.kpiValue}>৳ {todayRevenue.toLocaleString()}</Text>
            <Text style={styles.kpiSub}>Total: ৳ {totalRevenue.toLocaleString()}</Text>
          </View>

          {/* Total Orders */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="receipt-outline" size={16} color={colors.primary} />
            </View>
            <Text style={styles.kpiLabel}>Total Orders</Text>
            <Text style={styles.kpiValue}>{totalOrdersCount}</Text>
            <Text style={[styles.kpiSub, pendingOrdersCount > 0 && { color: colors.danger, fontFamily: fonts.bold }]}>
              Pending: {pendingOrdersCount}
            </Text>
          </View>

          {/* Rating */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: colors.ratingBg }]}>
              <Ionicons name="star" size={15} color={colors.rating} />
            </View>
            <Text style={styles.kpiLabel}>Avg. Rating</Text>
            <Text style={styles.kpiValue}>★ {avgRating}</Text>
            <Text style={styles.kpiSub}>{reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}</Text>
          </View>
        </View>

        {/* Weekly Sales Trend Chart */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionEyebrow}>Performance</Text>
              <Text style={styles.sectionHeading}>Weekly Sales Trend</Text>
              <Text style={styles.sectionSub}>Daily revenue (BDT)</Text>
            </View>
            <View style={styles.timeTag}>
              <Ionicons name="calendar-outline" size={11} color={colors.textGray} style={{ marginRight: 4 }} />
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
            <Text style={styles.sectionEyebrow}>Breakdown</Text>
            <Text style={styles.sectionHeading}>Distribution</Text>
            <Text style={styles.sectionSub}>Fulfillment split</Text>

            <View style={styles.progressItem}>
              <View style={styles.progressLabelRow}>
                <View style={styles.progressLabelLeft}>
                  <View style={[styles.progressIconChip, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="bicycle" size={11} color={colors.primary} />
                  </View>
                  <Text style={styles.progressLabel}>Delivery</Text>
                </View>
                <Text style={styles.progressPercent}>{deliveryPercent}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${deliveryPercent}%`, backgroundColor: colors.primary }]} />
              </View>
            </View>

            <View style={styles.progressItem}>
              <View style={styles.progressLabelRow}>
                <View style={styles.progressLabelLeft}>
                  <View style={[styles.progressIconChip, { backgroundColor: colors.infoLight }]}>
                    <Ionicons name="storefront-outline" size={11} color={colors.info} />
                  </View>
                  <Text style={styles.progressLabel}>Pickup</Text>
                </View>
                <Text style={styles.progressPercent}>{pickupPercent}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${pickupPercent}%`, backgroundColor: colors.info }]} />
              </View>
            </View>
          </View>

          {/* Top Selling Items */}
          <View style={styles.halfCard}>
            <Text style={styles.sectionEyebrow}>Bestsellers</Text>
            <Text style={styles.sectionHeading}>Top Dishes</Text>
            <Text style={styles.sectionSub}>Most ordered</Text>

            {topItems.length === 0 ? (
              <View style={styles.noDataBox}>
                <Ionicons name="restaurant-outline" size={22} color={colors.textLight} />
                <Text style={styles.noDataText}>No orders yet</Text>
              </View>
            ) : (
              topItems.map((item, idx) => (
                <View key={item.name} style={styles.topDishRow}>
                  <View
                    style={[
                      styles.rankCircle,
                      idx === 0 && styles.rankGold,
                      idx === 1 && styles.rankSilver,
                      idx === 2 && styles.rankBronze,
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
              <Text style={styles.sectionEyebrow}>Activity</Text>
              <Text style={styles.sectionHeading}>Incoming & Recent Orders</Text>
              <Text style={styles.sectionSub}>Latest student requests</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Orders')} activeOpacity={0.7} style={styles.viewAllBtn}>
              <Text style={styles.viewAllLink}>View All</Text>
              <Ionicons name="chevron-forward" size={13} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {recentOrders.length === 0 ? (
            <View style={styles.emptyRecentBox}>
              <View style={styles.emptyRecentIcon}>
                <Ionicons name="receipt-outline" size={22} color={colors.primary} />
              </View>
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
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderCustomerName} numberOfLines={1}>{customerName}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
                        <OrderTypeBadge type={ord.type} />
                        <Text style={styles.orderPriceText}>
                          ৳{ord.total}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.orderRightCol}>
                    <StatusBadge status={ord.status} />
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topNavbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm + 2,
    backgroundColor: colors.card,
    borderBottomLeftRadius: spacing.borderRadiusLg,
    borderBottomRightRadius: spacing.borderRadiusLg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 3,
  },
  navBusinessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
    maxWidth: '58%',
  },
  navBusinessText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 110,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Canteen Hero Card */
  headerHero: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: colors.shadowStrong,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 4,
  },
  headerHeroGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.primaryGlow,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  canteenIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  heroEyebrow: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  canteenTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 17,
    color: colors.textDark,
    letterSpacing: -0.3,
  },
  managerSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textGray,
    marginTop: 3,
  },
  statusTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
  },
  statusOpen: {
    backgroundColor: colors.successLight,
  },
  statusClosed: {
    backgroundColor: colors.dangerLight,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  dotOpen: {
    backgroundColor: colors.success,
  },
  dotClosed: {
    backgroundColor: colors.danger,
  },
  statusToggleText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.success,
  },

  /* KPIs */
  kpiGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.md,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusLg,
    padding: 12,
    shadowColor: colors.shadowStrong,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 3,
  },
  kpiIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: colors.textGray,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  kpiValue: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
    color: colors.textDark,
    marginTop: 4,
    letterSpacing: -0.2,
  },
  kpiSub: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.textLight,
    marginTop: 4,
  },

  /* Section Card */
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.shadowStrong,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  sectionEyebrow: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  sectionHeading: {
    fontFamily: fonts.headingBold,
    fontSize: 15,
    color: colors.textDark,
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textGray,
    marginTop: 2,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: spacing.borderRadiusFull,
  },
  timeTagText: {
    fontFamily: fonts.semiBold,
    fontSize: 10.5,
    color: colors.textGray,
  },

  /* Bar Chart */
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 12,
    paddingBottom: 2,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBarValue: {
    fontFamily: fonts.semiBold,
    fontSize: 9.5,
    color: colors.textGray,
    marginBottom: 4,
  },
  chartTrack: {
    width: 14,
    height: 85,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: colors.border,
    borderRadius: 7,
  },
  chartBarActive: {
    backgroundColor: colors.primary,
  },
  chartDayLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 10.5,
    color: colors.textGray,
    marginTop: 7,
  },

  /* Split Row */
  splitRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.md,
  },
  halfCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.md,
    shadowColor: colors.shadowStrong,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 3,
  },
  progressItem: {
    marginTop: spacing.sm + 2,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressIconChip: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    color: colors.textDark,
  },
  progressPercent: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.textDark,
  },
  progressBarBg: {
    height: 7,
    backgroundColor: colors.surfaceSubtle,
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
    paddingVertical: 4,
  },
  rankCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
  },
  rankGold: {
    backgroundColor: colors.rating,
  },
  rankSilver: {
    backgroundColor: colors.textLight,
  },
  rankBronze: {
    backgroundColor: colors.ratingText,
  },
  rankNum: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.white,
  },
  dishName: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textDark,
  },
  dishSales: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: colors.textGray,
    marginTop: 1,
  },
  noDataBox: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: 4,
  },
  noDataText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textLight,
    marginTop: spacing.xs,
  },

  /* Recent Orders */
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: spacing.borderRadiusFull,
    gap: 2,
  },
  viewAllLink: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    color: colors.primary,
  },
  emptyRecentBox: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyRecentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRecentText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textGray,
    marginTop: 2,
  },
  recentOrderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: spacing.xs,
  },
  orderIdBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: spacing.borderRadiusSm,
  },
  orderIdText: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    color: colors.primary,
  },
  orderCustomerName: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textDark,
  },
  orderPriceText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.textDark,
  },
  orderRightCol: {
    alignItems: 'flex-end',
  },
});

export default SellerDashboardScreen;
