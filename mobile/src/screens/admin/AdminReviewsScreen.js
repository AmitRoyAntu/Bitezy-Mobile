import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../theme/colors';
import AdminHeader from '../../components/AdminHeader';
import Toast from '../../components/Toast';
import DataService from '../../api/DataService';

const AdminReviewsScreen = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRating, setSelectedRating] = useState('all');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const loadReviews = useCallback(async () => {
    try {
      const data = await DataService.getAllReviews();
      setReviews(data || []);
    } catch (e) {
      console.warn('AdminReviewsScreen load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadReviews();
  };

  const handleDeleteReview = (review) => {
    const reviewerName = review.user?.name || 'Customer';
    Alert.alert(
      'Remove Review',
      `Are you sure you want to remove the review by "${reviewerName}" for ${review.providerName || 'this seller'}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await DataService.deleteReview(review._id || review.id);
              setReviews((prev) =>
                prev.filter((r) => String(r._id || r.id) !== String(review._id || review.id))
              );
              setToast({
                visible: true,
                message: 'Review removed successfully',
                type: 'success',
              });
            } catch (e) {
              setToast({
                visible: true,
                message: 'Failed to delete review',
                type: 'error',
              });
            }
          },
        },
      ]
    );
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // Rating filter
      if (selectedRating !== 'all' && Number(r.rating) !== Number(selectedRating)) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const userName = (r.user?.name || '').toLowerCase();
        const providerName = (r.providerName || '').toLowerCase();
        const comment = (r.comment || '').toLowerCase();
        return userName.includes(q) || providerName.includes(q) || comment.includes(q);
      }
      return true;
    });
  }, [reviews, selectedRating, searchQuery]);

  const renderStars = (rating) => {
    const count = Number(rating) || 5;
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= count ? 'star' : 'star-outline'}
            size={14}
            color={star <= count ? colors.rating : colors.textLight}
            style={{ marginRight: 2 }}
          />
        ))}
        <Text style={styles.ratingNumber}>({rating})</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminHeader />
      <FlatList
        data={filteredReviews}
        keyExtractor={(item) => String(item._id || item.id)}
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            <View style={styles.cardHeader}>
              <View style={styles.userSection}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={16} color={colors.textGray} />
                </View>
                <View>
                  <Text style={styles.userName}>{item.user?.name || 'Anonymous Student'}</Text>
                  <View style={styles.sellerTag}>
                    <Ionicons name="storefront-outline" size={11} color={colors.primary} />
                    <Text style={styles.sellerName} numberOfLines={1}>
                      {item.providerName || 'Campus Seller'}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteReview(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>

            <View style={styles.ratingRow}>
              {renderStars(item.rating)}
              {item.createdAt && (
                <Text style={styles.dateText}>
                  {new Date(item.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              )}
            </View>

            {item.comment ? (
              <Text style={styles.commentText}>{item.comment}</Text>
            ) : (
              <Text style={styles.noCommentText}>No written review comment.</Text>
            )}
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Seller Reviews</Text>
            <Text style={styles.subtitle}>
              Moderate customer feedback given to campus sellers
            </Text>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color={colors.textGray} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by customer, seller, or comment..."
                placeholderTextColor={colors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textGray} />
                </TouchableOpacity>
              )}
            </View>

            {/* Rating Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {[
                { label: 'All Reviews', value: 'all' },
                { label: '5 ★', value: '5' },
                { label: '4 ★', value: '4' },
                { label: '3 ★', value: '3' },
                { label: '2 ★', value: '2' },
                { label: '1 ★', value: '1' },
              ].map((chip) => {
                const isActive = selectedRating === chip.value;
                return (
                  <TouchableOpacity
                    key={chip.value}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setSelectedRating(chip.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
                    >
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbox-ellipses-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>No reviews found.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textGray,
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm + 4,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textDark,
    marginLeft: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs + 4,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: spacing.borderRadiusFull,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textGray,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    marginBottom: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textDark,
  },
  sellerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  sellerName: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.primary,
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingTop: 4,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.ratingText,
    marginLeft: 4,
  },
  dateText: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textLight,
  },
  commentText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textDark,
    lineHeight: 18,
  },
  noCommentText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textGray,
    fontFamily: fonts.regular,
    fontSize: 14,
    marginTop: spacing.sm,
  },
});

export default AdminReviewsScreen;
