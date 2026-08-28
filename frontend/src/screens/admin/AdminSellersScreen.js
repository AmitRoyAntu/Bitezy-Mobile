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
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../theme/colors';
import AdminHeader from '../../components/AdminHeader';
import SellerCard from '../../components/SellerCard';
import Toast from '../../components/Toast';
import DataService from '../../api/DataService';

const AdminSellersScreen = () => {
  const [sellersData, setSellersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

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
          (p) =>
            String(typeof p.seller === 'object' ? (p.seller?._id || p.seller?.id) : p.seller) === sellerId ||
            (p.seller?.email && p.seller.email.toLowerCase() === (seller.email || '').toLowerCase())
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
        return { seller, provider, shopName, location, totalOrders: sellerOrders.length, totalRevenue };
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

  const handleToggleBlock = (sellerId, currentBlocked) => {
    const item = sellersData.find((s) => String(s.seller._id || s.seller.id) === String(sellerId));
    const shopName = item?.shopName || 'this seller';
    const actionName = currentBlocked ? 'Activate & Reopen' : 'Suspend & Block';

    Alert.alert(
      `${actionName} Seller`,
      `Are you sure you want to ${currentBlocked ? 'activate' : 'suspend'} "${shopName}"? ${
        !currentBlocked
          ? 'Their store will be closed and students will not be able to order.'
          : 'Their store will be available for orders again.'
      }`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: currentBlocked ? 'Activate' : 'Suspend',
          style: currentBlocked ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await DataService.blockSeller(sellerId, !currentBlocked);
              setSellersData((prev) =>
                prev.map((s) =>
                  String(s.seller._id || s.seller.id) === String(sellerId)
                    ? { ...s, seller: { ...s.seller, isBlocked: !currentBlocked } }
                    : s
                )
              );
              setToast({
                visible: true,
                message: `Seller "${shopName}" ${!currentBlocked ? 'suspended' : 'activated'} successfully`,
                type: 'success',
              });
            } catch (e) {
              setToast({
                visible: true,
                message: 'Failed to update seller status',
                type: 'error',
              });
            }
          },
        },
      ]
    );
  };

  const filteredSellers = useMemo(() => {
    return sellersData.filter((s) => {
      // Status filter
      if (selectedFilter === 'active' && s.seller?.isBlocked) return false;
      if (selectedFilter === 'blocked' && !s.seller?.isBlocked) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const shop = (s.shopName || '').toLowerCase();
        const owner = (s.seller?.name || '').toLowerCase();
        const loc = (s.location || '').toLowerCase();
        return shop.includes(q) || owner.includes(q) || loc.includes(q);
      }
      return true;
    });
  }, [sellersData, selectedFilter, searchQuery]);

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
            onToggleBlock={handleToggleBlock}
          />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Seller Management</Text>
            <Text style={styles.subtitle}>
              Manage {sellersData.length} campus canteens, cafeterias & food carts
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

            {/* Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {[
                { label: 'All Sellers', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Suspended / Blocked', value: 'blocked' },
              ].map((chip) => {
                const isActive = selectedFilter === chip.value;
                return (
                  <TouchableOpacity
                    key={chip.value}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setSelectedFilter(chip.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
                    >
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
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
    paddingBottom: 120,
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
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs + 4,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: spacing.borderRadiusFull,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textGray,
  },
  filterChipTextActive: {
    color: colors.white,
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
