import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';

interface AIReviewHeaderProps {
  onBack: () => void;
}

export const AIReviewHeader: React.FC<AIReviewHeaderProps> = ({ onBack }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Kết quả phân tích AI</Text>
      <View style={{ width: 40 }} />
    </View>
  );
};
