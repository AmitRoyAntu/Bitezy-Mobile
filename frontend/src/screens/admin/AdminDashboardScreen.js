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
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { useToast } from "../../context/ToastContext";
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
  const [reviews, setReviews] = useState([]);

  // Active modal state
  const [activeModal, setActiveModal] = useState(null); // 'revenue' | 'orders' | 'users' | 'sellers' | 'orderDetail' | 'coupons'
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Coupon management states
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCreateCoupon, setShowCreateCoupon] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState("percent");
  const [newValue, setNewValue] = useState("");
  const [newMinOrder, setNewMinOrder] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creatingCoupon, setCreatingCoupon] = useState(false);

  const loadCoupons = useCallback(async () => {
    setLoadingCoupons(true);
    try {
      const data = await DataService.getCoupons();
      setCoupons(data || []);
    } catch (e) {
      showToast("Could not load coupons", "error");
    } finally {
      setLoadingCoupons(false);
    }
  }, [showToast]);

  const handleCreateCoupon = async () => {
    if (!newCode.trim()) {
      showToast("Please enter a coupon code", "warning");
      return;
    }
    if (!newValue || Number(newValue) <= 0) {
      showToast("Please enter a valid discount value", "warning");
      return;
    }
    setCreatingCoupon(true);
    try {
      await DataService.createCoupon({
        code: newCode.trim().toUpperCase(),
        discountType: newType,
        discountValue: Number(newValue),
        minOrderAmount: Number(newMinOrder) || 0,
        description: newDesc.trim() || undefined,
      });
      showToast(`Coupon ${newCode.toUpperCase()} created successfully! 🎉`, "success");
      setNewCode("");
      setNewValue("");
      setNewMinOrder("");
      setNewDesc("");
      setShowCreateCoupon(false);
      await loadCoupons();
    } catch (err) {
      showToast(err.message || "Failed to create coupon", "error");
    } finally {
      setCreatingCoupon(false);
    }
  };

  const handleToggleCoupon = async (id) => {
    try {
      const updated = await DataService.toggleCoupon(id);
      setCoupons((prev) =>
        prev.map((c) => (c._id === id ? { ...c, isActive: updated.isActive } : c))
      );
      showToast(`Coupon is now ${updated.isActive ? "Active" : "Inactive"}`, "info");
    } catch (err) {
      showToast(err.message || "Failed to update coupon status", "error");
    }
  };

  const handleDeleteCoupon = (id, code) => {
    const doDelete = async () => {
      try {
        await DataService.deleteCoupon(id);
        setCoupons((prev) => prev.filter((c) => c._id !== id));
        showToast(`Coupon ${code} deleted`, "info");
      } catch (err) {
        showToast(err.message || "Failed to delete coupon", "error");
      }
    };

    if (Platform.OS === "web" && typeof window !== "undefined") {
      if (window.confirm(`Delete coupon ${code}?`)) doDelete();
    } else {
      Alert.alert("Delete Coupon", `Are you sure you want to delete coupon ${code}?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  const loadData = useCallback(async () => {
    try {
      const [allOrders, allUsers, allProviders, allReviews] = await Promise.all([
        DataService.getAdminOrders(),
        DataService.getAdminUsers(),
        DataService.getAdminSellers(),
        DataService.getAdminReviews(),
      ]);

      setOrders(allOrders || []);
      setUsers(allUsers || []);
      setProviders(allProviders || []);
      setReviews(allReviews || []);
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

  // Calculations directly derived from database models
  const buyers = useMemo(
    () => users.filter((u) => u.role === "buyer"),
    [users],
  );
  const sellers = useMemo(
    () => users.filter((u) => u.role === "seller"),
    [users],
  );
  const totalRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
    [orders],
  );
  const totalFoodRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + (Number(o.subtotal) || Number(o.total) || 0), 0),
    [orders],
  );
  const totalDeliveryFees = useMemo(
    () => orders.reduce((sum, o) => sum + (Number(o.deliveryFee) || 0), 0),
    [orders],
  );

  // Revenue by Canteen breakdown
  const canteenRevenueList = useMemo(() => {
    return providers
      .map((prov) => {
        const provId = String(prov._id || prov.id || "");
        const provOrders = orders.filter((o) => {
          const oProvId = String(o.provider?._id || o.provider?.id || o.provider || "");
          return oProvId === provId;
        });
        const provRev = provOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        const share =
          totalRevenue > 0 ? ((provRev / totalRevenue) * 100).toFixed(1) : "0.0";
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
      PENDING: 0,
      PREPARING: 0,
      READY: 0,
      ON_THE_WAY: 0,
      DELIVERED: 0,
      PICKED_UP: 0,
      CANCELLED: 0,
    };
    orders.forEach((o) => {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      } else if (o.status) {
        counts[o.status] = 1;
      }
    });
    return counts;
  }, [orders]);

  // User type distribution
  const userTypeCounts = useMemo(() => {
    const counts = { Student: 0, Teacher: 0, Staff: 0, Seller: 0, Blocked: 0 };
    users.forEach((u) => {
      if (u.isBlocked) counts.Blocked++;
      if (u.role === "seller") {
        counts.Seller++;
      } else if (u.role === "buyer") {
        const type = (u.buyerType || "Student").toLowerCase();
        if (type === "teacher") counts.Teacher++;
        else if (type === "staff") counts.Staff++;
        else counts.Student++;
      }
    });
    return counts;
  }, [users]);

  // Reviews summary metrics
  const reviewsStats = useMemo(() => {
    const total = reviews.length;
    if (total === 0) return { total: 0, avgRating: "0.0" };
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return {
      total,
      avgRating: (sum / total).toFixed(1),
    };
  }, [reviews]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [orders]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading campus dashboard from database...</Text>
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
          Campus overview from live database — tap any card to inspect details
        </Text>

        {/* Interactive Stats 2x2 Grid with Real Database Metrics */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              label="Total Revenue"
              value={`৳ ${totalRevenue.toLocaleString()}`}
              trend={`${orders.length} orders total`}
              trendColor={colors.success}
              onPress={() => setActiveModal("revenue")}
              icon="cash-outline"
            />
            <StatCard
              label="Total Orders"
              value={orders.length.toString()}
              trend={`${orderStatusCounts.PENDING} pending`}
              trendColor={orderStatusCounts.PENDING > 0 ? colors.warning : colors.textGray}
              onPress={() => setActiveModal("orders")}
              icon="receipt-outline"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              label="Registered Accounts"
              value={users.length.toString()}
              trend={`${buyers.length} buyers • ${sellers.length} sellers`}
              onPress={() => setActiveModal("users")}
              icon="people-outline"
            />
            <StatCard
              label="Campus Canteens"
              value={providers.length.toString()}
              trend={`${providers.filter((p) => !p.isBlocked).length} active shops`}
              trendColor={colors.info}
              onPress={() => setActiveModal("sellers")}
              icon="storefront-outline"
            />
          </View>
        </View>

        {/* Promo & Coupon Manager Banner */}
        <TouchableOpacity
          style={styles.couponBanner}
          onPress={() => {
            loadCoupons();
            setActiveModal("coupons");
          }}
          activeOpacity={0.85}
        >
          <View style={styles.couponBannerLeft}>
            <View style={styles.couponBannerIconBox}>
              <Ionicons name="pricetags" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.couponBannerTitle}>Promo Codes & Discounts</Text>
              <Text style={styles.couponBannerSubtitle}>
                Create and manage active campus coupons
              </Text>
            </View>
          </View>
          <View style={styles.couponBannerBtn}>
            <Text style={styles.couponBannerBtnText}>Manage</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.white} />
          </View>
        </TouchableOpacity>

        {/* Seller Reviews & Feedback Banner */}
        <TouchableOpacity
          style={styles.reviewsBanner}
          onPress={() => navigation?.navigate("AdminReviews")}
          activeOpacity={0.85}
        >
          <View style={styles.couponBannerLeft}>
            <View style={[styles.couponBannerIconBox, { backgroundColor: "rgba(238, 82, 83, 0.1)" }]}>
              <Ionicons name="star" size={20} color={colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.couponBannerTitle}>Campus Reviews & Moderation</Text>
              <Text style={styles.couponBannerSubtitle}>
                {reviewsStats.total} customer feedback ({reviewsStats.avgRating} ★ average)
              </Text>
            </View>
          </View>
          <View style={[styles.couponBannerBtn, { backgroundColor: colors.secondary }]}>
            <Text style={styles.couponBannerBtnText}>View Reviews</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.white} />
          </View>
        </TouchableOpacity>

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
            <Text style={styles.emptyText}>No orders recorded in database yet.</Text>
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
                  Gross Campus Volume per Canteen (from MongoDB)
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
                  {orders.length} total orders recorded in database
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
                <Text style={styles.modalTitle}>Campus Accounts Breakdown</Text>
                <Text style={styles.modalSubtitle}>
                  {users.length} registered campus accounts in database
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
              <View style={styles.demoCard}>
                <Ionicons name="storefront" size={24} color={colors.secondary} />
                <Text style={styles.demoValue}>{userTypeCounts.Seller}</Text>
                <Text style={styles.demoLabel}>Sellers</Text>
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
                  {providers.length} registered food providers in database
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

      {/* 0. PROMO COUPONS MANAGEMENT MODAL */}
      <Modal
        visible={activeModal === "coupons"}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: "90%" }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Campus Promo Coupons</Text>
                <Text style={styles.modalSubtitle}>
                  Active discounts valid at checkout (from MongoDB)
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setActiveModal(null);
                  setShowCreateCoupon(false);
                }}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Header / Create Toggle */}
              <View style={styles.couponActionRow}>
                <Text style={styles.couponListHeaderTitle}>
                  All Coupons ({coupons.length})
                </Text>
                <TouchableOpacity
                  style={styles.createCouponToggleBtn}
                  onPress={() => setShowCreateCoupon(!showCreateCoupon)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={showCreateCoupon ? "close-circle" : "add-circle"}
                    size={16}
                    color={colors.white}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.createCouponToggleBtnText}>
                    {showCreateCoupon ? "Cancel" : "New Coupon"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Create Coupon Form */}
              {showCreateCoupon && (
                <View style={styles.createCouponCard}>
                  <Text style={styles.createCouponTitle}>Create New Promo Code</Text>

                  <Text style={styles.formInputLabel}>Coupon Code *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. FEST25, EID50"
                    placeholderTextColor={colors.textLight}
                    value={newCode}
                    onChangeText={setNewCode}
                    autoCapitalize="characters"
                  />

                  <Text style={styles.formInputLabel}>Discount Type *</Text>
                  <View style={styles.typeSelectorRow}>
                    {[
                      { key: "percent", label: "Percent (%)" },
                      { key: "flat", label: "Flat (৳)" },
                      { key: "delivery", label: "Free Delivery" },
                    ].map((t) => (
                      <TouchableOpacity
                        key={t.key}
                        style={[
                          styles.typePill,
                          newType === t.key && styles.typePillActive,
                        ]}
                        onPress={() => setNewType(t.key)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.typePillText,
                            newType === t.key && styles.typePillTextActive,
                          ]}
                        >
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formInputLabel}>
                        {newType === "percent" ? "Discount % *" : "Amount (৳) *"}
                      </Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder={newType === "percent" ? "e.g. 10" : "e.g. 30"}
                        placeholderTextColor={colors.textLight}
                        value={newValue}
                        onChangeText={setNewValue}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formInputLabel}>Min Order (৳)</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="e.g. 100"
                        placeholderTextColor={colors.textLight}
                        value={newMinOrder}
                        onChangeText={setNewMinOrder}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <Text style={styles.formInputLabel}>Description</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 10% off on all campus meals"
                    placeholderTextColor={colors.textLight}
                    value={newDesc}
                    onChangeText={setNewDesc}
                  />

                  <TouchableOpacity
                    style={styles.submitCouponBtn}
                    onPress={handleCreateCoupon}
                    disabled={creatingCoupon}
                    activeOpacity={0.85}
                  >
                    {creatingCoupon ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={16} color={colors.white} style={{ marginRight: 6 }} />
                        <Text style={styles.submitCouponBtnText}>Save & Activate Coupon</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Coupons List */}
              {loadingCoupons ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
              ) : coupons.length === 0 ? (
                <Text style={styles.emptyCouponText}>No coupons created yet. Tap "New Coupon" to add one.</Text>
              ) : (
                coupons.map((coupon) => (
                  <View key={coupon._id || coupon.id} style={styles.couponItemCard}>
                    <View style={styles.couponItemTopRow}>
                      <View style={styles.couponCodeBadge}>
                        <Ionicons name="pricetag" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                        <Text style={styles.couponCodeText}>{coupon.code}</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <TouchableOpacity
                          style={[
                            styles.couponStatusPill,
                            coupon.isActive ? styles.couponStatusActive : styles.couponStatusInactive,
                          ]}
                          onPress={() => handleToggleCoupon(coupon._id || coupon.id)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.couponStatusText,
                              coupon.isActive ? styles.couponStatusTextActive : styles.couponStatusTextInactive,
                            ]}
                          >
                            {coupon.isActive ? "Active" : "Paused"}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteCoupon(coupon._id || coupon.id, coupon.code)}
                          style={styles.couponDeleteBtn}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={styles.couponDescText}>
                      {coupon.description || `${coupon.discountValue}${coupon.discountType === "percent" ? "%" : "৳"} off`}
                    </Text>

                    <View style={styles.couponDetailsRow}>
                      <Text style={styles.couponMetaText}>
                        Type: <Text style={{ fontFamily: fonts.semiBold, color: colors.textDark }}>{coupon.discountType}</Text>
                      </Text>
                      {coupon.minOrderAmount > 0 ? (
                        <Text style={styles.couponMetaText}>
                          Min Order: <Text style={{ fontFamily: fonts.semiBold, color: colors.textDark }}>৳ {coupon.minOrderAmount}</Text>
                        </Text>
                      ) : null}
                      <Text style={styles.couponMetaText}>
                        Used: <Text style={{ fontFamily: fonts.semiBold, color: colors.primary }}>{coupon.usedCount || 0} times</Text>
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
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
                  Order #{String(selectedOrder?._id || selectedOrder?.id || "").slice(-6)}
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
                      : selectedOrder.customer || "Campus Customer"}
                  </Text>
                </View>

                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Canteen:</Text>
                  <Text style={styles.orderDetailVal}>
                    {typeof selectedOrder.provider === "object"
                      ? selectedOrder.provider?.name
                      : selectedOrder.providerName || "Campus Canteen"}
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
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textGray,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 120, // Generous padding so FloatingTabBar never covers content
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
  statsGrid: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  couponBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: spacing.sm + 2,
  },
  reviewsBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: spacing.md,
  },
  couponBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
    flex: 1,
    marginRight: spacing.sm,
  },
  couponBannerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  couponBannerTitle: {
    fontSize: 15,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
  },
  couponBannerSubtitle: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textGray,
    marginTop: 2,
  },
  couponBannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: spacing.borderRadiusSm,
  },
  couponBannerBtnText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
  },
  viewAllText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  emptyText: {
    textAlign: "center",
    color: colors.textGray,
    fontFamily: fonts.regular,
    fontSize: 14,
    paddingVertical: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.md,
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
  revenueSummaryCard: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  revSummaryItem: {
    flex: 1,
    alignItems: "center",
  },
  revSummaryLabel: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.textGray,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  revSummaryValue: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    color: colors.primary,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  modalSectionLabel: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textGray,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
  },
  breakdownRank: {
    width: 32,
    alignItems: "center",
  },
  rankText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.textLight,
  },
  breakdownInfo: {
    flex: 1,
    paddingHorizontal: spacing.sm,
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
    marginTop: 1,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 2,
    marginTop: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  breakdownStats: {
    alignItems: "flex-end",
  },
  breakdownAmount: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  breakdownOrders: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textGray,
    marginTop: 2,
  },
  statusGridModal: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statusTile: {
    width: "48%",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: spacing.borderRadiusSm,
    padding: spacing.sm + 4,
    gap: 8,
  },
  statusCountText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textDark,
  },
  modalActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: spacing.borderRadiusMd,
    gap: 8,
    marginTop: spacing.sm,
  },
  modalActionBtnText: {
    color: colors.white,
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  demographicGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  demoCard: {
    width: "48%",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  demoValue: {
    fontSize: 22,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
    marginTop: 4,
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
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
  },
  sellerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  sellerModalName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textDark,
  },
  sellerModalLoc: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textGray,
    marginTop: 2,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusIndicatorText: {
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  couponActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm + 2,
    marginTop: 4,
  },
  couponListHeaderTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.textDark,
  },
  createCouponToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusSm,
  },
  createCouponToggleBtnText: {
    color: colors.white,
    fontFamily: fonts.semiBold,
    fontSize: 12,
  },
  createCouponCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  createCouponTitle: {
    fontSize: 15,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  formInputLabel: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.textGray,
    marginBottom: 4,
    marginTop: 6,
  },
  formInput: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusSm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textDark,
  },
  typeSelectorRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
  },
  typePill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: spacing.borderRadiusSm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typePillText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textDark,
  },
  typePillTextActive: {
    color: colors.white,
    fontFamily: fonts.bold,
  },
  submitCouponBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: spacing.borderRadiusSm,
    marginTop: spacing.md,
  },
  submitCouponBtnText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  couponItemCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: spacing.borderRadiusSm,
    padding: spacing.sm + 4,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  couponItemTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  couponCodeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  couponCodeText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  couponStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  couponStatusActive: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  couponStatusInactive: {
    backgroundColor: colors.dangerLight,
  },
  couponStatusText: {
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  couponStatusTextActive: {
    color: colors.success,
  },
  couponStatusTextInactive: {
    color: colors.danger,
  },
  couponDeleteBtn: {
    padding: 4,
  },
  couponDescText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textDark,
    marginTop: 2,
  },
  couponDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  couponMetaText: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textGray,
  },
  emptyCouponText: {
    textAlign: "center",
    color: colors.textGray,
    fontFamily: fonts.regular,
    fontSize: 13,
    paddingVertical: 20,
  },
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
