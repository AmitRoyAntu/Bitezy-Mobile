import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomInput from '../../components/CustomInput';
import CustomSelect from '../../components/CustomSelect';
import CustomButton from '../../components/CustomButton';
import Logo from '../../components/Logo';
import { colors, fonts, spacing } from '../../theme/colors';
import { CUET_HALLS, CUET_DEPARTMENTS } from '../../data/cuetOptions';
import DataService from '../../api/DataService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const BUYER_TYPES = [
  { label: 'Student', value: 'Student' },
  { label: 'Teacher', value: 'Teacher' },
  { label: 'Staff', value: 'Staff' },
];

const RegisterScreen = ({ navigation }) => {
  const [role, setRole] = useState('buyer'); // 'buyer' | 'seller'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [buyerType, setBuyerType] = useState('Student');
  const [residence, setResidence] = useState('');
  const [department, setDepartment] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [dynamicValue, setDynamicValue] = useState('');

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();

  const handleRegister = async () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Full name is required';
    if (!email.trim()) errs.email = 'Email address is required';
    if (!password.trim()) errs.password = 'Password is required';
    if (confirmPassword.trim() && confirmPassword !== password) {
      errs.confirmPassword = 'Passwords do not match';
    }
    if (!residence) errs.residence = 'Please select your Campus Hall / Residence';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    const fullResidence = roomNumber.trim() ? `${residence}, Room ${roomNumber.trim()}` : residence;

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || '01800000000',
      password,
      role,
      residence: fullResidence,
      department: department || 'Computer Science & Engineering (CSE)',
      ...(role === 'buyer'
        ? { cuetId: dynamicValue.trim() || '2204000', buyerType }
        : { vendorName: dynamicValue.trim() || `${name.trim()}'s Canteen` }),
    };

    try {
      const response = await DataService.request('/auth/register', 'POST', payload);
      showToast('Account created successfully!');

      if (response && response.token) {
        await login(
          {
            ...payload,
            id: response._id,
            name: response.name,
            email: response.email,
            role: response.role,
          },
          response.token
        );
      } else {
        navigation.navigate('Login');
      }
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Top Hero Section */}
          <View style={styles.heroSection}>
            <Logo size="large" showTagline />
          </View>

          <View style={styles.formCard}>
            {/* Top Switcher */}
            <View style={styles.switcherRow}>
              <TouchableOpacity
                style={styles.switcherTab}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.switcherText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.switcherTab, styles.switcherTabActive]}>
                <Text style={styles.switcherTextActive}>Create Account</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cardHeader}>
              <Text style={styles.title}>Join Bitezy</Text>
              <Text style={styles.subtitle}>Choose your account type to get started</Text>
            </View>

            {/* Interactive Role Selection Cards */}
            <View style={styles.roleGrid}>
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  role === 'buyer' && styles.roleCardActive,
                ]}
                onPress={() => setRole('buyer')}
                activeOpacity={0.8}
              >
                <View style={[styles.roleIconBadge, role === 'buyer' && styles.roleIconBadgeActive]}>
                  <Ionicons
                    name="school-outline"
                    size={24}
                    color={role === 'buyer' ? colors.primary : colors.textGray}
                  />
                </View>
                <Text style={[styles.roleCardTitle, role === 'buyer' && styles.roleCardTitleActive]}>
                  Student / Buyer
                </Text>
                <Text style={styles.roleCardDesc}>Order meals & snacks to halls</Text>
                {role === 'buyer' && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleCard,
                  role === 'seller' && styles.roleCardActive,
                ]}
                onPress={() => setRole('seller')}
                activeOpacity={0.8}
              >
                <View style={[styles.roleIconBadge, role === 'seller' && styles.roleIconBadgeActive]}>
                  <Ionicons
                    name="storefront-outline"
                    size={24}
                    color={role === 'seller' ? colors.primary : colors.textGray}
                  />
                </View>
                <Text style={[styles.roleCardTitle, role === 'seller' && styles.roleCardTitleActive]}>
                  Canteen Vendor
                </Text>
                <Text style={styles.roleCardDesc}>Manage menu & fulfill orders</Text>
                {role === 'seller' && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Basic Info Section */}
            <Text style={styles.sectionHeading}>Basic Information</Text>

            <CustomInput
              label="Full Name *"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Amit Roy"
              error={errors.name}
            />

            <CustomInput
              label="Email Address *"
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. demo@cuet.ac.bd"
              keyboardType="email-address"
              error={errors.email}
            />

            <CustomInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. 018XXXXXXXX"
              keyboardType="phone-pad"
            />

            <View style={styles.passwordContainer}>
              <CustomInput
                label="Create Password *"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                error={errors.password}
                style={{ marginBottom: 0 }}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword((prev) => !prev)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textGray}
                />
              </TouchableOpacity>
            </View>

            <CustomInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              error={errors.confirmPassword}
              style={{ marginTop: spacing.md }}
            />

            {/* Academic / Campus Details */}
            <Text style={[styles.sectionHeading, { marginTop: spacing.md }]}>
              {role === 'buyer' ? 'Academic & Campus Details' : 'Canteen Details'}
            </Text>

            {role === 'buyer' && (
              <View style={styles.buyerTypeRow}>
                <Text style={styles.buyerTypeLabel}>Account Category:</Text>
                <View style={styles.buyerTypeChips}>
                  {BUYER_TYPES.map((bt) => (
                    <TouchableOpacity
                      key={bt.value}
                      style={[
                        styles.buyerTypeChip,
                        buyerType === bt.value && styles.buyerTypeChipActive,
                      ]}
                      onPress={() => setBuyerType(bt.value)}
                    >
                      <Text
                        style={[
                          styles.buyerTypeChipText,
                          buyerType === bt.value && styles.buyerTypeChipTextActive,
                        ]}
                      >
                        {bt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Dropdown: Campus Hall / Residence */}
            <CustomSelect
              label="Campus Hall / Location *"
              value={residence}
              options={CUET_HALLS}
              onSelect={setResidence}
              placeholder="Select residential hall or campus building..."
              error={errors.residence}
              style={{ marginTop: spacing.sm }}
            />

            <CustomInput
              label="Room / Flat / Desk Number (Optional)"
              value={roomNumber}
              onChangeText={setRoomNumber}
              placeholder="e.g. Room 302 / Extension 4"
            />

            {/* Dropdown: Department (for student/buyer) */}
            {role === 'buyer' && (
              <CustomSelect
                label="Academic Department"
                value={department}
                options={CUET_DEPARTMENTS}
                onSelect={setDepartment}
                placeholder="Select department..."
              />
            )}

            {role === 'buyer' ? (
              <CustomInput
                label="Student / CUET ID (Optional)"
                value={dynamicValue}
                onChangeText={setDynamicValue}
                placeholder="e.g. 2204000"
              />
            ) : (
              <CustomInput
                label="Canteen / Business Name"
                value={dynamicValue}
                onChangeText={setDynamicValue}
                placeholder="e.g. QK Hall Dining"
              />
            )}

            <CustomButton
              title="Create My Account"
              onPress={handleRegister}
              loading={loading}
              style={styles.submitBtn}
            />
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    paddingVertical: spacing.xl,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switcherRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: spacing.borderRadiusMd,
    padding: 4,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switcherTab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderRadius: spacing.borderRadiusSm,
  },
  switcherTabActive: {
    backgroundColor: colors.card,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  switcherText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textGray,
  },
  switcherTextActive: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  cardHeader: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textGray,
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  roleGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  roleCard: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    position: 'relative',
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  roleIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  roleIconBadgeActive: {
    backgroundColor: colors.white,
  },
  roleCardTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 2,
  },
  roleCardTitleActive: {
    color: colors.primary,
  },
  roleCardDesc: {
    fontSize: 10,
    fontFamily: fonts.regular,
    color: colors.textGray,
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  eyeBtn: {
    position: 'absolute',
    right: spacing.md,
    top: 36,
    zIndex: 10,
  },
  buyerTypeRow: {
    marginBottom: spacing.md,
  },
  buyerTypeLabel: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textDark,
    marginBottom: 6,
  },
  buyerTypeChips: {
    flexDirection: 'row',
    gap: spacing.xs + 4,
  },
  buyerTypeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: spacing.borderRadiusSm,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  buyerTypeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  buyerTypeChipText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.textGray,
  },
  buyerTypeChipTextActive: {
    color: colors.white,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textGray,
  },
  signInText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
});

export default RegisterScreen;
