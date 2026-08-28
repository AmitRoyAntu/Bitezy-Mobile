import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import CustomInput from '../../components/CustomInput';
import CustomSelect from '../../components/CustomSelect';
import CustomButton from '../../components/CustomButton';
import ProfileInfoRow from '../../components/ProfileInfoRow';
import LogoutButton from '../../components/LogoutButton';
import BrandFooter from '../../components/BrandFooter';
import { colors, spacing, fonts } from '../../theme/colors';
import { CUET_HALLS, CUET_DEPARTMENTS } from '../../data/cuetOptions';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCart } from '../../context/CartContext';
import DataService from '../../api/DataService';
import Logo from '../../components/Logo';

const CustomerProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { currentUser, logout, updateUser } = useAuth();
  const { showToast } = useToast();
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

  useFocusEffect(
    useCallback(() => {
      loadUserStats();
    }, [])
  );

  const loadUserStats = async () => {
    try {
      const orders = await DataService.getOrders();
      if (orders && orders.length) {
        const completed = orders.filter((o) => ['DELIVERED', 'PICKED_UP'].includes(o.status));
        const spent = completed.reduce((sum, o) => sum + (o.total || 0), 0);
        setStats({
          totalOrders: orders.length,
          totalSpent: spent,
          completedOrders: completed.length,
        });
      }
    } catch (err) {
      // Keep defaults
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showToast('Please enter your name', 'error');
      return;
    }
    if (!phone.trim()) {
      showToast('Please enter your contact number', 'error');
      return;
    }

    setLoading(true);
    try {
      const updatePayload = {
        name: name.trim(),
        phone: phone.trim(),
        residence,
        department,
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
          <View style={styles.headerTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerEyebrow}>Profile</Text>
              <Text style={styles.userName}>{currentUser?.name || 'Student Buyer'}</Text>
              <Text style={styles.userEmail}>{currentUser?.email}</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          </View>

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
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsEyebrow}>Snapshot</Text>
            <Text style={styles.statsTitle}>Your Activity</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statCardBorderRight]}>
              <View style={[styles.statIconBadge, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="bag-handle-outline" size={14} color={colors.primary} />
              </View>
              <Text style={styles.statNumber}>{stats.totalOrders}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={[styles.statCard, styles.statCardBorderRight]}>
              <View style={[styles.statIconBadge, { backgroundColor: colors.successLight }]}>
                <Ionicons name="wallet-outline" size={14} color={colors.success} />
              </View>
              <Text style={styles.statNumber}>৳ {stats.totalSpent}</Text>
              <Text style={styles.statLabel}>Spent</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBadge, { backgroundColor: colors.infoLight }]}>
                <Ionicons name="checkmark-done-circle-outline" size={14} color={colors.info} />
              </View>
              <Text style={styles.statNumber}>{stats.completedOrders}</Text>
              <Text style={styles.statLabel}>Delivered</Text>
            </View>
          </View>
        </View>

        {/* Campus Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardEyebrow}>Campus & Contact</Text>
              <Text style={styles.cardTitle}>Personal Details</Text>
            </View>
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
              <Text style={styles.formSectionEyebrow}>Identity</Text>
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
              <View style={styles.formDivider} />
              <Text style={styles.formSectionEyebrow}>Campus Details</Text>
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
              <ProfileInfoRow
                icon="id-card-outline"
                label="Student / CUET ID"
                value={currentUser?.cuetId || '2204000'}
                iconColor={colors.primary}
                iconBg="rgba(255, 75, 38, 0.08)"
              />
              <ProfileInfoRow
                icon="book-outline"
                label="Department"
                value={currentUser?.department || 'Computer Science & Engineering (CSE)'}
                iconColor={colors.info}
                iconBg={colors.infoLight}
              />
              <ProfileInfoRow
                icon="business-outline"
                label="Hall Residence / Address"
                value={currentUser?.residence || 'Kabi Kazi Nazrul Islam Hall, Room 302'}
                iconColor={colors.success}
                iconBg={colors.successLight}
              />
              <ProfileInfoRow
                icon="call-outline"
                label="Contact Number"
                value={currentUser?.phone || '01812345678'}
                iconColor={colors.rating}
                iconBg={colors.ratingBg}
              />
              <ProfileInfoRow
                icon="location-outline"
                label="Institution"
                value="Chittagong University of Engineering & Technology (CUET)"
                iconColor={colors.textDark}
                iconBg={colors.surfaceSubtle}
                isLast
              />
            </View>
          )}
        </View>

        {/* Quick Shortcuts & Support */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardEyebrow}>Need a hand?</Text>
              <Text style={styles.cardTitle}>Help & Campus Support</Text>
            </View>
            <View style={[styles.supportIconBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="help-buoy" size={16} color={colors.primary} />
            </View>
          </View>

          <TouchableOpacity
            style={styles.supportRow}
            onPress={() => {
              const url = `https://wa.me/8801811112222?text=${encodeURIComponent('Hello Bitezy Support, I need help with my campus dining order.')}`;
              Linking.openURL(url).catch(() => showToast('Could not open WhatsApp', 'info'));
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.supportIconBox, { backgroundColor: colors.successLight }]}>
              <Ionicons name="logo-whatsapp" size={18} color={colors.success} />
            </View>
            <View style={styles.supportTextCol}>
              <Text style={styles.supportTitle}>Bitezy WhatsApp Helpdesk</Text>
              <Text style={styles.supportSub}>Direct support for delayed orders or payment issues</Text>
            </View>
            <View style={styles.supportChevronBox}>
              <Ionicons name="chevron-forward" size={14} color={colors.success} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportRow}
            onPress={() => showToast('CUET Canteen Dining Guidelines: Open 7:00 AM - 11:30 PM', 'info')}
            activeOpacity={0.7}
          >
            <View style={[styles.supportIconBox, { backgroundColor: colors.infoLight }]}>
              <Ionicons name="restaurant-outline" size={18} color={colors.info} />
            </View>
            <View style={styles.supportTextCol}>
              <Text style={styles.supportTitle}>CUET Canteen Guidelines</Text>
              <Text style={styles.supportSub}>Operating hours, mess tokens & hall delivery rules</Text>
            </View>
            <View style={styles.supportChevronBox}>
              <Ionicons name="chevron-forward" size={14} color={colors.info} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.supportRow, styles.supportRowLast]}
            onPress={() => showToast('Email us at support@bitezy.app', 'info')}
            activeOpacity={0.7}
          >
            <View style={[styles.supportIconBox, { backgroundColor: colors.ratingBg }]}>
              <Ionicons name="mail-outline" size={18} color={colors.rating} />
            </View>
            <View style={styles.supportTextCol}>
              <Text style={styles.supportTitle}>Email Bitezy Team</Text>
              <Text style={styles.supportSub}>For refunds, partnerships & general queries</Text>
            </View>
            <View style={styles.supportChevronBox}>
              <Ionicons name="chevron-forward" size={14} color={colors.rating} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Modular Logout Button */}
        <LogoutButton onPress={logout} label="Log Out Account" />

        {/* Modular Brand Footer */}
        <BrandFooter />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: 140 },
  bottomSpacer: { height: 60 },

  /* Hero */
  headerCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.shadowStrong,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: colors.primaryGlow,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  headerEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    borderWidth: 3,
    borderColor: colors.white,
  },
  avatarText: { fontFamily: fonts.headingExtraBold, fontSize: 28, color: colors.primary },
  userName: {
    fontFamily: fonts.headingBold,
    fontSize: 20,
    color: colors.textDark,
    marginTop: 2,
  },
  userEmail: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textGray,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1,
    borderColor: colors.primaryGlow,
  },
  roleTagText: { fontFamily: fonts.bold, fontSize: 11, color: colors.primary },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
    borderWidth: 1,
    borderColor: colors.successLight,
  },
  verifiedTagText: { fontFamily: fonts.bold, fontSize: 11, color: colors.success },

  /* Stats */
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  statsHeader: {
    marginBottom: spacing.md,
  },
  statsEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statsTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 14,
    color: colors.textDark,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: spacing.borderRadiusMd,
    paddingVertical: spacing.md,
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
  statIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontFamily: fonts.headingBold,
    fontSize: 18,
    color: colors.textDark,
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.textGray,
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  /* Cards */
  card: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 15,
    color: colors.textDark,
    marginTop: 2,
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusFull,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryGlow,
  },
  editPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  editBtnText: { fontFamily: fonts.bold, fontSize: 12, color: colors.primary },
  editBtnTextActive: { color: colors.white },

  /* Forms */
  formContainer: { marginTop: spacing.xs },
  formSectionEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.textGray,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  formDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  saveBtn: { marginTop: spacing.md },

  /* Support */
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  supportRowLast: { borderBottomWidth: 0 },
  supportIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  supportTextCol: { flex: 1, marginRight: spacing.xs },
  supportTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 13,
    color: colors.textDark,
  },
  supportSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textGray,
    marginTop: 2,
  },
  supportChevronBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomerProfileScreen;
