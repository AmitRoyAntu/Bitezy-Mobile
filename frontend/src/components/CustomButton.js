import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { colors, spacing, fonts } from '../theme/colors';

const CustomButton = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return '#E2E8F0';
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'success':
        return colors.success;
      case 'danger':
        return colors.danger;
      case 'outline':
        return 'transparent';
      case 'ghost':
        return colors.primaryLight;
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textLight;
    if (variant === 'outline' || variant === 'ghost') return colors.primary;
    return colors.white;
  };

  const isPrimary = variant === 'primary' && !disabled;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && styles.outlineButton,
        isPrimary && styles.primaryShadow,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: spacing.borderRadiusMd,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
  },
  primaryShadow: {
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(255, 75, 38, 0.25)',
      },
    }),
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  text: {
    fontFamily: fonts.headingBold,
    fontSize: 15,
    letterSpacing: 0.1,
  },
});

export default CustomButton;

