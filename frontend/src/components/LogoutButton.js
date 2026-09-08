import React from 'react';
import { StyleSheet, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../theme/colors';

/**
 * Modular LogoutButton component with cross-platform (Web + Mobile) confirmation alert.
 */
const LogoutButton = ({
  onPress,
  label = 'Log Out Account',
  confirmTitle = 'Log Out',
  confirmMessage = 'Are you sure you want to log out of your Bitezy account?',
  style,
}) => {
  const handlePress = () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm(confirmMessage) : true;
      if (confirmed && onPress) {
        onPress();
      }
      return;
    }

    Alert.alert(confirmTitle, confirmMessage, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress,
      },
    ]);
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Ionicons
        name="log-out-outline"
        size={17}
        color={colors.danger}
        style={{ marginRight: 6 }}
      />
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1.2,
    borderColor: '#FECACA',
    paddingVertical: 12,
    borderRadius: spacing.borderRadiusFull,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  text: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.danger,
    letterSpacing: 0.1,
  },
});

export default LogoutButton;
