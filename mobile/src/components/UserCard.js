import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../theme/colors';

const UserCard = ({ user, onToggleBlock }) => {
  const isBlocked = !!user.isBlocked;

  return (
    <View style={[styles.card, isBlocked && styles.cardBlocked]}>
      <View style={styles.topRow}>
        <View style={styles.nameRow}>
          <View style={[styles.avatar, isBlocked && styles.avatarBlocked]}>
            <Ionicons
              name="person"
              size={18}
              color={isBlocked ? colors.danger : colors.textGray}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.name} numberOfLines={1}>
              {user.name}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {user.email}
            </Text>
          </View>
        </View>
        {onToggleBlock && (
          <TouchableOpacity
            onPress={() => onToggleBlock(user._id || user.id, isBlocked)}
            style={[
              styles.actionBtn,
              { backgroundColor: isBlocked ? colors.successLight : colors.dangerLight },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isBlocked ? 'person-add-outline' : 'ban-outline'}
              size={16}
              color={isBlocked ? colors.success : colors.danger}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>Hall / Address</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {user.residence || user.deliveryAddress || 'N/A'}
          </Text>
        </View>
        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>Type</Text>
          <Text style={styles.detailValue}>{user.buyerType || user.role || 'Student'}</Text>
        </View>
        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>Phone</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{user.phone || 'N/A'}</Text>
        </View>
      </View>

      {isBlocked && (
        <View style={styles.blockedBanner}>
          <Ionicons name="ban" size={12} color={colors.danger} />
          <Text style={styles.blockedText}>Account Blocked</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    marginBottom: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardBlocked: {
    borderColor: colors.dangerBorder,
    backgroundColor: '#FFFAFA',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm + 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    flex: 1,
    marginRight: spacing.sm,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBlocked: {
    backgroundColor: colors.dangerLight,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.textDark,
  },
  email: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textGray,
    marginTop: 1,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: spacing.borderRadiusSm,
    padding: spacing.sm + 2,
  },
  detailCol: {
    flex: 1,
    paddingHorizontal: 2,
  },
  detailLabel: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    color: colors.textGray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textDark,
  },
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm + 2,
    paddingTop: spacing.xs + 2,
  },
  blockedText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.danger,
  },
});

export default UserCard;
