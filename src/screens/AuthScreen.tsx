import React, { useState } from 'react';
import {
  View, StyleSheet, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard, ScrollView,
} from 'react-native';
import {
  Text, TextInput, Button, Snackbar, useTheme, Divider,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as AppleAuthentication from 'expo-apple-authentication';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const AuthScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple, verifySignUpOtp, sendPasswordReset, verifyResetOtp, updatePassword } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState<'login' | 'register' | 'verify' | 'forgot' | 'reset-verify' | 'new-password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setSnackbar(t.auth.emailPasswordRequired);
      return;
    }
    if (mode === 'register' && password !== confirmPassword) {
      setSnackbar(t.auth.passwordsDoNotMatch);
      return;
    }
    setLoading(true);
    const error = mode === 'login'
      ? await signInWithEmail(email.trim(), password)
      : await signUpWithEmail(email.trim(), password);
    setLoading(false);
    if (error) {
      setSnackbar(error);
    } else if (mode === 'register') {
      setPendingEmail(email.trim());
      setOtp('');
      setMode('verify');
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 8) return;
    setVerifyLoading(true);
    const error = await verifySignUpOtp(pendingEmail, otp);
    setVerifyLoading(false);
    if (error) setSnackbar(error);
    // On success: onAuthStateChange fires → app navigates away automatically
  };

  const handleResendOtp = async () => {
    const error = await signUpWithEmail(pendingEmail, password);
    if (!error) setSnackbar(t.auth.codeResentTo(pendingEmail));
    else setSnackbar(error);
  };

  const handleForgotSubmit = async () => {
    if (!email.trim()) { setSnackbar(t.auth.emailRequired); return; }
    setResetLoading(true);
    const error = await sendPasswordReset(email.trim());
    setResetLoading(false);
    if (error) setSnackbar(error);
    else { setPendingEmail(email.trim()); setOtp(''); setMode('reset-verify'); }
  };

  const handleResetVerify = async () => {
    if (otp.length !== 8) return;
    setVerifyLoading(true);
    const error = await verifyResetOtp(pendingEmail, otp);
    setVerifyLoading(false);
    if (error) setSnackbar(error);
    else { setNewPassword(''); setConfirmNewPassword(''); setMode('new-password'); }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword.trim()) { setSnackbar(t.auth.newPasswordRequired); return; }
    if (newPassword !== confirmNewPassword) { setSnackbar(t.auth.passwordsDoNotMatch); return; }
    setResetLoading(true);
    const error = await updatePassword(newPassword);
    setResetLoading(false);
    if (error) setSnackbar(error);
    // On success: onAuthStateChange fires → app navigates away automatically
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const error = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) setSnackbar(error);
  };

  const handleApple = async () => {
    const error = await signInWithApple();
    if (error) setSnackbar(error);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Text variant="displaySmall" style={styles.logo}>EasyWord</Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            {t.auth.tagline}
          </Text>

          {mode === 'forgot' ? (
            /* ── Forgot password ────────────────────────────────────────── */
            <>
              <Text variant="headlineSmall" style={[styles.logo, { fontSize: 22, marginBottom: 8 }]}>
                {t.auth.resetPassword}
              </Text>
              <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                {t.auth.resetPasswordSubtitle}
              </Text>
              <TextInput
                label={t.auth.email}
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
                style={styles.input}
              />
              <Button
                mode="contained"
                onPress={handleForgotSubmit}
                loading={resetLoading}
                disabled={resetLoading}
                style={styles.primaryBtn}
              >
                {t.auth.sendResetCode}
              </Button>
              <Button mode="text" onPress={() => setMode('login')}>
                {t.auth.backToSignIn}
              </Button>
            </>
          ) : mode === 'reset-verify' ? (
            /* ── Reset OTP verification ─────────────────────────────────── */
            <>
              <Text variant="headlineSmall" style={[styles.logo, { fontSize: 22, marginBottom: 8 }]}>
                {t.auth.checkEmail}
              </Text>
              <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                {t.auth.resetCodeSentTo(pendingEmail)}
              </Text>
              <TextInput
                label={t.auth.resetCode}
                value={otp}
                onChangeText={setOtp}
                mode="outlined"
                keyboardType="number-pad"
                maxLength={8}
                autoFocus
                style={styles.input}
              />
              <Button
                mode="contained"
                onPress={handleResetVerify}
                loading={verifyLoading}
                disabled={otp.length !== 8 || verifyLoading}
                style={styles.primaryBtn}
              >
                {t.auth.verify}
              </Button>
              <Button mode="text" onPress={() => sendPasswordReset(pendingEmail).then(e => { if (!e) setSnackbar(t.auth.codeResentTo(pendingEmail)); })} style={{ marginBottom: 4 }}>
                {t.auth.resendCode}
              </Button>
              <Button mode="text" onPress={() => setMode('forgot')}>
                {t.auth.back}
              </Button>
            </>
          ) : mode === 'new-password' ? (
            /* ── Set new password ───────────────────────────────────────── */
            <>
              <Text variant="headlineSmall" style={[styles.logo, { fontSize: 22, marginBottom: 8 }]}>
                {t.auth.setNewPassword}
              </Text>
              <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                {t.auth.setNewPasswordSubtitle}
              </Text>
              <TextInput
                label={t.auth.newPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
              />
              <TextInput
                label={t.auth.confirmNewPassword}
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
              />
              <Button
                mode="contained"
                onPress={handleUpdatePassword}
                loading={resetLoading}
                disabled={resetLoading}
                style={styles.primaryBtn}
              >
                {t.auth.updatePassword}
              </Button>
            </>
          ) : mode === 'verify' ? (
            /* ── OTP verification step ──────────────────────────────────── */
            <>
              <Text variant="headlineSmall" style={[styles.logo, { fontSize: 22, marginBottom: 8 }]}>
                {t.auth.checkEmail}
              </Text>
              <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                {t.auth.verificationCodeSentTo(pendingEmail)}
              </Text>
              <TextInput
                label={t.auth.verificationCode}
                value={otp}
                onChangeText={setOtp}
                mode="outlined"
                keyboardType="number-pad"
                maxLength={8}
                autoFocus
                style={styles.input}
              />
              <Button
                mode="contained"
                onPress={handleVerifyOtp}
                loading={verifyLoading}
                disabled={otp.length !== 8 || verifyLoading}
                style={styles.primaryBtn}
              >
                {t.auth.verify}
              </Button>
              <Button mode="text" onPress={handleResendOtp} style={{ marginBottom: 4 }}>
                {t.auth.resendCode}
              </Button>
              <Button mode="text" onPress={() => setMode('register')}>
                {t.auth.back}
              </Button>
            </>
          ) : (
            /* ── Login / Register form ──────────────────────────────────── */
            <>
              {/* Mode toggle */}
              <View style={styles.toggleRow}>
                <Button
                  mode={mode === 'login' ? 'contained' : 'outlined'}
                  onPress={() => setMode('login')}
                  style={styles.toggleBtn}
                  labelStyle={styles.toggleLabel}
                >
                  {t.auth.signIn}
                </Button>
                <Button
                  mode={mode === 'register' ? 'contained' : 'outlined'}
                  onPress={() => setMode('register')}
                  style={styles.toggleBtn}
                  labelStyle={styles.toggleLabel}
                >
                  {t.auth.register}
                </Button>
              </View>

              {/* Email / password fields */}
              <TextInput
                label={t.auth.email}
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
              <TextInput
                label={t.auth.password}
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={secureText}
                right={
                  <TextInput.Icon
                    icon={secureText ? 'eye-off' : 'eye'}
                    onPress={() => setSecureText(v => !v)}
                  />
                }
                style={styles.input}
              />
              {mode === 'register' && (
                <TextInput
                  label={t.auth.confirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  mode="outlined"
                  secureTextEntry={secureText}
                  style={styles.input}
                />
              )}

              <Button
                mode="contained"
                onPress={handleEmailAuth}
                loading={loading}
                disabled={loading}
                style={styles.primaryBtn}
              >
                {mode === 'login' ? t.auth.signIn : t.auth.createAccount}
              </Button>

              {mode === 'login' && (
                <Button mode="text" onPress={() => { setEmail(''); setMode('forgot'); }} style={{ marginTop: -16, marginBottom: 8 }}>
                  {t.auth.forgotPassword}
                </Button>
              )}

              {/* Divider */}
              <View style={styles.dividerRow}>
                <Divider style={styles.divider} />
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginHorizontal: 12 }}>
                  {t.auth.or}
                </Text>
                <Divider style={styles.divider} />
              </View>

              {/* Google */}
              <Button
                mode="outlined"
                onPress={handleGoogle}
                loading={googleLoading}
                disabled={googleLoading}
                icon={() => <Icon name="google" size={18} color="#EA4335" />}
                style={styles.socialBtn}
              >
                {t.auth.continueWithGoogle}
              </Button>

              {/* Apple — iOS only */}
              {Platform.OS === 'ios' && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={8}
                  style={styles.appleBtn}
                  onPress={handleApple}
                />
              )}
            </>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={3500}>
        {snackbar}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  logo: { fontWeight: 'bold', color: '#1C1700', marginBottom: 8 },
  subtitle: { marginBottom: 36 },
  toggleRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  toggleBtn: { flex: 1 },
  toggleLabel: { fontSize: 14 },
  input: { marginBottom: 12 },
  primaryBtn: { marginTop: 4, marginBottom: 24, paddingVertical: 4 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  divider: { flex: 1, height: 1 },
  socialBtn: { marginBottom: 12 },
  appleBtn: { height: 48, marginBottom: 12 },
});

export default AuthScreen;
