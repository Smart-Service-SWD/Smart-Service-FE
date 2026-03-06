import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../../../app/providers/auth/AuthContext';
import {
  agentGraphqlService,
  AssignmentWithRequest,
} from '../../../../shared/api/agentGraphqlService';

interface AgentDashboardStats {
  pendingAssignments: number;
  activeJobs: number;
  completedToday: number;
  earnings: number;
}

const INITIAL_STATS: AgentDashboardStats = {
  pendingAssignments: 0,
  activeJobs: 0,
  completedToday: 0,
  earnings: 0,
};

export const useAgentDashboard = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AgentDashboardStats>(INITIAL_STATS);
  const [recentAssignments, setRecentAssignments] = useState<AssignmentWithRequest[]>([]);

  const loadDashboardData = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    try {
      setLoading(true);
      const [statData, assignments] = await Promise.all([
        agentGraphqlService.getAgentStats(user.id),
        agentGraphqlService.getAssignmentsWithRequestDetail(user.id),
      ]);
      setStats(statData);
      setRecentAssignments(assignments.slice(0, 3));
    } catch (errorResponse: any) {
      Alert.alert('Loi', errorResponse?.message ?? 'Khong tai duoc du lieu agent');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);

  const handleLogout = useCallback(() => {
    Alert.alert('Dang xuat', 'Ban co chac chan muon dang xuat?', [
      { text: 'Huy', style: 'cancel' },
      { text: 'Dang xuat', style: 'destructive', onPress: () => logout() },
    ]);
  }, [logout]);

  return {
    user,
    loading,
    refreshing,
    stats,
    recentAssignments,
    onRefresh,
    handleLogout,
  };
};
