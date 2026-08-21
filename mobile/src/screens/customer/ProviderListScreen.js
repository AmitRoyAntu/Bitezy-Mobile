import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Platform,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import ProviderCard from '../../components/ProviderCard';
import Logo from '../../components/Logo';
import { colors, spacing, fonts } from '../../theme/colors';
import DataService from '../../api/DataService';
import { useToast } from '../../context/ToastContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useCart } from '../../context/CartContext';

const CATEGORIES = [
  { name: 'All', icon: 'apps-outline' },
  { name: 'Canteen', icon: 'restaurant-outline' },
  { name: 'Cafeteria', icon: 'cafe-outline' },
  { name: 'Cart', icon: 'fast-food-outline' },
];

const HERO_BANNERS = [
  {
    id: 'welcome-50',
    badge: '50% DISCOUNT',
    badgeIcon: 'pricetag',
    provider: 'Central Cafeteria',
    title: 'Get 50% Off First Meal',
    subtitle: 'Valid on student lunch & breakfast combo packages',
    code: 'CUET50',
    bgColor: '#181216',
    borderColor: 'rgba(255, 75, 38, 0.35)',
    accentColor: colors.primary,
    badgeBg: 'rgba(255, 75, 38, 0.15)',
    bgIcon: 'restaurant',
  },
  {
    id: 'biryani-deal',
    badge: 'SPECIAL PROMO',
    badgeIcon: 'sparkles',
    provider: 'Zia Hall Canteen',
    title: 'Friday Biryani ৳30 Off',
    subtitle: 'Special mutton & chicken kacchi parcels every weekend',
    code: 'BIRYANI30',
    bgColor: '#0C1816',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    accentColor: '#10B981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    bgIcon: 'flame',
  },
  {
    id: 'night-snack',
    badge: 'MIDNIGHT SPECIAL',
    badgeIcon: 'moon',
    provider: 'Tareq Huda Cart',
    title: 'Free Hall Room Delivery',
    subtitle: 'Late night study chai, paratha & snack orders over ৳100',
    code: 'NIGHTBITE',
    bgColor: '#151120',
    borderColor: 'rgba(167, 139, 250, 0.35)',
    accentColor: '#A78BFA',
    badgeBg: 'rgba(167, 139, 250, 0.15)',
    bgIcon: 'cafe',
  },
];

const ProviderListScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [providers, setProviders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const { favorites, toggleFavorite } = useFavorites();
  const { updateQty } = useCart();
  const { showToast } = useToast();

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;


  const switchBanner = (nextIndex) => {
    // Slide out to left
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateXAnim, {
        toValue: -32,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentBannerIndex(nextIndex);
      translateXAnim.setValue(32);
      // Slide in from right to center
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(translateXAnim, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Auto-cycle through promotional banners only when screen is actively focused
  useEffect(() => {
    if (!isFocused || activeCategory !== 'All' || searchQuery) return;
    const bannerTimer = setInterval(() => {
      setCurrentBannerIndex((prev) => {
        const next = (prev + 1) % HERO_BANNERS.length;
        switchBanner(next);
        return prev; // handled inside switchBanner
      });
    }, 3200);
    return () => clearInterval(bannerTimer);
  }, [isFocused, activeCategory, searchQuery]);


  const loadProviders = async () => {
    try {
      const data = await DataService.getProviders();
      setProviders(data || []);
    } catch (err) {
      showToast('Error loading providers list', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProviders();
  };

  const filteredProviders = providers.filter((p) => {
    const providerType = (p.type || '').toLowerCase();
    const targetCategory = activeCategory.toLowerCase();
    
    const matchesCategory =
      activeCategory === 'All' ||
      providerType === targetCategory ||
      (activeCategory === 'Canteen' && providerType === 'dining') ||
      (activeCategory === 'Cart' && providerType === 'snacks');
      
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + spacing.sm, 44) }]}>
        <View style={styles.brandRow}>
          <Logo size="small" showTagline={false} align="left" />

          <TouchableOpacity
            style={[
              styles.watchlistIconButton,
              favorites.length > 0 && styles.watchlistIconButtonActive,
            ]}
            onPress={() => setShowSavedModal(true)}
            activeOpacity={0.75}
          >
            <Ionicons
              name={favorites.length > 0 ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={favorites.length > 0 ? colors.primary : colors.textDark}
            />
            {favorites.length > 0 && <View style={styles.watchlistDot} />}
          </TouchableOpacity>
        </View>

        <View style={styles.greetingBlock}></View>
          <Text style={styles.greeting}>Hungry on campus?</Text>
          <Text style={styles.subGreeting}>Order from your favourite hall canteens & carts</Text>
        </View>

        {/* Integrated Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchIconBox}>
            <Ionicons name="search" size={16} color={colors.primary} />
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search canteens, cafeterias, carts..."
            placeholderTextColor={colors.textLight}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={17} color={colors.textLight} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.filterBtn,
              activeCategory !== 'All' && styles.filterBtnActive,
            ]}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeCategory !== 'All' ? 'options' : 'options-outline'}
              size={18}
              color={activeCategory !== 'All' ? colors.white : colors.textDark}
            />
            {activeCategory !== 'All' && <View style={styles.activeDot} />}
          </TouchableOpacity>
        </View>

        {/* Active Filter Pill indicator */}
        {activeCategory !== 'All' && (
          <View style={styles.activeFilterRow}>
            <View style={styles.activeFilterPill}>
              <View style={styles.activeFilterDot} />
              <Text style={styles.activeFilterText}>Filtered by: {activeCategory}</Text>
              <TouchableOpacity
                onPress={() => setActiveCategory('All')}
                style={styles.removeFilterBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>



      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredProviders}
          keyExtractor={(item) => item._id || item.id || item.name}
          ListHeaderComponent={
            <View style={styles.listHeaderWrapper}>
              {/* Dynamic Auto-Cycling Themed Promo Hero Banner */}
              {activeCategory === 'All' && !searchQuery && (
                (() => {
                  const activeBanner = HERO_BANNERS[currentBannerIndex];
                  return (
                    <View
                      style={[
                        styles.heroBannerCard,
                        {
                          backgroundColor: activeBanner.bgColor,
                          borderColor: activeBanner.borderColor,
                        },
                      ]}
                    >
                      <Animated.View
                        style={[
                          styles.heroContent,
                          {
                            opacity: fadeAnim,
                            transform: [{ translateX: translateXAnim }],
                          },
                        ]}
                      >
                        {/* Top Row: Discount Badge & Offering Provider Tag */}
                        <View style={styles.heroTopRow}>
                          <View
                            style={[
                              styles.heroBadge,
                              {
                                backgroundColor: activeBanner.badgeBg,
                                borderColor: activeBanner.borderColor,
                              },
                            ]}
                          >
                            <Ionicons
                              name={activeBanner.badgeIcon}
                              size={12}
                              color={activeBanner.accentColor}
                              style={{ marginRight: 4 }}
                            />
                            <Text
                              style={[
                                styles.heroBadgeText,
                                { color: activeBanner.accentColor },
                              ]}
                            >
                              {activeBanner.badge}
                            </Text>
                          </View>

                          <View style={styles.providerOfferPill}>
                            <Ionicons
                              name="storefront-outline"
                              size={12}
                              color="rgba(255, 255, 255, 0.75)"
                              style={{ marginRight: 4 }}
                            />
                            <Text style={styles.providerOfferText} numberOfLines={1}>
                              {activeBanner.provider}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.heroTitle}>{activeBanner.title}</Text>
                        <Text style={styles.heroSubtitle}>
                          {activeBanner.subtitle}
                        </Text>

                        <View style={styles.heroActionsRow}>
                          <View
                            style={[
                              styles.promoCodeBox,
                              { borderColor: activeBanner.borderColor },
                            ]}
                          >
                            <Ionicons
                              name="pricetag-outline"
                              size={13}
                              color={activeBanner.accentColor}
                              style={{ marginRight: 5 }}
                            />
                            <Text style={styles.promoCodeLabel}>USE CODE:</Text>
                            <Text
                              style={[
                                styles.promoCodeText,
                                { color: activeBanner.accentColor },
                              ]}
                            >
                              {activeBanner.code}
                            </Text>
                          </View>

                          {/* Dots Pagination Indicator */}
                          <View style={styles.bannerDotsContainer}>
                            {HERO_BANNERS.map((banner, dotIndex) => (
                              <TouchableOpacity
                                key={banner.id}
                                onPress={() => switchBanner(dotIndex)}
                                activeOpacity={0.7}
                                style={[
                                  styles.bannerDot,
                                  currentBannerIndex === dotIndex && [
                                    styles.bannerDotActive,
                                    { backgroundColor: activeBanner.accentColor },
                                  ],
                                ]}
                              />
                            ))}
                          </View>
                        </View>
                      </Animated.View>

                      <View style={styles.heroIconDecoration}>
                        <Ionicons
                          name={activeBanner.bgIcon}
                          size={84}
                          color={activeBanner.accentColor}
                          style={styles.heroIconBg}
                        />
                      </View>
                    </View>
                  );
                })()
              )}

              {/* Section Header with Count */}
              <View style={styles.sectionHeaderBlock}>
                <Text style={styles.sectionEyebrow}>
                  {activeCategory === 'All' ? 'BROWSE PROVIDERS' : `${activeCategory.toUpperCase()} SPOTS`}
                </Text>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>
                    {activeCategory === 'All' ? 'Campus Canteens & Halls' : `${activeCategory} Spots`}
                  </Text>
                  <View style={styles.countPill}>
                    <View style={styles.countIconBox}>
                      <Ionicons name="storefront-outline" size={12} color={colors.primary} />
                    </View>
                    <Text style={styles.countText}>{filteredProviders.length} places</Text>
                  </View>
                </View>
              </View>
            </View>
          }

          renderItem={({ item }) => (
            <ProviderCard
              provider={item}
              onPress={(p) => navigation.navigate('ProviderMenu', { provider: p })}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }

          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEyebrow}>NOTHING FOUND</Text>
              <View style={styles.emptyIconOuter}>
                <View style={styles.emptyIconBox}>
                  <Ionicons name="search-outline" size={38} color={colors.primary} />
                </View>
              </View>
              <Text style={styles.emptyTitle}>No matching food places</Text>
              <Text style={styles.emptyText}>Try searching for something else or reset your filter</Text>
              {activeCategory !== 'All' && (
                <TouchableOpacity
                  style={styles.emptyResetBtn}
                  onPress={() => {
                    setActiveCategory('All');
                    setSearchQuery('');
                  }}
                >
                  <Ionicons name="refresh-outline" size={14} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.emptyResetBtnText}>Show All Providers</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Filter Bottom Sheet Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <TouchableOpacity
            style={styles.bottomSheet}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetDragHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleCol}>
                <Text style={styles.sheetEyebrow}>REFINE YOUR FEED</Text>
                <Text style={styles.sheetTitle}>Filter by Category</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.sheetCloseBtn}
              >
                <Ionicons name="close" size={20} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetOptionsList}>
              {CATEGORIES.map((cat) => {
                const isSelected = activeCategory === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.name}
                    style={[
                      styles.sheetOptionItem,
                      isSelected && styles.sheetOptionItemSelected,
                    ]}
                    onPress={() => {
                      setActiveCategory(cat.name);
                      setShowFilterModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionLeft}>
                      <View
                        style={[
                          styles.optionIconBox,
                          isSelected && styles.optionIconBoxSelected,
                        ]}
                      >
                        <Ionicons
                          name={cat.icon}
                          size={18}
                          color={isSelected ? colors.white : colors.primary}
                        />
                      </View>
                      <View>
                        <Text
                          style={[
                            styles.optionName,
                            isSelected && styles.optionNameSelected,
                          ]}
                        >
                          {cat.name}
                        </Text>
                        <Text style={styles.optionSub}>{cat.desc}</Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {activeCategory !== 'All' && (
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setActiveCategory('All');
                  setShowFilterModal(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.resetBtnText}>Reset Filter</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Saved Watchlist Bottom Sheet Modal */}
      <Modal
        visible={showSavedModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSavedModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSavedModal(false)}
        >
          <TouchableOpacity
            style={styles.savedBottomSheet}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetDragHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleCol}>
                <Text style={styles.sheetEyebrow}>QUICK REORDER</Text>
                <View style={styles.savedModalTitleRow}>
                  <View style={styles.savedTitleIconBox}>
                    <Ionicons name="bookmark" size={14} color={colors.primary} />
                  </View>
                  <Text style={styles.sheetTitle}>Saved Watchlist</Text>
                  {favorites.length > 0 && (
                    <View style={styles.savedModalBadge}>
                      <Text style={styles.savedModalBadgeText}>{favorites.length}</Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowSavedModal(false)}
                style={styles.sheetCloseBtn}
              >
                <Ionicons name="close" size={20} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            {favorites.length === 0 ? (
              <View style={styles.savedEmptyBox}>
                <Ionicons name="bookmark-outline" size={42} color={colors.textLight} />
                <Text style={styles.savedEmptyTitle}>No saved items yet</Text>
                <Text style={styles.savedEmptySub}>
                  Bookmark your favorite meals from any canteen to quickly reorder them here!
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.savedModalScroll} showsVerticalScrollIndicator={false}>
                {favorites.map((item, index) => (
                  <View key={item._id || item.id || item.name + index} style={styles.savedModalItemRow}>
                    <Image
                      source={{ uri: item.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120' }}
                      style={styles.savedModalItemImg}
                    />
                    <View style={styles.savedModalItemInfo}>
                      <Text style={styles.savedModalItemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.savedModalItemPrice}>৳ {item.price}</Text>
                      <Text style={styles.savedModalItemProvider} numberOfLines={1}>
                        {typeof item.provider === 'object' ? item.provider.name : item.provider || 'Campus Canteen'}
                      </Text>
                    </View>

                    <View style={styles.savedModalActions}>
                      <TouchableOpacity
                        style={styles.savedModalAddToCartBtn}
                        onPress={() => {
                          updateQty(
                            item.name,
                            item.price,
                            1,
                            item.img,
                            typeof item.provider === 'object' ? item.provider.name : item.provider || 'Campus Canteen',
                            item.desc
                          );
                          showToast(`Added "${item.name}" to cart!`);
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="cart-outline" size={13} color={colors.white} style={{ marginRight: 3 }} />
                        <Text style={styles.savedModalAddToCartText}>Add</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.savedModalDeleteBtn}
                        onPress={() => toggleFavorite(item)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={15} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  watchlistIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderDark,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: colors.secondary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(18, 18, 23, 0.06)',
      },
    }),
  },
  watchlistIconButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryGlow,
  },
  watchlistDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    borderWidth: 1.5,
    borderColor: colors.card,
  },
  greetingBlock: {
    marginTop: 4,
  },
  greetingEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  greeting: {
    fontFamily: fonts.headingBold,
    fontSize: 22,
    color: colors.textDark,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  subGreeting: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textGray,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: spacing.borderRadiusMd,
    paddingHorizontal: spacing.sm + 2,
    height: 50,
    borderWidth: 1,
    borderColor: colors.borderDark,
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
    }),
  },
  searchIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textDark,
    height: '100%',
  },
  clearBtn: {
    padding: 4,
    marginRight: 4,
  },
  filterBtn: {
    width: 34,
    height: 34,
    borderRadius: spacing.borderRadiusSm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
    position: 'relative',
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  activeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    borderWidth: 1.5,
    borderColor: colors.card,
  },
  activeFilterRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  activeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingLeft: spacing.sm + 2,
    paddingRight: spacing.sm,
    paddingVertical: 5,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1,
    borderColor: colors.primaryGlow,
  },
  activeFilterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  activeFilterText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
    marginRight: 6,
  },
  removeFilterBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 90,
  },
  listHeaderWrapper: {
    marginBottom: spacing.xs,
  },

  /* Hero Campus Specials Banner */
  heroBannerCard: {
    backgroundColor: colors.secondary,
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.md + 2,
    height: 156,
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.borderDark,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowStrong,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: `0 6px 20px ${colors.shadowStrong}`,
      },
    }),
  },
  heroContent: {
    zIndex: 2,
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1,
  },
  heroBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  providerOfferPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
    maxWidth: '55%',
  },
  providerOfferText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  heroTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 17,
    color: colors.white,
    letterSpacing: -0.3,
    marginTop: 2,
    marginBottom: 1,
  },
  heroSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
    height: 32,
  },
  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },

  promoCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 75, 38, 0.45)',
    borderStyle: 'dashed',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
  },
  promoCodeLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 0.5,
    marginRight: 4,
  },
  promoCodeText: {
    fontFamily: fonts.headingBold,
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 1,
  },
  bannerDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  bannerDotActive: {
    width: 16,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  heroIconDecoration: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    zIndex: 1,
  },


  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
    color: colors.textDark,
    letterSpacing: -0.3,
  },
  countPill: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  countText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.textGray,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  emptyIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
    color: colors.textDark,
    marginBottom: 4,
  },
  emptyText: {
    fontFamily: fonts.regular,
    color: colors.textGray,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyResetBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: spacing.borderRadiusFull,
  },
  emptyResetBtnText: {
    fontFamily: fonts.bold,
    color: colors.primary,
    fontSize: 13,
  },

  /* Bottom Sheet Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 18, 23, 0.45)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: spacing.borderRadiusLg,
    borderTopRightRadius: spacing.borderRadiusLg,
    padding: spacing.lg,
    paddingBottom: spacing.xl + 10,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  sheetDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderDark,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 18,
    color: colors.textDark,
  },
  sheetCloseBtn: {
    padding: 4,
  },
  sheetOptionsList: {
    marginVertical: spacing.xs,
  },
  sheetOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.borderRadiusMd,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FAFAFC',
  },
  sheetOptionItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionIconBoxSelected: {
    backgroundColor: colors.primary,
  },
  optionName: {
    fontFamily: fonts.headingSemiBold,
    fontSize: 15,
    color: colors.textDark,
  },
  optionNameSelected: {
    color: colors.primary,
  },
  optionSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textGray,
    marginTop: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  resetBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderRadius: spacing.borderRadiusMd,
  },
  resetBtnText: {
    fontFamily: fonts.semiBold,
    color: colors.danger,
    fontSize: 14,
  },

  /* Saved Watchlist Bottom Sheet */
  savedBottomSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: spacing.borderRadiusLg,
    borderTopRightRadius: spacing.borderRadiusLg,
    padding: spacing.lg,
    paddingBottom: spacing.xl + 10,
    maxHeight: '75%',
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  savedModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedModalBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: spacing.borderRadiusFull,
    marginLeft: 8,
  },
  savedModalBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
  },
  savedEmptyBox: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  savedEmptyTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
    color: colors.textDark,
    marginTop: spacing.sm,
  },
  savedEmptySub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textGray,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: spacing.md,
  },
  savedModalScroll: {
    maxHeight: 380,
    marginTop: spacing.xs,
  },
  savedModalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  savedModalItemImg: {
    width: 48,
    height: 48,
    borderRadius: spacing.borderRadiusSm,
    backgroundColor: colors.border,
  },
  savedModalItemInfo: {
    flex: 1,
    marginLeft: spacing.sm + 2,
    marginRight: spacing.xs,
  },
  savedModalItemName: {
    fontFamily: fonts.headingSemiBold,
    fontSize: 14,
    color: colors.textDark,
  },
  savedModalItemPrice: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primary,
    marginTop: 1,
  },
  savedModalItemProvider: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textGray,
  },
  savedModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savedModalAddToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
  },
  savedModalAddToCartText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.white,
  },
  savedModalDeleteBtn: {
    padding: 6,
  },
});


export default ProviderListScreen;

