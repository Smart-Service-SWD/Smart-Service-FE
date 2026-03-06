import React from 'react';
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAdminDashboard } from '../../features/admin/dashboard/model/useAdminDashboard';
import { styles } from './admin-dashboard/styles';
import { StatCard } from './admin-dashboard/ui/StatCard';
import { QuickActionCard } from './admin-dashboard/ui/QuickActionCard';
import { ActivityLogsCard } from './admin-dashboard/ui/ActivityLogsCard';

export const AdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    user,
    refreshing,
    loading,
    stats,
    activityLogs,
    onRefresh,
    normalizeAmount,
    formatCurrency,
    formatActivityTime,
  } = useAdminDashboard();

  const statsPrimary = [
    {
      title: 'Tổng người dùng',
      value: stats.totalUsers.toLocaleString(),
      icon: 'people-outline',
      color: '#007AFF',
      onPress: () => navigation.navigate('UserManagement' as never),
    },
    {
      title: 'Nhân viên',
      value: stats.totalStaff,
      icon: 'briefcase-outline',
      color: '#34C759',
      onPress: () => navigation.navigate('StaffManagement' as never),
    },
    {
      title: 'Thợ',
      value: stats.totalAgents,
      icon: 'hammer-outline',
      color: '#FF9500',
      onPress: () => navigation.navigate('AgentManagement' as never),
    },
    {
      title: 'Dịch vụ',
      value: stats.totalServices,
      icon: 'construct-outline',
      color: '#8E8E93',
      onPress: () => navigation.navigate('ServiceManagement' as never),
    },
  ];

  const statsSecondary = [
    {
      title: 'Chờ duyệt',
      value: stats.pendingRequests,
      icon: 'time-outline',
      color: '#FF3B30',
      onPress: () => (navigation as any).navigate('RequestManagement', { tab: 'pending' }),
    },
    {
      title: 'Đã hoàn thành',
      value: stats.completedRequests.toLocaleString(),
      icon: 'checkmark-circle-outline',
      color: '#34C759',
      onPress: () => (navigation as any).navigate('RequestManagement', { tab: 'completed' }),
    },
    {
      title: 'Doanh thu hôm nay',
      value: formatCurrency(normalizeAmount(stats.todayRevenue)),
      icon: 'trending-up-outline',
      color: '#007AFF',
      onPress: () => navigation.navigate('Reports' as never),
    },
    {
      title: 'Doanh thu tháng',
      value: formatCurrency(normalizeAmount(stats.monthlyRevenue)),
      icon: 'bar-chart-outline',
      color: '#32D74B',
      onPress: () => navigation.navigate('Reports' as never),
    },
  ];

  const quickActions = [
    {
      title: 'Quản lý nhân viên',
      icon: 'people',
      color: '#34C759',
      onPress: () => navigation.navigate('StaffManagement' as never),
    },
    {
      title: 'Quản lý thợ',
      icon: 'hammer',
      color: '#FF9500',
      onPress: () => navigation.navigate('AgentManagement' as never),
    },
    {
      title: 'Quản lý dịch vụ',
      icon: 'construct',
      color: '#8E8E93',
      onPress: () => navigation.navigate('ServiceManagement' as never),
    },
    {
      title: 'Báo cáo',
      icon: 'analytics',
      color: '#007AFF',
      onPress: () => navigation.navigate('Reports' as never),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Chào mừng trở lại!</Text>
            <Text style={styles.userName}>{user?.fullName}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thống kê tổng quan</Text>

          <View style={styles.statsGrid}>
            {statsPrimary.map(item => (
              <StatCard key={item.title} {...item} />
            ))}
          </View>

          <View style={styles.statsGrid}>
            {statsSecondary.map(item => (
              <StatCard key={item.title} {...item} />
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>

          <View style={styles.actionsGrid}>
            {quickActions.map(item => (
              <QuickActionCard key={item.title} {...item} />
            ))}
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>

          <ActivityLogsCard
            loading={loading}
            activityLogs={activityLogs}
            formatActivityTime={formatActivityTime}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

