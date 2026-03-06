import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityLog } from '../../../../shared/api/adminGraphqlService';
import { styles } from '../styles';

interface ActivityLogsCardProps {
  loading: boolean;
  activityLogs: ActivityLog[];
  formatActivityTime: (iso: string) => string;
}

export const ActivityLogsCard: React.FC<ActivityLogsCardProps> = ({
  loading,
  activityLogs,
  formatActivityTime,
}) => {
  return (
    <View style={styles.activityCard}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Đang tải hoạt động...</Text>
        </View>
      ) : activityLogs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chưa có hoạt động gần đây</Text>
        </View>
      ) : (
        activityLogs.map((log, index) => (
          <View
            key={log.id}
            style={[
              styles.activityItem,
              index === activityLogs.length - 1 && styles.activityItemLast,
            ]}
          >
            <View style={styles.activityIcon}>
              <Ionicons name="time-outline" size={20} color="#007AFF" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{log.action}</Text>
              <Text style={styles.activityTime}>{formatActivityTime(log.createdAt)}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
};
