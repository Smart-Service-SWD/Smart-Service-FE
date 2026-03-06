import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../../app/providers/auth/AuthContext';
import { staffGraphqlService } from '../../../../shared/api/staffGraphqlService';

interface DashboardStats {
  pendingRequests: number;
  totalRequests: number;
  completedRequests: number;
}

const INITIAL_STATS: DashboardStats = {
  pendingRequests: 0,
  totalRequests: 0,
  completedRequests: 0,
};

export const useStaffDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);

  const load = useCallback(async () => {
    try {
      const summary = await staffGraphqlService.getDashboardSummary();
      setStats({
        pendingRequests: summary.pendingRequests ?? 0,
        totalRequests: summary.totalRequests ?? 0,
        completedRequests: summary.completedRequests ?? 0,
      });
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  return {
    user,
    stats,
    loading,
    refreshing,
    onRefresh,
  };
};
