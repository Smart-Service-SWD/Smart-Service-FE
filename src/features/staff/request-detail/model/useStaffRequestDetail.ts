import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  MatchingResult,
  ServiceAgent,
  ServiceRequestDetail,
  staffGraphqlService,
} from '../../../../shared/api/staffGraphqlService';
import { staffRestService } from '../../../../shared/api/staffRestService';
import { COMPLEXITY_LABEL, STAFF_REQUEST_STATUS_LABEL } from './constants';

interface UseStaffRequestDetailParams {
  requestId: string;
  onApproved?: () => void;
}

export const useStaffRequestDetail = ({ requestId, onApproved }: UseStaffRequestDetailParams) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [request, setRequest] = useState<ServiceRequestDetail | null>(null);
  const [agents, setAgents] = useState<ServiceAgent[]>([]);

  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('');
  const [agentPickerVisible, setAgentPickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [complexityModalVisible, setComplexityModalVisible] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(3);

  const loadData = useCallback(async () => {
    try {
      const [requestData, agentList] = await Promise.all([
        staffGraphqlService.getRequestDetail(requestId),
        staffGraphqlService.getServiceAgents(),
      ]);
      setRequest(requestData);
      setAgents(agentList);
      if (requestData) {
        setSelectedLevel(requestData.complexity?.level ?? 3);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message ?? 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleApprove = useCallback(() => {
    if (!selectedAgentId) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn nhà cung cấp dịch vụ');
      return;
    }

    const amount = parseFloat(estimatedAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập chi phí ước tính hợp lệ');
      return;
    }

    const selectedAgentName = agents.find(agent => agent.id === selectedAgentId)?.fullName ?? selectedAgentId;

    Alert.alert(
      'Xác nhận phê duyệt',
      `Bạn có chắc muốn phê duyệt yêu cầu này và phân công cho ${selectedAgentName}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Phê duyệt',
          onPress: async () => {
            try {
              setSubmitting(true);
              await staffRestService.createAssignment({
                serviceRequestId: requestId,
                agentId: selectedAgentId,
                estimatedCost: { amount, currency: 'VND' },
              });
              await staffRestService.assignProvider(requestId, {
                providerId: selectedAgentId,
                estimatedCost: { amount, currency: 'VND' },
              });
              await staffRestService.createActivityLog(
                requestId,
                `Staff assigned provider ${selectedAgentId} with estimated cost ${amount} VND`
              );
              Alert.alert('Thành công', 'Yêu cầu đã được phê duyệt và phân công thành công', [
                { text: 'OK', onPress: () => onApproved?.() },
              ]);
            } catch (error: any) {
              Alert.alert(
                'Lỗi',
                error?.response?.data?.message ?? error?.message ?? 'Phê duyệt thất bại'
              );
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  }, [agents, estimatedAmount, onApproved, requestId, selectedAgentId]);

  const handleEvaluateComplexity = useCallback(async () => {
    try {
      setSubmitting(true);
      await staffRestService.evaluateComplexity(requestId, {
        complexity: { level: selectedLevel },
      });
      await staffRestService.createActivityLog(
        requestId,
        `Staff re-evaluated complexity to level ${selectedLevel}`
      );
      setComplexityModalVisible(false);
      Alert.alert(
        'Thành công',
        `Đã cập nhật độ phức tạp: ${COMPLEXITY_LABEL[selectedLevel] ?? `Level ${selectedLevel}`}`
      );
      await loadData();
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message ?? error?.message ?? 'Cập nhật thất bại');
    } finally {
      setSubmitting(false);
    }
  }, [loadData, requestId, selectedLevel]);

  const handleSelectFromMatch = useCallback(
    (match: MatchingResult) => {
      setSelectedAgentId(match.serviceAgentId);
      const selectedAgentName =
        agents.find(agent => agent.id === match.serviceAgentId)?.fullName ??
        `Agent ${match.serviceAgentId.slice(0, 8)}`;
      Alert.alert(
        'Đã chọn',
        `${selectedAgentName} (Điểm khớp: ${(match.matchingScore * 100).toFixed(0)}%)`
      );
    },
    [agents]
  );

  const selectedAgent = useMemo(
    () => agents.find(agent => agent.id === selectedAgentId),
    [agents, selectedAgentId]
  );

  const sortedMatches = useMemo(
    () => [...(request?.matchingResults ?? [])].sort((a, b) => b.matchingScore - a.matchingScore),
    [request?.matchingResults]
  );

  const statusMeta = useMemo(
    () =>
      request
        ? STAFF_REQUEST_STATUS_LABEL[request.status] ?? { label: request.status, color: '#607D8B' }
        : { label: '', color: '#607D8B' },
    [request]
  );

  return {
    loading,
    refreshing,
    request,
    agents,
    selectedAgentId,
    estimatedAmount,
    agentPickerVisible,
    submitting,
    complexityModalVisible,
    selectedLevel,
    selectedAgent,
    sortedMatches,
    isPendingReview: request?.status === 'PENDING_REVIEW',
    statusMeta,
    setSelectedAgentId,
    setEstimatedAmount,
    setAgentPickerVisible,
    setComplexityModalVisible,
    setSelectedLevel,
    onRefresh,
    handleApprove,
    handleEvaluateComplexity,
    handleSelectFromMatch,
  };
};
