import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';

interface JobDetailErrorStateProps {
  errorMessage: string;
  onRetry: () => Promise<void>;
}

export const JobDetailErrorState: React.FC<JobDetailErrorStateProps> = ({
  errorMessage,
  onRetry,
}) => {
  return (
    <View style={[styles.container, styles.fullCenter]}>
      <Text style={styles.errorText}>{errorMessage}</Text>
      <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
        <Text style={styles.retryButtonText}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  );
};
