import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../../app/providers/auth/AuthContext';
import {
  ServiceRequestSummary,
  staffGraphqlService,
} from '../../../../shared/api/staffGraphqlService';

export const usePendingEvaluations = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<ServiceRequestSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await staffGraphqlService.getPendingReviewRequests();
      setRequests(data);
    } catch (err: any) {
      setError(err?.message ?? 'Không tải được dữ liệu');
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
    loading,
    refreshing,
    requests,
    error,
    load,
    onRefresh,
  };
};
