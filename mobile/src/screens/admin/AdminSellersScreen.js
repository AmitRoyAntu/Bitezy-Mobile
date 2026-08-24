import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors, fonts, spacing } from '../../theme/colors';
import AdminHeader from '../../components/AdminHeader';
import SellerCard from '../../components/SellerCard';
import DataService from '../../api/DataService';

const AdminSellersScreen = () => {
  const [sellersData, setSellersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        data={sellersData}
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
          </View>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No sellers registered.</Text>
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
    paddingVertical: 60,
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
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textGray,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
});

export default AdminSellersScreen;
