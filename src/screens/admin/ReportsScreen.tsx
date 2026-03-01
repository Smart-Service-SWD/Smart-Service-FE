import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminGraphqlService, DashboardSummary } from '../../services/adminGraphqlService';

const screenWidth = Dimensions.get('window').width;

interface ReportData {
  userGrowth: number[];
  revenueData: number[];
  serviceUsage: Array<{ name: string; population: number; color: string; legendFontColor: string; legendFontSize: number }>;
  monthlyRevenue: Array<{ month: string; amount: number }>;
}

export const ReportsScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [reportData, setReportData] = useState<ReportData>({
    userGrowth: [20, 45, 28, 80, 99, 43, 120],
    revenueData: [150, 230, 180, 320, 450, 380, 520],
    serviceUsage: [
      { name: 'Điện tử', population: 35, color: '#007AFF', legendFontColor: '#333', legendFontSize: 12 },
      { name: 'Ô tô', population: 25, color: '#FF9500', legendFontColor: '#333', legendFontSize: 12 },
      { name: 'Xe máy', population: 20, color: '#34C759', legendFontColor: '#333', legendFontSize: 12 },
      { name: 'Gia đình', population: 12, color: '#FF3B30', legendFontColor: '#333', legendFontSize: 12 },
      { name: 'Khác', population: 8, color: '#8E8E93', legendFontColor: '#333', legendFontSize: 12 },
    ],
    monthlyRevenue: [
      { month: 'T1', amount: 45000000 },
      { month: 'T2', amount: 52000000 },
      { month: 'T3', amount: 48000000 },
      { month: 'T4', amount: 65000000 },
      { month: 'T5', amount: 70000000 },
      { month: 'T6', amount: 85000000 },
    ],
  });

  const fetchData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await adminGraphqlService.getDashboardSummary();
      setSummary(data);
    } catch (error) {
      console.warn('Không thể tải dữ liệu báo cáo:', (error as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const PeriodSelector: React.FC = () => (
    <View style={styles.periodSelector}>
      {['week', 'month', 'quarter', 'year'].map(period => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodText,
            selectedPeriod === period && styles.periodTextActive
          ]}>
            {period === 'week' ? 'Tuần' : period === 'month' ? 'Tháng' : period === 'quarter' ? 'Quý' : 'Năm'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const StatCard: React.FC<{ 
    title: string; 
    value: string; 
    change: string; 
    isPositive: boolean;
    icon: string;
  }> = ({ title, value, change, isPositive, icon }) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={20} color="#007AFF" />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <View style={styles.statChange}>
        <Ionicons 
          name={isPositive ? 'trending-up' : 'trending-down'} 
          size={16} 
          color={isPositive ? '#34C759' : '#FF3B30'} 
        />
        <Text style={[styles.changeText, { color: isPositive ? '#34C759' : '#FF3B30' }]}>
          {change}
        </Text>
      </View>
    </View>
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
          <Text style={styles.headerTitle}>Báo cáo & Thống kê</Text>
          <TouchableOpacity style={styles.exportButton}>
            <Ionicons name="download-outline" size={20} color="#007AFF" />
            <Text style={styles.exportText}>Xuất</Text>
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={styles.section}>
          <PeriodSelector />
        </View>

        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chỉ số chính</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : (
            <View style={styles.statsGrid}>
              <StatCard
                title="Doanh thu hôm nay"
                value={formatCurrency(Number(summary?.todayRevenue) || 0)}
                change="+12.5%"
                isPositive={true}
                icon="trending-up-outline"
              />
              <StatCard
                title="Doanh thu tháng"
                value={formatCurrency(Number(summary?.monthlyRevenue) || 0)}
                change="+8.2%"
                isPositive={true}
                icon="wallet-outline"
              />
              <StatCard
                title="Yêu cầu chờ"
                value={String(summary?.pendingRequests ?? '-')}
                change={summary?.totalRequests ? `/${summary.totalRequests} tổng` : ''}
                isPositive={true}
                icon="time-outline"
              />
              <StatCard
                title="Đã hoàn thành"
                value={String(summary?.completedRequests ?? '-')}
                change="+15.3%"
                isPositive={true}
                icon="checkmark-circle-outline"
              />
            </View>
          )}
        </View>

        {/* Summary Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thống kê tổng quan</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tổng người dùng:</Text>
              <Text style={styles.summaryValue}>{loading ? '...' : (summary?.totalUsers ?? '-')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Nhân viên:</Text>
              <Text style={styles.summaryValue}>{loading ? '...' : (summary?.totalStaff ?? '-')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Thợ:</Text>
              <Text style={styles.summaryValue}>{loading ? '...' : (summary?.totalAgents ?? '-')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tổng dịch vụ:</Text>
              <Text style={styles.summaryValue}>{loading ? '...' : (summary?.totalServices ?? '-')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tổng yêu cầu:</Text>
              <Text style={styles.summaryValue}>{loading ? '...' : (summary?.totalRequests ?? '-')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Yêu cầu hoàn thành:</Text>
              <Text style={[styles.summaryValue, { color: '#34C759' }]}>{loading ? '...' : (summary?.completedRequests ?? '-')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Yêu cầu đang chờ:</Text>
              <Text style={[styles.summaryValue, { color: '#FF9500' }]}>{loading ? '...' : (summary?.pendingRequests ?? '-')}</Text>
            </View>
          </View>
        </View>

        {/* Top Performers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top dịch vụ được đặt nhiều nhất</Text>
          <View style={styles.topServicesCard}>
            {[
              { name: 'Sửa chữa điện tử', bookings: 245, revenue: 36750000 },
              { name: 'Bảo dưỡng ô tô', bookings: 189, revenue: 94500000 },
              { name: 'Sửa chữa xe máy', bookings: 156, revenue: 15600000 },
              { name: 'Dịch vụ gia đình', bookings: 98, revenue: 19600000 },
            ].map((service, index) => (
              <View key={service.name} style={styles.topServiceItem}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.topServiceInfo}>
                  <Text style={styles.topServiceName}>{service.name}</Text>
                  <Text style={styles.topServiceStats}>
                    {service.bookings} lượt đặt • {formatCurrency(service.revenue)}
                  </Text>
                </View>
              </View>
            ))}
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF20',
  },
  exportText: {
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
  },
  periodText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  periodTextActive: {
    color: '#fff',
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
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
  },
  chartHeader: {
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chart: {
    borderRadius: 12,
  },
  mockChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  mockChartText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  mockChartSubtext: {
    fontSize: 12,
    color: '#666',
  },
  summaryCard: {
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  topServicesCard: {
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
  topServiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  topServiceInfo: {
    flex: 1,
  },
  topServiceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  topServiceStats: {
    fontSize: 12,
    color: '#666',
  },
});