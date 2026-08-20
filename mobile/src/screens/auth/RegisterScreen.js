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
import { colors, spacing } from '../../theme/colors';
import { CUET_HALLS, CUET_DEPARTMENTS } from '../../data/cuetOptions';
import DataService from '../../api/DataService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const RegisterScreen = ({ navigation }) => {
  const [role, setRole] = useState('buyer'); // 'buyer' | 'seller'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      password,
      role,
      residence: fullResidence,
      department: department || 'Computer Science & Engineering (CSE)',
      ...(role === 'buyer'
        ? { cuetId: dynamicValue.trim() || '2204000', buyerType: 'Student' }
        : { vendorName: dynamicValue.trim() }),
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

            <CustomInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Amit Roy"
              error={errors.name}
            />

            <CustomInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. example@cuet.ac.bd"
              keyboardType="email-address"
              error={errors.email}
            />

            <View style={styles.passwordContainer}>
              <CustomInput
                label="Create Password"
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

            {/* Dropdown 1: Campus Hall / Residence */}
            <CustomSelect
              label="Campus Hall / Residence"
              value={residence}
              options={CUET_HALLS}
              onSelect={setResidence}
              placeholder="Select residential hall..."
              error={errors.residence}
              style={{ marginTop: spacing.sm }}
            />

            <CustomInput
              label="Room Number / Flat (Optional)"
              value={roomNumber}
              onChangeText={setRoomNumber}
              placeholder="e.g. Room 302 / Extension 4"
            />

            {/* Dropdown 2: Department (for student/buyer) */}
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
                label="Student ID (Optional)"
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
    fontWeight: '600',
    color: colors.textGray,
  },
  switcherTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  cardHeader: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textDark,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textGray,
    marginTop: 4,
  },
  roleGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  roleCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    position: 'relative',
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  roleIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  roleIconBadgeActive: {
    backgroundColor: colors.white,
  },
  roleCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textDark,
  },
  roleCardTitleActive: {
    color: colors.primary,
  },
  roleCardDesc: {
    fontSize: 11,
    color: colors.textGray,
    marginTop: 2,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: spacing.md,
    top: 36,
    padding: 4,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: spacing.lg,
  },
  footerText: {
    color: colors.textGray,
    fontSize: 14,
  },
  signInText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default RegisterScreen;
