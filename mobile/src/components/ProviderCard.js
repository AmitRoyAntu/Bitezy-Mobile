import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/colors';

const ProviderCard = ({ provider, onPress }) => {
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
        <View style={styles.tag}>
          <Text style={styles.tagText}>{provider.type}</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{provider.name}</Text>
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
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  info: {
    padding: spacing.md,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: spacing.xs,
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
    fontSize: 13,
    fontWeight: '700',
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
    fontSize: 13,
    color: colors.textGray,
    fontWeight: '500',
  },
});

export default ProviderCard;
