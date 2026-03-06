import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles';

export const AIReviewIntroCard: React.FC = () => {
  return (
    <View style={styles.aiIntro}>
      <View style={styles.aiIconCircle}>
        <Ionicons name="sparkles" size={32} color="#8B5CF6" />
      </View>
      <Text style={styles.aiTitle}>AI đã phân tích xong</Text>
      <Text style={styles.aiSubtitle}>
        Dưới đây là kết quả đánh giá tự động cho yêu cầu dịch vụ của bạn.
      </Text>
    </View>
  );
};
