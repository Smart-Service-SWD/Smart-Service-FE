import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  COMPLEXITY_LABEL,
  getServiceRequestById,
  ServiceRequestDetail,
  STATUS_COLOR,
  STATUS_LABEL,
} from '../../../../shared/api/userService';
import { REQUEST_DETAIL_STEP_ORDER } from './constants';

export const useRequestDetail = (requestId: string) => {
  const [request, setRequest] = useState<ServiceRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequest = useCallback(async () => {
    try {
      const data = await getServiceRequestById(requestId);
      setRequest(data);
    } catch (errorResponse: any) {
      Alert.alert('Loi', errorResponse?.message ?? 'Khong tai duoc chi tiet yeu cau');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRequest();
  }, [loadRequest]);

  const derived = useMemo(() => {
    if (!request) {
      return {
        statusColor: '#6B7280',
        statusLabel: '',
        complexityLevel: 0,
        complexityLabel: '',
        currentStep: -1,
        isCancelled: false,
        isCompleted: false,
      };
    }

    const statusColor = STATUS_COLOR[request.status] ?? '#6B7280';
    const statusLabel = STATUS_LABEL[request.status] ?? request.status;
    const complexityLevel = request.complexity?.level ?? 0;
    const complexityLabel = COMPLEXITY_LABEL[complexityLevel] ?? `Muc ${complexityLevel}`;
    const currentStep = REQUEST_DETAIL_STEP_ORDER.indexOf(request.status);
    const isCancelled = request.status === 'CANCELLED';
    const isCompleted = request.status === 'COMPLETED';

    return {
      statusColor,
      statusLabel,
      complexityLevel,
      complexityLabel,
      currentStep,
      isCancelled,
      isCompleted,
    };
  }, [request]);

  return {
    request,
    loading,
    refreshing,
    onRefresh,
    loadRequest,
    ...derived,
  };
};
