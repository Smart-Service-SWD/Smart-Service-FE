import React from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRequestDetail } from '../../features/user/request-detail/model/useRequestDetail';
import { styles } from './request-detail/styles';
import { RequestDetailHeader } from './request-detail/ui/RequestDetailHeader';
import { RequestStatusAndProgressCard } from './request-detail/ui/RequestStatusAndProgressCard';
import { RequestInfoCard } from './request-detail/ui/RequestInfoCard';
import { AiSummaryCard } from './request-detail/ui/AiSummaryCard';
import { MatchingProvidersCard } from './request-detail/ui/MatchingProvidersCard';
import { AttachmentsCard } from './request-detail/ui/AttachmentsCard';
import { CompletedFeedbackButton } from './request-detail/ui/CompletedFeedbackButton';

interface Props {
  navigation: any;
  route: { params: { requestId: string } };
}

export const RequestDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { requestId } = route.params;
  const {
    request,
    loading,
    refreshing,
    onRefresh,
    loadRequest,
    statusColor,
    statusLabel,
    complexityLevel,
    complexityLabel,
    currentStep,
    isCancelled,
    isCompleted,
  } = useRequestDetail(requestId);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Không tìm thấy yêu cầu</Text>
        <TouchableOpacity onPress={loadRequest} style={styles.retryBtn}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RequestDetailHeader
        statusColor={statusColor}
        onBack={() => navigation.goBack()}
        onRefresh={onRefresh}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <RequestStatusAndProgressCard
          statusColor={statusColor}
          statusLabel={statusLabel}
          currentStep={currentStep}
          isCancelled={isCancelled}
        />

        <RequestInfoCard request={request} />

        <AiSummaryCard
          request={request}
          complexityLevel={complexityLevel}
          complexityLabel={complexityLabel}
        />

        <MatchingProvidersCard matchingResults={request.matchingResults} />

        <AttachmentsCard attachments={request.attachments} />

        {isCompleted ? (
          <CompletedFeedbackButton
            onPress={() => navigation.navigate('Feedback', { serviceRequestId: request.id })}
          />
        ) : null}
      </ScrollView>
    </View>
  );
};
