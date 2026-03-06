import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from '../styles';

interface ForgotPasswordSuccessViewProps {
  email: string;
  onResetEmail: () => void;
  onBackToLogin: () => void;
}

export const ForgotPasswordSuccessView: React.FC<ForgotPasswordSuccessViewProps> = ({
  email,
  onResetEmail,
  onBackToLogin,
}) => {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.successContainer}>
            <MaterialCommunityIcons
              name="check-circle"
              size={80}
              color="#34C759"
            />
          </View>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We&apos;ve sent password reset instructions to {email}
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.instructionText}>
            Follow the link in the email to reset your password. If you don&apos;t see the email, check your spam folder.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={onResetEmail}
          >
            <Text style={styles.buttonText}>Reset Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={onBackToLogin}
          >
            <Text style={styles.linkText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
