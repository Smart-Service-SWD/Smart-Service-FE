import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useLoginForm } from '../../features/auth/login/model/useLoginForm';
import { styles } from './login/styles';
import { LoginHeader } from './login/ui/LoginHeader';
import { LoginFormCard } from './login/ui/LoginFormCard';

export const LoginScreen: React.FC<{ navigation }> = ({ navigation }) => {
  const {
    loading,
    email,
    password,
    showPassword,
    rememberMe,
    emailError,
    passwordError,
    fadeAnim,
    slideAnim,
    scaleAnim,
    setShowPassword,
    setRememberMe,
    onEmailChange,
    onPasswordChange,
    handleLogin,
  } = useLoginForm();

  return (
    <>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0066CC', '#0099FF', '#FFFFFF']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <LoginHeader
              fadeAnim={fadeAnim}
              slideAnim={slideAnim}
              scaleAnim={scaleAnim}
            />

            <LoginFormCard
              loading={loading}
              email={email}
              password={password}
              showPassword={showPassword}
              rememberMe={rememberMe}
              emailError={emailError}
              passwordError={passwordError}
              fadeAnim={fadeAnim}
              slideAnim={slideAnim}
              scaleAnim={scaleAnim}
              onEmailChange={onEmailChange}
              onPasswordChange={onPasswordChange}
              onTogglePassword={() => setShowPassword(!showPassword)}
              onToggleRememberMe={() => setRememberMe(!rememberMe)}
              onNavigateForgotPassword={() => navigation.navigate('ForgotPassword')}
              onNavigateRegister={() => navigation.navigate('Register')}
              onSubmit={handleLogin}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
};
