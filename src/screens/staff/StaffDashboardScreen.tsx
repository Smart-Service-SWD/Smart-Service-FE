import React, { useState, useEffect } from 'react';

import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';

export const StaffDashboardScreen: React.FC<{ navigation  }> = ({ navigation  }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [stats, setStats] = useState<any>({
    pendingRequests: 0,
    activeRequests: 0,
    completedToday: 0,
    availableAgents: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Call API to get staff dashboard stats
      // const data = await staffService.getDashboardStats();
      // setStats(data);
      
      // Mock data for now
      setTimeout(() => {
        setStats({
          pendingRequests: 12,
          activeRequests: 8,
          completedToday: 15,
          availableAgents: 23
        });
        setLoading(false);
        setRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Animated StatCard with icon effect
  const StatCard = ({ icon, title, value, onPress, color = "#1976D2" }) => {
    return (
      <TouchableOpacity
        style={styles.statCard}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={32} color={color} />
        </View>
        <View style={styles.statContent}>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
          <Text style={[styles.statTitle, { color }]}>{title}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={color} />
      </TouchableOpacity>
    );
  };

  // QuickAction component
  const QuickAction = ({ icon, label, onPress, color = "#1976D2" }) => {
    return (
      <TouchableOpacity style={[styles.quickActionSimple, { backgroundColor: color + '20' }]} onPress={onPress} activeOpacity={0.8}>
        <Ionicons name={icon} size={28} color={color} />
        <Text style={[styles.quickActionTextSimple, { color }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >

      <LinearGradient
        colors={["#1976D2", "#63a4ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerSimple}
      >
        <Text style={styles.greetingSimple}>Xin chào, {user?.fullName}!</Text>
        <Text style={styles.roleSimple}>Trang nhân viên</Text>
      </LinearGradient>

      <View style={styles.statsContainerSimple}>
        <View style={styles.statsGrid}>
          <StatCard
            icon="time-outline"
            title="Chờ xử lý"
            value={stats.pendingRequests}
            color="#FF9800"
            onPress={() => navigation.navigate('RequestManagement', { status: 'pending' })}
          />
          <StatCard
            icon="flash-outline"
            title="Đang thực hiện"
            value={stats.activeRequests}
            color="#1976D2"
            onPress={() => navigation.navigate('RequestManagement', { status: 'active' })}
          />
          <StatCard
            icon="checkmark-circle-outline"
            title="Hoàn thành hôm nay"
            value={stats.completedToday}
            color="#4CAF50"
            onPress={() => navigation.navigate('RequestManagement', { status: 'completed' })}
          />
          <StatCard
            icon="people-outline"
            title="Nhân viên sẵn sàng"
            value={stats.availableAgents}
            color="#9C27B0"
            onPress={() => navigation.navigate('AgentManagement')}
          />
        </View>
      </View>

      <View style={styles.sectionSimple}>
        <Text style={styles.sectionTitleSimple}>Tác vụ nhanh</Text>
        <View style={styles.quickActionsRowSimple}>
          <QuickAction icon="list-outline" label="Yêu cầu dịch vụ" color="#1976D2" onPress={() => navigation.navigate('RequestManagement')} />
          <QuickAction icon="people-outline" label="Nhân viên" color="#9C27B0" onPress={() => navigation.navigate('AgentManagement')} />
          <QuickAction icon="git-merge-outline" label="Phân công" color="#FF9800" onPress={() => navigation.navigate('AssignmentManagement')} />
          <QuickAction icon="analytics-outline" label="Báo cáo" color="#4CAF50" onPress={() => navigation.navigate('Reports')} />
        </View>
      </View>

      <View style={styles.sectionSimple}>
        <Text style={styles.sectionTitleSimple}>Hoạt động gần đây</Text>
        <View style={styles.recentActivities}>
          <View style={styles.activityItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.activityText}>Yêu cầu #123 đã được hoàn thành</Text>
          </View>
          <View style={styles.activityItem}>
            <Ionicons name="person-add" size={20} color="#FF9800" />
            <Text style={styles.activityText}>Nhân viên mới được thêm vào hệ thống</Text>
          </View>
          <View style={styles.activityItem}>
            <Ionicons name="time" size={20} color="#2196F3" />
            <Text style={styles.activityText}>Yêu cầu #124 đang chờ phê duyệt</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSimple: {
    backgroundColor: '#1976D2',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  greetingSimple: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  roleSimple: {
    fontSize: 16,
    color: '#e3f2fd',
    fontWeight: '600',
  },
  statsContainerSimple: {
    padding: 18,
    paddingTop: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '48%',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statTitle: {
    fontSize: 15,
    marginTop: 2,
    fontWeight: '500',
  },
  sectionSimple: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingVertical: 18,
    borderRadius: 16,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitleSimple: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1976D2',
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  quickActionsRowSimple: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
    paddingHorizontal: 8,
  },
  quickActionSimple: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  quickActionTextSimple: {
    fontWeight: '600',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  recentActivities: {
    paddingHorizontal: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e3f2fd',
  },
  activityText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
});
