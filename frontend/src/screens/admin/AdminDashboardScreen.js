import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing } from "../../theme/colors";
import AdminHeader from "../../components/AdminHeader";
import StatCard from "../../components/StatCard";
import OrderCard from "../../components/OrderCard";
import StatusBadge from "../../components/StatusBadge";
import DataService from "../../api/DataService";

const AdminDashboardScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [providers, setProviders] = useState([]);

  // Active modal state
  const [activeModal, setActiveModal] = useState(null); // 'revenue' | 'orders' | 'users' | 'sellers' | 'orderDetail'
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [allOrders, allUsers, allProviders] = await Promise.all([
        DataService.getAllOrders(),
        DataService.getUsers(),
        DataService.getProviders(),
      ]);

      setOrders(allOrders || []);
      setUsers(allUsers || []);
      setProviders(allProviders || []);
    } catch (e) {
      console.warn("AdminDashboard load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Calculations
  const buyers = useMemo(
    () => users.filter((u) => u.role === "buyer"),
    [users],
  );
  const sellers = useMemo(
    () => users.filter((u) => u.role === "seller"),
    [users],
  );
  const totalRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + (o.total || 0), 0),
    [orders],
  );
  const totalFoodRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + (o.subtotal || o.total || 0), 0),
    [orders],
  );
  const totalDeliveryFees = useMemo(
    () => orders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0),
    [orders],
  );

  // Revenue by Canteen breakdown
  const canteenRevenueList = useMemo(() => {
    return providers
      .map((prov) => {
        const provId = String(prov._id || prov.id);
        const provOrders = orders.filter(
          (o) => String(o.provider?._id || o.provider) === provId,
        );
        const provRev = provOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const share =
          totalRevenue > 0 ? ((provRev / totalRevenue) * 100).toFixed(1) : 0;
        return {
          provider: prov,
          name: prov.name,
          location: prov.location || "CUET Campus",
          ordersCount: provOrders.length,
          revenue: provRev,
          share,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [providers, orders, totalRevenue]);

  // Orders status distribution
  const orderStatusCounts = useMemo(() => {
    const counts = {
      DELIVERED: 0,
      PICKED_UP: 0,
      PREPARING: 0,
      READY: 0,
      PENDING: 0,
      CANCELLED: 0,
    };
    orders.forEach((o) => {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      } else {
        counts[o.status] = 1;
      }
    });
    return counts;
  }, [orders]);

  // User type distribution
  const userTypeCounts = useMemo(() => {
    const counts = { Student: 0, Teacher: 0, Staff: 0, Blocked: 0 };
    buyers.forEach((b) => {
      const type = b.buyerType || "Student";
      if (counts[type] !== undefined) counts[type]++;
      if (b.isBlocked) counts.Blocked++;
    });
    return counts;
  }, [buyers]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [orders]);

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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>
          Interactive overview — tap any card to explore breakdowns
        </Text>

        {/* Interactive Stats 2x2 Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              label="Total Revenue"
              value={`৳ ${totalRevenue.toLocaleString()}`}
              trend="All-time"
              trendColor={colors.success}
              onPress={() => setActiveModal("revenue")}
              icon="cash-outline"
            />
            <StatCard
              label="Total Orders"
              value={orders.length.toString()}
              trend="All Sellers"
              onPress={() => setActiveModal("orders")}
              icon="receipt-outline"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              label="Registered Users"
              value={buyers.length.toString()}
              trend="Student accounts"
              onPress={() => setActiveModal("users")}
              icon="people-outline"
            />
            <StatCard
              label="Active Sellers"
              value={sellers.length.toString()}
              trend="Canteens & Carts"
              trendColor={colors.info}
              onPress={() => setActiveModal("sellers")}
              icon="storefront-outline"
            />
          </View>
        </View>

        {/* Recent Global Orders Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Global Orders</Text>
          <TouchableOpacity
            onPress={() => navigation?.navigate("AdminOrders")}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All ({orders.length}) →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          {recentOrders.length === 0 ? (
            <Text style={styles.emptyText}>No orders placed yet.</Text>
          ) : (
            recentOrders.map((order) => (
              <TouchableOpacity
                key={order._id || order.id}
                onPress={() => {
                  setSelectedOrder(order);
                  setActiveModal("orderDetail");
                }}
                activeOpacity={0.8}
              >
                <OrderCard order={order} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* 1. TOTAL REVENUE BREAKDOWN MODAL */}
      <Modal
        visible={activeModal === "revenue"}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Revenue Breakdown</Text>
                <Text style={styles.modalSubtitle}>
                  Total Gross Volume per Canteen
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setActiveModal(null)}
              >
                <Ionicons name="close" size={20} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            {/* Overview Summary */}
            <View style={styles.revenueSummaryCard}>
              <View style={styles.revSummaryItem}>
                <Text style={styles.revSummaryLabel}>Gross GMV</Text>
                <Text style={styles.revSummaryValue}>
                  ৳{totalRevenue.toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.revSummaryItem}>
                <Text style={styles.revSummaryLabel}>Food Sales</Text>
                <Text
                  style={[styles.revSummaryValue, { color: colors.textDark }]}
                >
                  ৳{totalFoodRevenue.toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.revSummaryItem}>
                <Text style={styles.revSummaryLabel}>Delivery Fees</Text>
                <Text style={[styles.revSummaryValue, { color: colors.info }]}>
                  ৳{totalDeliveryFees.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* List of Canteens */}
            <Text style={styles.modalSectionLabel}>
              Revenue by Canteen (Ranked):
            </Text>
            <ScrollView
              style={{ maxHeight: 320 }}
              showsVerticalScrollIndicator={false}
            >
              {canteenRevenueList.map((item, idx) => (
                <View
                  key={item.provider._id || idx}
                  style={styles.breakdownItem}
                >
                  <View style={styles.breakdownRank}>
                    <Text style={styles.rankText}>#{idx + 1}</Text>
                  </View>
                  <View style={styles.breakdownInfo}>
                    <Text style={styles.breakdownName}>{item.name}</Text>
                    <Text style={styles.breakdownLoc}>{item.location}</Text>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${Math.max(Number(item.share), 4)}%` },
                        ]}
                      />
                    </View>
                  </View>
                  <View style={styles.breakdownStats}>
                    <Text style={styles.breakdownAmount}>
                      ৳{item.revenue.toLocaleString()}
                    </Text>
                    <Text style={styles.breakdownOrders}>
                      {item.ordersCount} orders ({item.share}%)
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 2. TOTAL ORDERS BREAKDOWN MODAL */}
      <Modal
        visible={activeModal === "orders"}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Orders Status Breakdown</Text>
                <Text style={styles.modalSubtitle}>
                  {orders.length} total orders recorded
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setActiveModal(null)}
              >
                <Ionicons name="close" size={20} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.statusGridModal}>
              {Object.entries(orderStatusCounts).map(([status, count]) => (
                <View key={status} style={styles.statusTile}>
                  <StatusBadge status={status} />
                  <Text style={styles.statusCountText}>{count} orders</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={() => {
                setActiveModal(null);
                navigation?.navigate("AdminOrders");
              }}
            >
              <Text style={styles.modalActionBtnText}>Go to Orders Tab</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3. REGISTERED USERS MODAL */}
      <Modal
        visible={activeModal === "users"}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>User Account Demographics</Text>
                <Text style={styles.modalSubtitle}>
                  {buyers.length} registered campus buyers
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setActiveModal(null)}
              >
                <Ionicons name="close" size={20} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.demographicGrid}>
              <View style={styles.demoCard}>
                <Ionicons name="school" size={24} color={colors.primary} />
                <Text style={styles.demoValue}>{userTypeCounts.Student}</Text>
                <Text style={styles.demoLabel}>Students</Text>
              </View>
              <View style={styles.demoCard}>
                <Ionicons name="person" size={24} color={colors.info} />
                <Text style={styles.demoValue}>{userTypeCounts.Teacher}</Text>
                <Text style={styles.demoLabel}>Teachers</Text>
              </View>
              <View style={styles.demoCard}>
                <Ionicons name="briefcase" size={24} color={colors.purple} />
                <Text style={styles.demoValue}>{userTypeCounts.Staff}</Text>
                <Text style={styles.demoLabel}>Staff</Text>
              </View>
              <View
                style={[styles.demoCard, { borderColor: colors.dangerBorder }]}
              >
                <Ionicons name="ban" size={24} color={colors.danger} />
                <Text style={[styles.demoValue, { color: colors.danger }]}>
                  {userTypeCounts.Blocked}
                </Text>
                <Text style={styles.demoLabel}>Blocked</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={() => {
                setActiveModal(null);
                navigation?.navigate("AdminUsers");
              }}
            >
              <Text style={styles.modalActionBtnText}>
                Manage Users in Users Tab
              </Text>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 4. ACTIVE SELLERS MODAL */}
      <Modal
        visible={activeModal === "sellers"}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Campus Canteens & Carts</Text>
                <Text style={styles.modalSubtitle}>
                  {providers.length} registered food providers
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setActiveModal(null)}
              >
                <Ionicons name="close" size={20} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 300 }}
              showsVerticalScrollIndicator={false}
            >
              {providers.map((p) => (
                <View key={p._id || p.id} style={styles.sellerModalItem}>
                  <View style={styles.sellerIconBadge}>
                    <Ionicons
                      name="storefront"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sellerModalName}>{p.name}</Text>
                    <Text style={styles.sellerModalLoc}>
                      {p.location || "CUET Campus"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusIndicator,
                      {
                        backgroundColor: p.isBlocked
                          ? colors.dangerLight
                          : colors.successLight,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusIndicatorText,
                        { color: p.isBlocked ? colors.danger : colors.success },
                      ]}
                    >
                      {p.isBlocked ? "Suspended" : "Active"}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={() => {
                setActiveModal(null);
                navigation?.navigate("AdminSellers");
              }}
            >
              <Text style={styles.modalActionBtnText}>
                Manage Sellers in Sellers Tab
              </Text>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 5. ORDER DETAIL MODAL */}
      <Modal
        visible={activeModal === "orderDetail" && !!selectedOrder}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Order #
                  {String(selectedOrder?._id || selectedOrder?.id || "").slice(
                    -6,
                  )}
                </Text>
                <Text style={styles.modalSubtitle}>Full Order Inspection</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setActiveModal(null)}
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
                  <Text style={styles.orderDetailLabel}>Customer:</Text>
                  <Text style={styles.orderDetailVal}>
                    {typeof selectedOrder.customer === "object"
                      ? selectedOrder.customer?.name
                      : selectedOrder.customer || "Student"}
                  </Text>
                </View>

                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Canteen:</Text>
                  <Text style={styles.orderDetailVal}>
                    {typeof selectedOrder.provider === "object"
                      ? selectedOrder.provider?.name
                      : selectedOrder.providerName || "Vendor"}
                  </Text>
                </View>

                {selectedOrder.deliveryAddress ? (
                  <View style={styles.orderDetailRow}>
                    <Text style={styles.orderDetailLabel}>Address:</Text>
                    <Text style={styles.orderDetailVal}>
                      {selectedOrder.deliveryAddress}
                    </Text>
                  </View>
                ) : null}

                <Text style={[styles.modalSectionLabel, { marginTop: 12 }]}>
                  Items Ordered:
                </Text>
                <View style={styles.orderItemsBox}>
                  {(selectedOrder.items || []).map((item, i) => (
                    <View key={i} style={styles.itemLine}>
                      <Text style={styles.itemLineQty}>{item.qty || 1}x</Text>
                      <Text style={styles.itemLineName}>{item.name}</Text>
                      <Text style={styles.itemLinePrice}>
                        ৳{(item.price || 0) * (item.qty || 1)}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.orderSummaryBox}>
                  <View style={styles.summaryLine}>
                    <Text style={styles.sumLineLabel}>Subtotal</Text>
                    <Text style={styles.sumLineVal}>
                      ৳{selectedOrder.subtotal || selectedOrder.total}
                    </Text>
                  </View>
                  <View style={styles.summaryLine}>
                    <Text style={styles.sumLineLabel}>Delivery Fee</Text>
                    <Text style={styles.sumLineVal}>
                      ৳{selectedOrder.deliveryFee || 0}
                    </Text>
                  </View>
                  <View style={[styles.summaryLine, styles.totalLine]}>
                    <Text style={styles.totalLineLabel}>Total Paid</Text>
                    <Text style={styles.totalLineVal}>
                      ৳{selectedOrder.total}
                    </Text>
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 120,
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
    marginBottom: spacing.md + 4,
  },
  statsGrid: {
    gap: spacing.sm,
    marginBottom: spacing.md + 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
  },
  viewAllText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    textAlign: "center",
    color: colors.textGray,
    paddingVertical: spacing.lg,
    fontFamily: fonts.regular,
    fontSize: 14,
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: spacing.borderRadiusLg,
    borderTopRightRadius: spacing.borderRadiusLg,
    padding: spacing.lg,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
    alignItems: "center",
    justifyContent: "center",
  },
  modalSectionLabel: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.textGray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  revenueSummaryCard: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  revSummaryItem: {
    flex: 1,
    alignItems: "center",
  },
  revSummaryLabel: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.textGray,
    marginBottom: 4,
  },
  revSummaryValue: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    color: colors.success,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.borderDark,
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  breakdownRank: {
    width: 30,
    alignItems: "center",
  },
  rankText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  breakdownInfo: {
    flex: 1,
    paddingHorizontal: 8,
  },
  breakdownName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textDark,
  },
  breakdownLoc: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textGray,
    marginBottom: 4,
  },
  progressBarBg: {
    height: 5,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  breakdownStats: {
    alignItems: "flex-end",
  },
  breakdownAmount: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.textDark,
  },
  breakdownOrders: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textGray,
  },
  statusGridModal: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statusTile: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.sm + 4,
    borderRadius: spacing.borderRadiusSm,
  },
  statusCountText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.textDark,
  },
  demographicGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  demoCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  demoValue: {
    fontSize: 22,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
    marginVertical: 4,
  },
  demoLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textGray,
  },
  sellerModalItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sellerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  sellerModalName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textDark,
  },
  sellerModalLoc: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textGray,
  },
  statusIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIndicatorText: {
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  modalActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: spacing.borderRadiusFull,
    gap: 8,
    marginTop: spacing.sm,
  },
  modalActionBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.white,
  },

  // Order Details in Modal
  orderDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    flexDirection: "row",
    justifyContent: "space-between",
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
    flexDirection: "row",
    justifyContent: "space-between",
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

export default AdminDashboardScreen;
