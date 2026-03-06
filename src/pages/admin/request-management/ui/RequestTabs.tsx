import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { RequestTabType } from '../../../../features/admin/request-management/model/constants';
import { styles } from '../styles';

interface RequestTabsProps {
  activeTab: RequestTabType;
  pendingCount: number;
  completedCount: number;
  onChangeTab: (tab: RequestTabType) => void;
}

export const RequestTabs: React.FC<RequestTabsProps> = ({
  activeTab,
  pendingCount,
  completedCount,
  onChangeTab,
}) => {
  return (
    <View style={styles.tabRow}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'pending' && styles.tabButtonActive]}
        onPress={() => onChangeTab('pending')}
      >
        <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
          Chờ xử lý {pendingCount > 0 ? `(${pendingCount})` : ''}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'completed' && styles.tabButtonActive]}
        onPress={() => onChangeTab('completed')}
      >
        <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
          Đã hoàn thành {completedCount > 0 ? `(${completedCount})` : ''}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
