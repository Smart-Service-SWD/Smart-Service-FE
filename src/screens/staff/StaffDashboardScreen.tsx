import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { staffGraphqlService } from '../../services/staffGraphqlService';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface DashboardStats {
  pendingRequests: number;
  totalRequests: number;
  completedRequests: number;
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  icon: any;
  title: string;
  value: number;
  color: string;
  onPress: () => void;
}> = ({ icon, title, value, color, onPress }) => (
  <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.85}>
    <View style={[styles.statIcon, { backgroundColor: color + '18' }]}>
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
    style={[styles.quickAction, { backgroundColor: color + '12', borderColor: color + '30' }]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={[styles.quickIconWrap, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={[styles.quickLabel, { color }]}>{label}</Text>
    <Ionicons name="chevron-forward" size={14} color={color + '80'} />
  </TouchableOpacity>
);

// ─── Main Component ─────────────────────────────────────────────────────────────

export const StaffDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    pendingRequests: 0,
    totalRequests: 0,
    completedRequests: 0,
  });

  const load = useCallback(async () => {
    try {
      const summary = await staffGraphqlService.getDashboardSummary();
      setStats({
        pendingRequests: summary.pendingRequests ?? 0,
        totalRequests: summary.totalRequests ?? 0,
        completedRequests: summary.completedRequests ?? 0,
      });
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

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
      {/* ── Header ── */}
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

      {/* ── Stat Cards ── */}
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

      {/* ── Quick Actions ── */}
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

// ─── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
  name: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 2 },
  role: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  avatarWrap: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },

  // Stat cards
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  statIcon: { width: 46, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statValue: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  statTitle: { fontSize: 11, color: '#757575', textAlign: 'center', fontWeight: '500' },

  // Section
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#212121', marginBottom: 14 },

  // Quick actions
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  quickIconWrap: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  quickLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
});
