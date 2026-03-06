import React from 'react';
import { useRegisterForm } from '../../features/auth/register/model/useRegisterForm';
import { RegisterFormView } from './register/ui/RegisterFormView';

export const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    loading,
    formData,
    updateFormData,
    handleRegister,
  } = useRegisterForm();

  return (
    <RegisterFormView
      navigation={navigation}
      loading={loading}
      formData={formData}
      onChangeField={updateFormData}
      onSubmit={handleRegister}
    />
  );
};
