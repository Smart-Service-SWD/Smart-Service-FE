import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

interface DashboardStats {
  totalUsers: number;
  totalStaff: number;
  totalAgents: number;
  totalServices: number;
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  todayRevenue: number;
  monthlyRevenue: number;
}

export const AdminDashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 1250,
    totalStaff: 45,
    totalAgents: 12,
    totalServices: 28,
    totalRequests: 3420,
    pendingRequests: 85,
    completedRequests: 3335,
    todayRevenue: 2500000,
    monthlyRevenue: 75000000,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    icon: string; 
    color: string;
    onPress?: () => void;
  }> = ({ title, value, icon, color, onPress }) => (
    <TouchableOpacity 
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </TouchableOpacity>
  );

  const QuickAction: React.FC<{ 
    title: string; 
    icon: string; 
    color: string;
    onPress: () => void;
  }> = ({ title, icon, color, onPress }) => (
    <TouchableOpacity 
      style={styles.actionButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
    </TouchableOpacity>
  );

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
            <StatCard
              title="Tổng người dùng"
              value={stats.totalUsers.toLocaleString()}
              icon="people-outline"
              color="#007AFF"
              onPress={() => navigation.navigate('UserManagement' as never)}
            />
            <StatCard
              title="Nhân viên"
              value={stats.totalStaff}
              icon="briefcase-outline"
              color="#34C759"
              onPress={() => navigation.navigate('StaffManagement' as never)}
            />
            <StatCard
              title="Đại lý"
              value={stats.totalAgents}
              icon="business-outline"
              color="#FF9500"
              onPress={() => navigation.navigate('AgentManagement' as never)}
            />
            <StatCard
              title="Dịch vụ"
              value={stats.totalServices}
              icon="construct-outline"
              color="#8E8E93"
              onPress={() => navigation.navigate('ServiceManagement' as never)}
            />
          </View>

          <View style={styles.statsGrid}>
            <StatCard
              title="Yêu cầu chờ xử lý"
              value={stats.pendingRequests}
              icon="time-outline"
              color="#FF3B30"
            />
            <StatCard
              title="Đã hoàn thành"
              value={stats.completedRequests.toLocaleString()}
              icon="checkmark-circle-outline"
              color="#34C759"
            />
            <StatCard
              title="Doanh thu hôm nay"
              value={formatCurrency(stats.todayRevenue)}
              icon="trending-up-outline"
              color="#007AFF"
            />
            <StatCard
              title="Doanh thu tháng"
              value={formatCurrency(stats.monthlyRevenue)}
              icon="bar-chart-outline"
              color="#32D74B"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          
          <View style={styles.actionsGrid}>
            <QuickAction
              title="Quản lý nhân viên"
              icon="people"
              color="#34C759"
              onPress={() => navigation.navigate('StaffManagement' as never)}
            />
            <QuickAction
              title="Quản lý đại lý"
              icon="business"
              color="#FF9500"
              onPress={() => navigation.navigate('AgentManagement' as never)}
            />
            <QuickAction
              title="Quản lý dịch vụ"
              icon="construct"
              color="#8E8E93"
              onPress={() => navigation.navigate('ServiceManagement' as never)}
            />
            <QuickAction
              title="Báo cáo"
              icon="analytics"
              color="#007AFF"
              onPress={() => navigation.navigate('Reports' as never)}
            />
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
          
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="person-add" size={20} color="#007AFF" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Người dùng mới đăng ký</Text>
                <Text style={styles.activityTime}>2 phút trước</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Yêu cầu dịch vụ hoàn thành</Text>
                <Text style={styles.activityTime}>5 phút trước</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="alert-circle" size={20} color="#FF9500" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Cảnh báo hệ thống</Text>
                <Text style={styles.activityTime}>10 phút trước</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 8,
    borderRadius: 12,
    width: '45%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  actionButton: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 8,
    borderRadius: 12,
    width: '45%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});