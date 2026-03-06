import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles';

interface SummaryStatsCardProps {
  loading: boolean;
  summary: any;
}

const SummaryRow: React.FC<{
  label: string;
  value: string | number;
  highlightColor?: string;
}> = ({ label, value, highlightColor }) => {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, highlightColor ? { color: highlightColor } : null]}>
        {value}
      </Text>
    </View>
  );
};

export const SummaryStatsCard: React.FC<SummaryStatsCardProps> = ({ loading, summary }) => {
  const fallback = '...';

  return (
    <View style={styles.summaryCard}>
      <SummaryRow label="Tổng người dùng:" value={loading ? fallback : (summary?.totalUsers ?? '-')} />
      <SummaryRow label="Nhân viên:" value={loading ? fallback : (summary?.totalStaff ?? '-')} />
      <SummaryRow label="Thợ:" value={loading ? fallback : (summary?.totalAgents ?? '-')} />
      <SummaryRow label="Tổng dịch vụ:" value={loading ? fallback : (summary?.totalServices ?? '-')} />
      <SummaryRow label="Tổng yêu cầu:" value={loading ? fallback : (summary?.totalRequests ?? '-')} />
      <SummaryRow
        label="Yêu cầu hoàn thành:"
        value={loading ? fallback : (summary?.completedRequests ?? '-')}
        highlightColor="#34C759"
      />
      <SummaryRow
        label="Yêu cầu đang chờ:"
        value={loading ? fallback : (summary?.pendingRequests ?? '-')}
        highlightColor="#FF9500"
      />
    </View>
  );
};
