import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStaffRequestDetail } from '../../features/staff/request-detail/model/useStaffRequestDetail';
import { styles } from './staff-request-detail/styles';
import { RequestInfoCard } from './staff-request-detail/ui/RequestInfoCard';
import { MatchingResultsCard } from './staff-request-detail/ui/MatchingResultsCard';
import { AttachmentsCard } from './staff-request-detail/ui/AttachmentsCard';
import { ApprovalCard } from './staff-request-detail/ui/ApprovalCard';
import { AgentPickerModal } from './staff-request-detail/ui/AgentPickerModal';
import { ComplexityModal } from './staff-request-detail/ui/ComplexityModal';

export const StaffRequestDetailScreen: React.FC<{
  navigation: any;
  route: any;
}> = ({ navigation, route }) => {
  const { requestId } = route.params as { requestId: string };

  const {
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
    isPendingReview,
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
  } = useStaffRequestDetail({
    requestId,
    onApproved: () => navigation.goBack(),
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Đang tải chi tiết yêu cầu...</Text>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>Không tìm thấy yêu cầu</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <LinearGradient colors={['#1976D2', '#63a4ff']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết yêu cầu</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusMeta.color }]}>
            <Text style={styles.statusText}>{statusMeta.label}</Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <RequestInfoCard request={request} />
          <MatchingResultsCard
            sortedMatches={sortedMatches}
            agents={agents}
            selectedAgentId={selectedAgentId}
            isPendingReview={isPendingReview}
            onSelectMatch={handleSelectFromMatch}
          />
          <AttachmentsCard attachments={request.attachments ?? []} />
          <ApprovalCard
            isPendingReview={isPendingReview}
            selectedAgent={selectedAgent}
            estimatedAmount={estimatedAmount}
            submitting={submitting}
            onOpenAgentPicker={() => setAgentPickerVisible(true)}
            onChangeEstimatedAmount={setEstimatedAmount}
            onOpenComplexityModal={() => setComplexityModalVisible(true)}
            onApprove={handleApprove}
          />
        </View>
      </ScrollView>

      <AgentPickerModal
        visible={agentPickerVisible}
        agents={agents}
        selectedAgentId={selectedAgentId}
        onClose={() => setAgentPickerVisible(false)}
        onSelectAgent={agentId => {
          setSelectedAgentId(agentId);
          setAgentPickerVisible(false);
        }}
      />

      <ComplexityModal
        visible={complexityModalVisible}
        selectedLevel={selectedLevel}
        submitting={submitting}
        onClose={() => setComplexityModalVisible(false)}
        onSelectLevel={setSelectedLevel}
        onSubmit={handleEvaluateComplexity}
      />
    </>
  );
};
