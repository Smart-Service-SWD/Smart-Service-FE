import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useAgentDashboard } from '../../features/agent/dashboard/model/useAgentDashboard';
import { styles } from './dashboard/styles';
import { AgentStatCard } from './dashboard/ui/AgentStatCard';
import { RecentAssignmentsSection } from './dashboard/ui/RecentAssignmentsSection';
import { QuickActionsSection } from './dashboard/ui/QuickActionsSection';

export const AgentDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    user,
    loading,
    refreshing,
    stats,
    recentAssignments,
    onRefresh,
    handleLogout,
  } = useAgentDashboard();

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#34C759" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Xin chào, {user?.fullName || 'Agent'}!</Text>
        <Text style={styles.subTitle}>Bảng điều khiển công việc</Text>
      </View>

      <View style={styles.statsGrid}>
        <AgentStatCard
          icon="notifications-outline"
          title="Đơn chờ nhận"
          value={stats.pendingAssignments}
          color="#FF9500"
        />
        <AgentStatCard
          icon="construct-outline"
          title="Đang xử lý"
          value={stats.activeJobs}
          color="#007AFF"
        />
      </View>
      <View style={styles.statsGrid}>
        <AgentStatCard
          icon="checkmark-done-outline"
          title="Hoàn thành hôm nay"
          value={stats.completedToday}
          color="#34C759"
        />
        <AgentStatCard
          icon="cash-outline"
          title="Doanh thu"
          value={`${stats.earnings.toLocaleString('vi-VN')}đ`}
          color="#5856D6"
        />
      </View>

      <RecentAssignmentsSection
        recentAssignments={recentAssignments}
        onOpenAssignment={assignment => navigation.navigate('JobTabs', { job: assignment })}
      />

      <QuickActionsSection
        onOpenAssignments={() => navigation.navigate('AvailableJobs')}
        onLogout={handleLogout}
      />
    </ScrollView>
  );
};

export default AgentDashboardScreen;
