import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { AssignmentWithRequest } from '../../../../shared/api/agentGraphqlService';
import { styles } from '../styles';

interface RecentAssignmentsSectionProps {
  recentAssignments: AssignmentWithRequest[];
  onOpenAssignment: (assignment: AssignmentWithRequest) => void;
}

export const RecentAssignmentsSection: React.FC<RecentAssignmentsSectionProps> = ({
  recentAssignments,
  onOpenAssignment,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Công việc gần đây</Text>
      {recentAssignments.length === 0 ? (
        <Text style={styles.emptyText}>Chưa có assignment nào.</Text>
      ) : (
        recentAssignments.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.assignmentItem}
            onPress={() => onOpenAssignment(item)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.assignmentTitle} numberOfLines={1}>
                {item.requestDetail?.description || `Yêu cầu #${item.serviceRequestId.slice(0, 8)}`}
              </Text>
              <Text style={styles.assignmentMeta}>
                {item.requestDetail?.status || 'N/A'} • {new Date(item.assignedAt).toLocaleDateString('vi-VN')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ))
      )}
    </View>
  );
};
