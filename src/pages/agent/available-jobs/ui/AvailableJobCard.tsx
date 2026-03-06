import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { AssignmentWithRequest } from '../../../../shared/api/agentGraphqlService';
import { styles } from '../styles';

interface AvailableJobCardProps {
  item: AssignmentWithRequest;
  onPress: (assignment: AssignmentWithRequest) => void;
}

export const AvailableJobCard: React.FC<AvailableJobCardProps> = ({ item, onPress }) => {
  return (
    <TouchableOpacity style={styles.jobCard} onPress={() => onPress(item)}>
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle} numberOfLines={1}>
          {item.requestDetail?.description || `Yêu cầu #${item.serviceRequestId.slice(0, 8)}`}
        </Text>
        <Text style={styles.status}>{item.requestDetail?.status || 'N/A'}</Text>
      </View>

      <View style={styles.jobMetaRow}>
        <Ionicons name="location-outline" size={14} color="#6B7280" />
        <Text style={styles.jobMetaText} numberOfLines={1}>
          {item.requestDetail?.addressText || 'Chưa có địa chỉ'}
        </Text>
      </View>
      <View style={styles.jobMetaRow}>
        <Ionicons name="cash-outline" size={14} color="#6B7280" />
        <Text style={styles.jobMetaText}>
          {item.estimatedCost
            ? `${Number(item.estimatedCost.amount).toLocaleString('vi-VN')} ${item.estimatedCost.currency}`
            : 'Chưa có chi phí ước tính'}
        </Text>
      </View>
      <View style={styles.jobMetaRow}>
        <Ionicons name="time-outline" size={14} color="#6B7280" />
        <Text style={styles.jobMetaText}>
          {new Date(item.assignedAt).toLocaleString('vi-VN')}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
