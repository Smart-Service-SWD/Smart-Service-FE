import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { agentGraphqlService, AssignmentWithRequest } from '../../services/agentGraphqlService';

export const AgentDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    pendingAssignments: 0,
    activeJobs: 0,
    completedToday: 0,
    earnings: 0,
  });
  const [recentAssignments, setRecentAssignments] = useState<AssignmentWithRequest[]>([]);

  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [statData, assignments] = await Promise.all([
        agentGraphqlService.getAgentStats(user.id),
        agentGraphqlService.getAssignmentsWithRequestDetail(user.id),
      ]);
      setStats(statData);
      setRecentAssignments(assignments.slice(0, 3));
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message ?? 'Không tải được dữ liệu agent');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => logout() },
    ]);
  };

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
        <StatCard icon="notifications-outline" title="Đơn chờ nhận" value={stats.pendingAssignments} color="#FF9500" />
        <StatCard icon="construct-outline" title="Đang xử lý" value={stats.activeJobs} color="#007AFF" />
      </View>
      <View style={styles.statsGrid}>
        <StatCard icon="checkmark-done-outline" title="Hoàn thành hôm nay" value={stats.completedToday} color="#34C759" />
        <StatCard icon="cash-outline" title="Doanh thu" value={`${stats.earnings.toLocaleString('vi-VN')}đ`} color="#5856D6" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Công việc gần đây</Text>
        {recentAssignments.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có assignment nào.</Text>
        ) : (
          recentAssignments.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.assignmentItem}
              onPress={() => navigation.navigate('JobTabs', { job: item })}
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('AvailableJobs')}>
          <Ionicons name="briefcase-outline" size={22} color="#34C759" />
          <Text style={styles.actionText}>Danh sách assignment của tôi</Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
          <Text style={[styles.actionText, { color: '#FF3B30' }]}>Đăng xuất</Text>
          <Ionicons name="chevron-forward" size={18} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const StatCard = ({
  icon,
  title,
  value,
  color,
}: {
  icon: any;
  title: string;
  value: number | string;
  color: string;
}) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Ionicons name={icon} size={24} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#eee' },
  greeting: { fontSize: 24, fontWeight: '700', color: '#111827' },
  subTitle: { marginTop: 4, color: '#6B7280' },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 10, paddingTop: 12, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderLeftWidth: 4, padding: 14 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#111827', marginTop: 8 },
  statTitle: { marginTop: 4, color: '#6B7280', fontSize: 12 },
  section: { backgroundColor: '#fff', marginTop: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  emptyText: { color: '#9CA3AF', fontSize: 13, paddingVertical: 4 },
  assignmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  assignmentTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  assignmentMeta: { marginTop: 3, fontSize: 12, color: '#6B7280' },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionText: { flex: 1, marginLeft: 10, fontSize: 15, color: '#111827' },
  logoutButton: { borderBottomWidth: 0, marginTop: 4, backgroundColor: '#FFF5F5', borderRadius: 10, paddingHorizontal: 10 },
});

export default AgentDashboardScreen;
