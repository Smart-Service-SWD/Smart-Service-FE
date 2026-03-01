import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminGraphqlService, DashboardSummary, ServiceListItem } from '../../services/adminGraphqlService';

export const ReportsScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [topServices, setTopServices] = useState<ServiceListItem[]>([]);

  const fetchData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const [data, agentUsers, services] = await Promise.all([
        adminGraphqlService.getDashboardSummary(),
        adminGraphqlService.getUsersByRole('AGENT'),
        adminGraphqlService.getServiceDefinitions(),
      ]);
      setSummary({
        ...data,
        totalAgents: data.totalAgents > 0 ? data.totalAgents : agentUsers.length,
      });
      const sorted = [...services].sort((a, b) => b.bookingCount - a.bookingCount).slice(0, 4);
      setTopServices(sorted);
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

  const StatCard: React.FC<{
    title: string;
    value: string;
    icon: string;
  }> = ({ title, value, icon }) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={20} color="#007AFF" />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
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
                icon="trending-up-outline"
              />
              <StatCard
                title="Doanh thu tháng"
                value={formatCurrency(Number(summary?.monthlyRevenue) || 0)}
                icon="wallet-outline"
              />
              <StatCard
                title="Yêu cầu chờ"
                value={String(summary?.pendingRequests ?? '-')}
                icon="time-outline"
              />
              <StatCard
                title="Đã hoàn thành"
                value={String(summary?.completedRequests ?? '-')}
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
            {loading ? (
              <ActivityIndicator color="#007AFF" />
            ) : topServices.length === 0 ? (
              <Text style={{ color: '#999', textAlign: 'center', padding: 12 }}>Chưa có dữ liệu</Text>
            ) : (
              topServices.map((service, index) => (
                <View key={service.id} style={styles.topServiceItem}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.topServiceInfo}>
                    <Text style={styles.topServiceName}>{service.name}</Text>
                    <Text style={styles.topServiceStats}>
                      {service.bookingCount > 0 ? `${service.bookingCount} lượt đặt` : 'Chưa có lịch đặt'}
                      {' • '}{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(service.basePrice) || 0)}
                    </Text>
                  </View>
                </View>
              ))
            )}
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