import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/colors';
import DataService from '../../api/DataService';
import { useToast } from '../../context/ToastContext';

const ProviderReviewsScreen = ({ route }) => {
  const { provider } = route.params;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Review Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const { showToast } = useToast();

  const loadReviews = async () => {
    try {
      const data = await DataService.getReviewsByProvider(provider._id || provider.id);
      setReviews(data || []);
    } catch (err) {
      showToast('Error loading reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [provider]);

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
      showToast('Review submitted!');
      setModalVisible(false);
      setComment('');
      setRating(5);
      loadReviews();
    } catch (err) {
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{provider.name} Reviews</Text>
        <TouchableOpacity
          style={styles.addReviewBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addReviewBtnText}>+ Write Review</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          renderItem={({ item }) => (
            <View style={styles.reviewCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.authorName}>
                  {item.user ? item.user.name : 'Anonymous'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="star" size={14} color={colors.rating} style={{ marginRight: 3 }} />
                  <Text style={styles.stars}>{item.rating}</Text>
                </View>
              </View>
              <Text style={styles.comment}>{item.comment}</Text>
              <Text style={styles.date}>
                {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No reviews written yet. Be the first!</Text>
            </View>
          }
        />
      )}

      {/* Write Review Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Write a Review</Text>

            <Text style={styles.ratingLabel}>Select Rating:</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={32}
                    color={colors.rating}
                  />

                </TouchableOpacity>
              ))}
            </View>

            <CustomInput
              label="Your Experience / Feedback"
              value={comment}
              onChangeText={setComment}
              placeholder="Tell us about the food quality & service..."
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
              style={styles.cancelBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textDark, flex: 1 },
  addReviewBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: spacing.borderRadiusSm,
  },
  addReviewBtnText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  listContent: { padding: spacing.lg },
  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  authorName: { fontSize: 14, fontWeight: '700', color: colors.textDark },
  stars: { fontSize: 14, fontWeight: '700', color: colors.accent },
  comment: { fontSize: 13, color: colors.textGray, marginVertical: spacing.xs },
  date: { fontSize: 11, color: colors.textLight, marginTop: spacing.xs },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { color: colors.textGray, fontSize: 14 },
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
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textDark, textAlign: 'center' },
  ratingLabel: { fontSize: 13, fontWeight: '600', color: colors.textDark, marginTop: spacing.md },
  starRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: spacing.sm, gap: 8 },
  starIcon: { fontSize: 32 },
  starActive: { color: colors.accent },
  starInactive: { color: colors.border },
  cancelBtn: { alignItems: 'center', marginTop: spacing.md },
  cancelText: { color: colors.textGray, fontSize: 13 },
});

export default ProviderReviewsScreen;
