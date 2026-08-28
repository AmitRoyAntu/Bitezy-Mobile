import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fonts } from '../theme/colors';

const ProviderCard = ({ provider, onPress }) => {
  const handleMapPress = (e) => {
    e.stopPropagation();
    const lat = provider.lat || 22.4621;
    const lng = provider.lng || 91.9729;
    const targetQuery = provider.mapQuery || `${provider.name}, CUET, Chittagong`;
    const query = encodeURIComponent(targetQuery);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    });
  };

  const isOpen = provider.isOpen !== false;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(provider)}
      activeOpacity={0.88}
    >
      <View style={styles.imageBox}>
        <Image
          source={{ uri: provider.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80' }}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Status Pill Badge */}
        <View style={[styles.statusTag, isOpen ? styles.openTag : styles.closedTag]}>
          <View style={[styles.statusDot, isOpen ? styles.openDot : styles.closedDot]} />
          <Text style={styles.statusTagText}>{isOpen ? 'Open' : 'Closed'}</Text>
        </View>

        {/* Type Pill */}
        {provider.type ? (
          <View style={styles.typeTag}>
            <Text style={styles.typeTagText}>{provider.type}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{provider.name}</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color={colors.rating} style={{ marginRight: 3 }} />
            <Text style={styles.ratingText}>{provider.rating || '4.5'}</Text>
          </View>

        </View>

        {provider.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={colors.textGray} style={{ marginRight: 4 }} />
            <Text style={styles.locationText} numberOfLines={1}>{provider.location}</Text>
            <TouchableOpacity
              style={styles.mapPill}
              onPress={handleMapPress}
              activeOpacity={0.7}
            >
              <Ionicons name="navigate-outline" size={11} color={colors.primary} style={{ marginRight: 3 }} />
              <Text style={styles.mapPillText}>Map</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={colors.textGray} style={{ marginRight: 4 }} />
            <Text style={styles.metaText}>{provider.deliveryTime || '15-25 min'}</Text>
          </View>
          <Text style={styles.dot}>•</Text>
          <View style={styles.metaItem}>
            <Ionicons name="bicycle-outline" size={13} color={colors.textGray} style={{ marginRight: 4 }} />
            <Text style={styles.metaText}>Campus Delivery</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 14px rgba(18, 18, 23, 0.06)',
      },
    }),
  },
  imageBox: {
    height: 148,
    width: '100%',
    position: 'relative',
    backgroundColor: colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  typeTag: {
    position: 'absolute',
    top: spacing.sm + 2,
    right: spacing.sm + 2,
    backgroundColor: 'rgba(18, 18, 23, 0.72)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
  },
  typeTagText: {
    fontFamily: fonts.semiBold,
    color: colors.white,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  statusTag: {
    position: 'absolute',
    top: spacing.sm + 2,
    left: spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
    backgroundColor: 'rgba(18, 18, 23, 0.72)',
  },
  openTag: {
    backgroundColor: 'rgba(0, 183, 97, 0.92)',
  },
  closedTag: {
    backgroundColor: 'rgba(250, 62, 62, 0.92)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  openDot: {
    backgroundColor: colors.white,
  },
  closedDot: {
    backgroundColor: colors.white,
  },
  statusTagText: {
    fontFamily: fonts.bold,
    color: colors.white,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  info: {
    padding: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  name: {
    fontFamily: fonts.headingBold,
    fontSize: 17,
    color: colors.textDark,
    flex: 1,
    marginRight: spacing.sm,
    letterSpacing: -0.2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ratingBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1,
    borderColor: colors.ratingBorder,
  },
  ratingText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.ratingText,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  locationText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textGray,
    flex: 1,
  },
  mapPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
    marginLeft: 6,
  },
  mapPillText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs + 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textGray,
  },
  dot: {
    marginHorizontal: spacing.sm,
    color: colors.textLight,
  },
});

export default ProviderCard;

