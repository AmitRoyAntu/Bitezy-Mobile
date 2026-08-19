import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS } from '../constants/theme';

export default function UserCard({ user, onToggleBlock }) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.nameRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={18} color={COLORS.gray} />
          </View>
          <View>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => onToggleBlock(user._id, user.isBlocked)}
          style={[
            styles.actionBtn,
            { backgroundColor: user.isBlocked ? '#E8F5E9' : '#FFEBEE' },
          ]}
        >
          <Ionicons
            name={user.isBlocked ? 'person-add' : 'person-remove'}
            size={16}
            color={user.isBlocked ? COLORS.success : COLORS.danger}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>Hall</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {user.residence || 'N/A'}
          </Text>
        </View>
        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>Type</Text>
          <Text style={styles.detailValue}>{user.buyerType || 'N/A'}</Text>
        </View>
        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>Phone</Text>
          <Text style={styles.detailValue}>{user.phone || 'N/A'}</Text>
        </View>
      </View>

      {user.isBlocked && (
        <View style={styles.blockedBanner}>
          <Ionicons name="ban" size={12} color={COLORS.danger} />
          <Text style={styles.blockedText}>Blocked</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: COLORS.dark,
  },
  email: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.gray,
    marginTop: 1,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.dark,
  },
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FFEBEE',
  },
  blockedText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.danger,
  },
});
