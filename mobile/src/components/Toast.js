import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/colors';

const Toast = ({ visible, message, type = 'success', onHide }) => {
  const translateY = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 50,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          if (onHide) onHide();
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible, message, type]);

  if (!visible) return null;

  const getTypeStyle = () => {
    switch (type) {
      case 'success':
        return { color: colors.success, icon: 'checkmark-circle' };
      case 'error':
        return { color: colors.danger, icon: 'alert-circle' };
      case 'warning':
        return { color: colors.warning, icon: 'warning' };
      default:
        return { color: colors.primary, icon: 'information-circle' };
    }
  };

  const { color, icon } = getTypeStyle();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          borderLeftColor: color,
          transform: [{ translateY }],
        },
      ]}
    >
      <Ionicons name={icon} size={22} color={color} style={styles.icon} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    borderLeftWidth: 5,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  icon: {
    marginRight: spacing.sm,
  },
  text: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});

export default Toast;
