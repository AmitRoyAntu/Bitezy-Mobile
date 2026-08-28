import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import CustomSelect from '../../components/CustomSelect';
import { colors, spacing, fonts } from '../../theme/colors';
import { useToast } from '../../context/ToastContext';
import DataService from '../../api/DataService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CATEGORY_OPTIONS = [
  { label: 'Rice & Biryani', value: 'Rice' },
  { label: 'Curry & Meals', value: 'Curry' },
  { label: 'Fast Food & Burgers', value: 'Fast Food' },
  { label: 'Snacks & Street Food', value: 'Snacks' },
  { label: 'Beverages & Drinks', value: 'Drinks' },
  { label: 'Desserts & Sweets', value: 'Dessert' },
];

const SellerMenuScreen = () => {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [provider, setProvider] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add / Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Rice');
  const [itemPrice, setItemPrice] = useState('');
  const [itemImg, setItemImg] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadMenuData = async () => {
    try {
      const myProvider = await DataService.getMyProvider();
      setProvider(myProvider);
      const items = await DataService.getMenu(myProvider?._id || myProvider?.id, false);
      setMenuItems(items || []);
    } catch (err) {
      showToast('Error loading menu items', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMenuData();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadMenuData();
  };

  const categories = useMemo(() => {
    const cats = new Set(menuItems.map((m) => m.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [menuItems]);

  const filteredItems = menuItems.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setItemName('');
    setItemCategory('Rice');
    setItemPrice('');
    setItemImg('');
    setItemDesc('');
    setModalVisible(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setItemName(item.name || '');
    setItemCategory(item.category || 'Rice');
    setItemPrice(item.price ? String(item.price) : '');
    setItemImg(item.img || '');
    setItemDesc(item.desc || item.description || '');
    setModalVisible(true);
  };

  const handleSaveItem = async () => {
    if (!itemName.trim()) {
      showToast('Please enter an item name', 'warning');
      return;
    }
    const priceNum = parseFloat(itemPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast('Please enter a valid price in BDT', 'warning');
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        name: itemName.trim(),
        category: itemCategory,
        price: priceNum,
        img: itemImg.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
        desc: itemDesc.trim(),
      };

      if (editingItem) {
        await DataService.updateMenuItem(editingItem._id || editingItem.id, payload);
        showToast('Item updated successfully!');
      } else {
        await DataService.createMenuItem(payload);
        showToast('Item added to menu!');
      }

      setModalVisible(false);
      loadMenuData();
    } catch (err) {
      showToast(err.message || 'Error saving menu item', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleAvailability = async (item) => {
    const newStatus = !item.available;
    try {
      await DataService.updateMenuItem(item._id || item.id, { available: newStatus });
      setMenuItems((prev) =>
        prev.map((i) => (i._id === item._id || i.id === item.id ? { ...i, available: newStatus } : i))
      );
      showToast(`${item.name} is now ${newStatus ? 'AVAILABLE' : 'OUT OF STOCK'}`);
    } catch (err) {
      showToast('Failed to update availability', 'error');
    }
  };

  const handleDeleteItem = (item) => {
    const confirmMsg = `Are you sure you want to delete "${item.name}" from your canteen menu?`;

    const performDelete = async () => {
      try {
        await DataService.deleteMenuItem(item._id || item.id);
        showToast('Item removed from menu');
        setMenuItems((prev) => prev.filter((i) => i._id !== item._id && i.id !== item.id));
      } catch (err) {
        showToast('Failed to delete item', 'error');
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(confirmMsg)) {
        performDelete();
      }
      return;
    }

    Alert.alert('Delete Menu Item', confirmMsg, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: performDelete,
      },
    ]);
  };


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + spacing.sm, 44) }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerEyebrow} numberOfLines={1}>Your Kitchen</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>Menu Management</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {menuItems.length} Food Items • {provider?.name || 'Canteen'}
            </Text>
          </View>
          <View style={styles.headerIconWrap}>
            <Ionicons name="restaurant" size={18} color={colors.primary} />
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={17} color={colors.textGray} style={{ marginRight: 8 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search menu items..."
            placeholderTextColor={colors.textLight}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Filter Chips */}
        {categories.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setSelectedCategory(cat);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === cat && styles.categoryChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Menu Items List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item._id || item.id || item.name}
          renderItem={({ item }) => (
            <View style={[styles.itemCard, !item.available && styles.itemCardDisabled]}>
              <Image
                source={{
                  uri: item.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80',
                }}
                style={styles.itemThumb}
              />

              <View style={styles.itemInfo}>
                <View style={styles.itemTitleRow}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.itemPricePill}>
                    <Text style={styles.itemPriceText}>৳ {item.price}</Text>
                  </View>
                </View>

                <View style={styles.itemCategoryBadge}>
                  <Ionicons name="pricetag" size={10} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.itemCategoryText}>{item.category || 'General'}</Text>
                </View>

                {item.desc || item.description ? (
                  <Text style={styles.itemDesc} numberOfLines={2}>
                    {item.desc || item.description}
                  </Text>
                ) : null}

                {/* Bottom Row: Availability Switch & Actions */}
                <View style={styles.cardBottomRow}>
                  <View style={styles.availabilityRow}>
                    <View style={[styles.stockDot, { backgroundColor: item.available ? colors.success : colors.textLight }]} />
                    <Text style={styles.availabilityLabel}>
                      {item.available ? 'In Stock' : 'Out of Stock'}
                    </Text>
                    <Switch
                      value={Boolean(item.available)}
                      onValueChange={() => handleToggleAvailability(item)}
                      trackColor={{ false: '#CBD5E1', true: colors.success }}
                      thumbColor={colors.white}
                      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], marginLeft: 4 }}
                    />
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => handleOpenEditModal(item)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="pencil" size={14} color={colors.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteItem(item)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={14} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: 170 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="restaurant-outline" size={42} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No menu items yet</Text>
              <Text style={styles.emptySubtitle}>Tap “Add Item” to craft delicious dishes for your canteen!</Text>
            </View>
          }
        />
      )}

      {/* Floating Add Item Button (Floats cleanly above navigation bar) */}
      <TouchableOpacity
        style={[
          styles.floatingAddBtn,
          { bottom: Platform.OS === 'ios' ? Math.max(insets.bottom + 80, 92) : 84 },
        ]}
        onPress={handleOpenAddModal}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={20} color={colors.white} style={{ marginRight: 6 }} />
        <Text style={styles.floatingAddBtnText}>Add Item</Text>
      </TouchableOpacity>

      {/* Add / Edit Food Item Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Food Item' : 'Add New Item'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color={colors.textGray} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <CustomInput
                label="Item Name"
                value={itemName}
                onChangeText={setItemName}
                placeholder="e.g. Special Beef Tehari"
              />

              <CustomSelect
                label="Category"
                options={CATEGORY_OPTIONS}
                value={itemCategory}
                onValueChange={setItemCategory}
              />

              <CustomInput
                label="Price (BDT)"
                value={itemPrice}
                onChangeText={setItemPrice}
                placeholder="e.g. 130"
                keyboardType="numeric"
              />

              <CustomInput
                label="Image URL (Optional)"
                value={itemImg}
                onChangeText={setItemImg}
                placeholder="https://images.unsplash.com/..."
              />

              <CustomInput
                label="Description / Ingredients"
                value={itemDesc}
                onChangeText={setItemDesc}
                placeholder="Describe flavors, portions, or spices..."
                multiline
                numberOfLines={3}
              />

              <CustomButton
                title={editingItem ? 'Save Changes' : 'Add Item to Menu'}
                onPress={handleSaveItem}
                loading={submitLoading}
                style={{ marginTop: spacing.md }}
              />

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /* Header */
  header: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: spacing.borderRadiusLg,
    borderBottomRightRadius: spacing.borderRadiusLg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  headerTitleBox: {
    flex: 1,
    marginRight: spacing.xs,
  },
  headerEyebrow: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: fonts.headingExtraBold,
    fontSize: 22,
    color: colors.textDark,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textGray,
    marginTop: 2,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Search */
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: spacing.borderRadiusFull,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    marginVertical: spacing.xs,
  },
  searchInput: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textDark,
    flex: 1,
    padding: 0,
  },

  /* Category Scroll */
  categoryScroll: {
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    paddingHorizontal: 2,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: spacing.borderRadiusFull,
    backgroundColor: colors.surfaceSubtle,
    marginRight: spacing.xs,
  },
  categoryChipActive: {
    backgroundColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  categoryChipText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textGray,
  },
  categoryChipTextActive: {
    color: colors.white,
  },

  /* Floating Add Button */
  floatingAddBtn: {
    position: 'absolute',
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: spacing.borderRadiusFull,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
    zIndex: 99,
  },
  floatingAddBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.white,
    letterSpacing: 0.2,
  },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 110,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* Item Card */
  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.shadowStrong,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 4,
  },
  itemCardDisabled: {
    opacity: 0.78,
  },
  itemThumb: {
    width: 84,
    height: 84,
    borderRadius: spacing.borderRadiusMd,
    backgroundColor: colors.surfaceSubtle,
    marginRight: spacing.md,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontFamily: fonts.headingBold,
    fontSize: 15,
    color: colors.textDark,
    flex: 1,
    marginRight: 8,
  },
  itemPricePill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: spacing.borderRadiusFull,
  },
  itemPriceText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.white,
    letterSpacing: 0.2,
  },
  itemCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
    marginTop: 6,
  },
  itemCategoryText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 0.2,
  },
  itemDesc: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textGray,
    marginTop: 6,
    lineHeight: 16,
  },

  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  availabilityLabel: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.textGray,
    marginRight: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    backgroundColor: colors.primaryLight,
    padding: 7,
    borderRadius: spacing.borderRadiusFull,
  },
  deleteBtn: {
    backgroundColor: colors.dangerLight,
    padding: 7,
    borderRadius: spacing.borderRadiusFull,
  },

  /* Empty State */
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
    color: colors.textDark,
  },
  emptySubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textGray,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 260,
    lineHeight: 18,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: spacing.borderRadiusXl,
    borderTopRightRadius: spacing.borderRadiusXl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '88%',
    shadowColor: colors.shadowStrong,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 18,
    color: colors.textDark,
    letterSpacing: -0.2,
  },
  modalCancelBtn: {
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadiusMd,
    backgroundColor: colors.surfaceSubtle,
  },
  modalCancelText: {
    fontFamily: fonts.semiBold,
    color: colors.textGray,
    fontSize: 13,
  },
});

export default SellerMenuScreen;
