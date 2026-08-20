import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fonts } from '../theme/colors';

const StatusBadge = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'PENDING':
        return { bg: colors.warningLight, text: colors.warning, icon: 'hourglass-outline' };
      case 'PREPARING':
        return { bg: colors.infoLight, text: colors.info, icon: 'restaurant-outline' };
      case 'ON_THE_WAY':
        return { bg: colors.purpleLight, text: colors.purple, icon: 'bicycle-outline' };
      case 'READY':
        return { bg: colors.purpleLight, text: colors.purple, icon: 'bag-check-outline' };
      case 'DELIVERED':
      case 'PICKED_UP':
        return { bg: colors.successLight, text: colors.success, icon: 'checkmark-circle-outline' };
      case 'CANCELLED':
        return { bg: colors.dangerLight, text: colors.danger, icon: 'close-circle-outline' };
      default:
        return { bg: colors.border, text: colors.textGray, icon: 'help-circle-outline' };
    }
  };

  const { bg, text, icon } = getBadgeStyle();
  const label = status ? status.replace(/_/g, ' ') : '';

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={13} color={text} style={{ marginRight: 4 }} />
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadiusSm,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: fonts.bold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
});

export default StatusBadge;
