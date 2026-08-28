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
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import Logo from '../../components/Logo';
import { colors, spacing } from '../../theme/colors';
import DataService from '../../api/DataService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ForgotPasswordScreen = ({ navigation }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & Reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [emailError, setEmailError] = useState('');
  const [resetError, setResetError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setEmailError('Please enter your email address');
      return;
    }
    setEmailError('');
    setLoading(true);
    showToast('Sending reset code...');

    try {
      const response = await DataService.forgotPassword(email.trim());
      showToast(response?.message || 'Reset OTP sent to email');
      setStep(2);
    } catch (err) {
      setEmailError(err.message || 'Failed to send reset code');
      showToast(err.message || 'Failed to send reset code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp.trim() || !newPassword.trim()) {
      setResetError('Please enter both OTP and new password');
      return;
    }
    setResetError('');
    setLoading(true);

    try {
      const response = await DataService.resetPassword(email.trim(), otp.trim(), newPassword);
      if (response && response.token) {
        showToast('Password reset successful! Logging you in...');
        await login(
          {
            id: response._id,
            name: response.name,
            email: response.email,
            role: response.role,
          },
          response.token
        );
      } else {
        showToast(response?.message || 'Password reset successful');
        navigation.navigate('Login');
      }
    } catch (err) {
      setResetError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.contentWrapper}>
          <View style={styles.heroSection}>
            <Logo size="large" showTagline />
          </View>
          
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              {step === 1
                ? 'Enter your account email to receive a password reset OTP code'
                : 'Enter the code sent to your email along with your new password'}
            </Text>
          </View>

          <View style={styles.card}>
            {step === 1 ? (
              <>
                <CustomInput
                  label="Registered Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="e.g. example@cuet.ac.bd"
                  keyboardType="email-address"
                  error={emailError}
                />

                <CustomButton
                  title="Send Reset Code"
                  onPress={handleSendOtp}
                  loading={loading}
                  style={styles.btn}
                />
              </>
            ) : (
              <>
                <CustomInput
                  label="OTP Verification Code"
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="123456"
                  keyboardType="number-pad"
                />

                <CustomInput
                  label="New Password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  error={resetError}
                />

                <CustomButton
                  title="Reset Password & Sign In"
                  onPress={handleResetPassword}
                  loading={loading}
                  style={styles.btn}
                />
              </>
            )}

            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => (step === 2 ? setStep(1) : navigation.navigate('Login'))}
            >
              <Text style={styles.backText}>
                {step === 2 ? '← Back to Email Step' : '← Back to Login'}
              </Text>
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
    maxWidth: 440,
    alignSelf: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerContainer: { alignItems: 'center', marginBottom: spacing.lg },
  title: { fontSize: 24, fontWeight: '800', color: colors.textDark },
  subtitle: { fontSize: 13, color: colors.textGray, marginTop: spacing.xs, textAlign: 'center' },
  card: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusLg,
    padding: spacing.lg,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: { marginTop: spacing.sm },
  backBtn: { alignItems: 'center', marginTop: spacing.md },
  backText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
});

export default ForgotPasswordScreen;
