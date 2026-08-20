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
    updateQty(item.name, item.price, change, item.img, provider.name);
  };

  return (
    <View style={styles.container}>
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

      <Text style={styles.sectionTitle}>Available Menu Items</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={menuItems}
          keyExtractor={(item) => item._id || item.id || item.name}
          renderItem={({ item }) => (
            <FoodItemCard
              item={item}
              quantity={getItemQty(item.name)}
              onUpdateQty={handleUpdateQty}
            />
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
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
