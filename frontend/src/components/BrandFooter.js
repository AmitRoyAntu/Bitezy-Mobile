import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, colors, spacing } from '../theme/colors';

/**
 * Modular BrandFooter component used across Customer and Seller settings screens.
 */
const BrandFooter = ({
  title = 'Bitezy Campus Dining • v1.2.0',
  subtitle = 'Crafted with ❤️ for CUETians 🎓',
  showSpacer = true,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {showSpacer ? <View style={styles.spacer} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textGray,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: colors.textLight,
    marginTop: 3,
  },
  spacer: {
    height: 70,
  },
});

export default BrandFooter;
