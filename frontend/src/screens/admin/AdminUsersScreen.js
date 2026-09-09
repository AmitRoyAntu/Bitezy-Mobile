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
import UserCard from "../../components/UserCard";
import Toast from "../../components/Toast";
import DataService from "../../api/DataService";

const AdminUsersScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const loadUsers = useCallback(async () => {
    try {
      const allUsers = await DataService.getAdminUsers();
      setUsers(allUsers || []);
    } catch (e) {
      console.warn("AdminUsersScreen load error:", e);
      setToast({
        visible: true,
        message: "Failed to load users from database",
        type: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleToggleBlock = useCallback(
    (userId, currentBlocked) => {
      const targetUser = users.find((u) => String(u._id || u.id) === String(userId));
      const userName = targetUser?.name || "this user";
      const actionName = currentBlocked ? "Unblock" : "Block";
      const confirmMsg = `Are you sure you want to ${actionName.toLowerCase()} account access for "${userName}"?\n\n${
        !currentBlocked
          ? "The user will not be able to log in or place orders."
          : "The user will be restored and able to log in normally."
      }`;

      const performAction = async () => {
        try {
          await DataService.blockUser(userId, !currentBlocked);
          setUsers((prev) =>
            prev.map((u) =>
              String(u._id || u.id) === String(userId)
                ? { ...u, isBlocked: !currentBlocked }
                : u
            )
          );
          setToast({
            visible: true,
            message: `${userName} ${currentBlocked ? "unblocked" : "blocked"} successfully`,
            type: "success",
          });
        } catch (e) {
          setToast({
            visible: true,
            message: `Failed to ${actionName.toLowerCase()} user`,
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

      Alert.alert(`${actionName} Account`, confirmMsg, [
        { text: "Cancel", style: "cancel" },
        {
          text: actionName,
          style: currentBlocked ? "default" : "destructive",
          onPress: performAction,
        },
      ]);
    },
    [users]
  );

  // Quick summary counts across real database users
  const summaryCounts = useMemo(() => {
    const total = users.length;
    const students = users.filter((u) => (u.buyerType || "").toLowerCase() === "student" || (u.role === "buyer" && !u.buyerType)).length;
    const faculty = users.filter((u) => ["teacher", "staff"].includes((u.buyerType || "").toLowerCase())).length;
    const sellers = users.filter((u) => u.role === "seller").length;
    const blocked = users.filter((u) => u.isBlocked).length;
    return { total, students, faculty, sellers, blocked };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Type / status filter
      if (selectedType === "blocked") {
        if (!u.isBlocked) return false;
      } else if (selectedType === "student") {
        const isStudent = (u.buyerType || "").toLowerCase() === "student" || (u.role === "buyer" && !u.buyerType);
        if (!isStudent) return false;
      } else if (selectedType === "teacher") {
        if ((u.buyerType || "").toLowerCase() !== "teacher") return false;
      } else if (selectedType === "staff") {
        if ((u.buyerType || "").toLowerCase() !== "staff") return false;
      } else if (selectedType === "seller") {
        if (u.role !== "seller") return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (u.name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const dept = (u.department || "").toLowerCase();
        const residence = (u.residence || u.deliveryAddress || "").toLowerCase();
        const cuetId = (u.cuetId || "").toLowerCase();
        const phone = (u.phone || "").toLowerCase();
        const role = (u.role || "").toLowerCase();
        const buyerType = (u.buyerType || "").toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          dept.includes(q) ||
          residence.includes(q) ||
          cuetId.includes(q) ||
          phone.includes(q) ||
          role.includes(q) ||
          buyerType.includes(q)
        );
      }
      return true;
    });
  }, [users, selectedType, searchQuery]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading campus users from database...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminHeader />
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => String(item._id || item.id)}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            onToggleBlock={handleToggleBlock}
          />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>User Management</Text>
            <Text style={styles.subtitle}>
              Manage {users.length} registered campus student, faculty & seller accounts
            </Text>

            {/* Quick Metrics Bar */}
            <View style={styles.summaryBar}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryVal}>{summaryCounts.total}</Text>
                <Text style={styles.summaryLbl}>All Accounts</Text>
              </View>
              <View style={styles.summaryDiv} />
              <View style={styles.summaryCol}>
                <Text style={styles.summaryVal}>{summaryCounts.students}</Text>
                <Text style={styles.summaryLbl}>Students</Text>
              </View>
              <View style={styles.summaryDiv} />
              <View style={styles.summaryCol}>
                <Text style={styles.summaryVal}>{summaryCounts.faculty}</Text>
                <Text style={styles.summaryLbl}>Faculty & Staff</Text>
              </View>
              <View style={styles.summaryDiv} />
              <View style={styles.summaryCol}>
                <Text style={[styles.summaryVal, summaryCounts.blocked > 0 && { color: colors.danger }]}>
                  {summaryCounts.blocked}
                </Text>
                <Text style={styles.summaryLbl}>Blocked</Text>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color={colors.textGray} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, ID, email, dept, hall, phone..."
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
                { label: `All Users (${users.length})`, value: "all" },
                { label: `Students (${summaryCounts.students})`, value: "student" },
                { label: `Teachers (${users.filter(u => (u.buyerType || "").toLowerCase() === "teacher").length})`, value: "teacher" },
                { label: `Staff (${users.filter(u => (u.buyerType || "").toLowerCase() === "staff").length})`, value: "staff" },
                { label: `Sellers (${summaryCounts.sellers})`, value: "seller" },
                { label: `Blocked (${summaryCounts.blocked})`, value: "blocked" },
              ].map((chip) => {
                const isActive = selectedType === chip.value;
                return (
                  <TouchableOpacity
                    key={chip.value}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setSelectedType(chip.value)}
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
            <Ionicons name="people-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>No users matched your search criteria.</Text>
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

export default AdminUsersScreen;
