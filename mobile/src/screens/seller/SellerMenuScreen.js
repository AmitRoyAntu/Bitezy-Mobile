import React, { useState, useEffect, useMemo } from 'react';
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

  useEffect(() => {
    loadMenuData();
  }, []);

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
    Alert.alert(
      'Delete Menu Item',
      `Are you sure you want to delete "${item.name}" from your canteen menu?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await DataService.deleteMenuItem(item._id || item.id);
              showToast('Item removed from menu');
              setMenuItems((prev) => prev.filter((i) => i._id !== item._id && i.id !== item.id));
            } catch (err) {
              showToast('Failed to delete item', 'error');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + spacing.sm, 44) }]}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>Menu Management</Text>
            <Text style={styles.headerSubtitle}>
              {menuItems.length} Food Items in {provider?.name || 'Canteen'}
            </Text>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={handleOpenAddModal} activeOpacity={0.85}>
            <Ionicons name="add" size={18} color={colors.white} style={{ marginRight: 3 }} />
            <Text style={styles.addBtnText}>Add Item</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={17} color={colors.textLight} style={{ marginRight: 8 }} />
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
            <View style={styles.itemCard}>
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
                  <View style={styles.itemCategoryBadge}>
                    <Text style={styles.itemCategoryText}>{item.category || 'General'}</Text>
                  </View>
                </View>

                <Text style={styles.itemPrice}>৳ {item.price}</Text>

                {item.desc || item.description ? (
                  <Text style={styles.itemDesc} numberOfLines={2}>
                    {item.desc || item.description}
                  </Text>
                ) : null}

                {/* Bottom Row: Availability Switch & Actions */}
                <View style={styles.cardBottomRow}>
                  <View style={styles.availabilityRow}>
                    <Text style={styles.availabilityLabel}>
                      {item.available ? 'In Stock' : 'Out of Stock'}
                    </Text>
                    <Switch
                      value={Boolean(item.available)}
                      onValueChange={() => handleToggleAvailability(item)}
                      trackColor={{ false: '#BDC3C7', true: colors.success }}
                      thumbColor={colors.white}
                      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
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
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={48} color={colors.textLight} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>No menu items found</Text>
              <Text style={styles.emptySubtitle}>Tap "+ Add Item" to add delicious dishes to your canteen!</Text>
            </View>
          }
        />
      )}

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
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontFamily: fonts.headingExtraBold,
    fontSize: 20,
    color: colors.textDark,
  },
  headerSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textGray,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: spacing.borderRadiusSm,
  },
  addBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.white,
  },

  /* Search */
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: spacing.borderRadiusSm,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textDark,
    flex: 1,
    padding: 0,
  },

  /* Category Scroll */
  categoryScroll: {
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: spacing.borderRadiusFull,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textGray,
  },
  categoryChipTextActive: {
    color: colors.white,
  },

  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* Item Card */
  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  itemThumb: {
    width: 80,
    height: 80,
    borderRadius: spacing.borderRadiusSm,
    backgroundColor: colors.background,
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
    fontSize: 14,
    color: colors.textDark,
    flex: 1,
  },
  itemCategoryBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: spacing.borderRadiusSm,
    marginLeft: 6,
  },
  itemCategoryText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: colors.primary,
  },
  itemPrice: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primary,
    marginTop: 2,
  },
  itemDesc: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textGray,
    marginVertical: 3,
    lineHeight: 15,
  },

  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textGray,
    marginRight: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    backgroundColor: colors.primaryLight,
    padding: 6,
    borderRadius: spacing.borderRadiusSm,
  },
  deleteBtn: {
    backgroundColor: '#FFEBEE',
    padding: 6,
    borderRadius: spacing.borderRadiusSm,
  },

  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 16,
    color: colors.textDark,
  },
  emptySubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textGray,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
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
    maxHeight: '85%',
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
  },
  modalCancelBtn: {
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  modalCancelText: {
    fontFamily: fonts.medium,
    color: colors.textGray,
    fontSize: 13,
  },
});

export default SellerMenuScreen;
