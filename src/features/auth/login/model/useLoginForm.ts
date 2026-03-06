import { useEffect, useRef, useState } from 'react';
import { Alert, Animated } from 'react-native';
import { useAuth } from '../../../../app/providers/auth/AuthContext';

export const useLoginForm = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, slideAnim]);

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

  const validatePassword = (text: string) => {
    if (!text) {
      setPasswordError('Password is required');
      return false;
    }
    if (text.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const onEmailChange = (text: string) => {
    setEmail(text);
    if (text) {
      validateEmail(text);
    }
  };

  const onPasswordChange = (text: string) => {
    setPassword(text);
    if (text) {
      validatePassword(text);
    }
  };

  const handleLogin = async () => {
    const emailValid = validateEmail(email);
    const passwordValid = validatePassword(password);

    if (!emailValid || !passwordValid) {
      return;
    }

    const result = await login(email, password);

    if (!result.success) {
      Alert.alert('Login Failed', result.error || 'Please check your credentials and try again');
    }
  };

  return {
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
  };
};
