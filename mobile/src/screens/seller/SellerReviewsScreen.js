import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fonts } from '../../theme/colors';
import { useToast } from '../../context/ToastContext';
import DataService from '../../api/DataService';

const SellerReviewsScreen = () => {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReviewsData = async () => {
    try {
      const myProvider = await DataService.getMyProvider();
      setProvider(myProvider);
      if (myProvider?._id || myProvider?.id) {
        const revs = await DataService.getReviewsByProvider(myProvider._id || myProvider.id);
        setReviews(revs || []);
      }
    } catch (err) {
      showToast('Error loading reviews', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReviewsData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadReviewsData();
  };

  const avgRating = useMemo(() => {
    if (!reviews.length) return provider?.rating || '4.8';
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews, provider]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + spacing.sm, 44) }]}>
        <Text style={styles.headerTitle}>Customer Reviews</Text>
        <Text style={styles.headerSubtitle}>
          Feedback from CUET students for {provider?.name || 'your canteen'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ListHeaderComponent={
            <View style={styles.summaryCard}>
              <View style={styles.scoreCol}>
                <Text style={styles.scoreNum}>{avgRating}</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons
                      key={s}
                      name={s <= Math.round(Number(avgRating)) ? 'star' : 'star-outline'}
                      size={15}
                      color="#FF9F43"
                    />
                  ))}
                </View>
                <Text style={styles.reviewCountText}>{reviews.length} Verified Reviews</Text>
              </View>

              <View style={styles.summaryBadgeBox}>
                <Ionicons name="ribbon" size={28} color={colors.primary} />
                <Text style={styles.badgeLabel}>Campus Dining</Text>
              </View>
            </View>
          }
          data={reviews}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          renderItem={({ item }) => (
            <View style={styles.reviewCard}>
              <View style={styles.reviewTopRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.user?.name ? item.user.name.charAt(0).toUpperCase() : 'S'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewerName}>{item.user ? item.user.name : 'CUET Student'}</Text>
                  <Text style={styles.reviewDate}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Verified Buyer'}
                  </Text>
                </View>
                <View style={styles.starPill}>
                  <Ionicons name="star" size={12} color="#FF9F43" style={{ marginRight: 3 }} />
                  <Text style={styles.starScore}>{item.rating}</Text>
                </View>
              </View>
              <Text style={styles.commentText}>{item.comment}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.textLight} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>No reviews yet</Text>
              <Text style={styles.emptySub}>Reviews submitted by students will appear here.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F7' },
  header: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E6EC',
  },
  headerTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 18,
    color: colors.textDark,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textGray,
    marginTop: 2,
  },

  listContent: {
    padding: spacing.md,
    paddingBottom: 60,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.2,
    borderColor: '#DDE1E6',
    ...Platform.select({
      ios: {
        shadowColor: '#121217',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(18, 18, 23, 0.03)',
      },
    }),
  },
  scoreCol: { alignItems: 'flex-start' },
  scoreNum: {
    fontFamily: fonts.headingExtraBold,
    fontSize: 28,
    color: colors.textDark,
  },
  starsRow: { flexDirection: 'row', marginVertical: 3 },
  reviewCountText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textGray,
  },
  summaryBadgeBox: {
    backgroundColor: 'rgba(255, 75, 38, 0.08)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 38, 0.15)',
  },
  badgeLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
  },

  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1.2,
    borderColor: '#DDE1E6',
    ...Platform.select({
      ios: {
        shadowColor: '#121217',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(18, 18, 23, 0.03)',
      },
    }),
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primary,
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
  starPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5E9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusFull,
  },
  starScore: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#D35400',
  },
  commentText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textDark,
    lineHeight: 18,
    marginTop: 4,
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
  emptySub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textGray,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
});

export default SellerReviewsScreen;
