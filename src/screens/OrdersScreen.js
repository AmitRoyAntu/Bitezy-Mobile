import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import { DEMO_ORDERS } from '../constants/demoData';
import Header from '../components/Header';
import OrderCard from '../components/OrderCard';

export default function OrdersScreen() {
  // Sort by createdAt descending (most recent first) — same as web
  const orders = [...DEMO_ORDERS].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>All System Orders</Text>
        <Text style={styles.subtitle}>
          Browse and manage all orders across the platform.
        </Text>

        <View style={styles.sectionCard}>
          {orders.length === 0 ? (
            <Text style={styles.emptyText}>No orders in the system.</Text>
          ) : (
            orders.map(order => (
              <OrderCard key={order._id} order={order} showItems={true} />
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
