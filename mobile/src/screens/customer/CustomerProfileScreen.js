import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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
import DataService from '../../api/DataService';

const CustomerProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { currentUser, logout, updateUser } = useAuth();
  const { showToast } = useToast();

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
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Orders Placed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>৳ {stats.totalSpent}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.completedOrders}</Text>
            <Text style={styles.statLabel}>Delivered</Text>
          </View>
        </View>

        {/* Campus Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Campus & Contact Details</Text>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)} activeOpacity={0.7}>
              <Text style={styles.editBtnText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
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

              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
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

        {/* Logout Button */}
        <CustomButton
          title="Log Out of Bitezy"
          onPress={logout}
          variant="danger"
          style={styles.logoutBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headerCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  avatarText: { fontSize: 34, fontWeight: '900', color: colors.primary },
  userName: { fontSize: 22, fontWeight: '800', color: colors.textDark },
  userEmail: { fontSize: 13, color: colors.textGray, marginTop: 2 },
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
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadiusFull,
  },
  roleTagText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadiusFull,
  },
  verifiedTagText: { fontSize: 12, fontWeight: '700', color: colors.success },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textGray,
    marginTop: 2,
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
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark },
  editBtnText: { fontSize: 14, fontWeight: '700', color: colors.primary },
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
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.textGray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoValue: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textDark,
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
});

export default CustomerProfileScreen;
