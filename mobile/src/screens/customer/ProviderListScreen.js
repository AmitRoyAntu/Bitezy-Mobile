import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProviderCard from '../../components/ProviderCard';
import Logo from '../../components/Logo';
import { colors, spacing, fonts } from '../../theme/colors';
import DataService from '../../api/DataService';
import { useToast } from '../../context/ToastContext';

const CATEGORIES = [
  { name: 'All', icon: 'grid-outline', desc: 'All campus food providers' },
  { name: 'Canteen', icon: 'restaurant-outline', desc: 'Residential hall canteens' },
  { name: 'Cafeteria', icon: 'cafe-outline', desc: 'Central cafeteria & dining' },
  { name: 'Cart', icon: 'fast-food-outline', desc: 'Food carts & evening snacks' },
];

const ProviderListScreen = ({ navigation }) => {
  const [providers, setProviders] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { showToast } = useToast();

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
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Logo size="small" showTagline={false} />
          <Text style={styles.greetingTag}>CUET Campus</Text>
        </View>
        <Text style={styles.greeting}>Find Food Halls & Canteens</Text>

        {/* Integrated Search Bar with Filter Icon */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={19} color={colors.textLight} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search for canteen, cafeteria, cart..."
            placeholderTextColor={colors.textLight}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={16} color={colors.textLight} />
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
          renderItem={({ item }) => (
            <ProviderCard
              provider={item}
              onPress={(p) => navigation.navigate('ProviderMenu', { provider: p })}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={42} color={colors.border} style={{ marginBottom: spacing.xs }} />
              <Text style={styles.emptyText}>No food halls or canteens found.</Text>
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
              <Text style={styles.sheetTitle}>Filter by Category</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  greetingTag: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: spacing.borderRadiusFull,
  },
  greeting: {
    fontFamily: fonts.headingBold,
    fontSize: 18,
    color: colors.textDark,
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: spacing.borderRadiusMd,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48,
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
    width: 32,
    height: 32,
    borderRadius: spacing.borderRadiusSm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
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
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: 4,
    borderRadius: spacing.borderRadiusFull,
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
    padding: spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.regular,
    color: colors.textGray,
    fontSize: 14,
  },

  /* Bottom Sheet Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: spacing.borderRadiusLg,
    borderTopRightRadius: spacing.borderRadiusLg,
    padding: spacing.lg,
    paddingBottom: spacing.xl + 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  sheetDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
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
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionIconBoxSelected: {
    backgroundColor: colors.primary,
  },
  optionName: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.textDark,
  },
  optionNameSelected: {
    fontFamily: fonts.bold,
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
    borderColor: colors.textLight,
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
});

export default ProviderListScreen;
