import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';

interface CompletedFeedbackButtonProps {
  onPress: () => void;
}

export const CompletedFeedbackButton: React.FC<CompletedFeedbackButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.feedbackBtn} onPress={onPress}>
      <Ionicons name="star" size={20} color="#fff" />
      <Text style={styles.feedbackBtnText}>Đánh giá dịch vụ</Text>
    </TouchableOpacity>
  );
};
