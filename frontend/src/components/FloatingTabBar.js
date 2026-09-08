import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { colors, fonts, spacing } from '../theme/colors';

/**
 * Reusable Floating Capsule Tab Bar used in Customer and Seller navigators.
 *
 * @param {object} props - React Navigation tab bar props
 * @param {(routeName: string, isFocused: boolean) => string} props.getIconName - Returns Ionicons name for each tab
 * @param {(routeName: string) => number} [props.getBadgeCount] - Returns badge count for a tab (e.g. cart items / pending orders)
 * @param {(currentRoute: object, focusedChildName: string) => boolean} [props.shouldHide] - Condition to hide tab bar
 */
const FloatingTabBar = ({
  state,
  descriptors,
  navigation,
  getIconName,
  getBadgeCount,
  shouldHide,
}) => {
  const currentRoute = state.routes[state.index];
  const focusedChildName = getFocusedRouteNameFromRoute(currentRoute);

  if (shouldHide && shouldHide(currentRoute, focusedChildName)) {
    return null;
  }

  return (
    <View style={styles.floatingContainer} pointerEvents="box-none">
      <View style={styles.capsuleDock}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const iconName = getIconName ? getIconName(route.name, isFocused) : 'grid-outline';
          const badgeCount = getBadgeCount ? getBadgeCount(route.name) : 0;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.85}
              style={[
                styles.tabItem,
                isFocused && styles.tabItemFocused,
              ]}
            >
              <View style={styles.iconWrapper}>
                <Ionicons
                  name={iconName}
                  size={20}
                  color={isFocused ? colors.white : colors.textDark}
                />
                {badgeCount > 0 && !isFocused && (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveBadgeText}>
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </Text>
                  </View>
                )}
              </View>

              {isFocused && (
                <Text style={styles.activeTabLabel} numberOfLines={1}>
                  {label}
                  {badgeCount > 0 ? ` (${badgeCount})` : ''}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 22 : 16,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  capsuleDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 6,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1.2,
    borderColor: colors.borderDark,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: colors.secondary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 8px 24px rgba(18, 18, 23, 0.12)',
      },
    }),
  },
  tabItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemFocused: {
    width: 'auto',
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: spacing.borderRadiusFull,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(255, 75, 38, 0.28)',
      },
    }),
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabLabel: {
    fontFamily: fonts.headingBold,
    color: colors.white,
    fontSize: 13,
    letterSpacing: -0.2,
  },
  inactiveBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.primary,
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  inactiveBadgeText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 9,
    textAlign: 'center',
  },
});

export default FloatingTabBar;
