import React from 'react';
import { useForgotPassword } from '../../features/auth/forgot-password/model/useForgotPassword';
import { ForgotPasswordSuccessView } from './forgot-password/ui/ForgotPasswordSuccessView';
import { ForgotPasswordFormView } from './forgot-password/ui/ForgotPasswordFormView';

export const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    email,
    emailError,
    loading,
    emailSent,
    onEmailChange,
    handleSendReset,
    resetEmailFlow,
  } = useForgotPassword();

  if (emailSent) {
    return (
      <ForgotPasswordSuccessView
        email={email}
        onResetEmail={resetEmailFlow}
        onBackToLogin={() => navigation.navigate('ProfileLogin')}
      />
    );
  }

  return (
    <ForgotPasswordFormView
      navigation={navigation}
      email={email}
      emailError={emailError}
      loading={loading}
      onEmailChange={onEmailChange}
      onSubmit={handleSendReset}
    />
  );
};
