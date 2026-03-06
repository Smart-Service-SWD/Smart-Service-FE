import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { staffGraphqlService } from '../../../../shared/api/staffGraphqlService';

interface UseAgentJobRequestDetailParams {
  passedJob: any;
  jobId?: string;
}

export const useAgentJobRequestDetail = ({
  passedJob,
  jobId,
}: UseAgentJobRequestDetailParams) => {
  const [requestDetail, setRequestDetail] = useState<any>(passedJob?.requestDetail ?? null);
  const [loading, setLoading] = useState(!passedJob?.requestDetail);
  const [error, setError] = useState('');

  const resolvedJobId = useMemo(() => {
    return jobId || passedJob?.serviceRequestId || passedJob?.id;
  }, [jobId, passedJob?.id, passedJob?.serviceRequestId]);

  const fetchJobData = useCallback(async () => {
    if (!resolvedJobId) {
      setError('Khong co ID cong viec');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const data = await staffGraphqlService.getRequestDetail(resolvedJobId);
      setRequestDetail(data);
    } catch (errorResponse: any) {
      const message = errorResponse?.message ?? 'Khong tai duoc du lieu';
      setError(message);
      Alert.alert('Loi', message);
    } finally {
      setLoading(false);
    }
  }, [resolvedJobId]);

  useEffect(() => {
    if (!requestDetail) {
      fetchJobData();
    }
  }, [fetchJobData, requestDetail]);

  return {
    requestDetail,
    loading,
    error,
    fetchJobData,
  };
};
