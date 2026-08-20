import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fonts } from '../theme/colors';

const Logo = ({ size = 'medium', showTagline = true, light = false, align = 'center' }) => {
  const isLarge = size === 'large';
  const isSmall = size === 'small';

  // Balanced icon sizes
  const iconSize = isSmall ? 18 : isLarge ? 28 : 20;

  return (
    <View style={[styles.container, align === 'left' && styles.alignLeft]}>
      <View style={styles.logoRow}>
        <View
          style={[
            styles.iconBadge,
            isSmall && styles.iconBadgeSmall,
            isLarge && styles.iconBadgeLarge,
          ]}
        >
          <Ionicons name="fast-food" size={iconSize} color={colors.white} />
        </View>
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.brandName,
              isSmall && styles.brandSmall,
              isLarge && styles.brandLarge,
              light && { color: colors.white },
            ]}
          >
            Bite<Text style={styles.brandAccent}>zy</Text>
          </Text>
        </View>
      </View>
      {showTagline && (
        <Text
          style={[
            styles.tagline,
            isLarge && styles.taglineLarge,
            light && { color: 'rgba(255,255,255,0.85)' },
          ]}
        >
          Campus Dining & Smart Ordering
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 0,
  },
  alignLeft: {
    alignItems: 'flex-start',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  iconBadgeSmall: {
    width: 34,
    height: 34,
    borderRadius: 10,
    marginRight: 8,
    elevation: 2,
  },
  iconBadgeLarge: {
    width: 52,
    height: 52,
    borderRadius: 15,
    marginRight: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  textContainer: {
    justifyContent: 'center',
  },
  brandName: {
    fontFamily: fonts.headingExtraBold,
    fontSize: 24,
    color: colors.textDark,
    letterSpacing: -0.6,
    includeFontPadding: false,
  },
  brandSmall: {
    fontSize: 22,
    letterSpacing: -0.5,
  },
  brandLarge: {
    fontSize: 32,
    letterSpacing: -0.8,
  },
  brandAccent: {
    color: colors.primary,
  },
  tagline: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textGray,
    marginTop: 5,
    letterSpacing: 0.3,
  },
  taglineLarge: {
    fontSize: 13,
    marginTop: 6,
  },
});

export default Logo;
