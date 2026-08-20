import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fonts } from '../../theme/colors';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DataService from '../../api/DataService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CartScreen = ({ navigation }) => {
  const {
    cart,
    orderType,
    setOrderType,
    subtotal,
    deliveryFee,
    total,
    currentProviderName,
    updateQty,
    removeItem,
    clearCart,
  } = useCart();

  const handleUpdateQty = (name, price, change, img, provider, desc) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    updateQty(name, price, change, img, provider, desc);
  };

  const handleSetOrderType = (type) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOrderType(type);
  };

  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [deliveryAddress, setDeliveryAddress] = useState(currentUser?.residence || '');
  const [orderNote, setOrderNote] = useState('');
  const [providerInfo, setProviderInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProvider = async () => {
      if (currentProviderName) {
        try {
          const providers = await DataService.getProviders();
          const match = providers.find(
            (p) => p.name.toLowerCase() === currentProviderName.toLowerCase()
          );
          setProviderInfo(match || null);
        } catch (e) {
          // ignore
        }
      } else {
        setProviderInfo(null);
      }
    };
    fetchProvider();
  }, [currentProviderName]);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      showToast('Your cart is empty', 'warning');
      return;
    }

    if (orderType === 'Delivery' && !deliveryAddress.trim()) {
      showToast('Please specify delivery address/hall room', 'warning');
      return;
    }

    setLoading(true);

    const orderPayload = {
      providerName: currentProviderName,
      type: orderType.toLowerCase(),
      items: cart.map((item) => ({
        name: item.name,
        price: item.price,
        qty: item.qty,
        desc: item.desc || '',
      })),
      total,
      deliveryAddress: orderType === 'Delivery' ? deliveryAddress.trim() : null,
      note: orderNote.trim() || undefined,
    };

    try {
      await DataService.createOrder(orderPayload);
      showToast('Order placed successfully!');
      clearCart();
      navigation.navigate('Orders');
    } catch (err) {
      showToast(err.message || 'Failed to place order', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="cart-outline" size={48} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
        <Text style={styles.emptySubtitle}>
          Browse our food halls & canteens to add delicious meals
        </Text>
        <CustomButton
          title="Browse Food Halls"
          onPress={() => navigation.navigate('ExploreStack')}
          style={styles.emptyBtn}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Provider Header */}
        <View style={styles.card}>
          <Text style={styles.providerLabel}>Ordering From:</Text>
          <Text style={styles.providerName}>{currentProviderName}</Text>
          {providerInfo?.location ? (
            <View style={styles.providerLocationRow}>
              <Ionicons name="location-outline" size={13} color={colors.textGray} style={{ marginRight: 4 }} />
              <Text style={styles.providerLocationText} numberOfLines={1}>
                {providerInfo.location}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Order Type Toggle */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Method</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                orderType === 'Delivery' && styles.toggleOptionActive,
              ]}
              onPress={() => handleSetOrderType('Delivery')}
            >
              <Ionicons
                name="bicycle"
                size={18}
                color={orderType === 'Delivery' ? colors.white : colors.textDark}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.toggleText,
                  orderType === 'Delivery' && styles.toggleTextActive,
                ]}
              >
                Delivery (+৳30)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleOption,
                orderType === 'Pickup' && styles.toggleOptionActive,
              ]}
              onPress={() => handleSetOrderType('Pickup')}
            >
              <Ionicons
                name="bag-handle"
                size={18}
                color={orderType === 'Pickup' ? colors.white : colors.textDark}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.toggleText,
                  orderType === 'Pickup' && styles.toggleTextActive,
                ]}
              >
                Pickup (Free)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Address Input */}
        {orderType === 'Delivery' && (
          <View style={styles.card}>
            <CustomInput
              label="Delivery Address / Hall Room"
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              placeholder="e.g. QK Hall, Room 302"
            />
          </View>
        )}

        {/* Cart Items List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items Selected</Text>
          {cart.map((item, index) => (
            <View key={index} style={styles.cartItem}>
              <Image
                source={{ uri: item.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100' }}
                style={styles.itemImg}
              />
              <View style={styles.itemMeta}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.desc ? (
                  <Text style={styles.itemDesc} numberOfLines={2}>
                    {item.desc}
                  </Text>
                ) : null}
                <Text style={styles.itemPrice}>৳ {item.price}</Text>
              </View>

              {/* Quantity Stepper (+ / -) */}
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={[styles.stepperBtn, item.qty === 1 && styles.stepperBtnDanger]}
                  onPress={() => handleUpdateQty(item.name, item.price, -1, item.img, item.provider, item.desc)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.qty === 1 ? 'trash-outline' : 'remove'}
                    size={14}
                    color={item.qty === 1 ? colors.danger : colors.primary}
                  />
                </TouchableOpacity>
                <Text style={styles.stepperQtyText}>{item.qty}</Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => handleUpdateQty(item.name, item.price, 1, item.img, item.provider, item.desc)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.itemTotal}>৳ {item.price * item.qty}</Text>
            </View>
          ))}
        </View>

        {/* Special Instructions / Note */}
        <View style={styles.card}>
          <CustomInput
            label="Special Instructions / Cooking Note"
            value={orderNote}
            onChangeText={setOrderNote}
            placeholder="e.g. Less spicy, no onions, extra spoon"
          />
        </View>

        {/* Billing Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryVal}>৳ {subtotal}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryVal}>৳ {deliveryFee}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalVal}>৳ {total}</Text>
          </View>
        </View>

        <CustomButton
          title={`Place Order (৳ ${total})`}
          onPress={handlePlaceOrder}
          loading={loading}
          style={styles.placeOrderBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg },
  card: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  providerLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.textGray },
  providerName: { fontFamily: fonts.headingBold, fontSize: 18, color: colors.primary, marginTop: 1 },
  providerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  providerLocationText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textGray,
    flex: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.textDark, marginBottom: spacing.sm },
  toggleRow: { flexDirection: 'row', gap: spacing.sm },
  toggleOption: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: spacing.borderRadiusSm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  toggleOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleText: { fontSize: 13, fontWeight: '600', color: colors.textGray },
  toggleTextActive: { color: colors.white },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemImg: { width: 44, height: 44, borderRadius: spacing.borderRadiusSm },
  itemMeta: { flex: 1, marginLeft: spacing.sm, marginRight: spacing.xs },
  itemName: { fontSize: 14, fontWeight: '600', color: colors.textDark },
  itemDesc: { fontSize: 11, color: colors.textGray, marginTop: 1, marginBottom: 2 },
  itemPrice: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: spacing.borderRadiusSm,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnDanger: {
    backgroundColor: colors.dangerLight,
  },
  stepperQtyText: {
    paddingHorizontal: 6,
    fontWeight: '700',
    color: colors.textDark,
    fontSize: 12,
    minWidth: 18,
    textAlign: 'center',
  },
  itemTotal: { fontSize: 14, fontWeight: '700', color: colors.textDark, minWidth: 48, textAlign: 'right' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  summaryLabel: { color: colors.textGray, fontSize: 13 },
  summaryVal: { color: colors.textDark, fontSize: 13, fontWeight: '600' },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
  },
  totalLabel: { fontSize: 16, fontWeight: '800', color: colors.textDark },
  totalVal: { fontSize: 18, fontWeight: '800', color: colors.primary },
  placeOrderBtn: { marginTop: spacing.xs },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.textDark },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textGray,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  emptyBtn: { marginTop: spacing.md, width: '100%' },
});

export default CartScreen;
