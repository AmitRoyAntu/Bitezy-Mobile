import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FoodItemCard from '../../components/FoodItemCard';
import { colors, spacing } from '../../theme/colors';
import DataService from '../../api/DataService';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

const ProviderMenuScreen = ({ route, navigation }) => {
  const { provider } = route.params;
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const { cart, updateQty } = useCart();
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
          source={{ uri: provider.img || 'https://via.placeholder.com/400x200?text=Vendor' }}
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

      {/* Canteen Details / Description */}
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
      </View>

      <Text style={styles.sectionTitle}>Available Menu Items</Text>
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
          data={menuItems}
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
              <Text style={styles.emptyText}>No available items in this menu.</Text>
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
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
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
    color: colors.textGray,
    fontSize: 14,
  },
});

export default ProviderMenuScreen;
