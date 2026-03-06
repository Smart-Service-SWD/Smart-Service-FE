import { useState } from 'react';
import { Alert } from 'react-native';
import { authService } from '../../../../shared/api/authService';

export const useForgotPassword = () => {
  const [email, setEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [emailSent, setEmailSent] = useState<boolean>(false);

  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!text) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(text)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const onEmailChange = (text: string) => {
    setEmail(text);
    if (text) {
      validateEmail(text);
    }
  };

  const handleSendReset = async () => {
    if (!validateEmail(email)) {
      return;
    }

    try {
      setLoading(true);
      await authService.forgotPassword(email);

      setEmailSent(true);
      Alert.alert(
        'Success',
        'Password reset instructions have been sent to your email',
        [{ text: 'OK' }]
      );
    } catch {
      Alert.alert('Error', 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetEmailFlow = () => {
    setEmail('');
    setEmailSent(false);
    setEmailError('');
  };

  return {
    email,
    emailError,
    loading,
    emailSent,
    onEmailChange,
    handleSendReset,
    resetEmailFlow,
  };
};
