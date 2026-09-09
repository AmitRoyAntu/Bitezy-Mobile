import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing } from "../../theme/colors";
import AdminHeader from "../../components/AdminHeader";
import SellerCard from "../../components/SellerCard";
import Toast from "../../components/Toast";
import DataService from "../../api/DataService";

const AdminSellersScreen = () => {
  const [sellersData, setSellersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const loadData = useCallback(async () => {
    try {
      const data = await DataService.getAdminSellers();
      setSellersData(data || []);
    } catch (e) {
      console.warn("AdminSellersScreen load error:", e);
      setToast({
        visible: true,
        message: "Failed to load sellers from database",
        type: "error",
      });
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

  const handleToggleBlock = (payloadOrId, maybeBlocked) => {
    let providerId = null;
    let sellerUserId = null;
    let currentBlocked = false;

    if (typeof payloadOrId === "object" && payloadOrId !== null) {
      providerId = payloadOrId.providerId;
      sellerUserId = payloadOrId.sellerUserId;
      currentBlocked = !!payloadOrId.isBlocked;
    } else {
      providerId = payloadOrId;
      currentBlocked = !!maybeBlocked;
    }

    const item = sellersData.find(
      (s) =>
        String(s._id || s.id) === String(providerId) ||
        String(s.seller?._id) === String(sellerUserId) ||
        String(s.seller?._id) === String(providerId)
    );
    const shopName = item?.name || "this canteen";
    const resolvedSellerUserId = sellerUserId || item?.seller?._id;
    const resolvedProviderId = providerId || item?._id || item?.id;

    const actionName = currentBlocked ? "Activate & Reopen" : "Suspend & Close";
    const confirmMsg = `Are you sure you want to ${
      currentBlocked ? "activate and reopen" : "suspend and close"
    } "${shopName}"?\n\n${
      !currentBlocked
        ? "Their storefront will be closed and students will not be able to place orders from this canteen."
        : "Their storefront will be reopened and students can order again."
    }`;

    const performAction = async () => {
      try {
        await DataService.blockSeller({
          providerId: resolvedProviderId,
          sellerUserId: resolvedSellerUserId,
          isBlocked: !currentBlocked,
        });

        setSellersData((prev) =>
          prev.map((s) => {
            const isMatch =
              String(s._id || s.id) === String(resolvedProviderId) ||
              String(s.seller?._id) === String(resolvedSellerUserId);
            if (isMatch) {
              return {
                ...s,
                isBlocked: !currentBlocked,
                isOpen: currentBlocked ? true : false,
                seller: {
                  ...s.seller,
                  isBlocked: !currentBlocked,
                },
              };
            }
            return s;
          })
        );

        setToast({
          visible: true,
          message: `Canteen "${shopName}" ${
            !currentBlocked ? "suspended & closed" : "reactivated & opened"
          } successfully`,
          type: "success",
        });
      } catch (e) {
        setToast({
          visible: true,
          message: e.message || "Failed to update seller status",
          type: "error",
        });
      }
    };

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(confirmMsg)) {
        performAction();
      }
      return;
    }

    Alert.alert(`${actionName} Canteen`, confirmMsg, [
      { text: "Cancel", style: "cancel" },
      {
        text: currentBlocked ? "Activate" : "Suspend",
        style: currentBlocked ? "default" : "destructive",
        onPress: performAction,
      },
    ]);
  };

  // Summary statistics across real database data
  const statsSummary = useMemo(() => {
    const totalCanteens = sellersData.length;
    const totalOrders = sellersData.reduce(
      (sum, s) => sum + (s.stats?.totalOrders || 0),
      0
    );
    const totalRevenue = sellersData.reduce(
      (sum, s) => sum + (s.stats?.totalRevenue || 0),
      0
    );
    const openCount = sellersData.filter((s) => s.isOpen && !s.isBlocked).length;
    const suspendedCount = sellersData.filter((s) => s.isBlocked).length;

    return { totalCanteens, totalOrders, totalRevenue, openCount, suspendedCount };
  }, [sellersData]);

  // Filter & Search Logic
  const filteredSellers = useMemo(() => {
    return sellersData.filter((s) => {
      // Filter tab
      if (selectedFilter === "active" && s.isBlocked) return false;
      if (selectedFilter === "suspended" && !s.isBlocked) return false;
      if (selectedFilter === "open" && (!s.isOpen || s.isBlocked)) return false;
      if (
        ["canteen", "cafeteria", "cart"].includes(selectedFilter) &&
        (s.type || "").toLowerCase() !== selectedFilter
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const shop = (s.name || "").toLowerCase();
        const owner = (s.seller?.name || "").toLowerCase();
        const loc = (s.location || "").toLowerCase();
        const phone = (s.seller?.phone || "").toLowerCase();
        const type = (s.type || "").toLowerCase();
        return (
          shop.includes(q) ||
          owner.includes(q) ||
          loc.includes(q) ||
          phone.includes(q) ||
          type.includes(q)
        );
      }
      return true;
    });
  }, [sellersData, selectedFilter, searchQuery]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading campus canteens...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminHeader />
      <FlatList
        data={filteredSellers}
        keyExtractor={(item) => String(item._id || item.id || item.name)}
        renderItem={({ item }) => (
          <SellerCard
            providerId={item._id || item.id}
            seller={item.seller}
            shopName={item.name}
            type={item.type}
            location={item.location}
            phone={item.seller?.phone}
            email={item.seller?.email}
            deliveryTime={item.deliveryTime}
            openTime={item.openTime}
            closeTime={item.closeTime}
            isOpen={item.isOpen}
            isBlocked={item.isBlocked}
            totalOrders={item.stats?.totalOrders || 0}
            totalRevenue={item.stats?.totalRevenue || 0}
            rating={item.stats?.rating ?? item.rating ?? 0}
            menuItemsCount={item.stats?.menuItemsCount}
            onToggleBlock={handleToggleBlock}
          />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Seller Management</Text>
            <Text style={styles.subtitle}>
              Manage {sellersData.length} registered campus dining canteens, cafeterias & food carts
            </Text>

            {/* Quick Metrics Bar */}
            <View style={styles.summaryBar}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryVal}>{statsSummary.totalCanteens}</Text>
                <Text style={styles.summaryLbl}>Canteens</Text>
              </View>
              <View style={styles.summaryDiv} />
              <View style={styles.summaryCol}>
                <Text style={styles.summaryVal}>{statsSummary.openCount}</Text>
                <Text style={styles.summaryLbl}>Open Now</Text>
              </View>
              <View style={styles.summaryDiv} />
              <View style={styles.summaryCol}>
                <Text style={styles.summaryVal}>{statsSummary.totalOrders}</Text>
                <Text style={styles.summaryLbl}>Total Orders</Text>
              </View>
              <View style={styles.summaryDiv} />
              <View style={styles.summaryCol}>
                <Text style={[styles.summaryVal, { color: colors.primary }]}>
                  ৳{statsSummary.totalRevenue.toLocaleString()}
                </Text>
                <Text style={styles.summaryLbl}>Total Sales</Text>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color={colors.textGray} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by canteen, owner, hall, phone..."
                placeholderTextColor={colors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color={colors.textGray} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {[
                { label: `All (${sellersData.length})`, value: "all" },
                { label: `Open Now (${statsSummary.openCount})`, value: "open" },
                { label: "Active", value: "active" },
                { label: `Suspended (${statsSummary.suspendedCount})`, value: "suspended" },
                { label: "Canteen", value: "canteen" },
                { label: "Cafeteria", value: "cafeteria" },
                { label: "Food Cart", value: "cart" },
              ].map((chip) => {
                const isActive = selectedFilter === chip.value;
                return (
                  <TouchableOpacity
                    key={chip.value}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setSelectedFilter(chip.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && styles.filterChipTextActive,
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>No sellers found matching your search.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
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
  listContent: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  header: {
    marginBottom: spacing.md,
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
  summaryBar: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryCol: {
    flex: 1,
    alignItems: "center",
  },
  summaryVal: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textDark,
  },
  summaryLbl: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    color: colors.textGray,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  summaryDiv: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm + 4,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textDark,
    marginLeft: spacing.sm,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.xs + 4,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: spacing.borderRadiusFull,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textGray,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: "center",
    color: colors.textGray,
    fontFamily: fonts.regular,
    fontSize: 14,
    marginTop: spacing.sm,
  },
});

export default AdminSellersScreen;
