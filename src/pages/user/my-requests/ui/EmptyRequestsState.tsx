import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';

interface EmptyRequestsStateProps {
  hasFilter: boolean;
  onCreateRequest: () => void;
}

export const EmptyRequestsState: React.FC<EmptyRequestsStateProps> = ({
  hasFilter,
  onCreateRequest,
}) => {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="clipboard-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Chưa có yêu cầu nào</Text>
      <Text style={styles.emptySubtitle}>
        {hasFilter
          ? 'Không có yêu cầu nào ở trạng thái này.'
          : 'Tạo yêu cầu dịch vụ đầu tiên của bạn!'}
      </Text>
      {!hasFilter ? (
        <TouchableOpacity style={styles.createBtn} onPress={onCreateRequest}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.createBtnText}>Tạo yêu cầu mới</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};
