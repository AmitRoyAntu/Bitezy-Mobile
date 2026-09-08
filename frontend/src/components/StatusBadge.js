import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fonts } from '../theme/colors';

const StatusBadge = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'PENDING':
        return { bg: colors.warningLight, text: colors.ratingText, border: colors.warningBorder, icon: 'hourglass-outline' };
      case 'PREPARING':
        return { bg: colors.infoLight, text: colors.info, border: colors.infoBorder, icon: 'restaurant-outline' };
      case 'ON_THE_WAY':
        return { bg: colors.purpleLight, text: colors.purple, border: colors.purpleBorder, icon: 'bicycle-outline' };
      case 'READY':
        return { bg: colors.purpleLight, text: colors.purple, border: colors.purpleBorder, icon: 'bag-check-outline' };
      case 'DELIVERED':
      case 'PICKED_UP':
        return { bg: colors.successLight, text: colors.success, border: colors.successBorder, icon: 'checkmark-circle' };
      case 'CANCELLED':
        return { bg: colors.dangerLight, text: colors.danger, border: colors.dangerBorder, icon: 'close-circle' };
      default:
        return { bg: colors.surfaceSubtle, text: colors.textGray, border: colors.borderDark, icon: 'help-circle-outline' };
    }
  };


  const { bg, text, border, icon } = getBadgeStyle();
  const label = status ? status.replace(/_/g, ' ') : '';

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
      <Ionicons name={icon} size={12} color={text} style={{ marginRight: 4 }} />
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});

export default StatusBadge;

