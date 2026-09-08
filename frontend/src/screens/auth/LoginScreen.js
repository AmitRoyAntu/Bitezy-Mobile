import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import Logo from '../../components/Logo';
import { colors, spacing } from '../../theme/colors';
import DataService from '../../api/DataService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    let interval = null;
    if (showOtpModal && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, resendTimer]);

  const handleLoginSubmit = async () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      valid = false;
    }
    if (!password.trim()) {
      setPasswordError('Password is required');
      valid = false;
    }

    if (!valid) return;

    setLoading(true);

    try {
      const response = await DataService.login(email.trim(), password);

      if (response && response.token) {
        // Direct or OTP verified login
        await login(response, response.token);
        showToast('Login successful!');
        return;
      }

      // Show OTP verification modal
      setShowOtpModal(true);
      setResendTimer(60);
      setCanResend(false);
      showToast('OTP sent (Use 123456)');
    } catch (err) {
      setPasswordError(err.message || 'Login failed');
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setOtpError('Please enter the 6-digit OTP code');
      return;
    }
    setOtpError('');
    setOtpLoading(true);

    try {
      const response = await DataService.verifyOtp(email.trim(), otp.trim());
      if (response && response.token) {
        setShowOtpModal(false);
        await login(response, response.token);
        showToast('Successfully signed in!');
      } else {
        setOtpError(response?.message || 'Invalid OTP');
      }
    } catch (err) {
      setOtpError(err.message || 'OTP verification failed');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setResendTimer(60);
    setCanResend(false);
    showToast('Resending OTP code...');
    try {
      const response = await DataService.login(email.trim(), password);
      showToast(response?.message || 'OTP resent (Use 123456)');
    } catch (err) {
      showToast(err.message || 'Failed to resend OTP', 'error');
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

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Navigation Mode Switcher */}
            <View style={styles.switcherRow}>
              <TouchableOpacity style={[styles.switcherTab, styles.switcherTabActive]}>
                <Text style={styles.switcherTextActive}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.switcherTab}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.switcherText}>Create Account</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cardHeader}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Enter your credentials to access your account</Text>
            </View>

            {/* Inputs */}
            <CustomInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. example@cuet.ac.bd"
              keyboardType="email-address"
              error={emailError}
            />

            <View style={styles.passwordContainer}>
              <CustomInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                error={passwordError}
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

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotBtnText}>Forgot Password?</Text>
            </TouchableOpacity>

            <CustomButton
              title="Sign In to Bitezy"
              onPress={handleLoginSubmit}
              loading={loading}
              style={styles.submitBtn}
            />
          </View>

          {/* Footer */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New to Bitezy? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signUpText}>Create an Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* OTP Verification Modal */}
      <Modal visible={showOtpModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBadge}>
              <Ionicons name="mail-open-outline" size={32} color={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Verification Required</Text>
            <Text style={styles.modalSubtitle}>
              We sent a 6-digit verification code to {'\n'}
              <Text style={{ fontWeight: '700', color: colors.textDark }}>{email}</Text>
            </Text>

            <View style={styles.hintBadge}>
              <Text style={styles.hintText}>💡 Demo Code: Use 123456</Text>
            </View>

            <CustomInput
              label="Enter 6-Digit Code"
              value={otp}
              onChangeText={setOtp}
              placeholder="123456"
              keyboardType="number-pad"
              error={otpError}
              style={{ textAlign: 'center' }}
            />

            <CustomButton
              title="Verify Code & Sign In"
              onPress={handleVerifyOtp}
              loading={otpLoading}
              style={{ marginBottom: spacing.md }}
            />

            <TouchableOpacity
              style={styles.resendBtn}
              onPress={handleResendOtp}
              disabled={!canResend}
            >
              <Text
                style={[
                  styles.resendText,
                  !canResend && { color: colors.textLight },
                ]}
              >
                {canResend ? 'Resend Verification Code' : `Resend in ${resendTimer}s`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowOtpModal(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    maxWidth: 440,
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
  passwordContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  eyeBtn: {
    position: 'absolute',
    right: spacing.md,
    top: 36,
    padding: 4,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  forgotBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    color: colors.textGray,
    fontSize: 14,
  },
  signUpText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  modalIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textDark,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textGray,
    textAlign: 'center',
    marginVertical: spacing.sm,
    lineHeight: 18,
  },
  hintBadge: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadiusFull,
    marginBottom: spacing.md,
  },
  hintText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '700',
  },
  resendBtn: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  resendText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  cancelText: {
    color: colors.textGray,
    fontSize: 13,
    fontWeight: '500',
  },
});

export default LoginScreen;
