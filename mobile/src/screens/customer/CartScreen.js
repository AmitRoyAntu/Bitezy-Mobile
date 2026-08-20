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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fonts } from '../../theme/colors';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DataService from '../../api/DataService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CartScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
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
          const targetStr = String(
            typeof currentProviderName === 'object'
              ? currentProviderName.name || currentProviderName._id
              : currentProviderName
          ).toLowerCase();
          const match = providers.find(
            (p) =>
              (p.name && p.name.toLowerCase() === targetStr) ||
              String(p._id).toLowerCase() === targetStr ||
              String(p.id).toLowerCase() === targetStr
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
    if (!cart || cart.length === 0) {
      showToast('Your cart is empty', 'warning');
      return;
    }

    if (orderType === 'Delivery' && !deliveryAddress.trim()) {
      showToast('Please enter your delivery room/hall address', 'warning');
      return;
    }

    setLoading(true);
    try {
      const orderPayload = {
        provider: providerInfo?._id || providerInfo?.id || (typeof cart[0].provider === 'object' ? cart[0].provider._id : cart[0].provider) || 'canteen-default',
        providerName: providerInfo?.name || (typeof currentProviderName === 'object' ? currentProviderName.name : currentProviderName) || 'Campus Canteen',
        items: cart.map((item) => ({
          name: item.name,
          price: item.price,
          qty: item.qty,
          img: item.img,
        })),
        orderType: orderType.toLowerCase(),
        deliveryAddress: orderType === 'Delivery' ? deliveryAddress.trim() : 'Pickup at counter',
        notes: orderNote.trim(),
        subtotal,
        deliveryFee,
        total,
      };

      await DataService.createOrder(orderPayload);
      showToast('Order placed successfully! 🎉', 'success');
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

  const displayedProviderName =
    providerInfo?.name ||
    (typeof currentProviderName === 'object' ? currentProviderName?.name : currentProviderName) ||
    'Campus Dining';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + spacing.md, 36),
            paddingBottom: 90,
          },
        ]}
        showsVerticalScrollIndicator={true}
      >


        {/* Provider Header */}
        <View style={styles.card}>
          <Text style={styles.providerLabel}>Ordering From:</Text>
          <Text style={styles.providerName}>{displayedProviderName}</Text>
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
  scrollContent: {
    paddingHorizontal: spacing.md,
  },
  bottomSpacer: {
    height: 140,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: colors.secondary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 10px rgba(18, 18, 23, 0.04)',
      },
    }),
  },
  providerLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.textGray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  providerName: {
    fontFamily: fonts.headingBold,
    fontSize: 19,
    color: colors.primary,
    marginTop: 2,
    letterSpacing: -0.3,
  },
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
  cardTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 15,
    color: colors.textDark,
    marginBottom: spacing.sm,
    letterSpacing: -0.2,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: '#F4F5F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textDark,
  },
  toggleTextActive: {
    fontFamily: fonts.bold,
    color: colors.white,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemImg: {
    width: 52,
    height: 52,
    borderRadius: spacing.borderRadiusSm + 4,
    backgroundColor: colors.border,
  },
  itemMeta: {
    flex: 1,
    marginLeft: spacing.sm + 2,
    marginRight: spacing.xs,
  },
  itemName: {
    fontFamily: fonts.headingSemiBold,
    fontSize: 14,
    color: colors.textDark,
    letterSpacing: -0.2,
  },
  itemDesc: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textGray,
    marginTop: 1,
    marginBottom: 2,
  },
  itemPrice: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primary,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 38, 0.2)',
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
    borderRadius: spacing.borderRadiusFull,
  },
  stepperQtyText: {
    paddingHorizontal: 6,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    fontSize: 12,
    minWidth: 18,
    textAlign: 'center',
  },
  itemTotal: {
    fontFamily: fonts.headingBold,
    fontSize: 14,
    color: colors.textDark,
    minWidth: 48,
    textAlign: 'right',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 2,
  },
  summaryLabel: {
    fontFamily: fonts.regular,
    color: colors.textGray,
    fontSize: 13,
  },
  summaryVal: {
    fontFamily: fonts.bold,
    color: colors.textDark,
    fontSize: 13,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs + 2,
    paddingTop: spacing.sm,
  },
  totalLabel: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
    color: colors.textDark,
  },
  totalVal: {
    fontFamily: fonts.headingBold,
    fontSize: 19,
    color: colors.primary,
  },
  placeOrderBtn: {
    marginTop: spacing.xs,
  },
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
  emptyTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 20,
    color: colors.textDark,
  },
  emptySubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textGray,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  emptyBtn: {
    marginTop: spacing.md,
    width: '100%',
  },
});


export default CartScreen;
