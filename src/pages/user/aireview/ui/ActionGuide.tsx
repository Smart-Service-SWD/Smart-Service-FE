import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

export const ActionGuide: React.FC = () => {
  return (
    <View style={styles.actionGuide}>
      <Text style={styles.actionGuideTitle}>Bước tiếp theo</Text>
      <View style={styles.guideItem}>
        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
        <Text style={styles.guideText}>
          <Text style={{ fontWeight: '600' }}>Chấp nhận</Text> - đồng ý với kết quả AI, yêu cầu
          chuyển sang đợi nhân viên duyệt
        </Text>
      </View>
      <View style={styles.guideItem}>
        <Ionicons name="refresh-circle" size={18} color="#3B82F6" />
        <Text style={styles.guideText}>
          <Text style={{ fontWeight: '600' }}>Đánh giá lại</Text> - nếu bạn chưa hài lòng về
          nhận xét, yêu cầu AI phân tích lại
        </Text>
      </View>
      <View style={styles.guideItem}>
        <Ionicons name="people" size={18} color="#F59E0B" />
        <Text style={styles.guideText}>
          <Text style={{ fontWeight: '600' }}>Gửi staff xem xét</Text> - nếu bạn muốn nhân viên
          đánh giá thủ công (ví dụ giá quá cao)
        </Text>
      </View>
    </View>
  );
};
