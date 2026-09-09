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
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../theme/colors';
import AdminHeader from '../../components/AdminHeader';
import Toast from '../../components/Toast';
import DataService from '../../api/DataService';

const formatReviewDate = (dateString) => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (e) {
    return '';
  }
};

const AdminReviewsScreen = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRating, setSelectedRating] = useState('all');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const loadReviews = useCallback(async () => {
    try {
      const data = await DataService.getAdminReviews();
      setReviews(data || []);
    } catch (e) {
      console.warn('AdminReviewsScreen load error:', e);
      setToast({
        visible: true,
        message: 'Failed to load reviews from database',
        type: 'error',
      });
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
    const customerName =
      (typeof review.buyer === 'object' ? review.buyer?.name : null) ||
      (typeof review.user === 'object' ? review.user?.name : null) ||
      review.userName ||
      'Customer';
    const sellerName =
      (typeof review.provider === 'object' ? review.provider?.name : null) ||
      review.providerName ||
      'Seller';

    const confirmMsg = `Are you sure you want to delete the review by "${customerName}" for "${sellerName}"?\n\nThis will remove the review from the database and recalculate the seller's rating.`;

    const performDelete = async () => {
      const reviewId = review._id || review.id;
      try {
        await DataService.deleteReview(reviewId);
        setReviews((prev) =>
          prev.filter((r) => String(r._id || r.id) !== String(reviewId))
        );
        setToast({
          visible: true,
          message: 'Review deleted successfully from database',
          type: 'success',
        });
      } catch (e) {
        setToast({
          visible: true,
          message: e.message || 'Failed to delete review',
          type: 'error',
        });
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(confirmMsg)) {
        performDelete();
      }
      return;
    }

    Alert.alert('Delete Review', confirmMsg, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: performDelete,
      },
    ]);
  };

  // Quick summary metrics calculated directly from database reviews
  const summaryMetrics = useMemo(() => {
    const total = reviews.length;
    if (total === 0) return { total: 0, avgRating: '0.0', fiveStars: 0, lowRatings: 0 };

    const sumRating = reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
    const avgRating = (sumRating / total).toFixed(1);
    const fiveStars = reviews.filter((r) => Number(r.rating) === 5).length;
    const lowRatings = reviews.filter((r) => Number(r.rating) <= 2).length;

    return { total, avgRating, fiveStars, lowRatings };
  }, [reviews]);

  // Counts for each star filter
  const ratingCounts = useMemo(() => {
    const counts = { all: reviews.length, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.round(Number(r.rating) || 0);
      if (counts[star] !== undefined) {
        counts[star]++;
      }
    });
    return counts;
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // Rating filter
      if (selectedRating !== 'all' && Number(r.rating) !== Number(selectedRating)) {
        return false;
      }

      // Search filter across customer name, seller name, comment, department
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const customerName = (
          typeof r.buyer === 'object' ? r.buyer?.name || '' : r.userName || ''
        ).toLowerCase();
        const sellerName = (
          typeof r.provider === 'object' ? r.provider?.name || '' : r.providerName || ''
        ).toLowerCase();
        const comment = (r.comment || '').toLowerCase();
        const dept = (
          typeof r.buyer === 'object' ? r.buyer?.department || '' : ''
        ).toLowerCase();

        return (
          customerName.includes(q) ||
          sellerName.includes(q) ||
          comment.includes(q) ||
          dept.includes(q)
        );
      }
      return true;
    });
  }, [reviews, selectedRating, searchQuery]);

  const renderStars = (rating) => {
    const count = Math.round(Number(rating) || 5);
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
        <Text style={styles.loadingText}>Loading campus reviews from database...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminHeader />
      <FlatList
        data={filteredReviews}
        keyExtractor={(item) => String(item._id || item.id)}
        renderItem={({ item }) => {
          const customerName =
            (typeof item.buyer === 'object' ? item.buyer?.name : null) ||
            (typeof item.user === 'object' ? item.user?.name : null) ||
            item.userName ||
            'Campus Customer';

          const sellerName =
            (typeof item.provider === 'object' ? item.provider?.name : null) ||
            item.providerName ||
            'Campus Seller';

          const customerDept =
            typeof item.buyer === 'object' ? item.buyer?.department : null;

          const formattedDate = formatReviewDate(item.createdAt);

          return (
            <View style={styles.reviewCard}>
              <View style={styles.cardHeader}>
                <View style={styles.userSection}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.headerTextBox}>
                    {/* Customer Name */}
                    <View style={styles.customerRow}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {customerName}
                      </Text>
                      {customerDept && (
                        <Text style={styles.deptBadge}>• {customerDept}</Text>
                      )}
                    </View>

                    {/* Seller Name */}
                    <View style={styles.sellerTag}>
                      <Ionicons name="storefront-outline" size={13} color={colors.secondary} />
                      <Text style={styles.sellerName} numberOfLines={1}>
                        {sellerName}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Delete Button */}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteReview(item)}
                  activeOpacity={0.7}
                  accessibilityLabel="Delete Review"
                >
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>

              {/* Rating and Date Row */}
              <View style={styles.ratingRow}>
                {renderStars(item.rating)}
                {formattedDate ? (
                  <Text style={styles.dateText}>{formattedDate}</Text>
                ) : null}
              </View>

              {/* Review Comment */}
              {item.comment ? (
                <Text style={styles.commentText}>{item.comment}</Text>
              ) : (
                <Text style={styles.noCommentText}>No written review comment.</Text>
              )}
            </View>
          );
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Seller Reviews</Text>
            <Text style={styles.subtitle}>
              Moderate customer feedback given to campus sellers
            </Text>

            {/* Quick Metrics Bar from Database */}
            <View style={styles.summaryBar}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryVal}>{summaryMetrics.total}</Text>
                <Text style={styles.summaryLbl}>Reviews</Text>
              </View>
              <View style={styles.summaryDiv} />
              <View style={styles.summaryCol}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Ionicons name="star" size={14} color={colors.rating} />
                  <Text style={[styles.summaryVal, { color: colors.ratingText }]}>
                    {summaryMetrics.avgRating}
                  </Text>
                </View>
                <Text style={styles.summaryLbl}>Avg Rating</Text>
              </View>
              <View style={styles.summaryDiv} />
              <View style={styles.summaryCol}>
                <Text style={[styles.summaryVal, { color: colors.success }]}>
                  {summaryMetrics.fiveStars}
                </Text>
                <Text style={styles.summaryLbl}>5-Star</Text>
              </View>
              <View style={styles.summaryDiv} />
              <View style={styles.summaryCol}>
                <Text
                  style={[
                    styles.summaryVal,
                    summaryMetrics.lowRatings > 0 && { color: colors.danger },
                  ]}
                >
                  {summaryMetrics.lowRatings}
                </Text>
                <Text style={styles.summaryLbl}>Low (≤2★)</Text>
              </View>
            </View>

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

            {/* Rating Filter Chips with Real Database Counts */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {[
                { label: `All Reviews (${ratingCounts.all})`, value: 'all' },
                { label: `5 ★ (${ratingCounts[5]})`, value: '5' },
                { label: `4 ★ (${ratingCounts[4]})`, value: '4' },
                { label: `3 ★ (${ratingCounts[3]})`, value: '3' },
                { label: `2 ★ (${ratingCounts[2]})`, value: '2' },
                { label: `1 ★ (${ratingCounts[1]})`, value: '1' },
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
            <Text style={styles.emptyText}>No reviews matched your filters.</Text>
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
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textGray,
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
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryVal: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textDark,
  },
  summaryLbl: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    color: colors.textGray,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryDiv: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
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
    fontFamily: fonts.bold,
  },
  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd + 2,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
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
    gap: spacing.sm + 2,
    flex: 1,
    marginRight: spacing.sm,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextBox: {
    flex: 1,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 15,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
  },
  deptBadge: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textLight,
  },
  sellerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  sellerName: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.secondary,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.dangerBorder,
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
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textLight,
  },
  commentText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textDark,
    lineHeight: 20,
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.sm + 2,
    borderRadius: spacing.borderRadiusSm,
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
