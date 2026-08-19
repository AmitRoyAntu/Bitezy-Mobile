import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import {
  DEMO_ORDERS,
  getSellers,
  getProviderForSeller,
  getOrdersForProvider,
} from '../constants/demoData';
import Header from '../components/Header';
import SellerCard from '../components/SellerCard';

export default function SellersScreen() {
  const sellerUsers = getSellers();

  const sellersData = sellerUsers.map(seller => {
    const provider = getProviderForSeller(seller._id);
    const shopName = provider ? provider.name : 'No Provider Profile';
    const location = provider ? provider.location : 'N/A';
    const sellerOrders = provider ? getOrdersForProvider(provider._id) : [];
    const totalRevenue = sellerOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = sellerOrders.length;

    return { seller, shopName, location, totalOrders, totalRevenue };
  });

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Seller Management</Text>
        <Text style={styles.subtitle}>
          Manage all canteens, cafeterias, and food carts.
        </Text>

        <View style={styles.sectionCard}>
          {sellersData.length === 0 ? (
            <Text style={styles.emptyText}>No sellers found.</Text>
          ) : (
            sellersData.map(data => (
              <SellerCard
                key={data.seller._id}
                seller={data.seller}
                shopName={data.shopName}
                location={data.location}
                totalOrders={data.totalOrders}
                totalRevenue={data.totalRevenue}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.paddingScreen,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.poppinsBold,
    color: COLORS.dark,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.gray,
    marginBottom: 24,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 20,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    paddingVertical: 40,
    fontFamily: FONTS.regular,
    fontSize: 14,
  },
});
