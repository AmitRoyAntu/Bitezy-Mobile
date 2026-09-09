import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing } from "../theme/colors";

const UserCard = ({ user, onToggleBlock }) => {
  const isBlocked = !!user?.isBlocked;
  const buyerType = user?.buyerType || (user?.role === "seller" ? "Seller" : user?.role === "admin" ? "Admin" : "Student");
  const ordersCount = user?.ordersCount !== undefined ? user.ordersCount : 0;
  const totalSpent = user?.totalSpent !== undefined ? user.totalSpent : 0;

  const getTypeStyle = () => {
    switch (buyerType.toLowerCase()) {
      case "student":
        return { bg: "rgba(59, 130, 246, 0.12)", text: "#2563EB", border: "rgba(59, 130, 246, 0.25)" };
      case "teacher":
        return { bg: "rgba(139, 92, 246, 0.12)", text: "#7C3AED", border: "rgba(139, 92, 246, 0.25)" };
      case "staff":
        return { bg: "rgba(16, 185, 129, 0.12)", text: "#059669", border: "rgba(16, 185, 129, 0.25)" };
      case "seller":
        return { bg: "rgba(245, 158, 11, 0.12)", text: "#D97706", border: "rgba(245, 158, 11, 0.25)" };
      default:
        return { bg: "rgba(107, 114, 128, 0.12)", text: "#4B5563", border: "rgba(107, 114, 128, 0.25)" };
    }
  };

  const typeStyle = getTypeStyle();

  return (
    <View style={[styles.card, isBlocked && styles.cardBlocked]}>
      {/* Top Row: Type Badge & Status */}
      <View style={styles.topRow}>
        <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg, borderColor: typeStyle.border }]}>
          <Text style={[styles.typeBadgeText, { color: typeStyle.text }]}>
            {buyerType.toUpperCase()}
          </Text>
        </View>

        <View style={styles.statusPills}>
          <View style={[styles.statusPill, isBlocked ? styles.statusPillBlocked : styles.statusPillActive]}>
            <View style={[styles.statusDot, { backgroundColor: isBlocked ? colors.danger : colors.success }]} />
            <Text style={[styles.statusText, { color: isBlocked ? colors.danger : colors.success }]}>
              {isBlocked ? "BLOCKED" : "ACTIVE"}
            </Text>
          </View>
        </View>
      </View>

      {/* User Header Row */}
      <View style={styles.userHeaderRow}>
        <View style={[styles.avatar, isBlocked && styles.avatarBlocked]}>
          <Ionicons
            name={isBlocked ? "ban" : "person"}
            size={20}
            color={isBlocked ? colors.danger : colors.primary}
          />
        </View>
        <View style={styles.userInfoCol}>
          <Text style={styles.name} numberOfLines={1}>
            {user?.name || "Campus Member"}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {user?.email}
          </Text>
        </View>
      </View>

      {/* Metadata Badges */}
      <View style={styles.metaRowWrap}>
        {user?.phone ? (
          <View style={styles.metaBadge}>
            <Ionicons name="call-outline" size={12} color={colors.textGray} />
            <Text style={styles.metaBadgeText}>{user.phone}</Text>
          </View>
        ) : null}

        {user?.department ? (
          <View style={styles.metaBadge}>
            <Ionicons name="school-outline" size={12} color={colors.textGray} />
            <Text style={styles.metaBadgeText}>Dept: {user.department}</Text>
          </View>
        ) : null}

        {user?.cuetId ? (
          <View style={styles.metaBadge}>
            <Ionicons name="card-outline" size={12} color={colors.textGray} />
            <Text style={styles.metaBadgeText}>ID: {user.cuetId}</Text>
          </View>
        ) : null}

        {user?.residence ? (
          <View style={styles.metaBadge}>
            <Ionicons name="business-outline" size={12} color={colors.textGray} />
            <Text style={styles.metaBadgeText} numberOfLines={1}>
              {user.residence}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Real Orders & Spend Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Orders Placed</Text>
          <Text style={styles.statValue}>{ordersCount}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Spent</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            ৳{Number(totalSpent).toLocaleString()}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Role</Text>
          <Text style={[styles.statValue, { textTransform: "capitalize" }]}>
            {user?.role || "buyer"}
          </Text>
        </View>
      </View>

      {/* Action Button: Block / Unblock */}
      {onToggleBlock && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              isBlocked ? styles.actionButtonUnblock : styles.actionButtonBlock,
            ]}
            onPress={() => onToggleBlock(user._id || user.id, isBlocked)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isBlocked ? "checkmark-circle-outline" : "ban-outline"}
              size={15}
              color={isBlocked ? colors.success : colors.danger}
            />
            <Text
              style={[
                styles.actionButtonText,
                { color: isBlocked ? colors.success : colors.danger },
              ]}
            >
              {isBlocked ? "Unblock Account Access" : "Block User Account"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd + 2,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  cardBlocked: {
    borderColor: colors.dangerBorder,
    backgroundColor: "#FFF9F9",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
  statusPills: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillActive: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
  },
  statusPillBlocked: {
    backgroundColor: colors.dangerLight,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 0.3,
  },
  userHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBlocked: {
    backgroundColor: colors.dangerLight,
  },
  userInfoCol: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
  },
  email: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textGray,
    marginTop: 2,
  },
  metaRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: spacing.sm + 2,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaBadgeText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textGray,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: spacing.borderRadiusSm,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    color: colors.textGray,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.textDark,
  },
  divider: {
    width: 1,
    backgroundColor: colors.borderDark,
    marginHorizontal: 4,
  },
  actionRow: {
    paddingTop: spacing.xs,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: spacing.borderRadiusSm,
    borderWidth: 1,
  },
  actionButtonBlock: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.dangerBorder,
  },
  actionButtonUnblock: {
    backgroundColor: colors.successLight,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
  },
});

export default UserCard;
