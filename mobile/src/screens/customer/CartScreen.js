import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
  TextInput,
} from 'react-native';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fonts } from '../../theme/colors';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DataService from '../../api/DataService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const QUICK_INSTRUCTION_CHIPS = [
  '🌶️ Less Spicy',
  '🧅 No Onions',
  '🥄 Extra Cutlery',
  '📦 Separate Parcel',
  '🍲 Hot Curry',
];

const PROMO_CODES = {
  CUET10: { type: 'percent', val: 10, desc: '10% off subtotal' },
  BITE10: { type: 'percent', val: 10, desc: '10% off subtotal' },
  FREEDEL: { type: 'delivery', val: 30, desc: 'Free delivery' },
  FREE30: { type: 'delivery', val: 30, desc: 'Free delivery' },
  WELCOME: { type: 'flat', val: 20, desc: '৳20 off order' },
};

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

  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [deliveryAddress, setDeliveryAddress] = useState(currentUser?.residence || '');
  const [orderNote, setOrderNote] = useState('');
  const [providerInfo, setProviderInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Coupon code state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const handleUpdateQty = (name, price, change, img, provider, desc) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    updateQty(name, price, change, img, provider, desc);
  };

  const handleSetOrderType = (type) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOrderType(type);
  };

  const handleAddChipToNote = (chipText) => {
    const cleanText = chipText.replace(/^[^\w]+/, '').trim();
    if (orderNote.includes(cleanText)) return;
    setOrderNote((prev) => (prev ? `${prev}, ${cleanText}` : cleanText));
  };

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      showToast('Please enter a coupon code', 'warning');
      return;
    }
    if (PROMO_CODES[code]) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
      setAppliedCoupon({ code, ...PROMO_CODES[code] });
      showToast(`Coupon applied! ${PROMO_CODES[code].desc} 🎉`, 'success');
      setCouponInput('');
    } else {
      showToast('Invalid coupon code. Try CUET10 or FREEDEL', 'error');
    }
  };

  const handleRemoveCoupon = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAppliedCoupon(null);
    showToast('Coupon removed', 'info');
  };

  // Discount calculation
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percent') {
      return Math.round((subtotal * appliedCoupon.val) / 100);
    }
    if (appliedCoupon.type === 'delivery') {
      return orderType === 'Delivery' ? Math.min(deliveryFee, appliedCoupon.val) : 0;
    }
    if (appliedCoupon.type === 'flat') {
      return Math.min(subtotal, appliedCoupon.val);
    }
    return 0;
  }, [appliedCoupon, subtotal, deliveryFee, orderType]);

  const finalPayableTotal = Math.max(0, total - discountAmount);

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
        provider:
          providerInfo?._id ||
          providerInfo?.id ||
          (typeof cart[0].provider === 'object' ? cart[0].provider._id : cart[0].provider) ||
          'canteen-default',
        providerName:
          providerInfo?.name ||
          (typeof currentProviderName === 'object' ? currentProviderName.name : currentProviderName) ||
          'Campus Canteen',
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
        discount: discountAmount,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        total: finalPayableTotal,
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

  // -------------------------------------------------------------
  // EMPTY CART SCREEN
  // -------------------------------------------------------------
  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ScrollView
          contentContainerStyle={[
            styles.emptyScrollContent,
            { paddingTop: Math.max(insets.top + spacing.lg, 48), paddingBottom: 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Visual Empty Illustration */}
          <View style={styles.emptyIllustrationWrapper}>
            <View style={styles.emptyIconCircleOuter}>
              <View style={styles.emptyIconCircleInner}>
                <Ionicons name="bag-handle" size={44} color={colors.primary} />
              </View>
            </View>
            <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
            <Text style={styles.emptySubtitle}>
              Explore student-favorite meals, hot curries, and snacks from CUET's top canteens.
            </Text>
            <TouchableOpacity
              style={styles.browseHallsBtn}
              onPress={() => navigation.navigate('ExploreStack')}
              activeOpacity={0.85}
            >
              <Ionicons name="restaurant" size={16} color={colors.white} style={{ marginRight: 6 }} />
              <Text style={styles.browseHallsBtnText}>Browse Campus Food Halls</Text>
            </TouchableOpacity>
          </View>

          {/* Saved Items in Watchlist (Recent 3) */}
          {favorites && favorites.length > 0 ? (
            <View style={styles.savedSectionWrapper}>
              <View style={styles.savedSectionHeader}>
                <View style={styles.savedHeaderTitleRow}>
                  <Ionicons name="bookmark" size={15} color={colors.primary} style={{ marginRight: 5 }} />
                  <Text style={styles.savedSectionTitle}>From Your Saved Watchlist</Text>
                </View>
                <Text style={styles.savedItemCountText}>
                  {favorites.length > 3 ? `Recent 3 of ${favorites.length}` : `${favorites.length} items`}
                </Text>
              </View>

              {favorites.slice(-3).reverse().map((favItem, idx) => (
                <View key={favItem._id || favItem.id || idx} style={styles.savedItemCard}>
                  <Image
                    source={{ uri: favItem.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100' }}
                    style={styles.savedItemImg}
                  />
                  <View style={styles.savedItemInfo}>
                    <Text style={styles.savedItemName} numberOfLines={1}>
                      {favItem.name}
                    </Text>
                    <Text style={styles.savedItemProvider} numberOfLines={1}>
                      {favItem.providerName || 'CUET Canteen'}
                    </Text>
                    <Text style={styles.savedItemPrice}>৳ {favItem.price}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.savedAddBtn}
                    onPress={() => {
                      handleUpdateQty(
                        favItem.name,
                        favItem.price,
                        1,
                        favItem.img,
                        favItem.providerName || favItem.provider,
                        favItem.description
                      );
                      showToast(`Added ${favItem.name} to cart!`, 'success');
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add" size={16} color={colors.white} />
                    <Text style={styles.savedAddBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </View>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE CART SCREEN
  // -------------------------------------------------------------
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
            paddingBottom: 110,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Provider Header Card */}
        <View style={styles.card}>
          <View style={styles.providerCardHeaderRow}>
            <View style={styles.providerLeftCol}>
              <Text style={styles.providerLabel}>Ordering From:</Text>
              <Text style={styles.providerName} numberOfLines={1}>
                {displayedProviderName}
              </Text>
              {providerInfo?.location ? (
                <View style={styles.providerLocationRow}>
                  <Ionicons name="location-sharp" size={12} color={colors.primary} style={{ marginRight: 3 }} />
                  <Text style={styles.providerLocationText} numberOfLines={1}>
                    {providerInfo.location}
                  </Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity
              style={styles.clearCartBtn}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                clearCart();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={14} color={colors.danger} style={{ marginRight: 3 }} />
              <Text style={styles.clearCartText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Method Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Method</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                orderType === 'Delivery' && styles.toggleOptionActive,
              ]}
              onPress={() => handleSetOrderType('Delivery')}
              activeOpacity={0.85}
            >
              <Ionicons
                name="bicycle"
                size={17}
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
              activeOpacity={0.85}
            >
              <Ionicons
                name="bag-handle"
                size={17}
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
              placeholder="e.g. Muktijoddha Hall, Room 412"
            />
          </View>
        )}

        {/* Items Selected Card */}
        <View style={styles.card}>
          <View style={styles.itemsHeaderRow}>
            <Text style={styles.cardTitle}>Selected Meals</Text>
            <View style={styles.itemsCountBadge}>
              <Text style={styles.itemsCountBadgeText}>{cart.length} items</Text>
            </View>
          </View>

          {cart.map((item, index) => (
            <View key={index} style={styles.cartItem}>
              <Image
                source={{ uri: item.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100' }}
                style={styles.itemImg}
              />
              <View style={styles.itemMeta}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                {item.desc ? (
                  <Text style={styles.itemDesc} numberOfLines={1}>
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

        {/* Coupon Code Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Have a Promo Code?</Text>
          {appliedCoupon ? (
            <View style={styles.appliedCouponCard}>
              <View style={styles.appliedCouponLeft}>
                <Ionicons name="pricetag" size={18} color="#10B981" style={{ marginRight: 8 }} />
                <View>
                  <Text style={styles.appliedCouponCode}>{appliedCoupon.code}</Text>
                  <Text style={styles.appliedCouponDesc}>{appliedCoupon.desc}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.removeCouponBtn}
                onPress={handleRemoveCoupon}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponInputRow}>
              <View style={styles.couponInputWrapper}>
                <Ionicons name="ticket-outline" size={16} color={colors.textGray} style={styles.couponIcon} />
                <TextInput
                  style={styles.couponInput}
                  placeholder="Enter code (e.g. CUET10, FREEDEL)"
                  placeholderTextColor={colors.textLight}
                  value={couponInput}
                  onChangeText={setCouponInput}
                  autoCapitalize="characters"
                />
              </View>
              <TouchableOpacity
                style={styles.applyCouponBtn}
                onPress={handleApplyCoupon}
                activeOpacity={0.85}
              >
                <Text style={styles.applyCouponBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Special Instructions / Quick Cooking Notes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Special Cooking Instructions</Text>
          <View style={styles.quickChipsContainer}>
            {QUICK_INSTRUCTION_CHIPS.map((chip, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.instructionChip}
                onPress={() => handleAddChipToNote(chip)}
                activeOpacity={0.8}
              >
                <Text style={styles.instructionChipText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.customNoteInput}
            value={orderNote}
            onChangeText={setOrderNote}
            placeholder="Add specific instructions for the canteen cook..."
            placeholderTextColor={colors.textLight}
            multiline={true}
            numberOfLines={2}
          />
        </View>

        {/* Payment Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bill Details</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Item Total</Text>
            <Text style={styles.summaryVal}>৳ {subtotal}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryVal}>৳ {deliveryFee}</Text>
          </View>

          {discountAmount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#10B981', fontFamily: fonts.semiBold }]}>
                Coupon Discount ({appliedCoupon?.code})
              </Text>
              <Text style={[styles.summaryVal, { color: '#10B981' }]}>- ৳ {discountAmount}</Text>
            </View>
          ) : null}

          <View style={[styles.summaryRow, styles.totalRow]}>
            <View>
              <Text style={styles.totalLabel}>To Pay</Text>
              <Text style={styles.totalSubtext}>Incl. all campus taxes</Text>
            </View>
            <Text style={styles.totalVal}>৳ {finalPayableTotal}</Text>
          </View>
        </View>

        {/* Checkout Button */}
        <CustomButton
          title={`Place Order • ৳ ${finalPayableTotal}`}
          onPress={handlePlaceOrder}
          loading={loading}
          style={styles.placeOrderBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(18, 18, 23, 0.04)',
      },
    }),
  },

  /* Provider Card */
  providerCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  providerLeftCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  providerLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: colors.textGray,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  providerName: {
    fontFamily: fonts.headingBold,
    fontSize: 17,
    color: colors.primary,
    marginTop: 1,
  },
  providerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  providerLocationText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textGray,
  },
  clearCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: spacing.borderRadiusFull,
  },
  clearCartText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.danger,
  },

  /* Card Header */
  cardTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 14,
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  itemsCountBadge: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: spacing.borderRadiusFull,
  },
  itemsCountBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.textGray,
  },

  /* Toggle Method */
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
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textDark,
  },
  toggleTextActive: {
    fontFamily: fonts.bold,
    color: colors.white,
  },

  /* Items */
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemImg: {
    width: 48,
    height: 48,
    borderRadius: spacing.borderRadiusSm,
    backgroundColor: colors.surfaceSubtle,
  },
  itemMeta: {
    flex: 1,
    marginLeft: spacing.sm + 2,
    marginRight: spacing.xs,
  },
  itemName: {
    fontFamily: fonts.headingSemiBold,
    fontSize: 13,
    color: colors.textDark,
  },
  itemDesc: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textGray,
    marginTop: 1,
  },
  itemPrice: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
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
    paddingHorizontal: 7,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnDanger: {
    backgroundColor: colors.dangerLight,
    borderRadius: spacing.borderRadiusFull,
  },
  stepperQtyText: {
    paddingHorizontal: 5,
    fontFamily: fonts.bold,
    color: colors.primaryDark,
    fontSize: 12,
    minWidth: 16,
    textAlign: 'center',
  },
  itemTotal: {
    fontFamily: fonts.headingBold,
    fontSize: 13,
    color: colors.textDark,
    minWidth: 44,
    textAlign: 'right',
  },

  /* Coupon Section */
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  couponInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: spacing.borderRadiusSm,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingHorizontal: spacing.sm,
    height: 42,
  },
  couponIcon: {
    marginRight: 6,
  },
  couponInput: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textDark,
  },
  applyCouponBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    height: 42,
    borderRadius: spacing.borderRadiusSm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyCouponBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.white,
  },
  appliedCouponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: spacing.sm + 2,
    borderRadius: spacing.borderRadiusSm,
  },
  appliedCouponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appliedCouponCode: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#065F46',
  },
  appliedCouponDesc: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: '#047857',
  },
  removeCouponBtn: {
    padding: 4,
  },

  /* Instructions */
  quickChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.sm,
  },
  instructionChip: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  instructionChipText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textDark,
  },
  customNoteInput: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: spacing.borderRadiusSm,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textDark,
    minHeight: 50,
  },

  /* Payment Summary */
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
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
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: fonts.headingBold,
    fontSize: 15,
    color: colors.textDark,
  },
  totalSubtext: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textGray,
  },
  totalVal: {
    fontFamily: fonts.headingBold,
    fontSize: 18,
    color: colors.primary,
  },
  placeOrderBtn: {
    marginTop: spacing.xs,
  },

  /* Empty State */
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyScrollContent: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  emptyIllustrationWrapper: {
    alignItems: 'center',
    width: '100%',
    backgroundColor: colors.card,
    padding: spacing.xl,
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
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
  emptyIconCircleOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 75, 38, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyIconCircleInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 18,
    color: colors.textDark,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textGray,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: spacing.md,
  },
  browseHallsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: spacing.borderRadiusFull,
    width: '100%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  browseHallsBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.white,
  },

  /* Saved Watchlist in Empty State */
  savedSectionWrapper: {
    width: '100%',
  },
  savedSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  savedHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedSectionTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 13,
    color: colors.textDark,
  },
  savedItemCountText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textGray,
  },
  savedItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.sm + 2,
    borderRadius: spacing.borderRadiusMd,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  savedItemImg: {
    width: 44,
    height: 44,
    borderRadius: spacing.borderRadiusSm,
    backgroundColor: colors.surfaceSubtle,
  },
  savedItemInfo: {
    flex: 1,
    marginLeft: spacing.sm + 2,
    marginRight: spacing.sm,
  },
  savedItemName: {
    fontFamily: fonts.headingSemiBold,
    fontSize: 13,
    color: colors.textDark,
  },
  savedItemProvider: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textGray,
    marginTop: 1,
  },
  savedItemPrice: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
  },
  savedAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
  },
  savedAddBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.white,
    marginLeft: 2,
  },
});

export default CartScreen;
