import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FoodItemCard from '../../components/FoodItemCard';
import { colors, spacing, fonts } from '../../theme/colors';
import DataService from '../../api/DataService';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ProviderMenuScreen = ({ route, navigation }) => {
  const { provider } = route.params;
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  const { cart, updateQty, totalItems, subtotal } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const items = await DataService.getMenuByProvider(provider._id || provider.id, true);
        setMenuItems(items || []);
      } catch (err) {
        showToast('Error loading menu items', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadMenu();
  }, [provider]);

  const categories = useMemo(() => {
    const cats = new Set(menuItems.map((m) => m.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [menuItems]);

  const displayedMenuItems = useMemo(() => {
    if (selectedCategory === 'All') return menuItems;
    return menuItems.filter((m) => m.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  const handleSelectCategory = (cat) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedCategory(cat);
  };

  const handleOpenGoogleMaps = () => {
    const lat = provider.lat || 22.4621;
    const lng = provider.lng || 91.9729;
    const targetQuery = provider.mapQuery || `${provider.name}, CUET, Chittagong`;
    const query = encodeURIComponent(targetQuery);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    Linking.openURL(mapsUrl).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {
        showToast('Could not open Google Maps', 'error');
      });
    });
  };

  const handleGetDirections = () => {
    const lat = provider.lat || 22.4621;
    const lng = provider.lng || 91.9729;
    const targetQuery = provider.mapQuery || `${provider.name}, CUET`;
    const destination = encodeURIComponent(targetQuery);
    const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    Linking.openURL(dirUrl).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}`).catch(() => {
        showToast('Could not open directions in Google Maps', 'error');
      });
    });
  };

  const getItemQty = (itemName) => {
    const found = cart.find((c) => c.name === itemName);
    return found ? found.qty : 0;
  };

  const handleUpdateQty = (item, change) => {
    updateQty(item.name, item.price, change, item.img, provider.name, item.desc || item.description);
  };

  const renderHeader = () => (
    <View>
      {/* Banner */}
      <View style={styles.bannerContainer}>
        <Image
          source={{ uri: provider.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80' }}
          style={styles.bannerImage}
        />
        <View style={styles.bannerOverlay}>
          <Text style={styles.providerName}>{provider.name}</Text>
          <Text style={styles.providerMeta}>
            {provider.type} • ★ {provider.rating || '4.5'}
          </Text>
          <TouchableOpacity
            style={styles.reviewsBtn}
            onPress={() => navigation.navigate('ProviderReviews', { provider })}
          >
            <Text style={styles.reviewsBtnText}>View Reviews →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Canteen Details / Description & Map Card */}
      <View style={styles.aboutCard}>
        {provider.description ? (
          <Text style={styles.providerDescription}>{provider.description}</Text>
        ) : null}
        <View style={styles.metaRow}>
          {provider.location ? (
            <View style={styles.infoBadge}>
              <Ionicons name="location-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.infoBadgeText} numberOfLines={1}>{provider.location}</Text>
            </View>
          ) : null}
          {provider.deliveryTime ? (
            <View style={styles.infoBadge}>
              <Ionicons name="time-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.infoBadgeText}>{provider.deliveryTime}</Text>
            </View>
          ) : null}
        </View>

        {/* Google Maps Campus Location Preview */}
        <View style={styles.mapCard}>
          <View style={styles.mapVisual}>
            <View style={styles.mapHeaderRow}>
              <View style={styles.mapBadge}>
                <Ionicons name="map" size={13} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.mapBadgeText}>Google Maps • CUET</Text>
              </View>
              <Text style={styles.coordText}>22.46° N, 91.97° E</Text>
            </View>

            <View style={styles.mapGraphic}>
              {/* Simulated Map Layout */}
              <View style={styles.mapRoadH} />
              <View style={styles.mapRoadV} />
              <View style={styles.mapPinPulse}>
                <View style={styles.mapPin}>
                  <Ionicons name="restaurant" size={14} color={colors.white} />
                </View>
              </View>
              <View style={styles.mapPinLabel}>
                <Text style={styles.mapPinTitle} numberOfLines={1}>{provider.name}</Text>
                <Text style={styles.mapPinSubtitle} numberOfLines={1}>
                  {provider.location || 'CUET Campus'}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.mapActions}>
            <TouchableOpacity
              style={styles.directionsBtn}
              onPress={handleGetDirections}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate-circle" size={18} color={colors.white} style={{ marginRight: 6 }} />
              <Text style={styles.directionsBtnText}>Get Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.openMapBtn}
              onPress={handleOpenGoogleMaps}
              activeOpacity={0.8}
            >
              <Ionicons name="open-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.openMapBtnText}>Open in Google Maps</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Section Title */}
      <Text style={styles.sectionTitle}>Available Menu Items</Text>

      {/* Category Tabs */}
      {categories.length > 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipActive,
              ]}
              onPress={() => handleSelectCategory(cat)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.categoryTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ListHeaderComponent={renderHeader}
          data={displayedMenuItems}
          keyExtractor={(item) => item._id || item.id || item.name}
          renderItem={({ item }) => (
            <View style={styles.itemWrapper}>
              <FoodItemCard
                item={item}
                quantity={getItemQty(item.name)}
                onUpdateQty={handleUpdateQty}
              />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No items found in this category.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bannerContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: spacing.lg,
    justifyContent: 'flex-end',
  },
  providerName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
  },
  providerMeta: {
    fontSize: 14,
    color: '#FFEAA7',
    fontWeight: '600',
    marginVertical: spacing.xs,
  },
  reviewsBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadiusSm,
    marginTop: spacing.xs,
  },
  reviewsBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  aboutCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: spacing.borderRadiusMd,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  providerDescription: {
    fontSize: 13,
    color: colors.textDark,
    lineHeight: 19,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: spacing.borderRadiusSm,
  },
  infoBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.primary,
  },

  /* Google Map Card */
  mapCard: {
    marginTop: spacing.md,
    backgroundColor: '#F1F8F5',
    borderRadius: spacing.borderRadiusMd,
    borderWidth: 1,
    borderColor: '#D4EADF',
    overflow: 'hidden',
  },
  mapVisual: {
    padding: spacing.md,
    backgroundColor: '#E8F5EE',
  },
  mapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  mapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
  },
  coordText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textGray,
  },
  mapGraphic: {
    height: 90,
    backgroundColor: '#DCF0E5',
    borderRadius: spacing.borderRadiusSm,
    borderWidth: 1,
    borderColor: '#C3E4D2',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mapRoadH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
    top: 38,
  },
  mapRoadV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 14,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
    left: '48%',
  },
  mapPinPulse: {
    position: 'absolute',
    top: 14,
    alignItems: 'center',
    zIndex: 2,
  },
  mapPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  mapPinLabel: {
    position: 'absolute',
    bottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusSm,
    maxWidth: '90%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 2,
  },
  mapPinTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textDark,
  },
  mapPinSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textGray,
  },
  mapActions: {
    flexDirection: 'row',
    padding: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: '#D4EADF',
  },
  directionsBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 9,
    borderRadius: spacing.borderRadiusSm,
  },
  directionsBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.white,
  },
  openMapBtn: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 9,
    borderRadius: spacing.borderRadiusSm,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  openMapBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.primary,
  },

  sectionTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 18,
    color: colors.textDark,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  categoryScroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textGray,
  },
  categoryTextActive: {
    color: colors.white,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  itemWrapper: {
    paddingHorizontal: spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.regular,
    color: colors.textGray,
    fontSize: 14,
  },
});

export default ProviderMenuScreen;
