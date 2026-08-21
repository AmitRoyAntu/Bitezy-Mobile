import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../theme/colors';

/**
 * Modular ProfileInfoRow component for displaying profile & canteen key-value details.
 *
 * @param {string} icon - Ionicons icon name
 * @param {string} label - Uppercase field label (e.g. "STUDENT ID", "DEPARTMENT")
 * @param {string} value - Value text
 * @param {string} [iconColor] - Custom icon color (defaults to colors.primary)
 * @param {string} [iconBg] - Custom icon background tint
 * @param {boolean} [isLast] - Whether this is the last row in the card (omits bottom divider)
 */
const ProfileInfoRow = ({
  icon,
  label,
  value,
  iconColor = colors.primary,
  iconBg = 'rgba(255, 75, 38, 0.08)',
  isLast = false,
  style,
}) => {
  return (
    <View style={[styles.container, isLast && styles.containerLast, style]}>
      {icon ? (
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={17} color={iconColor} />
        </View>
      ) : null}
      <View style={styles.textCol}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value} numberOfLines={2}>
          {value || 'Not set'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  containerLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm + 2,
  },
  textCol: {
    flex: 1,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 10.5,
    color: colors.textGray,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  value: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textDark,
    lineHeight: 18,
  },
});

export default ProfileInfoRow;
