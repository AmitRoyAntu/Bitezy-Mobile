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
    currentProviderId,
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
      try {
        const providers = await DataService.getProviders();
        if (!providers || providers.length === 0) return;

        let match = null;
        if (currentProviderId) {
          match = providers.find((p) => String(p._id || p.id) === String(currentProviderId));
        }

        if (!match && currentProviderName) {
          const targetStr = String(
            typeof currentProviderName === 'object'
              ? currentProviderName.name || currentProviderName._id
              : currentProviderName
          ).toLowerCase();

          match = providers.find(
            (p) =>
              (p.name && p.name.toLowerCase() === targetStr) ||
              String(p._id).toLowerCase() === targetStr ||
              String(p.id).toLowerCase() === targetStr
          );
        }

        setProviderInfo(match || providers[0] || null);
      } catch (e) {
        // ignore
      }
    };
    fetchProvider();
  }, [currentProviderName, currentProviderId]);

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
          currentProviderId ||
          cart[0]?.providerId,
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
            <Text style={styles.emptyEyebrow}>Empty Bag</Text>
            <View style={styles.emptyIconCircleOuter}>
              <View style={styles.emptyIconCircleInner}>
                <Ionicons name="bag-handle" size={48} color={colors.primary} />
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
                  <View style={styles.savedHeaderIcon}>
                    <Ionicons name="bookmark" size={13} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.savedSectionEyebrow}>Quick Picks</Text>
                    <Text style={styles.savedSectionTitle}>From Your Watchlist</Text>
                  </View>
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
            <View style={styles.providerIconCircle}>
              <Ionicons name="storefront" size={18} color={colors.primary} />
            </View>
            <View style={styles.providerLeftCol}>
              <Text style={styles.providerLabel}>Ordering From</Text>
              <Text style={styles.providerName} numberOfLines={1}>
                {displayedProviderName}
              </Text>
              {providerInfo?.location ? (
                <View style={styles.providerLocationRow}>
                  <Ionicons name="location-sharp" size={11} color={colors.primary} style={{ marginRight: 3 }} />
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
              <Ionicons name="trash-outline" size={12} color={colors.danger} style={{ marginRight: 3 }} />
              <Text style={styles.clearCartText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Method Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderTextCol}>
              <Text style={styles.cardEyebrow}>Service</Text>
              <Text style={styles.cardTitle}>Order Method</Text>
            </View>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="swap-horizontal" size={15} color={colors.primary} />
            </View>
          </View>
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
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderTextCol}>
                <Text style={styles.cardEyebrow}>Drop-off Point</Text>
                <Text style={styles.cardTitle}>Delivery Address</Text>
              </View>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="location" size={15} color={colors.primary} />
              </View>
            </View>
            <CustomInput
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              placeholder="e.g. Muktijoddha Hall, Room 412"
            />
          </View>
        )}

        {/* Items Selected Card */}
        <View style={styles.card}>
          <View style={styles.itemsHeaderRow}>
            <View style={styles.cardHeaderTextCol}>
              <Text style={styles.cardEyebrow}>Your Tray</Text>
              <Text style={styles.cardTitle}>Selected Meals</Text>
            </View>
            <View style={styles.itemsHeaderRight}>
              <View style={styles.itemsCountBadge}>
                <View style={styles.itemsCountDot} />
                <Text style={styles.itemsCountBadgeText}>{cart.length} items</Text>
              </View>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="restaurant" size={15} color={colors.primary} />
              </View>
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
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderTextCol}>
              <Text style={styles.cardEyebrow}>Savings</Text>
              <Text style={styles.cardTitle}>Have a Promo Code?</Text>
            </View>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="pricetag" size={15} color={colors.primary} />
            </View>
          </View>
          {appliedCoupon ? (
            <View style={styles.appliedCouponCard}>
              <View style={styles.appliedCouponIcon}>
                <Ionicons name="pricetag" size={18} color={colors.success} />
              </View>
              <View style={styles.appliedCouponLeft}>
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
                <Ionicons name="close-circle" size={20} color={colors.danger} />
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
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderTextCol}>
              <Text style={styles.cardEyebrow}>For the Cook</Text>
              <Text style={styles.cardTitle}>Special Cooking Instructions</Text>
            </View>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="chatbox-ellipses" size={15} color={colors.primary} />
            </View>
          </View>
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
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderTextCol}>
              <Text style={styles.cardEyebrow}>Breakdown</Text>
              <Text style={styles.cardTitle}>Bill Details</Text>
            </View>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="receipt" size={15} color={colors.primary} />
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryLabelRow}>
              <View style={[styles.summaryIconBox, { backgroundColor: colors.surfaceSubtle }]}>
                <Ionicons name="fast-food" size={13} color={colors.textDark} />
              </View>
              <Text style={styles.summaryLabel}>Item Total</Text>
            </View>
            <Text style={styles.summaryVal}>৳ {subtotal}</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryLabelRow}>
              <View style={[styles.summaryIconBox, { backgroundColor: orderType === 'Delivery' ? colors.primaryLight : colors.surfaceSubtle }]}>
                <Ionicons name="bicycle" size={13} color={orderType === 'Delivery' ? colors.primary : colors.textGray} />
              </View>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
            </View>
            <Text style={styles.summaryVal}>৳ {deliveryFee}</Text>
          </View>

          {discountAmount > 0 ? (
            <View style={styles.summaryRow}>
              <View style={styles.summaryLabelRow}>
                <View style={[styles.summaryIconBox, { backgroundColor: colors.successLight }]}>
                  <Ionicons name="pricetag" size={13} color={colors.success} />
                </View>
                <Text style={[styles.summaryLabel, styles.summaryLabelSuccess]}>
                  Coupon Discount ({appliedCoupon?.code})
                </Text>
              </View>
              <Text style={[styles.summaryVal, styles.summaryValSuccess]}>- ৳ {discountAmount}</Text>
            </View>
          ) : null}

          <View style={[styles.summaryRow, styles.totalRow]}>
            <View style={styles.totalLabelCol}>
              <Text style={styles.totalLabel}>To Pay</Text>
              <Text style={styles.totalSubtext}>Incl. all campus taxes</Text>
            </View>
            <View style={styles.totalBadge}>
              <Ionicons name="wallet" size={13} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.totalVal}>৳ {finalPayableTotal}</Text>
            </View>
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
  },
  providerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryGlow,
  },
  providerLeftCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  providerLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  providerName: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
    color: colors.textDark,
    marginTop: 2,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  clearCartText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.danger,
  },

  /* Card Header (shared) */
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardHeaderTextCol: {
    flex: 1,
  },
  cardHeaderIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primaryGlow,
  },
  cardEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 15,
    color: colors.textDark,
    marginTop: 2,
  },

  /* Items Header */
  itemsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  itemsHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemsCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1,
    borderColor: colors.primaryGlow,
  },
  itemsCountDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 5,
  },
  itemsCountBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
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
    width: 52,
    height: 52,
    borderRadius: spacing.borderRadiusMd,
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
    borderColor: colors.primaryGlow,
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
    borderRadius: spacing.borderRadiusMd,
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
    borderRadius: spacing.borderRadiusMd,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  applyCouponBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.white,
  },
  appliedCouponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.successBorder,
    padding: spacing.sm + 2,
    borderRadius: spacing.borderRadiusMd,
  },
  appliedCouponIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  appliedCouponLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  appliedCouponCode: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.success,
  },
  appliedCouponDesc: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textGray,
    marginTop: 1,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1,
    borderColor: colors.border,
  },
  instructionChipText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textDark,
  },
  customNoteInput: {
    backgroundColor: colors.inputBg,
    borderRadius: spacing.borderRadiusMd,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 2,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textDark,
    minHeight: 60,
    textAlignVertical: 'top',
  },

  /* Payment Summary */
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  summaryIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  summaryLabel: {
    fontFamily: fonts.regular,
    color: colors.textGray,
    fontSize: 13,
  },
  summaryLabelSuccess: {
    color: colors.success,
    fontFamily: fonts.semiBold,
  },
  summaryVal: {
    fontFamily: fonts.bold,
    color: colors.textDark,
    fontSize: 13,
  },
  summaryValSuccess: {
    color: colors.success,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs + 2,
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  totalLabelCol: {
    flex: 1,
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
    marginTop: 1,
  },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1,
    borderColor: colors.primaryGlow,
  },
  totalVal: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
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
    paddingTop: spacing.lg,
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 14,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 14px rgba(18, 18, 23, 0.06)',
      },
    }),
  },
  emptyEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  emptyIconCircleOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primaryGlow,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  emptyIconCircleInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primaryGlow,
  },
  emptyTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 19,
    color: colors.textDark,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  browseHallsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    borderRadius: spacing.borderRadiusFull,
    width: '100%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
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
  savedHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primaryGlow,
  },
  savedSectionEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  savedSectionTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 13,
    color: colors.textDark,
    marginTop: 1,
  },
  savedItemCountText: {
    fontFamily: fonts.semiBold,
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
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 2px 6px rgba(18, 18, 23, 0.04)',
      },
    }),
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
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: spacing.borderRadiusFull,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  savedAddBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.white,
    marginLeft: 3,
  },
});

export default CartScreen;
