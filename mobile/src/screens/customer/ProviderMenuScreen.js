import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  Linking,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FoodItemCard from '../../components/FoodItemCard';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { colors, spacing, fonts } from '../../theme/colors';
import DataService from '../../api/DataService';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useFavorites } from '../../context/FavoritesContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TABS = ['Menu', 'Reviews', 'About'];

const ProviderMenuScreen = ({ route, navigation }) => {
  const { provider } = route.params;
  const [activeTab, setActiveTab] = useState('Menu');
  const [menuItems, setMenuItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const { cart, updateQty, totalItems, subtotal, total } = useCart();
  const { isFavorite } = useFavorites();
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      const [items, revs] = await Promise.all([
        DataService.getMenuByProvider(provider._id || provider.id, true),
        DataService.getReviewsByProvider(provider._id || provider.id),
      ]);
      setMenuItems(items || []);
      setReviews(revs || []);
    } catch (err) {
      showToast('Error loading canteen details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [provider]);

  const categories = useMemo(() => {
    const cats = new Set(menuItems.map((m) => m.category).filter(Boolean));
    const hasFavs = menuItems.some((m) => isFavorite(m));
    return ['All', ...(hasFavs ? ['Saved Items'] : []), ...Array.from(cats)];
  }, [menuItems, isFavorite]);

  const displayedMenuItems = useMemo(() => {
    if (selectedCategory === 'All') return menuItems;
    if (selectedCategory === 'Saved Items') return menuItems.filter((m) => isFavorite(m));
    return menuItems.filter((m) => m.category === selectedCategory);
  }, [menuItems, selectedCategory, isFavorite]);


  const handleTabChange = (tab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  const handleSelectCategory = (cat) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedCategory(cat);
  };

  const handleOpenGoogleMaps = () => {
    const lat = provider.lat || 22.4621;
    const lng = provider.lng || 91.9729;
    const targetQuery = provider.mapQuery || `${provider.name}, CUET, Chittagong`;
    const query = encodeURIComponent(targetQuery);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    Linking.openURL(mapsUrl).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {
        showToast('Could not open Google Maps', 'error');
      });
    });
  };

  const handleGetDirections = () => {
    const lat = provider.lat || 22.4621;
    const lng = provider.lng || 91.9729;
    const targetQuery = provider.mapQuery || `${provider.name}, CUET`;
    const destination = encodeURIComponent(targetQuery);
    const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    Linking.openURL(dirUrl).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}`).catch(() => {
        showToast('Could not open directions in Google Maps', 'error');
      });
    });
  };

  const handleWhatsAppContact = () => {
    const phone = provider.phone || '01811112222';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`;
    const text = encodeURIComponent(`Hello ${provider.name}, I am inquiring regarding your menu on Bitezy CUET.`);
    Linking.openURL(`https://wa.me/${intlPhone}?text=${text}`).catch(() => {
      Linking.openURL(`tel:${phone}`).catch(() => {
        showToast('Could not open WhatsApp', 'error');
      });
    });
  };

  const handlePhoneCall = () => {
    const phone = provider.phone || '01811112222';
    Linking.openURL(`tel:${phone}`).catch(() => {
      showToast('Could not start phone call', 'error');
    });
  };

  const handleAddReview = async () => {
    if (!comment.trim()) {
      showToast('Please enter a review comment', 'warning');
      return;
    }
    setSubmitLoading(true);

    try {
      await DataService.createReview({
        provider: provider._id || provider.id,
        rating,
        comment: comment.trim(),
      });
      showToast('Review submitted successfully!');
      setReviewModalVisible(false);
      setComment('');
      setRating(5);
      const updatedRevs = await DataService.getReviewsByProvider(provider._id || provider.id);
      setReviews(updatedRevs || []);
    } catch (err) {
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getItemQty = (itemName) => {
    const found = cart.find((c) => c.name === itemName);
    return found ? found.qty : 0;
  };

  const handleUpdateQty = (item, change) => {
    updateQty(item.name, item.price, change, item.img, provider.name, item.desc || item.description);
  };

  const avgRating = useMemo(() => {
    if (!reviews.length) return provider.rating || '4.5';
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews, provider.rating]);

  const renderHeader = () => (
    <View>
      {/* Banner */}
      <View style={styles.bannerContainer}>
        <Image
          source={{ uri: provider.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80' }}
          style={styles.bannerImage}
        />
        <View style={styles.bannerOverlay}>
          <Text style={styles.providerName}>{provider.name}</Text>
          <View style={styles.heroMetaRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{provider.type}</Text>
            </View>
            <View style={styles.starBadge}>
              <Ionicons name="star" size={13} color={colors.rating} style={{ marginRight: 4 }} />
              <Text style={styles.starBadgeText}>{avgRating}</Text>
            </View>

            <View style={[styles.statusPill, provider.isOpen === false ? styles.closedPill : styles.openPill]}>
              <Text style={styles.statusPillText}>{provider.isOpen === false ? 'Closed' : 'Open'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 3-Section Tab Bar (Menu, Reviews, About) */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'Menu' && styles.tabItemActive]}
          onPress={() => handleTabChange('Menu')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'Menu' && styles.tabTextActive]}>
            Menu
          </Text>
          {activeTab === 'Menu' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'Reviews' && styles.tabItemActive]}
          onPress={() => handleTabChange('Reviews')}
          activeOpacity={0.7}
        >
          <View style={styles.tabLabelRow}>
            <Text style={[styles.tabText, activeTab === 'Reviews' && styles.tabTextActive]}>
              Reviews
            </Text>
            {reviews.length > 0 && (
              <View style={[styles.tabCountPill, activeTab === 'Reviews' && styles.tabCountPillActive]}>
                <Text style={[styles.tabCountText, activeTab === 'Reviews' && styles.tabCountTextActive]}>
                  {reviews.length}
                </Text>
              </View>
            )}
          </View>
          {activeTab === 'Reviews' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'About' && styles.tabItemActive]}
          onPress={() => handleTabChange('About')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'About' && styles.tabTextActive]}>
            About
          </Text>
          {activeTab === 'About' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Tab 1: Category Filter Chips inside Menu */}
      {activeTab === 'Menu' && categories.length > 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipActive,
              ]}
              onPress={() => handleSelectCategory(cat)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.categoryTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : activeTab === 'Menu' ? (
        <FlatList
          ListHeaderComponent={renderHeader}
          data={displayedMenuItems}
          keyExtractor={(item) => item._id || item.id || item.name}
          renderItem={({ item }) => (
            <View style={styles.itemWrapper}>
              <FoodItemCard
                item={item}
                providerName={provider.name}
                quantity={getItemQty(item.name)}
                onUpdateQty={handleUpdateQty}
              />
            </View>

          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No items found in this category.</Text>
            </View>
          }
        />
      ) : activeTab === 'Reviews' ? (
        <FlatList
          ListHeaderComponent={
            <View>
              {renderHeader()}
              {/* Reviews Summary Header Card */}
              <View style={styles.reviewsSummaryCard}>
                <View style={styles.ratingScoreBox}>
                  <Text style={styles.ratingLargeScore}>{avgRating}</Text>
                  <View style={styles.starsRowSmall}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons
                        key={s}
                        name={s <= Math.round(Number(avgRating)) ? 'star' : 'star-outline'}
                        size={14}
                        color={colors.rating}
                      />
                    ))}
                  </View>
                  <Text style={styles.ratingSubCount}>{reviews.length} Student Reviews</Text>
                </View>

                <TouchableOpacity
                  style={styles.writeReviewBtn}
                  onPress={() => setReviewModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="create-outline" size={16} color={colors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.writeReviewBtnText}>Write Review</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          data={reviews}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          renderItem={({ item }) => (
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeaderRow}>
                <View style={styles.reviewerAvatar}>
                  <Text style={styles.reviewerAvatarText}>
                    {item.user?.name ? item.user.name.charAt(0).toUpperCase() : 'S'}
                  </Text>
                </View>
                <View style={styles.reviewerInfo}>
                  <Text style={styles.reviewerName}>
                    {item.user ? item.user.name : 'CUET Student'}
                  </Text>
                  <Text style={styles.reviewDate}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Verified Buyer'}
                  </Text>
                </View>
                <View style={styles.reviewStarBadge}>
                  <Ionicons name="star" size={12} color={colors.rating} style={{ marginRight: 3 }} />
                  <Text style={styles.reviewStarScore}>{item.rating}</Text>
                </View>
              </View>
              <Text style={styles.reviewCommentText}>{item.comment}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={42} color={colors.textLight} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>No reviews yet</Text>
              <Text style={styles.emptyText}>Be the first CUET student to write a review!</Text>
            </View>
          }
        />
      ) : (
        /* Tab 3: About */
        <ScrollView contentContainerStyle={styles.aboutScrollContent} showsVerticalScrollIndicator={false}>
          {renderHeader()}

          {/* About & Story Card */}
          <View style={styles.aboutSectionCard}>
            <Text style={styles.aboutSectionTitle}>About the Canteen</Text>
            <Text style={styles.aboutDescription}>
              {provider.description || `${provider.name} is one of CUET's dedicated residential food providers, serving freshly prepared Bengali meals, snacks, and refreshments for students and teachers.`}
            </Text>
          </View>

          {/* Quick Info Grid */}
          <View style={styles.infoGridCard}>
            <View style={styles.infoGridRow}>
              <View style={styles.infoGridIconBox}>
                <Ionicons name="location" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoGridTextCol}>
                <Text style={styles.infoGridLabel}>Location</Text>
                <Text style={styles.infoGridVal}>{provider.location || 'CUET Campus, Raozan'}</Text>
              </View>
            </View>

            <View style={styles.infoGridRow}>
              <View style={styles.infoGridIconBox}>
                <Ionicons name="time" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoGridTextCol}>
                <Text style={styles.infoGridLabel}>Operating Hours</Text>
                <Text style={styles.infoGridVal}>
                  {provider.openTime && provider.closeTime
                    ? `${provider.openTime} - ${provider.closeTime}`
                    : '06:00 AM - 10:00 PM (Daily)'}
                </Text>
              </View>
            </View>

            <View style={[styles.infoGridRow, { borderBottomWidth: 0 }]}>
              <View style={styles.infoGridIconBox}>
                <Ionicons name="bicycle" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoGridTextCol}>
                <Text style={styles.infoGridLabel}>Delivery Time</Text>
                <Text style={styles.infoGridVal}>{provider.deliveryTime || '15-20 min'}</Text>
              </View>
            </View>
          </View>

          {/* Google Maps Card */}
          <View style={styles.aboutMapCard}>
            <View style={styles.mapVisualHeader}>
              <View style={styles.mapBadge}>
                <Ionicons name="map" size={13} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.mapBadgeText}>Google Maps Location</Text>
              </View>
              <Text style={styles.coordText}>22.46° N, 91.97° E</Text>
            </View>

            <View style={styles.mapGraphic}>
              <View style={styles.mapRoadH} />
              <View style={styles.mapRoadV} />
              <View style={styles.mapPinPulse}>
                <View style={styles.mapPin}>
                  <Ionicons name="restaurant" size={14} color={colors.white} />
                </View>
              </View>
              <View style={styles.mapPinLabel}>
                <Text style={styles.mapPinTitle} numberOfLines={1}>{provider.name}</Text>
                <Text style={styles.mapPinSubtitle} numberOfLines={1}>
                  {provider.location || 'CUET Campus'}
                </Text>
              </View>
            </View>

            <View style={styles.mapActions}>
              <TouchableOpacity
                style={styles.directionsBtn}
                onPress={handleGetDirections}
                activeOpacity={0.85}
              >
                <Ionicons name="navigate-circle" size={18} color={colors.white} style={{ marginRight: 6 }} />
                <Text style={styles.directionsBtnText}>Get Directions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.openMapBtn}
                onPress={handleOpenGoogleMaps}
                activeOpacity={0.85}
              >
                <Ionicons name="open-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.openMapBtnText}>Open in Maps</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Contact Actions Card */}
          <View style={styles.contactCard}>
            <Text style={styles.aboutSectionTitle}>Direct Contact</Text>
            <Text style={styles.contactSubtitle}>Need to ask about today's special menu or catering?</Text>
            <View style={styles.contactBtnsRow}>
              <TouchableOpacity
                style={styles.whatsAppBtn}
                onPress={handleWhatsAppContact}
                activeOpacity={0.85}
              >
                <Ionicons name="logo-whatsapp" size={18} color={colors.white} style={{ marginRight: 6 }} />
                <Text style={styles.whatsAppBtnText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.callBtn}
                onPress={handlePhoneCall}
                activeOpacity={0.85}
              >
                <Ionicons name="call" size={17} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.callBtnText}>Call Canteen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Write Review Modal */}
      <Modal visible={reviewModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rate & Review {provider.name}</Text>

            <Text style={styles.ratingLabel}>Select Rating:</Text>
            <View style={styles.starSelectRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} style={{ padding: 4 }}>
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={34}
                    color={colors.rating}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <CustomInput
              label="Your Experience / Feedback"
              value={comment}
              onChangeText={setComment}
              placeholder="Tell us about the food quality, taste, and delivery..."
              multiline
              numberOfLines={3}
            />

            <CustomButton
              title="Submit Review"
              onPress={handleAddReview}
              loading={submitLoading}
              style={{ marginTop: spacing.sm }}
            />

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setReviewModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Floating Sticky "View your cart" Pill */}
      {totalItems > 0 && (
        <View style={styles.floatingCartContainer} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.floatingCartBar}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.88}
          >
            <View style={styles.floatingCartLeft}>
              <Text style={styles.floatingCartTitle}>View your cart</Text>
              <View style={styles.floatingCartCountPill}>
                <Text style={styles.floatingCartCountText}>{totalItems}x</Text>
              </View>
            </View>

            <View style={styles.floatingCartRight}>
              <Text style={styles.floatingCartPrice}>৳ {total || subtotal}</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} style={{ marginLeft: 6 }} />
            </View>
          </TouchableOpacity>
        </View>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: spacing.lg,
    justifyContent: 'flex-end',
  },
  providerName: {
    fontFamily: fonts.headingExtraBold,
    fontSize: 22,
    color: colors.white,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  typeBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
  },
  typeBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.white,
  },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
  },
  starBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#FFEAA7',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
  },
  openPill: { backgroundColor: colors.success },
  closedPill: { backgroundColor: colors.danger },
  statusPillText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.white,
    textTransform: 'uppercase',
  },

  /* 3-Section Segmented Tab Bar */
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    position: 'relative',
  },
  tabItemActive: {},
  tabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textGray,
  },
  tabTextActive: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  tabCountPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: spacing.borderRadiusFull,
    marginLeft: 5,
  },
  tabCountPillActive: {
    backgroundColor: colors.primary,
  },
  tabCountText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.primary,
  },
  tabCountTextActive: {
    color: colors.white,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: spacing.md,
    right: spacing.md,
    height: 3,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },

  /* Category Scroll */
  categoryScroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.background,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textGray,
  },
  categoryTextActive: {
    color: colors.white,
  },

  listContent: {
    paddingBottom: 90,
  },
  itemWrapper: {
    paddingHorizontal: spacing.lg,
  },

  /* Reviews Tab */
  reviewsSummaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    padding: spacing.md,
    borderRadius: spacing.borderRadiusMd,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingScoreBox: {
    alignItems: 'flex-start',
  },
  ratingLargeScore: {
    fontFamily: fonts.headingExtraBold,
    fontSize: 26,
    color: colors.textDark,
  },
  starsRowSmall: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  ratingSubCount: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textGray,
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: spacing.borderRadiusSm,
  },
  writeReviewBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.white,
  },
  reviewCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: spacing.borderRadiusMd,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  reviewerAvatarText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primary,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textDark,
  },
  reviewDate: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textLight,
  },
  reviewStarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5E9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
  },
  reviewStarScore: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#D35400',
  },
  reviewCommentText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textDark,
    lineHeight: 18,
    marginTop: 4,
  },

  /* About Tab */
  aboutScrollContent: {
    paddingBottom: spacing.xxl,
  },
  aboutSectionCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: spacing.borderRadiusMd,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  aboutSectionTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  aboutDescription: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textGray,
    lineHeight: 19,
  },
  infoGridCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: spacing.borderRadiusMd,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  infoGridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoGridIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoGridTextCol: {
    flex: 1,
  },
  infoGridLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.textGray,
    textTransform: 'uppercase',
  },
  infoGridVal: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textDark,
    marginTop: 1,
  },

  /* About Map Card */
  aboutMapCard: {
    backgroundColor: '#F1F8F5',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: spacing.borderRadiusMd,
    borderWidth: 1,
    borderColor: '#D4EADF',
    overflow: 'hidden',
  },
  mapVisualHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    backgroundColor: '#E8F5EE',
  },
  mapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
  },
  coordText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textGray,
  },
  mapGraphic: {
    height: 90,
    backgroundColor: '#DCF0E5',
    margin: spacing.sm,
    borderRadius: spacing.borderRadiusSm,
    borderWidth: 1,
    borderColor: '#C3E4D2',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mapRoadH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
    top: 38,
  },
  mapRoadV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 14,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
    left: '48%',
  },
  mapPinPulse: {
    position: 'absolute',
    top: 14,
    alignItems: 'center',
    zIndex: 2,
  },
  mapPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  mapPinLabel: {
    position: 'absolute',
    bottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusSm,
    maxWidth: '90%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 2,
  },
  mapPinTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textDark,
  },
  mapPinSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textGray,
  },
  mapActions: {
    flexDirection: 'row',
    padding: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: '#D4EADF',
  },
  directionsBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 9,
    borderRadius: spacing.borderRadiusSm,
  },
  directionsBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.white,
  },
  openMapBtn: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 9,
    borderRadius: spacing.borderRadiusSm,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  openMapBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.primary,
  },

  /* Contact Card */
  contactCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: spacing.borderRadiusMd,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  contactSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textGray,
    marginBottom: spacing.md,
  },
  contactBtnsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  whatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.whatsApp,
    paddingVertical: 10,
    borderRadius: spacing.borderRadiusSm,
  },
  whatsAppBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.white,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 10,
    borderRadius: spacing.borderRadiusSm,
  },
  callBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primary,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
    color: colors.textDark,
    marginTop: 4,
  },
  emptyText: {
    fontFamily: fonts.regular,
    color: colors.textGray,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 2,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.lg,
  },
  modalTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 18,
    color: colors.textDark,
    textAlign: 'center',
  },
  ratingLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textDark,
    marginTop: spacing.md,
  },
  starSelectRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: spacing.sm,
    gap: 8,
  },
  modalCancelBtn: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  modalCancelText: {
    fontFamily: fonts.medium,
    color: colors.textGray,
    fontSize: 13,
  },

  /* Floating Sticky Cart Bar */
  floatingCartContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  floatingCartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: spacing.borderRadiusFull,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 6px 20px rgba(255, 75, 38, 0.35)',
      },
    }),
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingCartTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 15,
    color: colors.white,
    marginRight: 8,
    letterSpacing: -0.2,
  },
  floatingCartCountPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
  },
  floatingCartCountText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.white,
  },
  floatingCartRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingCartPrice: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
    color: colors.white,
    letterSpacing: -0.3,
  },
});

export default ProviderMenuScreen;

