import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import {
  getMyServiceRequests,
  ServiceRequestDetail,
} from '../../../../shared/api/userService';
import { FilterStatus } from './constants';

export const useMyRequests = () => {
  const [requests, setRequests] = useState<ServiceRequestDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('');

  const loadRequests = useCallback(async () => {
    try {
      const data = await getMyServiceRequests(filter || undefined);
      setRequests(data);
    } catch (errorResponse: any) {
      Alert.alert('Loi', errorResponse?.message ?? 'Khong tai duoc danh sach yeu cau');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    loadRequests();
  }, [loadRequests]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRequests();
  }, [loadRequests]);

  return {
    requests,
    loading,
    refreshing,
    filter,
    setFilter,
    onRefresh,
  };
};
