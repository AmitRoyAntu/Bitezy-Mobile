import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS } from '../constants/theme';

const TOAST_CONFIG = {
  success: { icon: 'checkmark-circle', color: COLORS.success },
  error:   { icon: 'close-circle',     color: COLORS.danger },
  warning: { icon: 'alert-circle',     color: COLORS.warning },
};

export default function Toast({ visible, message, type = 'success', onHide }) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 6,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => onHide && onHide());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const config = TOAST_CONFIG[type] || TOAST_CONFIG.success;

  return (
    <Animated.View
      style={[
        styles.toast,
        { borderLeftColor: config.color, transform: [{ translateY }], opacity },
      ]}
    >
      <Ionicons name={config.icon} size={20} color={config.color} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    left: 20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderLeftWidth: 5,
    ...SHADOWS.lg,
    zIndex: 9999,
  },
  text: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.dark,
    flex: 1,
  },
});
