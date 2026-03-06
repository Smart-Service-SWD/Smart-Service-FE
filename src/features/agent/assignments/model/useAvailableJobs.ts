import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../../../app/providers/auth/AuthContext';
import {
  agentGraphqlService,
  AssignmentWithRequest,
} from '../../../../shared/api/agentGraphqlService';

export const useAvailableJobs = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentWithRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAssignments = useCallback(async (isRefresh = false) => {
    if (!user?.id) {
      return;
    }
    if (!isRefresh) {
      setLoading(true);
    }
    try {
      const data = await agentGraphqlService.getAssignmentsWithRequestDetail(user.id);
      setAssignments(data);
    } catch (errorResponse: any) {
      Alert.alert('Loi', errorResponse?.message ?? 'Khong tai duoc assignment');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAssignments(true);
  }, [loadAssignments]);

  return {
    assignments,
    loading,
    refreshing,
    onRefresh,
  };
};
