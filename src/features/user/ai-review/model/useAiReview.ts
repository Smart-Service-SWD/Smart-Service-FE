import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  analyzeServiceRequest,
  COMPLEXITY_LABEL,
  createActivityLog,
  requestStaffEvaluation,
  ServiceAnalysisResult,
  ServiceRequestDetail,
} from '../../../../shared/api/userService';

interface UseAiReviewParams {
  navigation: any;
  serviceRequest: ServiceRequestDetail;
  initialAnalysis: ServiceAnalysisResult;
}

export const useAiReview = ({
  navigation,
  serviceRequest,
  initialAnalysis,
}: UseAiReviewParams) => {
  const [analysis, setAnalysis] = useState<ServiceAnalysisResult>(initialAnalysis);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [staffModalVisible, setStaffModalVisible] = useState(false);
  const [staffNote, setStaffNote] = useState('');
  const [sendingToStaff, setSendingToStaff] = useState(false);

  const derived = useMemo(() => {
    const complexityLevel = analysis.complexity?.level ?? 0;
    const complexityLabel = COMPLEXITY_LABEL[complexityLevel] ?? `Muc ${complexityLevel}`;
    const estimatedAmount = analysis.estimatedCost?.amount;
    const currency = analysis.estimatedCost?.currency ?? 'VND';
    const complexityColors: Record<number, string> = {
      1: '#10B981',
      2: '#3B82F6',
      3: '#F59E0B',
      4: '#F97316',
      5: '#EF4444',
    };
    const badgeColor = complexityColors[complexityLevel] ?? '#6B7280';

    return {
      complexityLevel,
      complexityLabel,
      estimatedAmount,
      currency,
      badgeColor,
    };
  }, [analysis]);

  const handleReAnalyze = () => {
    Alert.alert(
      'Danh gia lai',
      'AI se phan tich lai yeu cau cua ban. Ban co muon tiep tuc?',
      [
        { text: 'Huy', style: 'cancel' },
        {
          text: 'Danh gia lai',
          onPress: async () => {
            setReanalyzing(true);
            try {
              const newAnalysis = await analyzeServiceRequest(serviceRequest.description);
              setAnalysis(newAnalysis);
            } catch (errorResponse: any) {
              Alert.alert('Loi', errorResponse?.message ?? 'Khong the danh gia lai');
            } finally {
              setReanalyzing(false);
            }
          },
        },
      ]
    );
  };

  const handleAccept = async () => {
    try {
      await createActivityLog(serviceRequest.id, 'Customer accepted AI analysis result');
    } catch {
      // ignore logging failure
    }
    navigation.replace('RequestDetail', { requestId: serviceRequest.id });
  };

  const handleSendToStaff = async () => {
    setSendingToStaff(true);
    try {
      const level = analysis.complexity?.level ?? 3;
      try {
        await requestStaffEvaluation(serviceRequest.id, level);
      } catch {
        // ignore evaluate failure, keep activity log for staff
      }

      await createActivityLog(
        serviceRequest.id,
        `Customer requested manual review${staffNote.trim() ? `: ${staffNote.trim()}` : ''}`
      );

      setStaffModalVisible(false);
      Alert.alert(
        'Da gui',
        'Yeu cau cua ban da duoc gui cho nhan vien de xem xet thu cong.',
        [{ text: 'OK', onPress: () => navigation.replace('RequestDetail', { requestId: serviceRequest.id }) }]
      );
    } catch (errorResponse: any) {
      Alert.alert('Loi', errorResponse?.message ?? 'Khong the gui yeu cau');
    } finally {
      setSendingToStaff(false);
    }
  };

  return {
    analysis,
    reanalyzing,
    staffModalVisible,
    staffNote,
    sendingToStaff,
    setStaffModalVisible,
    setStaffNote,
    handleReAnalyze,
    handleAccept,
    handleSendToStaff,
    ...derived,
  };
};
