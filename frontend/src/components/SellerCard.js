import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing } from "../theme/colors";

const SellerCard = ({
  seller,
  shopName,
  type,
  location,
  phone,
  email,
  deliveryTime,
  openTime,
  closeTime,
  isOpen = true,
  isBlocked = false,
  totalOrders = 0,
  totalRevenue = 0,
  rating = 0,
  menuItemsCount,
  onToggleBlock,
  providerId,
}) => {
  const effectiveBlocked = isBlocked || !!seller?.isBlocked;
  const ownerName = seller?.name || "Unassigned";
  const contactPhone = phone || seller?.phone;
  const targetId = providerId || seller?._id || seller?.id;

  const getTypeColor = () => {
    switch ((type || "").toLowerCase()) {
      case "cafeteria":
        return { bg: "rgba(167, 139, 250, 0.15)", text: "#7C3AED", border: "rgba(167, 139, 250, 0.3)" };
      case "cart":
        return { bg: "rgba(245, 158, 11, 0.15)", text: "#D97706", border: "rgba(245, 158, 11, 0.3)" };
      default:
        return { bg: "rgba(255, 75, 38, 0.12)", text: colors.primary, border: "rgba(255, 75, 38, 0.25)" };
    }
  };

  const typeStyle = getTypeColor();

  return (
    <View style={[styles.card, effectiveBlocked && styles.cardBlocked]}>
      {/* Header Row: Canteen Type & Status Pills */}
      <View style={styles.topPillRow}>
        <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg, borderColor: typeStyle.border }]}>
          <Text style={[styles.typeBadgeText, { color: typeStyle.text }]}>
            {(type || "Canteen").toUpperCase()}
          </Text>
        </View>

        <View style={styles.statusPills}>
          {effectiveBlocked ? (
            <View style={styles.suspendedPill}>
              <Ionicons name="ban" size={11} color={colors.danger} />
              <Text style={styles.suspendedPillText}>SUSPENDED</Text>
            </View>
          ) : (
            <View style={[styles.openPill, !isOpen && styles.closedPill]}>
              <View style={[styles.dotIndicator, { backgroundColor: isOpen ? colors.success : colors.textGray }]} />
              <Text style={[styles.openPillText, { color: isOpen ? colors.success : colors.textGray }]}>
                {isOpen ? "OPEN NOW" : "STORE CLOSED"}
              </Text>
            </View>
          )}

          {rating > 0 && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={11} color="#EAB308" />
              <Text style={styles.ratingText}>{Number(rating).toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Main Title & Owner Section */}
      <View style={styles.nameRow}>
        <View style={[styles.shopIcon, effectiveBlocked && styles.shopIconBlocked]}>
          <Ionicons
            name={effectiveBlocked ? "ban" : "storefront"}
            size={22}
            color={effectiveBlocked ? colors.danger : colors.primary}
          />
        </View>
        <View style={styles.titleCol}>
          <Text style={styles.shopName} numberOfLines={1}>
            {shopName || "Campus Dining"}
          </Text>
          <View style={styles.ownerRow}>
            <Ionicons name="person-outline" size={12} color={colors.textGray} />
            <Text style={styles.ownerName} numberOfLines={1}>
              {ownerName}
            </Text>
          </View>
        </View>
      </View>

      {/* Details Row: Location & Phone */}
      <View style={styles.infoMetaList}>
        {location ? (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color={colors.primary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {location}
            </Text>
          </View>
        ) : null}

        <View style={styles.metaRowWrap}>
          {contactPhone && contactPhone !== "N/A" ? (
            <View style={styles.metaSubBadge}>
              <Ionicons name="call-outline" size={12} color={colors.textGray} />
              <Text style={styles.metaSubText}>{contactPhone}</Text>
            </View>
          ) : null}

          {openTime && closeTime ? (
            <View style={styles.metaSubBadge}>
              <Ionicons name="time-outline" size={12} color={colors.textGray} />
              <Text style={styles.metaSubText}>{openTime} - {closeTime}</Text>
            </View>
          ) : null}

          {deliveryTime ? (
            <View style={styles.metaSubBadge}>
              <Ionicons name="bicycle-outline" size={12} color={colors.textGray} />
              <Text style={styles.metaSubText}>{deliveryTime}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Metrics Row: Total Orders & Revenue from Database */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Orders</Text>
          <Text style={styles.statValue}>{totalOrders}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Revenue</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            ৳{Number(totalRevenue || 0).toLocaleString()}
          </Text>
        </View>

        {menuItemsCount !== undefined && (
          <>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Menu Dishes</Text>
              <Text style={styles.statValue}>{menuItemsCount}</Text>
            </View>
          </>
        )}
      </View>

      {/* Action Row: Suspend / Activate Button */}
      {onToggleBlock && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              effectiveBlocked ? styles.actionButtonActivate : styles.actionButtonSuspend,
            ]}
            onPress={() => onToggleBlock({
              providerId,
              sellerUserId: seller?._id || seller?.id,
              isBlocked: effectiveBlocked,
            })}
            activeOpacity={0.8}
          >
            <Ionicons
              name={effectiveBlocked ? "checkmark-circle" : "ban"}
              size={15}
              color={effectiveBlocked ? colors.success : colors.danger}
            />
            <Text
              style={[
                styles.actionButtonText,
                { color: effectiveBlocked ? colors.success : colors.danger },
              ]}
            >
              {effectiveBlocked ? "Reactivate & Open Canteen" : "Suspend & Close Store"}
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
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardBlocked: {
    borderColor: colors.dangerBorder,
    backgroundColor: "#FFF8F8",
  },
  topPillRow: {
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
    gap: 6,
  },
  openPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  closedPill: {
    backgroundColor: "rgba(156, 163, 175, 0.15)",
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  openPillText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 0.3,
  },
  suspendedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  suspendedPillText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.danger,
    letterSpacing: 0.3,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(234, 179, 8, 0.12)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#B45309",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
    marginBottom: spacing.sm,
  },
  shopIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  shopIconBlocked: {
    backgroundColor: colors.dangerLight,
  },
  titleCol: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  ownerName: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textGray,
  },
  infoMetaList: {
    marginBottom: spacing.sm + 2,
    gap: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textGray,
    flex: 1,
  },
  metaRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  metaSubBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaSubText: {
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
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.textDark,
  },
  divider: {
    width: 1,
    backgroundColor: colors.borderDark,
    marginHorizontal: 6,
  },
  actionRow: {
    paddingTop: spacing.xs,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: spacing.borderRadiusSm,
    borderWidth: 1,
  },
  actionButtonSuspend: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.dangerBorder,
  },
  actionButtonActivate: {
    backgroundColor: colors.successLight,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
  },
});

export default SellerCard;
