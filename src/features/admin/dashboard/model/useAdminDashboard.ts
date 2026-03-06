import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../../../app/providers/auth/AuthContext';
import {
  adminGraphqlService,
  ActivityLog,
  DashboardSummary,
} from '../../../../shared/api/adminGraphqlService';

export const useAdminDashboard = () => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardSummary>({
    totalUsers: 0,
    totalStaff: 0,
    totalAgents: 0,
    totalServices: 0,
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
  });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    }
    try {
      const [summary, logs, agentUsers] = await Promise.all([
        adminGraphqlService.getDashboardSummary(),
        adminGraphqlService.getActivityLogs(),
        adminGraphqlService.getUsersByRole('AGENT'),
      ]);

      setStats({
        ...summary,
        totalAgents: summary.totalAgents > 0 ? summary.totalAgents : agentUsers.length,
      });
      setActivityLogs(logs.slice(0, 3));
    } catch (error) {
      Alert.alert('Loi', (error as Error).message || 'Khong the tai du lieu dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard(true);
    }, [fetchDashboard])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboard(true);
  }, [fetchDashboard]);

  const normalizeAmount = useCallback((value: number | string) => {
    if (typeof value === 'number') {
      return value;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }, []);

  const formatActivityTime = useCallback((iso: string) => {
    return new Date(iso).toLocaleString('vi-VN');
  }, []);

  return {
    user,
    refreshing,
    loading,
    stats,
    activityLogs,
    onRefresh,
    normalizeAmount,
    formatCurrency,
    formatActivityTime,
  };
};
