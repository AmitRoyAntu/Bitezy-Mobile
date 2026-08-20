import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import CustomInput from '../../components/CustomInput';
import ProviderCard from '../../components/ProviderCard';
import Logo from '../../components/Logo';
import { colors, spacing, fonts } from '../../theme/colors';
import DataService from '../../api/DataService';
import { useToast } from '../../context/ToastContext';

const CATEGORIES = ['All', 'Canteen', 'Cafeteria', 'Cart'];

const ProviderListScreen = ({ navigation }) => {
  const [providers, setProviders] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
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
        <CustomInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for canteen, cafeteria, cart etc"
          style={styles.searchInput}
        />

        {/* Category Filters */}
        <View style={styles.categoriesRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                activeCategory === cat && styles.categoryChipActive,
              ]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === cat && styles.categoryTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
              <Text style={styles.emptyText}>No food halls found.</Text>
            </View>
          }
        />
      )}
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
  searchInput: {
    marginBottom: spacing.md,
  },
  categoriesRow: {
    flexDirection: 'row',
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: spacing.borderRadiusFull,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textGray,
  },
  categoryTextActive: {
    color: colors.white,
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
});

export default ProviderListScreen;
