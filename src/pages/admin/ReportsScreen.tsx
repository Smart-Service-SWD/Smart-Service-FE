import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useReports } from '../../features/admin/reports/model/useReports';
import { styles } from './reports/styles';
import { ReportStatCard } from './reports/ui/ReportStatCard';
import { SummaryStatsCard } from './reports/ui/SummaryStatsCard';
import { TopServicesCard } from './reports/ui/TopServicesCard';

export const ReportsScreen: React.FC = () => {
  const {
    refreshing,
    loading,
    summary,
    topServices,
    onRefresh,
    formatCurrency,
  } = useReports();

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
              <ReportStatCard
                title="Doanh thu hôm nay"
                value={formatCurrency(Number(summary?.todayRevenue) || 0)}
                icon="trending-up-outline"
              />
              <ReportStatCard
                title="Doanh thu tháng"
                value={formatCurrency(Number(summary?.monthlyRevenue) || 0)}
                icon="wallet-outline"
              />
              <ReportStatCard
                title="Yêu cầu chờ"
                value={String(summary?.pendingRequests ?? '-')}
                icon="time-outline"
              />
              <ReportStatCard
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
          <SummaryStatsCard loading={loading} summary={summary} />
        </View>

        {/* Top Performers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top dịch vụ được đặt nhiều nhất</Text>
          <TopServicesCard loading={loading} services={topServices} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
