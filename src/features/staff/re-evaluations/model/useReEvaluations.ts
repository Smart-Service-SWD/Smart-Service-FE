import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../../../app/providers/auth/AuthContext';
import {
  ServiceRequestSummary,
  staffGraphqlService,
} from '../../../../shared/api/staffGraphqlService';
import { staffRestService } from '../../../../shared/api/staffRestService';

export const useReEvaluations = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<ServiceRequestSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await staffGraphqlService.getNewRequests();
      setRequests(data);
    } catch (errorResponse: any) {
      setError(errorResponse?.message ?? 'Khong tai duoc du lieu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const triggerAnalysis = useCallback((request: ServiceRequestSummary) => {
    if (!request.description) {
      Alert.alert('Thieu thong tin', 'Yeu cau nay khong co mo ta de phan tich AI.');
      return;
    }

    Alert.alert(
      'Phan tich AI',
      `Kich hoat AI phan tich yeu cau #${request.id.slice(0, 8).toUpperCase()}?`,
      [
        { text: 'Huy', style: 'cancel' },
        {
          text: 'Phan tich',
          onPress: async () => {
            try {
              setAnalyzingId(request.id);
              await staffRestService.triggerAnalysis({ description: request.description! });
              Alert.alert(
                'Thanh cong',
                'Da gui yeu cau phan tich AI. Ket qua se xuat hien trong tab "Xac nhan AI".',
                [{ text: 'OK', onPress: () => load() }]
              );
            } catch (errorResponse: any) {
              Alert.alert(
                'Loi',
                errorResponse?.response?.data?.message ?? errorResponse?.message ?? 'Phan tich that bai'
              );
            } finally {
              setAnalyzingId(null);
            }
          },
        },
      ]
    );
  }, [load]);

  return {
    user,
    loading,
    refreshing,
    requests,
    error,
    analyzingId,
    load,
    onRefresh,
    triggerAnalysis,
  };
};
