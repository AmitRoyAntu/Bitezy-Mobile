import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../theme/colors';
import AdminHeader from '../../components/AdminHeader';
import SellerCard from '../../components/SellerCard';
import DataService from '../../api/DataService';

const AdminSellersScreen = () => {
  const [sellersData, setSellersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [allUsers, allProviders, allOrders] = await Promise.all([
        DataService.getUsers(),
        DataService.getProviders(),
        DataService.getAllOrders(),
      ]);

      const sellerUsers = allUsers.filter((u) => u.role === 'seller');

      const data = sellerUsers.map((seller) => {
        const sellerId = String(seller._id || seller.id);
        const provider = allProviders.find(
          (p) => String(p.seller) === sellerId
        );
        const shopName = provider ? provider.name : 'No Provider Profile';
        const location = provider
          ? provider.location || 'CUET Campus'
          : 'N/A';
        const provId = provider ? String(provider._id || provider.id) : null;
        const sellerOrders = provId
          ? allOrders.filter(
              (o) =>
                String(o.provider?._id || o.provider) === provId
            )
          : [];
        const totalRevenue = sellerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        return { seller, shopName, location, totalOrders: sellerOrders.length, totalRevenue };
      });

      setSellersData(data);
    } catch (e) {
      console.warn('AdminSellersScreen load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredSellers = useMemo(() => {
    if (!searchQuery.trim()) return sellersData;
    const q = searchQuery.toLowerCase();
    return sellersData.filter((s) => {
      const shop = (s.shopName || '').toLowerCase();
      const owner = (s.seller?.name || '').toLowerCase();
      const loc = (s.location || '').toLowerCase();
      return shop.includes(q) || owner.includes(q) || loc.includes(q);
    });
  }, [sellersData, searchQuery]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminHeader />
      <FlatList
        data={filteredSellers}
        keyExtractor={(item) => String(item.seller._id || item.seller.id)}
        renderItem={({ item }) => (
          <SellerCard
            seller={item.seller}
            shopName={item.shopName}
            location={item.location}
            totalOrders={item.totalOrders}
            totalRevenue={item.totalRevenue}
          />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Seller Management</Text>
            <Text style={styles.subtitle}>
              {sellersData.length} registered canteens & food carts
            </Text>

            {/* Search Bar */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color={colors.textGray} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by shop name, owner, or hall..."
                placeholderTextColor={colors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textGray} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>No sellers matched your search.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textGray,
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm + 4,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textDark,
    marginLeft: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textGray,
    fontFamily: fonts.regular,
    fontSize: 14,
    marginTop: spacing.sm,
  },
});

export default AdminSellersScreen;
