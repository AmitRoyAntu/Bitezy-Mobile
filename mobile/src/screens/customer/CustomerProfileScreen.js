import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomInput from '../../components/CustomInput';
import CustomSelect from '../../components/CustomSelect';
import CustomButton from '../../components/CustomButton';
import { colors, spacing, fonts } from '../../theme/colors';
import { CUET_HALLS, CUET_DEPARTMENTS } from '../../data/cuetOptions';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useCart } from '../../context/CartContext';
import DataService from '../../api/DataService';

const CustomerProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { currentUser, logout, updateUser } = useAuth();
  const { showToast } = useToast();
  const { favorites, toggleFavorite } = useFavorites();
  const { updateQty } = useCart();

  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [residence, setResidence] = useState(currentUser?.residence || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [cuetId, setCuetId] = useState(currentUser?.cuetId || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    completedOrders: 0,
  });

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setResidence(currentUser.residence || '');
      setDepartment(currentUser.department || '');
      setCuetId(currentUser.cuetId || '');
    }
  }, [currentUser]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const orders = await DataService.getOrders();
        if (orders && orders.length > 0) {
          const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
          const completed = orders.filter(
            (o) => o.status === 'DELIVERED' || o.status === 'PICKED_UP'
          ).length;
          setStats({
            totalOrders: orders.length,
            totalSpent,
            completedOrders: completed,
          });
        }
      } catch (e) {
        console.log('Error loading stats:', e);
      }
    };
    loadStats();
  }, []);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showToast('Name cannot be empty', 'warning');
      return;
    }
    setLoading(true);

    try {
      const updatePayload = {
        name: name.trim(),
        phone: phone.trim(),
        residence: residence.trim(),
        department: department.trim(),
        cuetId: cuetId.trim(),
      };
      const updated = await DataService.updateProfile(updatePayload);
      updateUser(updated || updatePayload);
      setIsEditing(false);
      showToast('Profile updated successfully!');
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top + spacing.md, 36) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerGlow} />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{currentUser?.name || 'Student Buyer'}</Text>
          <Text style={styles.userEmail}>{currentUser?.email}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.roleTag}>
              <Ionicons name="school" size={12} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.roleTagText}>
                {currentUser?.buyerType || 'Student'} • CUET
              </Text>
            </View>
            <View style={styles.verifiedTag}>
              <Ionicons name="checkmark-circle" size={12} color={colors.success} style={{ marginRight: 4 }} />
              <Text style={styles.verifiedTagText}>Verified Account</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardBorderRight]}>
            <View style={styles.statIconBadge}>
              <Ionicons name="bag-handle-outline" size={14} color={colors.primary} />
            </View>
            <Text style={styles.statNumber}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={[styles.statCard, styles.statCardBorderRight]}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="wallet-outline" size={14} color="#10B981" />
            </View>
            <Text style={styles.statNumber}>৳ {stats.totalSpent}</Text>
            <Text style={styles.statLabel}>Spent</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Ionicons name="checkmark-done-circle-outline" size={14} color="#3B82F6" />
            </View>
            <Text style={styles.statNumber}>{stats.completedOrders}</Text>
            <Text style={styles.statLabel}>Delivered</Text>
          </View>
        </View>

        {/* Campus Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Campus & Contact Details</Text>
            <TouchableOpacity
              onPress={() => setIsEditing(!isEditing)}
              activeOpacity={0.7}
              style={[styles.editPill, isEditing && styles.editPillActive]}
            >
              <Ionicons
                name={isEditing ? 'close' : 'pencil'}
                size={13}
                color={isEditing ? colors.white : colors.primary}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.editBtnText, isEditing && styles.editBtnTextActive]}>
                {isEditing ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <View style={styles.formContainer}>
              <CustomInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Amit Roy"
              />

              <CustomInput
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. 01812345678"
                keyboardType="phone-pad"
              />

              <CustomSelect
                label="Campus Hall / Residence"
                value={residence}
                options={CUET_HALLS}
                onSelect={setResidence}
                placeholder="Select hall..."
              />

              <CustomSelect
                label="Academic Department"
                value={department}
                options={CUET_DEPARTMENTS}
                onSelect={setDepartment}
                placeholder="Select department..."
              />

              <CustomInput
                label="Student ID"
                value={cuetId}
                onChangeText={setCuetId}
                placeholder="e.g. 2204000"
              />

              <CustomButton
                title="Save Changes"
                onPress={handleSaveProfile}
                loading={loading}
                style={styles.saveBtn}
              />
            </View>
          ) : (
            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="id-card-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Student / CUET ID</Text>
                  <Text style={styles.infoValue}>{currentUser?.cuetId || '2204000'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="book-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Department</Text>
                  <Text style={styles.infoValue}>{currentUser?.department || 'Computer Science & Engineering (CSE)'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="business-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Hall Residence / Address</Text>
                  <Text style={styles.infoValue}>{currentUser?.residence || 'Kabi Kazi Nazrul Islam Hall, Room 302'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="call-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Contact Number</Text>
                  <Text style={styles.infoValue}>{currentUser?.phone || '01812345678'}</Text>
                </View>
              </View>

              <View style={[styles.infoRow, styles.infoRowLast]}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="location-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Institution</Text>
                  <Text style={styles.infoValue}>Chittagong University of Engineering & Technology (CUET)</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Quick Shortcuts & Support */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Help & Campus Support</Text>
          
          <TouchableOpacity
            style={styles.supportRow}
            onPress={() => {
              const url = `https://wa.me/8801811112222?text=${encodeURIComponent('Hello Bitezy Support, I need help with my campus dining order.')}`;
              Linking.openURL(url).catch(() => showToast('Could not open WhatsApp', 'info'));
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.supportIconBox, { backgroundColor: colors.successLight }]}>
              <Ionicons name="logo-whatsapp" size={18} color="#059669" />
            </View>
            <View style={styles.supportTextCol}>
              <Text style={styles.supportTitle}>Bitezy WhatsApp Helpdesk</Text>
              <Text style={styles.supportSub}>Direct support for delayed orders or payment issues</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.supportRow, { borderBottomWidth: 0 }]}
            onPress={() => showToast('CUET Canteen Dining Guidelines: Open 7:00 AM - 11:30 PM', 'info')}
            activeOpacity={0.7}
          >
            <View style={[styles.supportIconBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="restaurant-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.supportTextCol}>
              <Text style={styles.supportTitle}>CUET Canteen Guidelines</Text>
              <Text style={styles.supportSub}>Operating hours, mess tokens & hall delivery rules</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutPillBtn}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} style={{ marginRight: 6 }} />
          <Text style={styles.logoutPillBtnText}>Log Out Account</Text>
        </TouchableOpacity>

        {/* Brand Footer */}
        <View style={styles.brandFooter}>
          <Text style={styles.brandFooterText}>Bitezy Campus Dining • v1.2.0</Text>
          <Text style={styles.brandFooterSubtext}>Crafted for CUETians 🎓</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: 140 },
  bottomSpacer: { height: 60 },
  headerCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: colors.primaryLight,
    opacity: 0.7,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    borderWidth: 3,
    borderColor: colors.white,
  },
  avatarText: { fontFamily: fonts.extraBold, fontSize: 36, color: colors.primary },
  userName: { fontFamily: fonts.headingBold, fontSize: 22, color: colors.textDark },
  userEmail: { fontFamily: fonts.regular, fontSize: 13, color: colors.textGray, marginTop: 2 },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.md,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  roleTagText: { fontFamily: fonts.bold, fontSize: 12, color: colors.primary },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  verifiedTagText: { fontFamily: fonts.bold, fontSize: 12, color: colors.success },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusLg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  statCardBorderRight: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  statNumber: {
    fontFamily: fonts.headingBold,
    fontSize: 18,
    color: colors.primary,
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textGray,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardTitle: { fontFamily: fonts.headingBold, fontSize: 16, color: colors.textDark },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  editPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  editBtnText: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
  editBtnTextActive: { color: colors.white },
  formContainer: {
    marginTop: spacing.xs,
  },
  saveBtn: {
    marginTop: spacing.sm,
  },
  infoList: {
    marginTop: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  statIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.textGray,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoValue: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textDark,
    marginTop: 3,
  },

  /* Support Section */
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  supportIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  supportTextCol: {
    flex: 1,
    marginRight: spacing.xs,
  },
  supportTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 13,
    color: colors.textDark,
  },
  supportSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textGray,
    marginTop: 1,
  },

  /* Logout Pill */
  logoutPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerLight,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingVertical: 12,
    borderRadius: spacing.borderRadiusFull,
    marginBottom: spacing.lg,
  },
  logoutPillBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.danger,
  },

  /* Brand Footer */
  brandFooter: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  brandFooterText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textLight,
  },
  brandFooterSubtext: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },

  /* Favorites Section */
  favHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favCountBadge: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: spacing.borderRadiusFull,
  },
  favCountText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.danger,
  },
  favEmptyBox: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  favEmptyText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textDark,
    marginTop: spacing.xs,
  },
  favEmptySub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textGray,
    textAlign: 'center',
    marginTop: 2,
  },
  favList: {
    marginTop: spacing.xs,
  },
  favItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  favItemImg: {
    width: 44,
    height: 44,
    borderRadius: spacing.borderRadiusSm,
    backgroundColor: colors.border,
  },
  favItemInfo: {
    flex: 1,
    marginLeft: spacing.sm + 2,
    marginRight: spacing.xs,
  },
  favItemName: {
    fontFamily: fonts.headingSemiBold,
    fontSize: 13,
    color: colors.textDark,
  },
  favItemPrice: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
    marginTop: 1,
  },
  favItemProvider: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textGray,
  },
  favActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favAddToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: spacing.borderRadiusFull,
  },
  favAddToCartText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.white,
  },
  favDeleteBtn: {
    padding: 6,
  },
});

export default CustomerProfileScreen;
