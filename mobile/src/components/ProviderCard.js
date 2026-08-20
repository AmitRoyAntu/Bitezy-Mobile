import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Linking } from 'react-native';
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

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(provider)}
      activeOpacity={0.85}
    >
      <View style={styles.imageBox}>
        <Image
          source={{ uri: provider.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80' }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={[styles.statusTag, provider.isOpen === false ? styles.closedTag : styles.openTag]}>
          <View style={[styles.statusDot, provider.isOpen === false ? styles.closedDot : styles.openDot]} />
          <Text style={styles.statusTagText}>{provider.isOpen === false ? 'Closed' : 'Open'}</Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{provider.type}</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{provider.name}</Text>
        {provider.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={colors.textGray} style={{ marginRight: 4 }} />
            <Text style={styles.locationText} numberOfLines={1}>{provider.location}</Text>
            <TouchableOpacity
              style={styles.mapPill}
              onPress={handleMapPress}
              activeOpacity={0.7}
            >
              <Ionicons name="navigate-outline" size={11} color={colors.primary} style={{ marginRight: 2 }} />
              <Text style={styles.mapPillText}>Map</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <View style={styles.metaRow}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={13} color="#FF9F43" style={{ marginRight: 3 }} />
            <Text style={styles.ratingText}>{provider.rating || '4.5'}</Text>
          </View>
          <Text style={styles.dot}>•</Text>
          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={13} color={colors.textGray} style={{ marginRight: 3 }} />
            <Text style={styles.timeText}>{provider.deliveryTime || '15-20 min'}</Text>
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
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  imageBox: {
    height: 140,
    width: '100%',
    position: 'relative',
    backgroundColor: colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tag: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadiusSm,
  },
  tagText: {
    fontFamily: fonts.semiBold,
    color: colors.white,
    fontSize: 11,
  },
  statusTag: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadiusSm,
  },
  openTag: {
    backgroundColor: 'rgba(46, 204, 113, 0.9)',
  },
  closedTag: {
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
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
  },
  info: {
    padding: spacing.md,
  },
  name: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
    color: colors.textDark,
    marginBottom: 2,
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
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: spacing.borderRadiusFull,
    marginLeft: 6,
  },
  mapPillText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textDark,
  },
  dot: {
    marginHorizontal: spacing.sm,
    color: colors.textLight,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textGray,
  },
});

export default ProviderCard;
