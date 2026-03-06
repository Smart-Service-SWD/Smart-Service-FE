import React from 'react';
import {
  ScrollView,
  View,
} from 'react-native';
import {
  ServiceAnalysisResult,
  ServiceRequestDetail,
} from '../../shared/api/userService';
import { useAiReview } from '../../features/user/ai-review/model/useAiReview';
import { ActionGuide } from './aireview/ui/ActionGuide';
import { StaffReviewModal } from './aireview/ui/StaffReviewModal';
import { AIReviewHeader } from './aireview/ui/AIReviewHeader';
import { AIReviewIntroCard } from './aireview/ui/AIReviewIntroCard';
import { ServiceRequestCard } from './aireview/ui/ServiceRequestCard';
import { ComplexityAndCostCard } from './aireview/ui/ComplexityAndCostCard';
import { AnalysisDetailsCard } from './aireview/ui/AnalysisDetailsCard';
import { AIReviewActions } from './aireview/ui/AIReviewActions';
import { styles } from './aireview/styles';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  navigation: any;
  route: {
    params: {
      serviceRequest: ServiceRequestDetail;
      analysisResult: ServiceAnalysisResult;
    };
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AIReviewScreen: React.FC<Props> = ({ navigation, route }) => {
  const { serviceRequest, analysisResult: initialAnalysis } = route.params;

  const {
    analysis,
    reanalyzing,
    staffModalVisible,
    staffNote,
    sendingToStaff,
    complexityLevel,
    complexityLabel,
    estimatedAmount,
    currency,
    badgeColor,
    setStaffModalVisible,
    setStaffNote,
    handleReAnalyze,
    handleAccept,
    handleSendToStaff,
  } = useAiReview({
    navigation,
    serviceRequest,
    initialAnalysis,
  });

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <AIReviewHeader onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        <AIReviewIntroCard />

        <ServiceRequestCard serviceRequest={serviceRequest} />

        <ComplexityAndCostCard
          complexityLevel={complexityLevel}
          complexityLabel={complexityLabel}
          badgeColor={badgeColor}
          estimatedAmount={estimatedAmount}
          currency={currency}
        />

        <AnalysisDetailsCard title="Nhận xét của AI" value={analysis.suggestions || ''} />
        <AnalysisDetailsCard title="Mô tả bổ sung" value={analysis.contextDescription || ''} />
        <AnalysisDetailsCard
          title="Gợi ý điều phối"
          value={analysis.dispatchRules
            ? `Skill: ${analysis.dispatchRules.requiredSkillLevel ?? '-'} | Kinh nghiệm: ${analysis.dispatchRules.minExperienceYears ?? '-'} năm\nChứng chỉ: ${analysis.dispatchRules.requiresCertification ? 'Có' : 'Không'} | Senior: ${analysis.dispatchRules.requiresSeniorTechnician ? 'Có' : 'Không'}`
            : ''}
        />

        <ActionGuide />

        <AIReviewActions
          reanalyzing={reanalyzing}
          onAccept={handleAccept}
          onReAnalyze={handleReAnalyze}
          onOpenStaffModal={() => setStaffModalVisible(true)}
        />
      </ScrollView>

      <StaffReviewModal
        visible={staffModalVisible}
        note={staffNote}
        sending={sendingToStaff}
        onClose={() => setStaffModalVisible(false)}
        onChangeNote={setStaffNote}
        onSubmit={handleSendToStaff}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
