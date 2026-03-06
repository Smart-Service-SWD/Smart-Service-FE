import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useStaffDashboard } from '../../../features/staff/dashboard/model/useStaffDashboard';
import { styles } from './styles';

const StatCard: React.FC<{
  icon: any;
  title: string;
  value: number;
  color: string;
  onPress: () => void;
}> = ({ icon, title, value, color, onPress }) => (
  <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.85}>
    <View style={[styles.statIcon, { backgroundColor: `${color}18` }]}>
      <Ionicons name={icon} size={26} color={color} />
    </View>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </TouchableOpacity>
);

const QuickAction: React.FC<{
  icon: any;
  label: string;
  color: string;
  onPress: () => void;
}> = ({ icon, label, color, onPress }) => (
  <TouchableOpacity
    style={[styles.quickAction, { backgroundColor: `${color}12`, borderColor: `${color}30` }]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={[styles.quickIconWrap, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={[styles.quickLabel, { color }]}>{label}</Text>
    <Ionicons name="chevron-forward" size={14} color={`${color}80`} />
  </TouchableOpacity>
);

export const StaffDashboardPage: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, stats, loading, refreshing, onRefresh } = useStaffDashboard();

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1976D2" />}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={['#1976D2', '#63a4ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Xin chào,</Text>
          <Text style={styles.name}>{user?.fullName ?? 'Nhân viên'}</Text>
          <Text style={styles.role}>Nhân viên hệ thống</Text>
        </View>
        <View style={styles.avatarWrap}>
          <Ionicons name="person" size={34} color="#1976D2" />
        </View>
      </LinearGradient>

      <View style={styles.statsRow}>
        <StatCard
          icon="time-outline"
          title="Chờ phê duyệt"
          value={stats.pendingRequests}
          color="#FF9800"
          onPress={() => navigation.navigate('PendingEvaluations')}
        />
        <StatCard
          icon="document-text-outline"
          title="Tổng yêu cầu"
          value={stats.totalRequests}
          color="#1976D2"
          onPress={() => navigation.navigate('ReEvaluations')}
        />
        <StatCard
          icon="checkmark-circle-outline"
          title="Hoàn thành"
          value={stats.completedRequests}
          color="#4CAF50"
          onPress={() => navigation.navigate('PendingEvaluations')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tác vụ nhanh</Text>
        <QuickAction
          icon="checkmark-circle-outline"
          label="Xác nhận đánh giá AI"
          color="#1976D2"
          onPress={() => navigation.navigate('PendingEvaluations')}
        />
        <QuickAction
          icon="analytics-outline"
          label="Yêu cầu chờ phân tích"
          color="#FF9800"
          onPress={() => navigation.navigate('ReEvaluations')}
        />
        <QuickAction
          icon="person-circle-outline"
          label="Hồ sơ cá nhân"
          color="#4CAF50"
          onPress={() => navigation.navigate('StaffProfile')}
        />
      </View>
    </ScrollView>
  );
};
