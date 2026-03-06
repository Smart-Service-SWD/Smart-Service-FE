import { useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../../../app/providers/auth/AuthContext';

interface RegisterFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

const INITIAL_FORM: RegisterFormData = {
  fullName: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
};

export const useRegisterForm = () => {
  const { register, loading } = useAuth();
  const [formData, setFormData] = useState<RegisterFormData>(INITIAL_FORM);

  const updateFormData = (field: keyof RegisterFormData, value: string) => {
    setFormData(previous => ({ ...previous, [field]: value }));
  };

  const handleRegister = async () => {
    const { fullName, email, phoneNumber, password, confirmPassword } = formData;

    if (!fullName || !email || !phoneNumber || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    const result = await register({
      fullName,
      email,
      password,
      phoneNumber,
    });

    if (!result.success) {
      Alert.alert('Registration Failed', result.error);
    }
  };

  return {
    loading,
    formData,
    updateFormData,
    handleRegister,
  };
};
