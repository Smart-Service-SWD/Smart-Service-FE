import { useCallback, useEffect, useState } from 'react';
import {
  adminGraphqlService,
  DashboardSummary,
  ServiceListItem,
} from '../../../../shared/api/adminGraphqlService';

export const useReports = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [topServices, setTopServices] = useState<ServiceListItem[]>([]);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    }
    try {
      const [dashboard, agentUsers, services] = await Promise.all([
        adminGraphqlService.getDashboardSummary(),
        adminGraphqlService.getUsersByRole('AGENT'),
        adminGraphqlService.getServiceDefinitions(),
      ]);
      setSummary({
        ...dashboard,
        totalAgents: dashboard.totalAgents > 0 ? dashboard.totalAgents : agentUsers.length,
      });
      const sorted = [...services].sort((a, b) => b.bookingCount - a.bookingCount).slice(0, 4);
      setTopServices(sorted);
    } catch (error) {
      console.warn('Khong the tai du lieu bao cao:', (error as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData(true);
  }, [fetchData]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  return {
    refreshing,
    loading,
    summary,
    topServices,
    onRefresh,
    formatCurrency,
  };
};
